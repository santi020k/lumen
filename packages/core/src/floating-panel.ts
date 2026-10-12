export type LumenFloatingPanelPlacement = 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start'

export interface LumenFloatingPanelOptions {
  /** Logical alignment follows the trigger's inherited text direction. */
  placement?: LumenFloatingPanelPlacement | undefined
  offset?: number | undefined
  collisionPadding?: number | undefined
  /** Focus the first matching element inside the panel after it opens. A malformed selector skips focus. */
  initialFocus?: string | undefined
  /**
   * Called when the panel should close: focus moves outside, its containing dialog closes, or the trigger
   * or panel leaves the document. The caller hides the panel and calls the cleanup.
   */
  onDismiss: () => void
}

type FloatingView = NonNullable<Document['defaultView']>

interface FloatingContext {
  panel: HTMLElement
  trigger: HTMLElement
  view: FloatingView
  placement: LumenFloatingPanelPlacement
  gap: number
  padding: number
}

const finiteDistance = (value: number | undefined, fallback: number): number => {
  if (value === undefined || !Number.isFinite(value)) return fallback

  return Math.max(0, value)
}

const clamp = (value: number, minimum: number, maximum: number): number => {
  const upperBound = Math.max(minimum, maximum)

  return Math.max(minimum, Math.min(value, upperBound))
}

const styleKeys = [
  'box-sizing',
  'position',
  'inset',
  'left',
  'top',
  'right',
  'bottom',
  'margin',
  'max-width',
  'max-height',
  'overflow-y'
] as const

const viewportBounds = ({ view, padding }: FloatingContext) => {
  const viewport = view.visualViewport
  const left = (viewport?.offsetLeft ?? 0) + padding
  const top = (viewport?.offsetTop ?? 0) + padding
  const width = Math.max(0, (viewport?.width ?? view.innerWidth) - padding * 2)
  const height = Math.max(0, (viewport?.height ?? view.innerHeight) - padding * 2)

  return { left, top, width, height, right: left + width, bottom: top + height }
}

const shouldPlaceBelow = (placement: LumenFloatingPanelPlacement, above: number, below: number, height: number): boolean => placement.startsWith('bottom') ? below >= height || below >= above : !(above >= height || above >= below)

const positionPanel = (context: FloatingContext): void => {
  const { panel, trigger, view, placement, gap } = context
  const viewport = viewportBounds(context)
  const anchor = trigger.getBoundingClientRect()

  panel.style.boxSizing = 'border-box'

  panel.style.position = 'fixed'

  panel.style.inset = 'auto'

  panel.style.margin = '0'

  panel.style.maxWidth = `${viewport.width}px`

  panel.style.maxHeight = `${viewport.height}px`

  panel.style.overflowY = 'auto'

  const below = Math.max(0, viewport.bottom - anchor.bottom - gap)
  const above = Math.max(0, anchor.top - viewport.top - gap)
  const placeBelow = shouldPlaceBelow(placement, above, below, panel.getBoundingClientRect().height)
  const availableHeight = placeBelow ? below : above

  panel.style.maxHeight = `${Math.min(viewport.height, availableHeight || viewport.height)}px`

  const bounds = panel.getBoundingClientRect()
  const rtl = view.getComputedStyle(trigger).direction === 'rtl'
  const alignRight = placement.endsWith('end') !== rtl
  const x = alignRight ? anchor.right - bounds.width : anchor.left
  const y = placeBelow ? anchor.bottom + gap : anchor.top - bounds.height - gap
  const alignment = placement.endsWith('end') ? 'end' : 'start'

  panel.style.left = `${clamp(x, viewport.left, viewport.right - bounds.width)}px`

  panel.style.top = `${clamp(y, viewport.top, viewport.bottom - bounds.height)}px`

  panel.dataset.placement = `${placeBelow ? 'bottom' : 'top'}-${alignment}`
}

// Transform transitions and animations move the trigger without resizing it, so ResizeObserver stays quiet.
const settleEvents = ['animationend', 'animationcancel', 'transitionend', 'transitioncancel'] as const

