// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { act, createElement, StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { AlertDialog, Dialog, DialogBody, DialogClose, type DialogCloseProps, DialogFooter, DialogHeader, type DialogProps, DialogTitle } from './components.js'

let container: HTMLDivElement
let root: Root
let opener: HTMLButtonElement
const nativeShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
const nativeClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')

const run = async (action: () => void) => {
  await act(async () => {
    await Promise.resolve()
    action()
  })
}
const render = (content: ReactNode) => run(() => {
  root.render(content)
})
const content = (props: DialogProps = {}) => createElement(Dialog, { 'aria-label': 'Edit record', ...props }, createElement('button', { id: 'dialog-action' }, 'Save'))
const getDialog = (selector = 'dialog'): HTMLDialogElement => {
  const result = container.querySelector(selector)
  if (!(result instanceof HTMLDialogElement)) throw new Error(`Expected dialog ${selector}`)
  return result
}
const outsideClick = async (dialog: HTMLDialogElement) => {
  vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 100, 200, 200))
  await run(() => {
    dialog.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 50, clientY: 50 }))
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1, clientX: 50, clientY: 50 }))
  })
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true,
    value: function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
      this.querySelector<HTMLElement>('button, input, [tabindex]')?.focus()
    } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true,
    value: function (this: HTMLDialogElement) {
      this.removeAttribute('open')
      this.dispatchEvent(new Event('close'))
    } })
  container = document.createElement('div')
  opener = document.createElement('button')
  opener.textContent = 'Open record'
  document.body.append(opener, container)
  opener.focus()
  root = createRoot(container)
})

afterEach(async () => {
  await run(() => {
    root.unmount()
  })
  container.remove()
  opener.remove()
  if (nativeShowModal) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', nativeShowModal)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
  if (nativeClose) Object.defineProperty(HTMLDialogElement.prototype, 'close', nativeClose)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

test('controlled opening captures the focused opener without a trigger ref and restores it on close', async () => {
  const onOpenChange = vi.fn()
  await render(content({ open: true, onOpenChange }))
  expect(getDialog().open).toBe(true)
  expect(document.activeElement?.id).toBe('dialog-action')
  await render(content({ open: false, onOpenChange }))
  expect(getDialog().open).toBe(false)
  expect(document.activeElement).toBe(opener)
  expect(onOpenChange).not.toHaveBeenCalled()
})

test('cleanup restores the original opener after controlled unmount and StrictMode replay', async () => {
  const onOpenChange = vi.fn()
  await render(createElement(StrictMode, {}, content({ open: true, onOpenChange })))
  expect(getDialog().open).toBe(true)
  expect(document.activeElement?.id).toBe('dialog-action')
  expect(onOpenChange).not.toHaveBeenCalled()
  await render(null)
  expect(document.activeElement).toBe(opener)
  expect(onOpenChange).not.toHaveBeenCalled()
})

test('outside dismissal respects policy, the content rectangle, and a drag starting inside', async () => {
  const onOpenChange = vi.fn()
  await render(content({ open: true, dismissOnOutsidePress: false, onOpenChange }))
  await outsideClick(getDialog())
  expect(onOpenChange).not.toHaveBeenCalled()
  await render(content({ open: true, onOpenChange }))
  const dialog = getDialog()
  vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 100, 200, 200))
  await run(() => {
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1, clientX: 150, clientY: 150 }))
  })
  expect(onOpenChange).not.toHaveBeenCalled()
  await run(() => {
    dialog.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 150, clientY: 150 }))
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1, clientX: 50, clientY: 50 }))
  })
  expect(onOpenChange).not.toHaveBeenCalled()
  await outsideClick(dialog)
  expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
  expect(dialog.open).toBe(true)
})

