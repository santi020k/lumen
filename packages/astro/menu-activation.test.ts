// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { initContextMenus } from './runtime/features/context-menu.js'
import { initDisclosures } from './runtime/features/disclosures.js'

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockReturnValue(document.body)
})

afterEach(() => {
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

const element = (selector: string): HTMLElement => {
  const result = document.querySelector(selector)
  if (!(result instanceof HTMLElement)) throw new Error(`Missing fixture: ${selector}`)
  return result
}

const press = (target: HTMLElement, key: string, options: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options })
  target.dispatchEvent(event)
  return event
}

const disclosure = (kind = 'dropdown-menu') => {
  document.body.innerHTML = `<div data-ui-${kind}><button id="trigger" data-ui-trigger aria-controls="panel">Menu</button><div id="panel" role="menu" hidden><button id="item" role="menuitem">Item</button><button id="disabled" role="menuitem" aria-disabled="true">Disabled</button></div></div><input id="destination">`
  initDisclosures(document)
  return { trigger: element('#trigger'), panel: element('#panel'), item: element('#item') }
}

test('disclosure disabled triggers ignore click, keyboard, hover, and focus opening', () => {
  const { trigger, panel } = disclosure('hover-card')
  trigger.setAttribute('aria-disabled', 'true')
  trigger.click()
  press(trigger, 'ArrowDown')
  trigger.parentElement?.dispatchEvent(new MouseEvent('mouseenter'))
  trigger.focus()
  expect(panel.hidden).toBe(true)
  trigger.removeAttribute('aria-disabled')
  trigger.setAttribute('disabled', '')
  trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  press(trigger, 'ArrowDown')
  expect(panel.hidden).toBe(true)
})

test('disclosure restores menu focus without overriding focus moved by the item action', () => {
  const { trigger, panel, item } = disclosure()
  press(trigger, 'ArrowDown')
  expect(document.activeElement).toBe(item)
  item.click()
  expect(panel.hidden).toBe(true)
  expect(document.activeElement).toBe(trigger)
  press(trigger, 'ArrowDown')
  item.addEventListener('click', () => {
    element('#destination').focus()
  })
  item.click()
  expect(panel.hidden).toBe(true)
  expect(document.activeElement).toBe(element('#destination'))
})

test('disclosure keeps disabled menu items discoverable and respects canceled activation', () => {
  const { trigger, panel, item } = disclosure()
  press(trigger, 'ArrowDown')
  press(item, 'ArrowDown')
  const disabled = element('#disabled')
  expect(document.activeElement).toBe(disabled)
  disabled.click()
  expect(panel.hidden).toBe(false)
  item.addEventListener('click', event => {
    event.preventDefault()
  })
  item.click()
  expect(panel.hidden).toBe(false)
})

test.each([{ altKey: true }, { ctrlKey: true }, { metaKey: true }, { isComposing: true }])('disclosure leaves modified keys alone: %o', options => {
  const { trigger, panel } = disclosure()
  expect(press(trigger, 'ArrowDown', options).defaultPrevented).toBe(false)
  expect(panel.hidden).toBe(true)
})

const contextMenu = () => {
  document.body.innerHTML = '<button id="first" data-ui-context-menu-trigger="context">First</button><button id="second" data-ui-context-menu-trigger="context">Second</button><menu id="context" data-ui-context-menu role="menu"><button id="item" role="menuitem"><svg><path /></svg>Item</button><button id="disabled" role="menuitem" aria-disabled="true">Disabled</button><button id="native-disabled" role="menuitem" disabled>Native disabled</button></menu><input id="destination">'
  initContextMenus(document)
  return { first: element('#first'), second: element('#second'), menu: element('#context'), item: element('#item') }
}

const activationMenu = (kind: 'context' | 'disclosure') => {
  if (kind === 'disclosure') return disclosure()

  const { menu, first, item } = contextMenu()

  return { panel: menu, trigger: first, item }
}

test('context menu ignores disabled and canceled trigger opening', () => {
  const { first, second, menu } = contextMenu()
  first.setAttribute('aria-disabled', 'true')
  first.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))
  press(first, 'F10', { shiftKey: true })
  expect(menu.hidden).toBe(true)
  second.addEventListener('contextmenu', event => {
    event.preventDefault()
  }, { capture: true })
  second.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))
  expect(menu.hidden).toBe(true)
})

test('context menu Escape is consumed and returns to its actual invoking trigger', () => {
  const { first, second, menu, item } = contextMenu()
  press(first, 'ContextMenu')
  press(item, 'Escape')
  press(second, 'F10', { shiftKey: true })
  const event = press(item, 'Escape')
  expect(event.defaultPrevented).toBe(true)
  expect(menu.hidden).toBe(true)
  expect(document.activeElement).toBe(second)
})

test('context menu accepts SVG item clicks and preserves focus transferred by an item action', () => {
  const { first, menu, item } = contextMenu()
  press(first, 'ContextMenu')
  const path = item.querySelector('path')
  if (!path) throw new Error('Missing SVG fixture')
  path.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  expect(menu.hidden).toBe(true)
  expect(document.activeElement).toBe(first)
  press(first, 'ContextMenu')
  item.addEventListener('click', () => {
    element('#destination').focus()
  })
  item.click()
  expect(menu.hidden).toBe(true)
  expect(document.activeElement).toBe(element('#destination'))
})

