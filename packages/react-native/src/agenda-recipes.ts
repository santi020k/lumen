import {
  addLumenCalendarDays, isLumenCalendarDay,   type LumenCalendarDay, type LumenCalendarEvent,
  lumenCalendarOrdinal } from './calendar-recipes.js'

export interface LumenAgendaEvent { event: LumenCalendarEvent, startMinute?: number, endMinute?: number }
export interface LumenAgendaSegment {
  event: LumenAgendaEvent
  startMinute: number | null
  endMinute: number | null
}
export interface LumenAgendaGroup { day: LumenCalendarDay, segments: readonly LumenAgendaSegment[] }

const validMinutes = (start: number, end: number): boolean => {
  const integers = Number.isInteger(start) && Number.isInteger(end)
  const bounds = start >= 0 && start < 1440 && end >= 0 && end <= 1440

  return integers && bounds
}

const validTiming = (start: number | undefined, end: number | undefined, span: number): boolean => {
  if (start === undefined && end === undefined) return true

  if (start === undefined || end === undefined) return false

  if (!validMinutes(start, end)) return false

  return span > 0 || end > start
}

const validEvent = ({ event, startMinute, endMinute }: LumenAgendaEvent): boolean => {
  const end = event.endDay ?? event.startDay

  if (!isLumenCalendarDay(event.startDay) || !isLumenCalendarDay(end)) return false

  const span = lumenCalendarOrdinal(end) - lumenCalendarOrdinal(event.startDay)

  if (span < 0) return false

  return validTiming(startMinute, endMinute, span)
}

export const isLumenAgendaEventsValid = (events: readonly LumenAgendaEvent[]): boolean => {
  const ids = new Set<string>()

  return events.every(input => {
    const id = input.event.id

    if (id.trim().length === 0 || ids.has(id)) return false

    ids.add(id)

    return validEvent(input)
  })
}

const clipMinute = (minute: number | undefined, boundary: boolean, fallback: number): number | null => {
  if (minute === undefined) return null

  return boundary ? minute : fallback
}

const segmentForDay = (input: LumenAgendaEvent, day: LumenCalendarDay): LumenAgendaSegment | null => {
  const ordinal = lumenCalendarOrdinal(day)
  const start = lumenCalendarOrdinal(input.event.startDay)
  const end = lumenCalendarOrdinal(input.event.endDay ?? input.event.startDay)

  if (ordinal < start || ordinal > end) return null

  const startMinute = clipMinute(input.startMinute, ordinal === start, 0)
  const endMinute = clipMinute(input.endMinute, ordinal === end, 1440)

  if (startMinute !== null && endMinute !== null && endMinute <= startMinute) return null

  return { event: input, startMinute, endMinute }
}

const sortSegments = (a: LumenAgendaSegment, b: LumenAgendaSegment): number => {
  const time = (a.startMinute ?? -1) - (b.startMinute ?? -1)

  if (time !== 0) return time

  const aID = a.event.event.id
  const bID = b.event.event.id

  if (aID === bID) return 0

  return aID < bID ? -1 : 1
}

export const lumenAgendaGroups = (
  events: readonly LumenAgendaEvent[], selectedDay: LumenCalendarDay, dayCount = 7
): readonly LumenAgendaGroup[] => {
  if (!isLumenCalendarDay(selectedDay) || !Number.isInteger(dayCount) || dayCount < 1 || dayCount > 31) return []

  if (!addLumenCalendarDays(selectedDay, dayCount - 1) || !isLumenAgendaEventsValid(events)) return []

  return Array.from({ length: dayCount }, (_, offset) => {
    const day = addLumenCalendarDays(selectedDay, offset) ?? selectedDay
    const segments = events.map(input => segmentForDay(input, day)).filter(segment => segment !== null)

    segments.sort(sortSegments)

    return { day, segments }
  })
}
export const formatLumenAgendaMinute = (minute: number): string => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
