// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import type { LumenChartDatumActivationDetail, LumenChartSeries } from '@santi020k/lumen-core'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { BarChart, ComboChart, Heatmap, LineChart, PieChart, RangeChart, ScatterChart } from './components.js'

type Activate = (detail: LumenChartDatumActivationDetail) => void
type ChartFactory = (onDatumActivate?: Activate) => ReactNode
const series: readonly LumenChartSeries[] = [{ id: 'received',
  label: 'Cobros',
  data: [
    { id: 'zero', x: 'October', y: 0 },
    { id: 'positive', x: 'November', y: 20 },
    { id: 'negative', x: 'December', y: -5 },
    { id: 'missing', x: 'January', y: null },
    { id: 'infinite', x: 'February', y: Infinity }
  ] }]
const options = (onDatumActivate?: Activate) => ({
  ...(onDatumActivate ? { onDatumActivate } : {}),
  showTable: false,
  labels: { exploreData: 'Explorar datos', formatDatumAction: (context: string) => `Abrir detalles: ${context}` }
})
const factories: readonly { name: string, count: number, render: ChartFactory }[] = [
  { name: 'Bar', count: 3, render: callback => createElement(BarChart, { ...options(callback), series }) },
  { name: 'Line', count: 3, render: callback => createElement(LineChart, { ...options(callback), series, markers: 'none' }) },
  { name: 'Pie', count: 1, render: callback => createElement(PieChart, { ...options(callback), series: { id: 'received', label: 'Cobros', data: series[0]?.data ?? [] } }) },
  { name: 'Scatter', count: 3, render: callback => createElement(ScatterChart, { ...options(callback), series: [{ id: 'received', label: 'Cobros', data: series[0]?.data.map((datum, index) => ({ ...datum, x: index })) ?? [] }] }) },
  { name: 'Combo',
    count: 6,
    render: callback => createElement(ComboChart, { ...options(callback),
      series: [
        { id: 'received', label: 'Cobros', data: series[0]?.data ?? [], mark: 'bar' },
        { id: 'forecast', label: 'Proyección', data: series[0]?.data ?? [], mark: 'line' }
      ] }) },
  { name: 'Heatmap', count: 3, render: callback => createElement(Heatmap, { ...options(callback), data: series[0]?.data.map(datum => ({ ...(datum.id === undefined ? {} : { id: datum.id }), x: datum.x, y: 'Monday', value: datum.y })) ?? [] }) },
  { name: 'Range',
    count: 3,
    render: callback => createElement(RangeChart, { ...options(callback),
      data: [
        { id: 'zero', x: 'October', low: 0, high: 0 },
        { id: 'positive', x: 'November', low: 10, high: 20 },
        { id: 'negative', x: 'December', low: -5, high: -1 },
        { id: 'missing', x: 'January', low: null, high: 1 },
        { id: 'reversed', x: 'February', low: 20, high: 10 }
      ] }) }
]
let container: HTMLDivElement
let root: Root

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => {
    root.unmount()
  })
  container.remove()
  vi.unstubAllGlobals()
})
const render = (content: ReactNode) => {
  act(() => {
    root.render(content)
  })
}
const button = (): HTMLButtonElement => {
  const element = container.querySelector('button[data-ui-chart-datum]')
  if (!(element instanceof HTMLButtonElement)) throw new Error('No datum action button')
  return element
}
const mark = (): SVGElement => {
  const element = container.querySelector('svg [data-ui-chart-datum]')
  if (!(element instanceof SVGElement)) throw new Error('No plotted datum')
  return element
}

