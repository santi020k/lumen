import { useState } from 'react'
import type { LayoutChangeEvent } from 'react-native'

/** Recompute geometry at container size instead of shrinking text or hiding points offscreen. */
export const useLumenChartLayout = (): {
  height: number
  onLayout: (event: LayoutChangeEvent) => void
  width: number
} => {
  const [width, setWidth] = useState(320)

  return {
    height: Math.min(320, Math.max(220, width * 0.75)),
    onLayout: event => {
      const measured = event.nativeEvent.layout.width

      if (Number.isFinite(measured) && measured > 0) setWidth(Math.floor(measured))
    },
    width
  }
}
