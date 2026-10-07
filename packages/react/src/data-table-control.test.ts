// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { DataTable, type DataTableProps, type DataTableSort } from './index.js'

let container: HTMLDivElement
let root: Root

const columns = [{ header: 'Name', key: 'name', sortable: true }]
const rows = [{ id: 'b', name: 'Beta' }, { id: 'a', name: 'Alpha' }]
const ascending: DataTableSort = { direction: 'ascending', key: 'name' }

const run = async (action: () => void) => {
  await act(async () => {
    await Promise.resolve()
    action()
  })
}
const render = (props: DataTableProps = {}) => run(() => {
  root.render(createElement(DataTable, { columns, rows, ...props }))
})
const names = () => [...container.querySelectorAll('tbody tr')].map(row => row.textContent)
const clickSort = () => run(() => {
  const button = container.querySelector('thead button')
  if (!(button instanceof HTMLButtonElement)) throw new Error('Expected sort button')
  button.click()
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

test('manual server sorting requests a new direction without reordering the supplied page', async () => {
  const onSortChange = vi.fn()
  await render({ sort: ascending, sortMode: 'manual', onSortChange })
  expect(names()).toEqual(['Beta', 'Alpha'])
  expect(container.querySelector('th')?.getAttribute('aria-sort')).toBe('ascending')
  await clickSort()
  expect(onSortChange).toHaveBeenCalledExactlyOnceWith({ direction: 'descending', key: 'name' })
  expect(names()).toEqual(['Beta', 'Alpha'])
  expect(container.querySelector('th')?.getAttribute('aria-sort')).toBe('ascending')
  await render({ sort: { ...ascending, direction: 'descending' }, sortMode: 'manual', onSortChange, rows: [{ id: 'c', name: 'Charlie' }, { id: 'z', name: 'Zulu' }] })
  expect(names()).toEqual(['Charlie', 'Zulu'])
  expect(container.querySelector('th')?.getAttribute('aria-sort')).toBe('descending')
  expect(onSortChange).toHaveBeenCalledTimes(1)
})

test('uncontrolled manual sorting changes only its accessible header state', async () => {
  await render({ sortMode: 'manual' })
  await clickSort()
  expect(names()).toEqual(['Beta', 'Alpha'])
  expect(container.querySelector('th')?.getAttribute('aria-sort')).toBe('ascending')
  await render({ sortMode: 'manual', rows: [{ id: 'd', name: 'Delta' }, { id: 'c', name: 'Charlie' }] })
  expect(names()).toEqual(['Delta', 'Charlie'])
  expect(container.querySelector('th')?.getAttribute('aria-sort')).toBe('ascending')
})

test('controlled client sorting supports explicit unsorted state and refreshed rows', async () => {
  const onSortChange = vi.fn()
  await render({ sort: ascending, onSortChange })
  expect(names()).toEqual(['Alpha', 'Beta'])
  await render({ sort: ascending, onSortChange, rows: [{ id: 'z', name: 'Zulu' }, { id: 'c', name: 'Charlie' }] })
  expect(names()).toEqual(['Charlie', 'Zulu'])
  await render({ sort: null, defaultSort: ascending, onSortChange })
  expect(names()).toEqual(['Beta', 'Alpha'])
  expect(container.querySelector('th')?.getAttribute('aria-sort')).toBe('none')
  expect(onSortChange).not.toHaveBeenCalled()
})

test('default client sort is stable across refreshes and never mutates supplied rows', async () => {
  await render({ defaultSort: ascending })
  expect(names()).toEqual(['Alpha', 'Beta'])
  await clickSort()
  await render({ defaultSort: ascending })
  expect(names()).toEqual(['Beta', 'Alpha'])
  expect(rows.map(row => row.name)).toEqual(['Beta', 'Alpha'])
  expect(container.querySelector('th')?.getAttribute('data-ui-datatable-sort-bound')).toBe('true')
})
