// @vitest-environment jsdom
import { afterEach, expect, test } from 'vitest'

import { initTreeCollections } from './runtime/features/tree.js'

afterEach(() => {
  document.body.replaceChildren()
})

const element = (selector: string): HTMLElement => {
  const result = document.querySelector(selector)
  if (!(result instanceof HTMLElement)) throw new Error(`Missing fixture: ${selector}`)
  return result
}

const fixture = () => {
  document.body.innerHTML = '<div role="tree"><div hidden><div role="treeitem">Hidden</div></div><div id="first" role="treeitem" aria-expanded="false">First</div><div inert><div role="treeitem">Inert</div></div><button role="treeitem" disabled>Native disabled</button><div id="locked" role="treeitem" aria-disabled="true" aria-expanded="false">Locked</div><div id="last" role="treeitem">Last</div></div>'
  initTreeCollections(document)
  return { first: element('#first'), locked: element('#locked'), last: element('#last') }
}

const press = (target: HTMLElement, key: string, options: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options })
  target.dispatchEvent(event)
  return event
}

test('tree skips hidden, inert and native disabled items while preserving ARIA-disabled discovery', () => {
  const { first, locked, last } = fixture()
  expect(first.tabIndex).toBe(0)
  first.focus()
  press(first, 'ArrowDown')
  expect(document.activeElement).toBe(locked)
  press(locked, 'ArrowRight')
  expect(locked.getAttribute('aria-expanded')).toBe('false')
  press(locked, 'ArrowDown')
  expect(document.activeElement).toBe(last)
  last.hidden = true
  press(locked, 'ArrowDown')
  expect(document.activeElement).toBe(first)
})

test.each([{ altKey: true }, { ctrlKey: true }, { metaKey: true }, { isComposing: true }])('tree leaves modified activation alone: %o', options => {
  const { first } = fixture()
  expect(press(first, 'ArrowRight', options).defaultPrevented).toBe(false)
  expect(first.getAttribute('aria-expanded')).toBe('false')
})

test('tree honors canceled activation and isolates nested collections', () => {
  const { first } = fixture()
  first.addEventListener('keydown', event => {
    event.preventDefault()
  }, { capture: true, once: true })
  press(first, 'ArrowRight')
  expect(first.getAttribute('aria-expanded')).toBe('false')
  first.innerHTML = '<div role="tree"><div id="inner-first" role="treeitem">One</div><div id="inner-last" role="treeitem">Two</div></div>'
  initTreeCollections(first)
  const innerFirst = element('#inner-first')
  const innerLast = element('#inner-last')
  innerFirst.focus()
  press(innerFirst, 'ArrowDown')
  expect(document.activeElement).toBe(innerLast)
})
