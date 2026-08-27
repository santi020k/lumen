import { act, type ReactElement } from 'react'

import { getLumenPhoneCountry } from '@santi020k/lumen-core'
import { createRoot, type Root, type TestInstance } from 'test-renderer'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { LumenChip, LumenTextarea } from './additional-components.js'
import { LumenDateField } from './datetime-components.js'
import { LumenSearchField } from './form-components.js'
import { LumenPhoneInput } from './phone-components.js'
import { resolveLumenPhoneInputValue } from './phone-recipes.js'
import { LumenButton, LumenText, LumenTextField } from './primitives.js'
import { LumenProvider } from './provider.js'
import { LumenCheckbox, LumenTabs } from './selection-components.js'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

vi.mock('react-native', async () => {
  const { createElement } = await import('react')
  const hostComponent = (name: string) => (
    props: Record<string, unknown>
  ): ReactElement => createElement(name, props)

  return {
    ActivityIndicator: hostComponent('ActivityIndicator'),
    FlatList: hostComponent('FlatList'),
    Modal: hostComponent('Modal'),
    Platform: { OS: 'ios' },
    Pressable: hostComponent('Pressable'),
    Share: { share: () => Promise.resolve({ action: 'sharedAction' }) },
    Switch: hostComponent('Switch'),
    Text: hostComponent('Text'),
    TextInput: hostComponent('TextInput'),
    useColorScheme: () => 'light',
    useWindowDimensions: () => ({ fontScale: 1, height: 800, scale: 2, width: 400 }),
    View: hostComponent('View')
  }
})

vi.mock('@react-native-community/datetimepicker', async () => {
  const { createElement } = await import('react')
  const NativeDatePicker = (props: Record<string, unknown>): ReactElement => (
    createElement('NativeDatePicker', props)
  )

  return {
    DateTimePickerAndroid: { open: vi.fn() },
    default: NativeDatePicker
  }
})

vi.mock('react-native-svg', async () => {
  const { createElement } = await import('react')
  const hostComponent = (name: string) => (
    props: Record<string, unknown>
  ): ReactElement => createElement(name, props)

  return Object.fromEntries(
    ['Circle', 'Ellipse', 'Line', 'Path', 'Polygon', 'Polyline', 'Rect', 'Svg']
      .map(name => [name, hostComponent(name)])
  )
})

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

