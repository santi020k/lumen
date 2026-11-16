import { getScopeActiveElement } from '../relationships.js'
import { queryScope } from '../scope.js'

import { getLoopedIndex } from './shared.js'

const speedDialItemSelector = '[role="menuitem"], button, a[href]'

const isSpeedDialDisabled = (element: HTMLElement): boolean => (
  element.matches(':disabled, [aria-disabled="true"]')
)

const isSpeedDialHiddenOrInert = (element: HTMLElement): boolean => (
  element.closest('[hidden], [inert]') !== null
)

const isForeignOwned = (element: Element): boolean => element.closest('[data-ui-owner]') !== null

const getSpeedDialItems = (root: HTMLElement, actions: HTMLElement): HTMLElement[] => [
  ...actions.querySelectorAll<HTMLElement>(speedDialItemSelector)
].filter(item => (
  item.closest('[data-ui-speed-dial]') === root &&
  !isForeignOwned(item) &&
  !item.matches(':disabled') &&
  !isSpeedDialHiddenOrInert(item)
))

export const closeSpeedDial = (root: HTMLElement, restoreFocus = false): void => {
  const trigger = root.querySelector<HTMLButtonElement>('[data-ui-speed-dial-trigger]')

  root.dataset.state = 'closed'

  trigger?.setAttribute('aria-expanded', 'false')

  if (restoreFocus) trigger?.focus()
}

const speedDialNavigationKeys = ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'End', 'Home']

const hasSpeedDialModifiers = (event: KeyboardEvent): boolean => (
  event.altKey || event.ctrlKey || event.metaKey
)

const getSpeedDialTargetIndex = (key: string, currentIndex: number, count: number): number => {
  if (currentIndex < 0 && ['ArrowUp', 'ArrowLeft'].includes(key)) return count - 1

  return getLoopedIndex(key, currentIndex, count, ['ArrowDown', 'ArrowRight'])
}

const getSpeedDialFocusPosition = (key: string): 'first' | 'last' | undefined => {
  if (key === 'ArrowDown' || key === 'ArrowRight') return 'first'

  if (key === 'ArrowLeft' || key === 'ArrowUp') return 'last'

  return undefined
}

const bindSpeedDials = (root: HTMLElement): void => {
  const trigger = root.querySelector<HTMLButtonElement>('[data-ui-speed-dial-trigger]')
  const actions = root.querySelector<HTMLElement>('[data-ui-speed-dial-actions]')

  if (
    !trigger ||
    !actions ||
    isForeignOwned(root) ||
    isForeignOwned(trigger) ||
    isForeignOwned(actions) ||
    trigger.closest('[data-ui-speed-dial]') !== root ||
    actions.closest('[data-ui-speed-dial]') !== root ||
    root.dataset.uiBound === 'true'
  ) return

  root.dataset.uiBound = 'true'

  root.dataset.state = root.dataset.state === 'open' ? 'open' : 'closed'

  trigger.setAttribute('aria-expanded', String(root.dataset.state === 'open'))

  const open = (focusPosition?: 'first' | 'last') => {
    const items = getSpeedDialItems(root, actions)

    root.dataset.state = 'open'

    trigger.setAttribute('aria-expanded', 'true')

    if (focusPosition === 'first') items[0]?.focus()

    if (focusPosition === 'last') items.at(-1)?.focus()
  }

  trigger.addEventListener('click', event => {
    if (event.defaultPrevented || isSpeedDialDisabled(trigger) || isSpeedDialHiddenOrInert(trigger)) return

    if (root.dataset.state === 'open') {
      closeSpeedDial(root)
    } else {
      open()
    }
  })

  trigger.addEventListener('keydown', event => {
    if (
      event.defaultPrevented ||
      event.isComposing ||
      hasSpeedDialModifiers(event) ||
      isSpeedDialDisabled(trigger) ||
      isSpeedDialHiddenOrInert(trigger)
    ) return

    if (event.key === 'Escape' && root.dataset.state === 'open') {
      event.preventDefault()

      closeSpeedDial(root)

      return
    }

    const focusPosition = getSpeedDialFocusPosition(event.key)

    if (!focusPosition) return

    event.preventDefault()

    open(focusPosition)
  })

  actions.addEventListener('click', event => {
    if (event.defaultPrevented) return

    const item = event.target instanceof Element ?
      event.target.closest<HTMLElement>(speedDialItemSelector) :
      null

    if (!item || isForeignOwned(item)) return

    if (item.closest('[data-ui-speed-dial]') !== root || isSpeedDialHiddenOrInert(item)) return

    if (isSpeedDialDisabled(item)) {
      event.preventDefault()

      return
    }

    closeSpeedDial(root)
  })

  const isOwnedActionsKeydown = (event: KeyboardEvent): boolean => {
    if (event.defaultPrevented || event.isComposing || hasSpeedDialModifiers(event)) return false

    const target = event.target instanceof Element ? event.target : null

    if (target && isForeignOwned(target)) return false

    const ownerRoot = target?.closest<HTMLElement>('[data-ui-speed-dial]') ?? null

    return ownerRoot === null || ownerRoot === root
  }

  actions.addEventListener('keydown', event => {
    if (!isOwnedActionsKeydown(event)) return

    if (event.key === 'Escape') {
      event.preventDefault()

      closeSpeedDial(root, true)

      return
    }

    if (!speedDialNavigationKeys.includes(event.key)) return

    const items = getSpeedDialItems(root, actions)

    if (!items.length) return

    const active = getScopeActiveElement(root)
    const currentIndex = items.findIndex(item => item === active)
    const targetIndex = getSpeedDialTargetIndex(event.key, currentIndex, items.length)

    event.preventDefault()

    items[targetIndex]?.focus()
  })
}

export const initSpeedDials = (scope: ParentNode): void => {
  for (const root of queryScope(scope, '[data-ui-speed-dial]')) bindSpeedDials(root)
}
