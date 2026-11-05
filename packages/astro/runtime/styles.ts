const requests = new WeakMap<Document, Map<string, Promise<void>>>()

/** Load generated runtime-only CSS once, retaining successful links across navigation. */
export const loadRuntimeStylesheet = (owner: Document, href: string): Promise<void> => {
  const pending = requests.get(owner) ?? new Map<string, Promise<void>>()
  const existing = pending.get(href)

  if (existing) return existing

  const link = owner.createElement('link')

  const request = new Promise<void>((resolve, reject) => {
    link.rel = 'stylesheet'

    link.href = href

    link.addEventListener('load', () => {
      resolve()
    }, { once: true })

    link.addEventListener('error', () => {
      pending.delete(href)

      link.remove()

      reject(new Error('Lumen runtime styles failed to load. Reload to request the current deployment assets.'))
    }, { once: true })
  })

  pending.set(href, request)

  requests.set(owner, pending)

  owner.head.append(link)

  return request
}
