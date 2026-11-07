import { queryScope } from '../scope.js'

import { getLoopedIndex } from './shared.js'

export const closeSpeedDial = (root: HTMLElement, restoreFocus = false): void => {
  const trigger = root.querySelector<HTMLButtonElement>('[data-ui-speed-dial-trigger]')

  root.dataset.state = 'closed'

  trigger?.setAttribute('aria-expanded', 'false')

  if (restoreFocus) trigger?.focus()
}

const speedDialNavigationKeys = ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'End', 'Home']

const bindSpeedDials = (root: HTMLElement): void => {
  const trigger = root.querySelector<HTMLButtonElement>('[data-ui-speed-dial-trigger]')
  const actions = root.querySelector<HTMLElement>('[data-ui-speed-dial-actions]')

  if (!trigger || !actions || root.dataset.uiBound === 'true') return

  const items = [...actions.querySelectorAll<HTMLElement>('[role="menuitem"], button:not([disabled]), a[href]')]

  root.dataset.uiBound = 'true'

  root.dataset.state = root.dataset.state === 'open' ? 'open' : 'closed'

  trigger.setAttribute('aria-expanded', String(root.dataset.state === 'open'))

  const open = (focusPosition?: 'first' | 'last') => {
    root.dataset.state = 'open'

    trigger.setAttribute('aria-expanded', 'true')

    if (focusPosition === 'first') items[0]?.focus()

    if (focusPosition === 'last') items.at(-1)?.focus()
  }

  trigger.addEventListener('click', () => {
    if (root.dataset.state === 'open') {
      closeSpeedDial(root)
    } else {
      open()
    }
  })

  trigger.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.isComposing) return

    if (event.key === 'Escape' && root.dataset.state === 'open') {
      event.preventDefault()

      closeSpeedDial(root)

      return
    }

    if (['ArrowDown', 'ArrowRight'].includes(event.key)) {
      event.preventDefault()

      open('first')

      return
    }

    if (['ArrowLeft', 'ArrowUp'].includes(event.key)) {
      event.preventDefault()

      open('last')
    }
  })

  actions.addEventListener('click', event => {
    if (event.target instanceof Element && event.target.closest('[role="menuitem"], button, a')) {
      closeSpeedDial(root)
    }
  })

  actions.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.isComposing) return

    if (event.key === 'Escape') {
      event.preventDefault()

      closeSpeedDial(root, true)

      return
    }

    if (!speedDialNavigationKeys.includes(event.key)) return

    const currentIndex = items.findIndex(item => item === document.activeElement)

    const targetIndex = getLoopedIndex(
      event.key, currentIndex, items.length, ['ArrowDown', 'ArrowRight']
    )

    event.preventDefault()

    items[targetIndex]?.focus()
  })
}

export const initSpeedDials = (scope: ParentNode): void => {
  for (const root of queryScope(scope, '[data-ui-speed-dial]')) bindSpeedDials(root)
}