const findByAccessibilityLabel = (root: Root, label: string): TestInstance => {
  const matches = root.container.queryAll(
    instance => readProp(instance, 'accessibilityLabel') === label
  )

  expect(matches).toHaveLength(1)

  const match = matches[0]

  if (!match) throw new Error(`Expected one accessibility node labeled ${label}.`)

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

  test('button preserves its native role when a consumer supplies another role', async () => {
    const root = await renderNative(
      <LumenButton accessibilityRole="link">Open workspace</LumenButton>
    )

    expect(findByAccessibilityRole(root, 'button')).toBeDefined()
    expect(root.container.queryAll(
      instance => readProp(instance, 'accessibilityRole') === 'link'
    )).toHaveLength(0)
  })

  test('text inputs expose disabled native state without dropping caller state', async () => {
    const textFieldRoot = await renderNative(
      <LumenTextField
        accessibilityLabel="Project name"
        accessibilityState={{ busy: true }}
        editable={false}
      />
    )
    const textareaRoot = await renderNative(
      <LumenTextarea
        accessibilityState={{ busy: true }}
        editable={false}
        label="Project notes"
        onChangeText={() => {}}
        value=""
      />
    )
    const searchRoot = await renderNative(
      <LumenSearchField
        accessibilityState={{ busy: true }}
        editable={false}
        onChangeText={() => {}}
        prompt="Search projects"
        value=""
      />
    )

    for (const [root, label] of [
      [textFieldRoot, 'Project name'],
      [textareaRoot, 'Project notes'],
      [searchRoot, 'Search projects']
    ] as const) {
      expect(readProp(findByAccessibilityLabel(root, label), 'accessibilityState')).toEqual({
        busy: true,
        disabled: true
      })
    }
  })

  test('validation is exposed on the native controls without dropping caller context', async () => {
    const textFieldRoot = await renderNative(
      <LumenTextField accessibilityLabel="Project name" error />
    )
    const textareaRoot = await renderNative(
      <LumenTextarea
        accessibilityHint="Consumer guidance"
        errorMessage="Project notes are required"
        label="Project notes"
        onChangeText={() => {}}
        value=""
      />
    )
    const dateRoot = await renderNative(
      <LumenDateField
        errorMessage="Choose a valid birthday"
        label="Birthday"
        onValueChange={() => {}}
        value={null}
      />
    )

    const textField = findByAccessibilityLabel(textFieldRoot, 'Project name')
    const textarea = findByAccessibilityLabel(textareaRoot, 'Project notes')
    const dateButton = findByAccessibilityLabel(dateRoot, 'Birthday, Select a date')

    expect(readProp(textField, 'aria-invalid')).toBe(true)
    expect(readProp(textarea, 'aria-invalid')).toBe(true)
    expect(readProp(textarea, 'accessibilityHint')).toBe('Project notes are required')
    expect(readProp(dateButton, 'aria-invalid')).toBe(true)
    expect(readProp(dateButton, 'accessibilityHint')).toBe('Choose a valid birthday')
  })

  test('phone input exposes disabled state on both native controls', async () => {
    const country = getLumenPhoneCountry('US')

    expect(country).toBeDefined()

    if (!country) return

    const value = resolveLumenPhoneInputValue([country], country, '', {})
    const root = await renderNative(
      <LumenPhoneInput
        countries={[country]}
        enabled={false}
        label="Phone"
        onValueChange={() => {}}
        value={value}
      />
    )
    const countrySelector = findByAccessibilityLabel(root, 'Country code, United States, +1')
    const numberInput = findByAccessibilityLabel(root, 'Phone number')

    expect(readProp(countrySelector, 'accessibilityState')).toEqual({
      disabled: true,
      expanded: false
    })
    expect(readProp(numberInput, 'accessibilityState')).toEqual({ disabled: true })
  })

  test('phone input exposes validation on the number editor', async () => {
    const country = getLumenPhoneCountry('US')

    expect(country).toBeDefined()

    if (!country) return

    const value = resolveLumenPhoneInputValue([country], country, '415', {})
    const root = await renderNative(
      <LumenPhoneInput
        countries={[country]}
        errorMessage="Enter a complete phone number"
        label="Phone"
        onValueChange={() => {}}
        value={value}
      />
    )
    const numberInput = findByAccessibilityLabel(root, 'Phone number')

    expect(readProp(numberInput, 'aria-invalid')).toBe(true)
    expect(readProp(numberInput, 'accessibilityHint')).toBe('Enter a complete phone number')
  })

  test('phone input exposes an empty country allow-list as a disabled selector', async () => {
    const country = getLumenPhoneCountry('US')

    expect(country).toBeDefined()

    if (!country) return

    const value = resolveLumenPhoneInputValue([country], country, '', {})
    const root = await renderNative(
      <LumenPhoneInput
        countries={[]}
        label="Phone"
        onValueChange={() => {}}
        value={value}
      />
    )
    const countrySelector = findByAccessibilityLabel(root, 'Country code, United States, +1')

    expect(readProp(countrySelector, 'disabled')).toBe(true)
    expect(readProp(countrySelector, 'accessibilityState')).toEqual({
      disabled: true,
      expanded: false
    })
  })

  test('chip removal exposes the independent action disabled state', async () => {
    const root = await renderNative(
      <LumenChip disabled label="Design" onRemove={() => {}} />
    )
    const removeButton = findByAccessibilityLabel(root, 'Remove Design')

    expect(readProp(removeButton, 'accessibilityRole')).toBe('button')
    expect(readProp(removeButton, 'disabled')).toBe(true)
    expect(readProp(removeButton, 'accessibilityState')).toEqual({ disabled: true })
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
        <LumenText>Current workspace health</LumenText>
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
