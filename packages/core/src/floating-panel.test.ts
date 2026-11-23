// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { connectLumenFloatingPanel } from './floating-panel.js'

let trigger: HTMLButtonElement
let panel: HTMLDivElement
let dialog: HTMLDialogElement
let anchor: DOMRect
let popoverStyles: HTMLStyleElement
const nativeShow = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'showPopover')
const nativeHide = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'hidePopover')

const restoreProperty = (name: 'hidePopover' | 'showPopover', descriptor: PropertyDescriptor | undefined) => {
  if (descriptor) Object.defineProperty(HTMLElement.prototype, name, descriptor)
  else Reflect.deleteProperty(HTMLElement.prototype, name)
}

beforeEach(() => {
  // jsdom has popover UA styles but no top-layer API; model the mock's visible state.
  popoverStyles = document.createElement('style')
  popoverStyles.textContent = '[popover][data-native-open="true"] { display: block !important; }'
  document.head.append(popoverStyles)
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
  dialog.open = true
  trigger = document.createElement('button')
  panel = document.createElement('div')
  panel.hidden = true
  panel.style.left = '4px'
  dialog.append(trigger, panel)
  document.body.append(dialog)
})

afterEach(() => {
  dialog.remove()
  popoverStyles.remove()
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

  frameDialog.open = true
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

test('preserves focus inside open and closed shadow roots, dismisses once on same-root or external focus, and restores trigger focus', () => {
  for (const mode of ['open', 'closed'] as const) {
    const host = document.createElement('div')
    const shadow = host.attachShadow({ mode })
    const shadowTrigger = document.createElement('button')
    const shadowPanel = document.createElement('div')
    const panelInput = document.createElement('input')
    const shadowSibling = document.createElement('button')
    const externalButton = document.createElement('button')

    shadowPanel.hidden = true
    shadowPanel.append(panelInput)
    shadow.append(popoverStyles.cloneNode(true), shadowTrigger, shadowPanel, shadowSibling)
    document.body.append(host, externalButton)

    const onDismiss = vi.fn()
    const disconnect = connectLumenFloatingPanel(shadowPanel, shadowTrigger, {
      initialFocus: 'input',
      onDismiss
    })

    expect(shadow.activeElement).toBe(panelInput)
    expect(onDismiss).toHaveBeenCalledTimes(0)

    shadowTrigger.focus()
    expect(onDismiss).toHaveBeenCalledTimes(0)

    panelInput.focus()
    expect(onDismiss).toHaveBeenCalledTimes(0)

    // Same-root sibling outside focus dismisses once.
    shadowSibling.focus()
    expect(onDismiss).toHaveBeenCalledTimes(1)

    // External document focus dismisses once.
    externalButton.focus()
    expect(onDismiss).toHaveBeenCalledTimes(2)

    // Cleanup returns owned focus to the trigger inside the shadow root and stops listening.
    panelInput.focus()
    disconnect()
    expect(shadow.activeElement).toBe(shadowTrigger)

    shadowSibling.focus()
    externalButton.focus()
    expect(onDismiss).toHaveBeenCalledTimes(2)

    host.remove()
    externalButton.remove()
  }
})

test('observes nested closed shadow-root ancestor chains, cleans up all roots, and preserves external dialog focus', async () => {
  const outerHost = document.createElement('div')
  const outerShadow = outerHost.attachShadow({ mode: 'closed' })
  const outerSibling = document.createElement('button')
  const innerHost = document.createElement('div')
  const innerShadow = innerHost.attachShadow({ mode: 'closed' })
  const innerTrigger = document.createElement('button')
  const innerPanel = document.createElement('div')
  const innerAction = document.createElement('button')
  const externalDialog = document.createElement('dialog')
  const externalDialogButton = document.createElement('button')

  externalDialog.open = true
  externalDialog.append(externalDialogButton)
  innerPanel.hidden = true
  innerPanel.append(innerAction)
  innerShadow.append(popoverStyles.cloneNode(true), innerTrigger, innerPanel)
  outerShadow.append(popoverStyles.cloneNode(true), innerHost, outerSibling)
  document.body.append(outerHost, externalDialog)

  const onDismiss = vi.fn()
  const disconnect = connectLumenFloatingPanel(innerPanel, innerTrigger, {
    initialFocus: 'button',
    onDismiss
  })

  expect(innerShadow.activeElement).toBe(innerAction)
  expect(onDismiss).toHaveBeenCalledTimes(0)

  // Moving focus from the inner closed root to a sibling in the outer closed root must dismiss once.
  outerSibling.focus()
  expect(onDismiss).toHaveBeenCalledTimes(1)

  // Native hidePopover moving focus back to innerTrigger without changing document.activeElement must still restore outerSibling.
  const previousHideDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'hidePopover')
  const previousHidePopover: unknown = previousHideDescriptor?.value

  Object.defineProperty(HTMLElement.prototype, 'hidePopover', {
    configurable: true,
    value: function (this: HTMLElement) {
      if (typeof previousHidePopover === 'function') Reflect.apply(previousHidePopover, this, [])
      innerTrigger.focus()
    }
  })

  disconnect()
  expect(outerShadow.activeElement).toBe(outerSibling)
  expect(document.activeElement).toBe(outerHost)

  if (previousHideDescriptor) {
    Object.defineProperty(HTMLElement.prototype, 'hidePopover', previousHideDescriptor)
  }

  // Opening/focusing an external dialog in document must dismiss once and keep external focus on cleanup.
  const disconnectExternal = connectLumenFloatingPanel(innerPanel, innerTrigger, {
    initialFocus: 'button',
    onDismiss
  })

  externalDialogButton.focus()
  expect(onDismiss).toHaveBeenCalledTimes(2)

  disconnectExternal()
  expect(document.activeElement).toBe(externalDialogButton)

  // After cleanup, focus transitions across inner, outer, and document roots do not re-trigger onDismiss.
  innerAction.focus()
  outerSibling.focus()
  externalDialogButton.focus()
  expect(onDismiss).toHaveBeenCalledTimes(2)

  // Removing a shadow-rooted panel while connected must dismiss once via root MutationObserver.
  const removeDismiss = vi.fn()
  const disconnectRemoval = connectLumenFloatingPanel(innerPanel, innerTrigger, { onDismiss: removeDismiss })

  innerPanel.remove()
  await Promise.resolve()
  expect(removeDismiss).toHaveBeenCalledTimes(1)

  disconnectRemoval()
  outerHost.remove()
  externalDialog.remove()
})

test('rebinds root observers when connected trigger and panel relocate between closed shadow roots', async () => {
  const hostA = document.createElement('div')
  const shadowA = hostA.attachShadow({ mode: 'closed' })
  const hostB = document.createElement('div')
  const shadowB = hostB.attachShadow({ mode: 'closed' })
  const relocatedTrigger = document.createElement('button')
  const relocatedPanel = document.createElement('div')
  const insideB = document.createElement('input')
  const siblingB = document.createElement('button')

  relocatedPanel.hidden = true
  relocatedPanel.append(insideB)
  shadowA.append(popoverStyles.cloneNode(true), relocatedTrigger, relocatedPanel)
  shadowB.append(popoverStyles.cloneNode(true), siblingB)
  document.body.append(hostA, hostB)

  const onDismiss = vi.fn()
  const disconnect = connectLumenFloatingPanel(relocatedPanel, relocatedTrigger, { onDismiss })

  // Move both connected elements synchronously from closed root A to closed root B.
  shadowB.append(relocatedTrigger, relocatedPanel)
  expect(relocatedTrigger.isConnected).toBe(true)
  expect(relocatedPanel.isConnected).toBe(true)
  expect(onDismiss).toHaveBeenCalledTimes(0)

  // Immediate focus inside relocated panel in B must stay open before MutationObserver microtasks flush.
  insideB.focus()
  expect(shadowB.activeElement).toBe(insideB)
  expect(onDismiss).toHaveBeenCalledTimes(0)

  // Same-root sibling focus in B must dismiss once.
  siblingB.focus()
  expect(onDismiss).toHaveBeenCalledTimes(1)

  // Later removal of panel inside B must be observed and dismiss once.
  relocatedPanel.remove()
  await Promise.resolve()
  expect(onDismiss).toHaveBeenCalledTimes(2)

  disconnect()
  hostA.remove()
  hostB.remove()
})
