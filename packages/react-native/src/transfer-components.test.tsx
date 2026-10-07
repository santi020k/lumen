import { act, createElement, type ReactElement } from 'react'

import { createRoot, type Root, type TestInstance } from 'test-renderer'
import { afterEach, expect, test, vi } from 'vitest'

import { LumenTransfer, type LumenTransferProps } from './transfer-components.js'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
vi.mock('react-native', () => ({
  View: (props: Record<string, unknown>): ReactElement => createElement('View', props),
  ScrollView: (props: Record<string, unknown>): ReactElement => createElement('ScrollView', props)
}))
vi.mock('./primitives.js', () => ({
  LumenText: (props: Record<string, unknown>): ReactElement => createElement('Text', props),
  LumenButton: (props: Record<string, unknown>): ReactElement => createElement('Button', props)
}))
vi.mock('./selection-components.js', () => ({
  LumenCheckbox: (props: Record<string, unknown>): ReactElement => createElement('Checkbox', props)
}))
vi.mock('./theme-context.js', () => ({ useLumenTheme: () => ({ colors: { line: '#eee' }, spacing: { sm: 12 } }) }))
const roots: Root[] = []
afterEach(() => {
  act(() => {
    roots.forEach(root => {
      root.unmount()
    })
  })
  roots.length = 0
})
const render = (props: LumenTransferProps): Root => {
  const root = createRoot()
  roots.push(root)
  act(() => {
    root.render(<LumenTransfer {...props} />)
  })
  return root
}
const read = (instance: TestInstance, key: string): unknown => (instance.props as Record<string, unknown>)[key]
const invoke = (instance: TestInstance, key: string, args: readonly unknown[] = []): void => {
  const callback = read(instance, key)
  if (typeof callback !== 'function') throw new Error('Missing handler')
  act(() => {
    Reflect.apply(callback, undefined, args)
  })
}
const find = (root: Root, label: string): TestInstance => {
  const match = root.container.queryAll(instance => (instance.type === 'Button' || instance.type === 'Checkbox') && read(instance, 'accessibilityLabel') === label)[0]
  if (!match) throw new Error(`Missing ${label}`)
  return match
}
const props = (): LumenTransferProps => ({ label: 'Transfer', items: [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta', disabled: true }], value: { selectedIds: ['missing'], checkedIds: ['a', 'b', 'unknown'] }, onValueChange: vi.fn() })
test('controlled checkbox and move callbacks preserve host input and hidden IDs', () => {
  const input = props()
  const root = render(input)
  invoke(find(root, 'Alpha'), 'onCheckedChange', [false])
  expect(input.onValueChange).toHaveBeenCalledWith({ selectedIds: ['missing'], checkedIds: ['b', 'unknown'] })
  invoke(find(root, 'Move to selected'), 'onPress')
  expect(input.onValueChange).toHaveBeenCalledWith({ selectedIds: ['missing', 'a'], checkedIds: ['b', 'unknown'] })
  expect(input.value.selectedIds).toEqual(['missing'])
})
test('read-only disabled and per-item disabled guard direct handlers', () => {
  for (const state of [{ disabled: true }, { readOnly: true }]) {
    const input = props()
    const root = render({ ...input, ...state })
    invoke(find(root, 'Alpha'), 'onCheckedChange', [false])
    invoke(find(root, 'Move to selected'), 'onPress')
    expect(input.onValueChange).not.toHaveBeenCalled()
  }
  const input = props()
  const root = render(input)
  invoke(find(root, 'Beta'), 'onCheckedChange', [false])
  expect(input.onValueChange).not.toHaveBeenCalled()
})
test('invalid loading and error hide stale controls; valid empty items retain disabled moves', () => {
  for (const state of [{ loading: true }, { error: 'Unavailable' }, { items: [...props().items, ...props().items] }, { value: { selectedIds: ['a', 'a'], checkedIds: [] } }]) {
    const root = render({ ...props(), ...state })
    expect(root.container.queryAll(instance => instance.type === 'Checkbox' || instance.type === 'Button')).toHaveLength(0)
  }
  const root = render({ ...props(), items: [] })
  expect(read(find(root, 'Move to selected'), 'disabled')).toBe(true)
})
