const bindSchedules = (root: HTMLElement): void => {
  if (root.dataset.uiBound === 'true') return

  root.dataset.uiBound = 'true'

  let activeEvent: HTMLElement | undefined

  for (const event of root.querySelectorAll<HTMLElement>('[data-ui-schedule-event]')) {
    event.draggable = event.draggable || event.dataset.uiDraggable === 'true'

    event.addEventListener('dragstart', dragEvent => {
      dragEvent.dataTransfer?.setData('text/plain', event.id || event.textContent.trim() || '')

      activeEvent = event

      root.dataset.uiDragging = 'true'
    })

    event.addEventListener('dragend', () => {
      activeEvent = undefined

      delete root.dataset.uiDragging
    })
  }

  for (const dropzone of root.querySelectorAll<HTMLElement>('[data-ui-schedule-slot]')) {
    dropzone.addEventListener('dragover', event => {
      event.preventDefault()

      dropzone.dataset.state = 'drag-over'
    })

    dropzone.addEventListener('dragleave', () => {
      delete dropzone.dataset.state
    })

    dropzone.addEventListener('drop', event => {
      event.preventDefault()

      delete dropzone.dataset.state

      const draggedId = event.dataTransfer?.getData('text/plain')
      const dragged = activeEvent

      if (!(dragged instanceof HTMLElement) ||
        dragged.closest('[data-ui-schedule]') !== root) return

      dropzone.append(dragged)

      root.dispatchEvent(new CustomEvent('ui:schedule-change', {
        bubbles: true,
        detail: {
          eventId: draggedId,
          slot: dropzone.dataset.uiScheduleSlot
        }
      }))
    })
  }
}

export const initSchedules = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-schedule]')) bindSchedules(root)
}
