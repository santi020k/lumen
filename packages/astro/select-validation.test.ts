// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { initFields, initForms } from './runtime/features/forms.js'
import { initSelects } from './runtime/features/select.js'

afterEach(() => {
  document.body.replaceChildren()
})

const requireElement = <T extends Element>(element: T | null): T => {
  if (!element) throw new Error('Missing select validation fixture')

  return element
}

const fixture = (shadow = false) => {
  const host = document.createElement('section')
  const scope = shadow ? host.attachShadow({ mode: 'open' }) : host

  scope.innerHTML = `<button id="outside" type="button">Outside</button>
    <form data-ui-form>
      <div class="ui-field" data-ui-select>
        <select class="ui-select__native" data-ui-select-native id="plan" name="plan" required aria-label="Plan">
          <option data-ui-select-placeholder selected value="">Choose a plan</option>
          <option value="pro">Pro</option>
        </select>
        <div data-ui-select-control hidden>
          <button data-ui-select-trigger type="button"><span data-ui-select-value></span></button>
          <div data-ui-select-list hidden></div>
        </div>
        <p class="ui-field__error" hidden></p>
      </div>
    </form>`
  document.body.append(host)

  const form = requireElement(scope.querySelector('form'))
  const select = requireElement(scope.querySelector('select'))
  const trigger = requireElement(scope.querySelector<HTMLButtonElement>('[data-ui-select-trigger]'))
  const list = requireElement(scope.querySelector<HTMLElement>('[data-ui-select-list]'))
  const outside = requireElement(scope.querySelector<HTMLButtonElement>('#outside'))
  const initialize = (): void => {
    initFields(scope)
    initForms(scope)
    initSelects(scope)
  }

  return { form, host, initialize, list, outside, scope, select, trigger }
}

test.each([false, true])('forwards actual native focus in its owning tree (shadow: %s) without changing its public ID', shadow => {
  const { initialize, scope, select, trigger } = fixture(shadow)

  initialize()
  select.focus()

  expect(shadow && scope instanceof ShadowRoot ? scope.activeElement : document.activeElement).toBe(trigger)
  expect(scope.querySelector('#plan')).toBe(select)
  expect(select.id).toBe('plan')
})

test('synthetic focus and consumer focus redirection do not steal focus', () => {
  const { initialize, outside, select } = fixture()

  select.addEventListener('focus', () => {
    outside.focus()
  })
  initialize()
  outside.focus()
  select.dispatchEvent(new FocusEvent('focus'))
  expect(document.activeElement).toBe(outside)
  select.focus()
  expect(document.activeElement).toBe(outside)
})

test('invalid form submission focuses the visible Select and mirrors generated validation', async () => {
  const { form, initialize, select, trigger } = fixture()

  initialize()
  expect(form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))).toBe(false)
  await Promise.resolve()

  expect(document.activeElement).toBe(trigger)
  expect(select.getAttribute('aria-invalid')).toBe('true')
  expect(trigger.getAttribute('aria-invalid')).toBe('true')
})

test('an error summary link retains its native control target and focuses the visible trigger', () => {
  const { form, initialize, select, trigger } = fixture()

  form.insertAdjacentHTML('afterbegin', '<div data-ui-error-summary><a href="#plan">Choose a plan</a></div>')
  const link = requireElement(form.querySelector('a'))
  const scroll = vi.fn()

  select.scrollIntoView = scroll
  initialize()
  const click = new MouseEvent('click', { bubbles: true, cancelable: true })

  link.dispatchEvent(click)
  expect(click.defaultPrevented).toBe(true)
  expect(document.activeElement).toBe(trigger)
  expect(scroll).toHaveBeenCalledOnce()
})

test('validation checks and attribute synchronization preserve focus on an error summary or earlier invalid field', async () => {
  const { form, initialize, outside, select, trigger } = fixture()
  const earlier = document.createElement('input')
  const summary = document.createElement('div')

  earlier.required = true
  summary.dataset.uiErrorSummary = ''
  summary.tabIndex = -1
  form.prepend(earlier, summary)
  initialize()
  outside.focus()
  expect(select.checkValidity()).toBe(false)
  expect(document.activeElement).toBe(outside)

  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await Promise.resolve()
  expect(document.activeElement).toBe(summary)
  expect(trigger.getAttribute('aria-invalid')).toBe('true')

  summary.hidden = true
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await Promise.resolve()
  expect(document.activeElement).toBe(earlier)
})

test('mirrors disabled, required, and authored invalid state, including removals, without changing focus', async () => {
  const { initialize, list, outside, select, trigger } = fixture()

  select.setAttribute('aria-invalid', 'grammar')
  initialize()
  expect(trigger.getAttribute('aria-required')).toBe('true')
  expect(trigger.getAttribute('aria-invalid')).toBe('grammar')
  trigger.click()
  expect(list.hidden).toBe(false)
  outside.focus()

  select.disabled = true
  select.required = false
  select.setAttribute('aria-invalid', 'false')
  await Promise.resolve()
  expect(trigger.disabled).toBe(true)
  expect(trigger.hasAttribute('aria-required')).toBe(false)
  expect(trigger.getAttribute('aria-invalid')).toBe('false')
  expect(list.hidden).toBe(true)
  expect(document.activeElement).toBe(outside)

  select.disabled = false
  select.required = true
  select.removeAttribute('aria-invalid')
  await Promise.resolve()
  expect(trigger.disabled).toBe(false)
  expect(trigger.getAttribute('aria-required')).toBe('true')
  expect(trigger.hasAttribute('aria-invalid')).toBe(false)
  expect(document.activeElement).toBe(outside)
})

test('preserves scoped state synchronization when initialized detached and reinserted', async () => {
  const { host, initialize, select, trigger } = fixture()

  host.remove()
  initialize()
  select.setAttribute('aria-invalid', 'spelling')
  await Promise.resolve()
  expect(trigger.getAttribute('aria-invalid')).toBe('spelling')
  document.body.append(host)
  initialize()
  select.focus()
  expect(document.activeElement).toBe(trigger)
  host.remove()
  document.body.append(host)
  select.removeAttribute('aria-invalid')
  await Promise.resolve()
  expect(trigger.hasAttribute('aria-invalid')).toBe(false)
})
