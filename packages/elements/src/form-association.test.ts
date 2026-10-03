import { afterEach, expect, test, vi } from 'vitest'

import { enhanceLumenForms } from './define.js'

afterEach(() => {
  document.body.replaceChildren()
})

test('validates required controls associated outside the form', () => {
  document.body.innerHTML = `<form id="external-form" data-ui-form></form>
    <input required name="email" form="external-form">
    <input required name="disabled" disabled form="external-form">`
  const form = document.querySelector('form')
  const input = document.querySelector('input')
  if (!form || !input) throw new Error('Expected form fixture')
  const valid = vi.fn()
  const invalid = vi.fn()
  form.addEventListener('ui:valid', valid)
  form.addEventListener('ui:invalid', invalid)
  enhanceLumenForms(document)
  expect(form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))).toBe(false)
  expect(invalid).toHaveBeenCalledOnce()
  expect(valid).not.toHaveBeenCalled()
  expect(input.getAttribute('aria-invalid')).toBe('true')
  input.value = 'valid'
  form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
  expect(valid).toHaveBeenCalledOnce()
})
