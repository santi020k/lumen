const bindings = new Map<HTMLElement, () => void>()
let nextId = 0

const updateDescription = (viewport: HTMLElement, id: string, visible: boolean): void => {
  const ids = new Set(viewport.getAttribute('aria-describedby')?.split(/\s+/u).filter(Boolean))

  if (visible) ids.add(id)
  else ids.delete(id)

  if (ids.size) viewport.setAttribute('aria-describedby', [...ids].join(' '))
  else viewport.removeAttribute('aria-describedby')
}

export const clearScrollCues = (): void => {
  for (const cleanup of bindings.values()) cleanup()

  bindings.clear()
}

const bindScrollCue = (root: HTMLElement): void => {
  const viewport = root.querySelector<HTMLElement>('[data-scroll-cue-viewport], pre')
  const content = viewport?.querySelector<HTMLElement>('table, code')
  const message = root.querySelector<HTMLElement>('[data-scroll-cue-message]')

  if (!viewport || !content || !message) return

  if (!message.id) {
    let candidate: string

    do {
      nextId += 1

      candidate = `ui-scroll-cue-${nextId}`
    } while (root.ownerDocument.getElementById(candidate))

    message.id = candidate
  }

  const id = message.id
  let active = true

  const update = (): void => {
    if (!active || !root.isConnected) return

    const visible = viewport.clientWidth > 0 && viewport.scrollWidth > viewport.clientWidth + 1

    message.hidden = !visible

    updateDescription(viewport, id, visible)
  }

  const observer = new ResizeObserver(update)

  observer.observe(viewport)

  observer.observe(content)

  bindings.set(root, () => {
    active = false

    observer.disconnect()

    message.hidden = true

    updateDescription(viewport, id, false)
  })

  void root.ownerDocument.fonts.ready.then(update)

  update()
}

/** Enhance the documented Code/Table markup without owning native scrolling or focus. */
export const initScrollCues = (scope: ParentNode): void => {
  for (const [root, cleanup] of bindings) {
    if (!root.isConnected) {
      cleanup()

      bindings.delete(root)
    }
  }

  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-scroll-cue]')) {
    if (!bindings.has(root)) bindScrollCue(root)
  }
}
