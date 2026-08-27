import {
  type ReactElement,
  type ReactNode,
  type Ref
} from 'react'
import {
  type HostInstance,
  Pressable,
  type PressableProps,
  Text,
  TextInput,
  type TextInputInstance,
  type TextInputProps,
  type TextStyle,
  View,
  type ViewProps
} from 'react-native'

import {
  resolveLumenAriaInvalid,
  resolveLumenButtonOpacity,
  resolveLumenValidationHint
} from './recipes.js'
import { type LumenAlertVariant, resolveLumenAlertColors } from './shared-recipes.js'
import { useLumenTheme } from './theme-context.js'

const resolveOptional = <Value,>(value: Value | undefined, fallback: Value): Value => value ?? fallback

const resolveTextareaBorderColor = (
  errorMessage: string | undefined,
  dangerColor: string,
  lineColor: string
): string => errorMessage ? dangerColor : lineColor

const resolveTextareaOpacity = (editable: boolean): number => editable ? 1 : 0.52

const LumenTextareaMessage = ({
  color,
  fontSize,
  message
}: {
  color: string
  fontSize: number
  message: string | undefined
}): ReactElement | null => message ? <Text style={{ color, fontSize }}>{message}</Text> : null

export interface LumenToastProps extends ViewProps {
  action?: ReactNode
  description?: string
  dismissLabel?: string
  onDismiss?: () => void
  ref?: Ref<HostInstance>
  title: string
  variant?: LumenAlertVariant
}

export const LumenToast = ({
  action,
  description,
  dismissLabel = 'Dismiss',
  onDismiss,
  ref,
  style,
  title,
  variant = 'default',
  ...props
}: LumenToastProps): ReactElement => {
  const theme = useLumenTheme()
  const colors = resolveLumenAlertColors(theme.colors, variant)

  return (
    <View
      ref={ref}
      {...props}
      accessibilityRole="alert"
      style={[
        {
          alignItems: 'center',
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          borderRadius: theme.radii.md,
          borderWidth: 1,
          flexDirection: 'row',
          gap: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md
        },
        style
      ]}
    >
      <View style={{ flex: 1, gap: theme.spacing.xs }}>
        <Text
          style={{
            color: colors.color,
            fontSize: theme.fontSizes.sm,
            fontWeight: String(theme.fontWeights.semibold) as TextStyle['fontWeight']
          }}
        >
          {title}
        </Text>
        {description ?
          <Text style={{ color: theme.colors.inkSoft, fontSize: theme.fontSizes.xs }}>{description}</Text> :
          null}
      </View>
      {action}
      {onDismiss ?
        (
          <Pressable
            accessibilityLabel={dismissLabel}
            accessibilityRole="button"
            onPress={onDismiss}
            style={({ pressed }) => ({
              opacity: resolveLumenButtonOpacity(false, pressed),
              padding: theme.spacing.sm
            })}
          >
            <Text style={{ color: colors.color, fontSize: theme.fontSizes.xs }}>×</Text>
          </Pressable>
        ) :
        null}
    </View>
  )
}

export interface LumenTextareaProps extends Omit<
  TextInputProps,
  'multiline' | 'onChangeText' | 'value'
> {
  description?: string
  errorMessage?: string
  label: string
  onChangeText: (value: string) => void
  ref?: Ref<TextInputInstance>
  value: string
}

export const LumenTextarea = ({
  accessibilityHint,
  accessibilityLabel,
  accessibilityState,
  description,
  editable = true,
  errorMessage,
  label,
  numberOfLines = 4,
  onChangeText,
  placeholder,
  placeholderTextColor,
  ref,
  style,
  value,
  ...props
}: LumenTextareaProps): ReactElement => {
  const theme = useLumenTheme()

  const supportingColor = resolveTextareaBorderColor(
    errorMessage,
    theme.colors.danger,
    theme.colors.inkMuted
  )

  const supportingMessage = resolveOptional(errorMessage, description)

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Text
        style={{
          color: theme.colors.ink,
          fontSize: theme.fontSizes.sm,
          fontWeight: String(theme.fontWeights.semibold) as TextStyle['fontWeight']
        }}
      >
        {label}
      </Text>
      <TextInput
        ref={ref}
        {...props}
        accessibilityHint={resolveLumenValidationHint(errorMessage, description, accessibilityHint)}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ ...accessibilityState, disabled: !editable }}
        aria-invalid={resolveLumenAriaInvalid(errorMessage)}
        editable={editable}
        multiline
        numberOfLines={numberOfLines}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={resolveOptional(placeholderTextColor, theme.colors.inkMuted)}
        style={[
          {
            backgroundColor: theme.colors.surface,
            borderColor: resolveTextareaBorderColor(
              errorMessage,
              theme.colors.danger,
              theme.colors.line
            ),
            borderRadius: theme.radii.sm,
            borderWidth: 1,
            color: theme.colors.ink,
            fontSize: theme.fontSizes.sm,
            minHeight: 112,
            opacity: resolveTextareaOpacity(editable),
            padding: theme.spacing.md,
            textAlignVertical: 'top'
          },
          style
        ]}
        value={value}
      />
      <LumenTextareaMessage
        color={supportingColor}
        fontSize={theme.fontSizes.xs}
        message={supportingMessage}
      />
    </View>
  )
}

