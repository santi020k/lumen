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

test('scalar controls forward dynamic accessibility and input attributes and clear removed host ids', () => {
  document.body.innerHTML = [
    '<lumen-input id="initial-email" type="file"></lumen-input>',
    '<lumen-textarea id="initial-bio"></lumen-textarea>',
    '<lumen-native-select id="initial-role"><option value="dev">Developer</option></lumen-native-select>',
    '<lumen-search-field id="initial-search"></lumen-search-field>'
  ].join('')

  const inputHost = requireElement(document.querySelector('lumen-input'))
  const inputControl = requireElement(inputHost.querySelector('input'))
  const textareaHost = requireElement(document.querySelector('lumen-textarea'))
  const textareaControl = requireElement(textareaHost.querySelector('textarea'))
  const selectHost = requireElement(document.querySelector('lumen-native-select'))
  const selectControl = requireElement(selectHost.querySelector('select'))
  const searchHost = requireElement(document.querySelector('lumen-search-field'))
  const searchControl = requireElement(searchHost.querySelector('input'))

  expect(inputControl.id).toBe('initial-email-control')

  inputHost.setAttribute('aria-describedby', 'email-error')
  inputHost.setAttribute('aria-label', 'Work email')
  inputHost.setAttribute('aria-labelledby', 'email-label')
  inputHost.setAttribute('accept', '.pdf,.png')
  inputHost.setAttribute('inputmode', 'email')
  inputHost.setAttribute('id', 'updated-email')
  inputHost.setAttribute('bins', '[]')
  inputHost.classList.add('custom-host-class')

  expect(inputControl.getAttribute('aria-describedby')).toBe('email-error')
  expect(inputControl.getAttribute('aria-label')).toBe('Work email')
  expect(inputControl.getAttribute('aria-labelledby')).toBe('email-label')
  expect(inputControl.getAttribute('accept')).toBe('.pdf,.png')
  expect(inputControl.getAttribute('inputmode')).toBe('email')
  expect(inputControl.id).toBe('updated-email-control')
  expect(inputControl.hasAttribute('bins')).toBe(false)

  inputHost.removeAttribute('aria-describedby')
  inputHost.removeAttribute('aria-label')
  inputHost.removeAttribute('aria-labelledby')
  inputHost.removeAttribute('accept')
  inputHost.removeAttribute('inputmode')
  inputHost.removeAttribute('id')

  expect(inputControl.hasAttribute('aria-describedby')).toBe(false)
  expect(inputControl.hasAttribute('aria-label')).toBe(false)
  expect(inputControl.hasAttribute('aria-labelledby')).toBe(false)
  expect(inputControl.hasAttribute('accept')).toBe(false)
  expect(inputControl.hasAttribute('inputmode')).toBe(false)
  expect(inputControl.hasAttribute('id')).toBe(false)

  textareaHost.setAttribute('aria-describedby', 'bio-hint')
  textareaHost.setAttribute('aria-label', 'Biography')
  textareaHost.removeAttribute('id')
  expect(textareaControl.getAttribute('aria-describedby')).toBe('bio-hint')
  expect(textareaControl.getAttribute('aria-label')).toBe('Biography')
  expect(textareaControl.hasAttribute('id')).toBe(false)

  selectHost.setAttribute('aria-labelledby', 'role-heading')
  selectHost.removeAttribute('id')
  expect(selectControl.getAttribute('aria-labelledby')).toBe('role-heading')
  expect(selectControl.hasAttribute('id')).toBe(false)

  searchHost.setAttribute('inputmode', 'search')
  searchHost.removeAttribute('id')
  expect(searchControl.getAttribute('inputmode')).toBe('search')
  expect(searchControl.hasAttribute('id')).toBe(false)
})
