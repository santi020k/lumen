import { afterEach, beforeAll, expect, test, vi } from 'vitest'

import { defineLumenElements, LumenBoxPlotElement, LumenBulletChartElement, LumenCalendarHeatmapElement, LumenFunnelChartElement } from './define.js'

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

test.each(['lumen-lollipop-chart', 'lumen-dumbbell-chart'])('%s honors escaped labels and summaries across updates', name => {
  const element = chart(name, { data: JSON.stringify([{ id: 'a', label: 'A', value: 20, reference: 10 }]) })
  expect(element.querySelector('.ui-comparison-chart__legend')?.textContent).toContain('Value')
  for (const label of ['Revenue', '<img src=x>']) {
    element.setAttribute('value-label', label)
    element.setAttribute('summary', `${label} interpretation`)
    expect(element.querySelector('.ui-comparison-chart__legend')?.textContent).toContain(label)
    expect(element.querySelector('thead th:last-child')?.textContent).toBe(label)
    expect(element.querySelector('[data-ui-chart-summary]')?.textContent).toBe(`${label} interpretation`)
    expect(element.querySelector('img')).toBeNull()
  }
  element.setAttribute('show-table', 'false')
  expect(element.querySelector('table')).toBeNull()
  expect(element.querySelector('[data-ui-chart-summary]')?.textContent).toBe('<img src=x> interpretation')
  element.removeAttribute('value-label')
  element.removeAttribute('summary')
  expect(element.querySelector('.ui-comparison-chart__legend')?.textContent).toContain('Value')
  expect(element.querySelector('[data-ui-chart-summary]')?.textContent).not.toContain('interpretation')
})

test('calendar custom element exposes UTC dates, zero, localized weekdays and missing measurements', () => {
  const element = chart('lumen-calendar-heatmap', {
    'start-date': '2026-01-04',
    'end-date': '2026-01-06',
    'week-starts-on': '1',
    'weekday-labels': JSON.stringify(['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']),
    data: JSON.stringify([{ date: '2026-01-04', value: 0 }, { date: '2026-01-06', value: 4 }])
  })
  expect(element.querySelector('svg text')?.textContent).toBe('Lu')
  expect(element.querySelector('rect')?.getAttribute('y')).toBe('112')
  expect(element.querySelectorAll('[data-missing]')).toHaveLength(1)
  expect(element.querySelector('tbody tr')?.textContent).toBe('2026-01-040')
  element.setAttribute('show-table', 'false')
  expect(element.querySelector('table')).toBeNull()
  expect(element.querySelector('ul.ui-sr-only')?.textContent).toContain('2026-01-04: 0')
  expect(element.querySelector('ul.ui-sr-only')?.textContent).toContain('2026-01-05: Not available')
  element.setAttribute('week-starts-on', '2')
  expect(element.querySelector('[role="status"]')?.textContent).toContain('invalid')
  element.setAttribute('week-starts-on', '0')
  element.setAttribute('data', '[{"date":"2026-02-30","value":2}]')
  expect(element.querySelector('[role="status"]')?.textContent).toContain('invalid')
})

test('funnel custom element keeps stage order and fails safely for negative and malformed observations', () => {
  const element = chart('lumen-funnel-chart', { data: JSON.stringify([
    { id: 'a', label: '<img src=x>', value: 0 }, { id: 'b', label: 'B', value: 20 }, { id: 'c', label: 'C', value: null }
  ]) })
  expect(element.querySelector('img')).toBeNull()
  expect(element.querySelectorAll('.ui-funnel-chart__bar')).toHaveLength(2)
  expect(element.querySelector('tbody tr')?.textContent).toBe('<img src=x>0')
  expect(element.querySelector('tbody tr:last-child')?.textContent).toBe('CNot available')
  for (const source of ['{broken', '[null]', '[{"id":"a","label":"A","value":-1}]', '[{"id":"a","label":"A","value":2,"tone":"url(x)"}]']) {
    element.setAttribute('data', source)
    expect(element.querySelector('[role="status"]')?.textContent).toContain('invalid')
    expect(element.querySelector('table')).toBeNull()
  }
})

test('box custom element presents exact statistics, nullable rows, localized outliers and validated domains', () => {
  const element = chart('lumen-box-plot', { 'median-label': 'Middle',
    'outliers-label': 'Extremes',
    data: JSON.stringify([
      { id: 'a', label: 'A', min: -5, q1: 0, median: 0, q3: 5, max: 10, outliers: [-10, 20] },
      { id: 'b', label: 'B', min: null, q1: null, median: null, q3: null, max: null }
    ]) })
  expect(element.querySelectorAll('.ui-box-plot__outlier')).toHaveLength(2)
  expect(element.querySelector('thead')?.textContent).toContain('Middle')
  expect(element.querySelector('tbody tr:last-child')?.textContent).toContain('Not available')
  element.setAttribute('show-table', 'false')
  expect(element.querySelector('table')).toBeNull()
  element.setAttribute('summary', 'Application interpretation')
  expect(element.querySelector('[data-ui-chart-summary]')?.textContent).toBe('Application interpretation')
  expect(element.querySelector('ul.ui-sr-only')?.textContent).toContain('Extremes: -10, 20')
  expect(element.querySelector('ul.ui-sr-only')?.textContent).toContain('First quartile: 0')
  element.setAttribute('domain-min', '-5')
  element.setAttribute('domain-max', '10')
  expect(element.querySelector('[role="status"]')?.textContent).toContain('invalid')
})

test('expanded chart typed properties update connected hosts and survive reconnection', () => {
  const calendar = new LumenCalendarHeatmapElement()
  calendar.startDate = '2026-01-01'
  calendar.endDate = '2026-01-02'
  calendar.weekStartsOn = 1
  calendar.data = [{ date: '2026-01-01', value: 0 }]
  calendar.dateFormatter = date => `Day ${date}`
  calendar.valueFormatter = value => `${value}%`
  calendar.labels = { notAvailable: 'Missing' }
  document.body.append(calendar)
  expect(calendar.querySelector('tbody tr')?.textContent).toBe('Day 2026-01-010%')
  expect(calendar.querySelector('tbody tr:last-child')?.textContent).toContain('Missing')
  calendar.remove()
  document.body.append(calendar)
  expect(calendar.querySelectorAll('rect')).toHaveLength(2)
  const funnel = new LumenFunnelChartElement()
  funnel.data = [{ id: 'a', label: 'First', value: 50 }]
  document.body.append(funnel)
  funnel.data = [{ id: 'b', label: 'Updated', value: 0 }]
  expect(funnel.querySelector('tbody tr')?.textContent).toBe('Updated0')
  const box = new LumenBoxPlotElement()
  box.data = [{ id: 'a', label: 'A', min: 0, q1: 1, median: 2, q3: 3, max: 4 }]
  document.body.append(box)
  box.statisticLabels = { median: '<img src=x>' }
  expect(box.querySelector('img')).toBeNull()
  expect(box.querySelector('thead')?.textContent).toContain('<img src=x>')
})
