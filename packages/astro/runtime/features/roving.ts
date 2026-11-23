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
  !item.matches(':disabled, [disabled]') &&
  !item.closest('[hidden], [inert]') &&
  !(item.matches('input[type="radio"], [role="radio"]') && item.getAttribute('aria-disabled') === 'true')
)

const getNextNavigableRovingItem = (
  items: readonly HTMLElement[], key: string, currentIndex: number
): HTMLElement | undefined => {
  const forwardKeys = ['ArrowRight', 'ArrowDown']
  const nextIndex = getLoopedIndex(key, currentIndex, items.length, forwardKeys)
  const step = key === 'Home' || forwardKeys.includes(key) ? 1 : -1

  for (let offset = 0; offset < items.length; offset += 1) {
    const item = items[(nextIndex + offset * step + items.length) % items.length]

    if (item && isNavigableRovingItem(item)) return item
  }

  return undefined
}

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

    const initialItems = getOwnedRovingItems(root)

    if (!initialItems.length) continue

    root.dataset.uiBound = 'true'

    // Retain an entry point when a disabled native group is re-enabled later.
    const initialItem = initialItems.find(isNavigableRovingItem) ?? initialItems.find(
      item => item.matches(':disabled') && !item.closest('[hidden], [inert]')
    )

    for (const item of initialItems) {
      item.tabIndex = item === initialItem ? 0 : -1
    }

    root.addEventListener('keydown', event => {
      if (isIgnoredRovingKey(event)) return

      const target = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>(itemSelector) : null

      if (target?.closest(groupSelector) !== root) return

      const items = getOwnedRovingItems(root)
      const currentIndex = items.indexOf(target)

      if (currentIndex < 0 || target.closest('[hidden], [inert]')) return

      const nextItem = getNextNavigableRovingItem(items, getLumenDirectionalKey(root, event.key), currentIndex)

      if (!nextItem) return

      event.preventDefault()

      for (const item of items) {
        item.tabIndex = -1
      }

      nextItem.tabIndex = 0

      nextItem.focus()

      activateRovingRadio(root, nextItem)
    })
  }
}
