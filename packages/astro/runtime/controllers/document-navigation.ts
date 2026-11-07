import { activateLumenAnchor, decodeLumenAnchorFragment, getLumenActiveAnchorIndex, getLumenScrollProgress } from '@santi020k/lumen-core'

import { queryScope } from '../scope.js'

const anchors = new WeakMap<HTMLElement, () => void>()
let observer: ResizeObserver | undefined
const bars = () => document.querySelectorAll<HTMLElement>('[data-ui-scroll-progress][data-ui-bound="true"]')
const getTarget = (root: HTMLElement) => document.getElementById(root.dataset.uiScrollProgressTarget ?? '')

const updateProgress = (roots: Iterable<HTMLElement> = bars()): void => {
  const scroller = document.scrollingElement ?? document.documentElement
  const progress = Array.from(roots, root => [root, getLumenScrollProgress(scroller, getTarget(root))] as const)

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
  for (const root of queryScope(scope, '[data-ui-anchor]')) {
    if (root.dataset.uiBound === 'true' || root.closest('[data-ui-owner], lumen-anchor')) continue

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

    for (const { link } of targets) link.addEventListener('click', event => {
      setTimeout(() => {
        if (activateLumenAnchor(link, event)) setActive(link)
      })
    })

    anchors.set(root, update)

    bindRefresh(root.ownerDocument)

    update()
  }
}

const initScrollProgress = (scope: ParentNode): void => {
  const roots = queryScope(scope, '[data-ui-scroll-progress]')

  if (!roots.length) return

  updateProgress(roots)

  observer?.disconnect()

  const refresh = bindRefresh(document)

  if (typeof ResizeObserver !== 'undefined') {
    observer ??= new ResizeObserver(refresh)

    observer.observe(document.body)

    for (const root of bars()) {
      const target = getTarget(root)

      if (target) observer.observe(target)
    }
  }

  refresh()
}

export const initDocumentNavigationControllers = (scope: ParentNode): void => {
  initAnchors(scope)

  initScrollProgress(scope)
}
