import { act, createElement, type ReactElement, type Ref, useImperativeHandle } from 'react'

import { createRoot, type TestInstance } from 'test-renderer'
import { expect, test, vi } from 'vitest'

import { LumenMentions } from './mentions-components.js'
import type { LumenMentionOption, LumenMentionsValue } from './mentions-recipes.js'

const native = vi.hoisted(() => ({ focus: vi.fn(), blur: vi.fn() }))
const nativePlatform = vi.hoisted(() => ({ OS: 'ios' }))
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
vi.mock('react-native', () => {
  const host = (name: string) => (props: Record<string, unknown>): ReactElement => createElement(name, props)

  return { View: host('View'),
    Text: host('Text'),
    Pressable: host('Pressable'),
    ActivityIndicator: host('ActivityIndicator'),
    TextInput: ({ ref, ...props }: Record<string, unknown> & { ref?: Ref<typeof native> }): ReactElement => {
      useImperativeHandle(ref, () => native)

      return createElement('TextInput', props)
    },
    Platform: nativePlatform }
})
vi.mock('react-native-svg', () => {
  const host = (name: string) => (props: Record<string, unknown>): ReactElement => createElement(name, props)

  return Object.fromEntries(['Svg',
    'Path',
    'Rect',
    'Circle',
    'Line',
    'Polyline',
    'Polygon',
    'G',
    'Defs',
    'Stop',
    'LinearGradient',
    'Ellipse',
    'Text'].map(name => [name, host(name)]))
})

const prop = (node: TestInstance, name: string): unknown => (node.props as Record<string, unknown>)[name]
const invoke = async (node: TestInstance, name: string, argument?: unknown): Promise<void> => {
  const callback = prop(node, name)
  const callable = (input: unknown): input is (argument: unknown) => void => typeof input === 'function'

  if (!callable(callback)) throw new Error('Missing native input handler')

  await act(async () => {
    await Promise.resolve()
    callback(argument)
  })
}

test('inserts only after native editing ends and revalidates latest host option/text/range', async () => {
  const root = createRoot({ publicTextComponentTypes: ['Text'], textComponentTypes: ['Text'] })
  let value: LumenMentionsValue = { text: '😀 @al!', selection: { start: 6, end: 6 } }
  let options: readonly LumenMentionOption[] = [{ id: 'alice', label: 'Alice option', value: 'alice' }]
  const emissions: LumenMentionsValue[] = []
  const render = async (): Promise<void> => {
    await act(async () => {
      await Promise.resolve()
      root.render(<LumenMentions label="Message" value={value} options={options} onValueChange={next => emissions.push(next)} />)
    })
  }
  const find = (type: string): TestInstance => {
    const node = root.container.queryAll(node => node.type === type)[0]

    if (!node) throw new Error('Missing mentions control')

    return node
  }

  await render()
  await invoke(find('TextInput'), 'onFocus')
  const preventDefault = vi.fn()

  await invoke(find('Pressable'), 'onPointerDown', { preventDefault })
  expect(preventDefault).not.toHaveBeenCalled()
  await invoke(find('Pressable'), 'onPress')
  expect(native.blur).toHaveBeenCalled()
  expect(emissions).toEqual([])
  await invoke(find('TextInput'), 'onEndEditing', { nativeEvent: { text: value.text } })
  expect(emissions).toEqual([{ text: '😀 @alice !', selection: { start: 10, end: 10 } }])
  value = emissions[0] ?? value
  await render()
  expect(native.focus).toHaveBeenCalled()
  value = { text: '@al', selection: { start: 3, end: 3 } }
  await render()
  await invoke(find('TextInput'), 'onFocus')
  await invoke(find('Pressable'), 'onPress')
  options = []
  await render()
  await invoke(find('TextInput'), 'onEndEditing', { nativeEvent: { text: '@al' } })
  expect(emissions).toHaveLength(1)
  options = [{ id: 'alice', label: 'Alice option', value: 'alice' }]
  await render()
  await invoke(find('TextInput'), 'onFocus')
  await invoke(find('Pressable'), 'onPress')
  value = { text: '@bo', selection: { start: 3, end: 3 } }
  await render()
  await invoke(find('TextInput'), 'onEndEditing', { nativeEvent: { text: '@al' } })
  expect(emissions).toHaveLength(1)
  await act(async () => {
    await Promise.resolve()
    root.unmount()
  })
})

