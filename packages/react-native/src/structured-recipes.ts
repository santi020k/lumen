import type { LumenTheme } from './theme.js'

export type LumenBannerVariant =
  | 'accent' |
  'default' |
  'destructive' |
  'success' |
  'warning'

export type LumenMetricTone =
  | 'accent' |
  'brand' |
  'danger' |
  'neutral' |
  'success' |
  'warning'

export const resolveLumenMetricColor = (
  colors: LumenTheme['colors'],
  tone: LumenMetricTone
): string => {
  if (tone === 'accent') return colors.accent

  if (tone === 'brand') return colors.brand

  if (tone === 'danger') return colors.danger

  if (tone === 'success') return colors.success

  if (tone === 'warning') return colors.warning

  return colors.inkMuted
}

const resolveLumenBannerTone = (variant: LumenBannerVariant): LumenMetricTone => {
  if (variant === 'default') return 'brand'

  if (variant === 'destructive') return 'danger'

  return variant
}

export const resolveLumenBannerColors = (
  colors: LumenTheme['colors'],
  variant: LumenBannerVariant
) => {
  const tone = resolveLumenBannerTone(variant)
  const accentColor = resolveLumenMetricColor(colors, tone)

  return {
    accentColor,
    backgroundColor: variant === 'default' ? colors.surface : `${accentColor}14`,
    borderColor: variant === 'default' ? colors.line : `${accentColor}52`
  }
}
