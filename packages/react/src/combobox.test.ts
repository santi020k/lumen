// @vitest-environment jsdom

import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { afterEach, describe, expect, test } from 'vitest'

import { Combobox } from './index.js'

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

const requireOption = (
  options: HTMLButtonElement[],
  index: number
): HTMLButtonElement => {
  const option = options[index]

  if (!option) throw new Error(`Expected Combobox option at index ${index}`)

  return option
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

const renderCombobox = () => {
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  mounted.push({ container, root })

  act(() => {
    root.render(createElement(Combobox, {
      label: 'Framework',
      list: 'framework-options',
      options: ['Astro', 'React', 'Web Components']
    }))
  })

  const input = requireInput(container)
  const listbox = requireListbox(container)
  const options = [...container.querySelectorAll<HTMLButtonElement>('[role="option"]')]

  return { input, listbox, options }
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

    expect(document.activeElement).toBe(options[0])

    await press(requireOption(options, 0), 'ArrowDown')

    expect(document.activeElement).toBe(options[1])

    await press(requireOption(options, 1), 'End')

    expect(document.activeElement).toBe(options[2])

    await press(requireOption(options, 2), 'Enter')

    expect(input.value).toBe('Web Components')
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(listbox.hidden).toBe(true)
    expect(document.activeElement).toBe(input)
  })
})
