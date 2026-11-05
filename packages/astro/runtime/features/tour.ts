const bindTours = (root: HTMLElement): void => {
  if (root.dataset.uiBound === 'true') return

  const popover = root.querySelector<HTMLElement>('[data-ui-tour-popover]')
  const steps = [...root.querySelectorAll<HTMLElement>('[data-ui-tour-step]')]

  if (!popover || !steps.length) return

  root.dataset.uiBound = 'true'

  let index = 0

  const positionStep = (): void => {
    const step = steps[index]

    if (!step) return

    for (const [stepIndex, node] of steps.entries()) {
      node.hidden = stepIndex !== index
    }

    const selector = step.dataset.target
    const target = selector ? document.querySelector<HTMLElement>(selector) : null

    if (target) {
      const rect = target.getBoundingClientRect()

      popover.style.top = `${rect.bottom + 8}px`

      popover.style.left = `${rect.left}px`
    }
  }

  const open = (): void => {
    root.hidden = false

    index = 0

    positionStep()
  }

  const close = (): void => {
    root.hidden = true
  }

  root.addEventListener('click', event => {
    const target = event.target

    if (!(target instanceof HTMLElement)) return

    if (target.closest('[data-ui-tour-next]')) {
      if (index < steps.length - 1) {
        index += 1

        positionStep()
      } else {
        close()
      }
    } else if (target.closest('[data-ui-tour-prev]')) {
      if (index > 0) {
        index -= 1

        positionStep()
      }
    } else if (target.closest('[data-ui-tour-close]') || target.hasAttribute('data-ui-tour-backdrop')) {
      close()
    }
  })

  const opener = root.id ? document.querySelector<HTMLElement>(`[data-ui-tour-open="#${root.id}"]`) : null

  if (opener) {
    opener.addEventListener('click', open)
  }

  const lumenTourWindow = window as Window & { LumenTours?: Record<string, () => void> }

  lumenTourWindow.LumenTours = lumenTourWindow.LumenTours ?? {}

  if (root.id) {
    lumenTourWindow.LumenTours[root.id] = open
  }
}

export const initTours = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-tour]')) bindTours(root)
}
