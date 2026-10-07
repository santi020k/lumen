// @vitest-environment jsdom
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { describe, expect, test } from 'vitest'

import { BoxPlot, CalendarHeatmap, FunnelChart } from './expanded-charts.js'

const render = (markup: string): HTMLElement => {
  const host = document.createElement('div')
  host.innerHTML = markup
  return host
}
describe('expanded React charts', () => {
  test('calendar distinguishes missing dates from zero and retains Sunday-index weekday labels for Monday weeks', () => {
    const host = render(renderToStaticMarkup(createElement(CalendarHeatmap, {
      startDate: '2026-01-04',
      endDate: '2026-01-06',
      weekStartsOn: 1,
      data: [{ date: '2026-01-04', value: 0 }, { date: '2026-01-06', value: 4 }],
      weekdayLabels: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
      formatDate: date => `Date ${date}`,
      formatValue: value => `${value} visits`
    })))
    expect(host.querySelector('svg text')?.textContent).toBe('Lu')
    expect(host.querySelectorAll('[data-missing]')).toHaveLength(1)
    expect(host.querySelector('tbody tr')?.textContent).toBe('Date 2026-01-040 visits')
    expect(host.querySelectorAll('tbody tr')[1]?.textContent).toContain('Not available')
    expect(host.querySelector('rect')?.getAttribute('y')).toBe('112')
  })
  test('calendar retains exact dates for assistive technology when its table is hidden', () => {
    const host = render(renderToStaticMarkup(createElement(CalendarHeatmap, {
      startDate: '2026-01-01',
      endDate: '2026-01-02',
      showTable: false,
      data: [{ date: '2026-01-01', value: 0 }]
    })))
    expect(host.querySelector('table')).toBeNull()
    expect(host.querySelector('ul.ui-sr-only')?.textContent).toContain('2026-01-01: 0')
    expect(host.querySelector('ul.ui-sr-only')?.textContent).toContain('2026-01-02: Not available')
    expect(host.querySelector('svg')?.getAttribute('width')).toBe('54')
  })
  test('funnel preserves ordered increasing stages, exact zero and unavailable values without unsafe labels', () => {
    const host = render(renderToStaticMarkup(createElement(FunnelChart, {
      data: [{ id: 'a', label: '<img src=x>', value: 0 }, { id: 'b', label: 'B', value: 20 }, { id: 'c', label: 'C', value: null }]
    })))
    expect(host.querySelector('img')).toBeNull()
    expect(host.querySelectorAll('.ui-funnel-chart__bar')).toHaveLength(2)
    expect(host.querySelector('.ui-funnel-chart__bar')?.getAttribute('style')).toBe('width:0%')
    expect(host.querySelector('tbody tr')?.textContent).toBe('<img src=x>0')
    expect(host.querySelector('tbody tr:last-child')?.textContent).toBe('CNot available')
  })
  test('box plot exposes precomputed statistics and outliers even when its table is hidden', () => {
    const host = render(renderToStaticMarkup(createElement(BoxPlot, {
      data: [{ id: 'a', label: 'Group', min: -5, q1: 0, median: 0, q3: 5, max: 10, outliers: [-10, 20] }],
      showTable: false,
      summary: 'Application interpretation',
      statisticLabels: { median: 'Middle', outliers: 'Extremes' },
      formatValue: value => `${value}%`
    })))
    expect(host.querySelector('table')).toBeNull()
    expect(host.querySelectorAll('.ui-box-plot__outlier')).toHaveLength(2)
    expect(host.querySelector('[data-ui-chart-summary]')?.textContent).toBe('Application interpretation')
    expect(host.querySelector('ul.ui-sr-only')?.textContent).toContain('Middle: 0%')
    expect(host.querySelector('ul.ui-sr-only')?.textContent).toContain('Extremes: -10%, 20%')
  })
  test('invalid datasets fail closed before invoking finite-only formatters', () => {
    const formatValue = (value: number) => {
      if (!Number.isFinite(value)) throw new Error('Non-finite formatter input')
      return String(value)
    }
    const funnel = render(renderToStaticMarkup(createElement(FunnelChart, { data: [{ id: 'a', label: 'A', value: -1 }], formatValue })))
    const box = render(renderToStaticMarkup(createElement(BoxPlot, { data: [{ id: 'a', label: 'A', min: 0, q1: 10, median: 5, q3: 15, max: 20 }], formatValue })))
    const calendar = render(renderToStaticMarkup(createElement(CalendarHeatmap, { startDate: '2026-02-30', endDate: '2026-03-01', data: [], formatValue })))
    for (const host of [funnel, box, calendar]) {
      expect(host.querySelector('[role="status"]')?.textContent).toContain('invalid')
      expect(host.querySelector('table')).toBeNull()
    }
  })
})
