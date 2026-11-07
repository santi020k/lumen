import { getLumenDirectionalKey } from '@santi020k/lumen-core'

import { queryScope } from '../scope.js'

import { getLoopedIndex } from './shared.js'

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

    for (const [index, item] of items.entries()) {
      item.tabIndex = index === 0 ? 0 : -1

      item.addEventListener('keydown', event => {
        const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']

        if (!keys.includes(event.key)) return

        event.preventDefault()

        for (const nextItem of items) {
          nextItem.tabIndex = -1
        }

        const nextItem = items[getLoopedIndex(getLumenDirectionalKey(root, event.key), index, items.length, ['ArrowRight', 'ArrowDown'])]

        if (nextItem) {
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
