const initAnchors = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-anchor]')) {
    if (root.dataset.uiBound === 'true') continue

    root.dataset.uiBound = 'true'

    const links = [...root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')]
    const targets: { link: HTMLAnchorElement, target: HTMLElement }[] = []

    for (const link of links) {
      const id = decodeURIComponent(link.getAttribute('href')?.slice(1) ?? '')
      const target = id ? document.getElementById(id) : null

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
      const scrollingElement = document.scrollingElement ?? document.documentElement

      const atEnd = scrollingElement.scrollTop + scrollingElement.clientHeight >=
        scrollingElement.scrollHeight - 1

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

    let frame = 0

    const requestUpdate = (): void => {
      if (frame) return

      frame = requestAnimationFrame(() => {
        frame = 0

        update()
      })
    }

    for (const { link } of targets) {
      link.addEventListener('click', () => {
        setActive(link)
      })
    }

    window.addEventListener('resize', requestUpdate, { passive: true })

    window.addEventListener('scroll', requestUpdate, { passive: true })

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
