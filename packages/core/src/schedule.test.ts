import { expect, test } from 'vitest'

import {
  canPlaceScheduleEvent, expandRecurringScheduleEvent, getScheduleConflicts,
  type LumenScheduleEvent, parseScheduleEvents, resizeScheduleEvent, scheduleEventsOverlap
} from './schedule.js'

const event: LumenScheduleEvent = {
  end: '2026-07-04T11:00:00.000Z',
  id: 'planning',
  resourceId: 'room',
  start: '2026-07-04T10:00:00.000Z',
  title: 'Planning'
}

test.each([
  { start: 'not-a-date' },
  { end: 'not-a-date' },
  { start: '2026-07-04T12:00:00.000Z' }
])('invalid interval %j cannot establish availability or mutate an event', invalid => {
  const broken = { ...event, ...invalid }
  const other = { ...event, id: 'review' }
  expect(canPlaceScheduleEvent([], broken)).toBe(false)
  expect(canPlaceScheduleEvent([broken], other)).toBe(false)
  expect(scheduleEventsOverlap(broken, other)).toBe(true)
  expect(scheduleEventsOverlap(other, broken)).toBe(true)
  expect(getScheduleConflicts([broken, other])).toEqual([{ a: broken, b: other }])
  expect(scheduleEventsOverlap(broken, { ...other, resourceId: 'other-room' })).toBe(false)
  expect(scheduleEventsOverlap(broken, broken)).toBe(false)
  expect(() => resizeScheduleEvent(broken, event.end)).toThrow(TypeError)
  expect(() => expandRecurringScheduleEvent(broken, 2)).toThrow(TypeError)
  // Loading records preserves the original facts for application-owned repair.
  expect(parseScheduleEvents(JSON.stringify([broken]))).toEqual([broken])
})

test('adjacent valid intervals stay available and resizing retains its hard-bound behavior', () => {
  const next = { ...event, id: 'next', start: event.end, end: '2026-07-04T12:00:00.000Z' }
  expect(canPlaceScheduleEvent([event], next)).toBe(true)
  expect(scheduleEventsOverlap(event, next)).toBe(false)
  expect(resizeScheduleEvent(event, '2026-07-04T12:00:00.000Z', { max: '2026-07-04T10:30:00.000Z' }).end).toBe('2026-07-04T10:30:00.000Z')
  expect(expandRecurringScheduleEvent(event, 2)[1]?.start).toBe('2026-07-11T10:00:00.000Z')
  expect(event.end).toBe('2026-07-04T11:00:00.000Z')
})

test('resize rejects invalid targets, bounds, and numeric options before conversion', () => {
  expect(() => resizeScheduleEvent(event, 'not-a-date')).toThrow('resize target')
  expect(() => resizeScheduleEvent(event, event.end, { min: '' })).toThrow('minimum')
  expect(() => resizeScheduleEvent(event, event.end, { max: 'not-a-date' })).toThrow('maximum')
  expect(() => resizeScheduleEvent(event, event.end, { min: event.end, max: event.start })).toThrow('minimum cannot exceed maximum')
  for (const snapMinutes of [NaN, Infinity, -Infinity, Number.MAX_VALUE]) {
    expect(() => resizeScheduleEvent(event, event.end, { snapMinutes })).toThrow(RangeError)
  }
})

test('recurrence rejects invalid numeric inputs and date overflow without partial results', () => {
  for (const count of [NaN, Infinity, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    expect(() => expandRecurringScheduleEvent(event, count)).toThrow('count')
  }
  for (const intervalDays of [NaN, Infinity, -Infinity]) {
    expect(() => expandRecurringScheduleEvent(event, 2, intervalDays)).toThrow('interval')
  }
  expect(() => expandRecurringScheduleEvent(event, 2, Number.MAX_VALUE)).toThrow('supported date-time range')
  expect(expandRecurringScheduleEvent(event, 0)).toEqual([])
})
