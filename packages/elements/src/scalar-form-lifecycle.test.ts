// @vitest-environment jsdom
import { afterEach, beforeAll, expect, test } from 'vitest'

import { defineLumenElements } from './index.js'

const requireElement = <T extends Element>(element: T | null | undefined): T => {
  if (!element) throw new Error('Expected scalar form control')

  return element
}

beforeAll(() => {
  defineLumenElements()
})
afterEach(() => {
  document.body.replaceChildren()
})

test('reconnected scalar controls forward one host event and refresh validity', () => {
  document.body.innerHTML = '<form><lumen-input type="email" value="valid@example.com"></lumen-input></form>'
  const host = requireElement(document.querySelector('lumen-input'))
  const form = requireElement(document.querySelector('form'))
  const input = requireElement(host.querySelector('input'))
  const targets: (EventTarget | null)[] = []

  host.addEventListener('input', event => {
    targets.push(event.target)
  })
  host.remove()
  form.append(host)
  input.value = 'invalid'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  expect(targets).toEqual([host])
  expect(host.getAttribute('aria-invalid')).toBe('true')
  host.remove()
  form.append(host)
  input.value = 'restored@example.com'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  expect(targets).toEqual([host, host])
  expect(host.hasAttribute('aria-invalid')).toBe(false)
})

test('textarea relocation preserves the configured reset default and edited value', () => {
  document.body.innerHTML = '<form id="first"><lumen-textarea name="bio">Initial biography</lumen-textarea></form><form id="second"></form>'
  const host = requireElement(document.querySelector('lumen-textarea'))
  const input = requireElement(host.querySelector('textarea'))
  const form = requireElement(document.querySelector<HTMLFormElement>('#second'))

  input.value = 'Edited biography'
  form.append(host)
  expect(input.value).toBe('Edited biography')
  expect(Reflect.get(host, 'defaultValue')).toBe('Initial biography')
  form.reset()
  expect(input.value).toBe('Initial biography')
})

test('checkbox property changes preserve the configured checked default', () => {
  document.body.innerHTML = '<form><lumen-checkbox checked name="updates" value="yes"></lumen-checkbox></form>'
  const host = requireElement(document.querySelector('lumen-checkbox'))

  Reflect.set(host, 'checked', false)
  expect(Reflect.get(host, 'defaultChecked')).toBe(true)
  expect(Reflect.get(host, 'checked')).toBe(false)
  expect(host.hasAttribute('checked')).toBe(true)
})
