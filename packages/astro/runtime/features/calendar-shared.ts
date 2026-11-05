import { isLumenDateBoundsValid, parseLumenDate as parseCalendarDate, resolveLumenDateLabels, resolveLumenDateLocale } from '@santi020k/lumen-core'

const createCalendarDate = (year: number, month: number, day: number): Date => {
  const date = new Date(0)

  date.setUTCFullYear(year, month, day)

  return date
}

export const parseCalendarMonth = (value: string | null | undefined): Date | null => value ? parseCalendarDate(`${value}-01`) : null

export const formatCalendarDate = (date: Date): string => date.toISOString().split('T')[0] ?? ''

export const formatCalendarMonth = (date: Date): string => formatCalendarDate(date).slice(0, -3)

export const addCalendarDays = (date: Date, days: number): Date => createCalendarDate(
  date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days
)

const getCalendarDaysInMonth = (date: Date): number => createCalendarDate(
  date.getUTCFullYear(), date.getUTCMonth() + 1, 0
).getUTCDate()

export const addCalendarMonths = (date: Date, months: number): Date => {
  const target = createCalendarDate(date.getUTCFullYear(), date.getUTCMonth() + months, 1)

  return createCalendarDate(
    target.getUTCFullYear(), target.getUTCMonth(), Math.min(date.getUTCDate(), getCalendarDaysInMonth(target))
  )
}

export const compareCalendarDates = (date: Date, other: Date | null): number => (
  other ? Math.sign(date.getTime() - other.getTime()) : 0
)

export const getCalendarLocale = (root: HTMLElement): string => resolveLumenDateLocale(root.getAttribute('locale') || root.dataset.locale || root.closest('[lang]')?.getAttribute('lang') || undefined)

export const getCalendarMin = (root: HTMLElement): Date | null => parseCalendarDate(root.getAttribute('min') ?? root.dataset.uiCalendarMin ?? '0001-01-01')

export const getCalendarMax = (root: HTMLElement): Date | null => parseCalendarDate(root.getAttribute('max') ?? root.dataset.uiCalendarMax ?? '9999-12-31')

export const isCalendarDisabled = (root: HTMLElement): boolean => root.hasAttribute('disabled') || root.dataset.disabled === 'true' || !isLumenDateBoundsValid(root.getAttribute('min') ?? root.dataset.uiCalendarMin, root.getAttribute('max') ?? root.dataset.uiCalendarMax)

export const isCalendarReadOnly = (root: HTMLElement): boolean => root.hasAttribute('readonly') || root.dataset.readonly === 'true'

const getCalendarToday = (): Date => {
  const today = new Date()

  return createCalendarDate(today.getFullYear(), today.getMonth(), today.getDate())
}

const getCalendarGridStart = (month: Date): Date => addCalendarDays(month, -((month.getUTCDay() + 6) % 7))

export const isCalendarDateDisabled = (
  root: HTMLElement,
  date: Date,
  min: Date | null,
  max: Date | null
): boolean => isCalendarDisabled(root) ||
  compareCalendarDates(date, min) < 0 ||
  compareCalendarDates(date, max) > 0

const getCalendarFocusDate = (
  root: HTMLElement,
  month: Date,
  min: Date | null,
  max: Date | null,
  requestedDate?: Date | null
): Date => {
  const selectedDate = parseCalendarDate(root.dataset.uiCalendarValue)
  const today = getCalendarToday()
  const candidates = [requestedDate, selectedDate, today, month]

  for (const candidate of candidates) {
    if (
      candidate &&
      formatCalendarMonth(candidate) === formatCalendarMonth(month) &&
      !isCalendarDateDisabled(root, candidate, min, max)
    ) {
      return candidate
    }
  }

  for (let index = 0; index < getCalendarDaysInMonth(month); index += 1) {
    const date = addCalendarDays(month, index)

    if (!isCalendarDateDisabled(root, date, min, max)) return date
  }

  return month
}

const syncCalendarNavigation = (
  root: HTMLElement,
  month: Date,
  min: Date | null,
  max: Date | null
): void => {
  const previous = root.querySelector<HTMLButtonElement>('[data-ui-calendar-prev]')
  const next = root.querySelector<HTMLButtonElement>('[data-ui-calendar-next]')
  const disabled = isCalendarDisabled(root)
  const previousMonthLastDay = addCalendarDays(month, -1)
  const nextMonthFirstDay = addCalendarMonths(month, 1)

  if (previous) {
    previous.disabled = disabled || compareCalendarDates(previousMonthLastDay, min) < 0
  }

  if (next) {
    next.disabled = disabled || compareCalendarDates(nextMonthFirstDay, max) > 0
  }
}

interface CalendarGridContext {
  min: Date | null
  max: Date | null
  focusIso: string
  selectedIso: string
  todayIso: string
  visibleMonth: Date
  dayLabel: Intl.DateTimeFormat
}

