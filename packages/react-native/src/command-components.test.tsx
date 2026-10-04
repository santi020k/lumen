import { act, createElement, type ReactElement } from 'react'

import { createRoot, type Root, type TestInstance } from 'test-renderer'
import { afterEach, expect, test, vi } from 'vitest'

import { LumenCommand, type LumenCommandProps } from './command-components.js'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
vi.mock('react-native', () => ({
  View: (props: Record<string, unknown>): ReactElement => createElement('View', props),
  ScrollView: (props: Record<string, unknown>): ReactElement => createElement('ScrollView', props)
}))
vi.mock('./primitives.js', () => ({
  LumenText: (props: Record<string, unknown>): ReactElement => createElement('Text', props),
  LumenButton: (props: Record<string, unknown>): ReactElement => createElement('Button', props),
  LumenTextField: (props: Record<string, unknown>): ReactElement => createElement('Input', props)
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
const render = (props: LumenCommandProps): Root => {
  const root = createRoot()
  roots.push(root)
  act(() => {
    root.render(<LumenCommand {...props} />)
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
  const match = root.container.queryAll(instance => (instance.type === 'Button' || instance.type === 'Input') && read(instance, 'accessibilityLabel') === label)[0]
  if (!match) throw new Error(`Missing ${label}`)
  return match
}
const props = (): LumenCommandProps => ({ label: 'Commands', open: true, onOpenChange: vi.fn(), query: '', onQueryChange: vi.fn(), activeId: 'docs', onActiveIdChange: vi.fn(), onSelect: vi.fn(), groups: [{ id: 'main', label: 'Navigation', items: [{ id: 'docs', label: 'Documentation' }, { id: 'blocked', label: 'Disabled', disabled: true }, { id: 'theme', label: 'Toggle theme' }] }] })
test('query, navigation and command activation are controlled; host decides close/execution', () => {
  const input = props()
  const root = render(input)
  invoke(find(root, 'Search commands'), 'onChangeText', ['theme'])
  expect(input.onQueryChange).toHaveBeenCalledWith('theme')
  invoke(find(root, 'Next command'), 'onPress')
  expect(input.onActiveIdChange).toHaveBeenCalledWith('theme')
  invoke(find(root, 'Toggle theme'), 'onPress')
  expect(input.onSelect).toHaveBeenCalledWith(input.groups[0]?.items[2])
  expect(input.onOpenChange).not.toHaveBeenCalled()
  expect(input.query).toBe('')
})
test('input keyboard navigation and submission use current visible enabled highlight', () => {
  const input = props()
  const root = render(input)
  invoke(find(root, 'Search commands'), 'onKeyPress', [{ nativeEvent: { key: 'ArrowDown' } }])
  expect(input.onActiveIdChange).toHaveBeenCalledWith('theme')
  invoke(find(root, 'Search commands'), 'onSubmitEditing')
  expect(input.onSelect).toHaveBeenCalledWith(input.groups[0]?.items[0])
  invoke(find(root, 'Search commands'), 'onKeyPress', [{ nativeEvent: { key: 'Escape' } }])
  expect(input.onOpenChange).toHaveBeenCalledWith(false)
  const stale = props()
  const staleRoot = render({ ...stale, query: 'theme' })
  invoke(find(staleRoot, 'Search commands'), 'onSubmitEditing')
  expect(stale.onSelect).not.toHaveBeenCalled()
})
test('read-only disabled and command-level disabled prevent direct execution; close stays available', () => {
  for (const state of [{ disabled: true }, { readOnly: true }]) {
    const input = props()
    const root = render({ ...input, ...state })
    invoke(find(root, 'Documentation'), 'onPress')
    invoke(find(root, 'Search commands'), 'onChangeText', ['theme'])
    invoke(find(root, 'Next command'), 'onPress')
    expect(input.onSelect).not.toHaveBeenCalled()
    expect(input.onQueryChange).not.toHaveBeenCalled()
    expect(input.onActiveIdChange).not.toHaveBeenCalled()
    invoke(find(root, 'Close commands'), 'onPress')
    expect(input.onOpenChange).toHaveBeenCalledWith(false)
  }
  const input = props()
  invoke(find(render(input), 'Disabled'), 'onPress')
  expect(input.onSelect).not.toHaveBeenCalled()
})
test('status states hide stale input/actions; closed surface exposes no controls', () => {
  for (const state of [{ loading: true }, { error: 'Unavailable' }, { groups: [...props().groups, ...props().groups] }]) {
    const root = render({ ...props(), ...state })
    expect(root.container.queryAll(instance => instance.type === 'Input')).toHaveLength(0)
    expect(root.container.queryAll(instance => instance.type === 'Button')).toHaveLength(1)
  }
  expect(render({ ...props(), open: false }).container.queryAll(instance => instance.type === 'Button')).toHaveLength(0)
})
