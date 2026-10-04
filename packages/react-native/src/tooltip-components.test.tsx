import { act, createElement, type ReactElement } from 'react'

import { createRoot, type Root, type TestInstance } from 'test-renderer'
import { afterEach, expect, test, vi } from 'vitest'

import { LumenTooltip, type LumenTooltipProps } from './tooltip-components.js'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
const back = vi.hoisted(() => ({ handlers: [] as (() => boolean)[], remove: vi.fn() }))
vi.mock('react-native', () => ({
  View: (props: Record<string, unknown>): ReactElement => createElement('View', props),
  BackHandler: { addEventListener: (_name: string, handler: () => boolean) => {
    back.handlers.push(handler)

    return { remove: back.remove }
  } }
}))
vi.mock('./primitives.js', () => ({
  LumenButton: (props: Record<string, unknown>): ReactElement => createElement('Button', props),
  LumenText: (props: Record<string, unknown>): ReactElement => createElement('Text', props)
}))
vi.mock('./theme-context.js', () => ({ useLumenTheme: () => ({
  spacing: { xs: 4, sm: 8 },
  radii: { sm: 4 },
  colors: { ink: '#111111', canvas: '#ffffff' }
}) }))
const roots: Root[] = []

afterEach(() => {
  act(() => {
    for (const root of roots) root.unmount()
  })
  roots.length = 0
  back.handlers.length = 0
  back.remove.mockClear()
})
const render = (props: Partial<LumenTooltipProps> = {}): { root: Root, change: ReturnType<typeof vi.fn> } => {
  const root = createRoot()
  const change = vi.fn()

  roots.push(root)
  act(() => {
    root.render(<LumenTooltip label="Project help" text="Synthetic detail" visible={false} onVisibleChange={change} {...props} />)
  })

  return { root, change }
}
const read = (instance: TestInstance, key: string): unknown => (instance.props as Record<string, unknown>)[key]
const button = (root: Root): TestInstance => {
  const match = root.container.queryAll(instance => instance.type === 'Button')[0]

  if (!match) throw new Error('Missing anchor')

  return match
}
const invoke = (instance: TestInstance, key: string, parameters: readonly unknown[] = []): void => {
  const action = read(instance, key)

  if (typeof action !== 'function') throw new Error(`Missing ${key}`)
  act(() => {
    Reflect.apply(action, undefined, parameters)
  })
}

test('labeled anchor has separate description and focus hover long press tap request controlled visibility', () => {
  const { root, change } = render()
  const anchor = button(root)

  expect(read(anchor, 'accessibilityLabel')).toBe('Project help')
  expect(read(anchor, 'accessibilityHint')).toBe('Synthetic detail')
  for (const event of ['onFocus', 'onHoverIn', 'onLongPress', 'onPress']) invoke(anchor, event)
  expect(change.mock.calls).toEqual([[true], [true], [true], [true]])
  expect(root.container.queryAll(instance => instance.type === 'Text')).toHaveLength(0)
  expect(back.handlers).toHaveLength(0)
})

test('visible contextual text retains focus and all dismissal paths propose closure', () => {
  const { root, change } = render({ visible: true, dismissLabel: 'Close explanation' })
  const anchor = button(root)

  expect(read(anchor, 'accessibilityActions')).toEqual([{ name: 'dismiss', label: 'Close explanation' }])
  expect(root.container.queryAll(instance => instance.type === 'Text' && read(instance, 'children') === 'Synthetic detail')).toHaveLength(1)
  for (const event of ['onBlur', 'onHoverOut', 'onAccessibilityEscape', 'onPress']) invoke(anchor, event)
  invoke(anchor, 'onAccessibilityAction', [{ nativeEvent: { actionName: 'dismiss' } }])
  const handler = back.handlers[0]

  if (!handler) throw new Error('Missing native Back handler')
  expect(handler()).toBe(true)
  expect(change.mock.calls).toEqual([[false], [false], [false], [false], [false], [false]])
  act(() => {
    root.unmount()
  })
  expect(back.remove).toHaveBeenCalledOnce()
})

test('disabled or missing help hides stale content and blocks every trigger', () => {
  for (const props of [{ disabled: true }, { text: ' \n' }]) {
    const { root, change } = render({ visible: true, ...props })
    const anchor = button(root)

    expect(read(anchor, 'disabled')).toBe(true)
    expect(root.container.queryAll(instance => instance.type === 'Text')).toHaveLength(0)
    for (const event of ['onFocus', 'onHoverIn', 'onLongPress', 'onPress', 'onBlur', 'onAccessibilityEscape']) invoke(anchor, event)
    expect(change).not.toHaveBeenCalled()
  }
  expect(back.handlers).toHaveLength(0)
})

test('missing accessible label does not render an unnamed anchor', () => {
  const { root, change } = render({ visible: true, label: ' \n' })

  expect(root.container.queryAll(instance => instance.type === 'Button')).toHaveLength(0)
  expect(change).not.toHaveBeenCalled()
  expect(back.handlers).toHaveLength(0)
})
