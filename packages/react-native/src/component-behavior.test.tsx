// cspell:words Espacios Configuración Cambios guardados Registro actualizado Otro
import { act, type ComponentRef, createRef, type ReactElement, type Ref, StrictMode, useImperativeHandle, useState } from 'react'
import type { View } from 'react-native'

import { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { getLumenPhoneCountry } from '@santi020k/lumen-core'
import type { LumenMediaViewportValue } from '@santi020k/lumen-core/media-workspace'
import { createRoot, type Root, type TestInstance } from 'test-renderer'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { LumenBrandGithubIconGraphic } from './static-icons/brand-github.generated.js'
import { LumenSearchIconGraphic } from './static-icons/search.generated.js'
import { LumenButtonGroup, LumenChip, LumenFieldGroup, LumenTextarea, LumenToast } from './additional-components.js'
import { LumenAutocomplete, LumenInputOTP, LumenNumberField, LumenPasswordField } from './advanced-form-components.js'
import { LumenBreadcrumb } from './breadcrumb-components.js'
import { LumenBarChart, LumenComboChart, LumenHeatmap, LumenHistogram, LumenLineChart, LumenRangeChart, LumenScatterChart, LumenWaterfallChart } from './chart-components.js'
import { LumenImageComparison } from './comparison-components.js'
import { LumenDateField, LumenDateRangeField } from './datetime-components.js'
import { LumenSearchField, LumenToggle } from './form-components.js'
import { LumenIcon as GraphicIcon, LumenIconButton as GraphicIconButton, type LumenIconGraphicProps } from './graphics.js'
import { type LumenToastHookController, type LumenToastHookOptions, useToast } from './hooks.js'
import { LumenMediaThumbnail, LumenMediaViewport } from './media-workspace-components.js'
import { LumenMultiSelect } from './multi-select-components.js'
import { LumenAlertDialog, LumenMenu, LumenSheet } from './overlay-components.js'
import { LumenPhoneInput } from './phone-components.js'
import { resolveLumenPhoneInputValue } from './phone-recipes.js'
import { LumenNavigationBar } from './platform-components.js'
import { LumenButton, LumenIcon, LumenIconButton, LumenText, LumenTextField } from './primitives.js'
import { LumenProvider } from './provider.js'
import { LumenRating } from './rating-components.js'
import { resolveLumenRating } from './rating-recipes.js'
import { LumenCheckbox, LumenTabs } from './selection-components.js'
import { LumenStepper } from './stepper-components.js'
import { resolveLumenStepState } from './stepper-recipes.js'
import { LumenBanner, LumenErrorState, LumenStatusBar } from './structured-components.js'
import { LumenDataTable } from './table-components.js'
import type { LumenTableRow } from './table-recipes.js'
import { createLumenTheme } from './theme.js'
import { LumenTimeField, type LumenTimeFieldProps } from './time-components.js'
import { LumenTimeline, LumenTimelineItem } from './timeline-components.js'
import { LumenPicker, LumenRangeSlider, LumenSlider } from './value-components.js'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const nativeDirection = vi.hoisted(() => ({ isRTL: false }))
const nativePlatform = vi.hoisted(() => ({ OS: 'ios' }))
const nativeMotion = vi.hoisted(() => ({ enabled: false }))
const accessibilityFocus = vi.hoisted(() => vi.fn())
const accessibilityAnnouncement = vi.hoisted(() => vi.fn<(message: string, options: { queue: boolean }) => void>())
type RecommendedTimeout = (duration: number) => Promise<number>
const accessibilityTimeout = vi.hoisted(() => vi.fn<RecommendedTimeout>(duration => Promise.resolve(duration)))
const nativeWindow = vi.hoisted(() => ({ fontScale: 1, height: 800, scale: 2, width: 400 }))
const safeAreaInsets = vi.hoisted(() => ({
  bottom: 34,
  left: 8,
  right: 12,
  top: 20
}))

vi.mock('react-native', async () => {
  const { createElement, isValidElement, useImperativeHandle } = await import('react')
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
    AccessibilityInfo: {
      addEventListener: () => ({ remove: vi.fn() }),
      announceForAccessibilityWithOptions: accessibilityAnnouncement,
      getRecommendedTimeoutMillis: accessibilityTimeout,
      isReduceMotionEnabled: () => Promise.resolve(nativeMotion.enabled),
      sendAccessibilityEvent: accessibilityFocus
    },
    ActivityIndicator: hostComponent('ActivityIndicator'),
    FlatList: (props: Record<string, unknown>): ReactElement => {
      const renderItem = props.renderItem
      const data: readonly unknown[] = Array.isArray(props.data) ? props.data : []
      const children = data.map((item, index) => {
        if (typeof renderItem !== 'function') return null

        const rendered: unknown = Reflect.apply(renderItem, undefined, [{ item, index }])

        return isValidElement(rendered) ? rendered : null
      })

      return createElement('FlatList', props, children)
    },
    I18nManager: nativeDirection,
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
    useWindowDimensions: () => nativeWindow,
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

interface ToastProbeProps {
  ref: Ref<LumenToastHookController>
  options?: LumenToastHookOptions
}

const ToastProbe = ({ ref, options }: ToastProbeProps): ReactElement | null => {
  const controller = useToast(options)

  useImperativeHandle(ref, () => controller, [controller])

  return null
}

const readToastController = (ref: { current: LumenToastHookController | null }): LumenToastHookController => {
  if (!ref.current) throw new Error('Toast controller is not mounted')

  return ref.current
}

const deferredTimeout = () => {
  let complete: (duration: number) => void = () => {
    throw new Error('Missing timeout resolver')
  }
  const promise = new Promise<number>(resolve => {
    complete = resolve
  })

  return { promise, resolve: complete }
}

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
  nativeDirection.isRTL = false
  const roots = mountedRoots.splice(0)

  await act(async () => {
    for (const root of roots) root.unmount()
    await Promise.resolve()
  })
  nativeWindow.fontScale = 1
  nativePlatform.OS = 'ios'
  accessibilityAnnouncement.mockClear()
  accessibilityTimeout.mockReset().mockImplementation(duration => Promise.resolve(duration))
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('Lumen React Native component behavior', () => {
  test.each(['bar', 'line', 'scatter', 'range', 'combo'] as const)(
    '%s chart fits its container and resizes without removing data', async kind => {
      const data = [3, 7, 4, 8, 5].map((y, x) => ({ x, y }))
      const series = [{ id: 'activity', label: 'Changes', data }]
      const props = { label: 'Weekly activity', showData: false, series }
      const charts = {
        bar: <LumenBarChart {...props} />,
        line: <LumenLineChart {...props} />,
        scatter: <LumenScatterChart {...props} />,
        range: <LumenRangeChart label="Weekly range" showData={false} data={data.map(({ x, y }) => ({ x, low: y, high: y + 2 }))} />,
        combo: <LumenComboChart {...props} series={[{ id: 'activity', label: 'Changes', data, mark: 'bar' }]} />
      }
      const root = await renderNative(charts[kind])
      const layouts = root.container.queryAll(instance => instance.type === 'View' && typeof readProp(instance, 'onLayout') === 'function')
      expect(layouts).toHaveLength(1)
      const layout = layouts[0]
      if (!layout) throw new Error('Missing chart container')
      const handler = readProp(layout, 'onLayout')
      if (typeof handler !== 'function') throw new Error('Missing chart layout handler')

      for (const width of [268, 720, 300, 0, Number.NaN]) {
        await act(async () => {
          Reflect.apply(handler, undefined, [{ nativeEvent: { layout: { width } } }])
          await Promise.resolve()
        })
        const expectedWidth = width > 0 && Number.isFinite(width) ? width : 300
        const svg = findHostComponent(root, 'Svg')
        expect(readProp(svg, 'width')).toBe(expectedWidth)
        expect(readProp(svg, 'height')).toBe(Math.min(320, Math.max(220, expectedWidth * 0.75)))
        expect(root.container.queryAll(instance => instance.type === 'ScrollView')).toHaveLength(0)
        const bars = root.container.queryAll(instance => instance.type === 'Rect')
        expect(bars).toHaveLength(['bar', 'combo'].includes(kind) ? 5 : 0)
        for (const bar of bars) {
          const coordinates = /translate\(([-\d.]+) ([-\d.]+)\)/u.exec(String(readProp(bar, 'transform')))
          if (!coordinates?.[1]) throw new Error('Missing bar coordinates')
          expect(Number(coordinates[1])).toBeGreaterThanOrEqual(0)
          expect(Number(coordinates[1]) + Number(readProp(bar, 'width'))).toBeLessThanOrEqual(expectedWidth)
        }
      }
    }
  )

  test.each([
    { rtl: false, values: [20, 50, 120, 20, 120] },
    { rtl: true, values: [120, 100, 20, 120, 20] }
  ])('slider touch follows RTL=$rtl while accessibility values remain numeric', async ({ rtl, values }) => {
    nativeDirection.isRTL = rtl
    const onValueChange = vi.fn<(value: number) => void>()
    const root = await renderNative(
      <LumenSlider label="Volume" min={20} max={120} step={10} value={70} onValueChange={onValueChange} />
    )
    const slider = findByAccessibilityRole(root, 'adjustable')
    expect(readProp(slider, 'accessible')).toBe(true)
    const dispatch = async (property: string, nativeEvent: unknown): Promise<void> => {
      const handler = readProp(slider, property)
      if (typeof handler !== 'function') throw new Error(`Missing slider ${property} callback`)
      await act(async () => {
        Reflect.apply(handler, undefined, [{ nativeEvent }])
        await Promise.resolve()
      })
    }
    await dispatch('onLayout', { layout: { width: 200 } })
    for (const [index, position] of [0, 50, 200, -50, 250].entries()) {
      for (const event of ['onResponderGrant', 'onResponderMove']) {
        await dispatch(event, { locationX: position })
        expect(onValueChange).toHaveBeenLastCalledWith(values[index])
      }
    }
    await dispatch('onAccessibilityAction', { actionName: 'increment' })
    expect(onValueChange).toHaveBeenLastCalledWith(80)
    await dispatch('onAccessibilityAction', { actionName: 'decrement' })
    expect(onValueChange).toHaveBeenLastCalledWith(60)
    expect(readProp(slider, 'accessibilityValue')).toMatchObject({ min: 20, max: 120, now: 70 })
  })

  test('range endpoints stay controlled, independently named and cannot cross', async () => {
    const onValueChange = vi.fn<(value: readonly [number, number]) => void>()
    const root = await renderNative(
      <LumenRangeSlider
        label="Capacity"
        startLabel="Lower"
        endLabel="Upper"
        value={[20, 60]}
        min={0}
        max={100}
        step={10}
        onValueChange={onValueChange}
        formatValue={value => `${value}%`}
      />
    )
    const sliders = root.container.queryAll(instance => readProp(instance, 'accessibilityRole') === 'adjustable')
    expect(sliders).toHaveLength(2)
    const [start, end] = sliders
    if (!start || !end) throw new Error('Missing interval endpoints')
    expect(readProp(start, 'accessibilityLabel')).toBe('Capacity · Lower')
    expect(readProp(end, 'accessibilityLabel')).toBe('Capacity · Upper')
    expect(readProp(start, 'accessibilityValue')).toMatchObject({ now: 20, text: '20%' })
    expect(readProp(start, 'aria-valuenow')).toBe(20)
    expect(readProp(start, 'aria-valuetext')).toBe('20%')
    const move = async (slider: TestInstance, direction: string): Promise<void> => {
      const handler = readProp(slider, 'onAccessibilityAction')
      if (typeof handler !== 'function') throw new Error('Missing range adjustment')
      await act(async () => {
        Reflect.apply(handler, undefined, [{ nativeEvent: { actionName: direction } }])
        await Promise.resolve()
      })
    }
    await move(start, 'increment')
    expect(onValueChange).toHaveBeenLastCalledWith([30, 60])
    await move(end, 'decrement')
    expect(onValueChange).toHaveBeenLastCalledWith([20, 50])
    // The application has not accepted either update; subsequent intent uses its controlled value.
    await move(start, 'increment')
    expect(onValueChange).toHaveBeenLastCalledWith([30, 60])
    await act(async () => {
      root.render(
        <LumenProvider>
          <LumenRangeSlider
            label="Capacity"
            value={[60, 60]}
            min={0}
            max={100}
            step={10}
            onValueChange={onValueChange}
          />
        </LumenProvider>
      )
      await Promise.resolve()
    })
    const next = root.container.queryAll(instance => readProp(instance, 'accessibilityRole') === 'adjustable')
    if (!next[0] || !next[1]) throw new Error('Missing updated interval endpoints')
    await move(next[0], 'increment')
    expect(onValueChange).toHaveBeenLastCalledWith([60, 60])
    await move(next[1], 'decrement')
    expect(onValueChange).toHaveBeenLastCalledWith([60, 60])
  })

  test.each([{ enabled: false, readOnly: false }, { enabled: true, readOnly: true }])(
    'range endpoints reject touch and accessibility when enabled=$enabled readOnly=$readOnly',
    async ({ enabled, readOnly }) => {
      const onValueChange = vi.fn<(value: readonly [number, number]) => void>()
      const root = await renderNative(
        <LumenRangeSlider
          label="Capacity"
          value={[20, 80]}
          enabled={enabled}
          readOnly={readOnly}
          onValueChange={onValueChange}
        />
      )
      const sliders = root.container.queryAll(instance => readProp(instance, 'accessibilityRole') === 'adjustable')
      for (const slider of sliders) {
        expect(readProp(slider, 'accessibilityState')).toEqual({ disabled: true })
        for (const [event, nativeEvent] of [
          ['onAccessibilityAction', { actionName: 'increment' }],
          ['onResponderGrant', { locationX: 100 }],
          ['onResponderMove', { locationX: 100 }]
        ] as const) {
          const handler = readProp(slider, event)
          if (typeof handler !== 'function') throw new Error(`Missing ${event}`)
          await act(async () => {
            Reflect.apply(handler, undefined, [{ nativeEvent }])
            await Promise.resolve()
          })
        }
      }
      expect(onValueChange).not.toHaveBeenCalled()
    }
  )

  test('uses the Android accessibility timeout before dismissing a toast', async () => {
    nativePlatform.OS = 'android'
    vi.useFakeTimers()
    accessibilityTimeout.mockResolvedValue(20_000)
    const ref = createRef<LumenToastHookController>()

    await renderNative(<ToastProbe ref={ref} />)
    await act(async () => {
      readToastController(ref).create({ title: 'Saved' })
      await Promise.resolve()
    })

    expect(accessibilityTimeout).toHaveBeenCalledExactlyOnceWith(5000)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(19_999)
    })
    expect(readToastController(ref).toasts).toHaveLength(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(readToastController(ref).toasts).toHaveLength(0)
  })

  test.each(['shorter', 'invalid', 'oversized', 'rejected'])('retains the requested duration when Android returns a %s recommendation', async result => {
    nativePlatform.OS = 'android'
    vi.useFakeTimers()

    if (result === 'rejected') accessibilityTimeout.mockRejectedValue(new Error('Native timeout unavailable'))
    else if (result === 'shorter') accessibilityTimeout.mockResolvedValue(1)
    else if (result === 'oversized') accessibilityTimeout.mockResolvedValue(Number.MAX_SAFE_INTEGER)
    else accessibilityTimeout.mockResolvedValue(Number.NaN)

    const ref = createRef<LumenToastHookController>()

    await renderNative(<ToastProbe ref={ref} />)
    await act(async () => {
      readToastController(ref).create({ duration: 1000, title: 'Saved' })
      await Promise.resolve()
    })
    expect(accessibilityTimeout).toHaveBeenCalledExactlyOnceWith(1000)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(999)
    })
    expect(readToastController(ref).toasts).toHaveLength(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(readToastController(ref).toasts).toHaveLength(0)
  })

  test.each(['dismiss', 'clear', 'unmount', 'evict'])('ignores late Android timeout results after %s', async operation => {
    nativePlatform.OS = 'android'
    vi.useFakeTimers()
    const pending = deferredTimeout()

    accessibilityTimeout.mockReturnValueOnce(pending.promise)

    const ref = createRef<LumenToastHookController>()
    const root = await renderNative(<ToastProbe options={{ maxCount: 1 }} ref={ref} />)
    let id = ''

    await act(async () => {
      id = readToastController(ref).create({ title: 'Saved' })
      await Promise.resolve()
    })
    expect(accessibilityTimeout).toHaveBeenCalledExactlyOnceWith(5000)

    await act(async () => {
      if (operation === 'dismiss') readToastController(ref).dismiss(id)
      if (operation === 'clear') readToastController(ref).clear()
      if (operation === 'unmount') root.unmount()
      if (operation === 'evict') readToastController(ref).create({ duration: 0, title: 'Persistent replacement' })
      await Promise.resolve()
    })
    await act(async () => {
      pending.resolve(20_000)
      await Promise.resolve()
    })

    expect(vi.getTimerCount()).toBe(0)
  })

  test('ignores stale Android recommendations when a toast duration is updated', async () => {
    nativePlatform.OS = 'android'
    vi.useFakeTimers()
    const pending = deferredTimeout()

    accessibilityTimeout.mockReturnValueOnce(pending.promise).mockResolvedValueOnce(10_000)

    const ref = createRef<LumenToastHookController>()

    await renderNative(<ToastProbe ref={ref} />)
    await act(async () => {
      const id = readToastController(ref).create({ title: 'Saved' })

      readToastController(ref).update(id, { duration: 1000 })
      await Promise.resolve()
    })
    expect(accessibilityTimeout).toHaveBeenNthCalledWith(1, 5000)
    expect(accessibilityTimeout).toHaveBeenNthCalledWith(2, 1000)
    expect(accessibilityTimeout).toHaveBeenCalledTimes(2)

    await act(async () => {
      pending.resolve(100_000)
      await Promise.resolve()
      await vi.advanceTimersByTimeAsync(10_000)
    })

    expect(readToastController(ref).toasts).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  test('keeps explicitly persistent Android toasts without requesting a timeout', async () => {
    nativePlatform.OS = 'android'
    vi.useFakeTimers()
    const ref = createRef<LumenToastHookController>()

    await renderNative(<ToastProbe ref={ref} />)
    await act(async () => {
      for (const duration of [0, -1, Number.POSITIVE_INFINITY]) readToastController(ref).create({ duration, title: 'Saved' })
      await vi.advanceTimersByTimeAsync(100_000)
    })

    expect(readToastController(ref).toasts).toHaveLength(3)
    expect(accessibilityTimeout).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  test.each(['ios', 'web'])('preserves the requested %s toast duration without Android timeout calls', async platform => {
    nativePlatform.OS = platform
    vi.useFakeTimers()
    const ref = createRef<LumenToastHookController>()

    await renderNative(<ToastProbe ref={ref} />)
    await act(async () => {
      readToastController(ref).create({ duration: 1000, title: 'Saved' })
      await vi.advanceTimersByTimeAsync(1000)
    })

    expect(readToastController(ref).toasts).toHaveLength(0)
    expect(accessibilityTimeout).not.toHaveBeenCalled()
  })

  test('keeps enlarged navigation labels readable and preserves destination semantics', async () => {
    const select = vi.fn()
    const reselect = vi.fn()
    const items = [
      { label: 'Espacios de trabajo', value: 'workspaces' },
      { label: 'Configuración', value: 'settings' },
      { disabled: true, label: 'Archivo', value: 'archive' }
    ]
    const navigation = <LumenNavigationBar items={items} onReselect={reselect} onValueChange={select} value="workspaces" />
    const root = await renderNative(navigation)
    const labels = () => root.container.queryAll(instance => instance.type === 'Text')
    expect(labels().map(label => readProp(label, 'numberOfLines'))).toEqual([1, 1, 1])

    nativeWindow.fontScale = 3
    await act(async () => {
      root.render(<LumenProvider scheme="light"><LumenNavigationBar items={items} onReselect={reselect} onValueChange={select} value="workspaces" /></LumenProvider>)
      await Promise.resolve()
    })
    expect(labels().every(label => readProp(label, 'numberOfLines') === undefined)).toBe(true)
    expect(labels().every(label => {
      const style = readProp(label, 'style')
      return typeof style === 'object' && style !== null && 'maxWidth' in style && style.maxWidth === '100%'
    })).toBe(true)
    const selected = findByAccessibilityLabel(root, 'Espacios de trabajo')
    expect(readProp(selected, 'accessibilityState')).toMatchObject({ selected: true })
    callAction(readProp(selected, 'onPress'), 'Missing reselect action')
    expect(reselect).toHaveBeenCalledWith('workspaces')
    const settings = findByAccessibilityLabel(root, 'Configuración')
    callAction(readProp(settings, 'onPress'), 'Missing destination action')
    expect(select).toHaveBeenCalledWith('settings')
    expect(readProp(findByAccessibilityLabel(root, 'Archivo'), 'disabled')).toBe(true)
  })

  test('keeps alert actions inside safe areas and makes oversized content scrollable', async () => {
    const root = await renderNative(
      <LumenAlertDialog
        confirmLabel="Delete"
        onConfirm={() => {}}
        onDismiss={() => {}}
        safeAreaInsets={safeAreaInsets}
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
        safeAreaInsets={safeAreaInsets}
        scrollable
        title="Settings"
        visible
      >
        <LumenText>Sheet content</LumenText>
      </LumenSheet>
    )
    const keyboardSurface = root.container.queryAll(
      instance => instance.type === 'KeyboardAvoidingView'
    )[0]
    const sheetPanel = root.container.queryAll(instance => {
      const style = readProp(instance, 'style')

      return typeof style === 'object' &&
        style !== null &&
        'paddingBottom' in style &&
        style.paddingBottom === 34
    })[0]

    if (!keyboardSurface || !sheetPanel) throw new Error('Expected the sheet surfaces.')

    expect(readProp(keyboardSurface, 'style')).toMatchObject({
      paddingBottom: 0,
      paddingLeft: 8,
      paddingRight: 12,
      paddingTop: 20
    })
    expect(readProp(sheetPanel, 'style')).toMatchObject({ paddingBottom: 34 })
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

  test('localizes required-field descriptions without exposing them on optional fields', async () => {
    const root = await renderNative(
      <>
        <LumenFieldGroup label="Nombre" required requiredLabel="obligatorio"><LumenTextField /></LumenFieldGroup>
        <LumenFieldGroup label="Notas" requiredLabel="obligatorio"><LumenTextField /></LumenFieldGroup>
      </>
    )

    expect(findByAccessibilityLabel(root, 'Nombre, obligatorio')).toBeDefined()
    expect(root.container.queryAll(instance => readProp(instance, 'accessibilityLabel') === 'Notas, obligatorio')).toHaveLength(0)
    expect(findByAccessibilityLabel(root, 'Notas')).toBeDefined()
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

  test('read-only phone input locks country selection and number editing', async () => {
    const country = getLumenPhoneCountry('CO')
    if (!country) throw new Error('Missing phone fixture')
    const root = await renderNative(<LumenPhoneInput label="Phone" onValueChange={() => {}} readOnly value={resolveLumenPhoneInputValue([country], country, '', {})} />)
    expect(readProp(findByAccessibilityLabel(root, 'Country code, Colombia, +57'), 'disabled')).toBe(true)
    expect(readProp(findByAccessibilityLabel(root, 'Phone number'), 'editable')).toBe(false)
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

  test('queues localized iOS toast copy once and announces changed content', async () => {
    const toast = (description: string) => (
      <StrictMode><LumenToast description={description} title="Cambios guardados" /></StrictMode>
    )
    const root = await renderNative(toast('Registro actualizado'))

    expect(accessibilityAnnouncement).toHaveBeenCalledExactlyOnceWith('Cambios guardados. Registro actualizado', { queue: true })

    await act(async () => {
      root.render(<LumenProvider scheme="light">{toast('Registro actualizado')}</LumenProvider>)
      await Promise.resolve()
    })

    expect(accessibilityAnnouncement).toHaveBeenCalledOnce()

    await act(async () => {
      root.render(<LumenProvider scheme="light">{toast('Otro registro actualizado')}</LumenProvider>)
      await Promise.resolve()
    })

    expect(accessibilityAnnouncement).toHaveBeenLastCalledWith('Cambios guardados. Otro registro actualizado', { queue: true })
    expect(accessibilityAnnouncement).toHaveBeenCalledTimes(2)
  })

  test('honors iOS error announcement urgency and off without speaking diagnostic references', async () => {
    const root = await renderNative(<LumenErrorState announcement="assertive" description="Try again" reference="request-123" title="Unable to save" />)

    expect(accessibilityAnnouncement).toHaveBeenCalledExactlyOnceWith('Unable to save. Try again', { queue: false })

    await act(async () => {
      root.render(<LumenProvider scheme="light"><LumenErrorState announcement="off" title="Unable to save" /></LumenProvider>)
      await Promise.resolve()
    })

    expect(accessibilityAnnouncement).toHaveBeenCalledOnce()

    await act(async () => {
      root.render(<LumenProvider scheme="light"><LumenErrorState announcement="polite" title="Unable to save" /></LumenProvider>)
      await Promise.resolve()
    })

    expect(accessibilityAnnouncement).toHaveBeenLastCalledWith('Unable to save', { queue: true })
    expect(accessibilityAnnouncement).toHaveBeenCalledTimes(2)
  })

  test('does not announce initially disabled errors or empty toast copy on iOS', async () => {
    await renderNative(
      <>
        <LumenErrorState announcement="off" title="Unable to save" />
        <LumenToast title=" " />
      </>
    )

    expect(accessibilityAnnouncement).not.toHaveBeenCalled()
  })

  test.each(['android', 'web'])('keeps %s live regions without duplicate imperative announcements', async platform => {
    nativePlatform.OS = platform
    const root = await renderNative(
      <>
        <LumenToast title="Saved" />
        <LumenErrorState announcement="assertive" title="Unable to save" />
      </>
    )

    expect(readProp(findByAccessibilityRole(root, 'alert'), 'accessibilityLiveRegion')).toBe('polite')
    expect(readProp(findByAccessibilityRole(root, 'summary'), 'accessibilityLiveRegion')).toBe('assertive')
    expect(accessibilityAnnouncement).not.toHaveBeenCalled()
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

    expect(readProp(checkbox, 'accessibilityLabel')).toBe('Include diagnostics')
    expect(readProp(checkbox, 'aria-checked')).toBe(false)
    expect(readProp(checkbox, 'aria-disabled')).toBe(false)

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

  test('checkbox preserves a host-provided accessible name', async () => {
    const root = await renderNative(
      <LumenCheckbox checked={false} label="Diagnostics" accessibilityLabel="Include diagnostic report" onCheckedChange={() => undefined} />
    )

    expect(readProp(findByAccessibilityRole(root, 'checkbox'), 'accessibilityLabel')).toBe('Include diagnostic report')
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
    expect(readProp(toggle, 'aria-checked')).toBe(false)
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

  test('web toggle keeps the decorative native input out of the tab order', async () => {
    nativePlatform.OS = 'web'
    const onValueChange = vi.fn()
    const root = await renderNative(<LumenToggle label="Updates" onValueChange={onValueChange} value={false} />)
    const control = root.container.queryAll(instance => instance.type === 'Switch')[0]
    if (!control) throw new Error('Missing decorative switch')
    expect(readProp(control, 'disabled')).toBe(true)
    expect(readProp(control, 'aria-hidden')).toBe(true)
    const row = findByAccessibilityRole(root, 'switch')
    expect(readProp(row, 'disabled')).toBe(false)
    await act(async () => {
      callAction(readProp(row, 'onPress'), 'Missing row action')
      await Promise.resolve()
    })
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(true)
    nativePlatform.OS = 'ios'
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

  test('uses the translated tab label by default and accepts an explicit translated panel name', async () => {
    const fixture = (panelAccessibilityLabel?: string): ReactElement => (
      <LumenTabs label="Vistas" onValueChange={vi.fn()} options={[{ label: 'Resumen', value: 'overview' }]} {...(panelAccessibilityLabel ? { panelAccessibilityLabel } : {})} value="overview">
        <LumenText>Contenido</LumenText>
      </LumenTabs>
    )
    const root = await renderNative(fixture())
    const panel = root.container.queryAll(instance => readProp(instance, 'role') === 'tabpanel')[0]
    if (!panel) throw new Error('Missing tab panel')
    expect(readProp(panel, 'accessibilityLabel')).toBe('Resumen')
    await act(async () => {
      root.render(<LumenProvider>{fixture('Contenido del resumen')}</LumenProvider>)
      await Promise.resolve()
    })
    const translatedPanel = root.container.queryAll(instance => readProp(instance, 'role') === 'tabpanel')[0]
    if (!translatedPanel) throw new Error('Missing translated tab panel')
    expect(readProp(translatedPanel, 'accessibilityLabel')).toBe('Contenido del resumen')
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

describe('LumenSheet consumer layouts', () => {
  afterEach(() => {
    nativeMotion.enabled = false
    nativeWindow.width = 400
    nativeWindow.height = 800
    nativeWindow.fontScale = 1
    nativePlatform.OS = 'ios'
    accessibilityFocus.mockClear()
  })

  test.each([
    { fontScale: 2, height: 800, alignment: 'center' },
    { fontScale: 1, height: 320, alignment: 'flex-end' }
  ])('keeps headings and actions scrollable when space is limited: %j', async ({ alignment, ...window }) => {
    Object.assign(nativeWindow, window, { width: 1024 })
    const root = await renderNative(
      <LumenSheet actions={<LumenButton>Save changes</LumenButton>} onDismiss={vi.fn()} presentation="adaptive" title="A long translated heading" visible>
        <LumenTextField accessibilityLabel="Details" />
      </LumenSheet>
    )
    const scroll = findHostComponent(root, 'ScrollView')

    expect(scroll.queryAll(instance => readProp(instance, 'accessibilityRole') === 'header')).toHaveLength(1)
    expect(scroll.queryAll(instance => readProp(instance, 'accessibilityRole') === 'button')).toHaveLength(1)
    expect(readProp(scroll, 'keyboardShouldPersistTaps')).toBe('handled')
    expect(readProp(findHostComponent(root, 'KeyboardAvoidingView'), 'style')).toMatchObject({ justifyContent: alignment })
  })

  test('preserves application-owned virtualization at accessibility text sizes', async () => {
    nativeWindow.fontScale = 3
    const root = await renderNative(
      <LumenSheet onDismiss={vi.fn()} scrollable={false} visible>
        <LumenText>Virtualized collection</LumenText>
      </LumenSheet>
    )

    expect(root.container.queryAll(instance => instance.type === 'ScrollView')).toHaveLength(0)
  })

  test('focuses an explicit initial control after presentation and restores the trigger after closing', async () => {
    const initialFocusRef = createRef<ComponentRef<typeof View>>()
    const returnFocusRef = createRef<ComponentRef<typeof View>>()
    let restoreFrame: (() => void) | undefined
    vi.stubGlobal('requestAnimationFrame', (callback: () => void) => {
      restoreFrame = callback

      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    const fixture = (visible: boolean): ReactElement => (
      <>
        <LumenButton ref={returnFocusRef}>Edit</LumenButton>
        <LumenSheet
          initialFocusRef={initialFocusRef}
          onDismiss={vi.fn()}
          returnFocusRef={returnFocusRef}
          visible={visible}
        >
          <LumenButton ref={initialFocusRef}>Save</LumenButton>
        </LumenSheet>
      </>
    )
    const root = await renderNative(fixture(true))
    callAction(readProp(findHostComponent(root, 'Modal'), 'onShow'), 'Missing modal presentation event')
    expect(accessibilityFocus).toHaveBeenCalledExactlyOnceWith(initialFocusRef.current, 'focus')
    await act(async () => {
      root.render(<LumenProvider>{fixture(false)}</LumenProvider>)
      await Promise.resolve()
    })
    expect(accessibilityFocus).toHaveBeenCalledTimes(1)
    if (!restoreFrame) throw new Error('Expected a deferred focus restoration')
    restoreFrame()
    expect(accessibilityFocus).toHaveBeenLastCalledWith(returnFocusRef.current, 'focus')
  })

  test('wraps related actions at ordinary text sizes and stacks them at accessibility sizes', async () => {
    const fixture = (): ReactElement => (
      <LumenButtonGroup accessibilityLabel="Form actions">
        <LumenButton>Cancel</LumenButton>
        <LumenButton>Save</LumenButton>
      </LumenButtonGroup>
    )
    const root = await renderNative(fixture())
    const group = root.container.queryAll(instance => readProp(instance, 'accessibilityLabel') === 'Form actions')[0]
    if (!group) throw new Error('Missing action group')
    expect(readProp(group, 'style')).toEqual(expect.arrayContaining([expect.objectContaining({ flexDirection: 'row', flexWrap: 'wrap' })]))
    nativeWindow.fontScale = 2
    await act(async () => {
      root.render(<LumenProvider>{fixture()}</LumenProvider>)
      await Promise.resolve()
    })
    const updated = root.container.queryAll(instance => readProp(instance, 'accessibilityLabel') === 'Form actions')[0]
    if (!updated) throw new Error('Missing updated action group')
    expect(readProp(updated, 'style')).toEqual(expect.arrayContaining([expect.objectContaining({ flexDirection: 'column', flexWrap: 'nowrap' })]))
  })

  test('keeps actions outside the scrolling body and opts into keyboard avoidance', async () => {
    const root = await renderNative(
      <LumenSheet
        actions={<LumenButton>Save</LumenButton>}
        avoidKeyboard
        keyboardVerticalOffset={24}
        onDismiss={vi.fn()}
        safeAreaInsets={{ bottom: 34 }}
        scrollable
        title="Edit record"
        visible
      >
        <LumenTextField accessibilityLabel="Name" />
      </LumenSheet>
    )
    const scroll = root.container.queryAll(instance => instance.type === 'ScrollView')[0]
    const keyboard = root.container.queryAll(instance => instance.type === 'KeyboardAvoidingView')[0]
    if (!scroll || !keyboard) throw new Error('Missing keyboard or scrolling surface')
    expect(readProp(keyboard, 'enabled')).toBe(true)
    expect(readProp(keyboard, 'behavior')).toBe('padding')
    expect(readProp(keyboard, 'keyboardVerticalOffset')).toBe(24)
    expect(readProp(scroll, 'keyboardShouldPersistTaps')).toBe('handled')
    expect(scroll.queryAll(instance => readProp(instance, 'accessibilityRole') === 'button')).toHaveLength(0)
    expect(findByAccessibilityRole(root, 'header')).toBeDefined()
    expect(root.container.queryAll(instance => {
      const style = readProp(instance, 'style')
      return typeof style === 'object' && style !== null && 'paddingBottom' in style && style.paddingBottom === 34
    })).toHaveLength(1)
  })

  test('blocks platform and backdrop dismissal until the application unlocks it', async () => {
    const dismiss = vi.fn()
    const root = await renderNative(
      <LumenSheet dismissible={false} onDismiss={dismiss} visible><LumenText>Saving</LumenText></LumenSheet>
    )
    const modal = root.container.queryAll(instance => instance.type === 'Modal')[0]
    const backdrop = root.container.queryAll(instance => instance.type === 'Pressable')[0]
    if (!modal || !backdrop) throw new Error('Missing modal or backdrop')
    callAction(readProp(modal, 'onRequestClose'), 'Missing platform dismiss')
    callAction(readProp(backdrop, 'onPress'), 'Missing backdrop dismiss')
    expect(dismiss).not.toHaveBeenCalled()
    expect(readProp(backdrop, 'disabled')).toBe(true)
    await act(async () => {
      root.render(<LumenProvider scheme="light"><LumenSheet onDismiss={dismiss} visible><LumenText>Saved</LumenText></LumenSheet></LumenProvider>)
      await Promise.resolve()
    })
    const updatedModal = root.container.queryAll(instance => instance.type === 'Modal')[0]
    if (!updatedModal) throw new Error('Missing updated modal')
    callAction(readProp(updatedModal, 'onRequestClose'), 'Missing platform dismiss')
    expect(dismiss).toHaveBeenCalledOnce()
  })

  test('names sheets and hides backdrop targets from keyboard and accessibility traversal', async () => {
    const root = await renderNative(<LumenSheet onDismiss={vi.fn()} title="Edit record" visible><LumenText>Details</LumenText></LumenSheet>)
    const modal = root.container.queryAll(instance => instance.type === 'Modal')[0]
    const backdrop = root.container.queryAll(instance => instance.type === 'Pressable')[0]
    if (!modal || !backdrop) throw new Error('Missing modal or backdrop')
    expect(readProp(modal, 'accessibilityLabel')).toBe('Edit record')
    expect(readProp(backdrop, 'tabIndex')).toBe(-1)
    expect(readProp(backdrop, 'aria-hidden')).toBe(true)
  })

  test('honors the native reduced-motion setting', async () => {
    nativeMotion.enabled = true
    const root = await renderNative(<LumenSheet onDismiss={vi.fn()} visible><LumenText>Details</LumenText></LumenSheet>)
    const modal = root.container.queryAll(instance => instance.type === 'Modal')[0]
    if (!modal) throw new Error('Missing modal')
    expect(readProp(modal, 'animationType')).toBe('none')
  })

  test('honors reduced motion in confirmation dialogs and menus', async () => {
    nativeMotion.enabled = true
    const root = await renderNative(
      <>
        <LumenAlertDialog confirmLabel="Save" onConfirm={vi.fn()} onDismiss={vi.fn()} title="Save changes" visible />
        <LumenMenu accessibilityLabel="Actions" items={[]} trigger={<LumenText>Open menu</LumenText>} />
      </>
    )
    const modals = root.container.queryAll(instance => instance.type === 'Modal')

    expect(modals).toHaveLength(2)
    expect(modals.map(modal => readProp(modal, 'animationType'))).toEqual(['none', 'none'])
  })

  test('uses a centered adaptive dialog on wide windows and Android keyboard behavior', async () => {
    nativeWindow.width = 1024
    nativePlatform.OS = 'android'
    const root = await renderNative(
      <LumenSheet avoidKeyboard onDismiss={vi.fn()} presentation="adaptive" visible><LumenText>Details</LumenText></LumenSheet>
    )
    const modal = root.container.queryAll(instance => instance.type === 'Modal')[0]
    const keyboard = root.container.queryAll(instance => instance.type === 'KeyboardAvoidingView')[0]
    if (!modal || !keyboard) throw new Error('Missing modal or keyboard surface')
    expect(readProp(modal, 'animationType')).toBe('fade')
    expect(readProp(keyboard, 'behavior')).toBe('height')
    expect(readProp(keyboard, 'style')).toMatchObject({ alignItems: 'center', justifyContent: 'center' })
  })
})

describe('Static graphic icon accessibility', () => {
  const Graphic = ({ size, strokeWidth }: LumenIconGraphicProps): ReactElement => (
    <LumenText>{`Graphic ${String(size)} ${String(strokeWidth)}`}</LumenText>
  )

  test('names informative graphics and hides decorative graphics', async () => {
    const root = await renderNative(
      <>
        <GraphicIcon icon={Graphic} label="Search records" size="lg" strokeWidth={3} />
        <GraphicIcon icon={Graphic} decorative label="Decorative search" />
      </>
    )
    const informative = root.container.queryAll(instance => readProp(instance, 'accessibilityRole') === 'image' && readProp(instance, 'accessible') === true)
    expect(informative).toHaveLength(1)
    const named = informative[0]
    if (!named) throw new Error('Missing informative graphic')
    expect(readProp(named, 'accessibilityLabel')).toBe('Search records')
    expect(readProp(named, 'importantForAccessibility')).toBe('yes')
    expect(root.container.queryAll(instance => readProp(instance, 'children') === 'Graphic 24 3').length).toBeGreaterThan(0)
    const hidden = root.container.queryAll(instance => readProp(instance, 'importantForAccessibility') === 'no' && readProp(instance, 'accessible') === false)
    expect(hidden).toHaveLength(1)
    const decorative = hidden[0]
    if (!decorative) throw new Error('Missing decorative graphic')
    expect(readProp(decorative, 'accessibilityLabel')).toBeUndefined()
    expect(readProp(decorative, 'accessibilityElementsHidden')).toBe(true)
  })

  test('preserves named and custom icons through the root entrypoint', async () => {
    const root = await renderNative(
      <>
        <LumenIcon name="search" label="Named search" />
        <LumenIcon icon={Graphic} label="Custom search" />
        <LumenIconButton name="search" label="Named search action" disabled />
        <LumenIconButton icon={Graphic} label="Custom search action" disabled />
      </>
    )
    const icons = root.container.queryAll(instance => readProp(instance, 'accessibilityRole') === 'image')
    expect(icons.map(icon => readProp(icon, 'accessibilityLabel'))).toEqual(['Named search', 'Custom search'])
    const buttons = root.container.queryAll(instance => readProp(instance, 'accessibilityRole') === 'button')
    expect(buttons.map(button => readProp(button, 'accessibilityLabel'))).toEqual(['Named search action', 'Custom search action'])
    expect(buttons.map(button => readProp(button, 'accessibilityState'))).toEqual([{ disabled: true }, { disabled: true }])
  })

  test('canonical per-icon imports match named artwork and preserve accessible labels', async () => {
    const root = await renderNative(
      <>
        <LumenIcon name="search" label="Named search" size="lg" strokeWidth={3} />
        <GraphicIcon icon={LumenSearchIconGraphic} label="Static search" size="lg" strokeWidth={3} />
        <LumenIcon name="brand:github" decorative />
        <GraphicIcon icon={LumenBrandGithubIconGraphic} decorative />
      </>
    )
    const graphics = root.container.queryAll(instance => instance.type === 'Svg')
    expect(graphics).toHaveLength(4)
    const geometry = (graphic: TestInstance | undefined): unknown => {
      if (!graphic) throw new Error('Missing canonical SVG')
      return {
        props: Object.fromEntries(Object.entries(graphic.props).filter(([name]) => name !== 'children')),
        children: graphic.children.filter(child => typeof child !== 'string').map(child => ({ type: child.type, props: child.props }))
      }
    }
    expect(geometry(graphics[0])).toEqual(geometry(graphics[1]))
    expect(geometry(graphics[2])).toEqual(geometry(graphics[3]))
    const icons = root.container.queryAll(instance => readProp(instance, 'accessibilityRole') === 'image')
    expect(icons.map(icon => readProp(icon, 'accessibilityLabel'))).toEqual(['Named search', 'Static search'])
  })

  test('keeps graphic buttons named and announces disabled state', async () => {
    const root = await renderNative(<GraphicIconButton icon={Graphic} label="Search records" disabled />)
    const button = root.container.queryAll(instance => readProp(instance, 'accessibilityRole') === 'button')[0]
    if (!button) throw new Error('Missing graphic button')
    expect(readProp(button, 'accessibilityLabel')).toBe('Search records')
    expect(readProp(button, 'accessibilityState')).toEqual({ disabled: true })
    expect(readProp(button, 'disabled')).toBe(true)
  })
})

const callInputAction = (value: unknown, proposal: string): void => {
  if (typeof value !== 'function') throw new Error('Missing native input callback')
  Reflect.apply(value, undefined, [proposal])
}

const runNativeAction = async (action: () => void): Promise<void> => {
  await act(async () => {
    action()

    await Promise.resolve()
  })
}

describe('advanced native inputs', () => {
  test('secure entry hides on blur and after disabling and re-enabling', async () => {
    const props = { label: 'Password', onValueChange: vi.fn(), value: 'synthetic-fixture' }
    const root = await renderNative(<LumenPasswordField {...props} />)
    expect(readProp(findByAccessibilityLabel(root, 'Password'), 'secureTextEntry')).toBe(true)
    await runNativeAction(() => {
      callAction(readProp(findByAccessibilityLabel(root, 'Show password'), 'onPress'), 'Missing reveal')
    })
    expect(readProp(findByAccessibilityLabel(root, 'Password'), 'secureTextEntry')).toBe(false)
    await runNativeAction(() => {
      callAction(readProp(findByAccessibilityLabel(root, 'Password'), 'onBlur'), 'Missing blur')
    })
    expect(readProp(findByAccessibilityLabel(root, 'Password'), 'secureTextEntry')).toBe(true)
    await runNativeAction(() => {
      callAction(readProp(findByAccessibilityLabel(root, 'Show password'), 'onPress'), 'Missing reveal')
    })
    await runNativeAction(() => {
      root.render(<LumenProvider><LumenPasswordField {...props} enabled={false} /></LumenProvider>)
    })
    await runNativeAction(() => {
      root.render(<LumenProvider><LumenPasswordField {...props} /></LumenProvider>)
    })
    expect(readProp(findByAccessibilityLabel(root, 'Password'), 'secureTextEntry')).toBe(true)
  })

  test('OTP preserves native autofill, normalizes paste and emits completion only for changed full codes', async () => {
    const onValueChange = vi.fn<(value: string) => void>()
    const onComplete = vi.fn<(value: string) => void>()
    const root = await renderNative(<LumenInputOTP label="Code" value="123" onValueChange={onValueChange} onComplete={onComplete} />)
    const input = findByAccessibilityLabel(root, 'Code')
    expect(readProp(input, 'textContentType')).toBe('oneTimeCode')
    await runNativeAction(() => {
      callInputAction(readProp(input, 'onChangeText'), '١٢٣-４５６')
    })
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('123456')
    expect(onComplete).toHaveBeenCalledExactlyOnceWith('123456')
    await runNativeAction(() => {
      callInputAction(readProp(input, 'onChangeText'), 'not a code')
    })
    expect(onValueChange).toHaveBeenCalledTimes(1)
    await runNativeAction(() => {
      root.render(<LumenProvider><LumenInputOTP label="Code" value="123456" onValueChange={onValueChange} onComplete={onComplete} readOnly /></LumenProvider>)
    })
    await runNativeAction(() => {
      callInputAction(readProp(findByAccessibilityLabel(root, 'Code'), 'onChangeText'), '654321')
    })
    expect(onValueChange).toHaveBeenCalledTimes(1)
  })

  test('number entry retains raw drafts and steps exact localized values', async () => {
    const onValueChange = vi.fn<(value: string) => void>()
    const root = await renderNative(<LumenNumberField label="Amount" value="0,1" locale="es-CO" step="0.2" onValueChange={onValueChange} />)
    await runNativeAction(() => {
      callAction(readProp(findByAccessibilityLabel(root, 'Increase value'), 'onPress'), 'Missing increase')
    })
    expect(onValueChange).toHaveBeenLastCalledWith('0,3')
    await runNativeAction(() => {
      callInputAction(readProp(findByAccessibilityLabel(root, 'Amount'), 'onChangeText'), '12,')
    })
    expect(onValueChange).toHaveBeenLastCalledWith('12,')
    await runNativeAction(() => {
      root.render(<LumenProvider><LumenNumberField label="Amount" value="12," locale="es-CO" onValueChange={onValueChange} /></LumenProvider>)
    })
    expect(readProp(findByAccessibilityLabel(root, 'Increase value'), 'disabled')).toBe(true)
    expect(readProp(findByAccessibilityLabel(root, 'Amount'), 'aria-invalid')).toBe(true)
  })

  test('autocomplete publishes query before selection and closes its results', async () => {
    const calls: string[] = []
    const root = await renderNative(
      <LumenAutocomplete
        label="City"
        query="Bo"
        options={[{ label: 'Bogotá', value: 'bogota' }]}
        onQueryChange={query => {
          calls.push(query)
        }}
        onValueChange={value => {
          calls.push(value)
        }}
      />
    )
    await runNativeAction(() => {
      callInputAction(readProp(findByAccessibilityLabel(root, 'City'), 'onChangeText'), 'Bog')
    })
    calls.length = 0
    await runNativeAction(() => {
      callAction(readProp(findByAccessibilityLabel(root, 'Bogotá'), 'onPress'), 'Missing result')
    })
    expect(calls).toEqual(['Bogotá', 'bogota'])
    expect(root.container.queryAll(instance => readProp(instance, 'accessibilityLabel') === 'Close results')).toHaveLength(0)
  })

  test('autocomplete loading hides results and disabled state dismisses selection', async () => {
    const props = { label: 'City', onQueryChange: vi.fn(), onValueChange: vi.fn(), options: [{ label: 'Bogotá', value: 'bogota' }], query: '' }
    const root = await renderNative(<LumenAutocomplete {...props} loading />)
    await runNativeAction(() => {
      callInputAction(readProp(findByAccessibilityLabel(root, 'City'), 'onChangeText'), 'Bo')
    })
    expect(root.container.queryAll(instance => readProp(instance, 'accessibilityLabel') === 'Bogotá')).toHaveLength(0)
    await runNativeAction(() => {
      root.render(<LumenProvider><LumenAutocomplete {...props} enabled={false} /></LumenProvider>)
    })
    await runNativeAction(() => {
      root.render(<LumenProvider><LumenAutocomplete {...props} /></LumenProvider>)
    })
    expect(readProp(findByAccessibilityLabel(root, 'City'), 'accessibilityState')).toMatchObject({ expanded: false })
  })

  test.each(['ios', 'android', 'web'])('time formatting tolerates malformed locales on %s', async platform => {
    nativePlatform.OS = platform
    for (const locale of ['not_a_locale', 'en--US', '💥']) {
      const props = { label: 'Time', value: { hour: 9, minute: 30 }, locale, onValueChange: vi.fn() }
      const root = await renderNative(<LumenTimeField {...props} is24Hour />)

      expect(findByAccessibilityLabel(root, 'Time, 09:30')).toBeDefined()
      await runNativeAction(() => {
        root.render(<LumenProvider><LumenTimeField {...props} is24Hour={false} /></LumenProvider>)
      })
      expect(findByAccessibilityLabel(root, 'Time, 9:30 AM')).toBeDefined()
    }
  })

  test('time selection requires confirmation and cancellation preserves the value', async () => {
    nativePlatform.OS = 'ios'
    const onValueChange = vi.fn()
    const root = await renderNative(
      <LumenTimeField
        label="Time"
        value={{ hour: 9, minute: 30 }}
        locale="en-US"
        is24Hour
        minTime={{ hour: 9, minute: 0 }}
        maxTime={{ hour: 17, minute: 0 }}
        onValueChange={onValueChange}
      />
    )
    const open = async (): Promise<void> => {
      await runNativeAction(() => {
        callAction(readProp(findByAccessibilityLabel(root, 'Time, 09:30'), 'onPress'), 'Missing time trigger')
      })
    }
    await open()
    await runNativeAction(() => {
      const picker = findHostComponent(root, 'NativeDatePicker')
      const change = readProp(picker, 'onChange')
      if (typeof change !== 'function') throw new Error('Missing time change')
      Reflect.apply(change, undefined, [{ type: 'set' }, new Date(2000, 0, 1, 10, 45)])
    })
    expect(onValueChange).not.toHaveBeenCalled()
    await runNativeAction(() => {
      callAction(readProp(findByAccessibilityLabel(root, 'Cancel'), 'onPress'), 'Missing cancel')
    })
    expect(onValueChange).not.toHaveBeenCalled()
    await open()
    await runNativeAction(() => {
      callAction(readProp(findByAccessibilityLabel(root, 'Confirm'), 'onPress'), 'Missing confirm')
    })
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith({ hour: 9, minute: 30 })
  })

  test.each(['ios', 'web'])('time sheet resets controlled changes without discarding equivalent inputs on %s', async platform => {
    nativePlatform.OS = platform
    const updates = [
      { value: { hour: 11, minute: 15 }, expected: { hour: 11, minute: 15 } },
      { minTime: { hour: 10, minute: 0 }, expected: { hour: 10, minute: 0 } },
      { maxTime: { hour: 9, minute: 15 }, expected: { hour: 9, minute: 0 } }
    ]
    for (const { expected, ...update } of updates) {
      const onValueChange = vi.fn()
      const props: LumenTimeFieldProps = { label: 'Time',
        value: { hour: 9, minute: 30 },
        locale: 'en-US',
        is24Hour: true,
        minTime: { hour: 9, minute: 0 },
        maxTime: { hour: 17, minute: 0 },
        onValueChange }
      const root = await renderNative(<LumenTimeField {...props} />)
      await runNativeAction(() => {
        callAction(readProp(findByAccessibilityLabel(root, 'Time, 09:30'), 'onPress'), 'Missing time trigger')
      })
      await runNativeAction(() => {
        const picker = findHostComponent(root, platform === 'web' ? 'input' : 'NativeDatePicker')
        const change = readProp(picker, 'onChange')
        if (typeof change !== 'function') throw new Error('Missing time change')
        Reflect.apply(change, undefined, platform === 'web' ? [{ currentTarget: { value: '10:45' } }] : [{ type: 'set' }, new Date(2000, 0, 1, 10, 45)])
      })
      await runNativeAction(() => {
        root.render(
          <LumenProvider>
            <LumenTimeField
              {...props}
              value={{ hour: 9, minute: 30 }}
              minTime={{ hour: 9, minute: 0 }}
              maxTime={{ hour: 17, minute: 0 }}
            />
          </LumenProvider>
        )
      })
      expect(readProp(findHostComponent(root, 'Modal'), 'visible')).toBe(true)
      const draft = readProp(findHostComponent(root, platform === 'web' ? 'input' : 'NativeDatePicker'), 'value')
      expect(draft).toEqual(platform === 'web' ? '10:45' : new Date(2000, 0, 1, 10, 45))
      await runNativeAction(() => {
        root.render(<LumenProvider><LumenTimeField {...props} {...update} /></LumenProvider>)
      })
      expect(readProp(findHostComponent(root, 'Modal'), 'visible')).toBe(false)
      expect(onValueChange).not.toHaveBeenCalled()
      await runNativeAction(() => {
        callAction(readProp(findByAccessibilityLabel(root, `Time, ${update.value ? '11:15' : '09:30'}`), 'onPress'), 'Missing updated time trigger')
      })
      await runNativeAction(() => {
        callAction(readProp(findByAccessibilityLabel(root, 'Confirm'), 'onPress'), 'Missing time confirm')
      })
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith(expected)
    }
  })

  test('Android time rejects out-of-range selection and stale callbacks after disabling', async () => {
    nativePlatform.OS = 'android'
    const onValueChange = vi.fn()
    const props = { label: 'Time', locale: 'en-US', onValueChange, value: null }
    const root = await renderNative(<LumenTimeField {...props} minTime={{ hour: 9, minute: 0 }} />)
    await runNativeAction(() => {
      callAction(readProp(findByAccessibilityLabel(root, 'Time, Choose a time'), 'onPress'), 'Missing time trigger')
    })
    const options = vi.mocked(DateTimePickerAndroid.open).mock.calls.at(-1)?.[0]
    if (!options?.onValueChange) throw new Error('Missing Android time handler')
    const change = options.onValueChange
    await runNativeAction(() => {
      change({ nativeEvent: { timestamp: 0, utcOffset: 0 } }, new Date(2000, 0, 1, 8, 0))
    })
    expect(onValueChange).not.toHaveBeenCalled()
    await runNativeAction(() => {
      callAction(readProp(findByAccessibilityLabel(root, 'Time, Choose a time'), 'onPress'), 'Missing time trigger')
    })
    const current = vi.mocked(DateTimePickerAndroid.open).mock.calls.at(-1)?.[0]
    if (!current?.onValueChange) throw new Error('Missing Android time handler')
    const stale = current.onValueChange
    await runNativeAction(() => {
      root.render(<LumenProvider><LumenTimeField {...props} enabled={false} /></LumenProvider>)
    })
    expect(DateTimePickerAndroid.dismiss).toHaveBeenCalledWith('time')
    await runNativeAction(() => {
      stale({ nativeEvent: { timestamp: 0, utcOffset: 0 } }, new Date(2000, 0, 1, 10, 0))
    })
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('Android time validates current bounds and uses the current callback while the dialog is open', async () => {
    nativePlatform.OS = 'android'
    const openingCallback = vi.fn()
    const currentCallback = vi.fn()
    const props = { label: 'Time', locale: 'en-US', value: null }
    const root = await renderNative(
      <LumenTimeField {...props} minTime={{ hour: 9, minute: 0 }} onValueChange={openingCallback} />
    )
    const chooseAfterUpdate = async (hour: number): Promise<void> => {
      await runNativeAction(() => {
        root.render(
          <LumenProvider>
            <LumenTimeField {...props} minTime={{ hour: 9, minute: 0 }} onValueChange={openingCallback} />
          </LumenProvider>
        )
      })
      await runNativeAction(() => {
        callAction(readProp(findByAccessibilityLabel(root, 'Time, Choose a time'), 'onPress'), 'Missing time trigger')
      })
      const options = vi.mocked(DateTimePickerAndroid.open).mock.calls.at(-1)?.[0]
      if (!options?.onValueChange) throw new Error('Missing Android time handler')
      const change = options.onValueChange
      await runNativeAction(() => {
        root.render(<LumenProvider><LumenTimeField {...props} minTime={{ hour: 12, minute: 0 }} maxTime={{ hour: 17, minute: 0 }} onValueChange={currentCallback} rangeErrorLabel="Choose an afternoon time" /></LumenProvider>)
      })
      await runNativeAction(() => {
        change({ nativeEvent: { timestamp: 0, utcOffset: 0 } }, new Date(2000, 0, 1, hour, 30))
      })
    }
    await chooseAfterUpdate(10)
    expect(openingCallback).not.toHaveBeenCalled()
    expect(currentCallback).not.toHaveBeenCalled()
    expect(root.container.queryAll(instance => readProp(instance, 'children') === 'Choose an afternoon time').length).toBeGreaterThan(0)
    await chooseAfterUpdate(18)
    expect(currentCallback).not.toHaveBeenCalled()
    await chooseAfterUpdate(13)
    expect(openingCallback).not.toHaveBeenCalled()
    expect(currentCallback).toHaveBeenCalledExactlyOnceWith({ hour: 13, minute: 30 })
  })

  test.each(['en--US', 'invalid_tag', '💥'])('image comparison falls back for malformed locale %s', async locale => {
    const root = await renderNative(<LumenImageComparison label="Comparison" before={{ uri: 'fixture:before' }} after={{ uri: 'fixture:after' }} value={0.25} locale={locale} onValueChange={() => {}} />)
    const control = findByAccessibilityRole(root, 'adjustable')
    expect(readProp(control, 'accessibilityValue')).toMatchObject({ text: 'After 25%' })
  })

  test.each(['side-by-side', 'before', 'after'] as const)('image comparison %s mode presents labels without an adjustable control', async mode => {
    const root = await renderNative(<LumenImageComparison label="Comparison" before={{ uri: 'fixture:before' }} after={{ uri: 'fixture:after' }} value={0.25} mode={mode} onValueChange={() => {}} />)
    expect(root.container.queryAll(instance => readProp(instance, 'accessibilityRole') === 'adjustable')).toHaveLength(0)
    expect(root.container.queryAll(instance => readProp(instance, 'children') === 'Before').length > 0).toBe(mode !== 'after')
    expect(root.container.queryAll(instance => readProp(instance, 'children') === 'After').length > 0).toBe(mode !== 'before')
  })

  test('image comparison exposes one adjustable control and localized after percentage', async () => {
    const root = await renderNative(<LumenImageComparison label="Comparison" before={{ uri: 'fixture:before' }} after={{ uri: 'fixture:after' }} value={0.25} locale="es-CO" onValueChange={() => {}} />)
    const control = findByAccessibilityRole(root, 'adjustable')
    expect(readProp(control, 'accessibilityLabel')).toBe('Comparison')
    expect(readProp(control, 'accessibilityValue')).toMatchObject({ text: 'After 25%' })
    expect(root.container.queryAll(instance => readProp(instance, 'accessibilityRole') === 'image')).toHaveLength(0)
  })
})

describe('native chart data inspection', () => {
  test('renders zero as neutral and missing measurements with a separate marker and exact fallback', async () => {
    const root = await renderNative(
      <LumenHeatmap
        label="Activity"
        colorScale="diverging"
        data={[
          { x: 'Mon', y: 'AM', value: -2 },
          { x: 'Tue', y: 'AM', value: 0 },
          { x: 'Wed', y: 'AM', value: null },
          { x: 'Mon', y: 'AM', value: 40 }
        ]}
      />
    )
    const neutral = root.container.queryAll(instance => instance.type === 'Rect' && readProp(instance, 'fillOpacity') === 0)
    expect(neutral).toHaveLength(1)
    const missing = root.container.queryAll(instance => instance.type === 'Text' && readProp(instance, 'children') === '× Not available')
    expect(missing).toHaveLength(1)
    await act(async () => {
      callAction(readProp(findByAccessibilityRole(root, 'button'), 'onPress'), 'Missing chart disclosure')
      await Promise.resolve()
    })
    const rows = root.container.queryAll(instance => instance.type === 'Text').map(instance => readProp(instance, 'children'))
    expect(rows).toContain('Wed, AM: Not available')
    expect(rows).toContain('Tue, AM: 0')
    expect(rows).toContain('Mon, AM: -2')
    expect(rows).not.toContain('Mon, AM: 40')
  })

  test('opens and closes exact source values using a labeled disclosure', async () => {
    const root = await renderNative(
      <LumenWaterfallChart
        label="Revenue"
        data={[
          { id: 'opening', label: 'Opening', kind: 'total', value: 100 },
          { id: 'cost', label: 'Costs', value: -25 }
        ]}
      />
    )
    const button = findByAccessibilityRole(root, 'button')
    expect(readProp(button, 'accessibilityState')).toMatchObject({ expanded: false })
    expect(root.container.queryAll(instance => readProp(instance, 'accessibilityRole') === 'list')).toHaveLength(0)
    await act(async () => {
      callAction(readProp(button, 'onPress'), 'Missing chart disclosure')
      await Promise.resolve()
    })
    expect(readProp(findByAccessibilityRole(root, 'button'), 'accessibilityState')).toMatchObject({ expanded: true })
    const rows = root.container.queryAll(instance => instance.type === 'Text').map(instance => readProp(instance, 'children'))
    expect(rows).toContain('Costs, Start: 100, End: 75, Value: -25')
    await act(async () => {
      callAction(readProp(findByAccessibilityRole(root, 'button'), 'onPress'), 'Missing chart disclosure')
      await Promise.resolve()
    })
    expect(root.container.queryAll(instance => readProp(instance, 'accessibilityRole') === 'list')).toHaveLength(0)
  })

  test('shows a localized invalid-data state rather than a partial histogram', async () => {
    const root = await renderNative(
      <LumenHistogram
        label="Distribution"
        labels={{ invalidData: 'Check the bins' }}
        data={[
          { start: 0, end: 10, count: 5 }, { start: 5, end: 15, count: 3 }
        ]}
      />
    )
    expect(readProp(findByAccessibilityRole(root, 'alert'), 'children')).toBe('Check the bins')
    expect(root.container.queryAll(instance => instance.type === 'Svg')).toHaveLength(0)
    expect(root.container.queryAll(instance => readProp(instance, 'accessibilityRole') === 'button')).toHaveLength(0)
  })
})

describe('controlled multiple selection', () => {
  test('removal retains unavailable values and never mutates the controlled set', async () => {
    const values = new Set(['one', 'missing'])
    const onValuesChange = vi.fn<(values: ReadonlySet<string>) => void>()
    const root = await renderNative(<LumenMultiSelect label="Teams" values={values} onValuesChange={onValuesChange} query="" onQueryChange={() => undefined} options={[{ label: 'One', value: 'one' }]} />)
    const remove = root.container.queryAll(instance => readProp(instance, 'accessibilityLabel') === 'Remove One').find(instance => typeof readProp(instance, 'onPress') === 'function')
    if (!remove) throw new Error('Missing selected removal')
    const handler = readProp(remove, 'onPress')
    if (typeof handler !== 'function') throw new Error('Missing removal handler')
    await act(async () => {
      Reflect.apply(handler, undefined, [])
      await Promise.resolve()
    })
    expect(onValuesChange).toHaveBeenLastCalledWith(new Set(['missing']))
    expect(values).toEqual(new Set(['one', 'missing']))
    expect(root.container.queryAll(instance => readProp(instance, 'accessibilityLabel') === 'Remove missing').length).toBeGreaterThan(0)
  })

  test.each([{ readOnly: true }, { enabled: false }])('blocked controls reject removal: %o', async blocked => {
    const onValuesChange = vi.fn<(values: ReadonlySet<string>) => void>()
    const root = await renderNative(<LumenMultiSelect {...blocked} label="Teams" values={new Set(['one'])} onValuesChange={onValuesChange} query="" onQueryChange={() => undefined} options={[{ label: 'One', value: 'one' }]} />)
    const remove = root.container.queryAll(instance => readProp(instance, 'accessibilityLabel') === 'Remove One').find(instance => typeof readProp(instance, 'onPress') === 'function')
    if (!remove) throw new Error('Missing removal')
    const handler = readProp(remove, 'onPress')
    if (typeof handler !== 'function') throw new Error('Missing removal handler')
    await act(async () => {
      Reflect.apply(handler, undefined, [])
      await Promise.resolve()
    })
    expect(onValuesChange).not.toHaveBeenCalled()
    expect(readProp(remove, 'disabled')).toBe(true)
  })

  test('disabled selected results cannot be removed', async () => {
    const root = await renderNative(
      <LumenMultiSelect
        label="Teams"
        values={new Set(['one'])}
        onValuesChange={() => {
          throw new Error('Disabled callback')
        }}
        query=""
        onQueryChange={() => undefined}
        options={[{ label: 'One', value: 'one', disabled: true }]}
      />
    )
    const remove = root.container.queryAll(instance => readProp(instance, 'accessibilityLabel') === 'Remove One').find(instance => typeof readProp(instance, 'onPress') === 'function')
    if (!remove) throw new Error('Missing removal')
    expect(readProp(remove, 'disabled')).toBe(true)
  })
})

describe('multiple selection results', () => {
  test('checkbox intent retains values outside the result list', async () => {
    const onValuesChange = vi.fn<(values: ReadonlySet<string>) => void>()
    const values = new Set(['missing'])
    const root = await renderNative(<LumenMultiSelect label="Teams" values={values} onValuesChange={onValuesChange} query="" onQueryChange={() => undefined} options={[{ label: 'One', value: 'one' }]} />)
    const option = root.container.queryAll(instance => readProp(instance, 'accessibilityRole') === 'checkbox').find(instance => typeof readProp(instance, 'onPress') === 'function')
    if (!option) throw new Error('Missing option')
    const handler = readProp(option, 'onPress')
    if (typeof handler !== 'function') throw new Error('Missing checkbox handler')
    await act(async () => {
      Reflect.apply(handler, undefined, [])
      await Promise.resolve()
    })
    expect(onValuesChange).toHaveBeenLastCalledWith(new Set(['missing', 'one']))
    expect(values).toEqual(new Set(['missing']))
  })

  test.each([{ loading: true }, { resultsErrorMessage: 'Search failed' }])('stale results are unavailable: %o', async state => {
    const root = await renderNative(<LumenMultiSelect {...state} label="Teams" values={new Set<string>()} onValuesChange={() => undefined} query="" onQueryChange={() => undefined} options={[{ label: 'One', value: 'one' }]} />)
    expect(root.container.queryAll(instance => readProp(instance, 'accessibilityRole') === 'checkbox')).toHaveLength(0)
  })
})

describe('multiple selection option identity', () => {
  test.each([
    { options: [{ label: 'One', value: '' }] },
    { options: [{ label: ' ', value: 'one' }] },
    { options: [{ label: 'One', value: 'one' }, { label: 'Duplicate', value: 'one' }] }
  ])('rejects invalid option identities: %o', async ({ options }) => {
    await expect(renderNative(<LumenMultiSelect label="Teams" values={new Set<string>()} onValuesChange={() => undefined} query="" onQueryChange={() => undefined} options={options} />)).rejects.toThrow('MultiSelect options require')
  })
})

test('multiple selection forwards application safe-area insets to its modal', async () => {
  const root = await renderNative(<LumenMultiSelect label="Teams" values={new Set<string>()} onValuesChange={() => undefined} query="" onQueryChange={() => undefined} options={[]} safeAreaInsets={{ bottom: 96 }} />)
  const panels = root.container.queryAll(instance => {
    const style = readProp(instance, 'style')

    return typeof style === 'object' && style !== null && 'paddingBottom' in style && style.paddingBottom === 96
  })
  expect(panels.length).toBeGreaterThan(0)
})

describe('rating controlled selection', () => {
  test('clamps nonfinite values and limits the rendered option count', () => {
    expect(resolveLumenRating(Number.NaN, Number.POSITIVE_INFINITY)).toEqual({ max: 5, value: 0 })
    expect(resolveLumenRating(-5, 0)).toEqual({ max: 1, value: 0 })
    expect(resolveLumenRating(999, 999)).toEqual({ max: 100, value: 100 })
    expect(resolveLumenRating(3.9)).toEqual({ max: 5, value: 3 })
  })

  test('reports selection without mutating controlled value and blocks read-only edits', async () => {
    const onValueChange = vi.fn<(value: number) => void>()
    const root = await renderNative(
      <LumenRating
        label="Score"
        value={2}
        onValueChange={onValueChange}
        formatOption={(value, max) => `${value} of ${max}`}
      />
    )
    const option = findByAccessibilityLabel(root, '4 of 5')
    act(() => {
      callAction(readProp(option, 'onPress'), 'Missing rating action')
    })
    expect(onValueChange).toHaveBeenCalledWith(4)
    expect(readProp(option, 'accessibilityState')).toEqual({ checked: false, disabled: false, selected: false })
    act(() => {
      root.render(
        <LumenProvider>
          <LumenRating
            label="Score"
            value={2}
            readOnly
            onValueChange={onValueChange}
          />
        </LumenProvider>
      )
    })
    const locked = findByAccessibilityLabel(root, '4 / 5')
    act(() => {
      callAction(readProp(locked, 'onPress'), 'Missing rating action')
    })
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(readProp(locked, 'disabled')).toBe(true)
  })
})

describe('progress and history contracts', () => {
  test('normalizes step progress without changing host state', () => {
    expect(resolveLumenStepState(0, -1, 3)).toBe('current')
    expect(resolveLumenStepState(0, Number.NaN, 3)).toBe('current')
    expect(resolveLumenStepState(1, 1.9, 3)).toBe('current')
    expect(resolveLumenStepState(2, 99, 3)).toBe('complete')
    expect(resolveLumenStepState(2, 1, 3)).toBe('upcoming')
  })

  test('presents localized controlled progression and accepts an empty workflow', async () => {
    const steps = [{ id: 'prepare', title: 'Prepare' }, { id: 'review', title: 'Review', description: 'Confirm details' }]
    const root = await renderNative(
      <LumenStepper
        label="Workflow"
        steps={steps}
        currentStep={1}
        formatState={state => `Localized ${state}`}
      />
    )
    const review = findByAccessibilityLabel(root, '2 / 2, Review, Confirm details')
    expect(readProp(review, 'accessibilityValue')).toEqual({ text: 'Localized current' })
    expect(readProp(review, 'accessibilityState')).toEqual({ selected: true })
    act(() => {
      root.render(<LumenProvider><LumenStepper label="Workflow" steps={steps} currentStep={2} /></LumenProvider>)
    })
    expect(readProp(findByAccessibilityLabel(root, '2 / 2, Review, Confirm details'), 'accessibilityValue'))
      .toEqual({ text: 'Complete' })
    act(() => {
      root.render(<LumenProvider><LumenStepper label="Workflow" steps={[]} currentStep={0} /></LumenProvider>)
    })
    expect(root.container.queryAll(instance => readProp(instance, 'accessible') === true)).toHaveLength(0)
  })

  test('keeps timeline content actions accessible and host owned', async () => {
    const onPress = vi.fn()
    const root = await renderNative(
      <LumenTimeline label="History">
        <LumenTimelineItem>
          <LumenText>Approved</LumenText>
          <LumenButton onPress={onPress}>View approval</LumenButton>
        </LumenTimelineItem>
      </LumenTimeline>
    )
    const button = findByAccessibilityRole(root, 'button')
    act(() => {
      callAction(readProp(button, 'onPress'), 'Missing timeline action')
    })
    expect(onPress).toHaveBeenCalledOnce()
  })

  test('breadcrumb reports navigation IDs and cannot navigate current or disabled locations', async () => {
    const onNavigate = vi.fn<(id: string) => void>()
    const items = [{ id: 'home', label: 'Home' },
      { id: 'private', label: 'Private', disabled: true },
      { id: 'current', label: 'Details' }]
    const root = await renderNative(
      <LumenBreadcrumb
        label="Location"
        items={items}
        onNavigate={onNavigate}
        currentLabel="Here"
      />
    )
    const home = findByAccessibilityLabel(root, 'Home')
    act(() => {
      callAction(readProp(home, 'onPress'), 'Missing breadcrumb action')
    })
    expect(onNavigate).toHaveBeenCalledExactlyOnceWith('home')
    const locked = findByAccessibilityLabel(root, 'Private')
    act(() => {
      callAction(readProp(locked, 'onPress'), 'Missing disabled breadcrumb action')
    })
    expect(readProp(findByAccessibilityLabel(root, 'Details, Here'), 'onPress')).toBeUndefined()
    expect(readProp(findByAccessibilityLabel(root, 'Details, Here'), 'aria-current')).toBe('page')
  })
})

describe('data table controlled interactions', () => {
  const columns = [{ key: 'amount', label: 'Amount', sortable: true }]
  const rows: readonly LumenTableRow[] = [
    { id: 'one', label: 'One', cells: { amount: { text: '20', sortValue: 20 } } },
    { id: 'two', label: 'Two', cells: { amount: { text: '2', sortValue: 2 } }, disabled: true }
  ]
  test('emits manual sort requests without reordering and retains hidden selections', async () => {
    const onSortChange = vi.fn()
    const onSelectionChange = vi.fn()
    const root = await renderNative(
      <LumenDataTable
        label="Records"
        columns={columns}
        rows={rows}
        onSortChange={onSortChange}
        onSelectionChange={onSelectionChange}
        selectedIds={new Set(['hidden'])}
      />
    )
    act(() => {
      callAction(readProp(findByAccessibilityLabel(root, 'Amount'), 'onPress'), 'Missing sort action')
    })
    expect(onSortChange).toHaveBeenCalledWith({ key: 'amount', direction: 'ascending' })
    act(() => {
      callAction(readProp(findByAccessibilityLabel(root, 'Select visible'), 'onPress'), 'Missing bulk selection')
    })
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['hidden', 'one']))
    expect(root.container.queryAll(instance => readProp(instance, 'accessible') === true)
      .map(instance => readProp(instance, 'accessibilityLabel'))).toEqual(['Amount, 20', 'Amount, 2'])
  })
  test('loading and error states hide stale controls; retry remains host owned', async () => {
    const onRetry = vi.fn()
    const root = await renderNative(
      <LumenDataTable
        label="Records"
        columns={columns}
        rows={rows}
        loading
        loadingLabel="Fetching"
        onSortChange={vi.fn()}
      />
    )
    expect(readProp(findByAccessibilityRole(root, 'progressbar'), 'children')).toBe('Fetching')
    expect(root.container.queryAll(instance => readProp(instance, 'accessibilityRole') === 'button')).toHaveLength(0)
    act(() => {
      root.render(
        <LumenProvider>
          <LumenDataTable
            label="Records"
            columns={columns}
            rows={rows}
            error="Try again"
            onRetry={onRetry}
            retryLabel="Reload"
          />
        </LumenProvider>
      )
    })
    act(() => {
      callAction(readProp(findByAccessibilityRole(root, 'button'), 'onPress'), 'Missing retry')
    })
    expect(onRetry).toHaveBeenCalledOnce()
    expect(root.container.queryAll(instance => readProp(instance, 'accessibilityRole') === 'checkbox')).toHaveLength(0)
  })
  test('read-only tables block both sort and selection callbacks', async () => {
    const onSortChange = vi.fn()
    const onSelectionChange = vi.fn()
    const root = await renderNative(
      <LumenDataTable
        label="Records"
        columns={columns}
        rows={rows}
        readOnly
        onSortChange={onSortChange}
        onSelectionChange={onSelectionChange}
      />
    )
    act(() => {
      callAction(readProp(findByAccessibilityLabel(root, 'Amount'), 'onPress'), 'Missing guarded sort')
    })
    act(() => {
      callAction(readProp(findByAccessibilityLabel(root, 'Select visible'), 'onPress'), 'Missing guarded selection')
    })
    expect(onSortChange).not.toHaveBeenCalled()
    expect(onSelectionChange).not.toHaveBeenCalled()
  })
})

test.each(['light', 'dark'] as const)('nested button content uses its %s foreground without overriding explicit tones', async scheme => {
  const theme = createLumenTheme(scheme)
  const root = await renderNative(
    <LumenProvider theme={theme}>
      <LumenButton>
        <LumenText accessibilityLabel="Inherited label">Continue</LumenText>
        <LumenText accessibilityLabel="Explicit tone" tone="danger">Warning</LumenText>
        <LumenIcon name="search" label="Inherited icon" />
      </LumenButton>
      <LumenText accessibilityLabel="Outside control">Outside</LumenText>
    </LumenProvider>
  )
  expect(readProp(findByAccessibilityLabel(root, 'Inherited label'), 'style')).toEqual(expect.arrayContaining([{ color: theme.colors.onBrand }]))
  expect(readProp(findByAccessibilityLabel(root, 'Explicit tone'), 'style')).toEqual(expect.arrayContaining([{ color: theme.colors.danger }]))
  expect(readProp(findByAccessibilityLabel(root, 'Outside control'), 'style')).toEqual(expect.arrayContaining([{ color: theme.colors.ink }]))
  const svg = findByAccessibilityLabel(root, 'Inherited icon').children[0]
  if (typeof svg !== 'object') throw new Error('Missing inherited icon content')
  expect(readProp(svg, 'stroke')).toBe(theme.colors.onBrand)
})

test.each([false, true])('web checkbox Space toggles once and respects disabled=%s', async disabled => {
  nativePlatform.OS = 'web'
  const change = vi.fn<(checked: boolean) => void>()
  const hostKey = vi.fn()
  const root = await renderNative(<LumenCheckbox label="Choice" checked disabled={disabled} onCheckedChange={change} onKeyDown={hostKey} />)
  const handler = readProp(findByAccessibilityRole(root, 'checkbox'), 'onKeyDown')
  if (typeof handler !== 'function') throw new Error('Missing checkbox keyboard handler')
  const preventDefault = vi.fn()
  await act(async () => {
    Reflect.apply(handler, undefined, [{ nativeEvent: { key: ' ', repeat: false }, defaultPrevented: false, preventDefault }])
    await Promise.resolve()
  })
  expect(hostKey).toHaveBeenCalledOnce()
  expect(preventDefault).toHaveBeenCalledOnce()
  expect(change).toHaveBeenCalledTimes(disabled ? 0 : 1)
  expect(change.mock.calls).toEqual(disabled ? [] : [[false]])
  await act(async () => {
    Reflect.apply(handler, undefined, [{ nativeEvent: { key: ' ', repeat: true }, defaultPrevented: false, preventDefault }])
    Reflect.apply(handler, undefined, [{ nativeEvent: { key: ' ', repeat: false }, defaultPrevented: true, preventDefault }])
    await Promise.resolve()
  })
  expect(change).toHaveBeenCalledTimes(disabled ? 0 : 1)
})

test('media thumbnail keeps controlled selection and blocks loading requests', async () => {
  const onSelectionChange = vi.fn()
  const props = { label: 'Landscape', selected: true, onSelectionChange }
  const root = await renderNative(<LumenMediaThumbnail {...props}><LumenText>Photo</LumenText></LumenMediaThumbnail>)
  const button = findByAccessibilityLabel(root, 'Landscape')
  expect(readProp(button, 'accessibilityState')).toMatchObject({ selected: true })
  await runNativeAction(() => {
    callAction(readProp(button, 'onPress'), 'Missing thumbnail action')
  })
  expect(onSelectionChange).toHaveBeenCalledWith(false)
  await runNativeAction(() => {
    root.render(<LumenProvider><LumenMediaThumbnail {...props} state="loading"><LumenText>Photo</LumenText></LumenMediaThumbnail></LumenProvider>)
  })
  const loading = findByAccessibilityLabel(root, 'Landscape')
  expect(readProp(loading, 'accessibilityState')).toMatchObject({ busy: true, disabled: true })
  await runNativeAction(() => {
    callAction(readProp(loading, 'onPress'), 'Missing loading action')
  })
  expect(onSelectionChange).toHaveBeenCalledTimes(1)
})

test('native media inspection actions request bounded values and respect disabled state', async () => {
  const onValueChange = vi.fn()
  const props = { label: 'Inspect', value: { zoom: 2, x: 1, y: 0 }, onValueChange }
  const root = await renderNative(<LumenMediaViewport {...props}><LumenText>Photo</LumenText></LumenMediaViewport>)
  const right = root.container.queryAll(instance => readProp(instance, 'accessibilityRole') === 'button')
  expect(right).toHaveLength(7)
  const fit = right[2]
  if (!fit) throw new Error('Missing fit action')
  await runNativeAction(() => {
    callAction(readProp(fit, 'onPress'), 'Missing fit handler')
  })
  expect(onValueChange).toHaveBeenCalledWith({ zoom: 1, x: 0, y: 0 })
  await runNativeAction(() => {
    root.render(
      <LumenProvider>
        <LumenMediaViewport {...props} disabled><LumenText>Photo</LumenText></LumenMediaViewport>
      </LumenProvider>
    )
  })
  expect(root.container.queryAll(instance => readProp(instance, 'accessibilityRole') === 'button').every(instance => {
    const state = readProp(instance, 'accessibilityState')
    return typeof state === 'object' && state !== null && 'disabled' in state && state.disabled === true
  })).toBe(true)
})

test.each([true, false])('media pinch-to-pan preserves the host-accepted zoom (accept=%s)', async accept => {
  const change = vi.fn<(value: LumenMediaViewportValue) => void>()
  const Harness = () => {
    const [value, setValue] = useState<LumenMediaViewportValue>({ zoom: 2, x: 0, y: 0 })

    return (
      <LumenMediaViewport
        label="Inspect gesture"
        value={value}
        onValueChange={next => {
          change(next)
          if (accept) setValue(next)
        }}
      >
        <LumenText>Photo</LumenText>
      </LumenMediaViewport>
    )
  }
  const root = await renderNative(<Harness />)
  const dispatch = async (property: string, nativeEvent: unknown): Promise<void> => {
    const handler = readProp(findByAccessibilityLabel(root, 'Inspect gesture'), property)
    if (typeof handler !== 'function') throw new Error(`Missing media ${property} callback`)
    await runNativeAction(() => {
      Reflect.apply(handler, undefined, [{ nativeEvent }])
    })
  }
  const touch = (pageX: number, pageY: number) => ({ pageX, pageY })

  await dispatch('onLayout', { layout: { width: 200, height: 100 } })
  await dispatch('onResponderGrant', { pageX: 50, pageY: 50, touches: [touch(50, 50), touch(100, 50)] })
  await dispatch('onResponderMove', { pageX: 50, pageY: 50, touches: [touch(50, 50), touch(150, 50)] })
  expect(change).toHaveBeenLastCalledWith({ zoom: 4, x: 0, y: 0 })
  change.mockClear()
  await dispatch('onResponderMove', { pageX: 150, pageY: 50, touches: [touch(150, 50)] })
  expect(change).not.toHaveBeenCalled()
  await dispatch('onResponderMove', { pageX: 175, pageY: 50, touches: [touch(175, 50)] })
  expect(change).toHaveBeenLastCalledWith({ zoom: accept ? 4 : 2, x: accept ? 1 / 12 : 0.25, y: 0 })
})
