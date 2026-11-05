import { connectLumenFloatingPanel, isLumenDateBoundsValid, parseLumenDate as parseCalendarDate, resolveLumenDateLabels } from '@santi020k/lumen-core'

import { getCalendarLocale, renderCalendar } from './calendar-shared.js'
import { isOwnedByAnotherAdapter } from './shared.js'

const formatDatePickerValue = (value: string, placeholder: string, locale: string): string => {
  const date = parseCalendarDate(value)

  if (!date) return placeholder

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric'
  }).format(date)
}

const datePickerPanels = new WeakMap<HTMLElement, () => void>()

export const closeDatePicker = (root: HTMLElement, restoreFocus = false): void => {
  if (isOwnedByAnotherAdapter(root)) return

  const trigger = root.querySelector<HTMLButtonElement>('[data-ui-date-picker-trigger]')
  const popover = root.querySelector<HTMLElement>('[data-ui-date-picker-popover]')

  if (!trigger || !popover) return

  // Leave the top layer and restore the popover's inline styles before hiding it.
  datePickerPanels.get(root)?.()

  datePickerPanels.delete(root)

  popover.hidden = true

  popover.dataset.state = 'closed'

  trigger.setAttribute('aria-expanded', 'false')

  if (restoreFocus) trigger.focus()
}

const invalidDatePickerInputs = new WeakSet<HTMLInputElement>()

const syncDatePickerValidity = (native: HTMLInputElement, trigger: HTMLElement): void => {
  if (native.validity.valid) invalidDatePickerInputs.delete(native)

  const invalid = native.getAttribute('aria-invalid') ?? (invalidDatePickerInputs.has(native) ? 'true' : null)

  if (invalid === null) trigger.removeAttribute('aria-invalid')
  else trigger.setAttribute('aria-invalid', invalid)

  for (const attribute of ['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-errormessage']) {
    const value = native.getAttribute(attribute)

    if (value === null) trigger.removeAttribute(attribute)
    else trigger.setAttribute(attribute, value)
  }
}

const syncDatePickerValue = (root: HTMLElement): void => {
  const native = root.querySelector<HTMLInputElement>('[data-ui-date-picker-native]')
  const value = root.querySelector<HTMLElement>('[data-ui-date-picker-value]')

  if (!native || !value) return

  const defaultPlaceholder = root.dataset.chooseDateLabel || resolveLumenDateLabels(getCalendarLocale(root)).chooseDate
  const placeholder = root.dataset.placeholderDefault === 'true' ? defaultPlaceholder : native.getAttribute('placeholder') || defaultPlaceholder

  value.textContent = formatDatePickerValue(native.value, placeholder, getCalendarLocale(root))

  if (native.value) {
    delete root.dataset.placeholder
  } else {
    root.dataset.placeholder = 'true'
  }

  const trigger = root.querySelector<HTMLElement>('[data-ui-date-picker-trigger]')

  if (trigger) syncDatePickerValidity(native, trigger)
}

const syncDatePickerCalendar = (root: HTMLElement, calendar: HTMLElement | null, native: HTMLInputElement): void => {
  if (!calendar) return

  calendar.dataset.locale = getCalendarLocale(root)

  calendar.dataset.uiCalendarValue = native.value

  if (native.value) calendar.dataset.uiCalendarMonth = native.value.slice(0, 7)

  if (native.min) calendar.dataset.uiCalendarMin = native.min
  else delete calendar.dataset.uiCalendarMin

  if (native.max) calendar.dataset.uiCalendarMax = native.max
  else delete calendar.dataset.uiCalendarMax

  renderCalendar(calendar)
}

const canEditDate = (native: HTMLInputElement): boolean => !native.disabled && !native.readOnly &&
  isLumenDateBoundsValid(native.min || undefined, native.max || undefined)

const isDateInBounds = (native: HTMLInputElement, value: string): boolean => (
  Boolean(parseCalendarDate(value)) &&
  (!native.min || value >= native.min) &&
  (!native.max || value <= native.max)
)

const copyDatePickerLabels = (native: HTMLInputElement, trigger: HTMLButtonElement): void => {
  const accessibleName = native.getAttribute('aria-label')
  const labelledBy = native.getAttribute('aria-labelledby')
  const describedBy = native.getAttribute('aria-describedby')

  if (accessibleName) trigger.setAttribute('aria-label', accessibleName)

  if (labelledBy) trigger.setAttribute('aria-labelledby', labelledBy)

  if (describedBy) trigger.setAttribute('aria-describedby', describedBy)
}

