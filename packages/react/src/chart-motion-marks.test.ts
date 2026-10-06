// @vitest-environment jsdom
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { expect, test } from 'vitest'

import { BarChart, LineChart } from './components.js'

const markup = (category: string, value: number): HTMLElement => {
  const host = document.createElement('div')
  const series = [{ id: 'tasks', label: 'Tasks', data: [{ id: 'stable', x: category, y: value }] }]

  host.innerHTML = renderToStaticMarkup(createElement('div', null, createElement(BarChart, { series }), createElement(LineChart, { series, area: true })))

  return host
}

test('bar and area identities survive value and category updates without annotating hit targets', () => {
  const first = markup('Monday', 10)
  const next = markup('Tuesday', 30)

  for (const selector of ['.ui-bar-chart__marks rect', '.ui-line-chart__area']) {
    const before = first.querySelector(selector)
    const after = next.querySelector(selector)

    expect(before?.getAttribute('data-ui-chart-motion-key')).toBeTruthy()
    expect(after?.getAttribute('data-ui-chart-motion-key')).toBe(before?.getAttribute('data-ui-chart-motion-key'))
  }
  expect(next.textContent).toContain('30')
  expect(next.querySelector('.ui-bar-chart__marks rect')?.getAttribute('data-ui-chart-motion-key')).toBe('["tasks","stable"]')
})

test('animated area paths keep missing-data segments separate', () => {
  const host = document.createElement('div')
  const series = [{ id: 'gaps', label: 'Gaps', data: [{ x: 0, y: 10 }, { x: 1, y: null }, { x: 2, y: 30 }] }]

  host.innerHTML = renderToStaticMarkup(createElement(LineChart, { series, area: true }))
  const area = host.querySelector('.ui-line-chart__area')

  expect(area?.getAttribute('d')?.match(/M/g)).toHaveLength(2)
  expect(area?.getAttribute('data-ui-chart-motion-key')).toBe('["area","gaps"]')
})
