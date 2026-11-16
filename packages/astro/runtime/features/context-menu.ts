import { getFocusable, shouldRestorePanelFocus } from '../panels.js'
import { getScopeActiveElement, getScopeTarget } from '../relationships.js'
import { queryScope } from '../scope.js'

import { getLoopedIndex, shouldIgnoreKeydown } from './shared.js'

const boundContextMenus = new WeakSet<HTMLElement>()
const contextMenuTriggers = new WeakMap<HTMLElement, HTMLElement>()
const isOwnedMenuEvent = (menu: HTMLElement, event: Event): boolean => event.target instanceof Element && event.target.closest('[data-ui-context-menu]') === menu
const getContextMenuItems = (menu: HTMLElement): HTMLElement[] => getFocusable(menu).filter(item => item.closest('[data-ui-context-menu]') === menu)

export const closeContextMenu = (menu: HTMLElement): void => {
  if (menu.dataset.state !== 'open') return

  menu.dataset.state = 'closed'

  menu.hidden = true
}

const openContextMenuAt = (menu: HTMLElement, x: number, y: number): void => {
  const tree = menu.getRootNode()

  if (tree instanceof Document || tree instanceof DocumentFragment || tree instanceof Element) {
    for (const other of queryScope(tree, '[data-ui-context-menu][data-ui-context-menu-bound][data-state="open"]')) {
      if (other !== menu && !other.closest('[data-ui-owner]')) closeContextMenu(other)
    }
  }

  menu.hidden = false

  menu.style.position = 'fixed'

  menu.style.zIndex = '60'

  menu.dataset.state = 'open'

  const rect = menu.getBoundingClientRect()
  const left = Math.max(8, Math.min(x, window.innerWidth - rect.width - 8))
  const top = Math.max(8, Math.min(y, window.innerHeight - rect.height - 8))

  menu.style.left = `${left}px`

  menu.style.top = `${top}px`

  getContextMenuItems(menu)[0]?.focus()
}

const bindContextMenus = (target: HTMLElement): void => {
  if (target.dataset.uiBound === 'true' || target.closest('[data-ui-owner]')) return

  const menuId = target.getAttribute('data-ui-context-menu-trigger')
  const menu = menuId ? getScopeTarget(target, menuId) : null

  if (!menu || menu.closest('[data-ui-owner]')) return

  target.dataset.uiBound = 'true'

  target.addEventListener('contextmenu', event => {
    if (event.defaultPrevented || target.matches(':disabled, [aria-disabled="true"]')) return

    event.preventDefault()

    contextMenuTriggers.set(menu, target)

    openContextMenuAt(menu, event.clientX, event.clientY)
  })

  target.addEventListener('keydown', event => {
    if (shouldIgnoreKeydown(event)) return

    if (target.matches(':disabled, [aria-disabled="true"]')) return

    if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return

    event.preventDefault()

    const rect = target.getBoundingClientRect()

    contextMenuTriggers.set(menu, target)

    openContextMenuAt(menu, rect.left + 16, rect.top + 16)
  })

  if (boundContextMenus.has(menu)) return

  boundContextMenus.add(menu)

  menu.dataset.uiContextMenuBound = 'true'

  menu.hidden = true

  menu.dataset.state = 'closed'

  menu.addEventListener('keydown', event => {
    if (shouldIgnoreKeydown(event)) return

    if (!isOwnedMenuEvent(menu, event)) return

    if (event.key === 'Escape') {
      event.preventDefault()

      closeContextMenu(menu)

      contextMenuTriggers.get(menu)?.focus({ preventScroll: true })

      return
    }

    if (!['ArrowDown', 'ArrowUp', 'End', 'Home'].includes(event.key)) return

    const items = getContextMenuItems(menu)

    if (items.length === 0) return

    event.preventDefault()

    const currentIndex = items.findIndex(item => item === getScopeActiveElement(menu))

    const nextIndex = currentIndex < 0 && event.key === 'ArrowUp' ?
      items.length - 1 :
      getLoopedIndex(event.key, currentIndex, items.length, ['ArrowDown'])

    items[nextIndex]?.focus()
  })

  menu.addEventListener('click', event => {
    const item = event.target instanceof Element ? event.target.closest<HTMLElement>('[role="menuitem"]') : null

    if (event.defaultPrevented || item?.closest('[data-ui-context-menu]') !== menu) return

    if (item.matches(':disabled, [aria-disabled="true"]') || item.closest('[hidden], [inert]')) {
      event.preventDefault()

      return
    }

    const restoreFocus = shouldRestorePanelFocus(menu)

    closeContextMenu(menu)

    if (restoreFocus) contextMenuTriggers.get(menu)?.focus({ preventScroll: true })
  })
}

export const initContextMenus = (scope: ParentNode): void => {
  for (const target of queryScope(scope, '[data-ui-context-menu-trigger]')) bindContextMenus(target)
}