const openDatePicker = (root: HTMLElement): void => {
  const native = root.querySelector<HTMLInputElement>('[data-ui-date-picker-native]')
  const trigger = root.querySelector<HTMLButtonElement>('[data-ui-date-picker-trigger]')
  const popover = root.querySelector<HTMLElement>('[data-ui-date-picker-popover]')
  const calendar = root.querySelector<HTMLElement>('[data-ui-calendar]')

  if (!native || !trigger || !popover || !canEditDate(native)) return

  for (const other of document.querySelectorAll<HTMLElement>('[data-ui-date-picker]')) {
    if (other !== root) closeDatePicker(other)
  }

  syncDatePickerCalendar(root, calendar, native)

  popover.hidden = false

  popover.dataset.state = 'open'

  datePickerPanels.get(root)?.()

  datePickerPanels.set(root, connectLumenFloatingPanel(popover, trigger, {
    onDismiss: () => {
      closeDatePicker(root)
    }
  }))

  trigger.setAttribute('aria-expanded', 'true')

  window.requestAnimationFrame(() => {
    if (popover.hidden || native.disabled || native.readOnly) return

    const focusTarget = calendar?.querySelector<HTMLElement>('[data-ui-calendar-day][tabindex="0"]') ??
      calendar?.querySelector<HTMLButtonElement>('button:not(:disabled)')

    focusTarget?.focus({ preventScroll: true })
  })
}

const bindDatePickers = (root: HTMLElement): void => {
  if (root.dataset.uiDatePickerBound === 'true' || isOwnedByAnotherAdapter(root)) return

  const native = root.querySelector<HTMLInputElement>('[data-ui-date-picker-native]')
  const control = root.querySelector<HTMLElement>('[data-ui-date-picker-control]')
  const trigger = root.querySelector<HTMLButtonElement>('[data-ui-date-picker-trigger]')
  const popover = root.querySelector<HTMLElement>('[data-ui-date-picker-popover]')
  const calendarInput = root.querySelector<HTMLInputElement>('[data-ui-calendar-input]')

  if (!native || !control || !trigger || !popover || !calendarInput) return

  root.dataset.uiDatePickerBound = 'true'

  native.dataset.uiEnhanced = 'true'

  native.setAttribute('aria-hidden', 'true')

  native.tabIndex = -1

  if (native.id) {
    const controlId = native.id

    native.id = `${controlId}-native`

    trigger.id = controlId
  }

  control.hidden = false

  copyDatePickerLabels(native, trigger)

  const syncState = (): void => {
    trigger.disabled = native.disabled

    trigger.setAttribute('aria-disabled', String(native.disabled || native.readOnly))

    trigger.setAttribute('aria-required', String(native.required))

    popover.setAttribute('aria-label', root.dataset.chooseDateLabel || resolveLumenDateLabels(getCalendarLocale(root)).chooseDate)

    syncDatePickerValue(root)
  }

  syncState()

  const observer = new MutationObserver(mutations => {
    if (mutations.some(mutation => !mutation.attributeName?.startsWith('aria-'))) closeDatePicker(root)

    syncState()
  })

  observer.observe(native, { attributes: true, attributeFilter: ['disabled', 'readonly', 'required', 'value', 'min', 'max', 'placeholder', 'aria-invalid', 'aria-errormessage', 'aria-describedby', 'aria-label', 'aria-labelledby'] })

  observer.observe(root, { attributes: true, attributeFilter: ['locale', 'lang', 'data-locale', 'data-choose-date-label'] })

  root.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.isComposing) return

    if (event.key !== 'Escape' || popover.hidden) return

    event.preventDefault()

    event.stopPropagation()

    closeDatePicker(root, true)
  })

  trigger.addEventListener('click', () => {
    if (popover.hidden) openDatePicker(root)
    else closeDatePicker(root)
  })

  trigger.addEventListener('keydown', event => {
    if (event.key !== 'ArrowDown') return

    event.preventDefault()

    openDatePicker(root)
  })

  calendarInput.addEventListener('change', () => {
    if (!canEditDate(native) || !isDateInBounds(native, calendarInput.value)) return

    native.value = calendarInput.value

    syncDatePickerValue(root)

    native.dispatchEvent(new Event('input', { bubbles: true }))

    native.dispatchEvent(new Event('change', { bubbles: true }))

    closeDatePicker(root, true)
  })

  native.addEventListener('change', () => {
    closeDatePicker(root)

    syncState()
  })

  native.addEventListener('invalid', event => {
    event.preventDefault()

    invalidDatePickerInputs.add(native)

    syncDatePickerValidity(native, trigger)

    trigger.focus()
  })

  native.form?.addEventListener('reset', event => {
    globalThis.setTimeout(() => {
      if (event.defaultPrevented || !root.isConnected) return

      invalidDatePickerInputs.delete(native)

      syncDatePickerValue(root)

      closeDatePicker(root)
    })
  })
}

export const initDatePickers = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-date-picker]')) bindDatePickers(root)
}
