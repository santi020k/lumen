import { expect, test } from 'vitest'

import { formatLumenAgendaMinute, isLumenAgendaEventsValid, type LumenAgendaEvent, lumenAgendaGroups } from './agenda-recipes.js'
const day = { year: 2026, month: 3, day: 8 }
const end = { ...day, day: 10 }
const event: LumenAgendaEvent = { event: { id: 'trip', label: 'Trip', startDay: day, endDay: end }, startMinute: 600, endMinute: 0 }
test('clips timed multi-day events, excludes exclusive midnight and orders all-day first', () => {
  const allDay: LumenAgendaEvent = { event: { id: 'holiday', label: 'Holiday', startDay: day, endDay: end } }
  const groups = lumenAgendaGroups([event, allDay], day, 3)
  const actual = groups.map(group => group.segments.map(segment => [
    segment.event.event.id, segment.startMinute, segment.endMinute
  ]))

  expect(actual).toEqual([
    [['holiday', null, null], ['trip', 600, 1440]], [['holiday', null, null], ['trip', 0, 1440]], [['holiday', null, null]]
  ])
  expect(lumenAgendaGroups([event], { ...day, day: 9 }, 1)[0]?.segments[0]?.startMinute).toBe(0)
  expect(formatLumenAgendaMinute(1440)).toBe('24:00')
})
test('rejects duplicate/blank IDs, inverted dates, partial times and invalid minute bounds', () => {
  expect(isLumenAgendaEventsValid([event, event])).toBe(false)
  for (const input of [
    { ...event, event: { ...event.event, id: ' ' } },
    { ...event, event: { ...event.event, startDay: end, endDay: day } },
    { ...event, startMinute: -1 },
    { ...event, startMinute: 1440 },
    { event: event.event, startMinute: 600 },
    { ...event, endMinute: 1441 },
    { ...event, event: { ...event.event, endDay: day }, endMinute: 600 }
  ]) expect(lumenAgendaGroups([input], day)).toEqual([])
  expect(lumenAgendaGroups([], day, 0)).toEqual([])
  expect(lumenAgendaGroups([], day, 32)).toEqual([])
  expect(lumenAgendaGroups([], { year: 9999, month: 12, day: 31 }, 2)).toEqual([])
  expect(lumenAgendaGroups([], day, 1)[0]?.segments).toEqual([])
})
