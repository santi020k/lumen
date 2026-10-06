// @vitest-environment jsdom
import { afterEach, expect, test } from 'vitest'

import { initPhoneInputControllers } from './runtime/controllers/phone-input.js'

afterEach(() => {
  document.body.replaceChildren()
})

const fixture = () => {
  document.body.innerHTML = '<form><div data-ui-phone-input data-error-id="phone-error"><span data-slot="country-flag"><img alt=""></span><span data-ui-phone-code></span><select class="ui-phone-input__country"><option value="CO" selected>Colombia</option><option value="US">United States</option></select><input class="ui-phone-input__number" value="3"></div><span id="phone-error" role="alert" hidden></span></form>'
  const input = document.querySelector('input')
  const select = document.querySelector('select')
  const root = document.querySelector<HTMLElement>('[data-ui-phone-input]')
  if (!input || !select || !root) throw new Error('Missing phone fixture')
  initPhoneInputControllers(document)
  return { input, select, root }
}

test('keeps flag, number, validity and accessible error synchronized', () => {
  const { input, select, root } = fixture()
  expect(input.validity.customError).toBe(true)
  expect(input.getAttribute('aria-errormessage')).toBe('phone-error')
  input.value = '+1 212 555 0123'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  expect(select.value).toBe('US')
  expect(root.querySelector('[data-ui-phone-code]')?.textContent).toBe('+1')
  expect(root.querySelector('img')?.src).toMatch(/^data:image\/png;base64,/)
  expect(input.validity.customError).toBe(false)
  expect(input.getAttribute('aria-errormessage')).toBeNull()
  expect(document.getElementById('phone-error')?.hidden).toBe(true)
  expect(root.dataset.e164).toBe('+12125550123')
})

test('restores the flag and calling code after a form reset', async () => {
  const { input, root } = fixture()
  input.value = '+1 212 555 0123'
  input.dispatchEvent(new Event('input'))
  document.querySelector('form')?.reset()
  await Promise.resolve()
  expect(root.querySelector('[data-ui-phone-code]')?.textContent).toBe('+57')
})

test('clears stale error references when the error element is removed', () => {
  const { input } = fixture()
  document.getElementById('phone-error')?.remove()
  input.value = '+1 212 555 0123'
  input.dispatchEvent(new Event('input'))
  expect(input.validity.customError).toBe(false)
  expect(input.getAttribute('aria-errormessage')).toBeNull()
  expect(input.getAttribute('aria-describedby')).toBeNull()
  input.value = '3'
  input.dispatchEvent(new Event('input'))
  expect(input.validity.customError).toBe(true)
  expect(input.getAttribute('aria-describedby')).toBeNull()
})

test('updates only the adopted phone error in its owning iframe document', () => {
  const { input, root } = fixture()
  const sourceError = document.getElementById('phone-error')
  if (!sourceError) throw new Error('Missing source error')
  const iframe = document.createElement('iframe')
  document.body.append(iframe)
  const destination = iframe.contentDocument
  if (!destination) throw new Error('Missing iframe document')
  const destinationError = destination.createElement('span')
  destinationError.id = 'phone-error'
  destinationError.hidden = true
  destination.body.append(destination.adoptNode(root), destinationError)
  sourceError.textContent = 'Source error stays untouched'
  input.value = '3'
  input.dispatchEvent(new Event('input'))
  expect(destinationError.hidden).toBe(false)
  expect(destinationError.textContent).toBe('Enter a complete phone number.')
  expect(input.getAttribute('aria-errormessage')).toBe(destinationError.id)
  expect(input.getAttribute('aria-describedby')).toBe(destinationError.id)
  expect(sourceError.textContent).toBe('Source error stays untouched')
  input.value = '+1 212 555 0123'
  input.dispatchEvent(new Event('input'))
  expect(destinationError.hidden).toBe(true)
  expect(input.getAttribute('aria-errormessage')).toBeNull()
})

test('inherits phone locale from the owning iframe document', () => {
  const iframe = document.createElement('iframe')
  document.body.append(iframe)
  const destination = iframe.contentDocument
  if (!destination) throw new Error('Missing iframe document')
  destination.documentElement.lang = 'es'
  destination.body.innerHTML = '<div data-ui-phone-input><select class="ui-phone-input__country"><option value="US">US</option></select><input class="ui-phone-input__number" value="3"></div>'
  const root = destination.querySelector<HTMLElement>('[data-ui-phone-input]')
  const input = destination.querySelector('input')
  if (!root || !input) throw new Error('Missing phone input')
  let phoneDetail: unknown
  root.addEventListener('ui:phone-change', event => {
    if (event instanceof CustomEvent) phoneDetail = event.detail
  })
  initPhoneInputControllers(destination)
  expect(phoneDetail).toMatchObject({ country: { displayName: new Intl.DisplayNames('es', { type: 'region' }).of('US') } })
})

test('refreshes inherited locale after an initialized phone is adopted', () => {
  const { input, root } = fixture()
  const iframe = document.createElement('iframe')
  document.body.append(iframe)
  const destination = iframe.contentDocument
  if (!destination) throw new Error('Missing iframe document')
  destination.documentElement.lang = 'es'
  destination.body.append(destination.adoptNode(root))
  let phoneDetail: unknown
  root.addEventListener('ui:phone-change', event => {
    if (event instanceof CustomEvent) phoneDetail = event.detail
  })
  initPhoneInputControllers(destination)
  input.value = '+1 212 555 0123'
  input.dispatchEvent(new Event('input'))
  expect(phoneDetail).toMatchObject({
    country: { displayName: new Intl.DisplayNames('es', { type: 'region' }).of('US') }
  })
})

test('resets the current form after reassignment and ignores canceled resets', async () => {
  const { input, root } = fixture()
  const oldForm = input.form
  const currentForm = document.createElement('form')
  currentForm.id = 'current-phone-form'
  document.body.append(currentForm)
  input.setAttribute('form', currentForm.id)
  root.querySelector('select')?.setAttribute('form', currentForm.id)
  input.value = '+1 212 555 0123'
  input.dispatchEvent(new Event('input'))
  oldForm?.reset()
  await Promise.resolve()
  expect(root.dataset.e164).toBe('+12125550123')
  const cancel = (event: Event) => {
    event.preventDefault()
  }
  currentForm.addEventListener('reset', cancel)
  currentForm.reset()
  await Promise.resolve()
  expect(root.dataset.e164).toBe('+12125550123')
  currentForm.removeEventListener('reset', cancel)
  currentForm.reset()
  await Promise.resolve()
  expect(root.querySelector('[data-ui-phone-code]')?.textContent).toBe('+57')
  expect(root.dataset.valid).toBe('false')
  expect(input.validity.customError).toBe(true)
})

test('rebinds reset enhancement after an initialized phone is adopted', async () => {
  const { input, root } = fixture()
  const iframe = document.createElement('iframe')
  document.body.append(iframe)
  const destination = iframe.contentDocument
  if (!destination) throw new Error('Missing destination document')
  destination.body.innerHTML = '<form></form>'
  const form = destination.querySelector('form')
  if (!form) throw new Error('Missing destination form')
  form.append(destination.adoptNode(root))
  initPhoneInputControllers(destination)
  initPhoneInputControllers(destination)
  input.value = '+1 212 555 0123'
  input.dispatchEvent(new Event('input'))
  let commits = 0
  root.addEventListener('ui:phone-change', () => commits++)
  form.reset()
  await Promise.resolve()
  expect(commits).toBe(1)
  expect(root.querySelector('[data-ui-phone-code]')?.textContent).toBe('+57')
  expect(root.dataset.valid).toBe('false')
})
