import { getLumenWorkflowTiming, isLumenWorkflowMotionReduced } from './motion-workflows.js'

/** Decorative selection marker; existing tabs retain keyboard, focus, and selection ownership. */
export const bindLumenTabIndicator = (root: HTMLElement): (() => void) => {
  const list = root.querySelector<HTMLElement>('[role="tablist"]')
  const view = root.ownerDocument.defaultView

  if (!list || !view) return () => undefined

  const indicator = root.ownerDocument.createElement('span')

  indicator.className = 'ui-tabs__moving-indicator'

  indicator.setAttribute('aria-hidden', 'true')

  const originalPosition = list.style.position

  if (view.getComputedStyle(list).position === 'static') list.style.position = 'relative'

  let frame: number | undefined
  let initialized = false

  const sync = () => {
    frame = undefined

    const selected = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')

    indicator.hidden = !selected

    if (!selected) return

    const bounds = selected.getBoundingClientRect()
    const container = list.getBoundingClientRect()
    const timing = getLumenWorkflowTiming(root)
    const duration = initialized && !isLumenWorkflowMotionReduced(root) ? timing.duration : 0

    indicator.style.transition = `translate ${duration}ms ${timing.easing}, width ${duration}ms ${timing.easing}`

    const vertical = list.getAttribute('aria-orientation') === 'vertical'

    indicator.style.width = vertical ? '2px' : `${bounds.width}px`

    indicator.style.height = vertical ? `${bounds.height}px` : '2px'

    indicator.style.top = vertical ? '0' : ''

    indicator.style.bottom = vertical ? 'auto' : '0'

    indicator.style.translate = vertical ?
      `0 ${bounds.top - container.top + list.scrollTop}px` :
      `${bounds.left - container.left + list.scrollLeft}px 0`

    initialized = true
  }

  const schedule = () => {
    frame ??= view.requestAnimationFrame(sync)
  }

  const observer = new view.MutationObserver(schedule)

  observer.observe(root, { subtree: true, attributes: true, attributeFilter: ['aria-selected', 'aria-orientation', 'data-ui-motion'] })

  const resize = typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(schedule) : undefined

  resize?.observe(list)

  const media = view.matchMedia('(prefers-reduced-motion: reduce)')

  media.addEventListener('change', schedule)

  list.append(indicator)

  sync()

  return () => {
    observer.disconnect()

    resize?.disconnect()

    media.removeEventListener('change', schedule)

    if (frame !== undefined) view.cancelAnimationFrame(frame)

    indicator.remove()

    list.style.position = originalPosition
  }
}
