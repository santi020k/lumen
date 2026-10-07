import { act, createElement, type ReactElement } from 'react'

import { createRoot, type Root, type TestInstance } from 'test-renderer'
import { afterEach, expect, test, vi } from 'vitest'

import { LumenSchedule, type LumenScheduleProps } from './schedule-components.js'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
vi.mock('react-native', () => ({
  View: (props: Record<string, unknown>): ReactElement => createElement('View', props),
  ScrollView: (props: Record<string, unknown>): ReactElement => createElement('ScrollView', props),
  Pressable: (props: Record<string, unknown>): ReactElement => createElement('Pressable', props)
}))
vi.mock('./primitives.js', () => ({ LumenText: (props: Record<string, unknown>): ReactElement => createElement('Text', props) }))
vi.mock('./theme-context.js', () => ({ useLumenTheme: () => ({ colors: { line: '#eee' }, spacing: { sm: 12, xs: 4 } }) }))
const roots: Root[] = []
afterEach(() => {
  act(() => {
    roots.forEach(root => {
      root.unmount()
    })
  })
  roots.length = 0
})
const render = (props: LumenScheduleProps): Root => {
  const root = createRoot()
  roots.push(root)
  act(() => {
    root.render(<LumenSchedule {...props} />)
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
const props = (): LumenScheduleProps => ({ label: 'Schedule', selectedDay: { year: 2026, month: 3, day: 8 }, dayCount: 1, onSelectedDayChange: vi.fn(), onEventPress: vi.fn(), onEventMove: vi.fn(), events: [{ event: { id: 'review', label: 'Review', startDay: { year: 2026, month: 3, day: 8 } }, startMinute: 600, endMinute: 660 }] })
test('controlled range and event callbacks; accessible move requests preserve original event', () => {
  const input = props()
  const root = render(input)
  press(find(root, 'Next range'))
  expect(input.onSelectedDayChange).toHaveBeenCalledWith({ year: 2026, month: 3, day: 9 })
  press(find(root, '2026-03-08, 10:00 – 11:00, Review'))
  expect(input.onEventPress).toHaveBeenCalledWith(input.events[0], input.selectedDay)
  press(find(root, 'Move to next day'))
  expect(input.onEventMove).toHaveBeenCalledWith(input.events[0], { year: 2026, month: 3, day: 9 })
  expect(input.events[0]?.event.startDay.day).toBe(8)
})
test('disabled and read-only block direct handlers, status states hide stale controls', () => {
  for (const state of [{ disabled: true }, { readOnly: true }]) {
    const input = props()
    const root = render({ ...input, ...state })
    press(find(root, 'Next range'))
    press(find(root, '2026-03-08, 10:00 – 11:00, Review'))
    expect(input.onSelectedDayChange).not.toHaveBeenCalled()
    expect(input.onEventPress).not.toHaveBeenCalled()
    expect(input.onEventMove).not.toHaveBeenCalled()
  }
  for (const state of [{ loading: true }, { error: 'Unavailable' }, { dayCount: 8 }, { endHour: 8 }, { events: [...props().events, ...props().events] }]) {
    const root = render({ ...props(), ...state })
    expect(root.container.queryAll(instance => instance.type === 'Pressable')).toHaveLength(0)
  }
})
test('selection becomes stale after host range changes and cannot request moves', () => {
  const input = props()
  const root = render(input)
  press(find(root, '2026-03-08, 10:00 – 11:00, Review'))
  act(() => {
    root.render(<LumenSchedule {...input} selectedDay={{ year: 2026, month: 3, day: 9 }} />)
  })
  expect(root.container.queryAll(instance => instance.type === 'Pressable')).toHaveLength(2)
})
