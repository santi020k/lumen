import type { LumenColorPalette } from '../tokens/Tokens.generated'
import { LumenRadius, LumenSpacing, LumenTypography } from '../tokens/Tokens.generated'

export enum LumenTextTone {
  Danger,
  Default,
  Muted,
  Soft,
  Success,
  Warning
}

export enum LumenTextVariant {
  Body,
  Caption,
  Label,
  Title
}

export enum LumenSurfacePadding {
  None,
  Sm,
  Md,
  Lg,
  Xl
}

export enum LumenSurfaceRadius {
  None,
  Sm,
  Md,
  Lg,
  Xl,
  Size2xl,
  Size3xl
}

export enum LumenSurfaceTone {
  Canvas,
  Muted,
  Strong,
  Surface
}

export enum LumenButtonIntent {
  Danger,
  Primary,
  Quiet,
  Secondary,
  Success
}

export enum LumenControlSize {
  Lg,
  Md,
  Sm
}

export enum LumenCardVariant {
  Accent,
  Default,
  Destructive,
  Muted,
  Success,
  Warning
}

export interface LumenTextStyle {
  readonly fontSize: number
  readonly fontWeight: number
}

export interface LumenButtonPalette {
  readonly background: string
  readonly border: string
  readonly foreground: string
}

export interface LumenControlMetrics {
  readonly horizontalPadding: number
  readonly minHeight: number
}

export interface LumenCardPalette {
  readonly background: string
  readonly border: string
}

/** Opacity applied to disabled and loading controls. */
export const lumenDisabledOpacity = 0.52

const transparent = '#00000000'
const opaqueHexLength = 7

const isHexDigit = (code: number): boolean => {
  const isDecimal = code >= 48 && code <= 57
  const isUpper = code >= 65 && code <= 70
  const isLower = code >= 97 && code <= 102

  return isDecimal || isUpper || isLower
}

const isOpaqueHex = (color: string): boolean => {
  if (color.length !== opaqueHexLength || color.charCodeAt(0) !== 35) return false

  for (let index = 1; index < opaqueHexLength; index += 1) {
    if (!isHexDigit(color.charCodeAt(index))) return false
  }

  return true
}

/**
 * Applies an alpha channel to a `#RRGGBB` color and returns ArkUI's `#AARRGGBB` form.
 * Any other color notation is returned unchanged.
 */
export const lumenColorWithAlpha = (color: string, alpha: number): string => {
  if (!isOpaqueHex(color)) return color

  const bounded = Number.isFinite(alpha) ? Math.min(1, Math.max(0, alpha)) : 1
  const channel = Math.round(bounded * 255).toString(16).toUpperCase().padStart(2, '0')

  return `#${channel}${color.slice(1)}`
}

export const lumenTextStyle = (variant: LumenTextVariant): LumenTextStyle => {
  switch (variant) {
    case LumenTextVariant.Caption:
      return { fontSize: LumenTypography.xsSize, fontWeight: LumenTypography.regularWeight }

    case LumenTextVariant.Label:
      return { fontSize: LumenTypography.smSize, fontWeight: LumenTypography.semiboldWeight }

    case LumenTextVariant.Title:
      return { fontSize: LumenTypography.size2xlSize, fontWeight: LumenTypography.boldWeight }

    default:
      return { fontSize: LumenTypography.mdSize, fontWeight: LumenTypography.regularWeight }
  }
}

export const lumenTextColor = (colors: LumenColorPalette, tone: LumenTextTone): string => {
  switch (tone) {
    case LumenTextTone.Danger:
      return colors.danger

    case LumenTextTone.Muted:
      return colors.inkMuted

    case LumenTextTone.Soft:
      return colors.inkSoft

    case LumenTextTone.Success:
      return colors.success

    case LumenTextTone.Warning:
      return colors.warning

    default:
      return colors.ink
  }
}

