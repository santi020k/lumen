// @vitest-environment jsdom
import { afterEach, beforeAll, expect, test } from 'vitest'

import { defineLumenElements } from './index.js'

const requireElement = <T extends Element>(element: T | null | undefined): T => {
  if (!element) throw new Error('Expected select fixture element')

  return element
}

const press = (element: Element, key: string): void => {
  element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key }))
}

const flushMutations = async (): Promise<void> => {
  await Promise.resolve()
}

const renderSelect = (): {
  listbox: HTMLElement
  root: HTMLElement
  select: HTMLSelectElement
  trigger: HTMLButtonElement
} => {
  document.body.innerHTML = `
    <label for="plan">Plan</label>
    <lumen-select>
      <select id="plan" name="plan">
        <option value="free">Free</option>
        <option value="pro">Pro</option>
        <option value="team">Team</option>
      </select>
    </lumen-select>
    <button id="after" type="button">After</button>
  `

  return {
    listbox: requireElement(document.querySelector<HTMLElement>('[data-ui-select-list]')),
    root: requireElement(document.querySelector<HTMLElement>('lumen-select')),
    select: requireElement(document.querySelector<HTMLSelectElement>('#plan')),
    trigger: requireElement(document.querySelector<HTMLButtonElement>('[data-ui-select-trigger]'))
  }
}

const getOption = (value: string): HTMLElement => requireElement(
  [...document.querySelectorAll<HTMLElement>('[data-ui-select-option]')].find(item => item.dataset.value === value)
)

beforeAll(() => {
  defineLumenElements()
})

afterEach(() => {
  document.body.replaceChildren()
})

test('Space opens the select and selects the focused option', () => {
  const { listbox, select, trigger } = renderSelect()

  trigger.focus()
  press(trigger, ' ')

  expect(listbox.hidden).toBe(false)
  expect(document.activeElement).toBe(getOption('free'))

  press(getOption('free'), 'ArrowDown')
  press(getOption('pro'), ' ')

  expect(select.value).toBe('pro')
  expect(listbox.hidden).toBe(true)
  expect(document.activeElement).toBe(trigger)
})

test('Space continues an active typeahead query instead of selecting', () => {
  document.body.innerHTML = `
    <lumen-select aria-label="City">
      <select aria-label="City">
        <option value="nh">New Haven</option>
        <option value="ny">New York</option>
        <option value="nw">Newark</option>
      </select>
    </lumen-select>
  `
  const select = requireElement(document.querySelector('select'))
  const trigger = requireElement(document.querySelector<HTMLElement>('[data-ui-select-trigger]'))

  trigger.focus()

  for (const key of ['n', 'e', 'w', ' ', 'y']) {
    press(requireElement(document.activeElement), key)
  }

  expect(document.activeElement?.textContent).toBe('New York')
  expect(select.value).toBe('nh')
})

test('moving focus outside the select closes its listbox', () => {
  const { listbox, trigger } = renderSelect()
  const after = requireElement(document.querySelector<HTMLButtonElement>('#after'))

  press(trigger, 'ArrowDown')
  expect(listbox.hidden).toBe(false)

  getOption('free').dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: getOption('pro') }))
  expect(listbox.hidden).toBe(false)

  getOption('free').dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: after }))
  expect(listbox.hidden).toBe(true)
  expect(trigger.getAttribute('aria-expanded')).toBe('false')
})

test('the listbox shares the trigger accessible name', () => {
  const { listbox, trigger } = renderSelect()

  expect(trigger.getAttribute('aria-label')).toBe('Plan')
  expect(listbox.getAttribute('aria-label')).toBe('Plan')
})

test('native disabled transitions update the custom trigger', async () => {
  const { listbox, select, trigger } = renderSelect()

  press(trigger, 'ArrowDown')
  select.disabled = true
  await flushMutations()

  expect(trigger.disabled).toBe(true)
  expect(listbox.hidden).toBe(true)

  select.disabled = false
  await flushMutations()

  expect(trigger.disabled).toBe(false)
})

test('dynamic native options re-render the listbox and stay selectable', async () => {
  const { root, select, trigger } = renderSelect()

  select.append(new Option('Enterprise', 'enterprise'))
  requireElement(select.querySelector<HTMLOptionElement>('option[value="free"]')).remove()
  requireElement(select.querySelector<HTMLOptionElement>('option[value="team"]')).disabled = true
  await flushMutations()

  expect([...root.querySelectorAll<HTMLElement>('[data-ui-select-option]')].map(item => item.dataset.value))
    .toEqual(['pro', 'team', 'enterprise'])
  expect(getOption('team').getAttribute('aria-disabled')).toBe('true')

  getOption('enterprise').click()

  expect(select.value).toBe('enterprise')
  expect(trigger.textContent).toBe('Enterprise')
  expect(getOption('enterprise').getAttribute('aria-selected')).toBe('true')
})

test('reconnecting does not duplicate option handlers', () => {
  const { root, select } = renderSelect()
  const changes: string[] = []

  select.addEventListener('change', () => changes.push(select.value))
  root.remove()
  document.body.append(root)
  getOption('team').click()

  expect(changes).toEqual(['team'])
})

test('re-rendering a focused option keeps the listbox open and focus on the updated option', async () => {
  const { listbox, root, select, trigger } = renderSelect()
  const after = requireElement(document.querySelector<HTMLButtonElement>('#after'))
  const replaceChildren = listbox.replaceChildren.bind(listbox)

  // Chromium blurs a focused node removed by replaceChildren; jsdom does not, so emulate that event.
  listbox.replaceChildren = (...nodes: (Node | string)[]) => {
    const active = document.activeElement

    if (active && listbox.contains(active)) {
      active.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }))
    }

    replaceChildren(...nodes)
  }

  press(trigger, 'ArrowDown')
  press(getOption('free'), 'ArrowDown')
  expect(document.activeElement).toBe(getOption('pro'))

  select.append(new Option('Archived', 'archived'))
  requireElement(select.querySelector<HTMLOptionElement>('option[value="pro"]')).label = 'Pro revised'
  await flushMutations()

  expect(listbox.hidden).toBe(false)
  expect(trigger.getAttribute('aria-expanded')).toBe('true')
  expect(document.activeElement).toBe(getOption('pro'))
  expect(getOption('pro').textContent).toBe('Pro revised')
  expect(root.querySelectorAll('[data-ui-select-option]')).toHaveLength(4)

  getOption('pro').dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: after }))
  expect(listbox.hidden).toBe(true)
})
