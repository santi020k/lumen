const decodeFragment = (fragment: string): string => {
  try {
    return decodeURIComponent(fragment)
  } catch {
    // A literal percent sign can still identify a section; isolate malformed escapes.
    return fragment
  }
}

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
      const id = decodeFragment(fragment)
      const target = id ? ownerDocument.getElementById(id) : null

      if (target) {
        targets.push({ link, target })
      }
    }

    if (!targets.length) continue

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
      const scrollingElement = ownerDocument.scrollingElement ?? ownerDocument.documentElement
      const maximum = scrollingElement.scrollHeight - scrollingElement.clientHeight
      const atEnd = maximum > 0 && scrollingElement.scrollTop >= maximum - 1
      const offset = Number(root.dataset.uiAnchorOffset) || 0
      let active = targets[0]?.link

      if (atEnd) {
        active = targets.at(-1)?.link
      } else {
        for (const item of targets) {
          if (item.target.getBoundingClientRect().top > offset) break

          active = item.link
        }
      }

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

const updateScrollProgress = (): void => {
  scrollProgressFrame = 0

  const scrollingElement = document.scrollingElement ?? document.documentElement
  const maximum = scrollingElement.scrollHeight - scrollingElement.clientHeight

  const percentage = maximum > 0 ?
    Math.min(100, Math.max(0, (scrollingElement.scrollTop / maximum) * 100)) :
    0

  for (const root of document.querySelectorAll<HTMLElement>('[data-ui-scroll-progress]')) {
    const bar = root.querySelector<HTMLElement>('.ui-scroll-progress__bar')

    root.setAttribute('aria-valuenow', `${Math.round(percentage)}`)

    if (bar) bar.style.transform = `scaleX(${percentage / 100})`
  }
}

const requestScrollProgressUpdate = (): void => {
  if (scrollProgressFrame) return

  scrollProgressFrame = requestAnimationFrame(updateScrollProgress)
}

const initScrollProgress = (scope: ParentNode): void => {
  if (!scope.querySelector('[data-ui-scroll-progress]')) return

  requestScrollProgressUpdate()

  if (document.documentElement.dataset.uiScrollProgressBound === 'true') return

  document.documentElement.dataset.uiScrollProgressBound = 'true'

  window.addEventListener('resize', requestScrollProgressUpdate, { passive: true })

  window.addEventListener('scroll', requestScrollProgressUpdate, { passive: true })
}

export const initDocumentNavigationControllers = (scope: ParentNode): void => {
  initAnchors(scope)

  initScrollProgress(scope)
}
