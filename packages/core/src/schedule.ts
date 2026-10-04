export interface LumenScheduleEvent {
  end: string
  id: string
  resourceId?: string
  start: string
  title: string
}

export interface LumenScheduleResource {
  id: string
  label: string
}

export interface LumenScheduleSlot {
  date: string
  events: LumenScheduleEvent[]
  resource?: LumenScheduleResource
}

export interface LumenScheduleConflict {
  a: LumenScheduleEvent
  b: LumenScheduleEvent
}

export type LumenScheduleResizeEdge = 'end' | 'start'

export interface LumenScheduleResizeOptions {
  edge?: LumenScheduleResizeEdge
  max?: string
  min?: string
  snapMinutes?: number
}

export interface LumenScheduleKeyValueReader {
  getItem: (key: string) => null | string
}

export interface LumenScheduleKeyValueWriter {
  setItem: (key: string, value: string) => void
}

export interface LumenScheduleKeyValueStorage extends LumenScheduleKeyValueReader, LumenScheduleKeyValueWriter {}

const getScheduleRange = (event: LumenScheduleEvent): { end: number, start: number } | undefined => {
  const start = new Date(event.start).getTime()
  const end = new Date(event.end).getTime()

  return Number.isFinite(start) && Number.isFinite(end) && start <= end ? { end, start } : undefined
}

const requireScheduleTime = (value: string, field: string): number => {
  const time = new Date(value).getTime()

  if (!Number.isFinite(time)) throw new TypeError(`Schedule ${field} must be a valid date-time.`)

  return time
}

const requireScheduleRange = (event: LumenScheduleEvent): { end: number, start: number } => {
  const range = getScheduleRange(event)

  if (!range) throw new TypeError('Schedule event must have valid date-times with start no later than end.')

  return range
}

export const createScheduleSlots = (
  dates: readonly string[],
  events: readonly LumenScheduleEvent[],
  resources: readonly LumenScheduleResource[] = []
): LumenScheduleSlot[] => {
  const resourceList = resources.length ? resources : [undefined]

  return dates.flatMap(date => resourceList.map(resource => ({
    date,
    events: events.filter(event => event.start.startsWith(date) &&
      (!resource || event.resourceId === resource.id)),
    ...(resource ? { resource } : {})
  })))
}

export const moveScheduleEvent = (
  events: readonly LumenScheduleEvent[],
  eventId: string,
  nextStart: string,
  nextEnd: string,
  resourceId?: string
): LumenScheduleEvent[] => events.map(event => event.id === eventId ?
  {
    ...event,
    end: nextEnd,
    ...(resourceId ? { resourceId } : {}),
    start: nextStart
  } :
  event)

export const expandRecurringScheduleEvent = (
  event: LumenScheduleEvent,
  count: number,
  intervalDays = 7
): LumenScheduleEvent[] => {
  if (!Number.isSafeInteger(count) || count < 0) throw new RangeError('Schedule recurrence count must be a non-negative safe integer.')

  if (!Number.isFinite(intervalDays)) throw new RangeError('Schedule recurrence interval must be finite.')

  if (count === 0) return []

  const range = requireScheduleRange(event)

  return Array.from({ length: count }, (_, index) => {
    const start = new Date(range.start)
    const end = new Date(range.end)

    start.setDate(start.getDate() + index * intervalDays)

    end.setDate(end.getDate() + index * intervalDays)

    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      throw new RangeError('Schedule recurrence exceeds the supported date-time range.')
    }

    return {
      ...event,
      end: end.toISOString(),
      id: index === 0 ? event.id : `${event.id}-${index + 1}`,
      start: start.toISOString()
    }
  })
}

export const scheduleEventsOverlap = (
  a: LumenScheduleEvent,
  b: LumenScheduleEvent
): boolean => {
  if (a.id === b.id || (a.resourceId && b.resourceId && a.resourceId !== b.resourceId)) return false

  const first = getScheduleRange(a)
  const second = getScheduleRange(b)

  // An invalid interval cannot establish availability for a shared resource.
  return !first || !second || (first.start < second.end && second.start < first.end)
}

export const getScheduleConflicts = (
  events: readonly LumenScheduleEvent[]
): LumenScheduleConflict[] => {
  const conflicts: LumenScheduleConflict[] = []

  for (const [index, event] of events.entries()) {
    for (const nextEvent of events.slice(index + 1)) {
      if (scheduleEventsOverlap(event, nextEvent)) {
        conflicts.push({ a: event, b: nextEvent })
      }
    }
  }

  return conflicts
}

