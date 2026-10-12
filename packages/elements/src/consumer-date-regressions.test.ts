// @vitest-environment jsdom
import { afterEach, expect, test } from 'vitest'

import { enhanceLumenDatePickers } from './define.js'

const picker = (attributes: Record<string, string> = {}) => {
  document.body.innerHTML = `<form><lumen-date-picker>
    <input type="date" value="2026-07-23" data-ui-date-picker-native>
    <div data-ui-date-picker-control hidden><button data-ui-date-picker-trigger><span data-ui-date-picker-value></span></button></div>
    <div data-ui-date-picker-popover hidden><lumen-calendar></lumen-calendar></div>
  </lumen-date-picker></form>`
  const native = document.querySelector('input')
  const trigger = document.querySelector('button')
  const form = document.querySelector('form')

  if (!native || !trigger || !form) throw new Error('Missing DatePicker fixture')

  for (const [name, value] of Object.entries(attributes)) native.setAttribute(name, value)

  enhanceLumenDatePickers(document)

  return { form, native, trigger }
}

const tick = async () => {
  await new Promise(resolve => setTimeout(resolve, 0))
}

afterEach(() => {
  document.body.replaceChildren()
})

test.each(['true', 'false', 'grammar', 'spelling'])('DatePicker retains consumer invalid state %s through changes and reset', async invalid => {
  const { form, native, trigger } = picker({ 'aria-invalid': invalid, 'aria-errormessage': 'date-error' })

  expect(trigger.getAttribute('aria-invalid')).toBe(invalid)
  expect(trigger.getAttribute('aria-errormessage')).toBe('date-error')
  native.dispatchEvent(new Event('change', { bubbles: true }))
  form.reset()
  await tick()
  expect(trigger.getAttribute('aria-invalid')).toBe(invalid)

  native.setAttribute('aria-describedby', 'date-description')
  native.setAttribute('aria-errormessage', 'updated-error')
  await tick()
  expect(trigger.getAttribute('aria-describedby')).toBe('date-description')
  expect(trigger.getAttribute('aria-errormessage')).toBe('updated-error')

  native.removeAttribute('aria-invalid')
  native.removeAttribute('aria-errormessage')
  await tick()
  expect(trigger.hasAttribute('aria-invalid')).toBe(false)
  expect(trigger.hasAttribute('aria-errormessage')).toBe(false)
})

test('DatePicker clears generated errors after valid changes and reset while preserving application errors', async () => {
  const { form, native, trigger } = picker({ required: '' })

  native.value = ''
  expect(native.checkValidity()).toBe(false)
  expect(trigger.getAttribute('aria-invalid')).toBe('true')
  native.value = '2026-07-24'
  native.dispatchEvent(new Event('change', { bubbles: true }))
  expect(trigger.hasAttribute('aria-invalid')).toBe(false)

  native.value = ''
  expect(native.checkValidity()).toBe(false)
  form.reset()
  await tick()
  expect(trigger.hasAttribute('aria-invalid')).toBe(false)

  native.setAttribute('aria-invalid', 'grammar')
  native.required = false
  await tick()
  expect(trigger.getAttribute('aria-invalid')).toBe('grammar')
})
