import { act, createElement, type ReactElement } from 'react'

import { createRoot, type Root, type TestInstance } from 'test-renderer'
import { afterEach, expect, test, vi } from 'vitest'

import { LumenDataTable, type LumenDataTableProps } from './table-components.js'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
vi.mock('react-native', () => ({
  View: (props: Record<string, unknown>): ReactElement => createElement('View', props),
  ScrollView: (props: Record<string, unknown>): ReactElement => createElement('ScrollView', props)
}))
vi.mock('./primitives.js', () => ({
  LumenButton: (props: Record<string, unknown>): ReactElement => createElement('Button', props),
  LumenText: (props: Record<string, unknown>): ReactElement => createElement('Text', props)
}))
vi.mock('./selection-components.js', () => ({
  LumenCheckbox: (props: Record<string, unknown>): ReactElement => createElement('Checkbox', props)
}))
vi.mock('./theme-context.js', () => ({ useLumenTheme: () => ({ spacing: { xs: 4, sm: 8, md: 16 },
  radii: { md: 8 },
  colors: { line: '#888' } }) }))
const roots: Root[] = []
const columns = [{ key: 'amount', label: 'Amount', sortable: true }]
const rows = [
  { id: 'large', label: 'Large', cells: { amount: { text: '20 items', sortValue: 20 } } },
  { id: 'small', label: 'Small', cells: { amount: { text: '2 items', sortValue: 2 } } },
  { id: 'locked', label: 'Locked', disabled: true, cells: { amount: { text: 'Missing', sortValue: null } } }
]
afterEach(() => {
  act(() => {
    for (const root of roots) root.unmount()
  })
  roots.length = 0
})
const read = (instance: TestInstance, key: string): unknown => (instance.props as Record<string, unknown>)[key]
const render = (props: Partial<LumenDataTableProps> = {}): {
  root: Root
  selection: ReturnType<typeof vi.fn>
  sort: ReturnType<typeof vi.fn>
} => {
  const root = createRoot()
  const selection = vi.fn()
  const sort = vi.fn()

  roots.push(root)
  act(() => {
    root.render(
      <LumenDataTable
        label="Synthetic records"
        rows={rows}
        columns={columns}
        selectedIds={new Set(['hidden', 'locked'])}
        onSelectionChange={selection}
        onSortChange={sort}
        {...props}
      />
    )
  })

  return { root, selection, sort }
}
const find = (root: Root, type: string, label: string): TestInstance => {
  const item = root.container.queryAll(instance => instance.type === type && read(instance, 'accessibilityLabel') === label)[0]

  if (!item) throw new Error(`Missing ${label}`)

  return item
}
const invoke = (instance: TestInstance, key: string, args: readonly unknown[] = []): void => {
  const handler = read(instance, key)

  if (typeof handler !== 'function') throw new Error(`Missing ${key}`)
  act(() => {
    Reflect.apply(handler, undefined, args)
  })
}
const order = (root: Root): readonly unknown[] => root.container.queryAll(item => item.type === 'Checkbox').map(item => read(item, 'label'))

test('client sorting changes displayed stable rows, localizes status and proposes controlled next sort', () => {
  const { root, sort } = render({ sortMode: 'client',
    sort: { key: 'amount', direction: 'ascending' },
    formatSort: value => value?.direction === 'ascending' ? 'Increasing' : 'Decreasing' })

  expect(order(root)).toEqual(['Small', 'Large', 'Locked'])
  expect(find(root, 'Button', 'Amount, Increasing')).toBeDefined()
  invoke(find(root, 'Button', 'Amount, Increasing'), 'onPress')
  expect(sort).toHaveBeenCalledWith({ key: 'amount', direction: 'descending' })
  expect(order(root)).toEqual(['Small', 'Large', 'Locked'])
  expect(rows.map(row => row.id)).toEqual(['large', 'small', 'locked'])
})

