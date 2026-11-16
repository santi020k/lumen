// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { initSpeedDials } from './runtime/features/speed-dial.js'

afterEach(() => {
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

const key = (target: HTMLElement, value: string): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: value })

  target.dispatchEvent(event)

  return event
}

test('navigates inside ShadowRoot via getScopeActiveElement and retains aria-disabled menuitems while suppressing activation', () => {
  const host = document.createElement('div')
  const shadow = host.attachShadow({ mode: 'open' })

  shadow.innerHTML = `
    <div data-ui-speed-dial>
      <button data-ui-speed-dial-trigger type="button">Actions</button>
      <div data-ui-speed-dial-actions>
        <button role="menuitem" type="button">Create</button>
        <button role="menuitem" type="button" disabled>Native Disabled</button>
        <button role="menuitem" type="button" aria-disabled="true">Aria Disabled</button>
        <span hidden><button role="menuitem" type="button">Hidden</button></span>
        <span inert><button role="menuitem" type="button">Inert</button></span>
        <button role="menuitem" type="button">Share</button>
      </div>
    </div>
  `

  document.body.append(host)
  initSpeedDials(shadow)

  const root = shadow.querySelector<HTMLElement>('[data-ui-speed-dial]')
  const trigger = shadow.querySelector<HTMLButtonElement>('[data-ui-speed-dial-trigger]')
  const items = [...shadow.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')]
  const [create, nativeDisabled, ariaDisabled, hiddenItem, inertItem, share] = items

  if (!root || !trigger || !create || !nativeDisabled || !ariaDisabled || !hiddenItem || !inertItem || !share) {
    throw new Error('Expected speed dial shadow fixture')
  }

  trigger.focus()
  key(trigger, 'ArrowDown')
  expect(root.dataset.state).toBe('open')
  expect(shadow.activeElement).toBe(create)

  key(create, 'ArrowDown')
  expect(shadow.activeElement).toBe(ariaDisabled)

  // Clicking an aria-disabled menuitem must not close the speed dial.
  const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true })

  ariaDisabled.dispatchEvent(clickEvent)
  expect(clickEvent.defaultPrevented).toBe(true)
  expect(root.dataset.state).toBe('open')

  key(ariaDisabled, 'ArrowDown')
  expect(shadow.activeElement).toBe(share)

  share.click()
  expect(root.dataset.state).toBe('closed')
})

test('ignores disabled and aria-disabled speed dial triggers', () => {
  document.body.innerHTML = `
    <div data-ui-speed-dial>
      <button data-ui-speed-dial-trigger type="button" aria-disabled="true">Actions</button>
      <div data-ui-speed-dial-actions>
        <button role="menuitem" type="button">Create</button>
      </div>
    </div>
  `

  initSpeedDials(document)

  const root = document.querySelector<HTMLElement>('[data-ui-speed-dial]')
  const trigger = document.querySelector<HTMLButtonElement>('[data-ui-speed-dial-trigger]')

  if (!root || !trigger) throw new Error('Expected speed dial fixture')

  trigger.click()
  expect(root.dataset.state).toBe('closed')

  key(trigger, 'ArrowDown')
  expect(root.dataset.state).toBe('closed')
})

test('honors defaultPrevented on trigger and action clicks and isolates nested speed dials', () => {
  document.body.innerHTML = `
    <div id="outer" data-ui-speed-dial>
      <button id="outer-trigger" data-ui-speed-dial-trigger type="button">Outer</button>
      <div data-ui-speed-dial-actions>
        <div id="inner" data-ui-speed-dial>
          <button id="inner-trigger" data-ui-speed-dial-trigger type="button">Inner</button>
          <div data-ui-speed-dial-actions>
            <button id="inner-item" role="menuitem" type="button">Inner Item</button>
          </div>
        </div>
      </div>
    </div>
  `

  initSpeedDials(document)

  const outer = document.getElementById('outer')
  const outerTrigger = document.getElementById('outer-trigger')
  const inner = document.getElementById('inner')
  const innerTrigger = document.getElementById('inner-trigger')
  const innerItem = document.getElementById('inner-item')

  if (!outer || !outerTrigger || !inner || !innerTrigger || !innerItem) {
    throw new Error('Expected nested speed dial fixture')
  }

  outerTrigger.addEventListener('click', event => {
    event.preventDefault()
  }, { capture: true, once: true })
  outerTrigger.click()
  expect(outer.dataset.state).toBe('closed')

  outerTrigger.click()
  expect(outer.dataset.state).toBe('open')

  innerTrigger.click()
  expect(inner.dataset.state).toBe('open')
  expect(outer.dataset.state).toBe('open')

  innerItem.click()
  expect(inner.dataset.state).toBe('closed')
  expect(outer.dataset.state).toBe('open')
})

