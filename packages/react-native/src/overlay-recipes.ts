export interface LumenMenuPositionInput {
  anchorHeight: number
  anchorWidth: number
  anchorX: number
  anchorY: number
  itemCount: number
  margin: number
  menuWidth: number
  windowHeight: number
  windowWidth: number
}

export interface LumenMenuPosition {
  left: number
  top: number
}

export const resolveLumenMenuPosition = ({
  anchorHeight,
  anchorWidth,
  anchorX,
  anchorY,
  itemCount,
  margin,
  menuWidth,
  windowHeight,
  windowWidth
}: LumenMenuPositionInput): LumenMenuPosition => {
  const left = Math.max(
    margin,
    Math.min(anchorX + anchorWidth - menuWidth, windowWidth - menuWidth - margin)
  )

  const estimatedHeight = Math.max(1, itemCount) * 48 + margin * 2
  const below = anchorY + anchorHeight + 4
  const top = below + estimatedHeight <= windowHeight ? below : Math.max(margin, anchorY - estimatedHeight)

  return { left, top }
}
