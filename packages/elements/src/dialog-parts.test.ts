import { afterEach, beforeAll, expect, test, vi } from 'vitest'

import { defineLumenElements, LumenDialogElement } from './index.js'

beforeAll(() => {
  defineLumenElements()
})
afterEach(() => {
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

const mount = () => {
  document.body.innerHTML = '<button id="opener">Edit</button><lumen-dialog aria-labelledby="record-title"><lumen-dialog-header><lumen-dialog-title><h2 id="record-title">Edit record</h2></lumen-dialog-title></lumen-dialog-header><lumen-dialog-body><input aria-label="Record name"></lumen-dialog-body><lumen-dialog-footer><lumen-dialog-close><button type="button">Cancel</button></lumen-dialog-close></lumen-dialog-footer></lumen-dialog>'
  const dialog = document.querySelector('lumen-dialog')
  const close = dialog?.querySelector('button')
  const opener = document.querySelector('#opener')
  if (!(dialog instanceof LumenDialogElement) || !close || !(opener instanceof HTMLElement)) {
    throw new Error('Missing dialog fixture')
  }
  opener.focus()
  dialog.show(opener)
  return { close, dialog, opener }
}

test('compound parts preserve native heading semantics and restore opener focus', () => {
  const { close, dialog, opener } = mount()
  expect(dialog.hidden).toBe(false)
  expect(dialog.getAttribute('aria-labelledby')).toBe('record-title')
  expect(dialog.querySelector('lumen-dialog-body')?.classList.contains('ui-dialog-body')).toBe(true)
  close.click()
  expect(dialog.hidden).toBe(true)
  expect(document.activeElement).toBe(opener)
})

test('disabled and cancelled close actions preserve the task', () => {
  const { close, dialog } = mount()
  close.disabled = true
  close.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  expect(dialog.hidden).toBe(false)
  close.disabled = false
  close.addEventListener('click', event => {
    event.preventDefault()
  })
  close.click()
  expect(dialog.hidden).toBe(false)
})

test('a nested close action only dismisses its own dialog', () => {
  const { dialog } = mount()
  const inner = document.createElement('lumen-dialog')
  inner.innerHTML = '<lumen-dialog-close><button type="button">Close inner</button></lumen-dialog-close>'
  dialog.append(inner)
  if (!(inner instanceof LumenDialogElement)) throw new Error('Missing inner dialog')
  inner.show()
  inner.querySelector('button')?.click()
  expect(inner.hidden).toBe(true)
  expect(dialog.hidden).toBe(false)
})

test('a stale native close event does not move focus out of a reopened modal', () => {
  document.body.innerHTML = '<button id="native-opener">Open</button><lumen-dialog><dialog><input aria-label="Task"></dialog></lumen-dialog>'
  const owner = document.querySelector('lumen-dialog')
  const native = owner?.querySelector('dialog')
  const field = native?.querySelector('input')
  const opener = document.querySelector('#native-opener')
  if (!(owner instanceof LumenDialogElement) || !native || !field || !(opener instanceof HTMLElement)) {
    throw new Error('Missing native dialog fixture')
  }
  owner.show(opener)
  field.focus()
  native.dispatchEvent(new Event('close'))
  expect(document.activeElement).toBe(field)
  native.removeAttribute('open')
  native.dispatchEvent(new Event('close'))
  expect(document.activeElement).toBe(opener)
})

const nativeFixture = (alert = false) => {
  const tag = alert ? 'lumen-alert-dialog' : 'lumen-dialog'
  document.body.innerHTML = `<${tag}><dialog><input aria-label="Unsaved task"></dialog></${tag}>`
  const owner = document.querySelector(tag)
  const native = owner?.querySelector('dialog')
  if (!(owner instanceof HTMLElement) || !native) throw new Error('Missing native dialog fixture')
  vi.spyOn(native, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 100, 200, 200))
  const close = vi.fn(() => {
    native.open = false
    native.dispatchEvent(new Event('close'))
  })
  Object.defineProperty(native, 'close', { configurable: true, value: close })
  native.open = true
  const point = (type: string, inside: boolean, detail = 1) => native.dispatchEvent(new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: inside ? 110 : 50,
    clientY: inside ? 110 : 50,
    detail
  }))
  return { close, native, owner, point }
}

test('native dialogs ignore interior padding and drag-out clicks, then close on a genuine backdrop press', () => {
  const { close, native, point } = nativeFixture()
  point('pointerdown', true)
  point('click', true)
  expect(native.open).toBe(true)
  point('pointerdown', true)
  point('click', false)
  expect(native.open).toBe(true)
  point('pointerdown', false)
  point('click', true)
  expect(native.open).toBe(true)
  point('pointerdown', false)
  point('click', false)
  expect(native.open).toBe(false)
  expect(close).toHaveBeenCalledOnce()
})

test('native dialogs ignore canceled, programmatic, and abandoned backdrop activation', () => {
  const { close, native, point } = nativeFixture()
  native.addEventListener('click', event => {
    event.preventDefault()
  }, { capture: true, once: true })
  point('pointerdown', false)
  point('click', false)
  point('pointerdown', false)
  point('click', false, 0)
  point('pointerdown', false)
  point('pointercancel', false)
  point('click', false)
  expect(native.open).toBe(true)
  expect(close).not.toHaveBeenCalled()
})

test('native alert dialogs retain explicit dismissal and disconnect clears backdrop tracking', () => {
  const alert = nativeFixture(true)
  alert.point('pointerdown', false)
  alert.point('click', false)
  expect(alert.native.open).toBe(true)
  expect(alert.close).not.toHaveBeenCalled()

  const { close, native, owner, point } = nativeFixture()
  point('pointerdown', false)
  owner.remove()
  document.body.append(owner)
  point('click', false)
  expect(native.open).toBe(true)
  point('pointerdown', false)
  point('click', false)
  expect(close).toHaveBeenCalledOnce()
})
