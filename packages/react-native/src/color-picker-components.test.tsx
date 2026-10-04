// cspell:words inválido
import { act, createElement, type ReactElement } from 'react'

import { createRoot, type TestInstance } from 'test-renderer'
import { expect, test, vi } from 'vitest'

import { LumenColorPicker } from './color-picker-components.js'

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
vi.mock('./value-components.js', () => ({
  LumenSlider: (props: Record<string, unknown>): ReactElement => createElement('Slider', props)
}))
vi.mock('react-native-svg', () => {
  const host = (name: string) => (props: Record<string, unknown>): ReactElement => createElement(name, props)
  return Object.fromEntries(['Svg', 'Path', 'Rect', 'Circle', 'Line', 'Polyline', 'Polygon', 'G', 'Defs', 'Stop', 'LinearGradient', 'Ellipse', 'Text'].map(name => [name, host(name)]))
})

const readProp = (instance: TestInstance, name: string): unknown => {
  const props = instance.props as Record<string, unknown>
  return props[name]
}

test('keeps invalid drafts local, resynchronizes host updates and preserves latent HSV', async () => {
  const root = createRoot({ publicTextComponentTypes: ['Text'], textComponentTypes: ['Text'] })
  let value = '#00000000'
  const emissions: string[] = []
  const render = async (): Promise<void> => {
    await act(async () => {
      await Promise.resolve()
      root.render(
        <LumenColorPicker
          label="Color"
          value={value}
          onValueChange={next => {
            emissions.push(next)
            value = next
          }}
          allowAlpha
          palette={[{ id: 'gray', label: 'Transparent gray', value: '#80808000' }]}
          labels={{ invalid: 'Color inválido' }}
        />
      )
    })
  }
  const field = (): TestInstance => {
    const instance = root.container.queryAll(node => node.type === 'TextInput')[0]
    if (!instance) throw new Error('Missing field')
    return instance
  }
  const invoke = async (instance: TestInstance, name: string, next: string | number): Promise<void> => {
    const callback = readProp(instance, name)
    const isCallback = (input: unknown): input is (value: string | number) => void => typeof input === 'function'

    if (!isCallback(callback)) throw new Error('Missing callback')
    await act(async () => {
      await Promise.resolve()
      callback(next)
    })
  }
  const channel = (label: string): TestInstance => {
    const instance = root.container.queryAll(node => node.type === 'Slider' && readProp(node, 'label') === label)[0]
    if (!instance) throw new Error('Missing channel')
    return instance
  }
  await render()
  await invoke(field(), 'onChangeText', 'bad')
  expect(emissions).toEqual([])
  expect(readProp(field(), 'value')).toBe('bad')
  expect(root.container.queryAll(node => node.type === 'Text' && readProp(node, 'accessibilityRole') === 'alert')).toHaveLength(1)
  value = '#80808000'
  await render()
  expect(readProp(field(), 'value')).toBe(value)
  const selectedSwatch = root.container.queryAll(node => readProp(node, 'accessibilityLabel') === 'Transparent gray')[0]
  if (!selectedSwatch) throw new Error('Missing selected palette option')
  expect(readProp(selectedSwatch, 'aria-checked')).toBe(true)
  expect(readProp(selectedSwatch, 'accessibilityState')).toMatchObject({ checked: true, selected: true })
  await invoke(channel('Hue'), 'onValueChange', 240)
  await render()
  expect(readProp(channel('Hue'), 'value')).toBe(240)
  await invoke(channel('Saturation'), 'onValueChange', 100)
  await render()
  expect(value).toBe('#00008000')
  await invoke(channel('Brightness'), 'onValueChange', 0)
  await render()
  await invoke(channel('Hue'), 'onValueChange', 120)
  await render()
  await invoke(channel('Brightness'), 'onValueChange', 100)
  await render()
  expect(value).toBe('#00ff0000')
  value = '#ff0000ff'
  await render()
  value = '#00ff0000'
  await render()
  expect(readProp(channel('Hue'), 'value')).toBe(120)
  await act(async () => {
    await Promise.resolve()
    root.render(<LumenColorPicker label="Color" value={value} onValueChange={next => emissions.push(next)} allowAlpha readOnly />)
  })
  const count = emissions.length
  await invoke(field(), 'onChangeText', '#fff')
  await invoke(channel('Hue'), 'onValueChange', 200)
  expect(emissions).toHaveLength(count)
  expect(readProp(field(), 'editable')).toBe(false)
  await act(async () => {
    await Promise.resolve()
    root.unmount()
  })
})