export const canPlaceScheduleEvent = (
  events: readonly LumenScheduleEvent[],
  event: LumenScheduleEvent
): boolean => Boolean(getScheduleRange(event)) && !events.some(nextEvent => scheduleEventsOverlap(event, nextEvent))

const clampTime = (
  value: number,
  min: number,
  max: number
): number => Math.min(max, Math.max(min, value))

const snapTime = (
  value: number,
  snapMinutes = 15
): number => {
  if (!Number.isFinite(snapMinutes)) throw new RangeError('Schedule snap minutes must be finite.')

  const snapMs = Math.max(1, snapMinutes) * 60_000
  const snapped = Math.round(value / snapMs) * snapMs

  if (!Number.isFinite(snapped) || Math.abs(snapped) > 8.64e15) {
    throw new RangeError('Schedule snapped time exceeds the supported date-time range.')
  }

  return snapped
}

const minScheduleEventDurationMs = 60_000

export const resizeScheduleEvent = (
  event: LumenScheduleEvent,
  nextDateTime: string,
  options: LumenScheduleResizeOptions = {}
): LumenScheduleEvent => {
  const edge = options.edge ?? 'end'
  const { start, end } = requireScheduleRange(event)
  const minBound = options.min !== undefined ? requireScheduleTime(options.min, 'minimum') : -Infinity
  const maxBound = options.max !== undefined ? requireScheduleTime(options.max, 'maximum') : Infinity

  if (minBound > maxBound) throw new RangeError('Schedule minimum cannot exceed maximum.')

  const snapped = snapTime(requireScheduleTime(nextDateTime, 'resize target'), options.snapMinutes)

  // The explicit min/max bound is a hard caller contract (for example a visible
  // drag range) and must never be exceeded; the minimum duration is only a
  // best-effort safety net and yields to that bound when the two conflict
  // (for example when the event's fixed edge already sits outside the bound).
  if (edge === 'start') {
    const upperBound = Math.max(minBound, Math.min(maxBound, end - minScheduleEventDurationMs))

    return {
      ...event,
      start: new Date(clampTime(snapped, minBound, upperBound)).toISOString()
    }
  }

  const lowerBound = Math.min(maxBound, Math.max(minBound, start + minScheduleEventDurationMs))

  return {
    ...event,
    end: new Date(clampTime(snapped, lowerBound, maxBound)).toISOString()
  }
}

export const resizeScheduleEvents = (
  events: readonly LumenScheduleEvent[],
  eventId: string,
  nextDateTime: string,
  options: LumenScheduleResizeOptions = {}
): LumenScheduleEvent[] => events.map(event => event.id === eventId ?
  resizeScheduleEvent(event, nextDateTime, options) :
  event)

const isScheduleEvent = (value: unknown): value is LumenScheduleEvent => {
  if (!value || typeof value !== 'object') return false

  const event = value as Partial<LumenScheduleEvent>

  return typeof event.end === 'string' &&
    typeof event.id === 'string' &&
    typeof event.start === 'string' &&
    typeof event.title === 'string' &&
    (event.resourceId === undefined || typeof event.resourceId === 'string')
}

export const serializeScheduleEvents = (
  events: readonly LumenScheduleEvent[]
): string => JSON.stringify(events)

export const parseScheduleEvents = (value: string): LumenScheduleEvent[] => {
  try {
    const parsed = JSON.parse(value) as unknown

    return Array.isArray(parsed) ? parsed.filter(isScheduleEvent) : []
  } catch {
    return []
  }
}

export const createScheduleStorageKey = (name: string): string => `lumen:schedule:${name.trim().toLowerCase().replaceAll(/\s+/g, '-')}`

export const saveScheduleEvents = (
  storage: LumenScheduleKeyValueWriter,
  key: string,
  events: readonly LumenScheduleEvent[]
): void => {
  storage.setItem(key, serializeScheduleEvents(events))
}

export const loadScheduleEvents = (
  storage: LumenScheduleKeyValueReader,
  key: string
): LumenScheduleEvent[] => {
  const value = storage.getItem(key)

  return value ? parseScheduleEvents(value) : []
}