test('manual sorting retains host order while emitting a sort request', () => {
  const { root, sort } = render({ sortMode: 'manual', sort: { key: 'amount', direction: 'ascending' } })

  expect(order(root)).toEqual(['Large', 'Small', 'Locked'])
  invoke(find(root, 'Button', 'Amount, ascending'), 'onPress')
  expect(sort).toHaveBeenCalledWith({ key: 'amount', direction: 'descending' })
  expect(order(root)).toEqual(['Large', 'Small', 'Locked'])
})

test('bulk and individual selection preserve hidden and disabled IDs without mutating controlled input', () => {
  const ids = new Set(['hidden', 'locked'])
  const { root, selection } = render({ selectedIds: ids })

  invoke(find(root, 'Button', 'Select visible'), 'onPress')
  expect(selection).toHaveBeenLastCalledWith(new Set(['hidden', 'locked', 'large', 'small']))
  invoke(find(root, 'Checkbox', 'Small'), 'onCheckedChange', [true])
  expect(selection).toHaveBeenLastCalledWith(new Set(['hidden', 'locked', 'small']))
  invoke(find(root, 'Checkbox', 'Locked'), 'onCheckedChange', [false])
  expect(selection).toHaveBeenCalledTimes(2)
  expect(ids).toEqual(new Set(['hidden', 'locked']))
  const selected = render({ selectedIds: new Set(['hidden', 'locked', 'large', 'small']), deselectAllLabel: 'Clear visible' })

  invoke(find(selected.root, 'Button', 'Clear visible'), 'onPress')
  expect(selected.selection).toHaveBeenCalledWith(ids)
})

test('disabled and readOnly block sort and selection proposals even for retained selected rows', () => {
  for (const props of [{ disabled: true }, { readOnly: true }]) {
    const { root, selection, sort } = render(props)

    invoke(find(root, 'Button', 'Amount'), 'onPress')
    invoke(find(root, 'Button', 'Select visible'), 'onPress')
    invoke(find(root, 'Checkbox', 'Small'), 'onCheckedChange', [true])
    expect(selection).not.toHaveBeenCalled()
    expect(sort).not.toHaveBeenCalled()
    expect(read(find(root, 'Checkbox', 'Small'), 'disabled')).toBe(true)
  }
})

test('loading, even an empty error, invalid IDs and empty data replace stale controls', () => {
  for (const props of [{ loading: true }, { error: '' }, { rows: [rows[0], rows[0]].filter(row => row !== undefined) }, { rows: [] }]) {
    const { root, selection, sort } = render(props)

    expect(root.container.queryAll(item => item.type === 'Button' || item.type === 'Checkbox')).toHaveLength(0)
    expect(selection).not.toHaveBeenCalled()
    expect(sort).not.toHaveBeenCalled()
  }
})

test('localized error recovery remains host-owned and disabled retry stays disabled', () => {
  const retry = vi.fn()
  const { root } = render({ error: 'Unavailable data', retryLabel: 'Try records again', onRetry: retry, disabled: true })

  expect(read(find(root, 'Button', 'Try records again'), 'disabled')).toBe(true)
  expect(retry).not.toHaveBeenCalled()
  const enabled = render({ error: 'Unavailable data', retryLabel: 'Try records again', onRetry: retry })

  invoke(find(enabled.root, 'Button', 'Try records again'), 'onPress')
  expect(retry).toHaveBeenCalledOnce()
})

test('horizontal layout retains sort controls and inherited prototype cells use the missing label', () => {
  const { root } = render({ layout: 'scroll',
    columns: [{ key: 'toString', label: 'Prototype name', sortable: true }],
    rows: [{ id: 'one', label: 'One', cells: {} }],
    missingLabel: 'No cell value' })

  expect(root.container.queryAll(item => item.type === 'ScrollView' && read(item, 'horizontal') === true)).toHaveLength(1)
  expect(find(root, 'Button', 'Prototype name')).toBeDefined()
  expect(root.container.queryAll(item => item.type === 'Text' && read(item, 'children') === 'No cell value')).toHaveLength(1)
})
