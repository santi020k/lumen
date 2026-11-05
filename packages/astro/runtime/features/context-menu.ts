import { getFocusable, getLoopedIndex } from './shared.js'

export const closeContextMenu = (menu: HTMLElement): void => {
  if (menu.dataset.state !== 'open') return

  menu.dataset.state = 'closed'

  menu.hidden = true
}

const openContextMenuAt = (menu: HTMLElement, x: number, y: number): void => {
  for (const other of document.querySelectorAll<HTMLElement>('[data-ui-context-menu][data-state="open"]')) {
    if (other !== menu) closeContextMenu(other)
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

  getFocusable(menu)[0]?.focus()
}

const bindContextMenus = (target: HTMLElement): void => {
  if (target.dataset.uiBound === 'true') return

  target.dataset.uiBound = 'true'

  const menuId = target.getAttribute('data-ui-context-menu-trigger')
  const menu = menuId ? document.getElementById(menuId) : null

  if (!menu) return

  menu.hidden = true

  menu.dataset.state = 'closed'

  target.addEventListener('contextmenu', event => {
    event.preventDefault()

    openContextMenuAt(menu, event.clientX, event.clientY)
  })

  target.addEventListener('keydown', event => {
    if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return

    event.preventDefault()

    const rect = target.getBoundingClientRect()

    openContextMenuAt(menu, rect.left + 16, rect.top + 16)
  })

  menu.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.isComposing) return

    if (event.key === 'Escape') {
      closeContextMenu(menu)

      target.focus()

      return
    }

    if (!['ArrowDown', 'ArrowUp', 'End', 'Home'].includes(event.key)) return

    const items = getFocusable(menu)

    if (items.length === 0) return

    event.preventDefault()

    const currentIndex = items.findIndex(item => item === menu.ownerDocument.activeElement)

    const nextIndex = currentIndex < 0 && event.key === 'ArrowUp' ?
      items.length - 1 :
      getLoopedIndex(event.key, currentIndex, items.length, ['ArrowDown'])

    items[nextIndex]?.focus()
  })

  menu.addEventListener('click', event => {
    if (event.target instanceof HTMLElement && event.target.closest('[role="menuitem"]')) {
      closeContextMenu(menu)
    }
  })
}

export const initContextMenus = (scope: ParentNode): void => {
  for (const target of scope.querySelectorAll<HTMLElement>('[data-ui-context-menu-trigger]')) bindContextMenus(target)
}
