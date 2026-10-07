import { act, createElement, type ReactElement } from 'react'

import { createRoot, type Root, type TestInstance } from 'test-renderer'
import { afterEach, expect, test, vi } from 'vitest'

import { LumenTreeGrid, type LumenTreeGridProps } from './tree-grid-components.js'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
vi.mock('react-native', () => ({
  View: (props: Record<string, unknown>): ReactElement => createElement('View', props),
  FlatList: (props: { data: readonly unknown[], renderItem: (value: { item: unknown }) => ReactElement }): ReactElement => createElement('List', props, props.data.map(item => props.renderItem({ item })))
}))
vi.mock('./primitives.js', () => ({
  LumenButton: (props: Record<string, unknown>): ReactElement => createElement('Button', props),
  LumenText: (props: Record<string, unknown>): ReactElement => createElement('Text', props)
}))
vi.mock('./theme-context.js', () => ({ useLumenTheme: () => ({ spacing: { xs: 4, sm: 8, md: 16 },
  radii: { md: 8 },
  colors: { line: '#888' } }) }))
const roots: Root[] = []
const records = [
  { node: { id: 'root', label: 'Packages' }, cells: { status: { text: 'Group' } } },
  { node: { id: 'child', label: 'Astro', parentId: 'root' }, cells: { status: { text: 'Ready' } } },
  { node: { id: 'locked', label: 'Locked', disabled: true }, cells: {} },
  { node: { id: 'locked-child', label: 'Locked child', parentId: 'locked' }, cells: {} }
]
afterEach(() => {
  act(() => {
    for (const root of roots) root.unmount()
  })
  roots.length = 0
})
const read = (instance: TestInstance, key: string): unknown => (instance.props as Record<string, unknown>)[key]
const render = (props: Partial<LumenTreeGridProps> = {}): { root: Root, change: ReturnType<typeof vi.fn> } => {
  const root = createRoot()
  const change = vi.fn()

  roots.push(root)
  act(() => {
    root.render(
      <LumenTreeGrid
        label="Project status"
        columns={[{ key: 'status', label: 'Status' }]}
        records={records}
        expandedIds={new Set(['root', 'unknown'])}
        onExpandedChange={change}
        {...props}
      />
    )
  })

  return { root, change }
}
const button = (root: Root, label: string): TestInstance => {
  const found = root.container.queryAll(item => item.type === 'Button' && read(item, 'accessibilityLabel') === label)[0]

  if (!found) throw new Error(`Missing ${label}`)

  return found
}
const press = (item: TestInstance): void => {
  const callback = read(item, 'onPress')

  if (typeof callback !== 'function') throw new Error('Missing callback')
  act(() => {
    Reflect.apply(callback, undefined, [])
  })
}

test('controlled disclosure preserves unknown IDs and renders labeled cells without changing input', () => {
  const { root, change } = render({ formatDisclosure: (name, expanded) => `${name}:${expanded}` })

  press(button(root, 'Packages:true'))
  expect(change).toHaveBeenCalledWith(new Set(['unknown']))
  expect(read(button(root, 'Packages:true'), 'accessibilityState')).toEqual({ expanded: true, disabled: false })
  expect(root.container.queryAll(item => item.type === 'Text' && read(item, 'children') === 'Ready')).toHaveLength(1)
})

test('disabled ancestry blocks disclosure while readOnly permits browsing and informs host cells', () => {
  const cell = vi.fn<NonNullable<LumenTreeGridProps['renderCell']>>(() => <span>Custom cell</span>)
  const { root, change } = render({ readOnly: true, expandedIds: new Set(['locked']), renderCell: cell })

  press(button(root, 'Collapse Locked'))
  expect(change).not.toHaveBeenCalled()
  press(button(root, 'Expand Packages'))
  expect(change).toHaveBeenCalledWith(new Set(['locked', 'root']))
  expect(cell.mock.calls.some(call => call[3].disabled && call[3].readOnly)).toBe(true)
})

test('loading/error/invalid data hide stale disclosure and cell controls; empty state is localized', () => {
  for (const props of [{ loading: true }, { error: '' }, { columns: [] }, { records: [{ node: { id: 'cycle', label: 'Cycle', parentId: 'cycle' }, cells: {} }] }]) {
    const { root, change } = render(props)

    expect(root.container.queryAll(item => item.type === 'Button')).toHaveLength(0)
    expect(change).not.toHaveBeenCalled()
  }
  const { root } = render({ records: [], emptyLabel: 'No project records' })

  expect(root.container.queryAll(item => item.type === 'Text' && read(item, 'children') === 'No project records')).toHaveLength(1)
})

test('missing values use localized fallback and global disabled prevents proposals', () => {
  const { root, change } = render({ disabled: true, missingCellLabel: 'Unavailable' })

  press(button(root, 'Collapse Packages'))
  expect(change).not.toHaveBeenCalled()
  expect(root.container.queryAll(item => item.type === 'Text' && read(item, 'children') === 'Unavailable')).toHaveLength(1)
})

test('invalid controlled expansion state uses the existing invalid label without records', () => {
  for (const value of [null, undefined, [], {}, new Set([7])]) {
    const input: Partial<LumenTreeGridProps> = { invalidLabel: 'Invalid expansion' }

    Object.defineProperty(input, 'expandedIds', { value, enumerable: true })
    const { root, change } = render(input)

    expect(root.container.queryAll(item => item.type === 'Button')).toHaveLength(0)
    expect(root.container.queryAll(item => item.type === 'Text' && read(item, 'children') === 'Invalid expansion')).toHaveLength(1)
    expect(change).not.toHaveBeenCalled()
  }
})
