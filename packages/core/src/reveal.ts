export interface LumenRevealOptions {
  once?: boolean
  threshold?: number
}

export const normalizeLumenRevealThreshold = (value: number | undefined): number => (
  value === undefined || !Number.isFinite(value) ? 0.15 : Math.min(1, Math.max(0, value))
)

/** An upper bound: a clipped container cannot expose more than its available area. */
const maximumVisibleRatio = (root: HTMLElement, view: Window): number => {
  const rectangle = root.getBoundingClientRect()

  if (rectangle.width <= 0 || rectangle.height <= 0) return 1

  let width = view.innerWidth
  let height = view.innerHeight

  for (let parent = root.parentElement; parent; parent = parent.parentElement) {
    const style = view.getComputedStyle(parent)

    if (['auto', 'scroll', 'hidden', 'clip'].includes(style.overflowX)) width = Math.min(width, parent.clientWidth)

    if (['auto', 'scroll', 'hidden', 'clip'].includes(style.overflowY)) height = Math.min(height, parent.clientHeight)
  }

  return Math.min(width, rectangle.width) * Math.min(height, rectangle.height) / (rectangle.width * rectangle.height)
}

const shouldShowImmediately = (root: HTMLElement, media: MediaQueryList | null): boolean => (
  media?.matches === true || root.contains(root.ownerDocument.activeElement)
)

const observeRevealGeometry = (
  root: HTMLElement, view: NonNullable<Document['defaultView']>, onResize: () => void
): ResizeObserver | undefined => {
  if (typeof view.ResizeObserver !== 'function') return undefined

  const observer = new view.ResizeObserver(onResize)

  for (let target: HTMLElement | null = root; target; target = target.parentElement) observer.observe(target)

  return observer
}

/** Decorative enhancement must never strand content behind an unreachable threshold or keyboard focus. */
export const createLumenRevealController = (
  root: HTMLElement,
  options: LumenRevealOptions = {}
): { destroy: () => void } => {
  const view = root.ownerDocument.defaultView
  const media = view && typeof view.matchMedia === 'function' ? view.matchMedia('(prefers-reduced-motion: reduce)') : null
  const threshold = normalizeLumenRevealThreshold(options.threshold)
  const once = options.once !== false
  const observers: { intersection?: IntersectionObserver, resize?: ResizeObserver | undefined } = {}
  let finished = false

  const stopObserving = (): void => {
    observers.intersection?.disconnect()

    observers.resize?.disconnect()
  }

  const showWithoutAnimation = (): void => {
    finished = true

    root.classList.add('is-revealed')

    delete root.dataset.uiScrollRevealBound

    stopObserving()
  }

  const checkGeometry = (): boolean => {
    if (finished || !view) return finished

    if (maximumVisibleRatio(root, view) + Number.EPSILON < threshold) showWithoutAnimation()

    return finished
  }

  const onResize = (): void => {
    checkGeometry()
  }

  const onMotionChange = (): void => {
    if (media?.matches) showWithoutAnimation()
  }

  const destroy = (): void => {
    finished = true

    stopObserving()

    root.removeEventListener('focusin', showWithoutAnimation)

    view?.removeEventListener('resize', onResize)

    media?.removeEventListener('change', onMotionChange)

    delete root.dataset.uiScrollRevealBound
  }

  root.classList.remove('is-revealed')

  root.dataset.uiScrollRevealBound = 'true'

  if (!view || typeof view.IntersectionObserver !== 'function' || shouldShowImmediately(root, media)) {
    showWithoutAnimation()

    return { destroy }
  }

  if (checkGeometry()) return { destroy }

  observers.intersection = new view.IntersectionObserver(entries => {
    if (finished || checkGeometry()) return

    const entry = entries.filter(value => value.target === root).at(-1)

    if (!entry) return

    const visible = entry.isIntersecting && entry.intersectionRatio >= threshold

    root.classList.toggle('is-revealed', visible)

    if (visible && once) {
      finished = true

      stopObserving()
    }
  }, { threshold })

  observers.resize = observeRevealGeometry(root, view, onResize)

  root.addEventListener('focusin', showWithoutAnimation)

  view.addEventListener('resize', onResize)

  media?.addEventListener('change', onMotionChange)

  observers.intersection.observe(root)

  return { destroy }
}
