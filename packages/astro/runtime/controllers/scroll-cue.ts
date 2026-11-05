interface ScrollCueBinding {
  cleanup: () => void
  measure: () => boolean
  render: (visible: boolean) => void
}

const bindings = new Map<HTMLElement, ScrollCueBinding>()
const pending = new Set<ScrollCueBinding>()
let frame = 0

const schedule = (binding: ScrollCueBinding): void => {
  pending.add(binding)

  if (frame) return

  frame = requestAnimationFrame(() => {
    frame = 0

    const measured = [...pending].map(item => ({ item, visible: item.measure() }))

    pending.clear()

    for (const { item, visible } of measured) item.render(visible)
  })
}

let nextId = 0

const updateDescription = (viewport: HTMLElement, id: string, visible: boolean): void => {
  const ids = new Set(viewport.getAttribute('aria-describedby')?.split(/\s+/u).filter(Boolean))

  if (visible) ids.add(id)
  else ids.delete(id)

  if (ids.size) viewport.setAttribute('aria-describedby', [...ids].join(' '))
  else viewport.removeAttribute('aria-describedby')
}

export const clearScrollCues = (): void => {
  for (const binding of bindings.values()) binding.cleanup()

  if (frame) cancelAnimationFrame(frame)

  frame = 0

  pending.clear()

  bindings.clear()
}

const getMessageId = (message: HTMLElement): string => {
  if (message.id) return message.id

  let candidate: string

  do {
    nextId += 1

    candidate = `ui-scroll-cue-${nextId}`
  } while (message.ownerDocument.getElementById(candidate))

  message.id = candidate

  return candidate
}

const hasOverflow = (viewport: HTMLElement): boolean => {
  const width = viewport.clientWidth

  return width > 0 && viewport.scrollWidth > width + 1
}

const bindScrollCue = (root: HTMLElement): void => {
  const viewport = root.querySelector<HTMLElement>('[data-scroll-cue-viewport], pre')
  const content = viewport?.querySelector<HTMLElement>('table, code')
  const message = root.querySelector<HTMLElement>('[data-scroll-cue-message]')

  if (!viewport || !content || !message) return

  const id = getMessageId(message)
  let active = true
  let observer: ResizeObserver | undefined
  let previousVisibility: boolean | undefined

  const binding: ScrollCueBinding = {
    cleanup: () => {
      active = false

      observer?.disconnect()

      pending.delete(binding)

      message.hidden = true

      updateDescription(viewport, id, false)
    },
    measure: () => root.isConnected && hasOverflow(viewport),
    render: visible => {
      if (!active || !root.isConnected || previousVisibility === visible) return

      previousVisibility = visible

      message.hidden = !visible

      updateDescription(viewport, id, visible)
    }
  }

  const update = (): void => {
    if (active) schedule(binding)
  }

  if (typeof ResizeObserver !== 'undefined') observer = new ResizeObserver(update)

  observer?.observe(viewport)

  observer?.observe(content)

  bindings.set(root, binding)

  void root.ownerDocument.fonts.ready.then(update)

  update()
}

/** Enhance the documented Code/Table markup without owning native scrolling or focus. */
export const initScrollCues = (scope: ParentNode): void => {
  for (const [root, binding] of bindings) {
    if (!root.isConnected) {
      binding.cleanup()

      bindings.delete(root)
    }
  }

  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-scroll-cue]')) {
    if (!bindings.has(root)) bindScrollCue(root)
  }
}
