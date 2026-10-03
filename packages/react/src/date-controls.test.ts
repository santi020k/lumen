// @vitest-environment jsdom
// cspell:words anterior siguiente
import type { ReactNode, SyntheticEvent } from 'react'
import { act, createElement } from 'react'
import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'

import { isLumenDateRangeValid as isCalendarRangeValid, parseLumenDate as parseCalendarDate } from '@santi020k/lumen-core'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { Calendar, DatePicker } from './components.js'
import { DateRangeCalendar } from './date-range-calendar.js'
import { DateRangeInput } from './date-range-input.js'

let container: HTMLDivElement
let root: Root

const run = async (action: () => void) => {
  await act(async () => {
    await Promise.resolve()
    action()
    await new Promise(resolve => setTimeout(resolve, 0))
  })
}

beforeEach(() => {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('ResizeObserver', class {
    observe() { /* Layout is covered by browser tests. */ }
    disconnect() { /* No observer resource is held in jsdom. */ }
  })
})

afterEach(async () => {
  await run(() => {
    root.unmount()
  })
  container.remove()
  vi.unstubAllGlobals()
})

const render = async (content: ReactNode) => {
  await run(() => {
    root.render(content)
  })
}

const element = (selector: string): HTMLElement => {
  const result = container.querySelector<HTMLElement>(selector)

  if (!result) throw new Error(`Missing test element: ${selector}`)

  return result
}

const button = (selector: string): HTMLButtonElement => {
  const result = element(selector)

  if (!(result instanceof HTMLButtonElement)) throw new Error(`Expected button: ${selector}`)

  return result
}

const form = (): HTMLFormElement => {
  const result = element('form')

  if (!(result instanceof HTMLFormElement)) throw new Error('Expected form')

  return result
}

const click = async (selector: string) => {
  await run(() => {
    element(selector).click()
  })
}

const key = async (selector: string, value: string) => {
  await run(() => {
    element(selector).dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true }))
  })
}

const rangeLabels = { start: 'From', end: 'To', presets: 'Ranges', apply: 'Apply', cancel: 'Cancel', invalidRange: 'Invalid period' }
const rangeValue = { start: '2026-09-01', end: '2026-09-30' }

test.each(['2026-02-30', '2026-13-01', '2026-00-01', '2026-9-01', '0000-01-01', 'not-a-date', ''])('rejects malformed date %s', value => {
  expect(parseCalendarDate(value)).toBeNull()
  expect(isCalendarRangeValid({ start: value, end: '2026-12-31' })).toBe(false)
})

test('accepts leap days and validates both endpoints and the bounds themselves', () => {
  expect(parseCalendarDate('2024-02-29')?.toISOString()).toBe('2024-02-29T00:00:00.000Z')
  expect(parseCalendarDate('2025-02-29')).toBeNull()
  expect(isCalendarRangeValid(rangeValue, '2026-09-01', '2026-09-30')).toBe(true)
  expect(isCalendarRangeValid(rangeValue, '2026-09-02')).toBe(false)
  expect(isCalendarRangeValid(rangeValue, undefined, '2026-09-29')).toBe(false)
  expect(isCalendarRangeValid(rangeValue, 'invalid')).toBe(false)
  expect(isCalendarRangeValid(rangeValue, '2026-10-01', '2026-08-01')).toBe(false)
})

test('localizes calendar navigation, preserves explicit copy and blocks read-only selection', async () => {
  const change = vi.fn()

  await render(createElement(Calendar, { value: '2026-09-10', locale: 'es-CO', onValueChange: change, readOnly: true }))
  expect(element('[data-ui-calendar-prev]').getAttribute('aria-label')).toBe('Mes anterior')
  expect(element('[data-ui-calendar-next]').getAttribute('aria-label')).toBe('Mes siguiente')
  expect(element('[role="grid"]').getAttribute('aria-readonly')).toBe('true')
  await click('[data-date="2026-09-11"]')
  await key('[data-date="2026-09-11"]', 'Enter')
  expect(change).not.toHaveBeenCalled()
  await render(createElement(Calendar, { locale: 'fr', labels: { previousMonth: 'Earlier', nextMonth: 'Later' } }))
  expect(element('[data-ui-calendar-prev]').getAttribute('aria-label')).toBe('Earlier')
})

