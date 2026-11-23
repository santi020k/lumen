// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { initSelects } from './runtime/features/select.js'

afterEach(() => {
  document.body.replaceChildren()
})

const fixture = () => {
  document.body.innerHTML = `<form>
    <div data-ui-select>
      <select aria-label="Plan" data-ui-select-native name="plan">
        <option selected value="available">Available</option>
        <option disabled value="individual">Individually disabled</option>
        <optgroup label="Enabled plans"><option value="enabled">Enabled plan</option></optgroup>
        <optgroup disabled label="Unavailable plans"><option value="blocked">Blocked plan</option></optgroup>
      </select>
      <div data-ui-select-control hidden>
        <button data-ui-select-trigger type="button"><span data-ui-select-value></span></button>
        <div data-ui-select-list hidden></div>
      </div>
    </div>
  </form>`

  initSelects(document)

  const form = document.querySelector('form')
  const select = document.querySelector('select')
  const trigger = document.querySelector<HTMLButtonElement>('[data-ui-select-trigger]')
  const option = (value: string): HTMLButtonElement => {
    const button = document.querySelector<HTMLButtonElement>(`[data-ui-select-option][data-value="${value}"]`)

    if (!button) throw new Error(`Missing option ${value}`)

    return button
  }

  if (!form || !select || !trigger) throw new Error('Missing select fixture')

  return { form, option, select, trigger }
}

const key = (target: HTMLElement, value: string): void => {
  target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: value }))
}

test('enhancement preserves individual and inherited disabled options without changing submitted values', () => {
  const { form, option, select, trigger } = fixture()
  const change = vi.fn()

  select.addEventListener('change', change)
  trigger.click()

  for (const value of ['individual', 'blocked']) {
    const button = option(value)

    expect(button.disabled).toBe(true)
    expect(button.getAttribute('aria-disabled')).toBe('true')
    button.click()
    key(button, 'Enter')
    expect(select.value).toBe('available')
    expect(new FormData(form).get('plan')).toBe('available')
  }

  expect(change).not.toHaveBeenCalled()
  expect(option('enabled').disabled).toBe(false)
  option('enabled').click()
  expect(select.value).toBe('enabled')
  expect(new FormData(form).get('plan')).toBe('enabled')
  expect(change).toHaveBeenCalledOnce()
})

test('keyboard navigation and typeahead skip disabled option groups', () => {
  const { option, select, trigger } = fixture()

  trigger.focus()
  key(trigger, 'End')
  expect(document.activeElement).toBe(option('enabled'))
  key(option('enabled'), 'ArrowDown')
  expect(document.activeElement).toBe(option('available'))
  key(option('available'), 'ArrowUp')
  expect(document.activeElement).toBe(option('enabled'))
  key(option('enabled'), 'b')
  expect(document.activeElement).toBe(option('enabled'))
  key(option('enabled'), 'Escape')
  key(trigger, 'End')
  key(option('enabled'), 'Enter')
  expect(select.value).toBe('enabled')
  expect(document.activeElement).toBe(trigger)
})
