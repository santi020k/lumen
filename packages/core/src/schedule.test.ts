import { expect, test, vi } from 'vitest'

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

test.each([
  { start: 'not-a-date' },
  { end: 'not-a-date' },
  { start: '2026-07-04T12:00:00.000Z' }
])('zero-count recurrence still rejects invalid event intervals %j', invalid => {
  expect(() => expandRecurringScheduleEvent({ ...event, ...invalid }, 0)).toThrow(TypeError)
})

test.each([0.5, -1.5])('recurrence rejects fractional day interval %s before producing events', intervalDays => {
  const overnight = { ...event, start: '2026-07-01T23:00:00.000Z', end: '2026-07-02T01:00:00.000Z' }

  expect(() => expandRecurringScheduleEvent(overnight, 2, intervalDays)).toThrow(RangeError)
  expect(() => expandRecurringScheduleEvent(overnight, 0, intervalDays)).toThrow(RangeError)
})

test('recurrence preserves numeric validation precedence for malformed events', () => {
  const invalid = { ...event, start: 'not-a-date' }

  expect(() => expandRecurringScheduleEvent(invalid, -1, Infinity)).toThrow('count')
  expect(() => expandRecurringScheduleEvent(invalid, 0, Infinity)).toThrow('interval')
  expect(() => expandRecurringScheduleEvent(invalid, 0, 0.5)).toThrow('interval')
})

test.each([0, -1, -7])('recurrence retains zero and negative integer intervals: %s', intervalDays => {
  const overnight = { ...event, start: '2026-07-01T23:00:00.000Z', end: '2026-07-02T01:00:00.000Z' }
  const instances = expandRecurringScheduleEvent(overnight, 3, intervalDays)

  expect(instances).toHaveLength(3)
  expect(overnight.start).toBe('2026-07-01T23:00:00.000Z')
  for (const [index, instance] of instances.entries()) {
    const expectedStart = new Date(overnight.start).getTime() + index * intervalDays * 86_400_000

    expect(instance.id).toBe(index === 0 ? event.id : `${event.id}-${index + 1}`)
    expect(new Date(instance.start).getTime()).toBe(expectedStart)
    expect(new Date(instance.end).getTime() - new Date(instance.start).getTime()).toBe(7_200_000)
  }
})

test.each([['UTC', 0], ['America/New_York', 300], ['Europe/Berlin', -60]] as const)('recurrence preserves UTC instants across DST in %s', (timezone, offset) => {
  vi.stubEnv('TZ', timezone)
  try {
    expect(new Date('2026-03-01T10:00:00.000Z').getTimezoneOffset()).toBe(offset)
    const spring = { id: 'spring', title: 'Spring', start: '2026-03-01T10:00:00.000Z', end: '2026-03-01T11:00:00.000Z' }
    const fall = { id: 'fall', title: 'Fall', start: '2026-10-25T10:00:00.000Z', end: '2026-10-25T11:00:00.000Z' }
    const decoded = [expandRecurringScheduleEvent(spring, 5), expandRecurringScheduleEvent(fall, 3)]
    expect(decoded).toEqual([
      [1, 8, 15, 22, 29].map((day, index) => ({
        id: index ? `spring-${index + 1}` : 'spring',
        title: 'Spring',
        start: `2026-03-${String(day).padStart(2, '0')}T10:00:00.000Z`,
        end: `2026-03-${String(day).padStart(2, '0')}T11:00:00.000Z`
      })),
      ['2026-10-25', '2026-11-01', '2026-11-08'].map((day, index) => ({
        id: index ? `fall-${index + 1}` : 'fall',
        title: 'Fall',
        start: `${day}T10:00:00.000Z`,
        end: `${day}T11:00:00.000Z`
      }))
    ])
  } finally {
    vi.unstubAllEnvs()
  }
})