test('calendar keyboard focus follows the day across month boundaries', async () => {
  await render(createElement(Calendar, { value: '2026-09-30', locale: 'en' }))
  element('[data-date="2026-09-30"]').focus()
  await key('[data-date="2026-09-30"]', 'ArrowRight')
  expect(document.activeElement?.getAttribute('data-date')).toBe('2026-10-01')
  expect(element('[data-ui-calendar-label]').textContent).toBe('October 2026')
})

test('calendar retains early ISO years and disables navigation beyond supported date bounds', async () => {
  await render(createElement(Calendar, { value: '0001-01-15' }))
  expect(element('[data-ui-calendar-label]').textContent).toContain('1')
  expect(element('[data-date="0001-01-15"]').getAttribute('aria-selected')).toBe('true')
  expect(button('[data-ui-calendar-prev]').disabled).toBe(true)
  await render(createElement(Calendar, { key: 'last-year', value: '9999-12-15' }))
  expect(button('[data-ui-calendar-next]').disabled).toBe(true)
})

test('range calendar disables invalid presets and recovers invalid external endpoints through selection', async () => {
  const change = vi.fn()
  const formatDate = vi.fn((date: string) => new Date(date).toISOString().slice(0, 10))

  await render(createElement(DateRangeCalendar, {
    value: { start: 'invalid', end: '2026-09-10' },
    onValueChange: change,
    formatDate,
    labels: rangeLabels,
    min: '2026-01-01',
    max: '2026-12-31',
    presets: [
      { label: 'Impossible', value: { start: '2026-02-30', end: '2026-03-01' } },
      { label: 'Reversed', value: { start: '2026-10-02', end: '2026-10-01' } },
      { label: 'Outside', value: { start: '2025-12-31', end: '2026-01-01' } },
      { label: 'Valid', value: rangeValue }
    ]
  }))
  expect([...container.querySelectorAll<HTMLButtonElement>('nav button')].map(button => button.disabled)).toEqual([true, true, true, false])
  await click('section:last-child [data-date="2026-09-11"]')
  expect(change).toHaveBeenLastCalledWith({ start: '2026-09-11', end: '2026-09-11' })
  expect(formatDate).not.toHaveBeenCalledWith('invalid')
})

test.each([
  { value: { start: '2026-02-30', end: '2026-03-01' } },
  { value: { start: '2026-10-01', end: '2026-09-01' } },
  { value: rangeValue, min: '2026-09-02' },
  { value: rangeValue, max: '2026-09-29' },
  { value: rangeValue, min: 'invalid' }
])('blocks invalid range Apply even without a custom validator: %j', async props => {
  const change = vi.fn()

  await render(createElement(DateRangeInput, { ...props, label: 'Period', labels: rangeLabels, onValueChange: change }))
  await click('[aria-haspopup="dialog"]')
  expect(button('.ui-range-input__actions button:last-child').disabled).toBe(true)
  expect(element('[aria-live="polite"]').textContent).toBe('Invalid period')
  await click('.ui-range-input__actions button:last-child')
  expect(change).not.toHaveBeenCalled()
})

test('discarded range drafts cannot reopen after disabling, read-only changes or external value updates', async () => {
  const change = vi.fn()
  const props = { value: rangeValue, label: 'Period', labels: rangeLabels, onValueChange: change }

  await render(createElement(DateRangeInput, props))
  await click('[aria-haspopup="dialog"]')
  await click('section:first-child [data-date="2026-09-02"]')
  await render(createElement(DateRangeInput, { ...props, disabled: true }))
  expect(button('[aria-haspopup="dialog"]').disabled).toBe(true)
  await render(createElement(DateRangeInput, props))
  expect(element('[aria-haspopup="dialog"]').getAttribute('aria-expanded')).toBe('false')
  await click('[aria-haspopup="dialog"]')
  expect(element('.ui-range-calendar__endpoint strong').textContent).toBe('2026-09-01')
  await render(createElement(DateRangeInput, { ...props, readOnly: true }))
  await click('[aria-haspopup="dialog"]')
  await key('[aria-haspopup="dialog"]', 'ArrowDown')
  expect(element('[aria-haspopup="dialog"]').getAttribute('aria-expanded')).toBe('false')
  await render(createElement(DateRangeInput, props))
  await click('[aria-haspopup="dialog"]')
  await render(createElement(DateRangeInput, { ...props, value: { start: '2026-10-01', end: '2026-10-31' } }))
  expect(element('[aria-haspopup="dialog"]').getAttribute('aria-expanded')).toBe('false')
  expect(change).not.toHaveBeenCalled()
})

