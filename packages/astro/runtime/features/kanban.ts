import { createLumenKanbanMoveDetail } from '@santi020k/lumen-core'

const kanbanColumnSelector = '[data-ui-kanban-column]'

const bindKanbanBoards = (root: HTMLElement): void => {
  for (const handle of root.querySelectorAll<HTMLElement>('[data-ui-kanban-handle]'))
    handle.draggable = true

  if (root.dataset.uiKanbanBound === 'true') return

  root.dataset.uiKanbanBound = 'true'

  let pointer: {
    active: boolean
    handle: HTMLElement
    item: HTMLElement
    pointerId: number
    startX: number
    startY: number
  } | undefined

  const itemFor = (target: EventTarget | null): HTMLElement | null => {
    const item = target instanceof Element ?
      target.closest<HTMLElement>('[data-ui-kanban-item]') :
      null

    return item?.closest<HTMLElement>('[data-ui-kanban]') === root ? item : null
  }

  const columnFor = (target: EventTarget | null): HTMLElement | null => {
    const column = target instanceof Element ?
      target.closest<HTMLElement>(kanbanColumnSelector) :
      null

    return column?.closest<HTMLElement>('[data-ui-kanban]') === root ? column : null
  }

  const clearState = (): void => {
    pointer = undefined

    for (const item of root.querySelectorAll<HTMLElement>('[data-ui-kanban-item]'))
      if (item.dataset.state === 'dragging') delete item.dataset.state

    for (const column of root.querySelectorAll<HTMLElement>(kanbanColumnSelector))
      if (column.dataset.state === 'drop-target') delete column.dataset.state
  }

  const announce = (column: HTMLElement): void => {
    let live = root.querySelector<HTMLElement>('[data-ui-kanban-live]')

    if (!live) {
      live = document.createElement('span')

      live.className = 'ui-visually-hidden'

      live.dataset.uiKanbanLive = ''

      live.setAttribute('aria-live', 'polite')

      live.setAttribute('role', 'status')

      root.append(live)
    }

    const label = column.getAttribute('aria-label') ||
      column.querySelector('h2, h3, [data-ui-kanban-column-label]')?.textContent.trim() ||
      column.dataset.uiKanbanColumn || ''

    live.textContent = `Move requested to ${label}.`
  }

  const requestMove = (
    item: HTMLElement,
    targetColumn: HTMLElement,
    input: 'keyboard' | 'pointer'
  ): void => {
    const fromColumn = item.closest<HTMLElement>(kanbanColumnSelector)
      ?.dataset.uiKanbanColumn ?? ''

    const detail = createLumenKanbanMoveDetail({
      fromColumn,
      input,
      itemId: item.dataset.uiKanbanItem ?? item.id,
      toColumn: targetColumn.dataset.uiKanbanColumn ?? ''
    })

    if (!detail) return

    const accepted = root.dispatchEvent(new CustomEvent('ui:kanban-move-request', {
      bubbles: true,
      cancelable: true,
      detail
    }))

    if (accepted) announce(targetColumn)
  }

  root.addEventListener('dragstart', event => {
    const handle = event.target instanceof Element ?
      event.target.closest<HTMLElement>('[data-ui-kanban-handle]') :
      null

    const item = itemFor(handle)

    if (!handle || !item || item.getAttribute('aria-busy') === 'true') {
      event.preventDefault()

      return
    }

    event.dataTransfer?.setData('text/plain', item.dataset.uiKanbanItem ?? item.id)

    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'

    item.dataset.state = 'dragging'
  })

  root.addEventListener('dragend', clearState)

  root.addEventListener('dragover', event => {
    const column = columnFor(event.target)

    if (!column) return

    event.preventDefault()

    column.dataset.state = 'drop-target'

    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  })

  root.addEventListener('dragleave', event => {
    const column = columnFor(event.target)

    if (
      !column ||
      (event.relatedTarget instanceof Node && column.contains(event.relatedTarget))
    ) return

    delete column.dataset.state
  })

  root.addEventListener('drop', event => {
    const column = columnFor(event.target)
    const itemId = event.dataTransfer?.getData('text/plain') ?? ''

    const item = [...root.querySelectorAll<HTMLElement>('[data-ui-kanban-item]')]
      .find(candidate => (candidate.dataset.uiKanbanItem ?? candidate.id) === itemId)

    if (!column || !item) return

    event.preventDefault()

    requestMove(item, column, 'pointer')

    clearState()
  })

  const columnOffset = (key: string): number => {
    const direction = key === 'ArrowRight' ? 1 : -1

    return getComputedStyle(root).direction === 'rtl' ? -direction : direction
  }

  root.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return

    const handle = event.target instanceof Element ?
      event.target.closest<HTMLElement>('[data-ui-kanban-handle]') :
      null

    const item = itemFor(handle)
    const currentColumn = columnFor(item)

    if (!handle || !item || !currentColumn || item.getAttribute('aria-busy') === 'true') return

    const columns = [...root.querySelectorAll<HTMLElement>(kanbanColumnSelector)]
    const currentIndex = columns.indexOf(currentColumn)
    const target = columns[currentIndex + columnOffset(event.key)]

    if (!target) return

    event.preventDefault()

    requestMove(item, target, 'keyboard')
  })

  root.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse') return

    const handle = event.target instanceof Element ?
      event.target.closest<HTMLElement>('[data-ui-kanban-handle]') :
      null

    const item = itemFor(handle)

    if (!handle || !item || item.getAttribute('aria-busy') === 'true') return

    pointer = {
      active: false,
      handle,
      item,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY
    }
  })

  root.addEventListener('pointermove', event => {
    if (pointer?.pointerId !== event.pointerId) return

    if (!pointer.active && Math.hypot(
      event.clientX - pointer.startX,
      event.clientY - pointer.startY
    ) < 8) return

    pointer.active = true

    pointer.handle.setPointerCapture(event.pointerId)

    pointer.item.dataset.state = 'dragging'

    const target = columnFor(document.elementFromPoint(event.clientX, event.clientY))

    for (const column of root.querySelectorAll<HTMLElement>(kanbanColumnSelector)) {
      if (column === target) column.dataset.state = 'drop-target'
      else delete column.dataset.state
    }
  })

  root.addEventListener('pointerup', event => {
    if (pointer?.pointerId !== event.pointerId) return

    const target = columnFor(document.elementFromPoint(event.clientX, event.clientY))

    if (pointer.active && target) requestMove(pointer.item, target, 'pointer')

    clearState()
  })

  root.addEventListener('pointercancel', clearState)
}

export const initKanbanBoards = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-kanban]')) bindKanbanBoards(root)
}
