import { afterEach, beforeAll, expect, test, vi } from 'vitest'

import { defineLumenElements } from './define.js'

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
