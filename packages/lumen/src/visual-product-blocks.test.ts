// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { bindOnboardingBlock, mountProductBlocks } from '../templates/shared/visual-blocks/src/lumen/product-blocks.js'

const required = <T extends Element>(value: T | null): T => {
  if (!value) throw new Error('Expected recipe control')
  return value
}

afterEach(() => {
  document.body.replaceChildren()
})

test('pricing mount is idempotent, switches amounts, emits a selection, and releases listeners', () => {
  document.body.innerHTML = '<section data-product-block="pricing"><button data-billing="annual">Annual</button><p data-monthly="10" data-annual="96">$10 / month</p><button data-plan="starter">Choose starter</button><p data-block-status></p></section>'
  const root = required(document.querySelector<HTMLElement>('section'))
  const select = vi.fn()
  root.addEventListener('ui:plan-select', select)
  const cleanup = mountProductBlocks(document)
  const repeatedCleanup = mountProductBlocks(document)
  required(root.querySelector<HTMLButtonElement>('[data-billing]')).click()
  expect(required(root.querySelector('[data-monthly]')).textContent).toBe('$96 / year')
  const button = required(root.querySelector<HTMLButtonElement>('[data-plan]'))
  button.click()
  expect(select).toHaveBeenCalledOnce()
  expect(select).toHaveBeenCalledWith(expect.objectContaining({ detail: { billing: 'annual', plan: 'starter' } }))
  repeatedCleanup()
  cleanup()
  button.click()
  expect(select).toHaveBeenCalledOnce()
})

test('onboarding retains its draft, validates, and waits when application completion is canceled', () => {
  document.body.innerHTML = '<section><form><input data-workspace-name required><div data-onboarding-step="0"><h3 tabindex="-1">Workspace</h3></div><div data-onboarding-step="1" hidden><h3 tabindex="-1">Review</h3><span data-workspace-review></span></div><div data-onboarding-step="2" hidden><h3 tabindex="-1">Ready</h3></div><button class="ui-button--disabled" data-onboarding-next type="submit" disabled>Continue</button><button data-onboarding-back type="button" hidden>Back</button></form><p data-block-status></p></section>'
  const root = required(document.querySelector<HTMLElement>('section'))
  const input = required(root.querySelector('input'))
  const form = required(root.querySelector('form'))
  const cleanup = bindOnboardingBlock(root)
  form.dispatchEvent(new Event('submit', { cancelable: true }))
  expect(required(root.querySelector<HTMLElement>('[data-onboarding-step="1"]')).hidden).toBe(true)
  input.value = 'Draft workspace'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  const next = required(root.querySelector<HTMLButtonElement>('[data-onboarding-next]'))
  expect(next.disabled).toBe(false)
  expect(next.classList.contains('ui-button--disabled')).toBe(false)
  form.dispatchEvent(new Event('submit', { cancelable: true }))
  expect(required(root.querySelector('[data-workspace-review]')).textContent).toBe('Draft workspace')
  const canceled = (event: Event) => {
    event.preventDefault()
  }
  root.addEventListener('ui:onboarding-complete', canceled)
  form.dispatchEvent(new Event('submit', { cancelable: true }))
  expect(required(root.querySelector<HTMLElement>('[data-onboarding-step="2"]')).hidden).toBe(true)
  root.removeEventListener('ui:onboarding-complete', canceled)
  required(root.querySelector<HTMLButtonElement>('[data-onboarding-back]')).click()
  expect(input.value).toBe('Draft workspace')
  form.dispatchEvent(new Event('submit', { cancelable: true }))
  form.dispatchEvent(new Event('submit', { cancelable: true }))
  expect(required(root.querySelector<HTMLElement>('[data-onboarding-step="2"]')).hidden).toBe(false)
  cleanup()
})