test('palette keeps the first valid canonical color, named stable IDs and controlled single selection', async () => {
  const root = createRoot()
  const palette = [
    { id: ' ', label: 'Missing ID', value: '#f00' },
    { id: 'unnamed', label: ' \n', value: '#f00' },
    { id: 'white', label: 'Malformed first entry', value: 'bad' },
    { id: 'white', label: 'First white', value: '#fff', disabled: true },
    { id: 'alias', label: 'Equivalent white', value: 'rgba(255,255,255,1)' },
    { id: 'white', label: 'Duplicate ID', value: '#00f' },
    { id: 'blue', label: 'Blue', value: '#00f' }
  ]
  const emit = vi.fn<(value: string) => void>()
  await act(async () => {
    await Promise.resolve()
    root.render(<LumenColorPicker label="Color" value="#ffffff" palette={palette} onValueChange={emit} />)
  })
  const radios = root.container.queryAll(node => node.type === 'Pressable' && readProp(node, 'accessibilityRole') === 'radio')
  expect(radios.map(node => readProp(node, 'accessibilityLabel'))).toEqual(['First white', 'Blue'])
  expect(radios.map(node => readProp(node, 'aria-checked'))).toEqual([true, false])
  const first = radios[0]
  const blue = radios[1]
  if (!first || !blue) throw new Error('Missing palette choices')
  expect(readProp(first, 'disabled')).toBe(true)
  const firstPress = readProp(first, 'onPress')
  const bluePress = readProp(blue, 'onPress')
  if (typeof firstPress !== 'function' || typeof bluePress !== 'function') throw new Error('Missing swatch callbacks')
  await act(async () => {
    await Promise.resolve()
    Reflect.apply(firstPress, undefined, [])
  })
  expect(emit).not.toHaveBeenCalled()
  await act(async () => {
    await Promise.resolve()
    Reflect.apply(bluePress, undefined, [])
  })
  expect(emit).toHaveBeenCalledExactlyOnceWith('#0000ff')
  expect(readProp(first, 'aria-checked')).toBe(true)
  expect(palette).toHaveLength(7)
  await act(async () => {
    await Promise.resolve()
    root.unmount()
  })
})

test('equivalent opaque spellings deduplicate with alpha enabled while distinct alpha colors remain', async () => {
  const root = createRoot()
  await act(async () => {
    await Promise.resolve()
    root.render(
      <LumenColorPicker
        label="Color"
        value="#ffffff00"
        allowAlpha
        onValueChange={() => {}}
        palette={[
          { id: 'opaque', label: 'Opaque white', value: '#fff' },
          { id: 'same', label: 'Equivalent opaque white', value: '#ffffffff' },
          { id: 'transparent', label: 'Transparent white', value: '#ffffff00' }
        ]}
      />
    )
  })
  const radios = root.container.queryAll(node => node.type === 'Pressable' && readProp(node, 'accessibilityRole') === 'radio')
  expect(radios.map(node => readProp(node, 'accessibilityLabel'))).toEqual(['Opaque white', 'Transparent white'])
  expect(radios.map(node => readProp(node, 'aria-checked'))).toEqual([false, true])
  await act(async () => {
    await Promise.resolve()
    root.unmount()
  })
})
