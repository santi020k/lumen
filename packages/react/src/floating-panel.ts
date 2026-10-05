import type { RefObject } from 'react'
import { useEffect } from 'react'

export interface FloatingPanelOptions {
  /** Logical alignment follows the trigger's inherited text direction. */
  placement?: 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start' | undefined
  offset?: number | undefined
  collisionPadding?: number | undefined
  /** Disable placement when an application owns a specialized panel layout. */
  positioning?: 'anchored' | 'none' | undefined
}

type Placement = NonNullable<FloatingPanelOptions['placement']>

interface FloatingContext {
  panel: HTMLElement
  trigger: HTMLElement
  view: Window
  placement: Placement
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

const shouldPlaceBelow = (placement: Placement, above: number, below: number, height: number): boolean => placement.startsWith('bottom') ? below >= height || below >= above : !(above >= height || above >= below)

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

const observePosition = (context: FloatingContext, close: () => void): (() => void) => {
  const { panel, trigger, view } = context
  const document = panel.ownerDocument
  const NodeType = document.defaultView?.Node

  const position = () => {
    positionPanel(context)
  }

  const focusOutside = (event: FocusEvent) => {
    if (NodeType && event.target instanceof NodeType &&
      !panel.contains(event.target) && !trigger.contains(event.target)) close()
  }

  const scroll = (event: Event) => {
    if (!(NodeType && event.target instanceof NodeType) || !panel.contains(event.target)) position()
  }

  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(position) : undefined

  observer?.observe(trigger)

  observer?.observe(panel)

  document.addEventListener('focusin', focusOutside)

  document.addEventListener('scroll', scroll, true)

  view.addEventListener('resize', position)

  view.visualViewport?.addEventListener('resize', position)

  view.visualViewport?.addEventListener('scroll', position)

  return () => {
    observer?.disconnect()

    document.removeEventListener('focusin', focusOutside)

    document.removeEventListener('scroll', scroll, true)

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

  // Closing a menu must not steal focus from a dialog opened by its action.
  if (!ownedFocus) restoreExternalFocus(document, focused)
}

const restoreAttribute = (panel: HTMLElement, name: string, value: string | null): void => {
  if (value === null) panel.removeAttribute(name)
  else panel.setAttribute(name, value)
}

const connectPanel = (context: FloatingContext, close: () => void): (() => void) => {
  const { panel, trigger } = context
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

  panel.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled):not([aria-disabled="true"])')
    ?.focus({ preventScroll: true })

  const stopObserving = observePosition(context, close)

  return () => {
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

export const useFloatingPanel = (
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  close: () => void,
  { placement = 'bottom-start', offset, collisionPadding, positioning = 'anchored' }: FloatingPanelOptions
): void => {
  useEffect(() => {
    const panel = panelRef.current
    const trigger = triggerRef.current

    if (!open || positioning === 'none' || !panel || !trigger) return

    const view = panel.ownerDocument.defaultView

    if (!view) return

    return connectPanel({
      panel,
      trigger,
      view,
      placement,
      gap: finiteDistance(offset, 6),
      padding: finiteDistance(collisionPadding, 8)
    }, close)
  }, [open, positioning, placement, offset, collisionPadding, triggerRef, panelRef, close])
}
