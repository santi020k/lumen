import { act, createElement, type ReactElement } from 'react'

import { createRoot, type Root, type TestInstance } from 'test-renderer'
import { afterEach, expect, test, vi } from 'vitest'

import { LumenKanbanBoard, type LumenKanbanBoardProps } from './kanban-board-components.js'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
vi.mock('react-native', () => ({
  View: (props: Record<string, unknown>): ReactElement => createElement('View', props),
  ScrollView: (props: Record<string, unknown>): ReactElement => createElement('ScrollView', props),
  Pressable: (props: Record<string, unknown>): ReactElement => createElement('Pressable', props),
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
const render = (props: Partial<LumenKanbanBoardProps> = {}): { root: Root, change: ReturnType<typeof vi.fn> } => {
  const root = createRoot()
  const change = vi.fn()

  roots.push(root)
  act(() => {
    root.render(
      <LumenKanbanBoard
        label="Work"
        columns={[
          { id: 'todo', label: 'Todo', cards: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] },
          { id: 'done', label: 'Done', cards: [], capacity: 1 }
        ]}
        onColumnsChange={change}
        {...props}
      />
    )
  })

  return { root, change }
}
const read = (instance: TestInstance, key: string): unknown => (instance.props as Record<string, unknown>)[key]
const press = (instance: TestInstance): void => {
  const action = read(instance, 'onPress')

  if (typeof action !== 'function') throw new Error('Missing action')
  act(() => {
    Reflect.apply(action, undefined, [])
  })
}

test('button alternatives localize move labels and propose controlled columns', () => {
  const { root, change } = render({ formatMove: (card, column, position) => `${card}/${column}/${position}` })
  const button = root.container.queryAll(instance => instance.type === 'Button' && read(instance, 'accessibilityLabel') === 'A/Done/1')[0]

  if (!button) throw new Error('Missing move alternative')
  press(button)
  expect(change).toHaveBeenCalledWith([
    { id: 'todo', label: 'Todo', cards: [{ id: 'b', label: 'B' }] },
    { id: 'done', label: 'Done', cards: [{ id: 'a', label: 'A' }], capacity: 1 }
  ])
  expect(root.container.queryAll(instance => instance.type === 'Text' && read(instance, 'children') === 'A')).toHaveLength(1)
})

test('read-only and disabled guard callbacks even if disabled controls are invoked', () => {
  for (const props of [{ readOnly: true }, { disabled: true }]) {
    const { root, change } = render(props)
    const buttons = root.container.queryAll(instance => instance.type === 'Button')

    expect(buttons.length).toBeGreaterThan(0)
    for (const button of buttons) {
      expect(read(button, 'disabled')).toBe(true)
      if (typeof read(button, 'onPress') === 'function') press(button)
    }
    expect(change).not.toHaveBeenCalled()
  }
})

test('loading, error, invalid and empty states hide stale movement controls', () => {
  for (const props of [{ loading: true, loadingLabel: 'Waiting' },
    { error: 'Unavailable' },
    { columns: [{ id: '', label: '', cards: [] }] },
    { columns: [] }]) {
    const { root, change } = render(props)

    expect(root.container.queryAll(instance => instance.type === 'Button')).toHaveLength(0)
    expect(root.container.queryAll(instance => instance.type === 'Pressable')).toHaveLength(0)
    expect(change).not.toHaveBeenCalled()
  }
})
