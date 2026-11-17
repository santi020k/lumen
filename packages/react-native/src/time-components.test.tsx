import { act, type ReactElement, type Ref } from 'react'

import { DateTimePickerAndroid, type DateTimePickerChangeEvent } from '@react-native-community/datetimepicker'
import { createRoot, type Root, type TestInstance } from 'test-renderer'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { LumenProvider } from './provider.js'
import { LumenTimeField } from './time-components.js'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const nativePlatform = vi.hoisted(() => ({ OS: 'android' }))

vi.mock('react-native', async () => {
  const { createElement, useImperativeHandle } = await import('react')
  const hostComponent = (name: string) => (props: Record<string, unknown>): ReactElement => (
    createElement(name, props)
  )
  type FocusablePressableProps = Record<string, unknown> & {
    ref?: Ref<{ focus: () => void }>
  }
  const FocusablePressable = ({ ref, ...props }: FocusablePressableProps): ReactElement => {
    useImperativeHandle(ref, () => ({ focus: vi.fn() }))

    return createElement('Pressable', props)
  }

  return {
    AccessibilityInfo: {
      addEventListener: () => ({ remove: vi.fn() }),
      announceForAccessibilityWithOptions: vi.fn(),
      getRecommendedTimeoutMillis: (duration: number) => Promise.resolve(duration),
      isReduceMotionEnabled: () => Promise.resolve(false),
      sendAccessibilityEvent: vi.fn()
    },
    ActivityIndicator: hostComponent('ActivityIndicator'),
    FlatList: hostComponent('FlatList'),
    I18nManager: { isRTL: false },
    Image: hostComponent('Image'),
    KeyboardAvoidingView: hostComponent('KeyboardAvoidingView'),
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

vi.mock('react-native-svg', async () => {
  const { createElement } = await import('react')
  const hostComponent = (name: string) => (
    props: Record<string, unknown>
  ): ReactElement => createElement(name, props)

  return Object.fromEntries(
    ['Circle', 'Defs', 'Ellipse', 'G', 'Line', 'LinearGradient', 'Path', 'Polygon', 'Polyline', 'Rect', 'Stop', 'Svg', 'Text']
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

const runNativeAction = async (action: () => void | Promise<void>): Promise<void> => {
  await act(async () => {
    await action()
    await Promise.resolve()
  })
}

const readProp = (instance: TestInstance, property: string): unknown => {
  const props = instance.props as Record<string, unknown>

  return props[property]
}

const callAction = (value: unknown, missingActionMessage: string): void => {
  if (typeof value !== 'function') throw new Error(missingActionMessage)

  Reflect.apply(value, undefined, [])
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

interface AndroidTimePickerCallbacks {
  onDismiss: () => void
  onError: (error: Error) => void
  onValueChange: (event: DateTimePickerChangeEvent, date: Date) => void
}

const openAndroidTimeField = async (root: Root, label: string): Promise<AndroidTimePickerCallbacks> => {
  await runNativeAction(() => {
    callAction(readProp(findByAccessibilityLabel(root, `${label}, Choose a time`), 'onPress'), 'Missing time trigger')
  })

  const options = vi.mocked(DateTimePickerAndroid.open).mock.calls.at(-1)?.[0]

  if (!options?.onValueChange || !options.onDismiss || !options.onError) {
    throw new Error('Missing Android time picker callbacks')
  }

  return {
    onDismiss: options.onDismiss,
    onError: options.onError,
    onValueChange: options.onValueChange
  }
}

afterEach(async () => {
  const roots = mountedRoots.splice(0)

  await act(async () => {
    for (const root of roots) root.unmount()
    await Promise.resolve()
  })
  vi.mocked(DateTimePickerAndroid.open).mockReset()
  vi.mocked(DateTimePickerAndroid.dismiss).mockReset()
  nativePlatform.OS = 'android'
})

describe('LumenTimeField Android dialog lifecycle', () => {
  test('repeated open attempts while active reuse the single active native dialog', async () => {
    const onValueChange = vi.fn()
    const root = await renderNative(
      <LumenTimeField label="Appointment" onValueChange={onValueChange} value={null} />
    )

    await openAndroidTimeField(root, 'Appointment')
    expect(DateTimePickerAndroid.open).toHaveBeenCalledOnce()

    // Second open attempt while active is rejected
    await runNativeAction(() => {
      callAction(readProp(findByAccessibilityLabel(root, 'Appointment, Choose a time'), 'onPress'), 'Missing time trigger')
    })
    expect(DateTimePickerAndroid.open).toHaveBeenCalledOnce()
  })

  test('duplicate completion emits once', async () => {
    const change = vi.fn()
    const root = await renderNative(
      <LumenTimeField label="Appointment" onValueChange={change} value={null} />
    )

    const picker = await openAndroidTimeField(root, 'Appointment')
    const event = { nativeEvent: { timestamp: 0, utcOffset: 0 } }

    await runNativeAction(() => {
      // First emission commits value
      picker.onValueChange(event, new Date(2000, 0, 1, 10, 0))
      // Duplicate emission from native bridge is ignored
      picker.onValueChange(event, new Date(2000, 0, 1, 11, 0))
    })

    expect(change).toHaveBeenCalledExactlyOnceWith({ hour: 10, minute: 0 })
  })

  test('two instances preserve the first active dialog and allow the second to open after release', async () => {
    const changeA = vi.fn()
    const changeB = vi.fn()
    const root = await renderNative(
      <>
        <LumenTimeField label="Time A" onValueChange={changeA} value={null} />
        <LumenTimeField label="Time B" onValueChange={changeB} value={null} />
      </>
    )

    const pickerA = await openAndroidTimeField(root, 'Time A')
    expect(DateTimePickerAndroid.open).toHaveBeenCalledOnce()

    // Overlapping attempt from Time B while Time A is active is ignored
    await runNativeAction(() => {
      callAction(readProp(findByAccessibilityLabel(root, 'Time B, Choose a time'), 'onPress'), 'Missing time trigger')
    })
    expect(DateTimePickerAndroid.open).toHaveBeenCalledOnce()

    // Completing Time A invokes changeA and releases ownership
    const event = { nativeEvent: { timestamp: 0, utcOffset: 0 } }
    await runNativeAction(() => {
      pickerA.onValueChange(event, new Date(2000, 0, 1, 10, 15))
    })
    expect(changeA).toHaveBeenCalledExactlyOnceWith({ hour: 10, minute: 15 })
    expect(changeB).not.toHaveBeenCalled()

    // Time B can now open and become active
    const pickerB = await openAndroidTimeField(root, 'Time B')
    expect(DateTimePickerAndroid.open).toHaveBeenCalledTimes(2)

    await runNativeAction(() => {
      pickerB.onValueChange(event, new Date(2000, 0, 1, 14, 30))
    })
    expect(changeB).toHaveBeenCalledExactlyOnceWith({ hour: 14, minute: 30 })
  })

  test('unrelated instance mutations do not dismiss an active picker', async () => {
    const changeA = vi.fn()
    const changeB = vi.fn()
    const fields = (disabledB: boolean): ReactElement => (
      <>
        <LumenTimeField label="Time A" onValueChange={changeA} value={null} />
        <LumenTimeField enabled={!disabledB} label="Time B" onValueChange={changeB} value={null} />
      </>
    )

    const root = await renderNative(fields(false))
    const pickerA = await openAndroidTimeField(root, 'Time A')

    // Disabling Time B unmounts its control due to key change, but must NOT dismiss Time A's dialog
    await runNativeAction(() => {
      root.render(<LumenProvider scheme="light">{fields(true)}</LumenProvider>)
    })
    expect(DateTimePickerAndroid.dismiss).not.toHaveBeenCalled()

    // Time A still responds to its selection
    const event = { nativeEvent: { timestamp: 0, utcOffset: 0 } }
    await runNativeAction(() => {
      pickerA.onValueChange(event, new Date(2000, 0, 1, 9, 45))
    })
    expect(changeA).toHaveBeenCalledExactlyOnceWith({ hour: 9, minute: 45 })
  })

  test('owning readOnly transition unmounts and dismisses active picker', async () => {
    const onValueChange = vi.fn()
    const field = (readOnly: boolean): ReactElement => (
      <LumenTimeField label="Time" onValueChange={onValueChange} readOnly={readOnly} value={null} />
    )

    const root = await renderNative(field(false))
    const picker = await openAndroidTimeField(root, 'Time')
    expect(DateTimePickerAndroid.open).toHaveBeenCalledOnce()

    // Transitioning to readOnly changes key, unmounting the active control and dismissing dialog
    await runNativeAction(() => {
      root.render(<LumenProvider scheme="light">{field(true)}</LumenProvider>)
    })
    expect(DateTimePickerAndroid.dismiss).toHaveBeenCalledExactlyOnceWith('time')

    // Stale callback after dismissal does not invoke onValueChange
    const event = { nativeEvent: { timestamp: 0, utcOffset: 0 } }
    await runNativeAction(() => {
      picker.onValueChange(event, new Date(2000, 0, 1, 10, 0))
    })
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('uses latest callbacks and validates updated bounds while the dialog remains open', async () => {
    const openingCallback = vi.fn()
    const currentCallback = vi.fn()
    const props = { label: 'Time', locale: 'en-US', value: null }

    const root = await renderNative(
      <LumenTimeField {...props} minTime={{ hour: 9, minute: 0 }} onValueChange={openingCallback} />
    )
    const picker = await openAndroidTimeField(root, 'Time')

    // Update props while dialog is open: bounds become 12:00 - 17:00
    await runNativeAction(() => {
      root.render(
        <LumenProvider scheme="light">
          <LumenTimeField
            {...props}
            maxTime={{ hour: 17, minute: 0 }}
            minTime={{ hour: 12, minute: 0 }}
            onValueChange={currentCallback}
            rangeErrorLabel="Choose an afternoon time"
          />
        </LumenProvider>
      )
    })

    const event = { nativeEvent: { timestamp: 0, utcOffset: 0 } }
    // 10:30 is valid under initial minTime (9:00), but invalid under updated bounds (12:00 - 17:00)
    await runNativeAction(() => {
      picker.onValueChange(event, new Date(2000, 0, 1, 10, 30))
    })

    // Neither callback is invoked because selection is invalid under current bounds
    expect(openingCallback).not.toHaveBeenCalled()
    expect(currentCallback).not.toHaveBeenCalled()
    expect(
      root.container.queryAll(instance => readProp(instance, 'children') === 'Choose an afternoon time').length
    ).toBeGreaterThan(0)
  })

  test('stale callbacks after reopening the same field are ignored', async () => {
    const change = vi.fn()
    const root = await renderNative(
      <LumenTimeField label="Time" onValueChange={change} value={null} />
    )

    const firstPicker = await openAndroidTimeField(root, 'Time')
    await runNativeAction(() => {
      firstPicker.onDismiss()
    })

    const secondPicker = await openAndroidTimeField(root, 'Time')
    const event = { nativeEvent: { timestamp: 0, utcOffset: 0 } }

    // Stale calls from firstPicker on the same field must be no-ops
    await runNativeAction(() => {
      firstPicker.onDismiss()
      firstPicker.onError(new Error('Stale failure from first open'))
      firstPicker.onValueChange(event, new Date(2000, 0, 1, 8, 0))
    })
    expect(change).not.toHaveBeenCalled()

    // Second picker commits cleanly
    await runNativeAction(() => {
      secondPicker.onValueChange(event, new Date(2000, 0, 1, 14, 0))
    })
    expect(change).toHaveBeenCalledExactlyOnceWith({ hour: 14, minute: 0 })
  })

  test('stale completion, dismiss, and error callbacks from a previous owner are ignored across different fields', async () => {
    const changeA = vi.fn()
    const changeB = vi.fn()
    const root = await renderNative(
      <>
        <LumenTimeField label="Time A" onValueChange={changeA} value={null} />
        <LumenTimeField label="Time B" onValueChange={changeB} value={null} />
      </>
    )

    const pickerA = await openAndroidTimeField(root, 'Time A')
    await runNativeAction(() => {
      pickerA.onDismiss()
    })

    const pickerB = await openAndroidTimeField(root, 'Time B')
    const event = { nativeEvent: { timestamp: 0, utcOffset: 0 } }

    // Stale calls from pickerA must be no-ops
    await runNativeAction(() => {
      pickerA.onDismiss()
      pickerA.onError(new Error('Stale native failure'))
      pickerA.onValueChange(event, new Date(2000, 0, 1, 11, 0))
    })
    expect(changeA).not.toHaveBeenCalled()

    // Picker B continues to function and commit
    await runNativeAction(() => {
      pickerB.onValueChange(event, new Date(2000, 0, 1, 16, 15))
    })
    expect(changeB).toHaveBeenCalledExactlyOnceWith({ hour: 16, minute: 15 })
  })

  test('synchronous open failure releases ownership so future opens can proceed', async () => {
    const failure = new Error('Picker unavailable')
    const change = vi.fn()
    const root = await renderNative(
      <LumenTimeField label="Time" onValueChange={change} value={null} />
    )

    vi.mocked(DateTimePickerAndroid.open).mockImplementationOnce(() => {
      throw failure
    })

    await expect(openAndroidTimeField(root, 'Time')).rejects.toThrow(failure)

    // Ownership was released on failure; unmounting does not dismiss
    await runNativeAction(() => {
      root.unmount()
    })
    expect(DateTimePickerAndroid.dismiss).not.toHaveBeenCalled()

    // A new mount can open successfully
    const freshRoot = await renderNative(
      <LumenTimeField label="Time" onValueChange={change} value={null} />
    )
    const picker = await openAndroidTimeField(freshRoot, 'Time')
    const event = { nativeEvent: { timestamp: 0, utcOffset: 0 } }
    await runNativeAction(() => {
      picker.onValueChange(event, new Date(2000, 0, 1, 8, 30))
    })
    expect(change).toHaveBeenCalledExactlyOnceWith({ hour: 8, minute: 30 })
  })

  test('onError recovery releases ownership for subsequent dialogs', async () => {
    const changeA = vi.fn()
    const changeB = vi.fn()
    const root = await renderNative(
      <>
        <LumenTimeField label="Time A" onValueChange={changeA} value={null} />
        <LumenTimeField label="Time B" onValueChange={changeB} value={null} />
      </>
    )

    const pickerA = await openAndroidTimeField(root, 'Time A')
    await runNativeAction(() => {
      pickerA.onError(new Error('Native fragment detached'))
    })

    // Picker B can now open because ownership was released on error
    const pickerB = await openAndroidTimeField(root, 'Time B')
    expect(DateTimePickerAndroid.open).toHaveBeenCalledTimes(2)

    const event = { nativeEvent: { timestamp: 0, utcOffset: 0 } }
    await runNativeAction(() => {
      pickerB.onValueChange(event, new Date(2000, 0, 1, 13, 0))
    })
    expect(changeB).toHaveBeenCalledExactlyOnceWith({ hour: 13, minute: 0 })
    expect(changeA).not.toHaveBeenCalled()
  })

  test.each(['resolve', 'reject'] as const)(
    'unmount-dismiss cleanup blocks a second field before native %s settles and permits open after',
    async outcome => {
      const changeA = vi.fn()
      const changeB = vi.fn()
      let resolveDismissal: (value: boolean) => void = () => {
        throw new Error('Missing resolver')
      }
      let rejectDismissal: (reason: Error) => void = () => {
        throw new Error('Missing rejecter')
      }
      const dismissalPromise = new Promise<boolean>((resolve, reject) => {
        resolveDismissal = resolve
        rejectDismissal = reject
      })

      const rootA = await renderNative(
        <LumenTimeField label="Time A" onValueChange={changeA} value={null} />
      )
      const rootB = await renderNative(
        <LumenTimeField label="Time B" onValueChange={changeB} value={null} />
      )

      await openAndroidTimeField(rootA, 'Time A')
      vi.mocked(DateTimePickerAndroid.dismiss).mockReturnValueOnce(dismissalPromise)

      // Unmounting rootA begins dismissal
      await runNativeAction(() => {
        rootA.unmount()
      })
      expect(DateTimePickerAndroid.dismiss).toHaveBeenCalledExactlyOnceWith('time')

      // Attempting to open Time B BEFORE dismissal settles must be BLOCKED
      await runNativeAction(() => {
        callAction(readProp(findByAccessibilityLabel(rootB, 'Time B, Choose a time'), 'onPress'), 'Missing time trigger')
      })
      expect(DateTimePickerAndroid.open).toHaveBeenCalledOnce()

      // Settle dismissal
      await runNativeAction(() => {
        if (outcome === 'resolve') resolveDismissal(true)
        else rejectDismissal(new Error('Native activity destroyed during dismiss'))
      })

      // After dismissal settles, Time B can open cleanly
      const pickerB = await openAndroidTimeField(rootB, 'Time B')
      expect(DateTimePickerAndroid.open).toHaveBeenCalledTimes(2)

      const event = { nativeEvent: { timestamp: 0, utcOffset: 0 } }
      await runNativeAction(() => {
        pickerB.onValueChange(event, new Date(2000, 0, 1, 15, 45))
      })
      expect(changeB).toHaveBeenCalledExactlyOnceWith({ hour: 15, minute: 45 })
    }
  )
})
