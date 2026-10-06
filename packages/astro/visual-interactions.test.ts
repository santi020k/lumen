// @vitest-environment jsdom
import { afterEach, expect, test } from 'vitest'

import { clearVisualInteractionControllers, initVisualInteractionControllers } from './runtime/controllers/visual-interactions.js'

afterEach(() => {
  clearVisualInteractionControllers()
  document.body.replaceChildren()
})

test('Astro initialization is idempotent and view swaps remove approval listeners', () => {
  document.body.innerHTML = '<div data-ui-approval-card data-request-id="one" data-status="pending"><button data-ui-approval-response="approve">Approve</button></div>'
  const root = document.querySelector<HTMLElement>('[data-ui-approval-card]')
  const button = document.querySelector('button')
  if (!root || !button) throw new Error('Expected approval fixture')
  let count = 0
  root.addEventListener('ui:approval-response', () => {
    count++
  })
  initVisualInteractionControllers(document)
  initVisualInteractionControllers(document)
  button.click()
  expect(count).toBe(1)
  document.dispatchEvent(new Event('astro:before-swap'))
  button.click()
  expect(count).toBe(1)
  initVisualInteractionControllers(document)
  button.click()
  expect(count).toBe(2)
})

test('detached Astro roots are cleaned before new controllers bind', () => {
  document.body.innerHTML = '<form data-ui-prompt-composer><textarea data-ui-prompt-input>Hello</textarea><button data-ui-prompt-send>Send</button></form>'
  const form = document.querySelector('form')
  if (!form) throw new Error('Expected prompt form')
  initVisualInteractionControllers(document)
  form.remove()
  initVisualInteractionControllers(document)
  const submit = new Event('submit', { cancelable: true })
  form.dispatchEvent(submit)
  expect(submit.defaultPrevented).toBe(false)
})
