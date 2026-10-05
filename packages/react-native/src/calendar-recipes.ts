export interface LumenCalendarDay { year: number, month: number, day: number }
export interface LumenCalendarEvent {
  id: string
  label: string
  startDay: LumenCalendarDay
  endDay?: LumenCalendarDay
  detail?: string
  disabled?: boolean
}
export const lumenCalendarDaysInMonth = (year: number, month: number): number => {
  if (month === 2) return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28

  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

const isCalendarRecord = (value: unknown): value is Record<'year' | 'month' | 'day', unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value) &&
  'year' in value && 'month' in value && 'day' in value
)

const isCalendarInteger = (value: unknown, minimum: number, maximum: number): value is number => (
  typeof value === 'number' && Number.isInteger(value) && value >= minimum && value <= maximum
)

export const isLumenCalendarDay = (value: unknown): value is LumenCalendarDay => {
  if (!isCalendarRecord(value)) return false

  return isCalendarInteger(value.year, 1, 9999) && isCalendarInteger(value.month, 1, 12) &&
    isCalendarInteger(value.day, 1, lumenCalendarDaysInMonth(value.year, value.month))
}
export const lumenCalendarDayKey = (day: LumenCalendarDay): string => `${String(day.year).padStart(4, '0')}-${String(day.month).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`
export const parseLumenCalendarDay = (key: string): LumenCalendarDay | null => {
  if (key.length !== 10 || !/^\d{4}-\d{2}-\d{2}$/u.test(key)) return null

  const day = { year: Number(key.slice(0, 4)), month: Number(key.slice(5, 7)), day: Number(key.slice(8, 10)) }

  return isLumenCalendarDay(day) ? day : null
}
// Integer Gregorian ordinals; never an instant or midnight in a timezone.
export const lumenCalendarOrdinal = (day: LumenCalendarDay): number => {
  const year = day.year - 1
  let ordinal = 365 * year + Math.floor(year / 4) - Math.floor(year / 100) + Math.floor(year / 400) + day.day - 1

  for (let month = 1; month < day.month; month++) ordinal += lumenCalendarDaysInMonth(day.year, month)

  return ordinal
}
export const addLumenCalendarDays = (day: LumenCalendarDay, amount: number): LumenCalendarDay | null => {
  if (!isLumenCalendarDay(day) || !Number.isInteger(amount)) return null

  let ordinal = lumenCalendarOrdinal(day) + amount

  if (ordinal < 0 || ordinal > 3652058) return null

  let year = Math.min(9999, Math.floor(ordinal / 365.2425) + 1)

  while (lumenCalendarOrdinal({ year, month: 1, day: 1 }) > ordinal) year--

  while (year < 9999 && lumenCalendarOrdinal({ year: year + 1, month: 1, day: 1 }) <= ordinal) year++

  ordinal -= lumenCalendarOrdinal({ year, month: 1, day: 1 })

  let month = 1

  while (ordinal >= lumenCalendarDaysInMonth(year, month)) {
    ordinal -= lumenCalendarDaysInMonth(year, month)

    month++
  }

  return { year, month, day: ordinal + 1 }
}
export const addLumenCalendarMonths = (day: LumenCalendarDay, amount: number): LumenCalendarDay | null => {
  if (!isLumenCalendarDay(day) || !Number.isInteger(amount)) return null

  const index = (day.year - 1) * 12 + day.month - 1 + amount

  if (index < 0 || index >= 9999 * 12) return null

  const year = Math.floor(index / 12) + 1
  const month = index % 12 + 1

  return { year, month, day: Math.min(day.day, lumenCalendarDaysInMonth(year, month)) }
}
export const lumenCalendarGrid = (month: LumenCalendarDay, firstWeekday = 1): readonly (LumenCalendarDay | null)[] => {
  if (!isLumenCalendarDay(month) || !Number.isInteger(firstWeekday) || firstWeekday < 0 || firstWeekday > 6) return []

  const first = { ...month, day: 1 }
  const offset = ((lumenCalendarOrdinal(first) + 1) % 7 - firstWeekday + 7) % 7

  return Array.from({ length: 42 }, (_, index) => addLumenCalendarDays(first, index - offset))
}

const boundsOrdered = (
  min?: LumenCalendarDay, max?: LumenCalendarDay
): boolean => !min || !max || lumenCalendarOrdinal(min) <= lumenCalendarOrdinal(max)

export const isLumenCalendarSelectable = (
  day: LumenCalendarDay, min?: LumenCalendarDay, max?: LumenCalendarDay
): boolean => {
  if (!isLumenCalendarDay(day)) return false

  if (min && (!isLumenCalendarDay(min) || lumenCalendarOrdinal(day) < lumenCalendarOrdinal(min))) return false

  if (max && (!isLumenCalendarDay(max) || lumenCalendarOrdinal(day) > lumenCalendarOrdinal(max))) return false

  if (!boundsOrdered(min, max)) return false

  return true
}
export const lumenCalendarEventsForDay = (
  events: readonly LumenCalendarEvent[], day: LumenCalendarDay
): readonly LumenCalendarEvent[] => events.filter(event => {
  const end = event.endDay ?? event.startDay

  return event.id.length > 0 && isLumenCalendarSelectable(day, event.startDay, end)
})
