// cspell:words Elegir fecha enero
import { afterEach, expect, test } from 'vitest'

import { enhanceLumenCalendars, enhanceLumenDatePickers } from './define.js'

afterEach(() => {
  document.body.replaceChildren()
})

const node = (selector: string): HTMLElement => {
  const result = document.querySelector<HTMLElement>(selector)

  if (!result) throw new Error(`Missing ${selector}`)

  return result
}

const input = (selector: string): HTMLInputElement => {
  const result = node(selector)

  if (!(result instanceof HTMLInputElement)) throw new Error('Expected input')

  return result
}

const tick = async (): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 0))
}

const picker = (attributes = ''): void => {
  document.body.innerHTML = `<form><label for="date">Appointment</label><lumen-date-picker locale="es-CO" ${attributes}>
    <input id="date" type="date" name="appointment" value="2026-07-23" data-ui-date-picker-native>
    <div data-ui-date-picker-control hidden><button data-ui-date-picker-trigger><span data-ui-date-picker-value></span></button></div>
    <div data-ui-date-picker-popover hidden><lumen-calendar></lumen-calendar></div>
  </lumen-date-picker></form>`
  enhanceLumenDatePickers(document)
}

test('calendar localizes labels, preserves early years and blocks unsupported year navigation', () => {
  document.body.innerHTML = '<lumen-calendar locale="es" month="0001-01" value="0001-01-03" data-next-month-label="Forward"></lumen-calendar>'
  enhanceLumenCalendars(document)
  expect(node('[data-ui-calendar-label]').textContent).toContain('enero')
  expect(node('[data-ui-calendar-prev]').getAttribute('aria-label')).toBe('Mes anterior')
  expect(node('[data-ui-calendar-prev]').hasAttribute('disabled')).toBe(true)
  expect(node('[data-ui-calendar-next]').getAttribute('aria-label')).toBe('Forward')
  expect(node('[data-date="0001-01-03"]').getAttribute('aria-selected')).toBe('true')
})

test('calendar readonly prevents changes and dynamic disabled/bounds remove selectable days', async () => {
  document.body.innerHTML = '<lumen-calendar locale="en" readonly month="2026-07" value="2026-07-03"></lumen-calendar>'
  enhanceLumenCalendars(document)
  node('[data-date="2026-07-04"]').click()
  expect(input('[data-ui-calendar-input]').value).toBe('2026-07-03')
  node('lumen-calendar').removeAttribute('readonly')
  await tick()
  node('[data-date="2026-07-04"]').click()
  expect(input('[data-ui-calendar-input]').value).toBe('2026-07-04')
  node('lumen-calendar').setAttribute('disabled', '')
  await tick()
  expect(input('[data-ui-calendar-input]').disabled).toBe(true)
  expect(document.querySelector('[data-ui-calendar-day][tabindex="0"]')).toBeNull()
  node('lumen-calendar').removeAttribute('disabled')
  node('lumen-calendar').setAttribute('min', '2026-02-30')
  await tick()
  expect(input('[data-ui-calendar-input]').disabled).toBe(true)
})

test('calendar keyboard crosses months and form reset restores its initial submitted value', async () => {
  document.body.innerHTML = '<form><lumen-calendar month="2026-07" value="2026-07-31" name="date"></lumen-calendar></form>'
  enhanceLumenCalendars(document)
  const day = node('[data-date="2026-07-31"]')

  day.focus()
  day.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
  expect(document.activeElement).toBe(node('[data-date="2026-08-01"]'))
  node('[data-date="2026-08-01"]').click()
  expect(input('[data-ui-calendar-input]').value).toBe('2026-08-01')
  const form = node('form')

  if (!(form instanceof HTMLFormElement)) throw new Error('Expected form')

  form.addEventListener('reset', event => {
    event.preventDefault()
  }, { once: true })
  form.reset()
  await tick()
  expect(input('[data-ui-calendar-input]').value).toBe('2026-08-01')
  form.reset()
  await tick()
  expect(new FormData(form).get('date')).toBe('2026-07-31')
})