test('range form fields contain applied values, exclude disabled values and discard draft on reset', async () => {
  const props = { value: rangeValue, name: { start: 'from', end: 'to' }, label: 'Period', labels: rangeLabels, onValueChange: vi.fn() }

  await render(createElement('form', null, createElement(DateRangeInput, props)))
  await click('[aria-haspopup="dialog"]')
  await click('section:first-child [data-date="2026-09-02"]')
  expect(new FormData(form()).get('from')).toBe('2026-09-01')
  await run(() => {
    form().reset()
  })
  expect(element('[aria-haspopup="dialog"]').getAttribute('aria-expanded')).toBe('false')
  await render(createElement('form', null, createElement(DateRangeInput, { ...props, disabled: true })))
  expect([...new FormData(form()).keys()]).toEqual([])
})

test('DatePicker honors read-only values and preserves native form reset and localization', async () => {
  const change = vi.fn()
  const props = { defaultValue: '2026-09-10', name: 'date', locale: 'es-CO', onValueChange: change }

  await render(createElement('form', null, createElement(DatePicker, { ...props, readOnly: true })))
  await click('[data-ui-date-picker-trigger]')
  await key('[data-ui-date-picker-trigger]', 'ArrowDown')
  await click('[data-date="2026-09-11"]')
  expect(change).not.toHaveBeenCalled()
  expect(element('[data-ui-date-picker-trigger]').getAttribute('aria-expanded')).toBe('false')
  expect(new FormData(form()).get('date')).toBe('2026-09-10')
  await render(createElement('form', null, createElement(DatePicker, props)))
  await click('[data-ui-date-picker-trigger]')
  expect(element('[data-ui-calendar-prev]').getAttribute('aria-label')).toBe('Mes anterior')
  await click('[data-date="2026-09-11"]')
  expect(new FormData(form()).get('date')).toBe('2026-09-11')
  await run(() => {
    form().reset()
  })
  expect(new FormData(form()).get('date')).toBe('2026-09-10')
})

test('DatePicker respects a cancelled React reset and keeps controlled values on accepted reset', async () => {
  const onReset = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  await render(createElement('form', { onReset }, createElement(DatePicker, { defaultValue: '2026-09-10', name: 'date' })))
  await click('[data-ui-date-picker-trigger]')
  await click('[data-date="2026-09-11"]')
  await click('[data-ui-date-picker-trigger]')
  await run(() => {
    form().reset()
  })
  expect(new FormData(form()).get('date')).toBe('2026-09-11')
  expect(element('[data-ui-date-picker-trigger]').getAttribute('aria-expanded')).toBe('true')
  await render(createElement('form', null, createElement(DatePicker, { value: '2026-09-12', defaultValue: '2026-09-10', name: 'date' })))
  await run(() => {
    form().reset()
  })
  expect(new FormData(form()).get('date')).toBe('2026-09-12')
  expect(element('[data-ui-date-picker-trigger]').getAttribute('aria-expanded')).toBe('false')
})

test('range reset cancellation keeps the active draft and applied submitted values', async () => {
  const onReset = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
  }
  const props = { value: rangeValue, name: { start: 'from', end: 'to' }, label: 'Period', labels: rangeLabels, onValueChange: vi.fn() }

  await render(createElement('form', { onReset }, createElement(DateRangeInput, props)))
  await click('[aria-haspopup="dialog"]')
  await click('section:first-child [data-date="2026-09-02"]')
  await run(() => {
    form().reset()
  })
  expect(element('[aria-haspopup="dialog"]').getAttribute('aria-expanded')).toBe('true')
  expect(element('.ui-range-calendar__endpoint strong').textContent).toBe('2026-09-02')
  expect(new FormData(form()).get('from')).toBe('2026-09-01')
})

