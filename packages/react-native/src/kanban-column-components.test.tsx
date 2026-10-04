import { act, createElement, type ReactElement } from 'react'

import { createRoot, type Root, type TestInstance } from 'test-renderer'
import { afterEach, expect, test, vi } from 'vitest'

import { LumenKanbanColumn, type LumenKanbanColumnProps } from './kanban-column-components.js'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
vi.mock('react-native', () => ({
  View: (props: Record<string, unknown>): ReactElement => createElement('View', props),
  PanResponder: { create: () => ({ panHandlers: {} }) }
}))
vi.mock('./primitives.js', () => ({
  LumenButton: (props: Record<string, unknown>): ReactElement => createElement('Button', props),
  LumenText: (props: Record<string, unknown>): ReactElement => createElement('Text', props)
}))
vi.mock('./shared-components.js', () => ({
  LumenCard: (props: Record<string, unknown>): ReactElement => createElement('Card', props)
}))
vi.mock('./theme-context.js', () => ({ useLumenTheme: () => ({ spacing: { md: 16, xs: 4 } }) }))
const roots: Root[] = []

afterEach(() => {
  act(() => {
    for (const root of roots) root.unmount()
  })
  roots.length = 0
})
const render = (props: Partial<LumenKanbanColumnProps> = {}): {
  root: Root
  change: ReturnType<typeof vi.fn<LumenKanbanColumnProps['onColumnChange']>>
  add: ReturnType<typeof vi.fn>
  open: ReturnType<typeof vi.fn>
} => {
  const root = createRoot()
  const change = vi.fn<LumenKanbanColumnProps['onColumnChange']>()
  const add = vi.fn()
  const open = vi.fn()

  roots.push(root)
  act(() => {
    root.render(
      <LumenKanbanColumn
        column={{ id: 'todo',
          label: 'Todo',
          cards: [
            { id: 'a', label: 'A' }, { id: 'b', label: 'B' }
          ],
          capacity: 3 }}
        onColumnChange={change}
        onAdd={add}
        onCardPress={open}
        {...props}
      />
    )
  })

  return { root, change, add, open }
}
const read = (instance: TestInstance, key: string): unknown => (instance.props as Record<string, unknown>)[key]
const button = (root: Root, label: string): TestInstance => {
  const match = root.container.queryAll(instance => instance.type === 'Button' && read(instance, 'children') === label)[0]

  if (!match) throw new Error(`Missing button: ${label}`)

  return match
}
const press = (instance: TestInstance): void => {
  const action = read(instance, 'onPress')

  if (typeof action !== 'function') throw new Error('Missing action')
  act(() => {
    Reflect.apply(action, undefined, [])
  })
}

test('standalone column proposes reorder with stable identity and leaves host content unchanged', () => {
  const { root, change, add, open } = render({
    formatMove: (card, position) => `${card}/${position}`,
    formatCount: (count, capacity) => `${count}:${capacity ?? 0}`,
    addLabel: 'Create'
  })

  press(button(root, 'A/2'))
  expect(change).toHaveBeenCalledWith({ id: 'todo',
    label: 'Todo',
    cards: [
      { id: 'b', label: 'B' }, { id: 'a', label: 'A' }
    ],
    capacity: 3 })
  expect(root.container.queryAll(instance => instance.type === 'Text' && read(instance, 'children') === '2:3')).toHaveLength(1)
  press(button(root, 'Create'))
  press(button(root, 'Open A'))
  expect(add).toHaveBeenCalledOnce()
  expect(open).toHaveBeenCalledWith('a')
  expect(root.container.queryAll(instance => instance.type === 'Card')).toHaveLength(2)
})

test('read-only blocks mutation while allowing host details; disabled blocks all callbacks', () => {
  const readOnly = render({ readOnly: true })

  press(button(readOnly.root, 'Move A to position 2'))
  press(button(readOnly.root, 'Add card'))
  press(button(readOnly.root, 'Open A'))
  expect(readOnly.change).not.toHaveBeenCalled()
  expect(readOnly.add).not.toHaveBeenCalled()
  expect(readOnly.open).toHaveBeenCalledWith('a')
  const disabled = render({ disabled: true })

  for (const label of ['Move A to position 2', 'Add card', 'Open A']) press(button(disabled.root, label))
  expect(disabled.change).not.toHaveBeenCalled()
  expect(disabled.add).not.toHaveBeenCalled()
  expect(disabled.open).not.toHaveBeenCalled()
})

test('capacity blocks add without blocking internal reorder; disabled cards reject moves', () => {
  const { root, add, change, open } = render({ column: { id: 'todo',
    label: 'Todo',
    cards: [
      { id: 'a', label: 'A', disabled: true }, { id: 'b', label: 'B' }
    ],
    capacity: 2 } })

  expect(read(button(root, 'Add card'), 'disabled')).toBe(true)
  press(button(root, 'Add card'))
  press(button(root, 'Move A to position 2'))
  press(button(root, 'Open A'))
  expect(add).not.toHaveBeenCalled()
  expect(change).not.toHaveBeenCalled()
  expect(open).not.toHaveBeenCalled()
  press(button(root, 'Move B to position 1'))
  expect(change).toHaveBeenCalledOnce()
})

test('status states hide stale controls, empty columns retain host add', () => {
  for (const props of [{ loading: true }, { error: 'Unavailable' }, { column: { id: '', label: '', cards: [] } }]) {
    const { root } = render(props)

    expect(root.container.queryAll(instance => instance.type === 'Button')).toHaveLength(0)
  }
  const { root, add } = render({ column: { id: 'empty', label: 'Empty', cards: [] }, emptyLabel: 'Nothing here' })

  expect(root.container.queryAll(instance => instance.type === 'Text' && read(instance, 'children') === 'Nothing here')).toHaveLength(1)
  press(button(root, 'Add card'))
  expect(add).toHaveBeenCalledOnce()
})

test('reorder alternatives expose only reachable neighboring positions, including after host changes', () => {
  const { root, change } = render({ column: { id: 'todo',
    label: 'Todo',
    cards: [
      { id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }
    ] } })
  const moves = (): unknown[] => root.container.queryAll(instance => instance.type === 'Button' &&
    typeof read(instance, 'children') === 'string' && String(read(instance, 'children')).startsWith('Move '))
    .map(instance => read(instance, 'children'))

  expect(moves()).toEqual(['Move A to position 2', 'Move B to position 1', 'Move B to position 3', 'Move C to position 2'])
  press(button(root, 'Move B to position 3'))
  expect(change).toHaveBeenCalledOnce()
  expect(moves()).toEqual(['Move A to position 2', 'Move B to position 1', 'Move B to position 3', 'Move C to position 2'])
  act(() => {
    root.render(<LumenKanbanColumn column={{ id: 'todo', label: 'Todo', cards: [{ id: 'b', label: 'B' }] }} onColumnChange={change} />)
  })
  expect(moves()).toEqual([])
})
