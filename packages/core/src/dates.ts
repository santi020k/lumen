// cspell:words siguiente Elegir fecha Selecciona intervalo fechas válido
/** Parse a complete Gregorian calendar date without accepting Date's day overflow. */
export const parseLumenDate = (value: unknown): Date | null => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) return null

  const date = new Date(`${value}T00:00:00.000Z`)

  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null
}

export const isLumenDateBoundsValid = (min?: string, max?: string): boolean => (
  (min === undefined || parseLumenDate(min) !== null) &&
  (max === undefined || parseLumenDate(max) !== null) &&
  !(min && max && min > max)
)

const isDateRangeRecord = (range: unknown): range is { start: string, end: string } => (
  typeof range === 'object' && range !== null && 'start' in range && 'end' in range &&
  typeof range.start === 'string' && typeof range.end === 'string'
)

export const isLumenDateRangeValid = (range: unknown, min?: string, max?: string): boolean => {
  if (!isDateRangeRecord(range)) return false

  return parseLumenDate(range.start) !== null && parseLumenDate(range.end) !== null &&
    isLumenDateBoundsValid(min, max) && range.start <= range.end &&
    !(min && range.start < min) && !(max && range.end > max)
}

export const resolveLumenDateLocale = (locale?: string): string => {
  const documentLocale = typeof document === 'undefined' ? undefined : document.documentElement.lang
  const browserLocale = typeof navigator === 'undefined' ? undefined : navigator.language
  const requested = locale || documentLocale || browserLocale || 'en'

  try {
    return new Intl.Locale(requested).toString()
  } catch {
    return 'en'
  }
}

export interface LumenDateLabels {
  previousMonth: string
  nextMonth: string
  chooseDate: string
  invalidRange: string
}

export const resolveLumenDateLabels = (locale?: string): LumenDateLabels => {
  const language = resolveLumenDateLocale(locale)

  return language.toLowerCase().split('-')[0] === 'es' ?
    { previousMonth: 'Mes anterior', nextMonth: 'Mes siguiente', chooseDate: 'Elegir fecha', invalidRange: 'Selecciona un intervalo de fechas válido.' } :
    { previousMonth: 'Previous month', nextMonth: 'Next month', chooseDate: 'Choose date', invalidRange: 'Select a valid date range.' }
}
