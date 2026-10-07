import { act, createElement, type ReactElement, type ReactNode, type Ref, useImperativeHandle } from 'react'

import { createRoot, type Root, type TestInstance } from 'test-renderer'
import { afterEach, expect, test, vi } from 'vitest'

import { LumenTour, type LumenTourProps } from './tour-components.js'
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
interface MockProps { ref?: Ref<MeasuredView>, children?: ReactNode, [key: string]: unknown }
interface MeasuredView {
  focus: () => void
  measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => void
}
const { nativeFocus, nativeView } = vi.hoisted(() => {
  const nativeFocus = vi.fn()
  const nativeView = (name: string) => (props: MockProps): ReactElement => {
    useImperativeHandle(props.ref, () => ({ focus: nativeFocus,
      measureInWindow: callback => {
        callback(0, 0, 390, 640)
      } }))
    return createElement(name, props)
  }
  return { nativeFocus, nativeView }
})
vi.mock('react-native', () => ({ View: nativeView('View'),
  ScrollView: nativeView('Scroll'),
  Pressable: nativeView('Pressable'),
  Modal: nativeView('Modal'),
  Platform: { OS: 'android' },
  AccessibilityInfo: { sendAccessibilityEvent: vi.fn() },
  StyleSheet: { absoluteFill: {} },
  useWindowDimensions: () => ({ width: 390, height: 640 }) }))
vi.mock('./primitives.js', () => ({ LumenText: nativeView('Text'), LumenButton: nativeView('Button') }))
vi.mock('./theme-context.js', () => ({ useLumenTheme: () => ({ colors: { ink: '#222', surface: '#fff', brand: '#08f' }, radii: { sm: 4, md: 8 }, spacing: { sm: 12 } }) }))
const roots: Root[] = []
afterEach(() => {
  act(() => {
    roots.forEach(root => {
      root.unmount()
    })
  })
  roots.length = 0
  vi.clearAllMocks()
})
const read = (instance: TestInstance, key: string): unknown => (instance.props as Record<string, unknown>)[key]
const invoke = (instance: TestInstance, key: string, args: readonly unknown[] = []): void => {
  const callback = read(instance, key)
  if (typeof callback !== 'function') throw new Error('Missing handler')
  act(() => {
    Reflect.apply(callback, undefined, args)
  })
}
const buttons = (root: Root): TestInstance[] => root.container.queryAll(instance => instance.type === 'Button')
const render = (props: LumenTourProps): Root => {
  const root = createRoot()
  roots.push(root)
  act(() => {
    root.render(<LumenTour {...props} />)
  })
  return root
}
const props = (): LumenTourProps => ({ label: 'Tour',
  children: <span>Host content</span>,
  open: true,
  onOpenChange: vi.fn(),
  index: 0,
  onIndexChange: vi.fn(),
  onFinish: vi.fn(),
  anchors: { first: { x: 10, y: 50, width: 120, height: 44 } },
  steps: [
    { id: 'first-step', targetId: 'first', title: 'First', content: 'First guidance' }, { id: 'second-step', targetId: 'missing', title: 'Last', content: 'Last guidance' }
  ] })
test('real measured highlight and controlled previous/next/finish keep index/open owned by host', () => {
  const input = props()
  const root = render(input)
  const modalView = root.container.queryAll(instance => instance.type === 'View' && read(instance, 'accessibilityViewIsModal') === true)[0]
  if (!modalView) throw new Error('Missing modal viewport')
  invoke(modalView, 'onLayout', [{ nativeEvent: { layout: { width: 390, height: 640 } } }])
  expect(root.container.queryAll(instance => read(instance, 'testID') === 'tour-highlight')).toHaveLength(1)
  expect(nativeFocus).toHaveBeenCalled()
  const advance = buttons(root)[1]
  if (!advance) throw new Error('Missing advance')
  invoke(advance, 'onPress')
  expect(input.onIndexChange).toHaveBeenCalledWith(1)
  expect(input.onOpenChange).not.toHaveBeenCalled()
  act(() => {
    root.render(<LumenTour {...input} index={1} />)
  })
  const finish = buttons(root)[1]
  if (!finish) throw new Error('Missing finish')
  invoke(finish, 'onPress')
  expect(input.onFinish).toHaveBeenCalledWith(input.steps[1])
  expect(input.onOpenChange).not.toHaveBeenCalled()
})
test('readOnly/disabled/status/invalid actions fail closed while native close and accessibility Escape work', () => {
  for (const override of [{ readOnly: true }, { disabled: true }, { loading: true }, { error: 'Unavailable' }, { index: -1 }, { steps: [] }, { steps: [...props().steps, ...props().steps] }]) {
    const input = { ...props(), ...override }
    const root = render(input)
    buttons(root).slice(0, -1).forEach(button => {
      invoke(button, 'onPress')
    })
    expect(input.onIndexChange).not.toHaveBeenCalled()
    expect(input.onFinish).not.toHaveBeenCalled()
    const modal = root.container.queryAll(instance => instance.type === 'Modal')[0]
    if (!modal) throw new Error('Missing native modal')
    invoke(modal, 'onRequestClose')
    expect(input.onOpenChange).toHaveBeenCalledWith(false)
    const modalView = root.container.queryAll(instance => instance.type === 'View' && read(instance, 'accessibilityViewIsModal') === true)[0]
    if (!modalView) throw new Error('Missing modal')
    invoke(modalView, 'onAccessibilityEscape')
    expect(input.onOpenChange).toHaveBeenCalledWith(false)
  }
})
test('closed retains host content without overlay; inherited anchor entries never become targets', () => {
  const root = render({ ...props(), open: false })
  expect(root.container.queryAll(instance => instance.type === 'Modal')).toHaveLength(0)
  const anchors = {}
  Object.setPrototypeOf(anchors, { first: { x: 0, y: 0, width: 100, height: 44 } })
  act(() => {
    root.render(<LumenTour {...props()} anchors={anchors} />)
  })
  const modalView = root.container.queryAll(instance => instance.type === 'View' && read(instance, 'accessibilityViewIsModal') === true)[0]
  if (!modalView) throw new Error('Missing modal')
  invoke(modalView, 'onLayout', [{ nativeEvent: { layout: { width: 390, height: 640 } } }])
  expect(root.container.queryAll(instance => read(instance, 'testID') === 'tour-highlight')).toHaveLength(0)
})

test('decoded invalid tour collections and step fields render invalid status', () => {
  for (const raw of ['null', '{}', '[null]', '[5]', '[{"id":3}]', '[{"id":"a","targetId":"b","title":{},"content":"C"}]', '[{"id":"a","targetId":"b","title":"A","content":null}]', '[{"id":"a","targetId":"b","title":"A","content":"C","disabled":"false"}]']) {
    const decoded: unknown = JSON.parse(raw)
    const input = props()
    Object.defineProperty(input, 'steps', { value: decoded })
    const root = render(input)
    expect(root.container.queryAll(node => node.type === 'Text' && read(node, 'children') === 'Invalid tour step')).toHaveLength(1)
    expect(buttons(root)).toHaveLength(1)
  }
})

test('treats malformed decoded anchor collections as unavailable targets', () => {
  for (const anchors of [null, undefined, [], 'invalid', 7]) {
    const input = props()

    Object.defineProperty(input, 'anchors', { value: anchors, enumerable: true })
    const root = render(input)

    expect(root.container.queryAll(instance => read(instance, 'testID') === 'tour-highlight')).toHaveLength(0)
    expect(root.container.queryAll(instance => instance.type === 'Text' && read(instance, 'children') === 'Target unavailable')).toHaveLength(1)
  }
})
