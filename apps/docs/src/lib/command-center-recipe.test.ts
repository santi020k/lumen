// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'

import { expect, test, vi } from 'vitest'

import { CommandCenterRecipe } from '../../../../packages/lumen/templates/react/command-center/src/lumen/command-center.js'

test('command recipe filters and navigates without a document enhancement runtime', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const container = document.createElement('div')
  const root = createRoot(container)
  const onCommand = vi.fn()

  document.body.append(container)

  try {
    await act(async () => {
      await Promise.resolve()

      root.render(createElement(CommandCenterRecipe, { onCommand }))
    })
    const input = container.querySelector('input')

    if (!(input instanceof HTMLInputElement)) throw new Error('Expected command search')

    const search = async (value: string) => {
      await act(async () => {
        await Promise.resolve()

        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value)
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })
    }
    const key = async (target: Element, value: string) => {
      await act(async () => {
        await Promise.resolve()

        target.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true }))
      })
    }

    await search('missing')
    expect(container.querySelectorAll('button')).toHaveLength(0)
    expect(container.textContent).toContain('No matching commands.')
    await search(' REVIEW ')
    const review = container.querySelector('button')

    if (!(review instanceof HTMLButtonElement)) throw new Error('Expected review command')

    await key(input, 'ArrowDown')
    expect(document.activeElement).toBe(review)
    await act(async () => {
      await Promise.resolve()

      review.click()
    })
    expect(onCommand).toHaveBeenCalledExactlyOnceWith('review')
    expect(container.textContent).toContain('Selected: Review pending proposals')
    await key(review, 'Escape')
    expect(document.activeElement).toBe(input)
    await search('')
    const buttons = [...container.querySelectorAll('button')]
    const first = buttons[0]
    const last = buttons[2]

    if (!first || !last) throw new Error('Expected all commands')

    await key(input, 'ArrowDown')
    expect(document.activeElement).toBe(first)
    await key(first, 'ArrowUp')
    expect(document.activeElement).toBe(last)
    await key(last, 'Home')
    expect(document.activeElement).toBe(first)
    await key(first, 'End')
    expect(document.activeElement).toBe(last)
  } finally {
    await act(async () => {
      await Promise.resolve()

      root.unmount()
    })
    container.remove()
    vi.unstubAllGlobals()
  }
})
