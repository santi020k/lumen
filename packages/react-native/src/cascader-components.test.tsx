import { act, createElement, type ReactElement } from 'react'

import { createRoot, type Root, type TestInstance } from 'test-renderer'
import { afterEach, expect, test, vi } from 'vitest'

import { LumenCascader, type LumenCascaderProps } from './cascader-components.js'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
vi.mock('react-native', () => ({ View: (props: Record<string, unknown>): ReactElement => createElement('View', props) }))
vi.mock('./primitives.js', () => ({
  LumenButton: (props: Record<string, unknown>): ReactElement => createElement('Button', props),
  LumenText: (props: Record<string, unknown>): ReactElement => createElement('Text', props)
}))
vi.mock('./theme-context.js', () => ({ useLumenTheme: () => ({ spacing: { sm: 8 } }) }))
const roots: Root[] = []

afterEach(() => {
  act(() => {
    for (const root of roots) root.unmount()
  })
  roots.length = 0
})
const render = (element: ReactElement): Root => {
  const root = createRoot()

  roots.push(root)
  act(() => {
    root.render(element)
  })

  return root
}
const read = (instance: TestInstance, key: string): unknown => {
  const props = instance.props as Record<string, unknown>

  return props[key]
}
const button = (root: Root, name: string): TestInstance => {
  const match = root.container.queryAll(instance => instance.type === 'Button' && read(instance, 'accessibilityLabel') === name)[0]

  if (!match) throw new Error(`Missing button ${name}`)

  return match
}
const press = (instance: TestInstance): void => {
  const action = read(instance, 'onPress')

  if (typeof action !== 'function') throw new Error('Missing action')

  act(() => {
    Reflect.apply(action, undefined, [])
  })
}
const nodes = [{ id: 'r', label: 'Root' }, { id: 'c', label: 'Child', parentId: 'r' }]

test('drills into branches without committing; emits canonical leaf path and supports back', () => {
  const selection = vi.fn()
  const root = render(<LumenCascader label="Place" nodes={nodes} selectedPath={['unknown']} onSelectionChange={selection} backLabel="Volver" formatDisclosure={name => `Abrir ${name}`} />)

  press(button(root, 'Abrir Root'))
  expect(selection).not.toHaveBeenCalled()
  press(button(root, 'Child'))
  expect(selection).toHaveBeenCalledWith(['r', 'c'])
  press(button(root, 'Volver'))
  expect(button(root, 'Abrir Root')).toBeDefined()
})
test('read-only allows browsing but blocks leaf writes, including manually invoked handlers', () => {
  const selection = vi.fn()
  const root = render(<LumenCascader label="Place" nodes={nodes} selectedPath={[]} onSelectionChange={selection} readOnly />)

  press(button(root, 'Open Root'))
  expect(read(button(root, 'Child'), 'disabled')).toBe(true)
  press(button(root, 'Child'))
  expect(selection).not.toHaveBeenCalled()
})
test('disabled and status surfaces hide or block controls', () => {
  const selection = vi.fn()
  const root = render(<LumenCascader label="Place" nodes={nodes} selectedPath={[]} onSelectionChange={selection} disabled />)

  press(button(root, 'Open Root'))
  expect(root.container.queryAll(instance => instance.type === 'Button')).toHaveLength(1)
  for (const state of [{ loading: true }, { error: 'Offline' }]) {
    act(() => {
      root.render(<LumenCascader label="Place" nodes={nodes} selectedPath={[]} onSelectionChange={selection} {...state} />)
    })
    expect(root.container.queryAll(instance => instance.type === 'Button')).toHaveLength(0)
  }

  expect(selection).not.toHaveBeenCalled()
})

test('treats malformed decoded controlled paths as unavailable in every content state', () => {
  for (const value of [null, {}, [null], [7], Array(1)]) {
    for (const extra of [{}, { loading: true }, { nodes: [{ id: 'bad', label: 'Bad', parentId: 'missing' }] }]) {
      const props: LumenCascaderProps = { label: 'Category', nodes, selectedPath: [], onSelectionChange: vi.fn(), ...extra }
      Object.defineProperty(props, 'selectedPath', { value, enumerable: true })
      const root = render(<LumenCascader {...props} />)
      expect(root.container.queryAll(node => node.type === 'Text' && read(node, 'children') === 'Unavailable selection')).toHaveLength(1)
    }
  }
})
