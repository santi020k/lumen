import { type ComponentType, createElement, type ReactElement } from 'react'
import { type ColorValue, Pressable, type PressableProps, View, type ViewProps } from 'react-native'

import { type LumenButtonIntent, type LumenControlSize, type LumenIconSize } from './foundation-primitives.js'
import type { LumenViewRef } from './native-ref-types.js'
import { resolveLumenButtonColors, resolveLumenButtonOpacity, resolveLumenIconButtonSize, resolveLumenIconSize, resolveLumenPressableStyle } from './recipes.js'
import { useLumenTheme } from './theme-context.js'

export interface LumenIconGraphicProps {
  color?: ColorValue
  size?: number
  strokeWidth?: number
}

export type LumenIconGraphic = ComponentType<LumenIconGraphicProps>

interface LumenIconBaseProps extends Omit<ViewProps, 'children'> {
  color?: ColorValue
  decorative?: boolean
  label?: string
  ref?: LumenViewRef
  size?: LumenIconSize
  strokeWidth?: number
}

export type LumenStaticIconProps = LumenIconBaseProps & { icon: LumenIconGraphic }

export const LumenStaticIcon = ({
  color,
  decorative,
  icon,
  label,
  ref,
  size = 'md',
  strokeWidth = 2,
  style,
  ...props
}: LumenStaticIconProps): ReactElement => {
  const theme = useLumenTheme()
  const dimension = resolveLumenIconSize(size)
  const isDecorative = decorative ?? !label

  return (
    <View
      ref={ref}
      {...props}
      accessible={!isDecorative}
      accessibilityElementsHidden={isDecorative}
      accessibilityLabel={isDecorative ? undefined : label}
      accessibilityRole={isDecorative ? undefined : 'image'}
      importantForAccessibility={isDecorative ? 'no' : 'yes'}
      style={[
        {
          alignItems: 'center',
          height: dimension,
          justifyContent: 'center',
          width: dimension
        },
        style
      ]}
    >
      {createElement(icon, {
        color: color ?? theme.colors.ink,
        size: dimension,
        strokeWidth
      })}
    </View>
  )
}

interface LumenIconButtonBaseProps extends Omit<PressableProps, 'children'> {
  intent?: LumenButtonIntent
  label: string
  ref?: LumenViewRef
  size?: LumenControlSize
  strokeWidth?: number
}

export type LumenStaticIconButtonProps = LumenIconButtonBaseProps & { icon: LumenIconGraphic }

export const LumenStaticIconButton = ({
  accessibilityState,
  disabled = false,
  icon,
  intent = 'quiet',
  label,
  ref,
  size = 'md',
  strokeWidth = 2,
  style,
  ...props
}: LumenStaticIconButtonProps): ReactElement => {
  const theme = useLumenTheme()
  const isDisabled = disabled === true
  const colors = resolveLumenButtonColors(theme.colors, intent)
  const metrics = resolveLumenIconButtonSize(size)

  return (
    <Pressable
      ref={ref}
      {...props}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ ...accessibilityState, disabled: isDisabled }}
      disabled={isDisabled}
      style={state => [
        {
          alignItems: 'center',
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          borderRadius: theme.radii.sm,
          borderWidth: 1,
          height: metrics.touchTarget,
          justifyContent: 'center',
          opacity: resolveLumenButtonOpacity(isDisabled, state.pressed),
          width: metrics.touchTarget
        },
        resolveLumenPressableStyle(style, state)
      ]}
    >
      <LumenStaticIcon
        color={colors.color}
        decorative
        icon={icon}
        size={metrics.iconSize}
        strokeWidth={strokeWidth}
      />
    </Pressable>
  )
}