test('context menu navigates ARIA-disabled items but does not activate them or nested menu items', () => {
  const { first, menu, item } = contextMenu()
  press(first, 'ContextMenu')
  const disabled = element('#disabled')
  press(item, 'ArrowDown')
  expect(document.activeElement).toBe(disabled)
  disabled.click()
  expect(menu.hidden).toBe(false)
  press(disabled, 'ArrowDown')
  expect(document.activeElement).toBe(item)
  const nested = document.createElement('menu')
  nested.setAttribute('data-ui-context-menu', '')
  nested.setAttribute('role', 'menu')
  nested.innerHTML = '<button role="menuitem">Nested</button>'
  menu.append(nested)
  nested.querySelector('button')?.click()
  expect(menu.hidden).toBe(false)
})

test('context menu honors canceled clicks and modified keys', () => {
  const { first, menu, item } = contextMenu()
  expect(press(first, 'F10', { shiftKey: true, altKey: true }).defaultPrevented).toBe(false)
  expect(menu.hidden).toBe(true)
  press(first, 'ContextMenu')
  expect(press(item, 'ArrowDown', { ctrlKey: true }).defaultPrevented).toBe(false)
  expect(document.activeElement).toBe(item)
  item.addEventListener('click', event => {
    event.preventDefault()
  })
  item.click()
  expect(menu.hidden).toBe(false)
})

test.each(['disclosure', 'context'])('%s prevents default navigation from disabled menu links', kind => {
  const { panel, trigger } = kind === 'disclosure' ?
    disclosure() :
    (() => {
      const { menu, first } = contextMenu()
      return { panel: menu, trigger: first }
    })()
  const link = document.createElement('a')
  link.href = '#disabled-destination'
  link.setAttribute('role', 'menuitem')
  link.setAttribute('aria-disabled', 'true')
  panel.append(link)
  press(trigger, kind === 'disclosure' ? 'ArrowDown' : 'ContextMenu')
  const event = new MouseEvent('click', { bubbles: true, cancelable: true })
  link.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(true)
  expect(panel.hidden).toBe(false)
})

test.each(['disclosure', 'context'])('%s restricts focus navigation to its own menu items', kind => {
  const { panel, trigger, item } = kind === 'disclosure' ?
    disclosure() :
    (() => {
      const { menu, first, item: contextItem } = contextMenu()
      return { panel: menu, trigger: first, item: contextItem }
    })()
  const nested = document.createElement('div')
  nested.setAttribute('role', 'menu')
  nested.setAttribute('data-ui-context-menu', '')
  nested.innerHTML = '<button role="menuitem">Nested</button>'
  panel.prepend(nested)
  press(trigger, kind === 'disclosure' ? 'ArrowDown' : 'ContextMenu')
  expect(document.activeElement).toBe(item)
  press(item, 'ArrowUp')
  expect(document.activeElement).toBe(element('#disabled'))
})

test.each([
  ['disclosure', 'body'],
  ['context', 'body'],
  ['disclosure', 'dialog'],
  ['context', 'dialog']
] as const)('%s restores focus after pointer activation leaves focus on the %s', (kind, fallback) => {
  const { panel, trigger, item } = activationMenu(kind)
  const host = document.createElement('dialog')
  host.open = true
  host.tabIndex = -1
  host.append(...document.body.childNodes)
  document.body.append(host)
  const option = document.createElement('button')
  option.setAttribute('role', 'menuitem')
  option.innerHTML = '<svg><path /></svg>'
  panel.append(option)
  press(trigger, kind === 'disclosure' ? 'ArrowDown' : 'ContextMenu')
  expect(document.activeElement).toBe(item)
  if (fallback === 'dialog') host.focus()
  else item.blur()
  expect(document.activeElement).toBe(fallback === 'dialog' ? host : document.body)
  option.querySelector('path')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  expect(panel.hidden).toBe(true)
  expect(document.activeElement).toBe(trigger)
})

test.each(['disclosure', 'context'] as const)('%s preserves focus moved to a separate dialog itself', kind => {
  const { panel, trigger, item } = activationMenu(kind)
  const destination = document.createElement('dialog')
  destination.open = true
  destination.tabIndex = -1
  document.body.append(destination)
  item.addEventListener('click', () => {
    destination.focus()
  })
  press(trigger, kind === 'disclosure' ? 'ArrowDown' : 'ContextMenu')
  item.click()
  expect(panel.hidden).toBe(true)
  expect(document.activeElement).toBe(destination)
})

test.each(['disclosure', 'context'] as const)('%s restores lost focus across shadow roots without taking external focus', kind => {
  const { panel, trigger, item } = activationMenu(kind)
  const outerHost = document.createElement('div')
  const outerScope = outerHost.attachShadow({ mode: 'open' })
  const dialog = document.createElement('dialog')
  dialog.open = true
  dialog.tabIndex = -1
  const innerHost = document.createElement('div')
  const innerScope = innerHost.attachShadow({ mode: 'open' })
  innerScope.append(...document.body.childNodes)
  dialog.append(innerHost)
  outerScope.append(dialog)
  document.body.append(outerHost)
  const key = kind === 'disclosure' ? 'ArrowDown' : 'ContextMenu'
  press(trigger, key)
  expect(innerScope.activeElement).toBe(item)
  dialog.focus()
  expect(innerScope.activeElement).toBeNull()
  expect(outerScope.activeElement).toBe(dialog)
  item.click()
  expect(panel.hidden).toBe(true)
  expect(innerScope.activeElement).toBe(trigger)

  press(trigger, key)
  item.blur()
  expect(document.activeElement).toBe(document.body)
  item.click()
  expect(innerScope.activeElement).toBe(trigger)

  const destination = document.createElement('input')
  document.body.append(destination)
  item.addEventListener('click', () => {
    destination.focus()
  })
  press(trigger, key)
  item.click()
  expect(panel.hidden).toBe(true)
  expect(innerScope.activeElement).toBeNull()
  expect(document.activeElement).toBe(destination)
})
