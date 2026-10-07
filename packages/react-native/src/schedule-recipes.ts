import { type LumenAgendaEvent, lumenAgendaGroups, type LumenAgendaSegment } from './agenda-recipes.js'
import type { LumenCalendarDay } from './calendar-recipes.js'

export interface LumenSchedulePlacement {
  segment: LumenAgendaSegment
  top: number
  height: number
  lane: number
  laneCount: number
}
export interface LumenScheduleDay {
  day: LumenCalendarDay
  allDay: readonly LumenAgendaSegment[]
  placements: readonly LumenSchedulePlacement[]
}

const assignLanes = (placements: LumenSchedulePlacement[]): LumenSchedulePlacement[] => {
  let group: LumenSchedulePlacement[] = []
  let laneEnds: number[] = []
  let groupEnd = -1

  const finish = (): void => {
    for (const item of group) item.laneCount = laneEnds.length
  }

  for (const item of placements) {
    if (item.top >= groupEnd) {
      finish()

      group = []

      laneEnds = []
    }

    let lane = laneEnds.findIndex(value => value <= item.top)

    if (lane < 0) lane = laneEnds.length

    laneEnds[lane] = item.top + item.height

    item.lane = lane

    groupEnd = Math.max(groupEnd, item.top + item.height)

    group.push(item)
  }

  finish()

  return placements
}

const placeSegments = (
  segments: readonly LumenAgendaSegment[], start: number, end: number
): LumenSchedulePlacement[] => {
  const placements: LumenSchedulePlacement[] = []

  for (const segment of segments) {
    if (segment.startMinute === null || segment.endMinute === null) continue

    if (segment.startMinute >= end || segment.endMinute <= start) continue

    const top = Math.min(Math.max(segment.startMinute, start), end - 48) - start
    const height = Math.max(48, Math.min(segment.endMinute, end) - start - top)

    placements.push({ segment, top, height, lane: 0, laneCount: 1 })
  }

  placements.sort((a, b) => a.top - b.top)

  return assignLanes(placements)
}

const validHours = (start: number, end: number): boolean => {
  const integers = Number.isInteger(start) && Number.isInteger(end)

  return integers && start >= 0 && end <= 24 && start < end
}

export const lumenScheduleLayout = (
  events: readonly LumenAgendaEvent[], selectedDay: LumenCalendarDay, dayCount = 7, startHour = 8, endHour = 18
): readonly LumenScheduleDay[] => {
  if (!Number.isInteger(dayCount) || dayCount < 1 || dayCount > 7) return []

  if (!validHours(startHour, endHour)) return []

  return lumenAgendaGroups(events, selectedDay, dayCount).map(group => ({
    day: group.day,
    allDay: group.segments.filter(segment => segment.startMinute === null),
    placements: placeSegments(group.segments, startHour * 60, endHour * 60)
  }))
}
