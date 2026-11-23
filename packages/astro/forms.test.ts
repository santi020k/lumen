// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { initFields, initForms } from './runtime/features/forms.js'

afterEach(() => {
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

const getRequiredElement = (selector: string): HTMLElement => {
  const element = document.querySelector<HTMLElement>(selector)

  if (!element) throw new Error(`Expected element ${selector}`)

  return element
}

const getRequiredInput = (selector: string): HTMLInputElement => {
  const element = document.querySelector<HTMLInputElement>(selector)

  if (!(element instanceof HTMLInputElement)) throw new Error(`Expected input ${selector}`)

  return element
}

const getRequiredForm = (selector: string): HTMLFormElement => {
  const element = document.querySelector<HTMLFormElement>(selector)

  if (!(element instanceof HTMLFormElement)) throw new Error(`Expected form ${selector}`)

  return element
}

const setupFormFixture = () => {
  document.body.innerHTML = `
    <form id="profile-form" data-ui-form>
      <div class="ui-field" id="email-field">
        <input id="email" name="email" required />
        <p class="ui-field__error" hidden></p>
      </div>
      <div class="ui-field" id="authored-field" data-invalid="true">
        <input id="authored" name="authored" aria-invalid="true" />
        <p class="ui-field__error">Server rejected value</p>
      </div>
      <button type="reset">Reset</button>
    </form>
    <div class="ui-field" id="external-field">
      <input id="external" form="profile-form" name="external" required />
      <p class="ui-field__error" hidden></p>
    </div>
  `

  initFields(document)
  initForms(document)

  return {
    authored: getRequiredInput('#authored'),
    authoredError: getRequiredElement('#authored-field .ui-field__error'),
    authoredField: getRequiredElement('#authored-field'),
    email: getRequiredInput('#email'),
    emailError: getRequiredElement('#email-field .ui-field__error'),
    emailField: getRequiredElement('#email-field'),
    external: getRequiredInput('#external'),
    externalError: getRequiredElement('#external-field .ui-field__error'),
    externalField: getRequiredElement('#external-field'),
    form: getRequiredForm('#profile-form')
  }
}

test('defers reset cleanup until after dispatch, clears runtime validation, and preserves authored errors', async () => {
  const {
    authored,
    authoredError,
    authoredField,
    email,
    emailError,
    emailField,
    external,
    externalError,
    externalField,
    form
  } = setupFormFixture()

  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

  expect(form.dataset.status).toBe('error')
  expect(email.getAttribute('aria-invalid')).toBe('true')
  expect(emailField.dataset.invalid).toBe('true')
  expect(emailError.hidden).toBe(false)
  expect(external.getAttribute('aria-invalid')).toBe('true')
  expect(externalField.dataset.invalid).toBe('true')
  expect(externalError.hidden).toBe(false)

  email.disabled = true

  form.addEventListener('reset', event => {
    event.preventDefault()
  }, { once: true })
  form.dispatchEvent(new Event('reset', { bubbles: true, cancelable: true }))
  await new Promise(resolve => setTimeout(resolve, 0))

  expect(form.dataset.status).toBe('error')
  expect(email.getAttribute('aria-invalid')).toBe('true')
  expect(emailError.hidden).toBe(false)

  form.reset()
  await new Promise(resolve => setTimeout(resolve, 0))

  expect(form.dataset.status).toBe('idle')
  expect(email.hasAttribute('aria-invalid')).toBe(false)
  expect(emailField.dataset.invalid).toBe('false')
  expect(emailError.hidden).toBe(true)
  expect(emailError.textContent).toBe('')

  expect(external.hasAttribute('aria-invalid')).toBe(false)
  expect(externalField.dataset.invalid).toBe('false')
  expect(externalError.hidden).toBe(true)
  expect(externalError.textContent).toBe('')

  expect(authored.getAttribute('aria-invalid')).toBe('true')
  expect(authoredField.dataset.invalid).toBe('true')
  expect(authoredError.hidden).toBe(false)
  expect(authoredError.textContent).toBe('Server rejected value')
})

test('protects immediate invalid and valid submits after reset from deferred reset cleanup', async () => {
  const { email, emailError, emailField, external, form } = setupFormFixture()

  form.reset()
  form.requestSubmit()

  expect(form.dataset.status).toBe('error')
  expect(email.getAttribute('aria-invalid')).toBe('true')
  expect(emailField.dataset.invalid).toBe('true')
  expect(emailError.hidden).toBe(false)

  await new Promise(resolve => setTimeout(resolve, 0))

  expect(form.dataset.status).toBe('error')
  expect(email.getAttribute('aria-invalid')).toBe('true')
  expect(emailField.dataset.invalid).toBe('true')
  expect(emailError.hidden).toBe(false)

  email.value = 'ada@example.com'
  external.value = 'ext'

  const preventSubmit = (event: Event): void => {
    event.preventDefault()
  }

  form.addEventListener('submit', preventSubmit, { once: true })
  form.requestSubmit()
  expect(form.dataset.status).toBe('submitting')

  // Completed reset followed immediately by a valid submit must not be blocked by stale submitting state.
  form.reset()
  email.value = 'ada@example.com'
  external.value = 'ext'
  form.addEventListener('submit', preventSubmit, { once: true })
  form.requestSubmit()

  expect(form.dataset.status).toBe('submitting')

  await new Promise(resolve => setTimeout(resolve, 0))
  expect(form.dataset.status).toBe('idle')
})

test('flushes completed reset before external control focusout validation', async () => {
  const { external, externalError, externalField, form } = setupFormFixture()

  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  expect(external.getAttribute('aria-invalid')).toBe('true')
  expect(externalField.dataset.invalid).toBe('true')
  expect(externalError.hidden).toBe(false)

  form.reset()
  external.value = 'ada@example.com'
  external.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))

  expect(form.dataset.status).toBe('idle')
  expect(external.hasAttribute('aria-invalid')).toBe(false)
  expect(externalField.dataset.invalid).toBe('false')
  expect(externalError.hidden).toBe(true)

  external.value = ''
  external.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))

  await new Promise(resolve => setTimeout(resolve, 0))

  expect(external.getAttribute('aria-invalid')).toBe('true')
  expect(externalField.dataset.invalid).toBe('true')
  expect(externalError.hidden).toBe(false)
})
