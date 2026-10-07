// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'

import { expect, test, vi } from 'vitest'

import { useContextMenu, useTooltip } from './hooks.js'

const run = async (action: () => void) => act(async () => {
  await Promise.resolve()
  action()
})

const Menu = () => {
  const menu = useContextMenu()

  return createElement('div', null, createElement('button', { ...menu.triggerProps, id: 'trigger' }, 'Context'), createElement('div', { ...menu.menuProps, id: 'menu' }, 'Actions'))
}
const Tooltip = () => {
  const tooltip = useTooltip()

  return createElement('div', null, createElement('div', { ...tooltip.rootProps, id: 'owner' }, createElement('button', { id: 'first' }, 'First'), createElement('button', { id: 'second' }, 'Second')), createElement('div', tooltip.tooltipProps, 'Help'))
}

for (const framed of [false, true]) {
  test(`context menus dismiss outside pointer presses in ${framed ? 'iframe' : 'main'} documents`, async () => {
    const iframe = framed ? document.createElement('iframe') : undefined

    if (iframe) document.body.append(iframe)

    const owner = iframe?.contentDocument ?? document
    const host = owner.createElement('div')
    const outside = owner.createElement('button')
    const MouseEventType = owner.defaultView?.MouseEvent

    if (!MouseEventType) throw new Error('Missing document view')

    owner.body.append(host, outside)
    const root = createRoot(host)
    try {
      await run(() => {
        root.render(createElement(Menu))
      })
      const trigger = host.querySelector<HTMLButtonElement>('#trigger')
      const menu = host.querySelector<HTMLElement>('#menu')

      if (!trigger || !menu) throw new Error('Missing menu controls')

      await run(() => trigger.dispatchEvent(new MouseEventType('contextmenu', { bubbles: true, cancelable: true })))
      expect(menu.hidden).toBe(false)
      await run(() => menu.dispatchEvent(new MouseEventType('pointerdown', { bubbles: true })))
      expect(menu.hidden).toBe(false)
      await run(() => trigger.dispatchEvent(new MouseEventType('pointerdown', { bubbles: true })))
      expect(menu.hidden).toBe(false)
      await run(() => outside.dispatchEvent(new MouseEventType('pointerdown', { bubbles: true })))
      expect(menu.hidden).toBe(true)
    } finally {
      await run(() => {
        root.unmount()
      })
      host.remove()
      outside.remove()
      iframe?.remove()
    }
  })
}

test.each([false, true])('context menu activation and keyboard focus use the owning iframe document (adopted item: %s)', async adopted => {
  const frame = document.createElement('iframe')

  document.body.append(frame)
  const owner = frame.contentDocument

  if (!owner?.defaultView) throw new Error('Missing iframe document')

  const host = owner.createElement('div')
  const MouseEventType = owner.defaultView.MouseEvent
  const KeyboardEventType = owner.defaultView.KeyboardEvent

  owner.body.append(host)
  const root = createRoot(host)
  const Actions = () => {
    const menu = useContextMenu({ defaultOpen: true })

    return createElement('div', menu.menuProps, createElement('button', { role: 'menuitem', id: 'first-action' }, createElement('span', null, 'First')), createElement('button', { role: 'menuitem', id: 'second-action' }, 'Second'))
  }

  try {
    await run(() => {
      root.render(createElement(Actions))
    })
    const menu = host.querySelector<HTMLElement>('[role="menu"]')
    const first = host.querySelector<HTMLButtonElement>('#first-action')
    const second = host.querySelector<HTMLButtonElement>('#second-action')
    const label = adopted ? document.createElement('span') : first?.querySelector('span')

    if (!menu || !first || !second || !label) throw new Error('Missing menu items')

    if (adopted) first.replaceChildren(owner.adoptNode(label))

    Object.defineProperty(first, 'checkVisibility', { value: () => true })
    Object.defineProperty(second, 'checkVisibility', { value: () => true })
    first.focus()
    await run(() => first.dispatchEvent(new KeyboardEventType('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })))
    expect(owner.activeElement).toBe(second)
    await run(() => label.dispatchEvent(new MouseEventType('click', { bubbles: true })))
    expect(menu.hidden).toBe(true)
  } finally {
    await run(() => {
      root.unmount()
    })
    frame.remove()
  }
})

for (const opened of [false, true]) {
  test(`tooltip focus leave ${opened ? 'closes the visible tooltip' : 'cancels pending opening'}`, async () => {
    vi.useFakeTimers()
    const host = document.createElement('div')
    const outside = document.createElement('button')

    document.body.append(host, outside)
    const root = createRoot(host)
    try {
      await run(() => {
        root.render(createElement(Tooltip))
      })
      const first = host.querySelector<HTMLButtonElement>('#first')
      const second = host.querySelector<HTMLButtonElement>('#second')

      if (!first || !second) throw new Error('Missing tooltip controls')

      await run(() => {
        first.focus()
      })
      if (opened) {
        await act(() => vi.advanceTimersByTimeAsync(0))
        await run(() => {
          second.focus()
        })
      }
      expect(host.querySelector<HTMLElement>('[role="tooltip"]')?.hidden).toBe(!opened)
      await run(() => {
        outside.focus()
      })
      await act(() => vi.advanceTimersByTimeAsync(300))
      expect(host.querySelector<HTMLElement>('[role="tooltip"]')?.hidden).toBe(true)
      expect(host.querySelector('#owner')?.hasAttribute('aria-describedby')).toBe(false)
    } finally {
      await run(() => {
        root.unmount()
      })
      host.remove()
      outside.remove()
      vi.useRealTimers()
    }
  })
}
