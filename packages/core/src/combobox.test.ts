// @vitest-environment jsdom

import { afterEach, describe, expect, test, vi } from 'vitest'

import { createLumenComboboxController } from './combobox.js'

const cleanups: (() => void)[] = []
const fixture = (form?: HTMLFormElement) => {
  const root = document.createElement('div')

  root.innerHTML = `<label>Framework<input role="combobox"></label><div role="listbox">
    <button role="option" data-value="astro">Astro</button>
    <button role="option" data-value="react">React</button>
    <button role="option" data-value="vue" disabled>Vue</button>
  </div>`
  if (form) {
    document.body.append(form)
    form.append(root)
  } else {
    document.body.append(root)
  }
  const input = root.querySelector('input')
  const list = root.querySelector<HTMLElement>('[role="listbox"]')

  if (!input || !list) throw new Error('Missing Combobox fixture')
  const controller = createLumenComboboxController(root)

  cleanups.push(controller.destroy)
  return { root, input, list, controller }
}
const press = (input: HTMLElement, key: string, extra: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key, ...extra })

  input.dispatchEvent(event)
  return event
}
const type = (input: HTMLInputElement, value: string) => {
  input.value = value
  input.dispatchEvent(new InputEvent('input', { bubbles: true }))
}
const activeText = (input: HTMLInputElement) => document.getElementById(input.getAttribute('aria-activedescendant') ?? '')?.textContent

afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup()
  document.body.replaceChildren()
  vi.useRealTimers()
})

describe('Combobox DOM controller', () => {
  test('accepted reset closes stale options and filters using the restored default without changes', () => {
    vi.useFakeTimers()
    const form = document.createElement('form')
    const { input, list } = fixture(form)
    input.defaultValue = 'astro'
    const change = vi.fn()
    input.addEventListener('change', change)
    type(input, 'rea')
    press(input, 'ArrowDown')
    expect(activeText(input)).toBe('React')
    form.reset()
    vi.runAllTimers()
    expect(input.value).toBe('astro')
    expect(list.hidden).toBe(true)
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(input.hasAttribute('aria-activedescendant')).toBe(false)
    expect(list.querySelector('[data-value="react"]')?.hasAttribute('hidden')).toBe(true)
    expect(change).not.toHaveBeenCalled()
    press(input, 'ArrowDown')
    expect(activeText(input)).toBe('Astro')
  })

  test('cancelled reset preserves the open list and active option', () => {
    vi.useFakeTimers()
    const form = document.createElement('form')
    const { input, list } = fixture(form)
    form.addEventListener('reset', event => {
      event.preventDefault()
    })
    type(input, 'rea')
    press(input, 'ArrowDown')
    form.reset()
    vi.runAllTimers()
    expect(input.value).toBe('rea')
    expect(list.hidden).toBe(false)
    expect(activeText(input)).toBe('React')
  })

  test('destroy cancels pending reset work and removes the reset listener', () => {
    vi.useFakeTimers()
    const form = document.createElement('form')
    const { controller } = fixture(form)
    form.reset()
    expect(vi.getTimerCount()).toBe(1)
    controller.destroy()
    expect(vi.getTimerCount()).toBe(0)
    form.reset()
    expect(vi.getTimerCount()).toBe(0)
  })

  test('keeps editing focus, skips disabled choices, commits the active option once', () => {
    const { input, list } = fixture()
    const changes: string[] = []

    input.addEventListener('change', () => changes.push(input.value))
    input.focus()
    press(input, 'ArrowUp')
    expect(activeText(input)).toBe('React')
    expect(document.activeElement).toBe(input)
    press(input, 'ArrowDown')
    expect(activeText(input)).toBe('Astro')
    press(input, 'ArrowDown')
    press(input, 'Enter')
    expect(input.value).toBe('react')
    expect(changes).toEqual(['react'])
    expect(list.hidden).toBe(true)
    expect(input.hasAttribute('aria-activedescendant')).toBe(false)
    expect(press(input, 'Enter').defaultPrevented).toBe(false)
  })

  test('leaves text editing keys alone and clears the active option after typing', () => {
    const { input } = fixture()

    input.focus()
    press(input, 'ArrowDown')
    for (const key of ['Home', 'End', 'ArrowLeft', 'ArrowRight']) {
      expect(press(input, key).defaultPrevented).toBe(false)
    }
    type(input, 'rea')
    expect(input.hasAttribute('aria-activedescendant')).toBe(false)
    expect(press(input, 'Enter').defaultPrevented).toBe(false)
    press(input, 'ArrowDown')
    expect(activeText(input)).toBe('React')
  })

  test('ignores composing and canceled shortcuts', () => {
    const { input, list } = fixture()

    input.focus()
    press(input, 'ArrowDown')
    for (const key of ['Enter', 'Escape', 'ArrowDown']) {
      expect(press(input, key, { isComposing: true }).defaultPrevented).toBe(false)
    }
    expect(activeText(input)).toBe('Astro')
    expect(input.value).toBe('')
    expect(list.hidden).toBe(false)
    const canceled = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' })

    canceled.preventDefault()
    input.dispatchEvent(canceled)
    expect(input.value).toBe('')
  })

  test('discovers new options, filters labels, and clears removed or disabled active options', async () => {
    const { input, list } = fixture()

    input.focus()
    type(input, 'angular')
    const option = document.createElement('button')

    option.setAttribute('role', 'option')
    option.dataset.value = 'ng'
    option.textContent = 'Angular'
    list.append(option)
    await Promise.resolve()
    expect(option.tabIndex).toBe(-1)
    press(input, 'ArrowDown')
    expect(activeText(input)).toBe('Angular')
    option.disabled = true
    await Promise.resolve()
    expect(input.hasAttribute('aria-activedescendant')).toBe(false)
    option.disabled = false
    await Promise.resolve()
    press(input, 'ArrowDown')
    option.remove()
    await Promise.resolve()
    expect(input.hasAttribute('aria-activedescendant')).toBe(false)
  })

  test('delegates pointer selection to new options and refuses disabled choices', () => {
    const { input, list } = fixture()

    input.focus()
    const option = document.createElement('button')

    option.setAttribute('role', 'option')
    option.textContent = 'New choice'
    option.setAttribute('aria-disabled', 'true')
    list.append(option)
    option.click()
    expect(input.value).toBe('')
    option.removeAttribute('aria-disabled')
    option.click()
    expect(input.value).toBe('New choice')
    expect(document.activeElement).toBe(input)
    expect(list.hidden).toBe(true)
  })

  test('handles only the first Escape and closes when focus leaves', () => {
    const { root, input, list } = fixture()
    const outside = document.createElement('button')

    document.body.append(outside)
    input.focus()
    expect(press(input, 'Escape').defaultPrevented).toBe(true)
    expect(press(input, 'Escape').defaultPrevented).toBe(false)
    type(input, '')
    outside.focus()
    expect(list.hidden).toBe(true)
    root.remove()
  })

  test('respects readonly and disabled inputs and releases listeners on destroy', () => {
    const { input, list, controller } = fixture()

    input.readOnly = true
    input.focus()
    expect(press(input, 'ArrowDown').defaultPrevented).toBe(false)
    expect(list.hidden).toBe(true)
    input.readOnly = false
    input.disabled = true
    expect(press(input, 'ArrowDown').defaultPrevented).toBe(false)
    input.disabled = false
    controller.destroy()
    type(input, 'rea')
    expect(list.hidden).toBe(true)
  })
})
