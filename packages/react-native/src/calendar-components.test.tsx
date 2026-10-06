import { act, createElement, type ReactElement } from 'react'

import { createRoot, type Root, type TestInstance } from 'test-renderer'
import { afterEach, expect, test, vi } from 'vitest'

import { LumenCalendar, type LumenCalendarProps } from './calendar-components.js'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
vi.mock('react-native', () => ({
  View: (props: Record<string, unknown>): ReactElement => createElement('View', props),
  ScrollView: (props: Record<string, unknown>): ReactElement => createElement('ScrollView', props),
  Pressable: (props: Record<string, unknown>): ReactElement => createElement('Pressable', props)
}))
vi.mock('./primitives.js', () => ({ LumenText: (props: Record<string, unknown>): ReactElement => createElement('Text', props) }))
vi.mock('./theme-context.js', () => ({ useLumenTheme: () => ({ colors: { brandSoft: '#eee' } }) }))
const roots: Root[] = []
afterEach(() => {
  act(() => {
    roots.forEach(root => {
      root.unmount()
    })
  })
  roots.length = 0
})
const render = (props: LumenCalendarProps): Root => {
  const root = createRoot()
  roots.push(root)
  act(() => {
    root.render(<LumenCalendar {...props} />)
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
const props = (): LumenCalendarProps => ({ label: 'Calendar', visibleMonth: { year: 2026, month: 3, day: 1 }, selectedDay: { year: 2026, month: 3, day: 8 }, onVisibleMonthChange: vi.fn(), onSelectedDayChange: vi.fn() })
test('controlled callbacks preserve selection and include event names', () => {
  const input = props()
  const root = render({ ...input, events: [{ id: 'review', label: 'Review', startDay: { year: 2026, month: 3, day: 10 } }] })
  press(find(root, '2026-03-10, Review'))
  expect(input.onSelectedDayChange).toHaveBeenCalledWith({ year: 2026, month: 3, day: 10 })
  press(find(root, 'Next month'))
  expect(input.onVisibleMonthChange).toHaveBeenCalledWith({ year: 2026, month: 4, day: 1 })
  expect(input.selectedDay?.day).toBe(8)
})
test('disabled, read-only and out of bounds block edits even through callbacks', () => {
  for (const state of [{ disabled: true }, { readOnly: true }, { min: { year: 2026, month: 3, day: 9 } }]) {
    const input = props()
    const root = render({ ...input, ...state })
    press(find(root, '2026-03-08'))
    expect(input.onSelectedDayChange).not.toHaveBeenCalled()
  }
})
test('loading error empty and invalid bounds hide stale controls without callbacks', () => {
  for (const state of [{ loading: true }, { error: 'Unavailable' }, { empty: true }, { firstWeekday: 8 }, { min: { year: 2026, month: 3, day: 20 }, max: { year: 2026, month: 3, day: 10 } }]) {
    const input = props()
    const root = render({ ...input, ...state })
    expect(root.container.queryAll(instance => instance.type === 'Pressable')).toHaveLength(0)
    expect(input.onSelectedDayChange).not.toHaveBeenCalled()
    expect(input.onVisibleMonthChange).not.toHaveBeenCalled()
  }
})

test('container measurement fits the seven-day grid and retains minimum touch width', () => {
  const onLayout = vi.fn()
  const root = render({ ...props(), onLayout })
  const outer = root.container.queryAll(instance => instance.type === 'View' && read(instance, 'accessibilityLabel') === 'Calendar')[0]
  if (!outer) throw new Error('Missing calendar container')
  const callback = read(outer, 'onLayout')
  if (typeof callback !== 'function') throw new Error('Missing layout callback')
  for (const width of [350, 280, Number.NaN]) {
    const event = { nativeEvent: { layout: { width, height: 500, x: 0, y: 0 } } }
    act(() => {
      Reflect.apply(callback, undefined, [event])
    })
    const grid = root.container.queryAll(instance => instance.type === 'View' &&
      read(instance, 'style') !== null && typeof read(instance, 'style') === 'object' &&
      Reflect.get(read(instance, 'style') as Record<string, unknown>, 'width') === (width === 350 ? 350 : 308))
    expect(grid).toHaveLength(1)
    expect(onLayout).toHaveBeenLastCalledWith(event)
  }
})

test('rejects decoded weekday labels unless exactly seven strings are supplied', () => {
  for (const value of [null, {}, Array(7), [1, 2, 3, 4, 5, 6, 7], ['Mon'], ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', {}]]) {
    const input = props()
    Object.defineProperty(input, 'weekdayLabels', { value, enumerable: true })
    const root = render(input)
    expect(root.container.queryAll(node => node.type === 'Text' && read(node, 'children') === 'Invalid calendar')).toHaveLength(1)
  }
})
