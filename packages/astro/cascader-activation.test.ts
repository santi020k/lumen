// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { initCascaders } from './runtime/features/cascader.js'

afterEach(() => {
  document.body.replaceChildren()
})

const element = (selector: string): HTMLElement => {
  const result = document.querySelector(selector)
  if (!(result instanceof HTMLElement)) throw new Error(`Missing fixture: ${selector}`)
  return result
}

const fixture = () => {
  document.body.innerHTML = '<div data-ui-cascader><button id="trigger" data-ui-trigger aria-controls="panel" aria-expanded="true">Pick</button><div id="panel"><ol class="ui-cascader__column"><li><button id="branch" data-ui-cascader-option data-ui-cascader-next="#next">Branch</button></li><li hidden><button data-ui-cascader-option>Hidden</button></li><li inert><button data-ui-cascader-option>Inert</button></li><li><button data-ui-cascader-option disabled>Disabled</button></li><li><button id="locked" data-ui-cascader-option aria-disabled="true" data-value="locked">Locked</button></li><li><button id="leaf" data-ui-cascader-option data-value="leaf">Leaf</button></li></ol><ol id="next" class="ui-cascader__column" hidden><li><button data-ui-cascader-option disabled>Unavailable</button></li><li><button id="child" data-ui-cascader-option data-value="child">Child</button></li></ol></div><input data-ui-cascader-input></div><input id="destination">'
  initCascaders(document)
  return { root: element('[data-ui-cascader]'), panel: element('#panel'), trigger: element('#trigger'), branch: element('#branch'), leaf: element('#leaf'), locked: element('#locked') }
}

const press = (target: HTMLElement, key: string, options: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options })
  target.dispatchEvent(event)
  return event
}

test('cascader skips unavailable navigation targets but keeps ARIA-disabled options discoverable', () => {
  const { branch, locked, leaf } = fixture()
  branch.focus()
  press(branch, 'ArrowDown')
  expect(document.activeElement).toBe(locked)
  locked.setAttribute('disabled', '')
  branch.focus()
  press(branch, 'ArrowDown')
  expect(document.activeElement).toBe(leaf)
  branch.focus()
  press(branch, 'ArrowRight')
  expect(document.activeElement).toBe(element('#child'))
})

test('cascader ignores disabled and canceled activation', () => {
  const { root, panel, locked, leaf } = fixture()
  const changed = vi.fn()
  root.addEventListener('ui:cascader-change', changed)
  locked.click()
  expect(changed).not.toHaveBeenCalled()
  expect(panel.hidden).toBe(false)
  expect(locked.getAttribute('aria-selected')).not.toBe('true')
  leaf.addEventListener('click', event => {
    event.preventDefault()
  }, { capture: true })
  leaf.click()
  expect(changed).not.toHaveBeenCalled()
})

test('cascader restores leaf focus before change handlers can move it elsewhere', () => {
  const { root, trigger, leaf, panel } = fixture()
  leaf.focus()
  leaf.click()
  expect(panel.hidden).toBe(true)
  expect(document.activeElement).toBe(trigger)
  panel.hidden = false
  leaf.focus()
  root.addEventListener('ui:cascader-change', () => {
    element('#destination').focus()
  })
  leaf.click()
  expect(document.activeElement).toBe(element('#destination'))
})

test.each([{ altKey: true }, { ctrlKey: true }, { metaKey: true }, { isComposing: true }])('cascader leaves modified keys alone: %o', options => {
  const { branch } = fixture()
  branch.focus()
  expect(press(branch, 'ArrowRight', options).defaultPrevented).toBe(false)
  expect(element('#next').hidden).toBe(true)
  expect(document.activeElement).toBe(branch)
})

test.each(['body', 'dialog'])('cascader restores leaf focus after pointer activation leaves focus on the %s', fallback => {
  const { branch, trigger, leaf, panel } = fixture()
  const host = document.createElement('dialog')
  host.open = true
  host.tabIndex = -1
  host.append(...document.body.childNodes)
  document.body.append(host)
  branch.focus()
  if (fallback === 'dialog') host.focus()
  else branch.blur()
  expect(document.activeElement).toBe(fallback === 'dialog' ? host : document.body)
  leaf.click()
  expect(panel.hidden).toBe(true)
  expect(document.activeElement).toBe(trigger)
})

test('cascader preserves focus transferred before the leaf handler runs', () => {
  const { trigger, leaf, panel } = fixture()
  trigger.focus()
  leaf.addEventListener('click', () => {
    element('#destination').focus()
  }, { capture: true })
  leaf.click()
  expect(panel.hidden).toBe(true)
  expect(document.activeElement).toBe(element('#destination'))
})
