// @vitest-environment jsdom
import { afterEach, expect, test } from 'vitest'

import { initDataTableSorting } from './runtime/controllers/data-table.js'

const tableFixture = (markup: string) => {
  const root = document.createElement('div')

  root.innerHTML = markup
  document.body.append(root)
  const table = root.querySelector('table')

  if (!table) throw new Error('Missing table fixture')

  return { root, table }
}
const labels = (table: HTMLTableElement) => [...table.querySelectorAll('tbody tr')].map(row => row.textContent)
const control = (table: HTMLTableElement) => {
  const button = table.querySelector('th button')

  if (!(button instanceof HTMLButtonElement)) throw new Error('Missing sort control')

  return button
}

afterEach(() => {
  document.body.replaceChildren()
})

test('cycles numeric sorting, preserves equal records, and restores original order', () => {
  const { root, table } = tableFixture(`<table>
    <thead><tr><th data-sortable data-ui-datatable-sort-type="number">Balance</th></tr></thead>
    <tbody><tr><td data-sort-value="1,000">First</td></tr><tr><td data-sort-value="0">Zero</td></tr><tr><td data-sort-value="1,000">Second</td></tr></tbody>
  </table>`)

  initDataTableSorting(root, table)
  control(table).click()
  expect(labels(table)).toEqual(['Zero', 'First', 'Second'])
  control(table).click()
  expect(labels(table)).toEqual(['First', 'Second', 'Zero'])
  control(table).click()
  expect(labels(table)).toEqual(['First', 'Zero', 'Second'])
  expect(table.querySelector('th')?.getAttribute('aria-sort')).toBe('none')
})

test('requests manual sorting from the authored header state without moving rows or rebinding', () => {
  const { root, table } = tableFixture(`<table>
    <thead><tr><th aria-sort="ascending" data-sortable data-ui-datatable-sort-key="name">Name</th></tr></thead>
    <tbody><tr><td>Beta</td></tr><tr><td>Alpha</td></tr></tbody>
  </table>`)

  root.dataset.uiDatatableSortMode = 'manual'
  root.dataset.uiDatatableSortColumn = 'other'
  const events: unknown[] = []

  root.addEventListener('ui:data-table-sort-change', event => {
    if (event instanceof CustomEvent) {
      const detail: unknown = event.detail

      events.push(detail)
    }
  })
  initDataTableSorting(root, table)
  initDataTableSorting(root, table)
  control(table).click()
  expect(events).toEqual([{ key: 'name', columnIndex: 0, direction: 'descending' }])
  expect(labels(table)).toEqual(['Beta', 'Alpha'])
  expect(table.querySelector('th')?.getAttribute('aria-sort')).toBe('descending')
})