test('range draft closes on native form reset even without name form fields', async () => {
  const props = { value: rangeValue, label: 'Period', labels: rangeLabels, onValueChange: vi.fn<NonNullable<Parameters<typeof DateRangeInput>[0]['onValueChange']>>() }

  await render(createElement('form', null, createElement(DateRangeInput, props)))
  await click('[aria-haspopup="dialog"]')
  await click('section:first-child [data-date="2026-09-02"]')
  expect(element('[aria-haspopup="dialog"]').getAttribute('aria-expanded')).toBe('true')
  await run(() => {
    form().reset()
  })
  expect(element('[aria-haspopup="dialog"]').getAttribute('aria-expanded')).toBe('false')
})

test('range draft closes on reset of an explicitly associated external form', async () => {
  const props = { value: rangeValue, label: 'Period', labels: rangeLabels, onValueChange: vi.fn<NonNullable<Parameters<typeof DateRangeInput>[0]['onValueChange']>>(), form: 'external-range-form' }

  await render(createElement('div', null, createElement('form', { id: 'external-range-form' }), createElement(DateRangeInput, props)))
  await click('[aria-haspopup="dialog"]')
  await click('section:first-child [data-date="2026-09-02"]')
  expect(element('[aria-haspopup="dialog"]').getAttribute('aria-expanded')).toBe('true')
  await run(() => {
    form().reset()
  })
  expect(element('[aria-haspopup="dialog"]').getAttribute('aria-expanded')).toBe('false')
})

test('calendar resets uncontrolled selection only after a non-cancelled form reset', async () => {
  const onReset = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
  }
  const props = { defaultValue: '2026-09-10', name: 'date' }

  await render(createElement('form', { onReset }, createElement(Calendar, props)))
  await click('[data-date="2026-09-11"]')
  await run(() => {
    form().reset()
  })
  expect(new FormData(form()).get('date')).toBe('2026-09-11')
  await render(createElement('form', null, createElement(Calendar, props)))
  await run(() => {
    form().reset()
  })
  expect(new FormData(form()).get('date')).toBe('2026-09-10')
})

test('DatePicker calendar selection fires the native onChange exactly once and keeps form data in sync', async () => {
  const change = vi.fn<NonNullable<Parameters<typeof DatePicker>[0]['onChange']>>()
  const valueChange = vi.fn<NonNullable<Parameters<typeof DatePicker>[0]['onValueChange']>>()

  await render(createElement(DatePicker, { defaultValue: '2026-09-10', onChange: change, onValueChange: valueChange }))
  await click('[data-ui-date-picker-trigger]')
  await click('[data-date="2026-09-11"]')
  expect(change).toHaveBeenCalledTimes(1)
  expect(valueChange).toHaveBeenCalledTimes(1)
  expect(valueChange).toHaveBeenCalledWith('2026-09-11')
  const nativeInput = element('[data-ui-date-picker-native]')

  if (!(nativeInput instanceof HTMLInputElement)) throw new Error('Expected native date input')
  expect(nativeInput.value).toBe('2026-09-11')
})

test('DatePicker closes an active calendar on disable and consumes Escape before a containing dialog', async () => {
  const parentKey = vi.fn()
  const props = { id: 'date-field', defaultValue: '2026-09-10' }
  const picker = (disabled: boolean) => createElement('div', { onKeyDown: parentKey }, createElement('label', { htmlFor: 'date-field' }, 'Start date'), createElement(DatePicker, { ...props, disabled }))

  await render(picker(false))
  expect(button('#date-field').hasAttribute('data-ui-date-picker-trigger')).toBe(true)
  await click('#date-field')
  expect(document.activeElement?.getAttribute('data-date')).toBe('2026-09-10')
  await key('[data-date="2026-09-10"]', 'Escape')
  expect(parentKey).not.toHaveBeenCalled()
  expect(document.activeElement).toBe(button('#date-field'))
  await click('#date-field')
  await render(picker(true))
  await render(picker(false))
  expect(button('#date-field').getAttribute('aria-expanded')).toBe('false')
})

test('DatePicker does not normalize impossible dates or call a formatter with invalid input', async () => {
  const formatDate = vi.fn((date: string) => new Date(date).toISOString())

  await render(createElement(DatePicker, { value: '2026-02-30', formatDate, placeholder: 'Select date' }))
  expect(element('[data-ui-date-picker-value]').textContent).toBe('Select date')
  expect(formatDate).not.toHaveBeenCalled()
})
