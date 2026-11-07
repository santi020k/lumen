/** Keep literal percent signs usable while decoding ordinary URL fragments. */
export const decodeLumenAnchorFragment = (fragment: string): string => {
  try {
    return decodeURIComponent(fragment)
  } catch {
    return fragment
  }
}

const isOrdinaryAnchorClick = (event: MouseEvent): boolean => !event.defaultPrevented && event.button === 0 &&
  !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey

const usesCurrentBrowsingContext = (link: HTMLAnchorElement): boolean => {
  const target = link.getAttribute('target') ??
    link.ownerDocument.querySelector('base[target]')?.getAttribute('target') ?? ''

  return link.isConnected && !link.hasAttribute('download') && (!target || target.toLowerCase() === '_self')
}

const hasCurrentDocumentURL = (link: HTMLAnchorElement, location: Location): boolean => {
  try {
    const destination = new URL(link.href)

    return destination.origin === location.origin && destination.pathname === location.pathname &&
      destination.search === location.search
  } catch {
    // A non-hierarchical base URL can leave a fragment unresolved.
    return false
  }
}

const getAnchorDestination = (link: HTMLAnchorElement): HTMLElement | null => {
  const href = link.getAttribute('href') ?? ''
  const owner = link.ownerDocument
  const view = owner.defaultView

  if (!view || !href.startsWith('#') || href.length === 1) return null

  if (!hasCurrentDocumentURL(link, view.location)) return null

  return owner.getElementById(decodeLumenAnchorFragment(href.slice(1)))
}

const focusAnchorDestination = (target: HTMLElement): boolean => {
  const temporary = !target.hasAttribute('tabindex') && target.tabIndex < 0 && !target.isContentEditable

  const cleanup = () => {
    if (target.getAttribute('tabindex') === '-1') target.removeAttribute('tabindex')
  }

  if (temporary) {
    target.setAttribute('tabindex', '-1')

    target.addEventListener('blur', cleanup, { once: true })
  }

  target.focus({ preventScroll: true })

  const focused = target.ownerDocument.activeElement === target

  if (temporary && !focused) {
    target.removeEventListener('blur', cleanup)

    cleanup()
  }

  return focused
}

/** Focus an activated local destination without replacing native hash scrolling or history. */
export const activateLumenAnchor = (link: HTMLAnchorElement, event: MouseEvent): boolean => {
  if (!isOrdinaryAnchorClick(event) || !usesCurrentBrowsingContext(link)) return false

  const target = getAnchorDestination(link)

  return target ? focusAnchorDestination(target) : false
}

const measuredPadding = new WeakMap<Document, { key: string, value: number }>()

const scrollLength = (value: string | undefined, basis: number): number => {
  const amount = Number.parseFloat(value ?? '')

  if (!Number.isFinite(amount)) return 0

  return value?.trim().endsWith('%') ? amount * basis / 100 : amount
}

const getScrollPadding = (owner: Document, scrollingElement: Element): number => {
  const view = owner.defaultView

  if (!view) return 0

  const value = view.getComputedStyle(scrollingElement).scrollPaddingTop
  const basis = scrollingElement.clientHeight

  if (!value || value === 'auto' || Number.isFinite(Number.parseFloat(value))) return scrollLength(value, basis)

  // Let the CSS engine resolve mixed percentage/length math instead of maintaining a CSS parser.
  const key = `${value}:${basis}:${view.innerWidth}`
  const cached = measuredPadding.get(owner)

  if (cached?.key === key) return cached.value

  const container = owner.createElement('div')
  const probe = owner.createElement('div')

  container.style.cssText = `all:initial;position:fixed;top:0;left:0;width:0;height:${basis}px;contain:strict;visibility:hidden;pointer-events:none`

  probe.style.cssText = 'all:initial;display:block;width:0;min-height:0;max-height:none;padding:0;border:0;margin:0'

  probe.style.height = value

  container.append(probe)

  owner.documentElement.append(container)

  const resolved = scrollLength(view.getComputedStyle(probe).height, basis)

  container.remove()

  measuredPadding.set(owner, { key, value: resolved })

  return resolved
}

const atDocumentEnd = (scrollingElement: Element): boolean => {
  const maximum = scrollingElement.scrollHeight - scrollingElement.clientHeight

  return maximum > 0 && scrollingElement.scrollTop > 0 && scrollingElement.scrollTop >= maximum - 1
}

/** Selects a document heading using its native fragment landing line. Returns -1 for no targets. */
export const getLumenActiveAnchorIndex = (
  targets: readonly HTMLElement[],
  activationOffset = 0
): number => {
  const owner = targets[0]?.ownerDocument

  if (!owner) return -1

  const scrollingElement = owner.scrollingElement ?? owner.documentElement

  if (atDocumentEnd(scrollingElement)) return targets.length - 1

  const view = owner.defaultView
  const minimum = Number.isFinite(activationOffset) ? Math.max(0, activationOffset) : 0
  const padding = getScrollPadding(owner, scrollingElement)
  let active = 0

  for (const [index, target] of targets.entries()) {
    // Read live styles: text resizing, responsive headers, and target classes can change the landing line.
    const margin = scrollLength(view?.getComputedStyle(target).scrollMarginTop, 0)
    const landingLine = Math.max(minimum, padding + margin)

    // Native fragment scrolling can round a fractional landing position to the next CSS pixel.
    if (target.getBoundingClientRect().top > landingLine + 1) break

    active = index
  }

  return active
}

/** Returns document or content-scoped reading progress as a ratio between zero and one. */
export const getLumenScrollProgress = (scroller: Element, target: HTMLElement | null = null): number => {
  const clamp = (ratio: number) => Math.min(1, Math.max(0, ratio))
  const height = scroller.clientHeight

  if (!target) return clamp(scroller.scrollTop / Math.max(1, scroller.scrollHeight - height))

  const rect = target.getBoundingClientRect()

  if (!rect.height) return 0

  if (rect.bottom <= height) return 1

  const padding = scroller.ownerDocument.defaultView?.getComputedStyle(scroller).scrollPaddingTop ?? ''
  let start = Number.parseFloat(padding) || 0

  if (padding.endsWith('%')) start *= height / 100

  return clamp((start - rect.top) / Math.max(1, rect.height - height + start))
}