export const lumenSurfaceColor = (colors: LumenColorPalette, tone: LumenSurfaceTone): string => {
  switch (tone) {
    case LumenSurfaceTone.Canvas:
      return colors.canvas

    case LumenSurfaceTone.Muted:
      return colors.surfaceMuted

    case LumenSurfaceTone.Strong:
      return colors.surfaceStrong

    default:
      return colors.surface
  }
}

export const lumenSurfacePadding = (padding: LumenSurfacePadding): number => {
  switch (padding) {
    case LumenSurfacePadding.Sm:
      return LumenSpacing.sm

    case LumenSurfacePadding.Md:
      return LumenSpacing.md

    case LumenSurfacePadding.Lg:
      return LumenSpacing.lg

    case LumenSurfacePadding.Xl:
      return LumenSpacing.xl

    default:
      return LumenSpacing.zero
  }
}

export const lumenSurfaceRadius = (radius: LumenSurfaceRadius): number => {
  switch (radius) {
    case LumenSurfaceRadius.Sm:
      return LumenRadius.sm

    case LumenSurfaceRadius.Md:
      return LumenRadius.md

    case LumenSurfaceRadius.Lg:
      return LumenRadius.lg

    case LumenSurfaceRadius.Xl:
      return LumenRadius.xl

    case LumenSurfaceRadius.Size2xl:
      return LumenRadius.size2xl

    case LumenSurfaceRadius.Size3xl:
      return LumenRadius.size3xl

    default:
      return 0
  }
}

export const lumenButtonPalette = (
  colors: LumenColorPalette,
  intent: LumenButtonIntent
): LumenButtonPalette => {
  switch (intent) {
    case LumenButtonIntent.Danger:
      return { background: colors.danger, border: colors.danger, foreground: colors.onDanger }

    case LumenButtonIntent.Quiet:
      return { background: transparent, border: transparent, foreground: colors.inkSoft }

    case LumenButtonIntent.Secondary:
      return { background: colors.surfaceMuted, border: colors.line, foreground: colors.ink }

    case LumenButtonIntent.Success:
      return { background: colors.success, border: colors.success, foreground: colors.onBrand }

    default:
      return {
        background: colors.brandSolid,
        border: colors.brandSolid,
        foreground: colors.onBrand
      }
  }
}

export const lumenControlMetrics = (size: LumenControlSize): LumenControlMetrics => {
  switch (size) {
    case LumenControlSize.Lg:
      return { horizontalPadding: LumenSpacing.xl, minHeight: 52 }

    case LumenControlSize.Sm:
      return { horizontalPadding: LumenSpacing.md, minHeight: 36 }

    default:
      return { horizontalPadding: LumenSpacing.lg, minHeight: 44 }
  }
}

const cardAccent = (colors: LumenColorPalette, variant: LumenCardVariant): string => {
  switch (variant) {
    case LumenCardVariant.Accent:
      return colors.accent

    case LumenCardVariant.Destructive:
      return colors.danger

    case LumenCardVariant.Success:
      return colors.success

    default:
      return colors.warning
  }
}

export const lumenCardPalette = (
  colors: LumenColorPalette,
  variant: LumenCardVariant
): LumenCardPalette => {
  if (variant === LumenCardVariant.Default) {
    return { background: colors.surface, border: colors.line }
  }

  if (variant === LumenCardVariant.Muted) {
    return { background: colors.surfaceMuted, border: colors.line }
  }

  const accent = cardAccent(colors, variant)

  return {
    background: lumenColorWithAlpha(accent, 0.06),
    border: lumenColorWithAlpha(accent, 0.24)
  }
}

/** A field is invalid when it is flagged explicitly or carries an error message. */
export const resolveLumenFieldError = (invalid: boolean, errorMessage: string): boolean => {
  const hasMessage = errorMessage.length > 0

  return invalid || hasMessage
}

/**
 * The accessibility description of a field: its label, then its error message. The visible
 * label and error text are hidden from assistive technology so each is read once, with the input.
 */
export const lumenFieldDescription = (label: string, errorMessage: string): string => {
  if (label.length === 0) return errorMessage

  if (errorMessage.length === 0) return label

  return `${label}. ${errorMessage}`
}
