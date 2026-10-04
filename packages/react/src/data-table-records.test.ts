// @vitest-environment jsdom
import { act, createElement, isValidElement, useState } from 'react'
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

test('expands records by explicit IDs even when ordinary value cells repeat', async () => {
  const records = [{ id: 'first', name: 'First', value: 100 }, { id: 'second', name: 'Second', value: 100 }]
  await render({ rows: records, expandedRowIds: ['first'] })
  expect(element('[data-value="first"] button').getAttribute('aria-expanded')).toBe('true')
  expect(element('[data-value="second"] button').getAttribute('aria-expanded')).toBe('false')
  expect(container.querySelectorAll('[data-ui-datatable-detail]')).toHaveLength(1)
  await render({ rows: records })
  await click('[data-value="second"] button')
  expect(element('[data-ui-datatable-detail]').textContent).toBe('Notes for Second')
  expect(container.querySelectorAll('[data-ui-datatable-detail]')).toHaveLength(1)
  await render({ rows: [{ ...records[0], rowValue: 'override' }], expandedRowIds: ['override'] })
  expect(element('[data-value="override"] button').getAttribute('aria-expanded')).toBe('true')
})

test.each([null, 1, 'row', [], { name: { label: [] } }, { id: {} }, { value: false }])(
  'fails closed before sorting or rendering malformed decoded table rows: %j', async malformed => {
    for (const layout of ['records', undefined] as const) {
      await run(() => {
        const view: unknown = Reflect.apply(createElement, undefined, [DataTable, {
          columns,
          rows: [rows[0], malformed],
          layout,
          defaultSort: { direction: 'ascending', key: 'name' },
          renderDetails: () => 'Details'
        }])
        if (!isValidElement(view)) throw new Error('Expected table element')
        root.render(view)
      })
      expect(container.querySelectorAll('tbody tr')).toHaveLength(0)
      expect(container.querySelectorAll('[data-ui-datatable-detail]')).toHaveLength(0)
    }
  }
)

test.each([null, 1, 'rows', {}])('fails closed on a malformed decoded table collection: %j', rows => run(() => {
  const view: unknown = Reflect.apply(createElement, undefined, [DataTable, { columns, rows }])
  if (!isValidElement(view)) throw new Error('Expected table element')
  root.render(view)
  expect(container.querySelectorAll('tbody tr')).toHaveLength(0)
}))

test('fails closed before client sorting a sparse row collection', async () => {
  const sparseRows: unknown[] = [rows[0]]
  sparseRows.length = 2
  await run(() => {
    const view: unknown = Reflect.apply(createElement, undefined, [DataTable, {
      columns,
      rows: sparseRows,
      defaultSort: { direction: 'ascending', key: 'name' }
    }])
    if (!isValidElement(view)) throw new Error('Expected table element')
    root.render(view)
  })
  expect(container.querySelectorAll('tbody tr')).toHaveLength(0)
})
