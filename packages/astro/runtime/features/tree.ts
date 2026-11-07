import { queryScope } from '../scope.js'

import { getLoopedIndex } from './shared.js'

const bindTreeCollections = (root: HTMLElement): void => {
  if (root.dataset.uiBound === 'true') return

  const items = [...root.querySelectorAll<HTMLElement>('[role="treeitem"], [role="row"]')]

  if (!items.length) return

  root.dataset.uiBound = 'true'

  for (const [index, item] of items.entries()) {
    item.tabIndex = index === 0 ? 0 : -1

    item.addEventListener('keydown', event => {
      const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', ' ']

      if (!keys.includes(event.key)) return

      const opensBranch = ['ArrowRight', 'Enter', ' '].includes(event.key)

      if (opensBranch && item.hasAttribute('aria-expanded')) {
        event.preventDefault()

        item.setAttribute('aria-expanded', 'true')

        return
      }

      if (event.key === 'ArrowLeft' && item.hasAttribute('aria-expanded')) {
        event.preventDefault()

        item.setAttribute('aria-expanded', 'false')

        return
      }

      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return

      event.preventDefault()

      for (const nextItem of items) {
        nextItem.tabIndex = -1
      }

      const nextItem = items[getLoopedIndex(event.key, index, items.length, ['ArrowDown'])]

      if (nextItem) {
        nextItem.tabIndex = 0

        nextItem.focus()
      }
    })
  }
}

export const initTreeCollections = (scope: ParentNode): void => {
  for (const root of queryScope(scope, '[role="tree"], [role="treegrid"]')) bindTreeCollections(root)
}
