import type { LumenTheme } from './theme.js'

export type LumenRefreshIndicatorTone = 'accent' | 'brand' | 'neutral'

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
