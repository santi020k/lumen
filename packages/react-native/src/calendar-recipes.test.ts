import { describe, expect, test } from 'vitest'

import { addLumenCalendarDays, addLumenCalendarMonths, isLumenCalendarDay, isLumenCalendarSelectable, lumenCalendarDayKey, lumenCalendarEventsForDay, lumenCalendarGrid, parseLumenCalendarDay } from './calendar-recipes.js'
const march = { year: 2026, month: 3, day: 8 }
test('ignores malformed decoded event rows and collections', () => {
  const valid = { id: 'work', label: 'Work', startDay: march }
  const malformed: unknown[] = [null,
    undefined,
    42,
    'event',
    [],
    {},
    { ...valid, id: null },
    { ...valid, label: null },
    { ...valid, startDay: null },
    { ...valid, endDay: null },
    { ...valid, detail: 42 },
    { ...valid, disabled: 'false' }]

  expect(Reflect.apply(lumenCalendarEventsForDay, undefined, [[...malformed, valid], march])).toEqual([valid])

  for (const events of [null, undefined, {}, 'events']) {
    expect(Reflect.apply(lumenCalendarEventsForDay, undefined, [events, march])).toEqual([])
  }
})
describe('civil calendar', () => {
  test('rejects invalid and adversarial day keys', () => {
    for (const key of ['2026-02-29', '1900-02-29', '0000-01-01', '2026-13-01', '2026-01-00', '9'.repeat(100000)]) expect(parseLumenCalendarDay(key)).toBeNull()
    expect(parseLumenCalendarDay('2000-02-29')).toEqual({ year: 2000, month: 2, day: 29 })
  })
  test('crosses DST and leap transitions without instants', () => {
    expect(addLumenCalendarDays(march, 1)).toEqual({ year: 2026, month: 3, day: 9 })
    expect(addLumenCalendarDays({ year: 2024, month: 2, day: 28 }, 2)).toEqual({ year: 2024, month: 3, day: 1 })
    expect(addLumenCalendarMonths({ year: 2024, month: 1, day: 31 }, 1)).toEqual({ year: 2024, month: 2, day: 29 })
    expect(addLumenCalendarDays({ year: 1, month: 1, day: 1 }, -1)).toBeNull()
    expect(addLumenCalendarDays({ year: 9999, month: 12, day: 31 }, 1)).toBeNull()
  })
  test('aligns configurable weekdays and preserves selection input', () => {
    expect(lumenCalendarDayKey(lumenCalendarGrid(march, 0)[0] ?? march)).toBe('2026-03-01')
    expect(lumenCalendarDayKey(lumenCalendarGrid(march, 1)[0] ?? march)).toBe('2026-02-23')
    expect(lumenCalendarGrid(march, -1)).toEqual([])
    expect(isLumenCalendarSelectable(march, { ...march, day: 9 }, { ...march, day: 7 })).toBe(false)
    expect(isLumenCalendarSelectable(march, march, march)).toBe(true)
    expect(march.day).toBe(8)
  })
  test('shows inclusive event indicators and rejects inverted ranges', () => {
    const events = [{ id: 'work', label: 'Work', startDay: march, endDay: { ...march, day: 10 } }, { id: 'bad', label: 'Bad', startDay: { ...march, day: 10 }, endDay: march }]
    expect(lumenCalendarEventsForDay(events, { ...march, day: 10 }).map(event => event.id)).toEqual(['work'])
    expect(lumenCalendarEventsForDay(events, { ...march, day: 11 })).toEqual([])
  })
})

test.each([null, undefined, 42, '2026-03-08', [], {}, { year: '2026', month: 3, day: 8 }, { year: 2026, month: null, day: 8 }, { year: 2026, month: 3, day: undefined }])('rejects malformed decoded calendar days: %s', value => {
  expect(isLumenCalendarDay(value)).toBe(false)
  expect(Reflect.apply(lumenCalendarGrid, undefined, [value])).toEqual([])
})
