import { afterEach, beforeAll, expect, test, vi } from 'vitest'

import { defineLumenElements, LumenBulletChartElement } from './define.js'

beforeAll(() => {
  defineLumenElements()
})
afterEach(() => {
  document.body.replaceChildren()
})

const chart = (name: string, attributes: Record<string, string>) => {
  const element = document.createElement(name)
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value)
  document.body.append(element)
  return element
}

test('continuous coordinates agree across sparse series and keyboard requests survive reconnection', () => {
  const element = chart('lumen-line-chart', {
    interactive: '',
    'x-scale': 'linear',
    series: JSON.stringify([
      { id: 'a', label: 'A', data: [{ x: 0, y: 2 }, { x: 100, y: 9 }] },
      { id: 'b', label: 'B', data: [{ x: 10, y: 5 }] }
    ])
  })
  const positions = [...element.querySelectorAll<HTMLElement>('[data-ui-chart-point]')].map(point => Number(point.dataset.uiChartPosition))
  expect(((positions[1] ?? 0) - (positions[0] ?? 0)) / ((positions[2] ?? 0) - (positions[0] ?? 0))).toBeCloseTo(0.1)
  const listener = vi.fn()
  element.addEventListener('ui:chart-cursor-change', listener)
  element.remove()
  document.body.append(element)
  element.querySelector('[data-ui-chart-interaction-plot]')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
  expect(listener).toHaveBeenCalledOnce()
})

test('new chart attributes fail safely and escape supplied labels', () => {
  const histogram = chart('lumen-histogram', { bins: '[{"start":0,"end":10,"count":-2}]' })
  expect(histogram.querySelector('[role="status"]')?.textContent).toContain('invalid')
  histogram.setAttribute('bins', JSON.stringify([{ start: 0, end: 10, count: 2, label: '<img src=x onerror=alert(1)>' }]))
  expect(histogram.querySelector('img')).toBeNull()
  expect(histogram.querySelector('table')?.textContent).toContain('<img')
  const waterfall = chart('lumen-waterfall-chart', { data: '{broken' })
  expect(waterfall.querySelector('[role="status"]')?.textContent).toContain('invalid')
})

test('bullet properties and attributes update exact data without interpreting supplied HTML', () => {
  const element = new LumenBulletChartElement()
  element.target = 95
  element.value = 86
  element.ranges = [{ end: 100, label: '<img src=x onerror=alert(1)>' }]
  element.valueFormatter = value => `${value}%`
  document.body.append(element)
  expect(element.querySelector('img')).toBeNull()
  expect(element.querySelector('tbody tr:last-child')?.textContent).toBe('<img src=x onerror=alert(1)>0%–100%')
  element.setAttribute('target-label', 'Meta')
  expect(element.querySelector('.ui-bullet-chart__values')?.textContent).toContain('Meta95%')
  element.value = null
  expect(element.querySelector('.ui-bullet-chart__bar')).toBeNull()
  expect(element.querySelector('tbody tr')?.textContent).toContain('Not available')
  element.value = 0
  expect(element.querySelector('tbody tr')?.textContent).toBe('Value0%')
  element.setAttribute('domain-min', '50')
  element.setAttribute('domain-max', '100')
  expect(element.querySelector('[role="status"]')?.textContent).toContain('invalid')
  expect(element.querySelector('.ui-bullet-chart__plot')).toBeNull()
})

test('bullet attributes reject invalid targets and malformed ranges instead of clipping or dropping them', () => {
  const element = chart('lumen-bullet-chart', { value: '86', target: '95', ranges: '[{"end":100,"label":"Strong"}]' })
  expect(element.querySelector('.ui-bullet-chart__target')).not.toBeNull()
  for (const invalid of ['{broken', '[null]', '[{"end":100,"label":"Strong","tone":"url(x)"}]', '[{"end":70,"label":"A"},{"end":70,"label":"B"}]']) {
    element.setAttribute('ranges', invalid)
    expect(element.querySelector('[role="status"]')?.textContent).toContain('invalid')
  }
  element.setAttribute('ranges', '[]')
  element.setAttribute('target', '')
  expect(element.querySelector('[role="status"]')?.textContent).toContain('invalid')
})

test('comparison charts retain paired values, zero, missing observations and safe labels', () => {
  const element = chart('lumen-dumbbell-chart', { data: JSON.stringify([{ id: 'a', label: '<img src=x>', value: 0, reference: 80 }, { id: 'b', label: 'B', value: null, reference: 60 }]) })
  expect(element.querySelector('img')).toBeNull()
  expect(element.querySelectorAll('.ui-comparison-chart__dot')).toHaveLength(1)
  expect(element.querySelectorAll('.ui-comparison-chart__reference')).toHaveLength(2)
  expect(element.querySelector('tbody')?.textContent).toContain('Not available')
  element.setAttribute('reference-label', 'Previous')
  expect(element.querySelector('thead')?.textContent).toContain('Previous')
  element.setAttribute('data', 'invalid')
  expect(element.querySelector('[role="status"]')?.textContent).toContain('invalid')
  expect(element.querySelector('table')).toBeNull()
})
