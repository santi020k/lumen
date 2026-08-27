import type {
  LumenSurfacePadding,
  LumenSurfaceRadius
} from './primitives.js'
import type { LumenTheme } from './theme.js'

export type LumenAlertVariant = 'default' | 'destructive' | 'success' | 'warning'
export type LumenAvatarSize = 'lg' | 'md' | 'sm'
export type LumenCardVariant =
  'accent' |
  'default' |
  'destructive' |
  'muted' |
  'success' |
  'warning'

export const resolveLumenSurfacePadding = (
  theme: LumenTheme,
  padding: LumenSurfacePadding
): number => (padding === 'none' ? 0 : theme.spacing[padding])

export const resolveLumenSurfaceRadius = (
  theme: LumenTheme,
  radius: LumenSurfaceRadius
): number => (radius === 'none' ? 0 : theme.radii[radius])

export const resolveLumenAlertColors = (
  colors: LumenTheme['colors'],
  variant: LumenAlertVariant
) => {
  if (variant === 'destructive') {
    return { backgroundColor: `${colors.danger}14`, borderColor: `${colors.danger}5C`, color: colors.danger }
  }

  if (variant === 'success') {
    return { backgroundColor: `${colors.success}14`, borderColor: `${colors.success}5C`, color: colors.success }
  }

  if (variant === 'warning') {
    return { backgroundColor: `${colors.warning}1A`, borderColor: `${colors.warning}6B`, color: colors.warning }
  }

  return { backgroundColor: colors.surface, borderColor: colors.line, color: colors.ink }
}

export const resolveLumenAvatarSize = (size: LumenAvatarSize): number => {
  if (size === 'sm') return 32

  if (size === 'lg') return 56

  return 40
}

export const resolveLumenCardColors = (
  colors: LumenTheme['colors'],
  variant: LumenCardVariant
) => {
  if (variant === 'default') {
    return { backgroundColor: colors.surface, borderColor: colors.line }
  }

  if (variant === 'muted') {
    return { backgroundColor: colors.surfaceMuted, borderColor: colors.line }
  }

  const accentColor = variant === 'destructive' ? colors.danger : colors[variant]

  return {
    backgroundColor: `${accentColor}0F`,
    borderColor: `${accentColor}3D`
  }
}

export const resolveLumenCardColor = (
  colors: LumenTheme['colors'],
  variant: LumenCardVariant
): string => resolveLumenCardColors(colors, variant).backgroundColor

export interface LumenProgressValue {
  max: number
  percentage: number
  value: number
}

export const resolveLumenProgressValue = (
  value: number,
  max: number
): LumenProgressValue => {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100
  const finiteValue = Number.isFinite(value) ? value : 0
  const safeValue = Math.min(safeMax, Math.max(0, finiteValue))

  return {
    max: safeMax,
    percentage: (safeValue / safeMax) * 100,
    value: safeValue
  }
}
