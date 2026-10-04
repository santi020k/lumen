// @vitest-environment jsdom
import { afterEach, describe, expect, test } from 'vitest'

import { defineLumenElements, LumenScatterChartElement } from './index.js'

defineLumenElements()
afterEach(() => {
  document.body.replaceChildren()
})

describe('dashboard adapter contracts', () => {
  test('requests server sorting without changing row order', () => {
    document.body.innerHTML = `<lumen-data-table sort-mode="manual"><table>
      <thead><tr><th data-ui-datatable-sortable="true" data-ui-datatable-sort-key="name">Name</th></tr></thead>
      <tbody><tr><td>Beta</td></tr><tr><td>Alpha</td></tr></tbody>
    </table></lumen-data-table>`
    const root = document.querySelector('lumen-data-table')
    const events: unknown[] = []

    root?.addEventListener('ui:data-table-sort-change', event => {
      if (event instanceof CustomEvent) {
        const detail: unknown = event.detail

        events.push(detail)
      }
    })
    document.querySelector<HTMLButtonElement>('th button')?.click()
    expect([...document.querySelectorAll('tbody tr')].map(row => row.textContent)).toEqual(['Beta', 'Alpha'])
    expect(events).toEqual([{ key: 'name', columnIndex: 0, direction: 'ascending' }])
    expect(document.querySelector('th')?.getAttribute('aria-sort')).toBe('ascending')
  })
  test('advances an authored sort state without relying on stale root metadata', () => {
    document.body.innerHTML = `<lumen-data-table sort-mode="manual"><table>
      <thead><tr><th aria-sort="ascending" data-ui-datatable-sortable="true">Name</th></tr></thead>
      <tbody><tr><td>Alpha</td></tr><tr><td>Beta</td></tr></tbody>
    </table></lumen-data-table>`
    document.querySelector<HTMLButtonElement>('th button')?.click()
    expect(document.querySelector('th')?.getAttribute('aria-sort')).toBe('descending')
    expect([...document.querySelectorAll('tbody tr')].map(row => row.textContent)).toEqual(['Alpha', 'Beta'])
  })
  test('uses log geometry with independent accessible value labels and references', () => {
    const chart = new LumenScatterChartElement()

    chart.setAttribute('x-scale', 'log')
    chart.setAttribute('x-min', '1')
    chart.setAttribute('x-max', '100')
    chart.categoryFormatter = value => `Reach ${value}`
    chart.valueFormatter = value => `${value}%`
    chart.references = [{ id: 'reach', label: 'Reach threshold', x: 10 }]
    chart.series = [{ id: 'growth', label: 'Growth', data: [{ x: 10, y: 5 }] }]
    document.body.append(chart)
    expect(chart.querySelector('circle')?.getAttribute('cx')).toBe('320')
    expect(chart.querySelector('tbody th')?.textContent).toBe('Reach 10')
    expect(chart.querySelector('tbody td:nth-child(3)')?.textContent).toBe('5%')
    expect(chart.querySelector('.ui-scatter-chart__reference-labels')?.textContent).toBe('Reach threshold')
    expect(chart.querySelector('line')?.getAttribute('x1')).toBe('320')
  })
})
