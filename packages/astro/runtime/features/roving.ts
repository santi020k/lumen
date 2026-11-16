import { getLumenDirectionalKey } from '@santi020k/lumen-core'

import { queryScope } from '../scope.js'

import { getLoopedIndex } from './shared.js'

const groupSelector = [
  '[data-ui-menubar]',
  '[data-ui-radio-group]',
  '[data-ui-toggle-group]',
  '[data-ui-toolbar]'
].join(', ')

const itemSelector =
  'button, a[href], input[type="radio"], [role="menuitem"], [role="radio"]'

const rovingKeys = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'])
const isForeignOwned = (element: Element): boolean => element.closest('[data-ui-owner]') !== null

const getOwnedRovingItems = (root: HTMLElement): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>(itemSelector)
].filter(item => item.closest(groupSelector) === root && !isForeignOwned(item))

const isNavigableRovingItem = (item: HTMLElement): boolean => (
  !item.matches(':disabled') &&
  !item.closest('[hidden], [inert]') &&
  !(item.getAttribute('role') === 'radio' && item.getAttribute('aria-disabled') === 'true')
)

const getNavigableRovingItems = (root: HTMLElement): HTMLElement[] => (
  getOwnedRovingItems(root).filter(isNavigableRovingItem)
)

const activateRovingRadio = (root: HTMLElement, nextItem: HTMLElement): void => {
  if (nextItem.matches(':disabled, [aria-disabled="true"]')) return

  if (nextItem instanceof HTMLInputElement && nextItem.type === 'radio') {
    nextItem.checked = true

    nextItem.dispatchEvent(new Event('input', { bubbles: true }))

    nextItem.dispatchEvent(new Event('change', { bubbles: true }))

    return
  }

  if (nextItem.getAttribute('role') !== 'radio') return

  for (const radio of getOwnedRovingItems(root)) {
    if (radio.getAttribute('role') === 'radio') {
      radio.setAttribute('aria-checked', String(radio === nextItem))
    }
  }

  nextItem.dispatchEvent(new Event('change', { bubbles: true }))
}

const isIgnoredRovingKey = (event: KeyboardEvent): boolean => (
  event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey ||
  !rovingKeys.has(event.key)
)

export const initRovingGroups = (scope: ParentNode): void => {
  for (const root of queryScope(scope, groupSelector)) {
    if (root.dataset.uiBound === 'true' || isForeignOwned(root)) continue

    const initialItems = getNavigableRovingItems(root)

    if (!initialItems.length) continue

    root.dataset.uiBound = 'true'

    for (const item of getOwnedRovingItems(root)) {
      item.tabIndex = -1
    }

    const firstItem = initialItems[0]

    if (firstItem) firstItem.tabIndex = 0

    root.addEventListener('keydown', event => {
      if (isIgnoredRovingKey(event)) return

      const target = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>(itemSelector) : null

      if (target?.closest(groupSelector) !== root) return

      const items = getNavigableRovingItems(root)
      const currentIndex = items.indexOf(target)

      if (currentIndex < 0) return

      event.preventDefault()

      for (const item of getOwnedRovingItems(root)) {
        item.tabIndex = -1
      }

      const nextIndex = getLoopedIndex(
        getLumenDirectionalKey(root, event.key), currentIndex, items.length, ['ArrowRight', 'ArrowDown']
      )

      const nextItem = items[nextIndex]

      if (!nextItem) return

      nextItem.tabIndex = 0

      nextItem.focus()

      activateRovingRadio(root, nextItem)
    })
  }
}
