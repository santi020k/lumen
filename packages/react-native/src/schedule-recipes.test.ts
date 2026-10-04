import { expect, test } from 'vitest'

import type { LumenAgendaEvent } from './agenda-recipes.js'
import { lumenScheduleLayout } from './schedule-recipes.js'
const day = { year: 2026, month: 3, day: 8 }
const timed = (id: string, startMinute: number, endMinute: number): LumenAgendaEvent => ({
  event: { id, label: id, startDay: day }, startMinute, endMinute
})
test('overlapping chains share lane count; separated intervals reclaim full width', () => {
  const layout = lumenScheduleLayout([timed('a', 540, 660), timed('b', 570, 630), timed('c', 630, 690), timed('d', 720, 780)], day, 1)
  expect(layout[0]?.placements.map(item => [item.segment.event.event.id, item.lane, item.laneCount])).toEqual([
    ['a', 0, 2], ['b', 1, 2], ['c', 1, 2], ['d', 0, 1]
  ])
})
test('short events keep accessible height without hit collisions, clipping to hour window', () => {
  const layout = lumenScheduleLayout([timed('a', 480, 485), timed('b', 486, 490), timed('last', 1079, 1080), timed('off', 1080, 1100)], day, 1)
  const items = layout[0]?.placements ?? []
  expect(items).toHaveLength(3)
  expect(items[0]?.height).toBe(48)
  expect(items[1]?.laneCount).toBe(2)
  expect(items[2]?.top).toBe(552)
  for (const item of items) expect(item.top + item.height).toBeLessThanOrEqual(600)
})
test('all-day band and overnight clipping reuse Agenda; invalid IDs/window/range fail closed', () => {
  const overnight = { ...timed('night', 1380, 60), event: { id: 'night', label: 'Night', startDay: day, endDay: { ...day, day: 9 } } }
  const allDay = { event: { id: 'holiday', label: 'Holiday', startDay: day } }
  const layout = lumenScheduleLayout([overnight, allDay], day, 2, 0, 24)
  expect(layout[0]?.allDay).toHaveLength(1)
  expect(layout[1]?.placements[0]?.segment.startMinute).toBe(0)
  expect(lumenScheduleLayout([allDay, allDay], day)).toEqual([])
  for (const [count, start, end] of [[0, 8, 18], [8, 8, 18], [1, -1, 18], [1, 18, 8], [1, 8, 25], [1, 8.5, 18]]) {
    expect(lumenScheduleLayout([], day, count, start, end)).toEqual([])
  }
  expect(lumenScheduleLayout([], { year: 9999, month: 12, day: 31 }, 2)).toEqual([])
})
