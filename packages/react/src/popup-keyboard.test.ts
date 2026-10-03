// @vitest-environment jsdom

import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'

import { expect, test } from 'vitest'

import { useDropdownMenu, useTooltip } from './index.js'

for (const kind of ['dropdown', 'tooltip'] as const) {
  test(`${kind} handles only unclaimed, non-composing Escape events`, () => {
    const changes: boolean[] = []
    const Popup = () => {
      const options = { defaultOpen: true, onOpenChange: (open: boolean) => changes.push(open) }
      const dropdown = useDropdownMenu(options)
      const tooltip = useTooltip(options)

      return kind === 'dropdown' ?
        createElement('div', dropdown.panelProps, 'Panel') :
        createElement('div', tooltip.rootProps, 'Tooltip owner')
    }
    const container = document.createElement('div')
    const root = createRoot(container)

    document.body.append(container)
    try {
      act(() => {
        root.render(createElement(Popup))
      })
      const target = container.firstElementChild

      if (!target) throw new Error('Expected popup owner')
      for (const state of ['canceled', 'composing', 'ordinary'] as const) {
        const event = new KeyboardEvent('keydown', {
          bubbles: true, cancelable: true, key: 'Escape', isComposing: state === 'composing'
        })

        if (state === 'canceled') event.preventDefault()
        act(() => {
          target.dispatchEvent(event)
        })
        expect(changes).toEqual(state === 'ordinary' ? [false] : [])
      }
    } finally {
      act(() => {
        root.unmount()
      })
      container.remove()
    }
  })
}
