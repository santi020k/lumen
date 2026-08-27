import type { LumenIconName } from './icons.generated.js'
import type { LumenTheme } from './theme.js'

export type LumenBannerVariant =
  'accent' | 'default' | 'destructive' | 'success' | 'warning'

export type LumenMetricTone =
  'accent' | 'brand' | 'danger' | 'neutral' | 'success' | 'warning'

export type LumenErrorStateAnnouncement = 'assertive' | 'off' | 'polite'
export type LumenErrorStateKind = 'error' | 'offline'
export type LumenErrorStateLayout = 'compact' | 'default' | 'page'

export const resolveLumenErrorStateLiveRegion = (
  announcement: LumenErrorStateAnnouncement
): 'assertive' | 'none' | 'polite' => announcement === 'off' ? 'none' : announcement

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

export const resolveLumenStatusBarIconName = (
  tone: LumenMetricTone
): LumenIconName => {
  if (tone === 'accent' || tone === 'brand') return 'info'

  if (tone === 'danger') return 'octagon-x'

  if (tone === 'success') return 'circle-check'

  if (tone === 'warning') return 'triangle-alert'

  return 'circle'
}

const resolveLumenBannerTone = (
  variant: LumenBannerVariant
): LumenMetricTone => {
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
    backgroundColor:
      variant === 'default' ? colors.surface : `${accentColor}14`,
    borderColor: variant === 'default' ? colors.line : `${accentColor}52`
  }
}