test.each(factories)('$name keeps equivalent actions with hidden tables and excludes unavailable values', scenario => {
  const events: LumenChartDatumActivationDetail[] = []
  render(scenario.render(detail => {
    events.push(detail)
  }))
  expect(container.querySelectorAll('[data-ui-chart-actions] button')).toHaveLength(scenario.count)
  expect(container.querySelector('summary')?.textContent).toBe('Explorar datos')
  expect(container.querySelector('.ui-chart__data')).toBeNull()
  expect(container.querySelectorAll('[data-ui-chart-datum*="missing"], [data-ui-chart-datum*="infinite"], [data-ui-chart-datum*="reversed"]')).toHaveLength(0)
  expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  expect(container.querySelector('figure')?.getAttribute('data-ui-chart-adapter')).toBe('react')
  act(() => {
    button().click()
  })
  act(() => {
    mark().dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  expect(events).toHaveLength(2)
  expect(events[0]).toEqual(events[1])
  expect(button().textContent).toContain('Abrir detalles:')
})

test.each(factories)('$name remains static without a callback', scenario => {
  render(scenario.render())
  expect(container.querySelector('[data-ui-chart-actions]')).toBeNull()
  expect(container.querySelector('[data-ui-chart-datum]')).toBeNull()
  expect(container.querySelector('[data-ui-chart-activation]')).toBeNull()
})

test('uses current values and callbacks after rerender while retaining focused action identity', () => {
  const first: LumenChartDatumActivationDetail[] = []
  const second: LumenChartDatumActivationDetail[] = []
  render(createElement(BarChart, { ...options(detail => {
    first.push(detail)
  }),
  series }))
  const before = button()
  before.focus()
  const replacement = series.map(item => ({ ...item, data: item.data.map(datum => ({ ...datum, y: datum.id === 'zero' ? 40 : datum.y })) }))
  render(createElement(BarChart, { ...options(detail => {
    second.push(detail)
  }),
  series: replacement }))
  expect(button()).toBe(before)
  expect(document.activeElement).toBe(before)
  act(() => {
    before.click()
  })
  expect(first).toEqual([])
  expect(second).toEqual([{ datumId: 'zero', kind: 'series', seriesId: 'received', x: 'October', y: 40 }])
  render(createElement(BarChart, { series: replacement }))
  before.click()
  expect(second).toHaveLength(1)
})

test('honors caller prevention, disabled controls and secondary activation', () => {
  const activate = vi.fn<Activate>()
  render(createElement(BarChart, { ...options(activate),
    series,
    onClick: event => {
      event.preventDefault()
    } }))
  act(() => {
    button().click()
  })
  expect(activate).not.toHaveBeenCalled()
  render(createElement(BarChart, { ...options(activate), series, 'aria-disabled': true }))
  act(() => {
    button().click()
  })
  expect(activate).not.toHaveBeenCalled()
  render(createElement(BarChart, { ...options(activate), series }))
  act(() => {
    button().dispatchEvent(new MouseEvent('click', { bubbles: true, button: 2 }))
  })
  expect(activate).not.toHaveBeenCalled()
  act(() => {
    button().click()
  })
  expect(activate).toHaveBeenCalledOnce()
})

test('isolates nested chart callbacks and preserves combo raw axis identities', () => {
  const outer = vi.fn<Activate>()
  const inner = vi.fn<Activate>()
  render(createElement(BarChart, {
    ...options(outer), series, caption: createElement(LineChart, { ...options(inner), series })
  }))
  const nested = container.querySelector('figcaption button')
  if (!(nested instanceof HTMLButtonElement)) throw new Error('Missing nested chart action')
  act(() => {
    nested.click()
  })
  expect(inner).toHaveBeenCalledOnce()
  expect(outer).not.toHaveBeenCalled()
  const events: LumenChartDatumActivationDetail[] = []
  render(factories.find(scenario => scenario.name === 'Combo')?.render(detail => {
    events.push(detail)
  }))
  const forecast = container.querySelector('svg .ui-chart__datum-hit[data-ui-chart-datum*="forecast"]')
  if (!(forecast instanceof SVGElement)) throw new Error('Missing combo point action')
  act(() => {
    forecast.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  expect(events).toEqual([{ datumId: 'zero', kind: 'series', seriesId: 'forecast', x: 'October', y: 0 }])
})

test('rejects malformed replacement attributes and does not activate after unmount', () => {
  const activate = vi.fn<Activate>()
  render(createElement(BarChart, { ...options(activate), series }))
  const target = button()
  target.setAttribute('data-ui-chart-datum', '{broken')
  act(() => {
    target.click()
  })
  expect(activate).not.toHaveBeenCalled()
  render(null)
  target.click()
  expect(activate).not.toHaveBeenCalled()
})

test('does not format unavailable heatmap measurements for datum actions', () => {
  const formatValue = vi.fn((value: number) => {
    if (!Number.isFinite(value)) throw new Error('Missing measurement reached formatter')
    return String(value)
  })
  const activate = vi.fn<Activate>()
  act(() => {
    root.render(createElement(Heatmap, {
      data: [{ x: 'A', y: 'Row', value: NaN }, { x: 'B', y: 'Row', value: Infinity }, { x: 'C', y: 'Row', value: null }, { x: 'D', y: 'Row', value: 0 }],
      formatValue,
      onDatumActivate: activate,
      showLegend: false
    }))
  })
  expect(formatValue.mock.calls.every(([value]) => Number.isFinite(value))).toBe(true)
  expect(container.querySelectorAll('rect[data-ui-chart-datum]')).toHaveLength(1)
  expect(container.querySelectorAll('button[data-ui-chart-datum]')).toHaveLength(1)
  expect(container.querySelector('rect[data-ui-chart-datum] title')?.textContent).toContain('0')
  expect(container.querySelector('tbody')?.textContent).toContain('Not available')
  act(() => {
    button().click()
  })
  expect(activate).toHaveBeenCalledWith(expect.objectContaining({ x: 'D', value: 0 }))
})
