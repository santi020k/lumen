/** Keep literal percent signs usable while decoding ordinary URL fragments. */
export const decodeLumenAnchorFragment = (fragment: string): string => {
  try {
    return decodeURIComponent(fragment)
  } catch {
    return fragment
  }
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
