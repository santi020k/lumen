export interface LumenSearchFieldState {
  opacity: number
  showClearAction: boolean
}

export const resolveLumenSearchFieldState = (
  value: string,
  editable: boolean
): LumenSearchFieldState => ({
  opacity: editable ? 1 : 0.52,
  showClearAction: editable && value.length > 0
})

export interface LumenDateRangeValue {
  end: Date | null
  start: Date | null
}

const isValidDate = (value: Date): boolean => !Number.isNaN(value.getTime())

const normalizeLumenDate = (value: Date): Date => (
  isValidDate(value) ? new Date(value.getFullYear(), value.getMonth(), value.getDate()) : new Date(0)
)

const padLumenDatePart = (value: number): string => String(value).padStart(2, '0')

export const formatLumenDateInputValue = (value: Date): string => {
  const normalized = normalizeLumenDate(value)

  return `${normalized.getFullYear()}-${padLumenDatePart(normalized.getMonth() + 1)}-${padLumenDatePart(normalized.getDate())}`
}

export const parseLumenDateInputValue = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const date = new Date(year, month, day)

  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null

  return date
}

export interface LumenDateBounds {
  maximumDate?: Date
  minimumDate?: Date
}

export const resolveLumenDateBounds = (
  minimumDate?: Date,
  maximumDate?: Date
): LumenDateBounds => {
  const bounds: LumenDateBounds = {}

  if (minimumDate) bounds.minimumDate = normalizeLumenDate(minimumDate)

  if (maximumDate) bounds.maximumDate = normalizeLumenDate(maximumDate)

  if (bounds.minimumDate && bounds.maximumDate && bounds.maximumDate < bounds.minimumDate) {
    bounds.maximumDate = bounds.minimumDate
  }

  return bounds
}

export const clampLumenDate = (
  value: Date,
  minimumDate?: Date,
  maximumDate?: Date
): Date => {
  const normalizedValue = normalizeLumenDate(value)

  const { maximumDate: normalizedMaximum, minimumDate: normalizedMinimum } = resolveLumenDateBounds(
    minimumDate,
    maximumDate
  )

  if (normalizedMinimum && normalizedValue < normalizedMinimum) return normalizedMinimum

  if (normalizedMaximum && normalizedValue > normalizedMaximum) return normalizedMaximum

  return normalizedValue
}

export const resolveLumenDatePickerValue = (
  value: Date | null,
  minimumDate?: Date,
  maximumDate?: Date,
  fallback = new Date()
): Date => clampLumenDate(value ?? fallback, minimumDate, maximumDate)

export const resolveLumenDateRangeEndMinimum = (
  start: Date | null,
  minimumDate?: Date
): Date | undefined => {
  if (!start) return minimumDate

  if (!minimumDate || start > minimumDate) return start

  return minimumDate
}

export const resolveLumenDateRangeStartChange = (
  value: LumenDateRangeValue,
  start: Date,
  minimumDate?: Date,
  maximumDate?: Date
): LumenDateRangeValue => {
  const nextStart = clampLumenDate(start, minimumDate, maximumDate)
  const nextEnd = value.end && normalizeLumenDate(value.end) < nextStart ? nextStart : value.end

  return { end: nextEnd, start: nextStart }
}

export const resolveLumenDateRangeEndChange = (
  value: LumenDateRangeValue,
  end: Date,
  minimumDate?: Date,
  maximumDate?: Date
): LumenDateRangeValue => {
  const effectiveMinimum = resolveLumenDateRangeEndMinimum(value.start, minimumDate)

  return {
    end: clampLumenDate(end, effectiveMinimum, maximumDate),
    start: value.start
  }
}
