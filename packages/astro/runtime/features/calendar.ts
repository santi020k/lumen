import { getLumenDirectionalKey, parseLumenDate as parseCalendarDate } from '@santi020k/lumen-core'

import { queryScope } from '../scope.js'

import { addCalendarDays, addCalendarMonths, compareCalendarDates, formatCalendarDate, formatCalendarMonth, getCalendarMax, getCalendarMin, isCalendarDateDisabled, isCalendarDisabled, isCalendarReadOnly, parseCalendarMonth, renderCalendar } from './calendar-shared.js'
import { isOwnedByAnotherAdapter } from './shared.js'

const clampCalendarDate = (date: Date, min: Date | null, max: Date | null): Date => {
  if (min && compareCalendarDates(date, min) < 0) return min

  if (max && compareCalendarDates(date, max) > 0) return max

  return date
}

const selectCalendarDate = (root: HTMLElement, date: Date): void => {
  const input = root.querySelector<HTMLInputElement>('[data-ui-calendar-input]')

  if (!input || isCalendarDisabled(root) || isCalendarReadOnly(root)) return

  const min = getCalendarMin(root)
  const max = getCalendarMax(root)
  const nextDate = date

  if (isCalendarDateDisabled(root, nextDate, min, max)) return

  input.value = formatCalendarDate(nextDate)

  root.dataset.uiCalendarValue = input.value

  root.dataset.uiCalendarMonth = formatCalendarMonth(nextDate)

  renderCalendar(root, nextDate, true)

  input.dispatchEvent(new Event('input', { bubbles: true }))

  input.dispatchEvent(new Event('change', { bubbles: true }))
}

const focusCalendarDate = (root: HTMLElement, date: Date): void => {
  const min = getCalendarMin(root)
  const max = getCalendarMax(root)
  const nextDate = clampCalendarDate(date, min, max)

  root.dataset.uiCalendarMonth = formatCalendarMonth(nextDate)

  renderCalendar(root, nextDate, true)
}

const moveCalendarFocus = (root: HTMLElement, currentDate: Date, key: string): void => {
  const column = (currentDate.getUTCDay() + 6) % 7

  const keyOffsets: Record<string, number> = {
    ArrowDown: 7,
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -7,
    End: 6 - column,
    Home: -column
  }

  if (key === 'PageDown' || key === 'PageUp') {
    focusCalendarDate(root, addCalendarMonths(currentDate, key === 'PageDown' ? 1 : -1))

    return
  }

  const offset = keyOffsets[getLumenDirectionalKey(root, key)]

  if (offset === undefined) return

  focusCalendarDate(root, addCalendarDays(currentDate, offset))
}

const bindCalendars = (root: HTMLElement): void => {
  if (root.dataset.uiBound === 'true' || isOwnedByAnotherAdapter(root)) return

  const input = root.querySelector<HTMLInputElement>('[data-ui-calendar-input]')

  if (!input) return

  const initialValue = input.value

  root.dataset.uiBound = 'true'

  renderCalendar(root)

  root.querySelector<HTMLButtonElement>('[data-ui-calendar-prev]')?.addEventListener('click', () => {
    const month = parseCalendarMonth(root.dataset.uiCalendarMonth)

    if (!month || isCalendarDisabled(root)) return

    const nextMonth = addCalendarMonths(month, -1)

    if (compareCalendarDates(addCalendarDays(month, -1), getCalendarMin(root)) < 0) return

    root.dataset.uiCalendarMonth = formatCalendarMonth(nextMonth)

    renderCalendar(root, nextMonth, true)
  })

  root.querySelector<HTMLButtonElement>('[data-ui-calendar-next]')?.addEventListener('click', () => {
    const month = parseCalendarMonth(root.dataset.uiCalendarMonth)

    if (!month || isCalendarDisabled(root)) return

    const nextMonth = addCalendarMonths(month, 1)

    if (compareCalendarDates(nextMonth, getCalendarMax(root)) > 0) return

    root.dataset.uiCalendarMonth = formatCalendarMonth(nextMonth)

    renderCalendar(root, nextMonth, true)
  })

  root.addEventListener('click', event => {
    const target = event.target

    if (!(target instanceof Element)) return

    const cell = target.closest<HTMLElement>('[data-ui-calendar-day]')

    if (!cell || !root.contains(cell) || cell.getAttribute('aria-disabled') === 'true') return

    const date = parseCalendarDate(cell.dataset.date)

    if (date) {
      selectCalendarDate(root, date)
    }
  })

  root.addEventListener('keydown', event => {
    const target = event.target

    if (!(target instanceof HTMLElement) || !target.hasAttribute('data-ui-calendar-day')) return

    const date = parseCalendarDate(target.dataset.date)

    if (!date || isCalendarDisabled(root)) return

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()

      selectCalendarDate(root, date)

      return
    }

    if (!['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'End', 'Home', 'PageDown', 'PageUp'].includes(event.key)) {
      return
    }

    event.preventDefault()

    moveCalendarFocus(root, date, event.key)
  })

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.attributeName === 'value') {
        root.dataset.uiCalendarValue = parseCalendarDate(root.getAttribute('value')) ? root.getAttribute('value') ?? '' : ''

        input.value = root.dataset.uiCalendarValue
      }

      if (mutation.attributeName === 'month') {
        root.dataset.uiCalendarMonth = root.getAttribute('month') ?? root.dataset.uiCalendarInitialMonth ?? ''
      }
    }

    const activeElement = root.ownerDocument.activeElement

    const focusedDay = activeElement && root.contains(activeElement) ?
      parseCalendarDate(activeElement.getAttribute('data-date')) :
      null

    renderCalendar(root, focusedDay, focusedDay !== null)
  })

  observer.observe(root, { attributes: true, attributeFilter: ['disabled', 'readonly', 'min', 'max', 'value', 'month', 'locale', 'lang', 'data-disabled', 'data-readonly', 'data-locale', 'data-ui-calendar-min', 'data-ui-calendar-max', 'data-previous-month-label', 'data-next-month-label'] })

  input.form?.addEventListener('reset', event => {
    globalThis.setTimeout(() => {
      if (event.defaultPrevented || !root.isConnected) return

      root.dataset.uiCalendarValue = initialValue

      input.value = initialValue

      root.dataset.uiCalendarMonth = root.dataset.uiCalendarInitialMonth ?? root.dataset.uiCalendarMonth

      renderCalendar(root)
    })
  })
}

export const initCalendars = (scope: ParentNode): void => {
  for (const root of queryScope(scope, '[data-ui-calendar]')) bindCalendars(root)
}
