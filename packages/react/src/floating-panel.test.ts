// @vitest-environment jsdom
import { act, createElement, StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, type DropdownMenuProps, DropdownMenuTrigger, Popover, PopoverPanel, PopoverTrigger } from './components.js'

let container: HTMLDivElement
let root: Root
let triggerBounds: DOMRect
const nativeShow = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'showPopover')
const nativeHide = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'hidePopover')
const nativeViewport = Object.getOwnPropertyDescriptor(window, 'visualViewport')
let viewport: EventTarget & { width: number, height: number, offsetLeft: number, offsetTop: number }

const run = async (action: () => void) => {
  await act(async () => {
    await Promise.resolve()
    action()
  })
}
const menu = (props: DropdownMenuProps = {}, onSelect?: () => void) => createElement(DropdownMenu, props, createElement(DropdownMenuTrigger, { id: 'trigger' }, 'Actions'), createElement(DropdownMenuContent, { id: 'panel', 'aria-label': 'Record actions' }, createElement(DropdownMenuItem, { onClick: onSelect }, 'Edit')))
const element = (selector: string): HTMLElement => {
  const value = container.querySelector(selector)

  if (!(value instanceof HTMLElement)) throw new Error(`Missing ${selector}`)

  return value
}
const render = (props: DropdownMenuProps = {}) => run(() => {
  root.render(menu(props))
})
const click = (selector: string) => run(() => {
  element(selector).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
})

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  viewport = Object.assign(new EventTarget(), { width: 400, height: 300, offsetLeft: 0, offsetTop: 0 })
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport })
  Object.defineProperty(HTMLElement.prototype, 'showPopover', { configurable: true,
    value: function (this: HTMLElement) {
      this.dataset.nativeOpen = 'true'
    } })
  Object.defineProperty(HTMLElement.prototype, 'hidePopover', { configurable: true,
    value: function (this: HTMLElement) {
      delete this.dataset.nativeOpen
    } })
  const nativeMatches = (element: HTMLElement, selector: string) => Element.prototype.matches.call(element, selector)

  vi.spyOn(HTMLElement.prototype, 'matches').mockImplementation(function (this: HTMLElement, selector: string) {
    return selector === ':popover-open' ? this.dataset.nativeOpen === 'true' : nativeMatches(this, selector)
  })
  triggerBounds = new DOMRect(340, 250, 40, 30)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return this.id === 'trigger' ? triggerBounds : new DOMRect(0, 0, 160, 120)
  })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await run(() => {
    root.unmount()
  })
  container.remove()
  for (const [key, descriptor] of [['showPopover', nativeShow], ['hidePopover', nativeHide]] as const) {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, key, descriptor)
    else Reflect.deleteProperty(HTMLElement.prototype, key)
  }
  if (nativeViewport) Object.defineProperty(window, 'visualViewport', nativeViewport)
  else Reflect.deleteProperty(window, 'visualViewport')
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

test('opens above a clipped trigger, clamps to the viewport, and restores focus and styles', async () => {
  await render()
  await click('#trigger')
  const panel = element('#panel')

  expect(panel.getAttribute('popover')).toBe('manual')
  expect(panel.dataset.nativeOpen).toBe('true')
  expect(panel.dataset.placement).toBe('top-start')
  expect(panel.style.left).toBe('232px')
  expect(panel.style.top).toBe('124px')
  expect(document.activeElement).toBe(element('[role="menuitem"]'))
  await click('[role="menuitem"]')
  expect(panel.hidden).toBe(true)
  expect(panel.hasAttribute('popover')).toBe(false)
  expect(panel.style.position).toBe('')
  expect(document.activeElement).toBe(element('#trigger'))
})

test('tracks visual viewport movement, trigger resizing, and logical RTL alignment', async () => {
  triggerBounds = new DOMRect(200, 80, 40, 30)
  await render({ defaultOpen: true, placement: 'bottom-start', dir: 'rtl' })
  // jsdom does not resolve inherited direction, so supply the browser's computed result.
  vi.spyOn(window, 'getComputedStyle').mockReturnValue(Object.assign(document.createElement('div').style, { direction: 'rtl' }))
  viewport.dispatchEvent(new Event('resize'))
  expect(element('#panel').style.left).toBe('80px')
  expect(element('#panel').style.top).toBe('116px')
  viewport.offsetLeft = 100
  viewport.offsetTop = 20
  viewport.width = 200
  viewport.dispatchEvent(new Event('scroll'))
  expect(element('#panel').style.left).toBe('108px')
  triggerBounds = new DOMRect(160, 40, 40, 30)
  window.dispatchEvent(new Event('resize'))
  expect(element('#panel').style.top).toBe('76px')
})

test('closes on outside focus without stealing it and preserves focus handed to a dialog', async () => {
  const destination = document.createElement('button')

  document.body.append(destination)
  try {
    await render({ defaultOpen: true })
    await run(() => {
      destination.focus()
    })
    expect(element('#panel').hidden).toBe(true)
    expect(document.activeElement).toBe(destination)
    await run(() => {
      root.render(menu({ open: true }, () => {
        destination.focus()
      }))
    })
    await click('[role="menuitem"]')
    await render({ open: false })
    expect(document.activeElement).toBe(destination)
  } finally {
    destination.remove()
  }
})

test('works without the Popover API and allows specialized placement to opt out', async () => {
  Reflect.deleteProperty(HTMLElement.prototype, 'showPopover')
  Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover')
  await render({ defaultOpen: true })
  expect(element('#panel').style.position).toBe('fixed')
  expect(element('#panel').hasAttribute('popover')).toBe(false)
  await render({ defaultOpen: true, positioning: 'none' })
  expect(element('#panel').style.position).toBe('')
})

test('StrictMode and controlled dismissal retain application ownership', async () => {
  const changes = vi.fn()

  await run(() => {
    root.render(createElement(StrictMode, {}, menu({ open: true, onOpenChange: changes })))
  })
  await click('[role="menuitem"]')
  expect(changes).toHaveBeenCalledExactlyOnceWith(false)
  expect(element('#panel').hidden).toBe(false)
  expect(element('#panel').dataset.nativeOpen).toBe('true')
})

test.each(['anchored', 'none'] as const)('pointer-opened popovers retain a keyboard dismissal path with %s positioning', async positioning => {
  await run(() => {
    root.render(createElement(Popover, { positioning }, createElement(PopoverTrigger, { id: 'trigger' }, 'Actions'), createElement(PopoverPanel, { id: 'panel', role: 'region', 'aria-label': 'Record actions' }, createElement('button', { type: 'button' }, 'Edit'))))
  })
  expect(document.activeElement).not.toBe(element('#trigger'))
  // A synthetic pointer click, like a Safari button click, does not focus the trigger for us.
  await click('#trigger')
  expect(element('#panel').hidden).toBe(false)
  expect(document.activeElement).toBe(element('#trigger'))
  await run(() => {
    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
  })
  expect(element('#panel').hidden).toBe(true)
  expect(document.activeElement).toBe(element('#trigger'))
})

test('a canceled popover click preserves focus and closed state', async () => {
  await run(() => {
    root.render(createElement(Popover, {}, createElement('input', { id: 'editor', 'aria-label': 'Edit record' }), createElement(PopoverTrigger, { id: 'trigger',
      onClick: event => {
        event.preventDefault()
      } }, 'Actions'), createElement(PopoverPanel, { id: 'panel' }, 'Record actions')))
  })
  element('#editor').focus()
  await click('#trigger')
  expect(element('#panel').hidden).toBe(true)
  expect(document.activeElement).toBe(element('#editor'))
})
