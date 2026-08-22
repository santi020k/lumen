import type { LumenTheme } from './theme.js'

export type LumenRefreshIndicatorTone = 'accent' | 'brand' | 'neutral'

export interface LumenNavigationItemState {
  color: string
  opacity: number
  selected: boolean
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
