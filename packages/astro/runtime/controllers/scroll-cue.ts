import { queryScope } from '../scope.js'

// cspell:words loadingdone
interface ScrollCueBinding {
  cleanup: () => void
  measure: () => boolean
  render: (visible: boolean) => void
}

const bindings = new Map<HTMLElement, ScrollCueBinding>()
const pending = new Set<ScrollCueBinding>()
const fontListeners = new Map<FontFaceSet, () => void>()
let frame = 0

const renderCues = (cues: Iterable<ScrollCueBinding>): void => {
  const measured = [...cues].map(item => ({ item, visible: item.measure() }))

  for (const { item, visible } of measured) item.render(visible)
}

const schedule = (binding: ScrollCueBinding): void => {
  pending.add(binding)

  if (frame) return

  frame = requestAnimationFrame(() => {
    frame = 0

    const queued = [...pending]

    pending.clear()

    renderCues(queued)
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

  for (const [fonts, update] of fontListeners) fonts.removeEventListener('loadingdone', update)

  fontListeners.clear()
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

const bindScrollCue = (root: HTMLElement): ScrollCueBinding | undefined => {
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

  return binding
}

const syncFontListeners = (): void => {
  const documents = new Set([...bindings.keys()].map(root => root.ownerDocument))
  const activeFonts = new Set([...documents].map(ownerDocument => ownerDocument.fonts))

  for (const [fonts, update] of fontListeners) {
    if (activeFonts.has(fonts)) continue

    fonts.removeEventListener('loadingdone', update)

    fontListeners.delete(fonts)
  }

  for (const ownerDocument of documents) {
    const { fonts } = ownerDocument

    if (fontListeners.has(fonts)) continue

    const update = (): void => {
      const cues = [...bindings].filter(([root]) => root.ownerDocument === ownerDocument)

      renderCues(cues.map(([, binding]) => binding))
    }

    // Font completion must not force style resolution through document.fonts.ready.
    fonts.addEventListener('loadingdone', update)

    fontListeners.set(fonts, update)
  }
}

/** Enhance the documented Code/Table markup without owning native scrolling or focus. */
export const initScrollCues = (scope: ParentNode): void => {
  for (const [root, binding] of bindings) {
    if (!root.isConnected) {
      binding.cleanup()

      bindings.delete(root)
    }
  }

  const added: ScrollCueBinding[] = []

  for (const root of queryScope(scope, '[data-ui-scroll-cue]')) {
    const binding = bindings.has(root) ? undefined : bindScrollCue(root)

    if (binding) added.push(binding)
  }

  renderCues(added)

  syncFontListeners()
}

/** Measure visible panels before a tab scroll or a document anchor can move the reader. */
export const refreshScrollCues = (scope: ParentNode): void => {
  const cues: ScrollCueBinding[] = []

  for (const root of queryScope(scope, '[data-ui-scroll-cue]')) {
    const binding = bindings.get(root)

    if (binding) cues.push(binding)
  }

  renderCues(cues)
}
