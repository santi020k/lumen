import type {
  PressableProps,
  PressableStateCallbackType,
  StyleProp,
  TextStyle,
  ViewStyle
} from 'react-native'

import type {
  LumenButtonIntent,
  LumenControlSize,
  LumenIconSize,
  LumenSurfaceTone,
  LumenTextTone,
  LumenTextVariant
} from './primitives.js'
import type { LumenTheme } from './theme.js'

export const resolveLumenTextColor = (
  colors: LumenTheme['colors'],
  tone: LumenTextTone
): string => {
  if (tone === 'danger') return colors.danger

  if (tone === 'muted') return colors.inkMuted

  if (tone === 'soft') return colors.inkSoft

  if (tone === 'success') return colors.success

  if (tone === 'warning') return colors.warning

  return colors.ink
}

export const resolveLumenTextStyle = (
  theme: LumenTheme,
  variant: LumenTextVariant
): TextStyle => {
  if (variant === 'caption') {
    return { fontSize: theme.fontSizes.xs, lineHeight: 16 }
  }

  if (variant === 'label') {
    return {
      fontSize: theme.fontSizes.sm,
      fontWeight: String(theme.fontWeights.semibold) as TextStyle['fontWeight'],
      lineHeight: 20
    }
  }

  if (variant === 'title') {
    return {
      fontSize: theme.fontSizes['2xl'],
      fontWeight: String(theme.fontWeights.bold) as TextStyle['fontWeight'],
      lineHeight: 32
    }
  }

  return { fontSize: theme.fontSizes.md, lineHeight: 24 }
}

export const resolveLumenSurfaceColor = (
  theme: LumenTheme,
  tone: LumenSurfaceTone
): string => {
  if (tone === 'muted') return theme.colors.surfaceMuted

  if (tone === 'strong') return theme.colors.surfaceStrong

  return theme.colors[tone]
}

export const resolveLumenButtonColors = (
  colors: LumenTheme['colors'],
  intent: LumenButtonIntent
) => {
  if (intent === 'danger') {
    return { backgroundColor: colors.danger, borderColor: colors.danger, color: colors.onDanger }
  }

  if (intent === 'quiet') {
    return { backgroundColor: 'transparent', borderColor: 'transparent', color: colors.inkSoft }
  }

  if (intent === 'secondary') {
    return { backgroundColor: colors.surfaceMuted, borderColor: colors.line, color: colors.ink }
  }

  return { backgroundColor: colors.brandSolid, borderColor: colors.brandSolid, color: colors.onBrand }
}

export const resolveLumenButtonSize = (
  theme: LumenTheme,
  size: LumenControlSize
): { container: ViewStyle, label: TextStyle } => {
  if (size === 'sm') {
    return {
      container: { minHeight: 36, paddingHorizontal: theme.spacing.md },
      label: { fontSize: theme.fontSizes.sm }
    }
  }

  if (size === 'lg') {
    return {
      container: { minHeight: 52, paddingHorizontal: theme.spacing.xl },
      label: { fontSize: theme.fontSizes.md }
    }
  }

  return {
    container: { minHeight: 44, paddingHorizontal: theme.spacing.lg },
    label: { fontSize: theme.fontSizes.sm }
  }
}

export const resolveLumenPressableStyle = (
  style: PressableProps['style'],
  state: PressableStateCallbackType
): StyleProp<ViewStyle> => typeof style === 'function' ? style(state) : style

export const resolveLumenButtonOpacity = (
  disabled: boolean,
  pressed: boolean
): number => {
  if (disabled) return 0.52

  if (pressed) return 0.84

  return 1
}

export const resolveLumenControlMinHeight = (size: LumenControlSize): number => {
  if (size === 'sm') return 36

  if (size === 'lg') return 52

  return 44
}

export const resolveLumenIconSize = (size: LumenIconSize): number => {
  if (size === 'sm') return 16

  if (size === 'lg') return 24

  return 20
}

export const resolveLumenIconButtonSize = (
  size: LumenControlSize
): { iconSize: LumenIconSize, touchTarget: number } => {
  if (size === 'sm') return { iconSize: 'sm', touchTarget: 44 }

  if (size === 'lg') return { iconSize: 'lg', touchTarget: 52 }

  return { iconSize: 'md', touchTarget: 44 }
}
