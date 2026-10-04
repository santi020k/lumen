import { type LumenChartDomain, type LumenChartTone, lumenChartTones, scaleLumenChartValue } from './charts.js'

export interface LumenCalendarHeatmapDatum { date: string, value: number | null }
export interface LumenCalendarHeatmapOptions {
  startDate: string
  endDate: string
  weekStartsOn?: 0 | 1 | undefined
  domain?: LumenChartDomain | undefined
}
export interface LumenFunnelDatum { id: string, label: string, value: number | null, tone?: LumenChartTone }
export interface LumenBoxPlotDatum {
  id: string
  label: string
  min: number | null
  q1: number | null
  median: number | null
  q3: number | null
  max: number | null
  outliers?: readonly number[]
  tone?: LumenChartTone
}
export interface LumenBoxPlotOptions { domain?: LumenChartDomain | undefined }
export interface LumenBoxPlotStatisticLabels {
  min: string
  q1: string
  median: string
  q3: string
  max: string
  outliers: string
}

const inRange = (value: number, min: number, max: number): boolean => value >= min && value <= max
const dayMilliseconds = 86_400_000
const measurement = (value: unknown): value is number | null => value === null || (typeof value === 'number' && Number.isFinite(value))
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const tone = (value: unknown): boolean => value === undefined || lumenChartTones.some(item => item === value)

/** Strict Gregorian date-only identity, independent of locale, time zone and DST. */
export const parseLumenCalendarDate = (value: unknown): number | null => {
  if (typeof value !== 'string' || value.length !== 10 || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null

  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(5, 7))
  const day = Number(value.slice(8, 10))

  if (year < 1 || !inRange(month, 1, 12) || !inRange(day, 1, 31)) return null

  const date = new Date(0)

  date.setUTCFullYear(year, month - 1, day)

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null

  return date.getTime()
}

export const isLumenCalendarHeatmapDatum = (value: unknown): value is LumenCalendarHeatmapDatum => (
  typeof value === 'object' && value !== null && 'date' in value && 'value' in value &&
  parseLumenCalendarDate(value.date) !== null && measurement(value.value)
)

const identityValid = (value: unknown): boolean => (
  typeof value === 'object' && value !== null && 'id' in value && 'label' in value &&
  text(value.id) && text(value.label) && (!('tone' in value) || tone(value.tone))
)

export const isLumenFunnelDatum = (value: unknown): value is LumenFunnelDatum => {
  if (!identityValid(value) || typeof value !== 'object' || value === null || !('value' in value)) return false

  if (!measurement(value.value)) return false

  return value.value === null || value.value >= 0
}

const orderedStats = (stats: readonly unknown[]): boolean => stats.every((item, index) => {
  const previous = stats[index - 1]

  return typeof item === 'number' && Number.isFinite(item) &&
    (index === 0 || (typeof previous === 'number' && item >= previous))
})

const validOutliers = (value: unknown, missing: boolean): boolean => {
  if (value === undefined) return true

  if (!Array.isArray(value)) return false

  const entries: unknown[] = Array.from(value)

  if (!entries.every(item => typeof item === 'number' && Number.isFinite(item))) return false

  return !missing || value.length === 0
}

const hasBoxStats = (value: unknown): value is {
  min: unknown
  q1: unknown
  median: unknown
  q3: unknown
  max: unknown
} => typeof value === 'object' && value !== null &&
  'min' in value && 'q1' in value && 'median' in value && 'q3' in value && 'max' in value

export const isLumenBoxPlotDatum = (value: unknown): value is LumenBoxPlotDatum => {
  if (!identityValid(value) || !hasBoxStats(value)) return false

  const stats = [value.min, value.q1, value.median, value.q3, value.max]
  const missing = stats.every(item => item === null)

  if (!missing && !orderedStats(stats)) return false

  return validOutliers('outliers' in value ? value.outliers : undefined, missing)
}

const automaticDomain = (values: readonly number[]): LumenChartDomain => {
  if (values.length === 0) return { min: 0, max: 1 }

  let min = values[0] ?? 0
  let max = min

  for (const value of values) {
    min = Math.min(min, value)

    max = Math.max(max, value)
  }

  if (min === max) {
    const padding = Math.max(1, Math.abs(min) * 0.01)
    const lower = min - padding
    const upper = max + padding

    min = Number.isFinite(lower) ? lower : min

    max = Number.isFinite(upper) ? upper : max
  }

  return { min, max }
}

const validDomain = (domain: LumenChartDomain, values: readonly number[]): boolean => (
  Number.isFinite(domain.min) && Number.isFinite(domain.max) && domain.min < domain.max &&
  values.every(value => domain.min <= value && value <= domain.max)
)

