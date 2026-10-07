import { act, createElement, type ReactElement } from 'react'

import { createRoot, type Root, type TestInstance } from 'test-renderer'
import { afterEach, expect, test, vi } from 'vitest'

import { LumenBreadcrumb, type LumenBreadcrumbProps } from './breadcrumb-components.js'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
vi.mock('react-native', () => ({
  View: (props: Record<string, unknown>): ReactElement => createElement('View', props),
  Text: (props: Record<string, unknown>): ReactElement => createElement('Text', props),
  Pressable: (props: Record<string, unknown>): ReactElement => createElement('Pressable', props),
  ScrollView: (props: Record<string, unknown>): ReactElement => createElement('ScrollView', props)
}))
vi.mock('./theme-context.js', () => ({ useLumenTheme: () => ({ spacing: { xs: 4, sm: 8 },
  colors: { ink: '#111', inkMuted: '#555', brandSolid: '#135' } }) }))
const roots: Root[] = []
const items = [{ id: 'home', label: 'Home' },
  { id: 'locked', label: 'Locked', disabled: true },
  { id: 'current', label: 'Current location' }]
afterEach(() => {
  act(() => {
    for (const root of roots) root.unmount()
  })
  roots.length = 0
})
const read = (instance: TestInstance, key: string): unknown => (instance.props as Record<string, unknown>)[key]
const render = (props: Partial<LumenBreadcrumbProps> = {}): { root: Root, navigate: ReturnType<typeof vi.fn> } => {
  const root = createRoot()
  const navigate = vi.fn()

  roots.push(root)
  act(() => {
    root.render(<LumenBreadcrumb label="Location" items={items} onNavigate={navigate} {...props} />)
  })

  return { root, navigate }
}
const press = (node: TestInstance): void => {
  const handler = read(node, 'onPress')

  if (typeof handler !== 'function') throw new Error('Missing press callback')
  act(() => {
    Reflect.apply(handler, undefined, [])
  })
}

test('ancestors emit stable IDs while the localized current location remains noninteractive', () => {
  const { root, navigate } = render({ currentLabel: 'Página actual' })
  const buttons = root.container.queryAll(node => node.type === 'Pressable')

  expect(buttons).toHaveLength(2)
  const home = buttons[0]
  const locked = buttons[1]

  if (!home || !locked) throw new Error('Missing ancestors')
  press(home)
  press(locked)
  expect(navigate.mock.calls).toEqual([['home']])
  expect(read(locked, 'disabled')).toBe(true)
  const current = root.container.queryAll(node => node.type === 'Text' && read(node, 'aria-current') === 'page')[0]

  if (!current) throw new Error('Missing current location')
  expect(read(current, 'accessibilityLabel')).toBe('Current location, Página actual')
  expect(read(current, 'onPress')).toBeUndefined()
})

test('whole-trail disabled state blocks navigation even if a host invokes the handler', () => {
  const { root, navigate } = render({ disabled: true })

  for (const button of root.container.queryAll(node => node.type === 'Pressable')) {
    expect(read(button, 'disabled')).toBe(true)
    press(button)
  }
  expect(navigate).not.toHaveBeenCalled()
})

test('empty and ambiguous paths preserve the group while hiding navigation', () => {
  for (const path of [[], [items[0], items[0]], [{ id: ' \n', label: 'Missing' }]]) {
    const validItems = path.filter((item): item is (typeof items)[number] => item !== undefined)
    const { root } = render({ items: validItems })

    expect(root.container.queryAll(node => node.type === 'Pressable')).toHaveLength(0)
    expect(root.container.queryAll(node => node.type === 'View' && read(node, 'accessibilityLabel') === 'Location')).toHaveLength(1)
  }
})

test('long paths keep every stable ancestor ID within a horizontal scroller', () => {
  const { root, navigate } = render({ items: Array.from({ length: 200 }, (_, index) => ({ id: `id-${index}`, label: 'Repeated' })) })
  const lastAncestor = root.container.queryAll(node => node.type === 'Pressable').at(-1)

  if (!lastAncestor) throw new Error('Missing last ancestor')
  press(lastAncestor)
  expect(navigate).toHaveBeenCalledWith('id-198')
  const scroll = root.container.queryAll(node => node.type === 'ScrollView')[0]

  if (!scroll) throw new Error('Missing horizontal scroller')
  expect(read(scroll, 'horizontal')).toBe(true)
})

test('hides malformed decoded navigation while preserving its labeled container', () => {
  for (const value of [null, {}, [null], [1], [{ id: 7, label: 'Bad' }], [{ id: 'a', label: {} }], [{ id: 'a', label: 'A', disabled: 'yes' }], Array(1)]) {
    const props: Partial<LumenBreadcrumbProps> = {}
    Object.defineProperty(props, 'items', { value, enumerable: true })
    const { root } = render(props)
    expect(root.container.queryAll(node => node.type === 'View' && read(node, 'accessibilityLabel') === 'Location')).toHaveLength(1)
    expect(root.container.queryAll(node => node.type === 'Pressable' || node.type === 'Text')).toHaveLength(0)
  }
})
