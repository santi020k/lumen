// @vitest-environment jsdom
import { afterEach, expect, test } from 'vitest'

import { initMentions } from './runtime/features/mentions.js'

afterEach(() => {
  document.body.replaceChildren()
})

const fixture = () => {
  document.body.innerHTML = '<div data-ui-mentions><textarea data-ui-mentions-input></textarea><div data-ui-mentions-list hidden><button id="native" data-ui-mentions-option data-value="alice" disabled>Alice</button><div inert><button data-ui-mentions-option data-value="alex">Alex</button></div><button id="locked" data-ui-mentions-option data-value="amy" aria-disabled="true">Amy</button><button id="enabled" data-ui-mentions-option data-value="anna">Anna</button></div></div>'
  initMentions(document)
  const input = document.querySelector('textarea')
  const locked = document.querySelector<HTMLButtonElement>('#locked')
  const enabled = document.querySelector<HTMLButtonElement>('#enabled')
  if (!input || !locked || !enabled) throw new Error('Missing mentions fixture')
  input.value = '@a'
  input.setSelectionRange(2, 2)
  input.dispatchEvent(new Event('input', { bubbles: true }))
  return { input, locked, enabled }
}

const press = (input: HTMLTextAreaElement, key: string, options: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options })
  input.dispatchEvent(event)
  return event
}

test('mentions skips native disabled options and prevents ARIA-disabled insertion', () => {
  const { input, locked, enabled } = fixture()
  expect(input.getAttribute('aria-activedescendant')).toBe(locked.id)
  press(input, 'Enter')
  expect(input.value).toBe('@a')
  locked.click()
  expect(input.value).toBe('@a')
  press(input, 'ArrowDown')
  expect(input.getAttribute('aria-activedescendant')).toBe(enabled.id)
  press(input, 'Enter')
  expect(input.value).toBe('@anna ')
})

test('mentions rejects options disabled after becoming active and canceled pointer activation', () => {
  const { input, enabled } = fixture()
  press(input, 'ArrowDown')
  enabled.setAttribute('aria-disabled', 'true')
  press(input, 'Enter')
  expect(input.value).toBe('@a')
  enabled.removeAttribute('aria-disabled')
  enabled.addEventListener('click', event => {
    event.preventDefault()
  }, { capture: true })
  enabled.click()
  expect(input.value).toBe('@a')
})

test('mentions leaves modified navigation and closed-list keyboard input alone', () => {
  const { input } = fixture()
  expect(press(input, 'ArrowDown', { ctrlKey: true }).defaultPrevented).toBe(false)
  press(input, 'Escape')
  expect(press(input, 'ArrowDown').defaultPrevented).toBe(false)
})

test('mentions does not substitute another option when the active option becomes natively disabled', () => {
  const { input, locked } = fixture()
  locked.removeAttribute('aria-disabled')
  locked.disabled = true
  press(input, 'Enter')
  expect(input.value).toBe('@a')
})
