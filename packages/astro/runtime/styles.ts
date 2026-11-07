const requests = new WeakMap<Document, Map<string, Promise<void>>>()

const preserveAcrossNavigation = (owner: Document, links: Set<HTMLLinkElement>): void => {
  owner.addEventListener('astro:before-swap', event => {
    if (!('newDocument' in event) || !(event.newDocument instanceof Document)) return

    const next = event.newDocument

    for (const link of links) {
      if (!link.isConnected) continue

      const present = [...next.head.querySelectorAll('link[rel="stylesheet"]')]
        .some(candidate => candidate.getAttribute('href') === link.getAttribute('href'))

      // Astro retains the live link when its destination document contains a matching
      // stylesheet. The placeholder is removed during the head swap, not fetched twice.
      if (!present) next.head.append(link.cloneNode())
    }
  })
}

const retained = new WeakMap<Document, Set<HTMLLinkElement>>()

/** Load generated runtime-only CSS once, retaining successful links across navigation. */
export const loadRuntimeStylesheet = (owner: Document, href: string): Promise<void> => {
  const pending = requests.get(owner) ?? new Map<string, Promise<void>>()
  const existing = pending.get(href)

  if (existing) return existing

  const link = owner.createElement('link')
  let links = retained.get(owner)

  if (!links) {
    links = new Set()

    retained.set(owner, links)

    preserveAcrossNavigation(owner, links)
  }

  links.add(link)

  const request = new Promise<void>((resolve, reject) => {
    link.rel = 'stylesheet'

    link.href = href

    link.addEventListener('load', () => {
      resolve()
    }, { once: true })

    link.addEventListener('error', () => {
      pending.delete(href)

      retained.get(owner)?.delete(link)

      link.remove()

      reject(new Error('Lumen runtime styles failed to load. Reload to request the current deployment assets.'))
    }, { once: true })
  })

  pending.set(href, request)

  requests.set(owner, pending)

  owner.head.append(link)

  return request
}
