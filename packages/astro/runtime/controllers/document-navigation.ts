import { decodeLumenAnchorFragment, getLumenActiveAnchorIndex } from '@santi020k/lumen-core'

const anchors = new WeakMap<HTMLElement, () => void>()
let observer: ResizeObserver | undefined
const bars = () => document.querySelectorAll<HTMLElement>('[data-ui-scroll-progress]')
const getTarget = (root: HTMLElement) => document.getElementById(root.dataset.uiScrollProgressTarget ?? '')
const clamp = (ratio: number) => Math.min(1, Math.max(0, ratio))

const readProgress = (scroller: Element, target: HTMLElement | null): number => {
  const height = scroller.clientHeight

  if (!target) return clamp(scroller.scrollTop / Math.max(1, scroller.scrollHeight - height))

  const rect = target.getBoundingClientRect()

  if (!rect.height) return 0

  if (rect.bottom <= height) return 1

  const padding = getComputedStyle(scroller).scrollPaddingTop
  let start = parseFloat(padding) || 0

  if (padding.endsWith('%')) start *= height / 100

  return clamp((start - rect.top) / Math.max(1, rect.height - height + start))
}

const updateProgress = (): void => {
  const scroller = document.scrollingElement ?? document.documentElement
  const progress = Array.from(bars(), root => [root, readProgress(scroller, getTarget(root))] as const)

  for (const [root, ratio] of progress) {
    const bar = root.querySelector<HTMLElement>('.ui-scroll-progress__bar')

    root.dataset.uiBound = 'true'

    root.setAttribute('aria-valuenow', String(Math.round(ratio * 100)))

    if (bar) bar.style.transform = `scaleX(${ratio})`
  }
}

const refreshers = new WeakMap<Document, () => void>()

const bindRefresh = (doc: Document) => {
  const existing = refreshers.get(doc)

  if (existing) return existing

  let frame = 0

  const refresh = (): void => {
    if (frame) return

    frame = requestAnimationFrame(() => {
      frame = 0

      for (const root of doc.querySelectorAll<HTMLElement>('[data-ui-anchor]')) anchors.get(root)?.()

      if (doc === document) updateProgress()
    })
  }

  for (const event of ['resize', 'scroll']) doc.defaultView?.addEventListener(event, refresh, { passive: true })

  refreshers.set(doc, refresh)

  return refresh
}

const initAnchors = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-anchor]')) {
    if (root.dataset.uiBound === 'true') continue

    root.dataset.uiBound = 'true'

    const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'))

    const targets = links.flatMap(link => {
      const id = decodeLumenAnchorFragment(link.hash.slice(1))
      const target = root.ownerDocument.getElementById(id)

      return target ? [{ link, target }] : []
    })

    if (!targets.length) continue

    const headings = targets.map(({ target }) => target)

    const setActive = (active: HTMLAnchorElement): void => {
      for (const link of links) {
        const isActive = link === active

        link.dataset.active = String(isActive)

        if (isActive) link.setAttribute('aria-current', 'location')
        else link.removeAttribute('aria-current')
      }
    }

    const update = (): void => {
      const index = getLumenActiveAnchorIndex(headings, Number(root.dataset.uiAnchorOffset))
      const active = targets[index]?.link

      if (active) setActive(active)
    }

    for (const { link } of targets) link.addEventListener('click', () => {
      setActive(link)
    })

    anchors.set(root, update)

    bindRefresh(root.ownerDocument)

    update()
  }
}

const initScrollProgress = (): void => {
  observer?.disconnect()

  const roots = bars()

  if (!roots.length) return

  const refresh = bindRefresh(document)

  if (typeof ResizeObserver !== 'undefined') {
    observer ??= new ResizeObserver(refresh)

    observer.observe(document.body)

    for (const root of roots) {
      const target = getTarget(root)

      if (target) observer.observe(target)
    }
  }

  refresh()
}

export const initDocumentNavigationControllers = (scope: ParentNode): void => {
  initAnchors(scope)

  initScrollProgress()
}