const observePosition = (context: FloatingContext, dismiss: () => void): (() => void) => {
  const { panel, trigger, view } = context
  const document = panel.ownerDocument
  const NodeType = view.Node
  const dialog = trigger.closest('dialog')

  const position = () => {
    positionPanel(context)
  }

  const focusOutside = (event: FocusEvent) => {
    if (event.target instanceof NodeType &&
      !panel.contains(event.target) && !trigger.contains(event.target)) dismiss()
  }

  const scroll = (event: Event) => {
    if (!(event.target instanceof NodeType) || !panel.contains(event.target)) position()
  }

  const observer = typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(position) : undefined

  // Removing an open panel's owner must not leave document listeners or an expanded trigger behind.
  const removal = typeof view.MutationObserver === 'function' ?
    new view.MutationObserver(() => {
      if (!trigger.isConnected || !panel.isConnected ||
        trigger.ownerDocument !== document || panel.ownerDocument !== document) dismiss()
    }) :
    undefined

  removal?.observe(document, { childList: true, subtree: true })

  observer?.observe(trigger)

  observer?.observe(panel)

  document.addEventListener('focusin', focusOutside)

  document.addEventListener('scroll', scroll, true)

  for (const type of settleEvents) document.addEventListener(type, position, true)

  // Some engines move focus to the body without a focusin when a containing dialog closes.
  dialog?.addEventListener('close', dismiss)

  view.addEventListener('resize', position)

  view.visualViewport?.addEventListener('resize', position)

  view.visualViewport?.addEventListener('scroll', position)

  return () => {
    observer?.disconnect()

    removal?.disconnect()

    document.removeEventListener('focusin', focusOutside)

    document.removeEventListener('scroll', scroll, true)

    for (const type of settleEvents) document.removeEventListener(type, position, true)

    dialog?.removeEventListener('close', dismiss)

    view.removeEventListener('resize', position)

    view.visualViewport?.removeEventListener('resize', position)

    view.visualViewport?.removeEventListener('scroll', position)
  }
}

const restoreExternalFocus = (owner: Document, focused: Element | null): void => {
  const ElementType = owner.defaultView?.HTMLElement

  if (ElementType && focused instanceof ElementType && focused.isConnected && owner.activeElement !== focused) {
    focused.focus({ preventScroll: true })
  }
}

const restoreFocus = (panel: HTMLElement, trigger: HTMLElement, topLayer: boolean): void => {
  const document = panel.ownerDocument
  const focused = document.activeElement
  const ownedFocus = focused !== null && panel.contains(focused)

  if (topLayer && panel.matches(':popover-open')) panel.hidePopover()

  if (ownedFocus && trigger.isConnected) trigger.focus({ preventScroll: true })

  // Closing a panel must not steal focus from a dialog opened by its action.
  if (!ownedFocus) restoreExternalFocus(document, focused)
}

const restoreAttribute = (panel: HTMLElement, name: string, value: string | null): void => {
  if (value === null) panel.removeAttribute(name)
  else panel.setAttribute(name, value)
}

// A malformed selector must not abort after the panel is shown, so it is resolved first and only skips focus.
const findInitialFocus = (panel: HTMLElement, view: FloatingView, selector: string | undefined): HTMLElement | null => {
  if (!selector) return null

  try {
    return panel.querySelector<HTMLElement>(selector)
  } catch (error) {
    if (error instanceof view.DOMException && error.name === 'SyntaxError') return null

    throw error
  }
}

/**
 * Shows `panel` anchored to `trigger`: in the top layer when the Popover API exists, otherwise fixed. The
 * panel follows scroll, resize, visual viewport, and enclosing animation changes, flips to stay visible,
 * honors RTL, and calls `onDismiss` on outside focus, when its containing dialog closes, or when the trigger
 * or panel leaves the document. Connecting makes the panel visible; the caller owns hiding it again. The returned
 * cleanup leaves the top layer, returns owned focus to the trigger, restores the panel's previous inline
 * styles and popover attributes, and removes every listener and observer.
 */
export const connectLumenFloatingPanel = (
  panel: HTMLElement,
  trigger: HTMLElement,
  { placement = 'bottom-start', offset, collisionPadding, initialFocus, onDismiss }: LumenFloatingPanelOptions
): (() => void) => {
  const view = panel.ownerDocument.defaultView

  if (!view) return () => undefined

  const context: FloatingContext = {
    panel,
    trigger,
    view,
    placement,
    gap: finiteDistance(offset, 6),
    padding: finiteDistance(collisionPadding, 8)
  }

  const focusTarget = findInitialFocus(panel, view, initialFocus)
  const previousPopover = panel.getAttribute('popover')
  const previousPlacement = panel.getAttribute('data-placement')

  const previousStyles = styleKeys.map(key => [
    key, panel.style.getPropertyValue(key), panel.style.getPropertyPriority(key)
  ] as const)

  const topLayer = typeof panel.showPopover === 'function'

  panel.hidden = false

  if (topLayer) {
    panel.setAttribute('popover', 'manual')

    panel.showPopover()
  }

  positionPanel(context)

  focusTarget?.focus({ preventScroll: true })

  let connected = true

  const dismiss = () => {
    if (connected) onDismiss()
  }

  const stopObserving = observePosition(context, dismiss)

  return () => {
    if (!connected) return

    connected = false

    stopObserving()

    restoreFocus(panel, trigger, topLayer)

    restoreAttribute(panel, 'popover', previousPopover)

    restoreAttribute(panel, 'data-placement', previousPlacement)

    for (const [key, value, priority] of previousStyles) {
      if (value) panel.style.setProperty(key, value, priority)
      else panel.style.removeProperty(key)
    }
  }
}
