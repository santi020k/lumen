import { act, type ReactElement, type Ref, useState } from 'react'

import { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { getLumenPhoneCountry } from '@santi020k/lumen-core'
import { createRoot, type Root, type TestInstance } from 'test-renderer'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { LumenChip, LumenFieldGroup, LumenTextarea, LumenToast } from './additional-components.js'
import { LumenDateField, LumenDateRangeField } from './datetime-components.js'
import { LumenSearchField, LumenToggle } from './form-components.js'
import { LumenAlertDialog, LumenSheet } from './overlay-components.js'
import { LumenPhoneInput } from './phone-components.js'
import { resolveLumenPhoneInputValue } from './phone-recipes.js'
import { LumenButton, LumenText, LumenTextField } from './primitives.js'
import { LumenProvider } from './provider.js'
import { LumenCheckbox, LumenTabs } from './selection-components.js'
import { LumenBanner, LumenStatusBar } from './structured-components.js'
import { LumenPicker } from './value-components.js'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const nativePlatform = vi.hoisted(() => ({ OS: 'ios' }))
const safeAreaInsets = vi.hoisted(() => ({
  bottom: 34,
  left: 8,
  right: 12,
  top: 20
}))

vi.mock('react-native', async () => {
  const { createElement, useImperativeHandle } = await import('react')
  const hostComponent = (name: string) => (
    props: Record<string, unknown>
  ): ReactElement => createElement(name, props)
  type FocusablePressableProps = Record<string, unknown> & {
    ref?: Ref<{ focus: () => void }>
  }
  const FocusablePressable = ({ ref, ...props }: FocusablePressableProps): ReactElement => {
    useImperativeHandle(ref, () => ({ focus: vi.fn() }))

    return createElement('Pressable', props)
  }

  return {
    ActivityIndicator: hostComponent('ActivityIndicator'),
    FlatList: hostComponent('FlatList'),
    Modal: hostComponent('Modal'),
    Platform: nativePlatform,
    Pressable: FocusablePressable,
    ScrollView: hostComponent('ScrollView'),
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
    DateTimePickerAndroid: { dismiss: vi.fn(), open: vi.fn() },
    default: NativeDatePicker
  }
})

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => safeAreaInsets
}))

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