test('guards composing, disabled, read-only and invalid host ranges without repair', async () => {
  const root = createRoot({ publicTextComponentTypes: ['Text'], textComponentTypes: ['Text'] })
  const value: LumenMentionsValue = { text: '@al', selection: { start: 3, end: 3 } }
  const emitted = vi.fn()

  for (const state of [{ isComposing: true }, { disabled: true }, { readOnly: true }]) {
    await act(async () => {
      await Promise.resolve()
      root.render(
        <LumenMentions
          label="Message"
          value={value}
          options={[{ id: 'a', label: 'Alice', value: 'alice' }]}
          onValueChange={emitted}
          {...state}
        />
      )
    })
    const input = root.container.queryAll(node => node.type === 'TextInput')[0]

    if (!input) throw new Error('Missing input')

    await invoke(input, 'onFocus')
    expect(root.container.queryAll(node => node.type === 'Pressable')).toHaveLength(0)
    await invoke(input, 'onKeyPress', { nativeEvent: { key: 'Enter' } })
    await invoke(input, 'onEndEditing', { nativeEvent: { text: '@al' } })
  }
  const invalid = { ...value, selection: { start: -1, end: -1 } }

  await act(async () => {
    await Promise.resolve()
    root.render(<LumenMentions label="Message" value={invalid} options={[]} onValueChange={emitted} />)
  })
  const input = root.container.queryAll(node => node.type === 'TextInput')[0]

  if (!input) throw new Error('Missing input')

  expect(prop(input, 'selection')).toBeUndefined()
  expect(invalid.selection).toEqual({ start: -1, end: -1 })
  expect(emitted).not.toHaveBeenCalled()
  await act(async () => {
    await Promise.resolve()
    root.unmount()
  })
})

test('RN Web validates final native blur text because it has no end-editing event', async () => {
  nativePlatform.OS = 'web'
  const root = createRoot({ publicTextComponentTypes: ['Text'], textComponentTypes: ['Text'] })
  const emitted = vi.fn()
  const value: LumenMentionsValue = { text: '@al', selection: { start: 3, end: 3 } }

  try {
    await act(async () => {
      await Promise.resolve()
      root.render(
        <LumenMentions
          label="Message"
          value={value}
          options={[{ id: 'alice', label: 'Alice', value: 'alice' }]}
          onValueChange={emitted}
        />
      )
    })
    const input = root.container.queryAll(node => node.type === 'TextInput')[0]

    if (!input) throw new Error('Missing native input')

    await invoke(input, 'onFocus')
    const option = root.container.queryAll(node => node.type === 'Pressable')[0]

    if (!option) throw new Error('Missing option')

    const prevented = vi.fn()

    await invoke(option, 'onPointerDown', { preventDefault: prevented })
    expect(prevented).toHaveBeenCalled()
    await invoke(input, 'onKeyPress', { nativeEvent: { key: 'Enter', isComposing: true }, preventDefault: prevented })
    expect(emitted).not.toHaveBeenCalled()
    await invoke(input, 'onKeyPress', { nativeEvent: { key: 'Enter', keyCode: 229 }, preventDefault: prevented })
    expect(emitted).not.toHaveBeenCalled()
    await invoke(input, 'onKeyPress', { nativeEvent: { key: 'End' }, preventDefault: prevented })
    expect(prevented).toHaveBeenCalledTimes(2)
    await invoke(option, 'onPress')
    await invoke(input, 'onBlur', { nativeEvent: { text: '@al' } })
    expect(emitted).toHaveBeenCalledWith({ text: '@alice ', selection: { start: 7, end: 7 } })
  } finally {
    nativePlatform.OS = 'ios'
    await act(async () => {
      await Promise.resolve()
      root.unmount()
    })
  }
})
