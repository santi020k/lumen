import { act, createElement, type ReactElement, type Ref, useImperativeHandle } from 'react'
import { View } from 'react-native'

import { createRoot, type TestInstance } from 'test-renderer'
import { expect, test, vi } from 'vitest'

import { LumenCarousel } from './carousel-components.js'

const scrollFixture = vi.hoisted(() => ({ scrollTo: vi.fn() }))

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

vi.mock('react-native', () => {
  const host = (name: string) => (props: Record<string, unknown>): ReactElement => createElement(name, props)
  return { View: host('View'),
    ScrollView: ({ ref, ...props }: Record<string, unknown> & {
      ref?: Ref<{ scrollTo: (options: unknown) => void }>
    }): ReactElement => {
      useImperativeHandle(ref, () => ({ scrollTo: scrollFixture.scrollTo }))
      return createElement('ScrollView', props)
    },
    Text: host('Text'),
    Pressable: host('Pressable'),
    TextInput: host('TextInput'),
    ActivityIndicator: host('ActivityIndicator'),
    Platform: { OS: 'ios' } }
})
vi.mock('react-native-svg', () => {
  const host = (name: string) => (props: Record<string, unknown>): ReactElement => createElement(name, props)
  return Object.fromEntries(['Svg', 'Path', 'Rect', 'Circle', 'Line', 'Polyline', 'Polygon', 'G', 'Defs', 'Stop', 'LinearGradient', 'Ellipse', 'Text'].map(name => [name, host(name)]))
})

const readProp = (instance: TestInstance, name: string): unknown => {
  const props = instance.props as Record<string, unknown>
  return props[name]
}

test('controls navigation, reconciles swipes and guards disabled and status states', async () => {
  const root = createRoot({ publicTextComponentTypes: ['Text'], textComponentTypes: ['Text'] })
  const slides = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }]
  const emissions: number[] = []
  let index = 0
  let disabled = false
  let status: 'ready' | 'loading' | 'error' = 'ready'
  const render = async (): Promise<void> => {
    await act(async () => {
      await Promise.resolve()
      root.render(
        <LumenCarousel
          label="Slides"
          slides={slides}
          index={index}
          onIndexChange={next => emissions.push(next)}
          renderSlide={slide => <View accessibilityLabel={slide.label} />}
          disabled={disabled}
          status={status}
          labels={{ loading: 'Loading fixture', invalid: 'Invalid fixture' }}
        />
      )
    })
  }
  const find = (predicate: (node: TestInstance) => boolean): TestInstance => {
    const found = root.container.queryAll(predicate)[0]
    if (!found) throw new Error('Missing carousel control')
    return found
  }
  const invoke = async (node: TestInstance, key: string, input?: unknown): Promise<void> => {
    const callback = readProp(node, key)
    const isCallback = (value: unknown): value is (argument: unknown) => void => typeof value === 'function'
    if (!isCallback(callback)) throw new Error('Missing handler')
    await act(async () => {
      await Promise.resolve()
      callback(input)
    })
  }
  const radio = (name: string): TestInstance => find(node => node.type === 'Pressable' &&
    readProp(node, 'accessibilityRole') === 'radio' && readProp(node, 'accessibilityLabel') === name)
  const viewport = (): TestInstance => find(node => node.type === 'ScrollView')
  await render()
  expect(readProp(find(node => node.type === 'View' && readProp(node, 'accessibilityLabel') === 'B, slide 2 of 3'), 'aria-hidden')).toBe(true)
  expect(readProp(find(node => node.type === 'View' && readProp(node, 'accessibilityLabel') === 'A, slide 1 of 3'), 'aria-hidden')).toBe(false)
  await invoke(radio('B, slide 2 of 3'), 'onPress')
  expect(emissions).toEqual([1])
  expect(readProp(radio('A, slide 1 of 3'), 'aria-checked')).toBe(true)
  expect(readProp(radio('B, slide 2 of 3'), 'aria-checked')).toBe(false)
  expect(readProp(radio('A, slide 1 of 3'), 'accessibilityState')).toEqual({ checked: true, selected: true, disabled: false })
  index = 1
  await render()
  expect(readProp(radio('B, slide 2 of 3'), 'accessibilityState')).toEqual({ checked: true, selected: true, disabled: false })
  await invoke(viewport(), 'onLayout', { nativeEvent: { layout: { width: 350 } } })
  await invoke(viewport(), 'onMomentumScrollEnd', { nativeEvent: { contentOffset: { x: 700 } } })
  expect(emissions).toEqual([1, 2])
  expect(scrollFixture.scrollTo).toHaveBeenLastCalledWith({ x: 350, animated: false })
  disabled = true
  await render()
  await invoke(radio('C, slide 3 of 3'), 'onPress')
  await invoke(viewport(), 'onMomentumScrollEnd', { nativeEvent: { contentOffset: { x: 0 } } })
  expect(emissions).toEqual([1, 2])
  expect(readProp(viewport(), 'scrollEnabled')).toBe(false)
  status = 'loading'
  await render()
  expect(root.container.queryAll(node => node.type === 'ScrollView')).toHaveLength(0)
  expect(root.container.queryAll(node => node.type === 'Text' && readProp(node, 'children') === 'Loading fixture')).toHaveLength(1)
  status = 'ready'
  index = 99
  await render()
  expect(root.container.queryAll(node => node.type === 'Text' && readProp(node, 'children') === 'Invalid fixture')).toHaveLength(1)
  await act(async () => {
    await Promise.resolve()
    root.unmount()
  })
})