test('picker links labels to the visible control and localizes date, calendar and dialog', async () => {
  picker()
  expect(node('#date').tagName).toBe('BUTTON')
  expect(node('[data-ui-date-picker-value]').textContent).toContain('jul')
  node('#date').click()
  await tick()
  expect(node('[data-ui-date-picker-popover]').getAttribute('aria-label')).toBe('Elegir fecha')
  expect(node('[data-ui-calendar-label]').textContent).toContain('julio')
  expect(document.activeElement).toBe(node('[data-date="2026-07-23"]'))
  node('[data-date="2026-07-23"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  expect(node('[data-ui-date-picker-popover]').hidden).toBe(true)
  expect(document.activeElement).toBe(node('#date'))
})

test.each(['2026-07-12', '', 'invalid'])('calendar resets to its latest configured value: %s', async value => {
  document.body.innerHTML = '<form><lumen-calendar month="2026-07" value="2026-07-03" name="date"></lumen-calendar></form>'
  enhanceLumenCalendars(document)
  node('lumen-calendar').setAttribute('value', value)
  await tick()
  node('[data-date="2026-07-15"]').click()
  expect(input('[data-ui-calendar-input]').value).toBe('2026-07-15')
  const form = node('form')
  if (!(form instanceof HTMLFormElement)) throw new Error('Expected form')
  form.reset()
  await tick()
  const expected = value === 'invalid' ? '' : value
  expect(new FormData(form).get('date')).toBe(expected)
  expect(document.querySelector('[data-ui-calendar-day][aria-selected="true"]')?.getAttribute('data-date') ?? '').toBe(expected)
})

test('picker cannot open or mutate readonly values and closes after becoming disabled', async () => {
  picker('readonly')
  node('#date').click()
  expect(node('[data-ui-date-picker-popover]').hidden).toBe(true)
  const root = node('lumen-date-picker')

  root.removeAttribute('readonly')
  await tick()
  node('#date').click()
  await tick()
  root.setAttribute('disabled', '')
  await tick()
  expect(node('[data-ui-date-picker-popover]').hidden).toBe(true)
  expect(node('#date').hasAttribute('disabled')).toBe(true)
  const calendarInput = input('[data-ui-calendar-input]')

  calendarInput.value = '2026-07-25'
  calendarInput.dispatchEvent(new Event('change', { bubbles: true }))
  expect(input('[data-ui-date-picker-native]').value).toBe('2026-07-23')
  const form = node('form')

  if (!(form instanceof HTMLFormElement)) throw new Error('Expected form')

  expect(new FormData(form).has('appointment')).toBe(false)
  root.removeAttribute('disabled')
  await tick()
  expect(node('#date').hasAttribute('disabled')).toBe(false)
})

test('picker applies valid bounded selections, dispatches both native events, and resets', async () => {
  picker()
  const native = input('[data-ui-date-picker-native]')
  let inputEvents = 0

  native.min = '2026-07-20'
  native.max = '2026-07-25'
  native.addEventListener('input', () => {
    inputEvents += 1
  })
  await tick()
  node('#date').click()
  await tick()
  node('[data-date="2026-07-24"]').click()
  expect(native.value).toBe('2026-07-24')
  expect(inputEvents).toBe(1)
  expect(document.activeElement).toBe(node('#date'))
  const form = node('form')

  if (!(form instanceof HTMLFormElement)) throw new Error('Expected form')

  form.addEventListener('reset', event => {
    event.preventDefault()
  }, { once: true })
  form.reset()
  await tick()
  expect(native.value).toBe('2026-07-24')
  form.reset()
  await tick()
  expect(native.value).toBe('2026-07-23')
  expect(node('[data-ui-date-picker-value]').textContent).toContain('23')
})
