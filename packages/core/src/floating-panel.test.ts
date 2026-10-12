// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { connectLumenFloatingPanel } from './floating-panel.js'

let trigger: HTMLButtonElement
let panel: HTMLDivElement
let dialog: HTMLDialogElement
let anchor: DOMRect
const nativeShow = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'showPopover')
const nativeHide = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'hidePopover')

const restoreProperty = (name: 'hidePopover' | 'showPopover', descriptor: PropertyDescriptor | undefined) => {
  if (descriptor) Object.defineProperty(HTMLElement.prototype, name, descriptor)
  else Reflect.deleteProperty(HTMLElement.prototype, name)
}

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'showPopover', { configurable: true,
    value: function (this: HTMLElement) {
      this.dataset.nativeOpen = 'true'
    } })
  Object.defineProperty(HTMLElement.prototype, 'hidePopover', { configurable: true,
    value: function (this: HTMLElement) {
      delete this.dataset.nativeOpen
    } })
  vi.spyOn(HTMLElement.prototype, 'matches').mockImplementation(function (this: HTMLElement, selector: string) {
    return selector === ':popover-open' ? this.dataset.nativeOpen === 'true' : Element.prototype.matches.call(this, selector)
  })
  anchor = new DOMRect(40, 60, 120, 32)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return this === trigger ? anchor : new DOMRect(0, 0, 200, 120)
  })
  dialog = document.createElement('dialog')
  trigger = document.createElement('button')
  panel = document.createElement('div')
  panel.hidden = true
  panel.style.left = '4px'
  dialog.append(trigger, panel)
  document.body.append(dialog)
})

afterEach(() => {
  dialog.remove()
  vi.restoreAllMocks()
  restoreProperty('showPopover', nativeShow)
  restoreProperty('hidePopover', nativeHide)
})

test('places the panel in the top layer below its trigger and restores it on cleanup', () => {
  const disconnect = connectLumenFloatingPanel(panel, trigger, { onDismiss: () => undefined })

  expect(panel.getAttribute('popover')).toBe('manual')
  expect(panel.dataset.nativeOpen).toBe('true')
  expect(panel.style.position).toBe('fixed')
  expect(panel.style.top).toBe('98px')
  expect(panel.dataset.placement).toBe('bottom-start')

  disconnect()

  expect(panel.hasAttribute('popover')).toBe(false)
  expect(panel.dataset.nativeOpen).toBeUndefined()
  expect(panel.style.position).toBe('')
  expect(panel.style.left).toBe('4px')
  expect(panel.hasAttribute('data-placement')).toBe(false)
})

test('dismisses when its containing dialog closes, even without a focus change', () => {
  const onDismiss = vi.fn()
  const disconnect = connectLumenFloatingPanel(panel, trigger, { onDismiss })

  dialog.dispatchEvent(new Event('close'))

  expect(onDismiss).toHaveBeenCalledTimes(1)

  disconnect()
  dialog.dispatchEvent(new Event('close'))

  expect(onDismiss).toHaveBeenCalledTimes(1)
})

test('follows its trigger after an enclosing transform transition or animation settles', () => {
  const disconnect = connectLumenFloatingPanel(panel, trigger, { onDismiss: () => undefined })

  anchor = new DOMRect(40, 36, 120, 32)
  dialog.dispatchEvent(new Event('transitionend', { bubbles: true }))
  expect(panel.style.top).toBe('74px')

  anchor = new DOMRect(40, 20, 120, 32)
  dialog.dispatchEvent(new Event('animationend', { bubbles: true }))
  expect(panel.style.top).toBe('58px')

  disconnect()
  anchor = new DOMRect(40, 100, 120, 32)
  dialog.dispatchEvent(new Event('transitionend', { bubbles: true }))
  expect(panel.style.top).toBe('')
})

test('falls back to fixed placement without the Popover API and stops listening after cleanup', () => {
  Reflect.deleteProperty(HTMLElement.prototype, 'showPopover')

  const onDismiss = vi.fn()
  const outside = document.createElement('button')

  document.body.append(outside)

  const disconnect = connectLumenFloatingPanel(panel, trigger, { onDismiss })

  expect(panel.hasAttribute('popover')).toBe(false)
  expect(panel.hidden).toBe(false)
  expect(panel.style.position).toBe('fixed')

  outside.focus()
  expect(onDismiss).toHaveBeenCalledTimes(1)

  disconnect()
  trigger.focus()
  outside.focus()
  expect(onDismiss).toHaveBeenCalledTimes(1)
  outside.remove()
})