test('ignores modified Escape and foreign-owned speed dial roots or descendants', () => {
  document.body.innerHTML = `
    <div id="astro-sd" data-ui-speed-dial>
      <button id="astro-trigger" data-ui-speed-dial-trigger type="button">Actions</button>
      <div data-ui-speed-dial-actions>
        <button id="astro-item" role="menuitem" type="button">Create</button>
        <div data-ui-owner="react">
          <button id="foreign-item" role="menuitem" type="button">Foreign</button>
        </div>
      </div>
    </div>
    <div id="foreign-sd" data-ui-speed-dial data-ui-owner="react">
      <button id="foreign-trigger" data-ui-speed-dial-trigger type="button">External</button>
      <div data-ui-speed-dial-actions>
        <button role="menuitem" type="button">Item</button>
      </div>
    </div>
  `

  initSpeedDials(document)

  const astroSd = document.getElementById('astro-sd')
  const astroTrigger = document.getElementById('astro-trigger')
  const astroItem = document.getElementById('astro-item')
  const foreignItem = document.getElementById('foreign-item')
  const foreignSd = document.getElementById('foreign-sd')
  const foreignTrigger = document.getElementById('foreign-trigger')

  if (!astroSd || !astroTrigger || !astroItem || !foreignItem || !foreignSd || !foreignTrigger) {
    throw new Error('Expected foreign-owned speed dial fixture')
  }

  expect(foreignSd.dataset.uiBound).toBeUndefined()
  foreignTrigger.click()
  expect(foreignSd.dataset.state).toBeUndefined()

  astroTrigger.click()
  expect(astroSd.dataset.state).toBe('open')

  for (const init of [{ ctrlKey: true }, { altKey: true }, { metaKey: true }] as const) {
    const triggerEsc = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape', ...init })

    astroTrigger.dispatchEvent(triggerEsc)
    expect(triggerEsc.defaultPrevented).toBe(false)
    expect(astroSd.dataset.state).toBe('open')

    const itemEsc = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape', ...init })

    astroItem.dispatchEvent(itemEsc)
    expect(itemEsc.defaultPrevented).toBe(false)
    expect(astroSd.dataset.state).toBe('open')
  }

  foreignItem.click()
  expect(astroSd.dataset.state).toBe('open')
})

test('skips binding when a foreign-owned wrapper sits between root and trigger or actions', () => {
  document.body.innerHTML = `
    <div id="wrapped-trigger-sd" data-ui-speed-dial>
      <div data-ui-owner="react">
        <button id="wrapped-trigger" data-ui-speed-dial-trigger type="button">Actions</button>
      </div>
      <div data-ui-speed-dial-actions>
        <button role="menuitem" type="button">Create</button>
      </div>
    </div>
    <div id="wrapped-actions-sd" data-ui-speed-dial>
      <button id="unwrapped-trigger" data-ui-speed-dial-trigger type="button">Actions</button>
      <div data-ui-owner="react">
        <div data-ui-speed-dial-actions>
          <button role="menuitem" type="button">Create</button>
        </div>
      </div>
    </div>
  `

  initSpeedDials(document)

  const wrappedTriggerSd = document.getElementById('wrapped-trigger-sd')
  const wrappedTrigger = document.getElementById('wrapped-trigger')
  const wrappedActionsSd = document.getElementById('wrapped-actions-sd')
  const unwrappedTrigger = document.getElementById('unwrapped-trigger')

  if (!wrappedTriggerSd || !wrappedTrigger || !wrappedActionsSd || !unwrappedTrigger) {
    throw new Error('Expected wrapped foreign-owned speed dial fixture')
  }

  expect(wrappedTriggerSd.dataset.uiBound).toBeUndefined()
  expect(wrappedTrigger.hasAttribute('aria-expanded')).toBe(false)
  wrappedTrigger.click()
  expect(wrappedTriggerSd.dataset.state).toBeUndefined()
  expect(wrappedTrigger.hasAttribute('aria-expanded')).toBe(false)

  expect(wrappedActionsSd.dataset.uiBound).toBeUndefined()
  expect(unwrappedTrigger.hasAttribute('aria-expanded')).toBe(false)
  unwrappedTrigger.click()
  expect(wrappedActionsSd.dataset.state).toBeUndefined()
  expect(unwrappedTrigger.hasAttribute('aria-expanded')).toBe(false)
})
