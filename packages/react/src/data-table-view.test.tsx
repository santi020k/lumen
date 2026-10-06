// @vitest-environment jsdom
import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { DataTableView, type DataTableViewColumn, type DataTableViewProps, type DataTableViewState } from './data-table-view.js'

interface RecordFixture { id: string, name: string, amount: number, status: string }
const rows: RecordFixture[] = Array.from({ length: 31 }, (_, index) => ({
  id: String(index), name: `Client ${index}`, amount: index, status: index % 2 ? 'paid' : 'due'
}))
const columns: DataTableViewColumn<RecordFixture>[] = [
  { key: 'name', label: 'Client', value: row => row.name, canHide: false, sortable: true },
  { key: 'amount', label: 'Amount', value: row => row.amount, sortable: true },
  { key: 'status',
    label: 'Status',
    value: row => row.status,
    sortable: true,
    filterOptions: [{ value: 'due', label: 'Due' }, { value: 'paid', label: 'Paid' }] }
]
let root: Root
let container: HTMLDivElement
const run = async (fn: () => void) => act(async () => {
  await Promise.resolve()
  fn()
})
const render = (props: Partial<DataTableViewProps<RecordFixture>> = {}) => run(() => {
  root.render(
    <DataTableView rows={rows} columns={columns} getRowId={row => row.id} label="Loans" {...props}>
      {view => (
        <table>
          <tbody>
            {view.rows.map(row => (
              <tr key={row.id} data-id={row.id}>
                <td>{row.name}</td>
                <td hidden={!view.isColumnVisible('amount')}>{row.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DataTableView>
  )
})
const get = (selector: string): HTMLElement => {
  const result = container.querySelector(selector)
  if (!(result instanceof HTMLElement)) throw new Error(`Missing ${selector}`)
  return result
}
const click = (text: string) => run(() => {
  const button = [...container.querySelectorAll('button')].find(item => item.textContent === text)
  if (!button) throw new Error(`Missing ${text}`)
  button.click()
})
const changeSelect = (suffix: string, value: string) => run(() => {
  const labelText = suffix === 'size' ? 'Rows per page' : columns.find(column => column.key === suffix)?.label
  const label = [...container.querySelectorAll('label')].find(element => element.textContent === labelText)
  const select = label?.control
  if (!(select instanceof HTMLSelectElement)) throw new Error('Expected select')
  select.value = value
  select.dispatchEvent(new Event('change', { bubbles: true }))
})
const changeSearch = (value: string) => run(() => {
  const input = get('input[type="search"]')
  if (!(input instanceof HTMLInputElement)) throw new Error('Expected search')
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')
  descriptor?.set?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
})
const ids = () => [...container.querySelectorAll('tbody tr')].map(row => row.getAttribute('data-id'))

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

test('paginates immutable records, changes page size and resets filters to the first page', async () => {
  await render()
  expect(get('section').getAttribute('role')).toBe('group')
  expect(ids()).toHaveLength(25)
  await click('Next page')
  expect(ids()).toEqual(['25', '26', '27', '28', '29', '30'])
  await changeSelect('size', '10')
  expect(ids()).toEqual(rows.slice(0, 10).map(row => row.id))
  await click('Next page')
  await changeSelect('status', 'paid')
  expect(ids()).toEqual(['1', '3', '5', '7', '9', '11', '13', '15', '17', '19'])
  expect(container.textContent).toContain('Page 1 of 2 · 15 records')
  expect(rows[0]?.id).toBe('0')
})

test('searches underlying values and presents a usable empty result', async () => {
  await render()
  await changeSearch('client 30')
  expect(ids()).toEqual(['30'])
  await changeSearch('missing')
  expect(ids()).toHaveLength(0)
  expect(container.textContent).toContain('No matching records')
  await changeSearch('')
  expect(ids()).toHaveLength(25)
})

test('column visibility retains required identity columns and survives page changes', async () => {
  await render()
  await run(() => {
    get('input[type="checkbox"]').click()
  })
  expect(get('tbody td:nth-child(2)').hidden).toBe(true)
  await click('Next page')
  expect(get('tbody td:nth-child(2)').hidden).toBe(true)
  expect(container.querySelectorAll('input[type="checkbox"]')).toHaveLength(2)
})

test('clamps the client page after deletion without losing preferences', async () => {
  await render({ defaultState: { pagination: { pageIndex: 1, pageSize: 25 }, density: 'compact' } })
  await render({ rows: rows.slice(0, 2) })
  expect(ids()).toEqual(['0', '1'])
  expect(get('section').dataset.density).toBe('compact')
  expect(container.textContent).toContain('Page 1 of 1 · 2 records')
})

test('server mode preserves supplied rows while requesting state', async () => {
  const onStateChange = vi.fn()
  await render({ mode: 'server', rowCount: 100, onStateChange })
  await changeSearch('missing')
  expect(ids()).toEqual(rows.map(row => row.id))
  await click('Next page')
  expect(onStateChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ pagination: { pageIndex: 1, pageSize: 25 } })
  )
  expect(ids()).toEqual(rows.map(row => row.id))
})

test('server result shrink requests the clamped controlled page once and preserves preferences', async () => {
  const changes = vi.fn()
  const state: DataTableViewState = {
    search: 'client',
    filters: [],
    visibility: { amount: false },
    pagination: { pageIndex: 9, pageSize: 25 },
    sorting: [],
    density: 'compact'
  }

  await render({ mode: 'server', rowCount: 300, state, onStateChange: changes })
  expect(changes).not.toHaveBeenCalled()
  await render({ mode: 'server', rowCount: 50, state, onStateChange: changes })
  expect(changes).toHaveBeenCalledExactlyOnceWith({ ...state, pagination: { pageIndex: 1, pageSize: 25 } })
  await render({ mode: 'server', rowCount: 50, state, onStateChange: changes })
  expect(changes).toHaveBeenCalledTimes(1)
  const accepted = { ...state, pagination: { pageIndex: 1, pageSize: 25 } }

  await render({ mode: 'server', rowCount: 50, state: accepted, onStateChange: changes })
  expect(get('section').dataset.density).toBe('compact')
  await click('Previous page')
  expect(changes).toHaveBeenLastCalledWith({ ...accepted, pagination: { pageIndex: 0, pageSize: 25 } })
})

test('empty server results request the first page and uncontrolled pagination accepts the correction', async () => {
  const changes = vi.fn()

  await render({ mode: 'server', rowCount: 0, rows: [], defaultState: { pagination: { pageIndex: 9, pageSize: 25 } }, onStateChange: changes })
  expect(changes).toHaveBeenCalledTimes(1)
  expect(changes).toHaveBeenLastCalledWith(expect.objectContaining({ pagination: { pageIndex: 0, pageSize: 25 } }))
  expect(container.textContent).toContain('Page 1 of 1 · 0 records')
})

test('controlled state waits for the application and supports snapshot restoration', async () => {
  const changes = vi.fn()
  const state: DataTableViewState = {
    search: '',
    filters: [],
    visibility: {},
    pagination: { pageIndex: 0, pageSize: 10 },
    sorting: [],
    density: 'comfortable'
  }
  await render({ state, onStateChange: changes })
  await changeSearch('client 30')
  expect(ids()).toHaveLength(10)
  expect(changes).toHaveBeenCalledExactlyOnceWith({ ...state, search: 'client 30' })
  await render({ state: { ...state, search: 'client 30', visibility: { amount: false } } })
  expect(ids()).toEqual(['30'])
  expect(get('tbody td:nth-child(2)').hidden).toBe(true)
})

test('supports typed numeric sorting and multi-column priorities', async () => {
  const Example = () => {
    const [state, setState] = useState<DataTableViewState>({ search: '', filters: [], visibility: {}, pagination: { pageIndex: 0, pageSize: 25 }, sorting: [], density: 'comfortable' })
    return (
      <DataTableView rows={rows} columns={columns} getRowId={row => row.id} label="Loans" state={state} onStateChange={setState}>
        {view => (
          <>
            <button
              type="button"
              onClick={() => {
                view.toggleSort('amount')
              }}
            >
              Sort
            </button>
            <button
              type="button"
              onClick={() => {
                view.toggleSort('status')
              }}
            >
              Status sort
            </button>
            <button
              type="button"
              onClick={() => {
                view.toggleSort('amount', true)
              }}
            >
              Add amount
            </button>
            <output>{view.rows.map(row => row.amount).join(',')}</output>
          </>
        )}
      </DataTableView>
    )
  }
  await run(() => {
    root.render(<Example />)
  })
  await click('Sort')
  await click('Sort')
  expect(get('output').textContent.split(',')[0]).toBe('30')
  await click('Status sort')
  await click('Add amount')
  await click('Add amount')
  expect(get('output').textContent.split(',').slice(0, 3)).toEqual(['30', '28', '26'])
})

test.each([0, -1, 1.5, Number.POSITIVE_INFINITY])('rejects invalid restored page size %s', async pageSize => {
  await expect(render({ defaultState: { pagination: { pageIndex: 0, pageSize } } })).rejects.toThrow(RangeError)
})

test('rejects duplicate record identities before table processing', async () => {
  await expect(render({ rows: [{ id: 'same', name: 'First', amount: 1, status: 'due' },
    { id: 'same', name: 'Second', amount: 2, status: 'due' }] })).rejects.toThrow('unique, nonempty row IDs')
})

test.each([
  { columns: [{ key: 'same', label: 'First' }, { key: 'same', label: 'Second' }] },
  { columns: [{ key: '', label: 'Empty' }] },
  { columns: [{ key: '   ', label: 'Whitespace' }] },
  { columns: new Array<DataTableViewColumn<RecordFixture>>(1) }
])('rejects ambiguous column keys before constructing controls', async ({ columns: invalidColumns }) => {
  await expect(render({ columns: invalidColumns })).rejects.toThrow('unique, nonempty column keys')
})

test('rejects a decoded non-array column configuration', async () => {
  await expect(Reflect.apply(render, undefined, [{ columns: {} }])).rejects.toThrow('array of columns')
})

test.each([
  { label: null },
  { label: 3 },
  { value: 'name' },
  { value: null },
  { canHide: 'false' },
  { sortable: 1 },
  { filterOptions: {} },
  { filterOptions: null },
  { filterOptions: [null] },
  { filterOptions: [{ value: 'due' }] },
  { filterOptions: [{ value: 3, label: 'Due' }] },
  { filterOptions: [{ value: 'due', label: {} }] }
])('rejects malformed decoded column members before table processing: %j', async patch => {
  const decoded: unknown = JSON.parse(JSON.stringify({ columns: [{ key: 'status', label: 'Status', ...patch }] }))
  await expect(Reflect.apply(render, undefined, [decoded])).rejects.toThrow('valid column labels, accessors, flags and filter options')
})

test('rejects sparse filter options before constructing controls', async () => {
  await expect(render({ columns: [{ key: 'status', label: 'Status', filterOptions: new Array<{ value: string, label: string }>(1) }] }))
    .rejects.toThrow('valid column labels, accessors, flags and filter options')
})

const restoredView = {
  search: '',
  filters: [],
  visibility: {},
  sorting: [],
  density: 'comfortable',
  pagination: { pageIndex: 0, pageSize: 25 }
}

test.each([
  { search: null },
  { search: 3 },
  { filters: null },
  { filters: {} },
  { filters: [null] },
  { filters: [{ id: 'status', value: 3 }] },
  { filters: [{ id: 3, value: 'due' }] },
  { visibility: null },
  { visibility: [] },
  { visibility: { amount: 'false' } },
  { sorting: null },
  { sorting: {} },
  { sorting: [null] },
  { sorting: [{ id: 'amount', desc: 'false' }] },
  { sorting: [{ id: 3, desc: false }] },
  { density: 'dense' },
  { density: ['compact'] }
])('rejects malformed controlled and default snapshots before table processing: %j', async patch => {
  for (const property of ['state', 'defaultState']) {
    const decoded: unknown = JSON.parse(JSON.stringify({ [property]: { ...restoredView, ...patch } }))
    await expect(Reflect.apply(render, undefined, [decoded])).rejects.toThrow('valid search, filters, visibility, sorting and density state')
  }
})

test.each([null, [], 'saved'])('rejects non-object controlled and default snapshots: %j', async snapshot => {
  for (const property of ['state', 'defaultState']) {
    const decoded: unknown = JSON.parse(JSON.stringify({ [property]: snapshot }))
    await expect(Reflect.apply(render, undefined, [decoded])).rejects.toThrow('DataTableView requires')
  }
})

test.each([null, {}, { pageIndex: '0', pageSize: 25 }, { pageIndex: 0, pageSize: '25' }])(
  'rejects malformed pagination objects in restored snapshots: %j', async pagination => {
    for (const property of ['state', 'defaultState']) {
      const decoded: unknown = JSON.parse(JSON.stringify({ [property]: { ...restoredView, pagination } }))
      await expect(Reflect.apply(render, undefined, [decoded])).rejects.toThrow('positive integer page size')
    }
  }
)

test('accepts a decoded valid snapshot', async () => {
  const decoded: unknown = JSON.parse(JSON.stringify({ state: { ...restoredView, visibility: { amount: false }, filters: [{ id: 'status', value: 'due' }], sorting: [{ id: 'amount', desc: true }] } }))
  await Reflect.apply(render, undefined, [decoded])
  expect(ids()[0]).toBe('30')
  expect(get('tbody td:nth-child(2)').hidden).toBe(true)
})

test('accepts partial defaults and empty optional filters without altering accessor functions', async () => {
  await render({ defaultState: { search: 'client 30' }, columns: [{ key: 'name', label: 'Client', value: row => row.name, filterOptions: [] }] })
  expect(ids()).toEqual(['30'])
})

test('rejects sparse restored filter and sort arrays', async () => {
  for (const property of ['filters', 'sorting']) {
    const decoded: unknown = { state: { ...restoredView, [property]: new Array<unknown>(1) } }
    await expect(Reflect.apply(render, undefined, [decoded])).rejects.toThrow('valid search, filters, visibility, sorting and density state')
  }
})

test('column filter identities stay disjoint from toolbar controls and arbitrary column keys', async () => {
  const keys = ['search', 'density', 'size', 'custom value', '\uD800']

  await render({ columns: keys.map(key => ({ key,
    label: `Filter ${key}`,
    value: row => row.status,
    filterOptions: [{ value: 'due', label: 'Due' }] })) })

  const identities = [...container.querySelectorAll('[id]')].map(element => element.id)

  expect(new Set(identities).size).toBe(identities.length)
  expect(identities.every(id => !/\s/u.test(id))).toBe(true)

  for (const key of keys) {
    const label = [...container.querySelectorAll('label')].find(element => element.textContent === `Filter ${key}`)

    expect(label?.control).toBeInstanceOf(HTMLSelectElement)
  }
})

test('range filters are inclusive, compose with search, and reset pagination', async () => {
  await render({ columns: columns.map(column => column.key === 'amount' ? { ...column, rangeFilter: 'number' } : column) })
  await click('Next page')
  await run(() => {
    const input = [...container.querySelectorAll('input')].find(element => element.type === 'number')
    if (!input) throw new Error('Missing numeric range')
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, '28')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  expect(ids()).toEqual(['28', '29', '30'])
  await changeSearch('Client 29')
  expect(ids()).toEqual(['29'])
})

test('server ranges are query state and never filter the supplied page', async () => {
  await render({ mode: 'server', rowCount: 300, columns: columns.map(column => column.key === 'amount' ? { ...column, rangeFilter: 'number' } : column), defaultState: { ranges: [{ id: 'amount', from: '100', to: '200' }] } })
  expect(ids()).toEqual(rows.map(row => row.id))
})

test('selection preserves off-page identities and skips ineligible rows', async () => {
  const Harness = () => {
    const [selectedIds, setSelectedIds] = useState<string[]>(['remote-row'])
    return (
      <DataTableView rows={rows} columns={columns} getRowId={row => row.id} label="Selectable records" defaultState={{ pagination: { pageIndex: 0, pageSize: 10 } }} selection={{ selectedIds, onChange: setSelectedIds, unavailableReason: row => row.id === '0' ? 'Unavailable' : undefined }}>
        {view => <output>{view.selection?.selectedIds.join(',')}</output>}
      </DataTableView>
    )
  }
  await run(() => {
    root.render(<Harness />)
  })
  const selectPage = () => run(() => {
    const input = container.querySelector<HTMLInputElement>('.ui-data-table-view__selection input')
    if (!input) throw new Error('Missing page selection')
    input.click()
  })
  await selectPage()
  expect(container.querySelector('output')?.textContent).toBe('remote-row,1,2,3,4,5,6,7,8,9')
  await click('Next page')
  await selectPage()
  expect(container.querySelector('output')?.textContent).toContain('remote-row,1,2,3,4,5,6,7,8,9,10,11')
  await selectPage()
  expect(container.querySelector('output')?.textContent).toBe('remote-row,1,2,3,4,5,6,7,8,9')
  await click('Clear selection')
  expect(container.querySelector('output')?.textContent).toBe('')
})

test('disabled table callbacks cannot change sorting or selection', async () => {
  const changed = vi.fn()
  await run(() => {
    root.render(
      <DataTableView rows={rows} columns={columns} getRowId={row => row.id} label="Pending records" disabled onStateChange={changed} selection={{ selectedIds: [], onChange: changed }}>
        {view => (
          <button
            type="button"
            onClick={() => {
              view.toggleSort('amount')
              view.selection?.togglePage()
              view.selection?.clear()
              if (rows[0]) view.selection?.toggle(rows[0])
            }}
          >
            Invoke disabled actions
          </button>
        )}
      </DataTableView>
    )
  })
  await click('Invoke disabled actions')
  expect(changed).not.toHaveBeenCalled()
})
