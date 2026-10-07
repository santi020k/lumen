// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'

import { expect, test, vi } from 'vitest'

import { useDropdownMenu, usePopover } from './hooks.js'

test.each([usePopover, useDropdownMenu])('%s preserves navigation within nested editable roots', async useDisclosure => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const rect = new DOMRect(0, 0, 100, 20)

  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue(Object.assign([rect], { item: (index: number) => index === 0 ? rect : null }))
  const container = document.createElement('div')

  document.body.append(container)
  const root = createRoot(container)
  const Harness = () => {
    const disclosure = useDisclosure({ defaultOpen: true })

    return createElement('div', disclosure.panelProps, createElement('button', null, 'First'), createElement('div', { 'data-editor': '', tabIndex: 0 }, createElement('span', null, 'Editable text')), createElement('button', null, 'Last'))
  }

  try {
    await act(async () => {
      await Promise.resolve()
      root.render(createElement(Harness))
    })
    const editor = container.querySelector<HTMLElement>('[data-editor]')
    const child = editor?.querySelector('span')

    if (!editor || !child) throw new Error('Missing editable disclosure fixture')

    for (const mode of ['true', '', 'plaintext-only']) {
      editor.setAttribute('contenteditable', mode)
      editor.focus()
      for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End']) {
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })

        await act(async () => {
          await Promise.resolve()
          child.dispatchEvent(event)
        })
        expect(event.defaultPrevented).toBe(false)
        expect(document.activeElement).toBe(editor)
      }
    }

    editor.setAttribute('contenteditable', 'false')
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })

    await act(async () => {
      await Promise.resolve()
      child.dispatchEvent(event)
    })
    expect(event.defaultPrevented).toBe(true)
  } finally {
    await act(async () => {
      await Promise.resolve()
      root.unmount()
    })
    container.remove()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  }
})