const createCalendarCell = (root: HTMLElement, date: Date, context: CalendarGridContext): HTMLTableCellElement => {
  const { min, max, focusIso, selectedIso, todayIso, visibleMonth, dayLabel } = context
  const dateIso = formatCalendarDate(date)
  const cell = document.createElement('td')
  const unavailable = isCalendarDateDisabled(root, date, min, max)

  cell.role = 'gridcell'

  cell.tabIndex = !unavailable && dateIso === focusIso ? 0 : -1

  cell.textContent = String(date.getUTCDate())

  cell.dataset.date = dateIso

  cell.dataset.uiCalendarDay = ''

  cell.setAttribute('aria-label', dayLabel.format(date))

  cell.setAttribute('aria-selected', String(selectedIso === dateIso))

  if (unavailable) {
    cell.setAttribute('aria-disabled', 'true')
  }

  if (formatCalendarMonth(date) !== formatCalendarMonth(visibleMonth)) {
    cell.dataset.outside = 'true'
  }

  if (dateIso === todayIso) {
    cell.dataset.today = 'true'
  }

  if (selectedIso === dateIso) {
    cell.dataset.selected = 'true'
  }

  return cell
}

const createCalendarHeader = (weekdayLabel: Intl.DateTimeFormat): HTMLTableSectionElement => {
  const header = document.createElement('thead')
  const headerRow = document.createElement('tr')

  headerRow.role = 'row'

  for (let index = 0; index < 7; index += 1) {
    const cell = document.createElement('th')

    cell.scope = 'col'

    cell.role = 'columnheader'

    cell.textContent = weekdayLabel.format(createCalendarDate(2026, 0, 5 + index))

    headerRow.append(cell)
  }

  header.append(headerRow)

  return header
}

const createCalendarBody = (root: HTMLElement, context: CalendarGridContext): HTMLTableSectionElement => {
  const { min, max, focusIso, selectedIso, todayIso, visibleMonth, dayLabel } = context
  const body = document.createElement('tbody')
  const firstCell = getCalendarGridStart(visibleMonth)

  for (let rowIndex = 0; rowIndex < 6; rowIndex += 1) {
    const row = document.createElement('tr')

    row.role = 'row'

    for (let columnIndex = 0; columnIndex < 7; columnIndex += 1) {
      const date = addCalendarDays(firstCell, rowIndex * 7 + columnIndex)
      const cell = createCalendarCell(root, date, { min, max, focusIso, selectedIso, todayIso, visibleMonth, dayLabel })

      row.append(cell)
    }

    body.append(row)
  }

  return body
}

const syncCalendarLabels = (root: HTMLElement, grid: HTMLElement, locale: string): void => {
  const labels = resolveLumenDateLabels(locale)
  const input = root.querySelector<HTMLInputElement>('[data-ui-calendar-input]')

  if (input) input.disabled = isCalendarDisabled(root)

  root.setAttribute('aria-disabled', String(isCalendarDisabled(root)))

  grid.setAttribute('aria-readonly', String(isCalendarReadOnly(root)))

  root.querySelector('[data-ui-calendar-prev]')?.setAttribute('aria-label', root.dataset.previousMonthLabel || labels.previousMonth)

  root.querySelector('[data-ui-calendar-next]')?.setAttribute('aria-label', root.dataset.nextMonthLabel || labels.nextMonth)
}

export const renderCalendar = (
  root: HTMLElement,
  requestedFocusDate?: Date | null,
  shouldFocus = false
): void => {
  const label = root.querySelector<HTMLElement>('[data-ui-calendar-label]')
  const grid = root.querySelector<HTMLElement>('[data-ui-calendar-grid]')

  if (!label || !grid) return

  const locale = getCalendarLocale(root)

  syncCalendarLabels(root, grid, locale)

  const min = getCalendarMin(root)
  const max = getCalendarMax(root)
  const selectedDate = parseCalendarDate(root.dataset.uiCalendarValue)
  const todayIso = formatCalendarDate(getCalendarToday())
  const month = parseCalendarMonth(root.dataset.uiCalendarMonth) ?? selectedDate ?? getCalendarToday()
  const visibleMonth = createCalendarDate(month.getUTCFullYear(), month.getUTCMonth(), 1)
  const focusDate = getCalendarFocusDate(root, visibleMonth, min, max, requestedFocusDate)
  const focusIso = formatCalendarDate(focusDate)
  const selectedIso = selectedDate ? formatCalendarDate(selectedDate) : ''

  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric'
  }).format(visibleMonth)

  const dayLabel = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    weekday: 'long',
    year: 'numeric'
  })

  const weekdayLabel = new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    weekday: 'short'
  })

  root.dataset.uiCalendarMonth = formatCalendarMonth(visibleMonth)

  label.textContent = monthLabel

  syncCalendarNavigation(root, visibleMonth, min, max)

  grid.replaceChildren(createCalendarHeader(weekdayLabel), createCalendarBody(root, {
    min, max, focusIso, selectedIso, todayIso, visibleMonth, dayLabel
  }))

  if (shouldFocus && !isCalendarDisabled(root)) {
    root.querySelector<HTMLElement>(`[data-ui-calendar-day][data-date="${focusIso}"]`)?.focus({ preventScroll: true })
  }
}
