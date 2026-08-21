import type { LumenTheme } from './theme.js'

export type LumenAlertVariant = 'default' | 'destructive' | 'success' | 'warning'
export type LumenAvatarSize = 'lg' | 'md' | 'sm'
export type LumenCardVariant = 'default' | 'muted'

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

export const resolveLumenCardColor = (
  colors: LumenTheme['colors'],
  variant: LumenCardVariant
): string => variant === 'muted' ? colors.surfaceMuted : colors.surface

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
