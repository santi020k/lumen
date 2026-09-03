export interface LumenMenuPositionInput {
  anchorHeight: number
  anchorWidth: number
  anchorX: number
  anchorY: number
  bottomInset?: number
  itemCount: number
  leftInset?: number
  margin: number
  menuWidth: number
  rightInset?: number
  topInset?: number
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
  bottomInset = 0,
  itemCount,
  leftInset = 0,
  margin,
  menuWidth,
  rightInset = 0,
  topInset = 0,
  windowHeight,
  windowWidth
}: LumenMenuPositionInput): LumenMenuPosition => {
  const minimumLeft = leftInset + margin

  const maximumLeft = Math.max(
    minimumLeft,
    windowWidth - rightInset - menuWidth - margin
  )

  const left = Math.max(
    minimumLeft,
    Math.min(anchorX + anchorWidth - menuWidth, maximumLeft)
  )

  const estimatedHeight = Math.max(1, itemCount) * 48 + margin * 2
  const below = anchorY + anchorHeight + 4
  const minimumTop = topInset + margin

  const maximumTop = Math.max(
    minimumTop,
    windowHeight - bottomInset - estimatedHeight - margin
  )

  const preferredTop = below + estimatedHeight <= windowHeight - bottomInset - margin ?
    below :
    anchorY - estimatedHeight

  const top = Math.max(minimumTop, Math.min(preferredTop, maximumTop))

  return { left, top }
}
