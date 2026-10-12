import type { RefObject } from 'react'
import { useEffect, useLayoutEffect, useRef } from 'react'

import { connectLumenFloatingPanel, type LumenFloatingPanelPlacement } from '@santi020k/lumen-core'

export interface FloatingPanelOptions {
  /** Logical alignment follows the trigger's inherited text direction. */
  placement?: LumenFloatingPanelPlacement | undefined
  offset?: number | undefined
  collisionPadding?: number | undefined
  /** Disable placement when an application owns a specialized panel layout. */
  positioning?: 'anchored' | 'none' | undefined
}

const firstMenuItem = '[role="menuitem"]:not(:disabled):not([aria-disabled="true"])'

export const useFloatingPanel = (
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  close: () => void,
  { placement = 'bottom-start', offset, collisionPadding, positioning = 'anchored' }: FloatingPanelOptions
): void => {
  const closeRef = useRef(close)

  useLayoutEffect(() => {
    closeRef.current = close
  }, [close])

  useEffect(() => {
    const panel = panelRef.current
    const trigger = triggerRef.current

    if (!open || positioning === 'none' || !panel || !trigger) return

    return connectLumenFloatingPanel(panel, trigger, {
      collisionPadding,
      initialFocus: firstMenuItem,
      offset,
      onDismiss: () => {
        closeRef.current()
      },
      placement
    })
  }, [open, positioning, placement, offset, collisionPadding, triggerRef, panelRef])
}
