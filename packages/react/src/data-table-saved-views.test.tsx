// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { DataTableSavedViews, type DataTableSavedViewsProps } from './data-table-saved-views.js'
import type { DataTableViewState } from './data-table-view.js'

const state: DataTableViewState = { search: 'example', filters: [], ranges: [{ id: 'amount', from: '0', to: '100' }], visibility: {}, pagination: { pageIndex: 4, pageSize: 25 }, sorting: [], density: 'compact' }
let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
const onApply = vi.fn<DataTableSavedViewsProps['onApply']>()
const onSave = vi.fn<DataTableSavedViewsProps['onSave']>()
const onUpdate = vi.fn<NonNullable<DataTableSavedViewsProps['onUpdate']>>()
const onRemove = vi.fn<NonNullable<DataTableSavedViewsProps['onRemove']>>()
const render = (disabled = false) => {
  act(() => {
    root.render(<DataTableSavedViews state={state} resetState={{ ...state, search: '', ranges: [] }} views={[{ id: 'due', label: 'Due', state }]} activeId="due" onApply={onApply} onSave={onSave} onUpdate={onUpdate} onRemove={onRemove} disabled={disabled} />)
  })
}
const click = (label: string) => {
  act(() => {
    const button = [...container.querySelectorAll('button')].find(item => item.textContent === label)
    if (!button) throw new Error(`Missing ${label}`)
    button.click()
  })
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.clearAllMocks()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  render()
})

afterEach(() => {
  act(() => {
    root.unmount()
  })
  container.remove()
  vi.unstubAllGlobals()
})

test('saves named preferences through the host and resets the page without mutating the current view', () => {
  click('Save new view')
  expect(onSave).not.toHaveBeenCalled()
  act(() => {
    const input = container.querySelector('input')
    if (!input) throw new Error('Missing view name')
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, '  Follow up  ')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  click('Save new view')
  expect(onSave).toHaveBeenCalledWith('Follow up', { ...state, pagination: { pageIndex: 0, pageSize: 25 } })
  expect(state.pagination.pageIndex).toBe(4)
  click('Update view')
  expect(onUpdate).toHaveBeenCalledWith('due', { ...state, pagination: { pageIndex: 0, pageSize: 25 } })
  click('Remove view')
  expect(onRemove).toHaveBeenCalledWith('due')
  click('Reset view')
  expect(onApply).toHaveBeenCalledWith({ ...state, search: '', ranges: [], pagination: { pageIndex: 0, pageSize: 25 } }, undefined)
})

test('applying a saved view returns an independent snapshot', () => {
  act(() => {
    const select = container.querySelector('select')
    if (!select) throw new Error('Missing saved view select')
    select.value = 'due'
    select.dispatchEvent(new Event('change', { bubbles: true }))
  })
  const restored = onApply.mock.calls[0]?.[0]
  expect(restored).toEqual({ ...state, pagination: { pageIndex: 0, pageSize: 25 } })
  expect(restored?.ranges).not.toBe(state.ranges)
})

test('pending persistence disables all view changes', () => {
  render(true)
  for (const button of container.querySelectorAll('button')) expect(button.disabled).toBe(true)
  click('Update view')
  click('Remove view')
  click('Reset view')
  expect(onUpdate).not.toHaveBeenCalled()
  expect(onRemove).not.toHaveBeenCalled()
  expect(onApply).not.toHaveBeenCalled()
})
