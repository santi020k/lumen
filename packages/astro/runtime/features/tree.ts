import { queryScope } from '../scope.js'

import { getLoopedIndex, shouldIgnoreKeydown } from './shared.js'

const handleTreeBranchKey = (item: HTMLElement, event: KeyboardEvent): boolean => {
  const opensBranch = ['ArrowRight', 'Enter', ' '].includes(event.key)

  if (!opensBranch && event.key !== 'ArrowLeft') return false

  if (item.matches('[aria-disabled="true"]')) {
    event.preventDefault()

    return true
  }

  if (!item.hasAttribute('aria-expanded')) return false

  event.preventDefault()

  item.setAttribute('aria-expanded', String(opensBranch))

  return true
}

const bindTreeCollections = (root: HTMLElement): void => {
  if (root.dataset.uiBound === 'true') return

  const itemSelector = '[role="treeitem"], [role="row"]'

  const items = [...root.querySelectorAll<HTMLElement>(itemSelector)]
    .filter(item => item.closest('[role="tree"], [role="treegrid"]') === root)

  const navigableItems = (): HTMLElement[] => items.filter(item => !item.matches(':disabled') && !item.closest('[hidden], [inert]'))

  if (!items.length) return

  root.dataset.uiBound = 'true'

  const initialItem = navigableItems()[0]

  for (const item of items) {
    item.tabIndex = item === initialItem ? 0 : -1

    item.addEventListener('keydown', event => {
      if (shouldIgnoreKeydown(event)) return

      if (!(event.target instanceof Element) || event.target.closest(itemSelector) !== item) return

      if (item.matches(':disabled') || item.closest('[hidden], [inert]')) return

      if (handleTreeBranchKey(item, event)) return

      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return

      event.preventDefault()

      for (const nextItem of items) {
        nextItem.tabIndex = -1
      }

      const candidates = navigableItems()
      const nextItem = candidates[getLoopedIndex(event.key, candidates.indexOf(item), candidates.length, ['ArrowDown'])]

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