test('dismisses once when its trigger leaves the document and stops observing after cleanup', async () => {
  const onDismiss = vi.fn()
  const disconnect = connectLumenFloatingPanel(panel, trigger, { onDismiss })

  dialog.remove()
  await Promise.resolve()
  expect(onDismiss).toHaveBeenCalledTimes(1)

  disconnect()
  document.body.append(dialog)
  dialog.remove()
  await Promise.resolve()
  expect(onDismiss).toHaveBeenCalledTimes(1)
})

test('leaves the caller in charge of hiding the panel', () => {
  const disconnect = connectLumenFloatingPanel(panel, trigger, { onDismiss: () => undefined })

  expect(panel.hidden).toBe(false)
  disconnect()
  expect(panel.hidden).toBe(false)
})

test('dismisses when its owner is adopted into another document while still connected', async () => {
  const onDismiss = vi.fn()
  const disconnect = connectLumenFloatingPanel(panel, trigger, { onDismiss })
  const destination = document.implementation.createHTMLDocument('Another host')

  destination.body.append(destination.adoptNode(dialog))
  expect(trigger.isConnected).toBe(true)
  await Promise.resolve()
  expect(onDismiss).toHaveBeenCalledTimes(1)
  disconnect()
})

test('opens without initial focus and still returns cleanup when the initial focus selector is malformed', () => {
  const action = document.createElement('button')

  panel.append(action)
  trigger.focus()

  const disconnect = connectLumenFloatingPanel(panel, trigger, { initialFocus: '[', onDismiss: () => undefined })

  expect(panel.dataset.nativeOpen).toBe('true')
  expect(document.activeElement).toBe(trigger)
  disconnect()
  expect(panel.hasAttribute('popover')).toBe(false)
  expect(panel.dataset.nativeOpen).toBeUndefined()
  expect(panel.style.position).toBe('')
  expect(panel.style.left).toBe('4px')
})

test('focuses the first match of a valid initial focus selector', () => {
  const action = document.createElement('button')

  panel.append(action)

  const disconnect = connectLumenFloatingPanel(panel, trigger, { initialFocus: 'button', onDismiss: () => undefined })

  expect(document.activeElement).toBe(action)
  disconnect()
  expect(document.activeElement).toBe(trigger)
})

test('a malformed initial focus selector in a same-origin iframe still lets the caller clean up on dialog dismissal', () => {
  const frame = document.createElement('iframe')

  document.body.append(frame)

  const frameDocument = frame.contentDocument

  if (!frameDocument) throw new Error('Expected a same-origin iframe document.')

  const frameDialog = frameDocument.createElement('dialog')
  const frameTrigger = frameDocument.createElement('button')
  const framePanel = frameDocument.createElement('div')
  const dismissals: string[] = []

  framePanel.hidden = true
  framePanel.style.left = '4px'
  frameDialog.append(frameTrigger, framePanel)
  frameDocument.body.append(frameDialog)
  frameTrigger.focus()

  const disconnect = connectLumenFloatingPanel(framePanel, frameTrigger, {
    initialFocus: '[',
    onDismiss: () => {
      dismissals.push('dismiss')
      framePanel.hidden = true
      disconnect()
    }
  })

  expect(framePanel.hidden).toBe(false)
  expect(framePanel.style.position).toBe('fixed')
  expect(frameDocument.activeElement).toBe(frameTrigger)
  frameDialog.dispatchEvent(new Event('close'))
  frameDialog.dispatchEvent(new Event('close'))
  expect(dismissals).toEqual(['dismiss'])
  expect(framePanel.hidden).toBe(true)
  expect(framePanel.style.position).toBe('')
  expect(framePanel.style.left).toBe('4px')
  expect(framePanel.hasAttribute('popover')).toBe(false)
  expect(framePanel.hasAttribute('data-placement')).toBe(false)
  disconnect()
  expect(framePanel.style.left).toBe('4px')
  frame.remove()
})
