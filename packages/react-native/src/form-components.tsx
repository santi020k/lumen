import {
  type ReactElement,
  type ReactNode,
  type Ref
} from 'react'
import {
  type HostInstance,
  Pressable,
  Switch,
  type SwitchProps,
  Text,
  TextInput,
  type TextInputInstance,
  type TextInputProps,
  type TextStyle,
  View,
  type ViewProps
} from 'react-native'

import { resolveLumenSearchFieldState } from './form-recipes.js'
import { resolveLumenButtonOpacity } from './recipes.js'
import { useLumenTheme } from './theme-context.js'

const resolveSearchValue = <Value,>(value: Value | undefined, fallback: Value): Value => value ?? fallback

export interface LumenToggleProps extends Omit<SwitchProps, 'onValueChange' | 'value'> {
  description?: string
  label: string
  onValueChange: (value: boolean) => void
  ref?: Ref<HostInstance>
  showLabel?: boolean
  value: boolean
}

export const LumenToggle = ({
  description,
  disabled = false,
  label,
  onValueChange,
  ref,
  showLabel = true,
  style,
  value,
  ...props
}: LumenToggleProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <View
      style={{
        alignItems: 'center',
        flexDirection: 'row',
        gap: theme.spacing.lg,
        minHeight: 44
      }}
    >
      {showLabel ?
        (
          <View style={{ flex: 1, gap: theme.spacing.xs }}>
            <Text
              style={{
                color: theme.colors.ink,
                fontSize: theme.fontSizes.sm,
                fontWeight: String(theme.fontWeights.semibold) as TextStyle['fontWeight']
              }}
            >
              {label}
            </Text>
            {description ?
              <Text style={{ color: theme.colors.inkMuted, fontSize: theme.fontSizes.xs }}>{description}</Text> :
              null}
          </View>
        ) :
        null}
      <Switch
        ref={ref}
        {...props}
        accessibilityLabel={label}
        disabled={disabled}
        ios_backgroundColor={theme.colors.surfaceStrong}
        onValueChange={onValueChange}
        style={[{ opacity: disabled ? 0.52 : 1 }, style]}
        thumbColor={value ? theme.colors.onBrand : theme.colors.surface}
        trackColor={{ false: theme.colors.surfaceStrong, true: theme.colors.brandSolid }}
        value={value}
      />
    </View>
  )
}

export interface LumenSettingsRowProps extends ViewProps {
  control: ReactNode
  description?: string
  graphic?: ReactNode
  ref?: Ref<HostInstance>
  title: string
}

export const LumenSettingsRow = ({
  control,
  description,
  graphic,
  ref,
  style,
  title,
  ...props
}: LumenSettingsRowProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <View
      ref={ref}
      {...props}
      style={[
        {
          alignItems: 'center',
          flexDirection: 'row',
          gap: theme.spacing.lg,
          minHeight: 56,
          paddingVertical: theme.spacing.sm
        },
        style
      ]}
    >
      {graphic ? <View>{graphic}</View> : null}
      <View style={{ flex: 1, gap: theme.spacing.xs }}>
        <Text
          style={{
            color: theme.colors.ink,
            fontSize: theme.fontSizes.sm,
            fontWeight: String(theme.fontWeights.semibold) as TextStyle['fontWeight']
          }}
        >
          {title}
        </Text>
        {description ?
          <Text style={{ color: theme.colors.inkMuted, fontSize: theme.fontSizes.xs }}>{description}</Text> :
          null}
      </View>
      <View>{control}</View>
    </View>
  )
}

export interface LumenSearchFieldProps extends Omit<TextInputProps, 'onChangeText' | 'value'> {
  clearLabel?: string
  graphic?: ReactNode
  onChangeText: (value: string) => void
  prompt?: string
  ref?: Ref<TextInputInstance>
  value: string
}

export const LumenSearchField = ({
  clearLabel = 'Clear search',
  editable = true,
  graphic,
  onChangeText,
  placeholder,
  placeholderTextColor,
  prompt = 'Search',
  ref,
  returnKeyType = 'search',
  style,
  value,
  ...props
}: LumenSearchFieldProps): ReactElement => {
  const theme = useLumenTheme()
  const searchState = resolveLumenSearchFieldState(value, editable)

  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.line,
        borderRadius: theme.radii.sm,
        borderWidth: 1,
        flexDirection: 'row',
        gap: theme.spacing.sm,
        minHeight: 44,
        opacity: searchState.opacity,
        paddingLeft: theme.spacing.md,
        paddingRight: theme.spacing.xs
      }}
    >
      {graphic}
      <TextInput
        ref={ref}
        {...props}
        accessibilityLabel={resolveSearchValue(props.accessibilityLabel, prompt)}
        editable={editable}
        onChangeText={onChangeText}
        placeholder={resolveSearchValue(placeholder, prompt)}
        placeholderTextColor={resolveSearchValue(placeholderTextColor, theme.colors.inkMuted)}
        returnKeyType={returnKeyType}
        style={[
          {
            color: theme.colors.ink,
            flex: 1,
            fontSize: theme.fontSizes.sm,
            minHeight: 42,
            paddingVertical: theme.spacing.sm
          },
          style
        ]}
        value={value}
      />
      {searchState.showClearAction ?
        (
          <Pressable
            accessibilityLabel={clearLabel}
            accessibilityRole="button"
            hitSlop={4}
            onPress={() => {
              onChangeText('')
            }}
            style={({ pressed }) => ({
              opacity: resolveLumenButtonOpacity(false, pressed),
              padding: theme.spacing.sm
            })}
          >
            <Text
              style={{
                color: theme.colors.inkSoft,
                fontSize: theme.fontSizes.xs,
                fontWeight: String(theme.fontWeights.semibold) as TextStyle['fontWeight']
              }}
            >
              {clearLabel}
            </Text>
          </Pressable>
        ) :
        null}
    </View>
  )
}
