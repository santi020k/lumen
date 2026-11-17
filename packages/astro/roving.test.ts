// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { initRovingGroups } from './runtime/features/roving.js'

afterEach(() => {
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

const key = (target: HTMLElement, value: string, init: KeyboardEventInit = {}): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: value, ...init })

  target.dispatchEvent(event)

  return event
}

test('skips native disabled, hidden, and inert items dynamically and blocks disabled radio activation', () => {
  document.body.innerHTML = `
    <fieldset data-ui-radio-group>
      <input type="radio" name="tier" value="disabled-first" disabled />
      <input type="radio" name="tier" value="free" checked />
      <input type="radio" name="tier" value="pro" disabled />
      <span hidden><input type="radio" name="tier" value="hidden" /></span>
      <span inert><input type="radio" name="tier" value="inert" /></span>
      <input type="radio" name="tier" value="team" />
    </fieldset>
  `

  initRovingGroups(document)

  const inputs = [...document.querySelectorAll<HTMLInputElement>('input[type="radio"]')]
  const [disabledFirst, free, pro, hiddenRadio, inertRadio, team] = inputs

  if (!disabledFirst || !free || !pro || !hiddenRadio || !inertRadio || !team) {
    throw new Error('Expected radio group inputs')
  }

  expect(disabledFirst.tabIndex).toBe(-1)
  expect(free.tabIndex).toBe(0)

  const proChange = vi.fn()

  pro.addEventListener('change', proChange)

  free.focus()
  key(free, 'ArrowRight')

  expect(pro.checked).toBe(false)
  expect(proChange).not.toHaveBeenCalled()
  expect(document.activeElement).toBe(team)
  expect(team.checked).toBe(true)
  expect(team.tabIndex).toBe(0)
  expect(free.tabIndex).toBe(-1)

  // Re-enabling an item dynamically makes it reachable on subsequent keydown.
  pro.disabled = false
  key(team, 'ArrowLeft')
  expect(document.activeElement).toBe(pro)
  expect(pro.checked).toBe(true)
})

test('keeps aria-disabled menuitem focusable while blocking aria-disabled role=radio activation', () => {
  document.body.innerHTML = `
    <div data-ui-menubar>
      <button role="menuitem">File</button>
      <button role="menuitem" aria-disabled="true">Edit</button>
      <button role="menuitem">View</button>
    </div>
    <div data-ui-radio-group>
      <button role="radio" aria-checked="true">One</button>
      <button role="radio" aria-disabled="true" aria-checked="false">Two</button>
      <button role="radio" aria-checked="false">Three</button>
    </div>
  `

  initRovingGroups(document)

  const [file, edit, view] = document.querySelectorAll<HTMLButtonElement>('[data-ui-menubar] [role="menuitem"]')
  const [one, two, three] = document.querySelectorAll<HTMLButtonElement>('[data-ui-radio-group] [role="radio"]')

  if (!file || !edit || !view || !one || !two || !three) {
    throw new Error('Expected menubar and radio buttons')
  }

  file.focus()
  key(file, 'ArrowRight')
  expect(document.activeElement).toBe(edit)
  expect(edit.tabIndex).toBe(0)

  key(edit, 'ArrowRight')
  expect(document.activeElement).toBe(view)

  const twoChange = vi.fn()

  two.addEventListener('change', twoChange)
  one.focus()
  key(one, 'ArrowRight')

  expect(document.activeElement).toBe(three)
  expect(two.getAttribute('aria-checked')).toBe('false')
  expect(twoChange).not.toHaveBeenCalled()
  expect(three.getAttribute('aria-checked')).toBe('true')
})

