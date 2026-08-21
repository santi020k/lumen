import {
  createContext,
  type ReactElement,
  type ReactNode,
  type Ref,
  use
} from 'react'
import {
  type ColorValue,
  type HostInstance,
  Image,
  type ImageSourcePropType,
  Pressable,
  type PressableProps,
  Text,
  type TextProps,
  type TextStyle,
  View,
  type ViewProps
} from 'react-native'

import { resolveLumenButtonOpacity, resolveLumenPressableStyle } from './recipes.js'
import {
  type LumenAlertVariant,
  type LumenAvatarSize,
  type LumenCardVariant,
  resolveLumenAlertColors,
  resolveLumenAvatarSize,
  resolveLumenCardColor,
  resolveLumenProgressValue
} from './shared-recipes.js'
import { useLumenTheme } from './theme-context.js'

export interface LumenCardProps extends Omit<PressableProps, 'children'> {
  children: ReactNode
  ref?: Ref<HostInstance>
  variant?: LumenCardVariant
}

export const LumenCard = ({
  accessibilityRole,
  accessibilityState,
  children,
  disabled = false,
  onPress,
  ref,
  style,
  variant = 'default',
  ...props
}: LumenCardProps): ReactElement => {
  const theme = useLumenTheme()
  const interactive = Boolean(onPress)

  return (
    <Pressable
      ref={ref}
      {...props}
      accessibilityRole={accessibilityRole ?? (interactive ? 'button' : undefined)}
      accessibilityState={{ ...accessibilityState, disabled: disabled || undefined }}
      disabled={disabled || !interactive}
      onPress={onPress}
      style={state => [
        {
          backgroundColor: resolveLumenCardColor(theme.colors, variant),
          borderColor: interactive && state.pressed ? theme.colors.brand : theme.colors.line,
          borderRadius: theme.radii.lg,
          borderWidth: 1,
          gap: theme.spacing.lg,
          opacity: resolveLumenButtonOpacity(disabled, interactive && state.pressed),
          padding: theme.spacing.xl
        },
        resolveLumenPressableStyle(style, state)
      ]}
    >
      {children}
    </Pressable>
  )
}

export interface LumenAlertProps extends ViewProps {
  children: ReactNode
  ref?: Ref<HostInstance>
  variant?: LumenAlertVariant
}

interface LumenAlertContentColors {
  description: ColorValue
  foreground: ColorValue
}

const LumenAlertColorContext = createContext<LumenAlertContentColors | null>(null)

export const LumenAlert = ({
  children,
  ref,
  style,
  variant = 'default',
  ...props
}: LumenAlertProps): ReactElement => {
  const theme = useLumenTheme()
  const colors = resolveLumenAlertColors(theme.colors, variant)

  return (
    <View
      ref={ref}
      {...props}
      style={[
        {
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          borderRadius: theme.radii.md,
          borderWidth: 1,
          gap: theme.spacing.xs,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md
        },
        style
      ]}
    >
      <LumenAlertColorContext
        value={{
          description: variant === 'default' ? theme.colors.inkSoft : colors.color,
          foreground: colors.color
        }}
      >
        {children}
      </LumenAlertColorContext>
    </View>
  )
}

export interface LumenAlertTitleProps extends TextProps {
  ref?: Ref<HostInstance>
}

export const LumenAlertTitle = ({
  ref,
  style,
  ...props
}: LumenAlertTitleProps): ReactElement => {
  const theme = useLumenTheme()
  const colors = use(LumenAlertColorContext)

  return (
    <Text
      ref={ref}
      {...props}
      style={[
        {
          color: colors?.foreground ?? theme.colors.ink,
          fontSize: theme.fontSizes.sm,
          fontWeight: String(theme.fontWeights.semibold) as TextStyle['fontWeight']
        },
        style
      ]}
    />
  )
}

export interface LumenAlertDescriptionProps extends TextProps {
  ref?: Ref<HostInstance>
}

export const LumenAlertDescription = ({
  ref,
  style,
  ...props
}: LumenAlertDescriptionProps): ReactElement => {
  const theme = useLumenTheme()
  const colors = use(LumenAlertColorContext)

  return (
    <Text
      ref={ref}
      {...props}
      style={[
        {
          color: colors?.description ?? theme.colors.inkSoft,
          fontSize: theme.fontSizes.sm,
          lineHeight: 20
        },
        style
      ]}
    />
  )
}

export interface LumenProgressProps extends ViewProps {
  color?: ColorValue
  label?: string
  max?: number
  ref?: Ref<HostInstance>
  value?: number
}

export const LumenProgress = ({
  color,
  label,
  max = 100,
  ref,
  style,
  value = 0,
  ...props
}: LumenProgressProps): ReactElement => {
  const theme = useLumenTheme()
  const progress = resolveLumenProgressValue(value, max)

  return (
    <View
      ref={ref}
      {...props}
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      accessibilityValue={{ max: progress.max, min: 0, now: progress.value }}
      style={[
        {
          backgroundColor: theme.colors.surfaceStrong,
          borderRadius: theme.radii.full,
          height: theme.spacing.sm,
          overflow: 'hidden',
          width: '100%'
        },
        style
      ]}
    >
      <View
        importantForAccessibility="no"
        style={{
          backgroundColor: color ?? theme.colors.brandSolid,
          borderRadius: theme.radii.full,
          height: '100%',
          width: `${progress.percentage}%`
        }}
      />
    </View>
  )
}

export interface LumenAvatarProps extends ViewProps {
  fallback?: string
  label?: string
  ref?: Ref<HostInstance>
  size?: LumenAvatarSize
  source?: ImageSourcePropType
}

export const LumenAvatar = ({
  fallback = '?',
  label,
  ref,
  size = 'md',
  source,
  style,
  ...props
}: LumenAvatarProps): ReactElement => {
  const theme = useLumenTheme()
  const dimension = resolveLumenAvatarSize(size)
  const fontSize = size === 'lg' ? theme.fontSizes.lg : theme.fontSizes.sm

  return (
    <View
      ref={ref}
      {...props}
      accessible={Boolean(label)}
      accessibilityLabel={label}
      accessibilityRole={label ? 'image' : undefined}
      style={[
        {
          alignItems: 'center',
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.line,
          borderRadius: theme.radii.full,
          borderWidth: 1,
          height: dimension,
          justifyContent: 'center',
          overflow: 'hidden',
          width: dimension
        },
        style
      ]}
    >
      {source ?
        (
          <Image
            accessibilityElementsHidden
            importantForAccessibility="no"
            resizeMode="cover"
            source={source}
            style={{ height: dimension, width: dimension }}
          />
        ) :
        (
          <Text
            accessibilityElementsHidden
            importantForAccessibility="no"
            style={{
              color: theme.colors.ink,
              fontSize,
              fontWeight: String(theme.fontWeights.bold) as TextStyle['fontWeight']
            }}
          >
            {fallback}
          </Text>
        )}
    </View>
  )
}
