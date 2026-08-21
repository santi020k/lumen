import {
  type ReactElement,
  type ReactNode,
  type Ref
} from 'react'
import {
  ActivityIndicator,
  type ActivityIndicatorProps,
  type HostInstance,
  Pressable,
  type PressableProps,
  Text,
  TextInput,
  type TextInputInstance,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  View,
  type ViewProps
} from 'react-native'

import {
  resolveLumenButtonColors,
  resolveLumenButtonOpacity,
  resolveLumenButtonSize,
  resolveLumenControlMinHeight,
  resolveLumenPressableStyle,
  resolveLumenSurfaceColor,
  resolveLumenTextColor,
  resolveLumenTextStyle
} from './recipes.js'
import { useLumenTheme } from './theme-context.js'

export type LumenTextTone =
  | 'danger' |
  'default' |
  'muted' |
  'soft' |
  'success' |
  'warning'
export type LumenTextVariant = 'body' | 'caption' | 'label' | 'title'

export interface LumenTextProps extends TextProps {
  ref?: Ref<HostInstance>
  tone?: LumenTextTone
  variant?: LumenTextVariant
}

export const LumenText = ({
  ref,
  style,
  tone = 'default',
  variant = 'body',
  ...props
}: LumenTextProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <Text
      ref={ref}
      {...props}
      style={[
        { color: resolveLumenTextColor(theme.colors, tone) },
        resolveLumenTextStyle(theme, variant),
        style
      ]}
    />
  )
}

export type LumenSurfacePadding = 'lg' | 'md' | 'none' | 'sm'
export type LumenSurfaceRadius = 'lg' | 'md' | 'none' | 'sm'
export type LumenSurfaceTone = 'canvas' | 'muted' | 'strong' | 'surface'

export interface LumenSurfaceProps extends ViewProps {
  padding?: LumenSurfacePadding
  radius?: LumenSurfaceRadius
  ref?: Ref<HostInstance>
  tone?: LumenSurfaceTone
}

export const LumenSurface = ({
  padding = 'md',
  radius = 'md',
  ref,
  style,
  tone = 'surface',
  ...props
}: LumenSurfaceProps): ReactElement => {
  const theme = useLumenTheme()
  const backgroundColor = resolveLumenSurfaceColor(theme, tone)
  const paddingValue = padding === 'none' ? 0 : theme.spacing[padding]
  const radiusValue = radius === 'none' ? 0 : theme.radii[radius]

  return (
    <View
      ref={ref}
      {...props}
      style={[{ backgroundColor, borderRadius: radiusValue, padding: paddingValue }, style]}
    />
  )
}

export type LumenButtonIntent = 'danger' | 'primary' | 'quiet' | 'secondary'
export type LumenControlSize = 'lg' | 'md' | 'sm'

export interface LumenButtonProps extends Omit<PressableProps, 'children'> {
  children: ReactNode
  intent?: LumenButtonIntent
  loading?: boolean
  ref?: Ref<HostInstance>
  size?: LumenControlSize
}

export const LumenButton = ({
  accessibilityState,
  children,
  disabled = false,
  intent = 'primary',
  loading = false,
  ref,
  size = 'md',
  style,
  ...props
}: LumenButtonProps): ReactElement => {
  const theme = useLumenTheme()
  const colors = resolveLumenButtonColors(theme.colors, intent)
  const dimensions = resolveLumenButtonSize(theme, size)
  const isDisabled = disabled || loading

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      {...props}
      accessibilityState={{
        ...accessibilityState,
        busy: loading,
        disabled: isDisabled
      }}
      disabled={isDisabled}
      style={state => [
        {
          alignItems: 'center',
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          borderRadius: theme.radii.sm,
          borderWidth: 1,
          flexDirection: 'row',
          gap: theme.spacing.sm,
          justifyContent: 'center',
          opacity: resolveLumenButtonOpacity(isDisabled, state.pressed)
        },
        dimensions.container,
        resolveLumenPressableStyle(style, state)
      ]}
    >
      {loading ? <ActivityIndicator color={colors.color} size="small" /> : null}
      <Text
        style={[
          {
            color: colors.color,
            fontWeight: String(theme.fontWeights.semibold) as TextStyle['fontWeight']
          },
          dimensions.label
        ]}
      >
        {children}
      </Text>
    </Pressable>
  )
}

export interface LumenTextFieldProps extends TextInputProps {
  error?: boolean
  ref?: Ref<TextInputInstance>
  size?: LumenControlSize
}

export const LumenTextField = ({
  editable = true,
  error = false,
  placeholderTextColor,
  ref,
  size = 'md',
  style,
  ...props
}: LumenTextFieldProps): ReactElement => {
  const theme = useLumenTheme()
  const minHeight = resolveLumenControlMinHeight(size)
  const fontSize = size === 'lg' ? theme.fontSizes.md : theme.fontSizes.sm

  return (
    <TextInput
      ref={ref}
      {...props}
      aria-invalid={error || undefined}
      editable={editable}
      placeholderTextColor={placeholderTextColor ?? theme.colors.inkMuted}
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderColor: error ? theme.colors.danger : theme.colors.line,
          borderRadius: theme.radii.sm,
          borderWidth: 1,
          color: theme.colors.ink,
          fontSize,
          minHeight,
          opacity: editable ? 1 : 0.52,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm
        },
        style
      ]}
    />
  )
}

export interface LumenBadgeProps extends ViewProps {
  children: ReactNode
  ref?: Ref<HostInstance>
  tone?: 'accent' | 'danger' | 'neutral' | 'success' | 'warning'
}

export const LumenBadge = ({
  children,
  ref,
  style,
  tone = 'neutral',
  ...props
}: LumenBadgeProps): ReactElement => {
  const theme = useLumenTheme()
  const color = tone === 'neutral' ? theme.colors.inkSoft : theme.colors[tone]
  const backgroundColor = tone === 'neutral' ? theme.colors.surfaceMuted : `${color}1F`

  return (
    <View
      ref={ref}
      {...props}
      style={[
        {
          alignSelf: 'flex-start',
          backgroundColor,
          borderRadius: theme.radii.full,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs
        },
        style
      ]}
    >
      <Text style={{ color, fontSize: theme.fontSizes.xs, fontWeight: '600' }}>
        {children}
      </Text>
    </View>
  )
}

export interface LumenDividerProps extends ViewProps {
  ref?: Ref<HostInstance>
}

export const LumenDivider = ({
  ref,
  style,
  ...props
}: LumenDividerProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <View
      ref={ref}
      accessibilityElementsHidden
      importantForAccessibility="no"
      {...props}
      style={[{ backgroundColor: theme.colors.line, height: 1 }, style]}
    />
  )
}

export interface LumenSpinnerProps extends ActivityIndicatorProps {
  ref?: Ref<HostInstance>
}

export const LumenSpinner = ({
  color,
  ref,
  ...props
}: LumenSpinnerProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <ActivityIndicator
      ref={ref}
      accessibilityRole="progressbar"
      color={color ?? theme.colors.brand}
      {...props}
    />
  )
}