test('isolates nested roving groups and honors canceled, composing, and modifier keys', () => {
  document.body.innerHTML = `
    <div data-ui-toolbar>
      <button id="outer-1">Bold</button>
      <div data-ui-toggle-group>
        <button id="inner-1">Left</button>
        <button id="inner-2">Right</button>
      </div>
      <button id="outer-2">Italic</button>
    </div>
  `

  initRovingGroups(document)

  const outer1 = document.getElementById('outer-1')
  const outer2 = document.getElementById('outer-2')
  const inner1 = document.getElementById('inner-1')
  const inner2 = document.getElementById('inner-2')

  if (!outer1 || !outer2 || !inner1 || !inner2) {
    throw new Error('Expected nested roving buttons')
  }

  outer1.focus()
  key(outer1, 'ArrowRight')
  expect(document.activeElement).toBe(outer2)

  inner1.focus()
  key(inner1, 'ArrowRight')
  expect(document.activeElement).toBe(inner2)

  const altEvent = key(inner2, 'ArrowLeft', { altKey: true })

  expect(altEvent.defaultPrevented).toBe(false)
  expect(document.activeElement).toBe(inner2)

  const composingEvent = key(inner2, 'ArrowLeft', { isComposing: true })

  expect(composingEvent.defaultPrevented).toBe(false)
  expect(document.activeElement).toBe(inner2)
})

test('ignores foreign-owned roving roots and nested foreign-owned descendants', () => {
  document.body.innerHTML = `
    <div data-ui-toolbar>
      <button id="astro-1">Bold</button>
      <span data-ui-owner="react">
        <button id="foreign-child">Foreign</button>
      </span>
      <button id="astro-2">Italic</button>
    </div>
    <div id="foreign-root" data-ui-toolbar data-ui-owner="react">
      <button id="foreign-root-btn">External</button>
    </div>
  `

  initRovingGroups(document)

  const astro1 = document.getElementById('astro-1')
  const astro2 = document.getElementById('astro-2')
  const foreignChild = document.getElementById('foreign-child')
  const foreignRoot = document.getElementById('foreign-root')
  const foreignRootBtn = document.getElementById('foreign-root-btn')

  if (!astro1 || !astro2 || !foreignChild || !foreignRoot || !foreignRootBtn) {
    throw new Error('Expected foreign-owned roving fixture')
  }

  expect(foreignRoot.dataset.uiBound).toBeUndefined()
  expect(foreignRootBtn.hasAttribute('tabindex')).toBe(false)
  expect(foreignChild.hasAttribute('tabindex')).toBe(false)

  astro1.focus()
  key(astro1, 'ArrowRight')
  expect(document.activeElement).toBe(astro2)

  foreignChild.focus()
  const foreignEvent = key(foreignChild, 'ArrowRight')

  expect(foreignEvent.defaultPrevented).toBe(false)
  expect(document.activeElement).toBe(foreignChild)
})

test('re-enabled native groups retain an owned visible entry point and leave disabled sources', () => {
  document.body.innerHTML = `
    <fieldset data-ui-radio-group disabled>
      <span hidden><input id="hidden" type="radio" name="plan" /></span>
      <span inert><input id="inert" type="radio" name="plan" /></span>
      <span data-ui-owner="react"><input id="foreign" type="radio" name="plan" /></span>
      <input id="first" type="radio" name="plan" checked />
      <input id="last" type="radio" name="plan" />
    </fieldset>
  `

  const group = document.querySelector('fieldset')
  const first = document.querySelector<HTMLInputElement>('#first')
  const last = document.querySelector<HTMLInputElement>('#last')
  const foreign = document.querySelector<HTMLInputElement>('#foreign')

  if (!group || !first || !last || !foreign) throw new Error('Expected disabled roving fixture')

  initRovingGroups(document)
  expect(group.dataset.uiBound).toBe('true')
  expect(first.tabIndex).toBe(0)
  expect(last.tabIndex).toBe(-1)
  expect(foreign.hasAttribute('tabindex')).toBe(false)

  group.disabled = false
  expect(first.tabIndex).toBe(0)
  expect(last.tabIndex).toBe(-1)

  first.focus()
  first.setAttribute('aria-disabled', 'true')
  key(first, 'ArrowRight')
  expect(document.activeElement).toBe(last)
  expect(last.checked).toBe(true)
  expect(first.checked).toBe(false)
  expect(foreign.checked).toBe(false)
  expect(foreign.hasAttribute('tabindex')).toBe(false)

  last.hidden = true
  expect(key(last, 'Home').defaultPrevented).toBe(false)
  expect(last.checked).toBe(true)
})
