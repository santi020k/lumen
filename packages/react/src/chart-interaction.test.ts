// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { LineChart } from './components.js'
import { Histogram, WaterfallChart } from './interval-charts.js'

let container: HTMLDivElement
let root: Root
const series = [{ id: 'a', label: 'A', data: [{ x: 0, y: 2 }, { x: 10, y: 4 }] }]
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

test('keeps a controlled cursor until its owner accepts the requested identity', () => {
  const onCursorChange = vi.fn()
  const props = { interactive: true, showLegend: true, series, cursor: 0, onCursorChange }
  act(() => {
    root.render(createElement(LineChart, props))
  })
  const plot = container.querySelector<HTMLElement>('[data-ui-chart-interaction-plot]')
  if (!plot) throw new Error('Expected chart plot')
  const toggle = container.querySelector<HTMLButtonElement>('[data-ui-chart-toggle]')
  act(() => {
    toggle?.click()
  })
  act(() => {
    plot.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
  })
  expect(onCursorChange).toHaveBeenCalledWith({ x: 10 })
  expect(container.querySelector('[data-ui-chart-point="0"]')?.hasAttribute('hidden')).toBe(false)
  expect(container.querySelector('[data-ui-chart-point="10"]')?.hasAttribute('hidden')).toBe(true)
  act(() => {
    root.render(createElement(LineChart, { ...props, cursor: 10 }))
  })
  expect(container.querySelector('[data-ui-chart-point="10"]')?.hasAttribute('hidden')).toBe(false)
  expect(toggle?.getAttribute('aria-pressed')).toBe('false')
})

test('renders histogram counts and waterfall balances in semantic tables', () => {
  act(() => {
    root.render(createElement(Histogram, {
      bins: [{ start: 0, end: 10, count: 20 }, { start: 10, end: 30, count: 20 }], frequency: 'density'
    }))
  })
  expect(container.querySelector('table')?.textContent).toContain('Frequency density')
  expect([...container.querySelectorAll('tbody tr')].map(row => row.textContent)).toEqual(['0–10010220', '10–301030120'])
  act(() => {
    root.render(createElement(WaterfallChart, {
      data: [{ id: 'a', label: 'Opening', kind: 'total', value: 10 }, { id: 'b', label: 'Spent', value: -15 }]
    }))
  })
  expect(container.querySelector('tbody tr:last-child')?.textContent).toBe('Spent10-5-15')
})
