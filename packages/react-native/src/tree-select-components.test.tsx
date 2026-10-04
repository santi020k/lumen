import { act, createElement, type ReactElement } from 'react'

import { createRoot, type Root, type TestInstance } from 'test-renderer'
import { afterEach, expect, test, vi } from 'vitest'

import { LumenTreeSelect, type LumenTreeSelectProps } from './tree-select-components.js'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
vi.mock('react-native', () => ({
  View: (props: Record<string, unknown>): ReactElement => createElement('View', props),
  FlatList: (props: {
    data: readonly unknown[]
    renderItem: (parameters: { item: unknown }) => ReactElement
    ListEmptyComponent: ReactElement
  }): ReactElement => createElement('ScrollView', props, props.data.length === 0 ? props.ListEmptyComponent : props.data.map(item => props.renderItem({ item })))
}))
vi.mock('./primitives.js', () => ({
  LumenButton: (props: Record<string, unknown>): ReactElement => createElement('Button', props),
  LumenText: (props: Record<string, unknown>): ReactElement => createElement('Text', props)
}))
vi.mock('./theme-context.js', () => ({ useLumenTheme: () => ({ spacing: { sm: 8 } }) }))
const roots: Root[] = []
const nodes = [
  { id: 'root', label: 'Root' },
  { id: 'leaf', label: 'Leaf', parentId: 'root' },
  { id: 'disabled', label: 'Disabled', disabled: true },
  { id: 'child', label: 'Child', parentId: 'disabled' }
]

afterEach(() => {
  act(() => {
    for (const root of roots) root.unmount()
  })
  roots.length = 0
})
const render = (props: Partial<LumenTreeSelectProps> = {}): { root: Root, change: ReturnType<typeof vi.fn> } => {
  const root = createRoot()
  const change = vi.fn()

  roots.push(root)
  act(() => {
    root.render(<LumenTreeSelect label="Team" nodes={nodes} value="unknown" onValueChange={change} {...props} />)
  })

  return { root, change }
}
const read = (instance: TestInstance, key: string): unknown => (instance.props as Record<string, unknown>)[key]
const find = (root: Root, label: string): TestInstance => {
  const match = root.container.queryAll(instance => instance.type === 'Button' && read(instance, 'accessibilityLabel') === label)[0]

  if (!match) throw new Error(`Missing ${label}`)

  return match
}
const press = (instance: TestInstance): void => {
  const action = read(instance, 'onPress')

  if (typeof action !== 'function') throw new Error('Missing action')
  act(() => {
    Reflect.apply(action, undefined, [])
  })
}

test('disclosure retains unknown values and choosing hierarchical row proposes ID then closes', () => {
  const { root, change } = render({ unknownSelectionLabel: 'Missing', formatOption: (name, path, level) => `${name}:${path.length}:${level}` })

  expect(change).not.toHaveBeenCalled()
  press(find(root, 'Team: Missing'))
  expect(root.container.queryAll(instance => instance.type === 'Button')).toHaveLength(5)
  expect(read(find(root, 'Child:2:2'), 'disabled')).toBe(true)
  press(find(root, 'Leaf:2:2'))
  expect(change).toHaveBeenCalledWith('leaf')
  expect(root.container.queryAll(instance => instance.type === 'ScrollView')).toHaveLength(0)
})

test('parent selection works and selected-row activation closes without duplicate change', () => {
  const { root, change } = render({ value: 'root' })

  press(find(root, 'Team: Root'))
  press(find(root, 'Root, level 1'))
  expect(change).not.toHaveBeenCalled()
  expect(root.container.queryAll(instance => instance.type === 'ScrollView')).toHaveLength(0)
})

test('read-only permits browsing but prevents selection; disabled prevents opening', () => {
  const readOnly = render({ readOnly: true })

  press(find(readOnly.root, 'Team: Unavailable selection'))
  press(find(readOnly.root, 'Root / Leaf, level 2'))
  expect(readOnly.change).not.toHaveBeenCalled()
  expect(readOnly.root.container.queryAll(instance => instance.type === 'ScrollView')).toHaveLength(1)
  const disabled = render({ disabled: true })

  press(find(disabled.root, 'Team: Unavailable selection'))
  expect(disabled.root.container.queryAll(instance => instance.type === 'ScrollView')).toHaveLength(0)
  expect(disabled.change).not.toHaveBeenCalled()
})

test('status and invalid graph guards hide stale controls; empty options retain disclosure', () => {
  for (const props of [{ loading: true }, { error: '' }, { nodes: [{ id: 'cycle', label: '', parentId: 'cycle' }] }]) {
    const { root, change } = render(props)

    expect(root.container.queryAll(instance => instance.type === 'Button')).toHaveLength(0)
    expect(change).not.toHaveBeenCalled()
  }
  const { root } = render({ nodes: [], value: null, placeholder: 'Choose', emptyLabel: 'Nothing here' })

  press(find(root, 'Team: Choose'))
  expect(root.container.queryAll(instance => instance.type === 'Text' && read(instance, 'children') === 'Nothing here')).toHaveLength(1)
})