const callKeyboardAction = (value: unknown, key: string): ReturnType<typeof vi.fn> => {
  if (typeof value !== 'function') throw new Error('Tab is missing its keyboard action.')

  const preventDefault = vi.fn()

  Reflect.apply(value, undefined, [{
    nativeEvent: { code: key, key },
    preventDefault
  }])

  return preventDefault
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

const findHostComponent = (root: Root, type: string): TestInstance => {
  const matches = root.container.queryAll(instance => instance.type === type)

  expect(matches).toHaveLength(1)

  const match = matches[0]

  if (!match) throw new Error(`Expected one ${type} host component.`)

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
  test('keeps alert actions inside safe areas and makes oversized content scrollable', async () => {
    const root = await renderNative(
      <LumenAlertDialog
        confirmLabel="Delete"
        onConfirm={() => {}}
        onDismiss={() => {}}
        title="Delete project?"
        visible
      />
    )
    const modalContainer = root.container.queryAll(
      instance => readProp(instance, 'accessibilityViewIsModal') === true
    )[0]

    if (!modalContainer) throw new Error('Expected the alert modal container.')

    expect(readProp(modalContainer, 'style')).toMatchObject({
      paddingBottom: 58,
      paddingLeft: 32,
      paddingRight: 36,
      paddingTop: 44
    })
    expect(readProp(findByAccessibilityRole(root, 'alert'), 'style')).toMatchObject({
      maxHeight: '100%'
    })
  })

  test('keeps sheet actions above the bottom inset and scrolls application content', async () => {
    const root = await renderNative(
      <LumenSheet
        actions={<LumenButton>Save</LumenButton>}
        onDismiss={() => {}}
        title="Settings"
        visible
      >
        <LumenText>Sheet content</LumenText>
      </LumenSheet>
    )
    const sheetSurface = root.container.queryAll(instance => {
      const style = readProp(instance, 'style')

      return typeof style === 'object' && style !== null && 'paddingBottom' in style
    })[0]

    if (!sheetSurface) throw new Error('Expected the sheet surface.')

    expect(readProp(sheetSurface, 'style')).toMatchObject({
      paddingBottom: 58,
      paddingLeft: 32,
      paddingRight: 36
    })
    expect(root.container.queryAll(instance => instance.type === 'ScrollView')).toHaveLength(1)
  })

  test('lets virtualized sheet content own scrolling', async () => {
    const root = await renderNative(
      <LumenSheet onDismiss={() => {}} scrollable={false} visible>
        <LumenText>Virtualized content</LumenText>
      </LumenSheet>
    )

    expect(root.container.queryAll(instance => instance.type === 'ScrollView')).toHaveLength(0)
  })

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

  test('grouped fields expose required and range validation context', async () => {
    const fieldGroupRoot = await renderNative(
      <LumenFieldGroup label="Project details" required>
        <LumenText>Details</LumenText>
      </LumenFieldGroup>
    )
    const dateRangeRoot = await renderNative(
      <LumenDateRangeField
        accessibilityHint="Consumer guidance"
        errorMessage="Choose a valid schedule"
        label="Schedule"
        onValueChange={() => {}}
        value={{ end: null, start: null }}
      />
    )

    expect(findByAccessibilityLabel(fieldGroupRoot, 'Project details, required')).toBeDefined()

    const dateRange = findByAccessibilityLabel(dateRangeRoot, 'Schedule')

    expect(readProp(dateRange, 'aria-invalid')).toBe(true)
    expect(readProp(dateRange, 'accessibilityHint')).toBe('Choose a valid schedule')
  })

  test('field groups provide inherited native and web relationships without overriding inputs', async () => {
    const root = await renderNative(
      <LumenFieldGroup
        description="Shown on the public profile"
        errorMessage="Choose a unique name"
        label="Project name"
        required
      >
        <LumenText>Nested row content</LumenText>
        <LumenTextField />
        <LumenTextField accessibilityLabel="Short project name" />
      </LumenFieldGroup>
    )
    const inputs = root.container.queryAll(instance => instance.type === 'TextInput')
    const inherited = inputs[0]
    const explicit = inputs[1]

    if (!inherited || !explicit) throw new Error('Expected two grouped text fields.')

    expect(readProp(inherited, 'accessibilityLabel')).toBe('Project name')
    expect(readProp(inherited, 'aria-labelledby')).toMatch(/-label$/u)
    expect(readProp(inherited, 'aria-describedby')).toMatch(/-description .*?-error$/u)
    expect(readProp(inherited, 'aria-required')).toBe(true)
    expect(readProp(inherited, 'aria-invalid')).toBe(true)
    expect(readProp(explicit, 'accessibilityLabel')).toBe('Short project name')
    expect(readProp(explicit, 'aria-labelledby')).toBeUndefined()

    const validationMessages = root.container.queryAll(
      instance => readProp(instance, 'children') === 'Choose a unique name'
    )

    expect(validationMessages).toHaveLength(1)

    const validationMessage = validationMessages[0]

    if (!validationMessage) throw new Error('Expected the grouped validation message.')

    expect(readProp(validationMessage, 'accessibilityLiveRegion')).toBe('polite')
    expect(readProp(validationMessage, 'accessibilityRole')).toBe('alert')
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

  test('generic picker disables empty options and does not reopen after disabling', async () => {
    const onValueChange = vi.fn<(value: string) => void>()
    const root = await renderNative(
      <LumenPicker
        label="Workspace"
        onValueChange={onValueChange}
        options={[]}
        value="none"
      />
    )
    let trigger = findByAccessibilityLabel(root, 'Workspace')

    expect(readProp(trigger, 'disabled')).toBe(true)
    expect(readProp(trigger, 'accessibilityState')).toEqual({
      disabled: true,
      expanded: false
    })

    await act(async () => {
      root.render(
        <LumenProvider scheme="light">
          <LumenPicker
            label="Workspace"
            onValueChange={onValueChange}
            options={[{ label: 'Design', value: 'design' }]}
            value="design"
          />
        </LumenProvider>
      )
      await Promise.resolve()
    })

    trigger = findByAccessibilityLabel(root, 'Workspace')

    await act(async () => {
      callAction(readProp(trigger, 'onPress'), 'Picker is missing its native press action.')
      await Promise.resolve()
    })

    expect(findByAccessibilityRole(root, 'menu')).toBeDefined()

    await act(async () => {
      root.render(
        <LumenProvider scheme="light">
          <LumenPicker
            enabled={false}
            label="Workspace"
            onValueChange={onValueChange}
            options={[{ label: 'Design', value: 'design' }]}
            value="design"
          />
        </LumenProvider>
      )
      await Promise.resolve()
    })

    expect(root.container.queryAll(
      instance => readProp(instance, 'accessibilityRole') === 'menu'
    )).toHaveLength(0)

    await act(async () => {
      root.render(
        <LumenProvider scheme="light">
          <LumenPicker
            label="Workspace"
            onValueChange={onValueChange}
            options={[{ label: 'Design', value: 'design' }]}
            value="design"
          />
        </LumenProvider>
      )
      await Promise.resolve()
    })

    expect(root.container.queryAll(
      instance => readProp(instance, 'accessibilityRole') === 'menu'
    )).toHaveLength(0)
  })

  test('date picker does not reopen after the field is disabled and re-enabled', async () => {
    const root = await renderNative(
      <LumenDateField label="Birthday" onValueChange={() => {}} value={null} />
    )
    const trigger = findByAccessibilityLabel(root, 'Birthday, Select a date')

    await act(async () => {
      callAction(readProp(trigger, 'onPress'), 'Date field is missing its native press action.')
      await Promise.resolve()
    })

    expect(findHostComponent(root, 'NativeDatePicker')).toBeDefined()

    await act(async () => {
      root.render(
        <LumenProvider scheme="light">
          <LumenDateField enabled={false} label="Birthday" onValueChange={() => {}} value={null} />
        </LumenProvider>
      )
      await Promise.resolve()
    })

    expect(root.container.queryAll(instance => instance.type === 'NativeDatePicker')).toHaveLength(0)

    await act(async () => {
      root.render(
        <LumenProvider scheme="light">
          <LumenDateField label="Birthday" onValueChange={() => {}} value={null} />
        </LumenProvider>
      )
      await Promise.resolve()
    })

    expect(root.container.queryAll(instance => instance.type === 'NativeDatePicker')).toHaveLength(0)
  })

  test('disabling an Android date field dismisses its imperative native dialog', async () => {
    nativePlatform.OS = 'android'

    try {
      const root = await renderNative(
        <LumenDateField label="Birthday" onValueChange={() => {}} value={null} />
      )
      const trigger = findByAccessibilityLabel(root, 'Birthday, Select a date')

      await act(async () => {
        callAction(readProp(trigger, 'onPress'), 'Date field is missing its native press action.')
        await Promise.resolve()
      })

      expect(DateTimePickerAndroid.open).toHaveBeenCalledOnce()

      await act(async () => {
        root.render(
          <LumenProvider scheme="light">
            <LumenDateField enabled={false} label="Birthday" onValueChange={() => {}} value={null} />
          </LumenProvider>
        )
        await Promise.resolve()
      })

      expect(DateTimePickerAndroid.dismiss).toHaveBeenCalledWith('date')
    } finally {
      nativePlatform.OS = 'ios'
    }
  })

  test('phone picker closes and clears its query when the input becomes disabled', async () => {
    const country = getLumenPhoneCountry('US')

    expect(country).toBeDefined()

    if (!country) return

    const value = resolveLumenPhoneInputValue([country], country, '', {})
    const renderPhone = (enabled: boolean): ReactElement => (
      <LumenProvider scheme="light">
        <LumenPhoneInput
          countries={[country]}
          enabled={enabled}
          label="Phone"
          onValueChange={() => {}}
          value={value}
        />
      </LumenProvider>
    )
    const root = await renderNative(
      <LumenPhoneInput
        countries={[country]}
        label="Phone"
        onValueChange={() => {}}
        value={value}
      />
    )
    const selector = findByAccessibilityLabel(root, 'Country code, United States, +1')

    await act(async () => {
      callAction(readProp(selector, 'onPress'), 'Country selector is missing its native press action.')
      await Promise.resolve()
    })

    expect(readProp(findHostComponent(root, 'Modal'), 'visible')).toBe(true)
    expect(readProp(findByAccessibilityLabel(root, 'Search countries'), 'editable')).toBe(true)

    await act(async () => {
      const onChangeText = readProp(findByAccessibilityLabel(root, 'Search countries'), 'onChangeText')

      if (typeof onChangeText !== 'function') throw new Error('Country search is missing its change action.')

      Reflect.apply(onChangeText, undefined, ['united'])
      await Promise.resolve()
    })

    await act(async () => {
      root.render(renderPhone(false))
      await Promise.resolve()
    })

    expect(readProp(findHostComponent(root, 'Modal'), 'visible')).toBe(false)
    expect(readProp(findByAccessibilityLabel(root, 'Country code, United States, +1'), 'accessibilityState'))
      .toEqual({ disabled: true, expanded: false })

    await act(async () => {
      root.render(renderPhone(true))
      await Promise.resolve()
    })

    expect(readProp(findByAccessibilityLabel(root, 'Country code, United States, +1'), 'accessibilityState'))
      .toEqual({ disabled: false, expanded: false })

    const reopenedSelector = findByAccessibilityLabel(root, 'Country code, United States, +1')

    await act(async () => {
      callAction(
        readProp(reopenedSelector, 'onPress'),
        'Re-enabled country selector is missing its native press action.'
      )
      await Promise.resolve()
    })

    expect(readProp(findByAccessibilityLabel(root, 'Search countries'), 'value')).toBe('')
  })

  test('chip removal exposes the independent action disabled state', async () => {
    const root = await renderNative(
      <LumenChip disabled label="Design" onRemove={() => {}} />
    )
    const removeButton = findByAccessibilityLabel(root, 'Remove Design')

    expect(readProp(removeButton, 'accessibilityRole')).toBe('button')
    expect(readProp(removeButton, 'disabled')).toBe(true)
    expect(readProp(removeButton, 'accessibilityState')).toEqual({ disabled: true })
    expect(readProp(removeButton, 'style')).toMatchObject({
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 24,
      minWidth: 24
    })
  })

  test('toast announces politely and keeps dismissal independently operable', async () => {
    const onDismiss = vi.fn<() => void>()
    const root = await renderNative(
      <LumenToast dismissLabel="Close update" onDismiss={onDismiss} title="Changes saved" />
    )
    const alert = findByAccessibilityRole(root, 'alert')
    const dismissButton = findByAccessibilityLabel(root, 'Close update')
    const style = readProp(dismissButton, 'style')

    expect(readProp(alert, 'accessibilityLiveRegion')).toBe('polite')
    expect(readProp(dismissButton, 'accessibilityRole')).toBe('button')
    expect(style).toBeTypeOf('function')

    if (typeof style !== 'function') throw new Error('Toast dismissal is missing its pressable style.')

    const restingStyle: unknown = Reflect.apply(style, undefined, [{ pressed: false }])

    expect(restingStyle).toMatchObject({
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      minWidth: 44
    })

    await act(async () => {
      callAction(readProp(dismissButton, 'onPress'), 'Toast dismissal is missing its press action.')
      await Promise.resolve()
    })

    expect(onDismiss).toHaveBeenCalledOnce()
  })

  test('banner dismissal has a full independent touch target', async () => {
    const root = await renderNative(
      <LumenBanner dismissLabel="Close notice" onDismiss={() => {}} title="Maintenance soon" />
    )
    const dismissButton = findByAccessibilityLabel(root, 'Close notice')
    const style = readProp(dismissButton, 'style')

    expect(readProp(dismissButton, 'accessibilityRole')).toBe('button')
    expect(style).toBeTypeOf('function')

    if (typeof style !== 'function') throw new Error('Banner dismissal is missing its pressable style.')

    const restingStyle: unknown = Reflect.apply(style, undefined, [{ pressed: false }])

    expect(restingStyle).toMatchObject({
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      minWidth: 44
    })
  })

  test('status bars allow long messages to wrap without shrinking trailing content', async () => {
    const message = 'El análisis permanece en el dispositivo para proteger tu privacidad.'
    const root = await renderNative(
      <LumenProvider>
        <LumenStatusBar
          message={message}
          trailing={<LumenText>Analyze</LumenText>}
        />
      </LumenProvider>
    )
    const messageNodes = root.container.queryAll(
      instance => instance.type === 'Text' && readProp(instance, 'children') === message
    )

    expect(messageNodes).toHaveLength(1)

    const messageNode = messageNodes[0]

    if (!messageNode) throw new Error('Expected the status message fixture.')

    expect(readProp(messageNode, 'numberOfLines')).toBeUndefined()
    expect(readProp(messageNode, 'style')).toMatchObject({ flex: 1, flexShrink: 1 })

    const fixedTrailingContainers = root.container.queryAll(instance => {
      const style = readProp(instance, 'style')

      return instance.type === 'View' && typeof style === 'object' && style !== null &&
        Reflect.get(style, 'flexShrink') === 0
    })

    expect(fixedTrailingContainers).toHaveLength(1)
  })

  test('search clear action preserves its label and full touch target', async () => {
    const onChangeText = vi.fn<(value: string) => void>()
    const root = await renderNative(
      <LumenSearchField
        clearLabel="Clear query"
        onChangeText={onChangeText}
        value="lumen"
      />
    )
    const clearButton = findByAccessibilityLabel(root, 'Clear query')
    const style = readProp(clearButton, 'style')

    expect(readProp(clearButton, 'accessibilityRole')).toBe('button')
    expect(style).toBeTypeOf('function')

    if (typeof style !== 'function') throw new Error('Clear action is missing its pressable style.')

    const restingStyle: unknown = Reflect.apply(style, undefined, [{ pressed: false }])

    expect(restingStyle).toMatchObject({
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      minWidth: 44
    })

    await act(async () => {
      callAction(readProp(clearButton, 'onPress'), 'Clear action is missing its native press action.')
      await Promise.resolve()
    })

    expect(onChangeText).toHaveBeenCalledExactlyOnceWith('')
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

  test('toggle makes the full labeled row the single interactive switch', async () => {
    const onValueChange = vi.fn<(value: boolean) => void>()
    const root = await renderNative(
      <LumenToggle
        description="Receive product and security updates"
        label="Automatic updates"
        onValueChange={onValueChange}
        value={false}
      />
    )
    const toggle = findByAccessibilityRole(root, 'switch')
    const onPress = readProp(toggle, 'onPress')
    const nativeSwitches = root.container.queryAll(instance => instance.type === 'Switch')

    expect(readProp(toggle, 'accessibilityLabel')).toBe('Automatic updates')
    expect(readProp(toggle, 'accessibilityHint')).toBe('Receive product and security updates')
    expect(readProp(toggle, 'accessibilityState')).toEqual({
      checked: false,
      disabled: false
    })
    expect(nativeSwitches).toHaveLength(1)

    const nativeSwitch = nativeSwitches[0]

    if (!nativeSwitch) throw new Error('Expected the decorative native switch.')

    expect(readProp(nativeSwitch, 'accessibilityElementsHidden')).toBe(true)
    expect(readProp(nativeSwitch, 'importantForAccessibility')).toBe('no-hide-descendants')
    expect(readProp(nativeSwitch, 'pointerEvents')).toBe('none')
    expect(readProp(nativeSwitch, 'onValueChange')).toBeUndefined()

    await act(async () => {
      callAction(onPress, 'Toggle row is missing its press action.')
      await Promise.resolve()
    })

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(true)
  })

  test('toggle preserves a consumer accessibility hint over supporting copy', async () => {
    const root = await renderNative(
      <LumenToggle
        accessibilityHint="Changes how updates are installed"
        description="Receive product and security updates"
        label="Automatic updates"
        onValueChange={() => {}}
        value={false}
      />
    )

    expect(readProp(findByAccessibilityRole(root, 'switch'), 'accessibilityHint'))
      .toBe('Changes how updates are installed')
  })

  test('disabled toggle row cannot emit a value change', async () => {
    const onValueChange = vi.fn<(value: boolean) => void>()
    const root = await renderNative(
      <LumenToggle
        disabled
        label="Automatic updates"
        onValueChange={onValueChange}
        value
      />
    )
    const toggle = findByAccessibilityRole(root, 'switch')

    expect(readProp(toggle, 'accessibilityState')).toEqual({
      checked: true,
      disabled: true
    })
    expect(readProp(toggle, 'disabled')).toBe(true)

    await act(async () => {
      callAction(readProp(toggle, 'onPress'), 'Disabled toggle row is missing its guarded press action.')
      await Promise.resolve()
    })

    expect(onValueChange).not.toHaveBeenCalled()
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

  test('tabs support directional keyboard navigation without selecting disabled tabs', async () => {
    const onValueChange = vi.fn<(value: string) => void>()
    const KeyboardTabsFixture = (): ReactElement => {
      const [value, setValue] = useState('overview')

      return (
        <LumenTabs
          label="Workspace views"
          onValueChange={nextValue => {
            onValueChange(nextValue)
            setValue(nextValue)
          }}
          options={[
            { label: 'Overview', value: 'overview' },
            { label: 'Activity', value: 'activity' },
            { disabled: true, label: 'Billing', value: 'billing' }
          ]}
          value={value}
        >
          <LumenText>Current workspace health</LumenText>
        </LumenTabs>
      )
    }
    const root = await renderNative(<KeyboardTabsFixture />)
    const pressTabKey = async (optionIndex: number, key: string): Promise<void> => {
      const tab = root.container.queryAll(
        instance => readProp(instance, 'accessibilityRole') === 'tab'
      )[optionIndex]

      if (!tab) throw new Error(`Expected tab fixture at index ${optionIndex}.`)

      let prevented = false

      await act(async () => {
        const preventDefault = callKeyboardAction(readProp(tab, 'onKeyDown'), key)

        prevented = preventDefault.mock.calls.length > 0

        await Promise.resolve()
      })

      expect(prevented).toBe(true)
    }

    await pressTabKey(0, 'ArrowRight')
    expect(onValueChange).toHaveBeenLastCalledWith('activity')

    await pressTabKey(1, 'ArrowRight')
    expect(onValueChange).toHaveBeenLastCalledWith('overview')
    expect(onValueChange).not.toHaveBeenCalledWith('billing')
  })

  test('tabs do not reselect the current tab when every alternative is disabled', async () => {
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
    const overviewTab = root.container.queryAll(
      instance => readProp(instance, 'accessibilityRole') === 'tab'
    )[0]

    if (!overviewTab) throw new Error('Expected the selected tab fixture.')

    expect(callKeyboardAction(readProp(overviewTab, 'onKeyDown'), 'ArrowRight'))
      .toHaveBeenCalledOnce()
    expect(onValueChange).not.toHaveBeenCalled()
  })
})
