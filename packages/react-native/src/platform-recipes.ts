import type { LumenTheme } from './theme.js'

export type LumenRefreshIndicatorTone = 'accent' | 'brand' | 'neutral'
export type LumenNavigationBadge = boolean | number | string

export interface LumenResolvedNavigationBadge {
  accessibilityLabel: string
  displayValue?: string
}

export type LumenNavigationAction = 'reselect' | 'select'

export const resolveLumenNavigationAction = (
  itemValue: string,
  selectedValue: string,
  hasReselectHandler: boolean
): LumenNavigationAction => itemValue === selectedValue && hasReselectHandler ? 'reselect' : 'select'

export const resolveLumenNavigationBadge = (
  badge: LumenNavigationBadge | undefined
): LumenResolvedNavigationBadge | undefined => {
  if (badge === undefined || badge === false) return undefined

  if (badge === true) return { accessibilityLabel: 'New activity' }

  if (typeof badge === 'number') {
    if (!Number.isFinite(badge)) return undefined

    const count = Math.max(0, Math.trunc(badge))

    return {
      accessibilityLabel: `${count} new items`,
      displayValue: count > 99 ? '99+' : String(count)
    }
  }

  const displayValue = badge.trim()

  if (displayValue.length === 0) return undefined

  return { accessibilityLabel: displayValue, displayValue }
}

export interface LumenNavigationItemState {
  color: string
  opacity: number
  selected: boolean
}

export interface LumenNavigationVisibilityState {
  accumulatedDelta: number
  offset: number
  visible: boolean
}

export const createLumenNavigationVisibilityState = (
  visible = true
): LumenNavigationVisibilityState => ({
  accumulatedDelta: 0,
  offset: 0,
  visible
})

const resolveScrollThreshold = (threshold: number): number => {
  if (!Number.isFinite(threshold) || threshold <= 0) return 16

  return threshold
}

const accumulateScrollDelta = (
  accumulatedDelta: number,
  delta: number
): number => {
  const continuingDirection = Math.sign(accumulatedDelta) === Math.sign(delta)

  return (continuingDirection ? accumulatedDelta : 0) + delta
}

/**
 * Resolves navigation visibility from a native vertical scroll offset.
 * Positive travel hides the bar, reverse travel reveals it, and reaching the top always reveals it.
 */
export const resolveLumenNavigationVisibility = (
  state: LumenNavigationVisibilityState,
  nextOffset: number,
  threshold = 16
): LumenNavigationVisibilityState => {
  if (!Number.isFinite(nextOffset)) return state

  const safeOffset = Math.max(0, nextOffset)

  if (safeOffset === 0) return createLumenNavigationVisibilityState(true)

  const safeThreshold = resolveScrollThreshold(threshold)
  const delta = safeOffset - state.offset

  if (delta === 0) return { ...state, offset: safeOffset }

  const accumulatedDelta = accumulateScrollDelta(state.accumulatedDelta, delta)

  if (accumulatedDelta >= safeThreshold) {
    return { accumulatedDelta: 0, offset: safeOffset, visible: false }
  }

  if (accumulatedDelta <= -safeThreshold) {
    return { accumulatedDelta: 0, offset: safeOffset, visible: true }
  }

  return { accumulatedDelta, offset: safeOffset, visible: state.visible }
}

export const resolveLumenNavigationItemState = (
  colors: LumenTheme['colors'],
  itemValue: string,
  selectedValue: string,
  disabled: boolean,
  pressed: boolean
): LumenNavigationItemState => {
  const selected = itemValue === selectedValue
  let opacity = 1

  if (disabled) opacity = 0.52
  else if (pressed) opacity = 0.72

  return {
    color: selected ? colors.brand : colors.inkMuted,
    opacity,
    selected
  }
}

export interface LumenRefreshColors {
  indicator: string
  surface: string
  title: string
}

const resolveIndicatorColor = (
  colors: LumenTheme['colors'],
  tone: LumenRefreshIndicatorTone
): string => {
  if (tone === 'accent') return colors.accent

  if (tone === 'neutral') return colors.inkSoft

  return colors.brand
}

export const resolveLumenRefreshColors = (
  colors: LumenTheme['colors'],
  tone: LumenRefreshIndicatorTone
): LumenRefreshColors => ({
  indicator: resolveIndicatorColor(colors, tone),
  surface: colors.surface,
  title: colors.inkMuted
})
