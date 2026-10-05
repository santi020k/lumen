export interface LumenMessageScrollState { atEnd: boolean }

export interface LumenMessageScrollerOptions {
  threshold?: number
  onStateChange?: (state: LumenMessageScrollState) => void
}

export interface LumenMessageScrollerController {
  destroy: () => void
  scrollToEnd: () => void
}

/** Opt-in follow behavior. The application owns message identity and pagination. */
export const createLumenMessageScrollerController = (
  viewport: HTMLElement, options: LumenMessageScrollerOptions = {}
): LumenMessageScrollerController => {
  const view = viewport.ownerDocument.defaultView

  if (!view) throw new Error('MessageScroller requires a document with a window.')

  const threshold = options.threshold ?? 32

  if (!Number.isFinite(threshold) || threshold < 0) throw new RangeError('MessageScroller threshold must be a finite nonnegative distance.')

  let atEnd = true
  let anchor: { element: HTMLElement, top: number } | undefined
  let frame: number | undefined
  let destroyed = false
  let programmaticTop: number | undefined
  const jump = viewport.querySelector<HTMLElement>('[data-ui-message-jump]')
  const previousAnchor = viewport.style.overflowAnchor
  const previousBehavior = viewport.style.scrollBehavior
  const previousTabIndex = viewport.getAttribute('tabindex')

  viewport.style.overflowAnchor = 'none'

  viewport.style.scrollBehavior = 'auto'

  if (previousTabIndex === null) viewport.tabIndex = 0

  const captureAnchor = () => {
    const top = viewport.getBoundingClientRect().top
    const item = [...viewport.querySelectorAll<HTMLElement>('[data-ui-message-item]')].find(element => element.getBoundingClientRect().bottom > top)

    anchor = item ? { element: item, top: item.getBoundingClientRect().top } : undefined
  }

  const announce = () => {
    viewport.dataset.atEnd = String(atEnd)

    if (jump) jump.hidden = atEnd

    options.onStateChange?.({ atEnd })

    viewport.dispatchEvent(new view.CustomEvent<LumenMessageScrollState>('ui:message-scroll-state', { bubbles: true, detail: { atEnd } }))
  }

  const scrollToEnd = () => {
    atEnd = true

    // Hiding the jump action changes the scroll extent; measure its final layout.
    announce()

    viewport.scrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight)

    programmaticTop = viewport.scrollTop

    captureAnchor()
  }

  const onScroll = () => {
    if (viewport.scrollTop === programmaticTop) {
      programmaticTop = undefined

      captureAnchor()

      return
    }

    programmaticTop = undefined

    const next = viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop <= threshold

    if (next !== atEnd) {
      atEnd = next

      announce()
    }

    captureAnchor()
  }

  const refresh = () => {
    if (frame !== undefined || destroyed) return

    frame = view.requestAnimationFrame(() => {
      frame = undefined

      if (destroyed) return

      if (atEnd) scrollToEnd()
      else {
        if (anchor?.element.isConnected && viewport.contains(anchor.element)) {
          viewport.scrollTop += anchor.element.getBoundingClientRect().top - anchor.top
        }

        captureAnchor()
      }
    })
  }

  const resize = typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(refresh) : undefined

  const observeContent = () => {
    resize?.disconnect()

    resize?.observe(viewport)

    for (const child of viewport.children) resize?.observe(child)
  }

  const mutation = new view.MutationObserver(records => {
    if (!records.some(record => record.type === 'childList' || record.type === 'characterData')) return

    observeContent()

    refresh()
  })

  mutation.observe(viewport, { childList: true, characterData: true, subtree: true })

  observeContent()

  viewport.addEventListener('scroll', onScroll, { passive: true })

  const jumpToEnd = () => {
    const focused = viewport.ownerDocument.activeElement === jump

    scrollToEnd()

    if (focused) viewport.focus({ preventScroll: true })
  }

  jump?.addEventListener('click', jumpToEnd)

  scrollToEnd()

  return {
    scrollToEnd,
    destroy: () => {
      destroyed = true

      mutation.disconnect()

      resize?.disconnect()

      viewport.removeEventListener('scroll', onScroll)

      jump?.removeEventListener('click', jumpToEnd)

      viewport.style.overflowAnchor = previousAnchor

      viewport.style.scrollBehavior = previousBehavior

      if (previousTabIndex === null) viewport.removeAttribute('tabindex')

      if (frame !== undefined) view.cancelAnimationFrame(frame)
    }
  }
}