export interface LumenChipProps extends Omit<PressableProps, 'children'> {
  label: string
  onRemove?: () => void
  ref?: Ref<HostInstance>
  removeLabel?: string
  selected?: boolean
}

export const LumenChip = ({
  disabled = false,
  label,
  onPress,
  onRemove,
  ref,
  removeLabel = `Remove ${label}`,
  selected = false,
  style,
  ...props
}: LumenChipProps): ReactElement => {
  const theme = useLumenTheme()

  const content = (
    <>
      <Text
        style={{
          color: selected ? theme.colors.brand : theme.colors.inkSoft,
          fontSize: theme.fontSizes.xs,
          fontWeight: String(theme.fontWeights.semibold) as TextStyle['fontWeight']
        }}
      >
        {label}
      </Text>
      {onRemove ?
        (
          <Pressable
            accessibilityLabel={removeLabel}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            disabled={disabled}
            hitSlop={6}
            onPress={event => {
              event.stopPropagation()

              onRemove()
            }}
          >
            <Text style={{ color: theme.colors.inkMuted, fontSize: theme.fontSizes.xs }}>×</Text>
          </Pressable>
        ) :
        null}
    </>
  )

  const baseStyle = {
    alignItems: 'center' as const,
    alignSelf: 'flex-start' as const,
    backgroundColor: selected ? theme.colors.brandSoft : theme.colors.surfaceMuted,
    borderColor: selected ? theme.colors.brand : theme.colors.line,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    flexDirection: 'row' as const,
    gap: theme.spacing.xs,
    minHeight: 32,
    opacity: disabled ? 0.52 : 1,
    paddingHorizontal: theme.spacing.md
  }

  if (!onPress) {
    return <View ref={ref} {...props} style={[baseStyle, style as ViewProps['style']]}>{content}</View>
  }

  return (
    <Pressable
      ref={ref}
      {...props}
      accessibilityRole="button"
      accessibilityState={{ ...props.accessibilityState, disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={state => [
        baseStyle,
        { opacity: resolveLumenButtonOpacity(disabled, state.pressed) },
        typeof style === 'function' ? style(state) : style
      ]}
    >
      {content}
    </Pressable>
  )
}

export interface LumenFieldGroupProps extends ViewProps {
  children: ReactNode
  description?: string
  errorMessage?: string
  label: string
  ref?: Ref<HostInstance>
  required?: boolean
}

export const LumenFieldGroup = ({
  children,
  description,
  errorMessage,
  label,
  ref,
  required = false,
  style,
  ...props
}: LumenFieldGroupProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <View ref={ref} {...props} style={[{ gap: theme.spacing.sm }, style]}>
      <Text
        accessibilityLabel={required ? `${label}, required` : undefined}
        style={{
          color: theme.colors.ink,
          fontSize: theme.fontSizes.sm,
          fontWeight: String(theme.fontWeights.semibold) as TextStyle['fontWeight']
        }}
      >
        {label}
        {required ? ' *' : ''}
      </Text>
      {description ?
        <Text style={{ color: theme.colors.inkMuted, fontSize: theme.fontSizes.xs }}>{description}</Text> :
        null}
      {children}
      {errorMessage ?
        (
          <Text accessibilityRole="alert" style={{ color: theme.colors.danger, fontSize: theme.fontSizes.xs }}>
            {errorMessage}
          </Text>
        ) :
        null}
    </View>
  )
}

export type LumenButtonGroupOrientation = 'horizontal' | 'vertical'

export interface LumenButtonGroupProps extends ViewProps {
  children: ReactNode
  orientation?: LumenButtonGroupOrientation
  ref?: Ref<HostInstance>
}

export const LumenButtonGroup = ({
  children,
  orientation = 'horizontal',
  ref,
  style,
  ...props
}: LumenButtonGroupProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <View
      ref={ref}
      {...props}
      style={[
        {
          alignItems: orientation === 'horizontal' ? 'center' : 'stretch',
          flexDirection: orientation === 'horizontal' ? 'row' : 'column',
          gap: theme.spacing.sm
        },
        style
      ]}
    >
      {children}
    </View>
  )
}
