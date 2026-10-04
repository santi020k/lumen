// @vitest-environment jsdom
import { act, createElement, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { Badge, DataTable, type DataTableProps, type DataTableSort, DataTableSortControls } from './index.js'

let container: HTMLDivElement
let root: Root
const columns = [
  { key: 'name', header: 'Client', sortable: true, wide: true },
  { key: 'count',
    header: 'Amount',
    sortable: true,
    sort: 'number' as const,
    render: (cell: unknown) => createElement(Badge, {}, typeof cell === 'number' ? `COP ${cell}` : 'Unavailable') }
]
const rows = [{ id: 'beta', name: 'Beta', count: 2 }, { id: 'alpha', name: 'Alpha', count: 10 }]
const run = async (action: () => void) => act(async () => {
  await Promise.resolve()
  action()
})
const render = (props: DataTableProps = {}) => run(() => {
  root.render(createElement(DataTable, { columns, rows, layout: 'records', renderDetails: row => `Notes for ${typeof row.name === 'string' ? row.name : ''}`, ...props }))
})
const element = (selector: string): HTMLElement => {
  const value = container.querySelector(selector)

  if (!(value instanceof HTMLElement)) throw new Error(`Missing ${selector}`)

  return value
}
const click = (selector: string) => run(() => {
  element(selector).click()
})

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await run(() => {
    root.unmount()
  })
  container.remove()
  vi.unstubAllGlobals()
})

test('rich cells retain numeric sorting and mobile labels while details follow their record', async () => {
  await render()
  expect(element('[data-value="beta"] .ui-badge').textContent).toBe('COP 2')
  expect(element('[data-value="beta"] .ui-table__label').textContent).toBe('Client')
  expect(element('[data-value="beta"] .ui-table__label').getAttribute('aria-hidden')).toBe('true')
  await click('[data-value="beta"] button')
  const button = element('[data-value="beta"] button')

  expect(button.getAttribute('aria-expanded')).toBe('true')
  expect(element('[data-ui-datatable-detail] section').id).toBe(button.getAttribute('aria-controls'))
  expect(element('[data-ui-datatable-detail]').textContent).toBe('Notes for Beta')
  await click('thead th:nth-child(2) button')
  await click('thead th:nth-child(2) button')
  expect([...container.querySelectorAll('tbody tr')].map(row => row.getAttribute('data-value'))).toEqual(['alpha', 'beta', null])
  expect(rows.map(row => row.id)).toEqual(['beta', 'alpha'])
  await click('[data-value="beta"] button')
  expect(container.querySelector('[data-ui-datatable-detail]')).toBeNull()
})

test('controlled expansion waits for the application and survives page refreshes', async () => {
  const onExpandedRowIdsChange = vi.fn()

  await render({ expandedRowIds: [], onExpandedRowIdsChange })
  await click('[data-value="beta"] button')
  expect(onExpandedRowIdsChange).toHaveBeenCalledExactlyOnceWith(['beta'])
  expect(container.querySelector('[data-ui-datatable-detail]')).toBeNull()
  await render({ expandedRowIds: ['beta'], onExpandedRowIdsChange })
  expect(element('[data-ui-datatable-detail]').textContent).toBe('Notes for Beta')
  await render({ expandedRowIds: ['beta'], rows: [rows[1]].filter(row => row !== undefined), onExpandedRowIdsChange })
  expect(container.querySelector('[data-ui-datatable-detail]')).toBeNull()
  expect(onExpandedRowIdsChange).toHaveBeenCalledTimes(1)
})

test('toolbar sort requests the same server ordering without reordering a supplied page', async () => {
  const requests = vi.fn()
  const Example = () => {
    const [sort, setSort] = useState<DataTableSort | null>(null)
    const onSortChange = (next: DataTableSort | null) => {
      requests(next)
      setSort(next)
    }

    return createElement('div', {}, createElement(DataTableSortControls, { columns, sort, onSortChange }), createElement(DataTable, { columns, rows, sort, sortMode: 'manual' }))
  }

  await run(() => {
    root.render(createElement(Example))
  })
  await run(() => {
    const select = container.querySelector('select')

    if (!(select instanceof HTMLSelectElement)) throw new Error('Missing sort select')

    select.value = 'count'
    select.dispatchEvent(new Event('change', { bubbles: true }))
  })
  expect(requests).toHaveBeenLastCalledWith({ key: 'count', direction: 'ascending' })
  await click('.ui-data-table__sort-controls button')
  expect(requests).toHaveBeenLastCalledWith({ key: 'count', direction: 'descending' })
  expect(element('thead th:nth-child(2)').getAttribute('aria-sort')).toBe('descending')
  await run(() => {
    const select = container.querySelector('select')

    if (!(select instanceof HTMLSelectElement)) throw new Error('Missing sort select')

    select.value = ''
    select.dispatchEvent(new Event('change', { bubbles: true }))
  })
  expect(requests).toHaveBeenLastCalledWith(null)
  expect(element('thead th:nth-child(2)').getAttribute('aria-sort')).toBe('none')
  expect([...container.querySelectorAll('tbody tr')].map(row => row.getAttribute('data-value'))).toEqual(['beta', 'alpha'])
})
