import {
  type ComponentType,
  createElement,
  type ReactElement,
  type ReactNode,
  type Ref
} from 'react'
import {
  ActivityIndicator,
  type ActivityIndicatorProps,
  type ColorValue,
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
  type LumenFieldContextValue,
  useLumenFieldContext
} from './field-context.js'
import {
  getLumenIconGraphic,
  type LumenIconName
} from './icons.generated.js'
import {
  resolveLumenButtonColors,
  resolveLumenButtonOpacity,
  resolveLumenButtonSize,
  resolveLumenControlMinHeight,
  resolveLumenIconButtonSize,
  resolveLumenIconSize,
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

export type LumenSurfacePadding = 'lg' | 'md' | 'none' | 'sm' | 'xl'
export type LumenSurfaceRadius = '2xl' | '3xl' | 'lg' | 'md' | 'none' | 'sm' | 'xl'
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

export type LumenButtonIntent = 'danger' | 'primary' | 'quiet' | 'secondary' | 'success'
export type LumenControlSize = 'lg' | 'md' | 'sm'
export type LumenIconSize = 'lg' | 'md' | 'sm'

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
  ref?: Ref<HostInstance>
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
  ref?: Ref<HostInstance>
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
  const colors = resolveLumenButtonColors(theme.colors, intent)
  const metrics = resolveLumenIconButtonSize(size)
  const graphic = resolveIconGraphic(icon, name)

  return (
    <Pressable
      ref={ref}
      {...props}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ ...accessibilityState, disabled }}
      disabled={disabled}
      style={state => [
        {
          alignItems: 'center',
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          borderRadius: theme.radii.sm,
          borderWidth: 1,
          height: metrics.touchTarget,
          justifyContent: 'center',
          opacity: resolveLumenButtonOpacity(disabled, state.pressed),
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
      {...props}
      accessibilityRole="button"
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
  'aria-describedby'?: string
  'aria-required'?: boolean
  error?: boolean
  ref?: Ref<TextInputInstance>
  size?: LumenControlSize
}

const hasExplicitLumenTextFieldLabel = (
  props: Pick<LumenTextFieldProps, 'accessibilityLabel' | 'aria-label' | 'aria-labelledby'>
): boolean => [
  props.accessibilityLabel,
  props['aria-label'],
  props['aria-labelledby']
].some(value => value !== undefined)

const resolveLumenTextFieldDescribedBy = (
  ariaDescribedBy: string | undefined,
  field: LumenFieldContextValue | null
): string | undefined => {
  const inheritedDescription = [field?.descriptionId, field?.errorId]
    .filter((value): value is string => Boolean(value))
    .join(' ')

  return ariaDescribedBy ?? (inheritedDescription || undefined)
}

const resolveLumenTextFieldFontSize = (
  size: LumenControlSize,
  mediumFontSize: number,
  smallFontSize: number
): number => size === 'lg' ? mediumFontSize : smallFontSize

const resolveLumenTextFieldBorderColor = (
  isInvalid: boolean,
  dangerColor: ColorValue,
  lineColor: ColorValue
): ColorValue => isInvalid ? dangerColor : lineColor

const resolveLumenTextFieldOpacity = (editable: boolean): number => editable ? 1 : 0.52

interface LumenTextFieldAccessibility {
  label: string | undefined
  labelledBy: string | undefined
  required: boolean | undefined
}

const resolveLumenTextFieldAccessibility = (
  props: LumenTextFieldProps,
  field: LumenFieldContextValue | null,
  ariaRequired: boolean | undefined
): LumenTextFieldAccessibility => {
  const hasExplicitLabel = hasExplicitLumenTextFieldLabel(props)

  return {
    label: hasExplicitLabel ? props.accessibilityLabel : field?.label,
    labelledBy: hasExplicitLabel ? props['aria-labelledby'] : field?.labelId,
    required: ariaRequired ?? field?.required
  }
}

export const LumenTextField = ({
  'aria-describedby': ariaDescribedBy,
  'aria-required': ariaRequired,
  accessibilityState,
  editable = true,
  error = false,
  placeholderTextColor,
  ref,
  size = 'md',
  style,
  ...props
}: LumenTextFieldProps): ReactElement => {
  const theme = useLumenTheme()
  const field = useLumenFieldContext()
  const minHeight = resolveLumenControlMinHeight(size)
  const fontSize = resolveLumenTextFieldFontSize(size, theme.fontSizes.md, theme.fontSizes.sm)
  const accessibility = resolveLumenTextFieldAccessibility(props, field, ariaRequired)
  const describedBy = resolveLumenTextFieldDescribedBy(ariaDescribedBy, field)
  const isInvalid = error || (field?.error ?? false)

  return (
    <TextInput
      ref={ref}
      {...props}
      accessibilityLabel={accessibility.label}
      accessibilityState={{
        ...accessibilityState,
        disabled: !editable
      }}
      aria-describedby={describedBy}
      aria-invalid={isInvalid || undefined}
      aria-labelledby={accessibility.labelledBy}
      aria-required={accessibility.required}
      editable={editable}
      placeholderTextColor={placeholderTextColor ?? theme.colors.inkMuted}
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderColor: resolveLumenTextFieldBorderColor(
            isInvalid,
            theme.colors.danger,
            theme.colors.line
          ),
          borderRadius: theme.radii.sm,
          borderWidth: 1,
          color: theme.colors.ink,
          fontSize,
          minHeight,
          opacity: resolveLumenTextFieldOpacity(editable),
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