test('Escape respects pending policy and consumer prevention while retaining controlled ownership', async () => {
  const onOpenChange = vi.fn()
  await render(content({ open: true, dismissOnEscape: false, onOpenChange }))
  const dispatchCancel = () => run(() => {
    const cancel = new Event('cancel', { cancelable: true })
    getDialog().dispatchEvent(cancel)
    expect(cancel.defaultPrevented).toBe(true)
  })
  await dispatchCancel()
  expect(onOpenChange).not.toHaveBeenCalled()
  await render(content({ open: true,
    onOpenChange,
    onCancel: event => {
      event.preventDefault()
    } }))
  await dispatchCancel()
  expect(onOpenChange).not.toHaveBeenCalled()
  await render(content({ open: true, onOpenChange }))
  await dispatchCancel()
  expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
  expect(getDialog().open).toBe(true)
})

test('alert dialogs default to keeping outside presses inside the confirmation flow', async () => {
  const onOpenChange = vi.fn()
  await render(createElement(AlertDialog, { open: true, onOpenChange, 'aria-label': 'Confirm' }, createElement('button', {}, 'Confirm')))
  await outsideClick(getDialog())
  expect(onOpenChange).not.toHaveBeenCalled()
})

test('nested dialog closure restores its parent trigger without dismissing the parent', async () => {
  const onParentChange = vi.fn()
  const tree = (childOpen: boolean) => createElement(Dialog, { open: true, onOpenChange: onParentChange }, createElement('button', { id: 'inner-opener' }, 'Open details'), childOpen ? createElement(Dialog, { open: true, id: 'inner-dialog' }, createElement('button', { id: 'inner-action' }, 'Confirm')) : null)
  await render(tree(false))
  expect(document.activeElement?.id).toBe('inner-opener')
  await render(tree(true))
  expect(document.activeElement?.id).toBe('inner-action')
  await render(tree(false))
  expect(document.activeElement?.id).toBe('inner-opener')
  expect(getDialog().open).toBe(true)
  expect(onParentChange).not.toHaveBeenCalled()
})

test('focus restoration does not steal focus from a replacement dialog', async () => {
  await render(content({ open: true }))
  await render(createElement(Dialog, { key: 'replacement', open: true }, createElement('button', { id: 'replacement-action' }, 'Next')))
  expect(document.activeElement?.id).toBe('replacement-action')
})

const compoundContent = (props: DialogProps = {}, closeProps: DialogCloseProps = {}) => createElement(Dialog,
  { defaultOpen: true, 'aria-labelledby': 'record-title', ...props },
  createElement(DialogHeader, null, createElement(DialogTitle, { id: 'record-title' }, 'Edit record')),
  createElement(DialogBody, null, createElement('input', { 'aria-label': 'Record name' })),
  createElement(DialogFooter, null, createElement(DialogClose, closeProps, 'Cancel')))

test('compound parts preserve title association and close with focus restoration', async () => {
  await render(compoundContent())
  const dialog = getDialog()
  const title = container.querySelector('#record-title')
  expect(title?.tagName).toBe('H2')
  expect(dialog.getAttribute('aria-labelledby')).toBe(title?.id)
  expect(dialog.querySelector('[data-slot="dialog-body"]')).toBeTruthy()
  const close = dialog.querySelector<HTMLButtonElement>('[data-slot="dialog-close"]')
  if (!close) throw new Error('Missing close button')
  await run(() => {
    close.click()
  })
  expect(dialog.open).toBe(false)
  expect(document.activeElement).toBe(opener)
})

test('compound close respects cancelled clicks and disabled actions', async () => {
  await render(compoundContent({}, { onClick: event => {
    event.preventDefault()
  } }))
  const dialog = getDialog()
  const close = dialog.querySelector<HTMLButtonElement>('[data-slot="dialog-close"]')
  if (!close) throw new Error('Missing close button')
  await run(() => {
    close.click()
  })
  expect(dialog.open).toBe(true)
  await render(compoundContent({}, { disabled: true }))
  await run(() => {
    close.click()
  })
  expect(dialog.open).toBe(true)
})

test('compound close reports controlled requests without overriding application state', async () => {
  const onOpenChange = vi.fn()
  await render(compoundContent({ open: true, onOpenChange }))
  const close = getDialog().querySelector<HTMLButtonElement>('[data-slot="dialog-close"]')
  if (!close) throw new Error('Missing close button')
  await run(() => {
    close.click()
  })
  expect(onOpenChange).toHaveBeenCalledWith(false)
  expect(getDialog().open).toBe(true)
})
