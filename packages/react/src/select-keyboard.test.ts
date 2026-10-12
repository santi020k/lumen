// @vitest-environment jsdom

import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { afterEach, expect, test } from 'vitest'

import { Select } from './index.js'

const mounted: { container: HTMLElement, root: Root }[] = []

const requireElement = <T extends Element>(element: T | null | undefined): T => {
  if (!element) throw new Error('Expected select fixture element')

  return element
}

const press = (element: Element, key: string): void => {
  act(() => {
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key }))
  })
}

const renderSelect = (options: string[]): {
  changes: string[]
  container: HTMLElement
  listbox: HTMLElement
  trigger: HTMLButtonElement
} => {
  const changes: string[] = []
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)
  mounted.push({ container, root })

  act(() => {
    root.render(createElement(
      'div', null, createElement(Select, {
        'aria-label': 'City',
        onValueChange: (value: string) => changes.push(value),
        options
      }), createElement('button', { id: 'after', type: 'button' }, 'After')
    ))
  })

  return {
    changes,
    container,
    listbox: requireElement(container.querySelector<HTMLElement>('[data-ui-select-list]')),
    trigger: requireElement(container.querySelector<HTMLButtonElement>('[data-ui-select-trigger]'))
  }
}

const getOption = (container: HTMLElement, value: string): HTMLElement => requireElement(
  [...container.querySelectorAll<HTMLElement>('[data-ui-select-option]')].find(item => item.dataset.value === value)
)

afterEach(() => {
  for (const { container, root } of mounted.splice(0)) {
    act(() => {
      root.unmount()
    })
    container.remove()
  }
})

test('an iframe select keeps internal keyboard focus and closes when focus leaves', () => {
  const frame = document.createElement('iframe')

  document.body.append(frame)
  const owner = frame.contentDocument

  if (!owner) throw new Error('Missing iframe select document')

  const root = createRoot(owner.body)

  mounted.push({ container: frame, root })
  act(() => {
    root.render(createElement('div', null, createElement(Select, { 'aria-label': 'Plan', options: ['Free', 'Pro'] }), createElement('button', { id: 'after', type: 'button' }, 'After')))
  })

  const trigger = requireElement(owner.querySelector<HTMLButtonElement>('[data-ui-select-trigger]'))
  const listbox = requireElement(owner.querySelector<HTMLElement>('[data-ui-select-list]'))
  const after = requireElement(owner.querySelector<HTMLButtonElement>('#after'))

  act(() => {
    trigger.focus()
  })
  press(trigger, ' ')

  expect(listbox.hidden).toBe(false)
  expect(owner.activeElement).toBe(getOption(owner.body, 'Free'))

  press(getOption(owner.body, 'Free'), 'ArrowDown')
  expect(owner.activeElement).toBe(getOption(owner.body, 'Pro'))
  expect(listbox.hidden).toBe(false)

  act(() => {
    after.focus()
  })
  expect(listbox.hidden).toBe(true)
  expect(trigger.getAttribute('aria-expanded')).toBe('false')
})

test('Space opens the select and selects the focused option', () => {
  const { changes, container, listbox, trigger } = renderSelect(['Free', 'Pro', 'Team'])

  act(() => {
    trigger.focus()
  })
  press(trigger, ' ')

  expect(listbox.hidden).toBe(false)
  expect(document.activeElement).toBe(getOption(container, 'Free'))

  press(getOption(container, 'Free'), 'ArrowDown')
  press(getOption(container, 'Pro'), ' ')

  expect(changes).toEqual(['Pro'])
  expect(listbox.hidden).toBe(true)
  expect(document.activeElement).toBe(trigger)
})

test('Space continues an active typeahead query instead of selecting', () => {
  const { changes, trigger } = renderSelect(['New Haven', 'New York', 'Newark'])

  act(() => {
    trigger.focus()
  })

  for (const key of ['n', 'e', 'w', ' ', 'y']) {
    press(requireElement(document.activeElement), key)
  }

  expect(document.activeElement?.textContent).toBe('New York')
  expect(changes).toEqual([])
})

test('moving focus outside the select closes its listbox', () => {
  const { container, listbox, trigger } = renderSelect(['Free', 'Pro'])
  const after = requireElement(container.querySelector<HTMLButtonElement>('#after'))

  press(trigger, 'ArrowDown')
  expect(listbox.hidden).toBe(false)

  act(() => {
    getOption(container, 'Free').dispatchEvent(new FocusEvent('focusout', {
      bubbles: true,
      relatedTarget: getOption(container, 'Pro')
    }))
  })
  expect(listbox.hidden).toBe(false)

  act(() => {
    getOption(container, 'Free').dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: after }))
  })
  expect(listbox.hidden).toBe(true)
  expect(trigger.getAttribute('aria-expanded')).toBe('false')
})

test('the listbox shares the trigger accessible name', () => {
  const { listbox, trigger } = renderSelect(['Free', 'Pro'])

  expect(trigger.getAttribute('aria-label')).toBe('City')
  expect(listbox.getAttribute('aria-label')).toBe('City')
})

const openingKeys = [
  { expected: 'Pro', key: ' ' },
  { expected: 'Pro', key: 'Enter' },
  { expected: 'Team', key: 'ArrowDown' },
  { expected: 'Free', key: 'ArrowUp' },
  { expected: 'Free', key: 'Home' },
  { expected: 'Team', key: 'End' },
  { expected: 'Team', key: 't' }
]

for (const { expected, key } of openingKeys) {
  test(`opening with ${JSON.stringify(key)} focuses ${expected} only after the listbox is visible`, () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    const hiddenAtFocus: boolean[] = []

    document.body.append(container)
    mounted.push({ container, root })

    act(() => {
      root.render(createElement(Select, { 'aria-label': 'Plan', defaultValue: 'Pro', options: ['Free', 'Pro', 'Team'] }))
    })

    const listbox = requireElement(container.querySelector<HTMLElement>('[data-ui-select-list]'))
    const trigger = requireElement(container.querySelector<HTMLButtonElement>('[data-ui-select-trigger]'))

    // Browsers cannot focus an option inside a hidden listbox, so record visibility when focus lands.
    listbox.addEventListener('focusin', () => hiddenAtFocus.push(listbox.hidden === true))
    act(() => {
      trigger.focus()
    })
    press(trigger, key)

    expect(listbox.hidden).toBe(false)
    expect(document.activeElement).toBe(getOption(container, expected))
    expect(hiddenAtFocus).toEqual([false])
  })
}

test('closing before the open render commits discards the pending option focus', () => {
  const { container, listbox, trigger } = renderSelect(['Free', 'Pro'])
  const after = requireElement(container.querySelector<HTMLButtonElement>('#after'))

  act(() => {
    trigger.focus()
    trigger.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowDown' }))
    trigger.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: after }))
    after.focus()
  })

  expect(listbox.hidden).toBe(true)
  expect(document.activeElement).toBe(after)
})

test('unmounting with a pending option focus does not throw', () => {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)
  act(() => {
    root.render(createElement(Select, { 'aria-label': 'Plan', options: ['Free', 'Pro'] }))
  })

  const trigger = requireElement(container.querySelector<HTMLButtonElement>('[data-ui-select-trigger]'))

  expect(() => {
    act(() => {
      trigger.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowDown' }))
      root.unmount()
    })
  }).not.toThrow()
  container.remove()
})
