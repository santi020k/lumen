// @vitest-environment jsdom

import { act, createElement, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { afterEach, describe, expect, test } from 'vitest'

import { Combobox, type ComboboxProps, usePopover } from './index.js'

const mounted: { container: HTMLDivElement, root: Root }[] = []

const requireInput = (root: ParentNode): HTMLInputElement => {
  const element = root.querySelector('[role="combobox"]')

  if (!(element instanceof HTMLInputElement)) {
    throw new Error('Expected Combobox input')
  }

  return element
}

const requireListbox = (root: ParentNode): HTMLElement => {
  const element = root.querySelector('[role="listbox"]')

  if (!(element instanceof HTMLElement)) {
    throw new Error('Expected Combobox listbox')
  }

  return element
}

const press = async (element: Element, key: string): Promise<void> => {
  await act(async () => {
    element.dispatchEvent(new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key
    }))

    await Promise.resolve()
  })
}

const renderCombobox = (props: Partial<ComboboxProps> = {}) => {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  mounted.push({ container, root })

  act(() => {
    root.render(createElement(Combobox, {
      label: 'Framework',
      list: 'framework-options',
      options: ['Astro', 'React', 'Web Components'],
      ...props
    }))
  })

  const input = requireInput(container)
  const listbox = requireListbox(container)
  const options = [...container.querySelectorAll<HTMLButtonElement>('[role="option"]')]

  return { container, root, input, listbox, options }
}

afterEach(() => {
  while (mounted.length > 0) {
    const entry = mounted.pop()

    if (!entry) continue

    act(() => {
      entry.root.unmount()
    })

    entry.container.remove()
  }
})

describe('Combobox', () => {
  test('traverses and commits options with the shared keyboard contract', async () => {
    const { input, listbox, options } = renderCombobox()

    expect(options.map(option => option.tabIndex)).toEqual([-1, -1, -1])

    act(() => {
      input.focus()
    })

    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(listbox.hidden).toBe(false)

    await press(input, 'ArrowDown')

    expect(document.activeElement).toBe(input)
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0]?.id)

    await press(input, 'ArrowDown')

    expect(input.getAttribute('aria-activedescendant')).toBe(options[1]?.id)

    await press(input, 'ArrowDown')

    expect(input.getAttribute('aria-activedescendant')).toBe(options[2]?.id)

    await press(input, 'Enter')

    expect(input.value).toBe('Web Components')
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(listbox.hidden).toBe(true)
    expect(document.activeElement).toBe(input)
  })
})

test('ignores composition and preserves ordinary editing and form submission keys', async () => {
  const { input, listbox } = renderCombobox()

  act(() => {
    input.focus()
  })
  await press(input, 'ArrowDown')
  for (const key of ['Enter', 'Escape', 'ArrowDown']) {
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key, isComposing: true })

    act(() => {
      input.dispatchEvent(event)
    })
    expect(event.defaultPrevented).toBe(false)
  }
  expect(input.value).toBe('')
  expect(listbox.hidden).toBe(false)
  for (const key of ['Home', 'End', 'ArrowLeft', 'ArrowRight']) {
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key })

    act(() => {
      input.dispatchEvent(event)
    })
    expect(event.defaultPrevented).toBe(false)
  }
  await press(input, 'Escape')
  const enter = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' })

  act(() => {
    input.dispatchEvent(enter)
  })
  expect(enter.defaultPrevented).toBe(false)
})

test('honors canceled navigation and readonly inputs', async () => {
  const { input } = renderCombobox({ onKeyDown: event => {
    event.preventDefault()
  } })

  act(() => {
    input.focus()
  })
  await press(input, 'ArrowDown')
  expect(input.hasAttribute('aria-activedescendant')).toBe(false)
  const readonly = renderCombobox({ list: 'readonly-list', readOnly: true })

  act(() => {
    readonly.input.focus()
  })
  await press(readonly.input, 'ArrowDown')
  expect(readonly.listbox.hidden).toBe(true)
})

test('updates active descendants when options are removed or replaced', async () => {
  const { root, input } = renderCombobox()

  act(() => {
    input.focus()
  })
  await press(input, 'ArrowDown')
  act(() => {
    root.render(createElement(Combobox, { label: 'Framework', list: 'framework-options', options: [] }))
  })
  expect(input.hasAttribute('aria-activedescendant')).toBe(false)
  act(() => {
    root.render(createElement(Combobox, { label: 'Framework', list: 'framework-options', options: ['New choice'] }))
  })
  await press(input, 'ArrowDown')
  const active = document.getElementById(input.getAttribute('aria-activedescendant') ?? '')

  expect(active?.textContent).toBe('New choice')
  await press(input, 'Enter')
  expect(input.value).toBe('New choice')
})

test('notifies a controlled input when an option is committed', async () => {
  const changes: string[] = []
  const Controlled = () => {
    const [value, setValue] = useState('')

    return createElement(Combobox, { list: 'controlled-list',
      options: ['Astro', 'React'],
      value,
      onChange: event => {
        changes.push(event.currentTarget.value)
        setValue(event.currentTarget.value)
      }
    })
  }
  const { root, container } = renderCombobox()

  act(() => {
    root.render(createElement(Controlled))
  })
  const input = requireInput(container)

  act(() => {
    input.focus()
  })
  await press(input, 'ArrowDown')
  await press(input, 'Enter')
  expect(input.value).toBe('Astro')
  expect(changes).toEqual(['Astro'])
})

test('nested popovers leave handled Escape and text editing to the inner control', async () => {
  const Nested = () => {
    const outer = usePopover({ defaultOpen: true })
    const inner = usePopover({ defaultOpen: true })

    return createElement('div', outer.rootProps, createElement('button', outer.triggerProps, 'Outer'), createElement('div', outer.panelProps, createElement('div', inner.rootProps, createElement('button', inner.triggerProps, 'Inner'), createElement('div', inner.panelProps, createElement(Combobox, { list: 'nested-list', options: ['Astro'] })))))
  }
  const { root, container } = renderCombobox()

  act(() => {
    root.render(createElement(Nested))
  })
  const input = requireInput(container)
  const triggers = [...container.querySelectorAll<HTMLButtonElement>('[data-ui-trigger]')]
  const innerTrigger = triggers[1]

  if (!innerTrigger) throw new Error('Expected inner trigger')
  act(() => {
    input.focus()
  })
  await press(input, 'Escape')
  expect(triggers.map(trigger => trigger.getAttribute('aria-expanded'))).toEqual(['true', 'true'])
  await press(input, 'Home')
  expect(document.activeElement).toBe(input)
  await press(input, 'Escape')
  expect(triggers.map(trigger => trigger.getAttribute('aria-expanded'))).toEqual(['true', 'false'])
  expect(document.activeElement).toBe(innerTrigger)
  await press(innerTrigger, 'Escape')
  expect(triggers.map(trigger => trigger.getAttribute('aria-expanded'))).toEqual(['false', 'false'])
})
