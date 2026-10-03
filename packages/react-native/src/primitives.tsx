import { type ComponentType, createElement, type ReactElement } from 'react'
import { type ColorValue, Pressable, type PressableProps, View, type ViewProps } from 'react-native'

import { type LumenButtonIntent, type LumenControlSize, type LumenIconSize } from './foundation-primitives.js'
import { getLumenIconGraphic, type LumenIconName } from './icons.generated.js'
import type { LumenViewRef } from './native-ref-types.js'
import { resolveLumenButtonColors, resolveLumenButtonOpacity, resolveLumenIconButtonSize, resolveLumenIconSize, resolveLumenPressableStyle } from './recipes.js'
import { useLumenTheme } from './theme-context.js'

export {
  LumenBadge,
  type LumenBadgeProps,
  LumenButton,
  type LumenButtonIntent,
  type LumenButtonProps,
  type LumenControlSize,
  LumenDivider,
  type LumenDividerProps,
  type LumenIconSize,
  LumenSpinner,
  type LumenSpinnerProps,
  LumenSurface,
  type LumenSurfacePadding,
  type LumenSurfaceProps,
  type LumenSurfaceRadius,
  type LumenSurfaceTone,
  LumenText,
  LumenTextField,
  type LumenTextFieldProps,
  type LumenTextProps,
  type LumenTextTone,
  type LumenTextVariant } from './foundation-primitives.js'

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

type LumenIconSourceProps =
  { icon: LumenIconGraphic, name?: never } |
  { icon?: never, name: LumenIconName }

export type LumenIconProps = LumenIconBaseProps & LumenIconSourceProps

const resolveIconGraphic = (
  icon: LumenIconGraphic | undefined,
  name: LumenIconName | undefined
): LumenIconGraphic => {
  if (name) return getLumenIconGraphic(name)

  if (icon) return icon

  throw new Error('Lumen icons require either a shared name or a custom graphic component.')
}

export const LumenIcon = ({
  color,
  decorative,
  icon,
  label,
  name,
  ref,
  size = 'md',
  strokeWidth = 2,
  style,
  ...props
}: LumenIconProps): ReactElement => {
  const theme = useLumenTheme()
  const dimension = resolveLumenIconSize(size)
  const isDecorative = decorative ?? !label
  const graphic = resolveIconGraphic(icon, name)

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
      {createElement(graphic, {
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

export type LumenIconButtonProps = LumenIconButtonBaseProps & LumenIconSourceProps

export const LumenIconButton = ({
  accessibilityState,
  disabled = false,
  icon,
  intent = 'quiet',
  label,
  name,
  ref,
  size = 'md',
  strokeWidth = 2,
  style,
  ...props
}: LumenIconButtonProps): ReactElement => {
  const theme = useLumenTheme()
  const isDisabled = disabled === true
  const colors = resolveLumenButtonColors(theme.colors, intent)
  const metrics = resolveLumenIconButtonSize(size)
  const graphic = resolveIconGraphic(icon, name)

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
      <LumenIcon
        color={colors.color}
        decorative
        icon={graphic}
        size={metrics.iconSize}
        strokeWidth={strokeWidth}
      />
    </Pressable>
  )
}
