import { act, createElement, type ReactElement } from 'react'

import { createRoot, type Root, type TestInstance } from 'test-renderer'
import { afterEach, expect, test, vi } from 'vitest'

import { LumenAgenda, type LumenAgendaProps } from './agenda-components.js'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
vi.mock('react-native', () => ({
  View: (props: Record<string, unknown>): ReactElement => createElement('View', props),
  ScrollView: (props: Record<string, unknown>): ReactElement => createElement('ScrollView', props),
  Pressable: (props: Record<string, unknown>): ReactElement => createElement('Pressable', props)
}))
vi.mock('./primitives.js', () => ({ LumenText: (props: Record<string, unknown>): ReactElement => createElement('Text', props) }))
vi.mock('./theme-context.js', () => ({ useLumenTheme: () => ({ colors: { line: '#eee' }, spacing: { sm: 12 } }) }))
const roots: Root[] = []
afterEach(() => {
  act(() => {
    roots.forEach(root => {
      root.unmount()
    })
  })
  roots.length = 0
})
const render = (props: LumenAgendaProps): Root => {
  const root = createRoot()
  roots.push(root)
  act(() => {
    root.render(<LumenAgenda {...props} />)
  })
  return root
}
const read = (instance: TestInstance, key: string): unknown => (instance.props as Record<string, unknown>)[key]
const press = (instance: TestInstance): void => {
  const callback = read(instance, 'onPress')
  if (typeof callback !== 'function') throw new Error('Missing press')
  act(() => {
    Reflect.apply(callback, undefined, [])
  })
}
const find = (root: Root, label: string): TestInstance => {
  const match = root.container.queryAll(instance => instance.type === 'Pressable' && read(instance, 'accessibilityLabel') === label)[0]
  if (!match) throw new Error(`Missing ${label}`)
  return match
}
const props = (): LumenAgendaProps => ({ label: 'Agenda', selectedDay: { year: 2026, month: 3, day: 8 }, dayCount: 1, onSelectedDayChange: vi.fn(), onEventPress: vi.fn(), events: [{ event: { id: 'review', label: 'Review', startDay: { year: 2026, month: 3, day: 8 } }, startMinute: 600, endMinute: 660 }] })
test('controlled navigation and event activation emit host values without changing input', () => {
  const input = props()
  const root = render(input)
  press(find(root, 'Next days'))
  expect(input.onSelectedDayChange).toHaveBeenCalledWith({ year: 2026, month: 3, day: 9 })
  press(find(root, '2026-03-08, 10:00 – 11:00, Review'))
  expect(input.onEventPress).toHaveBeenCalledWith(input.events[0], input.selectedDay)
  expect(input.selectedDay.day).toBe(8)
})
test('disabled and read-only block navigation and event actions including direct handlers', () => {
  for (const state of [{ disabled: true }, { readOnly: true }]) {
    const input = props()
    const root = render({ ...input, ...state })
    press(find(root, 'Next days'))
    press(find(root, '2026-03-08, 10:00 – 11:00, Review'))
    expect(input.onSelectedDayChange).not.toHaveBeenCalled()
    expect(input.onEventPress).not.toHaveBeenCalled()
  }
})
test('loading error invalid data hide stale actions; empty ranges keep navigation', () => {
  for (const state of [{ loading: true }, { error: 'Unavailable' }, { dayCount: 32 }, { events: [...props().events, ...props().events] }]) {
    const input = props()
    const root = render({ ...input, ...state })
    expect(root.container.queryAll(instance => instance.type === 'Pressable')).toHaveLength(0)
  }
  const root = render({ ...props(), events: [] })
  expect(root.container.queryAll(instance => instance.type === 'Pressable')).toHaveLength(2)
})
