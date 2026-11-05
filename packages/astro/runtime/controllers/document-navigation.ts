import { decodeLumenAnchorFragment, getLumenActiveAnchorIndex } from '@santi020k/lumen-core'

interface AnchorDispatcher {
  callbacks: WeakMap<HTMLElement, () => void>
  frame: number
}

const anchorDispatchers = new WeakMap<Document, AnchorDispatcher>()

const getAnchorDispatcher = (ownerDocument: Document): AnchorDispatcher => {
  const existing = anchorDispatchers.get(ownerDocument)

  if (existing) return existing

  const dispatcher: AnchorDispatcher = { callbacks: new WeakMap(), frame: 0 }

  const runUpdates = (): void => {
    dispatcher.frame = 0

    for (const root of ownerDocument.querySelectorAll<HTMLElement>('[data-ui-anchor]')) {
      dispatcher.callbacks.get(root)?.()
    }
  }

  const requestUpdates = (): void => {
    if (dispatcher.frame) return

    dispatcher.frame = requestAnimationFrame(runUpdates)
  }

  ownerDocument.defaultView?.addEventListener('resize', requestUpdates, { passive: true })

  ownerDocument.defaultView?.addEventListener('scroll', requestUpdates, { passive: true })

  anchorDispatchers.set(ownerDocument, dispatcher)

  return dispatcher
}

const initAnchors = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-anchor]')) {
    if (root.dataset.uiBound === 'true') continue

    root.dataset.uiBound = 'true'

    const ownerDocument = root.ownerDocument
    const links = [...root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')]
    const targets: { link: HTMLAnchorElement, target: HTMLElement }[] = []

    for (const link of links) {
      const fragment = link.getAttribute('href')?.slice(1) ?? ''
      const id = decodeLumenAnchorFragment(fragment)
      const target = id ? ownerDocument.getElementById(id) : null

      if (target) {
        targets.push({ link, target })
      }
    }

    if (!targets.length) continue

    const headings = targets.map(({ target }) => target)

    const setActive = (active: HTMLAnchorElement): void => {
      for (const link of links) {
        const isActive = link === active

        link.dataset.active = String(isActive)

        if (isActive) {
          link.setAttribute('aria-current', 'location')
        } else {
          link.removeAttribute('aria-current')
        }
      }
    }

    const update = (): void => {
      const index = getLumenActiveAnchorIndex(headings, Number(root.dataset.uiAnchorOffset))
      const active = targets[index]?.link

      if (active) setActive(active)
    }

    for (const { link } of targets) {
      link.addEventListener('click', () => {
        setActive(link)
      })
    }

    getAnchorDispatcher(ownerDocument).callbacks.set(root, update)

    update()
  }
}

let scrollProgressFrame = 0
let scrollProgressObserver: ResizeObserver | undefined
let scrollProgressListening = false

const getProgressTarget = (root: HTMLElement): HTMLElement | null => {
  const id = root.dataset.uiScrollProgressTarget

  return id ? root.ownerDocument.getElementById(id) : null
}

const getTargetProgress = (target: HTMLElement, scrollingElement: Element): number => {
  const bounds = target.getBoundingClientRect()

  if (bounds.height <= 0) return 0

  const height = scrollingElement.clientHeight
  const padding = window.getComputedStyle(scrollingElement).scrollPaddingTop.trim()
  const amount = Number.parseFloat(padding)
  const resolved = padding.endsWith('%') ? amount * height / 100 : amount
  const start = Number.isFinite(resolved) ? Math.max(0, resolved) : 0

  if (bounds.bottom <= height) return 100

  const distance = bounds.height - (height - start)

  return distance > 0 ? Math.min(100, Math.max(0, (start - bounds.top) / distance * 100)) : 0
}

const updateScrollProgress = (): void => {
  scrollProgressFrame = 0

  const scrollingElement = document.scrollingElement ?? document.documentElement
  const maximum = scrollingElement.scrollHeight - scrollingElement.clientHeight

  const documentPercentage = maximum > 0 ?
    Math.min(100, Math.max(0, (scrollingElement.scrollTop / maximum) * 100)) :
    0

  const progress = [...document.querySelectorAll<HTMLElement>('[data-ui-scroll-progress]')].map(root => {
    const target = getProgressTarget(root)

    return { percentage: target ? getTargetProgress(target, scrollingElement) : documentPercentage, root }
  })

  for (const { percentage, root } of progress) {
    const bar = root.querySelector<HTMLElement>('.ui-scroll-progress__bar')

    root.dataset.uiBound = 'true'

    root.setAttribute('aria-valuenow', `${Math.round(percentage)}`)

    if (bar) bar.style.transform = `scaleX(${percentage / 100})`
  }
}

const requestScrollProgressUpdate = (): void => {
  if (scrollProgressFrame) return

  scrollProgressFrame = requestAnimationFrame(updateScrollProgress)
}

const initScrollProgress = (): void => {
  scrollProgressObserver?.disconnect()

  const roots = document.querySelectorAll<HTMLElement>('[data-ui-scroll-progress]')

  if (!roots.length) return

  if (typeof ResizeObserver !== 'undefined') {
    scrollProgressObserver ??= new ResizeObserver(requestScrollProgressUpdate)

    scrollProgressObserver.observe(document.body)

    for (const root of roots) {
      const target = getProgressTarget(root)

      if (target) scrollProgressObserver.observe(target)
    }
  }

  requestScrollProgressUpdate()

  if (scrollProgressListening) return

  scrollProgressListening = true

  window.addEventListener('resize', requestScrollProgressUpdate, { passive: true })

  window.addEventListener('scroll', requestScrollProgressUpdate, { passive: true })
}

export const initDocumentNavigationControllers = (scope: ParentNode): void => {
  initAnchors(scope)

  initScrollProgress()
}
