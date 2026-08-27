import { act, type ReactElement } from 'react'

import { createRoot, type Root, type TestInstance } from 'test-renderer'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { LumenButton } from './primitives.js'
import { LumenProvider } from './provider.js'
import { LumenCheckbox, LumenTabs } from './selection-components.js'

const mountedRoots: Root[] = []

const renderNative = async (element: ReactElement): Promise<Root> => {
  const root = createRoot({
    publicTextComponentTypes: ['Text'],
    textComponentTypes: ['RCTText', 'Text']
  })

  mountedRoots.push(root)

  await act(async () => {
    root.render(<LumenProvider scheme="light">{element}</LumenProvider>)
    await Promise.resolve()
  })

  return root
}

const readProp = (instance: TestInstance, property: string): unknown => {
  const props = instance.props as Record<string, unknown>

  return props[property]
}

const callAction = (value: unknown, missingActionMessage: string): void => {
  if (typeof value !== 'function') throw new Error(missingActionMessage)

  Reflect.apply(value, undefined, [])
}

const findByAccessibilityRole = (root: Root, role: string): TestInstance => {
  const matches = root.container.queryAll(
    instance => readProp(instance, 'accessibilityRole') === role
  )

  expect(matches).toHaveLength(1)

  const match = matches[0]

  if (!match) throw new Error(`Expected one ${role} accessibility node.`)

  return match
}

afterEach(async () => {
  const roots = mountedRoots.splice(0)

  await act(async () => {
    for (const root of roots) root.unmount()
    await Promise.resolve()
  })
})

describe('Lumen React Native component behavior', () => {
  test('button exposes loading as busy and disabled native state', async () => {
    const root = await renderNative(<LumenButton loading>Save changes</LumenButton>)
    const button = findByAccessibilityRole(root, 'button')

    expect(readProp(button, 'disabled')).toBe(true)
    expect(readProp(button, 'accessibilityState')).toEqual({
      busy: true,
      disabled: true
    })
  })

  test('checkbox announces state and emits the next controlled value', async () => {
    const onCheckedChange = vi.fn<(checked: boolean) => void>()
    const root = await renderNative(
      <LumenCheckbox
        checked={false}
        label="Include diagnostics"
        onCheckedChange={onCheckedChange}
      />
    )
    const checkbox = findByAccessibilityRole(root, 'checkbox')
    const onPress = readProp(checkbox, 'onPress')

    expect(readProp(checkbox, 'accessibilityState')).toEqual({
      checked: false,
      disabled: false
    })
    expect(onPress).toBeTypeOf('function')

    await act(async () => {
      callAction(onPress, 'Checkbox is missing its native press action.')
      await Promise.resolve()
    })

    expect(onCheckedChange).toHaveBeenCalledExactlyOnceWith(true)
  })

  test('tabs preserve selected and disabled semantics while emitting enabled selection', async () => {
    const onValueChange = vi.fn<(value: string) => void>()
    const root = await renderNative(
      <LumenTabs
        label="Workspace views"
        onValueChange={onValueChange}
        options={[
          { label: 'Overview', value: 'overview' },
          { disabled: true, label: 'Activity', value: 'activity' }
        ]}
        value="overview"
      >
        Current workspace health
      </LumenTabs>
    )
    const tabList = findByAccessibilityRole(root, 'tablist')
    const tabs = root.container.queryAll(
      instance => readProp(instance, 'accessibilityRole') === 'tab'
    )

    expect(readProp(tabList, 'accessibilityLabel')).toBe('Workspace views')
    expect(tabs).toHaveLength(2)
    const [overviewTab, activityTab] = tabs

    if (!overviewTab || !activityTab) throw new Error('Expected the two configured tabs.')

    expect(readProp(overviewTab, 'accessibilityState')).toEqual({
      disabled: false,
      selected: true
    })
    expect(readProp(activityTab, 'accessibilityState')).toEqual({
      disabled: true,
      selected: false
    })

    const enabledTabPress = readProp(overviewTab, 'onPress')

    await act(async () => {
      callAction(enabledTabPress, 'Enabled tab is missing its press action.')
      await Promise.resolve()
    })

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('overview')
  })
})
