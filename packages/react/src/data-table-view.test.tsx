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
  const select = get(`select[id$="-${suffix}"]`)
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