interface CalendarCell { date: string, value: number | null, week: number, day: number, ratio: number | null }

const createCalendarCells = (
  start: number, count: number, weekStartsOn: number,
  dates: ReadonlyMap<string, number | null>, domain: LumenChartDomain
): CalendarCell[] => {
  const cells: CalendarCell[] = []
  const offset = (new Date(start).getUTCDay() - weekStartsOn + 7) % 7

  for (let index = 0; index < count; index++) {
    const date = new Date(start + index * dayMilliseconds).toISOString().slice(0, 10)
    const value = dates.get(date) ?? null

    cells.push({ date,
      value,
      week: Math.floor((offset + index) / 7),
      day: (offset + index) % 7,
      ratio: value === null ? null : scaleLumenChartValue(value, domain, 0, 1) })
  }

  return cells
}

const calendarObservationInRange = (date: string, start: number, end: number): boolean => {
  const timestamp = parseLumenCalendarDate(date)

  return timestamp !== null && inRange(timestamp, start, end)
}

const calendarDates = (data: readonly LumenCalendarHeatmapDatum[], start: number, end: number) => {
  const dates = new Map<string, number | null>()

  const valid = Array.from(data).every(item => {
    if (!isLumenCalendarHeatmapDatum(item) || dates.has(item.date)) return false

    if (!calendarObservationInRange(item.date, start, end)) return false

    dates.set(item.date, item.value)

    return true
  })

  return { valid, dates }
}

const isWeekStart = (value: unknown): boolean => value === 0 || value === 1
const invalidCalendar = () => ({ valid: false, domain: { min: 0, max: 1 }, cells: Array<CalendarCell>(), weekCount: 0 })

export const createLumenCalendarHeatmapGeometry = (
  data: readonly LumenCalendarHeatmapDatum[], options: LumenCalendarHeatmapOptions
) => {
  const start = parseLumenCalendarDate(options.startDate)
  const end = parseLumenCalendarDate(options.endDate)
  const weekStartsOn = options.weekStartsOn ?? 0

  if (start === null || end === null || !isWeekStart(weekStartsOn)) return invalidCalendar()

  const count = (end - start) / dayMilliseconds + 1

  if (!inRange(count, 1, 3660)) return invalidCalendar()

  const { valid: validData, dates } = calendarDates(data, start, end)
  const values = [...dates.values()].filter((value): value is number => value !== null)
  const domain = options.domain ?? automaticDomain(values)

  if (!validData || !validDomain(domain, values)) return invalidCalendar()

  const cells = createCalendarCells(start, count, weekStartsOn, dates, domain)
  const weekCount = Math.ceil(((new Date(start).getUTCDay() - weekStartsOn + 7) % 7 + count) / 7)

  return { valid: true, domain, cells, weekCount }
}

export const createLumenFunnelGeometry = (data: readonly LumenFunnelDatum[]) => {
  const ids = new Set<string>()
  let max = 0

  const valid = Array.from(data).every(item => {
    if (!isLumenFunnelDatum(item) || ids.has(item.id)) return false

    ids.add(item.id)

    max = Math.max(max, item.value ?? 0)

    return true
  })

  const ratio = (value: number | null) => {
    if (value === null) return null

    return max === 0 ? 0 : value / max
  }

  return { valid, max: valid ? max : 0, rows: valid ? data.map(item => ({ ...item, ratio: ratio(item.value) })) : [] }
}

export const createLumenBoxPlotGeometry = (data: readonly LumenBoxPlotDatum[], options: LumenBoxPlotOptions = {}) => {
  const ids = new Set<string>()

  const validData = Array.from(data).every(item => {
    if (!isLumenBoxPlotDatum(item) || ids.has(item.id)) return false

    ids.add(item.id)

    return true
  })

  const values = validData ?
    data.flatMap(item => (
      [item.min, item.q1, item.median, item.q3, item.max, ...(item.outliers ?? [])]
        .filter((value): value is number => value !== null)
    )) :
    []

  const requested = options.domain ?? automaticDomain(values)
  const valid = validData && validDomain(requested, values)
  const domain = valid ? requested : { min: 0, max: 1 }
  const position = (value: number | null) => value === null ? null : scaleLumenChartValue(value, domain, 0, 1)

  return { valid,
    domain,
    ticks: [domain.min, domain.min / 2 + domain.max / 2, domain.max],
    rows: valid ?
      data.map(item => ({ ...item,
        minPosition: position(item.min),
        q1Position: position(item.q1),
        medianPosition: position(item.median),
        q3Position: position(item.q3),
        maxPosition: position(item.max),
        outlierPositions: (item.outliers ?? []).map(value => scaleLumenChartValue(value, domain, 0, 1)) })) :
      [] }
}
