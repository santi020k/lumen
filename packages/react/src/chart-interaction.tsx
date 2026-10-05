'use client'

import { type ReactNode, useEffect, useRef } from 'react'

import {
  createLumenChartInteractionController,
  type createLumenLineChartModel,
  type LumenChartCursorChangeDetail,
  type LumenChartInteractionController
} from '@santi020k/lumen-core'

export interface ChartInteractionProps {
  interactive?: boolean
  onCursorChange?: (detail: LumenChartCursorChangeDetail) => void
  /** A stable X identity; null clears the cursor. */
  cursor?: number | string | null
  syncGroup?: string
}

const useChartInteraction = (
  { cursor, interactive, onCursorChange }: ChartInteractionProps,
  bindingKey: string
) => {
  const ref = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<LumenChartInteractionController | null>(null)

  useEffect(() => {
    if (!interactive || !ref.current) return

    const root = ref.current
    const instance = createLumenChartInteractionController(root)

    controllerRef.current = instance

    return () => {
      instance.destroy()

      controllerRef.current = null
    }
  }, [interactive, bindingKey])

  useEffect(() => {
    controllerRef.current?.setControlledCursor(cursor)
  }, [cursor, interactive, bindingKey])

  useEffect(() => {
    const root = ref.current

    if (!root || !onCursorChange) return

    const CustomEventType = root.ownerDocument.defaultView?.CustomEvent

    const listener = (event: Event) => {
      if (!CustomEventType || !(event instanceof CustomEventType)) return

      const detail: unknown = event.detail

      if (detail === null || typeof detail !== 'object' || !('x' in detail)) return

      const x = detail.x

      if (x === null || typeof x === 'string' || (typeof x === 'number' && Number.isFinite(x))) onCursorChange({ x })
    }

    root.addEventListener('ui:chart-cursor-change', listener)

    return () => {
      root.removeEventListener('ui:chart-cursor-change', listener)
    }
  }, [onCursorChange])

  return ref
}

interface ChartInteractionContainerProps extends ChartInteractionProps {
  children: ReactNode
  showLegend: boolean
  model: ReturnType<typeof createLumenLineChartModel>
}

export const ChartInteraction = ({
  children, model, showLegend, syncGroup, ...props
}: ChartInteractionContainerProps) => {
  const bindingKey = JSON.stringify([
    model.categories, model.positions, model.series.map(series => series.id), showLegend, syncGroup
  ])

  const ref = useChartInteraction(props, bindingKey)

  return <div className="ui-chart__content" data-ui-chart-sync={syncGroup} ref={ref}>{children}</div>
}
