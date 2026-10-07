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

test('error summary focuses external controls owned by the form and ignores other forms', () => {
  document.body.innerHTML = `<form id="owner" data-ui-form><div data-ui-error-summary>
    <a href="#owned">Email</a><a href="#other">Other form</a></div></form>
    <input id="owned" required form="owner"><form id="second"></form><input id="other" form="second">`
  const owned = document.querySelector<HTMLInputElement>('#owned')
  const links = document.querySelectorAll<HTMLAnchorElement>('a')
  if (!owned || !links[0] || !links[1]) throw new Error('Expected external control fixture')
  const scroll = vi.fn()
  owned.scrollIntoView = scroll
  enhanceLumenForms(document)
  const ownedClick = new MouseEvent('click', { bubbles: true, cancelable: true })
  links[0].dispatchEvent(ownedClick)
  expect(ownedClick.defaultPrevented).toBe(true)
  expect(document.activeElement).toBe(owned)
  expect(scroll).toHaveBeenCalledOnce()
  const otherClick = new MouseEvent('click', { bubbles: true, cancelable: true })
  links[1].dispatchEvent(otherClick)
  expect(otherClick.defaultPrevented).toBe(false)
  expect(document.activeElement).toBe(owned)
})
