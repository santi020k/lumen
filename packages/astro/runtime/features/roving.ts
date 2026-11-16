import { getLumenDirectionalKey } from '@santi020k/lumen-core'

import { queryScope } from '../scope.js'

import { getLoopedIndex } from './shared.js'

const isEnabledItem = (item: HTMLElement): boolean => !item.matches(':disabled, [disabled], [aria-disabled="true"]')

const getNextEnabledItem = (
  items: readonly HTMLElement[], key: string, currentIndex: number
): HTMLElement | undefined => {
  const forwardKeys = ['ArrowRight', 'ArrowDown']
  const nextIndex = getLoopedIndex(key, currentIndex, items.length, forwardKeys)
  const step = key === 'Home' || forwardKeys.includes(key) ? 1 : -1

  for (let offset = 0; offset < items.length; offset += 1) {
    const item = items[(nextIndex + offset * step + items.length) % items.length]

    if (item && isEnabledItem(item)) return item
  }

  return undefined
}

export const initRovingGroups = (scope: ParentNode): void => {
  const groupSelector = [
    '[data-ui-menubar]',
    '[data-ui-radio-group]',
    '[data-ui-toggle-group]',
    '[data-ui-toolbar]'
  ].join(', ')

  for (const root of queryScope(scope, groupSelector)) {
    if (root.dataset.uiBound === 'true') continue

    root.dataset.uiBound = 'true'

    const itemSelector =
      'button, a[href], input[type="radio"], [role="menuitem"], [role="radio"]'

    const items = [...root.querySelectorAll<HTMLElement>(itemSelector)]

    if (!items.length) continue

    // Retain an entry point when a disabled native group is re-enabled later.
    const initialItem = items.find(isEnabledItem) ?? items[0]

    for (const [index, item] of items.entries()) {
      item.tabIndex = item === initialItem ? 0 : -1

      item.addEventListener('keydown', event => {
        const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']

        if (!keys.includes(event.key)) return

        event.preventDefault()

        const nextItem = getNextEnabledItem(items, getLumenDirectionalKey(root, event.key), index)

        if (nextItem) {
          for (const candidate of items) {
            candidate.tabIndex = -1
          }

          nextItem.tabIndex = 0

          nextItem.focus()

          if (nextItem instanceof HTMLInputElement && nextItem.type === 'radio') {
            nextItem.checked = true

            nextItem.dispatchEvent(new Event('input', { bubbles: true }))

            nextItem.dispatchEvent(new Event('change', { bubbles: true }))
          } else if (nextItem.getAttribute('role') === 'radio') {
            for (const radio of items) {
              if (radio.getAttribute('role') === 'radio') {
                radio.setAttribute('aria-checked', String(radio === nextItem))
              }
            }

            nextItem.dispatchEvent(new Event('change', { bubbles: true }))
          }
        }
      })
    }
  }
}
