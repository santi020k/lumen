import { act, createElement, type ReactElement } from 'react'

import { createRoot, type TestInstance } from 'test-renderer'
import { expect, test, vi } from 'vitest'

import { LumenQRCode } from './qrcode-components.js'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

vi.mock('react-native', () => {
  const host = (name: string) => (props: Record<string, unknown>): ReactElement => createElement(name, props)
  return { View: host('View'),
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

test('exposes accessible content, updates controlled value and announces localized errors', async () => {
  const root = createRoot({ publicTextComponentTypes: ['Text'], textComponentTypes: ['Text'] })
  const findRole = (role: string): TestInstance => {
    const result = root.container.queryAll(instance => (instance.type === 'View' || instance.type === 'Text') && readProp(instance, 'accessibilityRole') === role)[0]
    if (!result) throw new Error('Missing accessible element')
    return result
  }
  await act(async () => {
    await Promise.resolve()
    root.render(<LumenQRCode value="HELLO" label="Example QR" />)
  })
  expect(readProp(findRole('image'), 'accessibilityValue')).toEqual({ text: 'HELLO' })
  expect(readProp(findRole('image'), 'accessibilityLabel')).toBe('Example QR')
  await act(async () => {
    await Promise.resolve()
    root.render(<LumenQRCode value="" label="Example QR" errorLabel="Empty value" />)
  })
  expect(readProp(findRole('alert'), 'children')).toBe('Empty value')
  expect(root.container.queryAll(instance => instance.type === 'View' && readProp(instance, 'accessibilityRole') === 'image')).toHaveLength(0)
  await act(async () => {
    await Promise.resolve()
    root.render(<LumenQRCode value="HELLO" label="Example QR" size={Number.NaN} errorLabel="Invalid size" />)
  })
  expect(readProp(findRole('alert'), 'children')).toBe('Invalid size')
  expect(root.container.queryAll(instance => instance.type === 'View' && readProp(instance, 'accessibilityRole') === 'image')).toHaveLength(0)
  await act(async () => {
    await Promise.resolve()
    root.render(<LumenQRCode value="RESTORED" label="Example QR" />)
  })
  expect(readProp(findRole('image'), 'accessibilityValue')).toEqual({ text: 'RESTORED' })
  await act(async () => {
    await Promise.resolve()
    root.unmount()
  })
})
