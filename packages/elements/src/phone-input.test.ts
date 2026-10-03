import { afterEach, expect, test } from 'vitest'

import { defineLumenElements } from './define.js'

defineLumenElements(['PhoneInput'])
afterEach(() => {
  document.body.replaceChildren()
})

const mount = () => {
  const host = document.createElement('lumen-phone-input')
  host.setAttribute('country', 'CO')
  host.setAttribute('input-id', 'contact-number')
  document.body.append(host)
  const input = host.querySelector('input')
  const select = host.querySelector('select')
  if (!input || !select) throw new Error('Missing phone controls')
  return { host, input, select }
}

test('locks both generated controls when disabled or read-only changes', () => {
  const { host, input, select } = mount()
  expect(input.id).toBe('contact-number')
  host.setAttribute('readonly', '')
  expect(select.disabled).toBe(true)
  expect(input.readOnly).toBe(true)
  host.removeAttribute('readonly')
  expect(select.disabled).toBe(false)
  host.setAttribute('disabled', '')
  expect(input.disabled).toBe(true)
  expect(select.disabled).toBe(true)
})

test('synchronizes pasted numbers, flags, and visible accessible validation', () => {
  const { host, input, select } = mount()
  input.value = '3'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  expect(input.validity.customError).toBe(true)
  const error = host.querySelector<HTMLElement>('[role="alert"]')
  expect(error?.hidden).toBe(false)
  expect(error?.id).toBe(input.getAttribute('aria-errormessage'))
  input.value = '+1 212 555 0123'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  expect(select.value).toBe('US')
  expect(host.querySelector('[data-ui-phone-code]')?.textContent).toBe('+1')
  expect(error?.hidden).toBe(true)
  expect(input.validity.customError).toBe(false)
  expect(host.dataset.e164).toBe('+12125550123')
})

test('preserves the initial country on native form reset', async () => {
  const form = document.createElement('form')
  document.body.append(form)
  const { host, input, select } = mount()
  form.append(host)
  input.value = '+1 212 555 0123'
  input.dispatchEvent(new Event('input'))
  form.reset()
  await Promise.resolve()
  expect(select.value).toBe('CO')
  expect(host.querySelector('[data-ui-phone-code]')?.textContent).toBe('+57')
})

test('registers reusable flag and phone number views with the phone family', () => {
  expect(customElements.get('lumen-country-flag')).toBeDefined()
  const number = document.createElement('lumen-phone-number')
  number.setAttribute('country', 'CO')
  number.setAttribute('value', '+576015550123')
  number.setAttribute('link', '')
  document.body.append(number)
  expect(number.querySelector('a')?.href).toBe('tel:+576015550123')
  expect(number.querySelector('img')?.src).toMatch(/^data:image\/png;base64,/)
  number.setAttribute('value', '3')
  expect(number.querySelector('a')).toBeNull()
})
