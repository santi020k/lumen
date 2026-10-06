// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { initDialogControllers } from './runtime/controllers/dialogs.js'

const nativeShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
const nativeClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true,
    value: vi.fn(function (this: HTMLDialogElement) {
      this.open = true
      this.querySelector<HTMLElement>('[autofocus]')?.focus()
    }) })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true,
    value: vi.fn(function (this: HTMLDialogElement) {
      this.open = false
      this.dispatchEvent(new Event('close'))
    }) })
})

afterEach(() => {
  document.body.replaceChildren()
  vi.restoreAllMocks()
  if (nativeShowModal) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', nativeShowModal)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
  if (nativeClose) Object.defineProperty(HTMLDialogElement.prototype, 'close', nativeClose)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
})

const fixture = (kind = 'dialog') => {
  document.body.innerHTML = `<button data-ui-${kind}-trigger="modal">Open</button><dialog id="modal" data-ui-${kind}><button data-ui-${kind}-close>Close</button><input autofocus></dialog>`
  const dialog = document.querySelector('dialog')
  const trigger = document.querySelector('button')
  const input = document.querySelector('input')
  if (!dialog || !trigger || !input) throw new Error('Expected dialog fixture')
  vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 100, 200, 200))
  vi.spyOn(input, 'getBoundingClientRect').mockReturnValue(new DOMRect(120, 120, 100, 30))
  for (const control of dialog.querySelectorAll<HTMLElement>('button, input')) {
    vi.spyOn(control, 'offsetParent', 'get').mockReturnValue(dialog)
  }
  return { dialog, trigger, input }
}

test('preserves native autofocus when opening a dialog', () => {
  const { dialog, trigger, input } = fixture()
  vi.spyOn(dialog, 'showModal').mockImplementation(() => {
    dialog.open = true
    input.focus()
  })
  initDialogControllers(document)
  trigger.click()
  expect(dialog.open).toBe(true)
  expect(document.activeElement).toBe(input)
})

test.each(['dialog', 'drawer', 'sheet'])('%s ignores inside clicks and dismisses only a backdrop press', kind => {
  const { dialog, trigger } = fixture(kind)
  initDialogControllers(document)
  trigger.click()
  dialog.dispatchEvent(new MouseEvent('click', { clientX: 150, clientY: 150, detail: 1 }))
  expect(dialog.open).toBe(true)
  dialog.dispatchEvent(new MouseEvent('pointerdown', { clientX: 150, clientY: 150 }))
  dialog.dispatchEvent(new MouseEvent('click', { clientX: 50, clientY: 50, detail: 1 }))
  expect(dialog.open).toBe(true)
  dialog.dispatchEvent(new MouseEvent('pointerdown', { clientX: 50, clientY: 50 }))
  dialog.dispatchEvent(new MouseEvent('click', { clientX: 50, clientY: 50, detail: 1 }))
  expect(dialog.open).toBe(false)
  expect(document.activeElement).toBe(trigger)
})

test('alert dialogs ignore backdrop presses and close through their close control', () => {
  const { dialog, trigger } = fixture('alert-dialog')
  initDialogControllers(document)
  trigger.click()
  dialog.dispatchEvent(new MouseEvent('pointerdown', { clientX: 50, clientY: 50 }))
  dialog.dispatchEvent(new MouseEvent('click', { clientX: 50, clientY: 50, detail: 1 }))
  expect(dialog.open).toBe(true)
  dialog.querySelector('button')?.click()
  expect(dialog.open).toBe(false)
})

test('opens and restores an anonymous trigger when randomUUID is unavailable', () => {
  const { dialog, trigger } = fixture()
  vi.spyOn(crypto, 'randomUUID').mockImplementation(() => {
    throw new Error('randomUUID is unavailable')
  })
  initDialogControllers(document)
  trigger.click()
  expect(dialog.open).toBe(true)
  dialog.querySelector('button')?.click()
  expect(document.activeElement).toBe(trigger)
})

test.each(['dialog', 'alert-dialog', 'drawer', 'sheet'])('%s respects canceled trigger activation', kind => {
  const { dialog, trigger } = fixture(kind)
  const showModal = vi.spyOn(dialog, 'showModal')
  trigger.addEventListener('click', event => {
    event.preventDefault()
  })
  initDialogControllers(document)
  trigger.click()
  expect(dialog.open).toBe(false)
  expect(showModal).not.toHaveBeenCalled()
})

test.each(['dialog', 'alert-dialog', 'drawer', 'sheet'])('%s respects aria-disabled trigger activation', kind => {
  const { dialog, trigger } = fixture(kind)
  const showModal = vi.spyOn(dialog, 'showModal')
  trigger.setAttribute('aria-disabled', 'true')
  initDialogControllers(document)
  trigger.click()
  expect(dialog.open).toBe(false)
  expect(showModal).not.toHaveBeenCalled()
  trigger.removeAttribute('aria-disabled')
  trigger.click()
  expect(dialog.open).toBe(true)
})

test.each([false, true])('dialog trigger respects a disabled fieldset and first legend=%s', legend => {
  const { dialog, trigger } = fixture()
  const fieldset = document.createElement('fieldset')
  const firstLegend = document.createElement('legend')
  fieldset.disabled = true
  fieldset.append(firstLegend)
  document.body.append(fieldset)
  if (legend) firstLegend.append(trigger)
  else fieldset.append(trigger)
  initDialogControllers(document)
  trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  expect(dialog.open).toBe(legend)
})

test.each(['dialog', 'alert-dialog', 'drawer', 'sheet'])('%s respects canceled close activation', kind => {
  const { dialog, trigger } = fixture(kind)
  const closeButton = dialog.querySelector('button')
  if (!closeButton) throw new Error('Expected close button')
  closeButton.addEventListener('click', event => {
    event.preventDefault()
  })
  initDialogControllers(document)
  trigger.click()
  closeButton.click()
  expect(dialog.open).toBe(true)
})

test.each(['dialog', 'alert-dialog', 'drawer', 'sheet'])('%s respects disabled close activation', kind => {
  const { dialog, trigger } = fixture(kind)
  const closeButton = dialog.querySelector('button')
  if (!closeButton) throw new Error('Expected close button')
  closeButton.setAttribute('aria-disabled', 'true')
  initDialogControllers(document)
  trigger.click()
  closeButton.click()
  expect(dialog.open).toBe(true)
  closeButton.removeAttribute('aria-disabled')
  closeButton.click()
  expect(dialog.open).toBe(false)
})

test('repeated activation preserves the original dialog opener', () => {
  const { dialog, trigger } = fixture()
  const secondTrigger = document.createElement('button')
  secondTrigger.dataset.uiDialogTrigger = dialog.id
  document.body.append(secondTrigger)
  initDialogControllers(document)
  trigger.click()
  secondTrigger.click()
  dialog.querySelector('button')?.click()
  expect(document.activeElement).toBe(trigger)
})

test('preserves the mode of an already open dialog', () => {
  const { dialog, trigger } = fixture()
  const showModal = vi.spyOn(dialog, 'showModal')
  dialog.open = true
  initDialogControllers(document)
  trigger.click()
  expect(showModal).not.toHaveBeenCalled()
  expect(dialog.open).toBe(true)
})
