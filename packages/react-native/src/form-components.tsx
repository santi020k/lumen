import {
  type ComponentType,
  type ReactElement,
  type ReactNode,
  type Ref,
  useState
} from 'react'
import {
  type HostInstance,
  Platform,
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

import * as NativeDateTimePickerModule from '@react-native-community/datetimepicker'
import {
  DateTimePickerAndroid,
  type DateTimePickerChangeEvent
} from '@react-native-community/datetimepicker'

import {
  clampLumenDate,
  type LumenDateRangeValue,
  resolveLumenDateBounds,
  resolveLumenDatePickerValue,
  resolveLumenDateRangeEndChange,
  resolveLumenDateRangeEndMinimum,
  resolveLumenDateRangeStartChange,
  resolveLumenSearchFieldState
} from './form-recipes.js'
import { resolveLumenButtonOpacity } from './recipes.js'
import { useLumenTheme } from './theme-context.js'

const resolveSearchValue = <Value,>(value: Value | undefined, fallback: Value): Value => value ?? fallback
const defaultDateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

interface NativeDatePickerProps {
  accentColor: string
  disabled: boolean
  display: 'default' | 'inline'
  maximumDate?: Date
  minimumDate?: Date
  mode: 'date'
  onValueChange: (event: DateTimePickerChangeEvent, date: Date) => void
  themeVariant: 'dark' | 'light'
  value: Date
}

const isNativeDatePickerComponent = (value: unknown): value is ComponentType<NativeDatePickerProps> => (
  typeof value === 'function' || (typeof value === 'object' && value !== null && '$$typeof' in value)
)

const nativeDatePickerCandidate: unknown = NativeDateTimePickerModule.default

if (!isNativeDatePickerComponent(nativeDatePickerCandidate)) {
  throw new TypeError('The native date picker dependency did not expose its component')
}

const NativeDatePicker = nativeDatePickerCandidate

const formatLumenDate = (value: Date | null, placeholder: string, formatter?: (date: Date) => string): string => (
  value ? (formatter ?? defaultDateFormatter.format.bind(defaultDateFormatter))(value) : placeholder
)

interface DateSupportingTextProps {
  description?: string | undefined
  errorMessage?: string | undefined
}

const resolveDateLabelColor = (
  danger: string,
  ink: string,
  errorMessage?: string
): string => errorMessage ? danger : ink

const DateSupportingText = ({ description, errorMessage }: DateSupportingTextProps): ReactElement | null => {
  const theme = useLumenTheme()
  const supportingText = errorMessage ?? description

  if (!supportingText) return null

  return (
    <Text
      accessibilityLiveRegion={errorMessage ? 'polite' : 'none'}
      style={{
        color: errorMessage ? theme.colors.danger : theme.colors.inkMuted,
        fontSize: theme.fontSizes.xs
      }}
    >
      {supportingText}
    </Text>
  )
}

interface NativeDatePickerDisclosureProps extends NativeDatePickerProps {
  expanded: boolean
}

const NativeDatePickerDisclosure = ({ expanded, ...props }: NativeDatePickerDisclosureProps): ReactElement | null => {
  if (!expanded || Platform.OS === 'android' || Platform.OS === 'web') return null

  return <NativeDatePicker {...props} />
}

export interface LumenDateFieldProps extends Omit<ViewProps, 'children'> {
  description?: string
  enabled?: boolean
  errorMessage?: string
  formatValue?: (date: Date) => string
  label: string
  maximumDate?: Date
  minimumDate?: Date
  onValueChange: (value: Date) => void
  placeholder?: string
  value: Date | null
}

export const LumenDateField = ({
  description,
  enabled = true,
  errorMessage,
  formatValue,
  label,
  maximumDate,
  minimumDate,
  onValueChange,
  placeholder = 'Select a date',
  style,
  value,
  ...props
}: LumenDateFieldProps): ReactElement => {
  const theme = useLumenTheme()
  const [expanded, setExpanded] = useState(false)
  const pickerValue = resolveLumenDatePickerValue(value, minimumDate, maximumDate)
  const displayValue = formatLumenDate(value, placeholder, formatValue)
  const pickerBounds = resolveLumenDateBounds(minimumDate, maximumDate)

  const commitValue = (_event: DateTimePickerChangeEvent, selectedDate: Date): void => {
    onValueChange(clampLumenDate(selectedDate, minimumDate, maximumDate))
  }

  const openPicker = (): void => {
    if (!enabled) return

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        ...pickerBounds,
        mode: 'date',
        onValueChange: commitValue,
        value: pickerValue
      })

      return
    }

    setExpanded(previous => !previous)
  }

  return (
    <View {...props} style={[{ gap: theme.spacing.xs }, style]}>
      <Text
        style={{
          color: errorMessage ? theme.colors.danger : theme.colors.ink,
          fontSize: theme.fontSizes.sm,
          fontWeight: String(theme.fontWeights.semibold) as TextStyle['fontWeight']
        }}
      >
        {label}
      </Text>
      <Pressable
        accessibilityLabel={`${label}, ${displayValue}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: !enabled, expanded }}
        disabled={!enabled}
        onPress={openPicker}
        style={({ pressed }) => ({
          alignItems: 'center',
          backgroundColor: theme.colors.surface,
          borderColor: errorMessage ? theme.colors.danger : theme.colors.line,
          borderRadius: theme.radii.sm,
          borderWidth: 1,
          flexDirection: 'row',
          minHeight: 44,
          opacity: enabled ? resolveLumenButtonOpacity(false, pressed) : 0.52,
          paddingHorizontal: theme.spacing.md
        })}
      >
        <Text
          style={{
            color: value ? theme.colors.ink : theme.colors.inkMuted,
            flex: 1,
            fontSize: theme.fontSizes.sm
          }}
        >
          {displayValue}
        </Text>
        <Text
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ color: theme.colors.inkMuted }}
        >
          ▾
        </Text>
      </Pressable>
      <NativeDatePickerDisclosure
        {...pickerBounds}
        accentColor={theme.colors.brandSolid}
        disabled={!enabled}
        display={Platform.OS === 'ios' ? 'inline' : 'default'}
        expanded={expanded}
        mode="date"
        onValueChange={commitValue}
        themeVariant={theme.scheme}
        value={pickerValue}
      />
      <DateSupportingText
        {...(description ? { description } : {})}
        {...(errorMessage ? { errorMessage } : {})}
      />
    </View>
  )
}

export interface LumenDateRangeFieldProps extends Omit<ViewProps, 'children'> {
  description?: string
  enabled?: boolean
  endLabel?: string
  errorMessage?: string
  formatValue?: (date: Date) => string
  label: string
  maximumDate?: Date
  minimumDate?: Date
  onValueChange: (value: LumenDateRangeValue) => void
  placeholder?: string
  startLabel?: string
  value: LumenDateRangeValue
}

const resolveSharedDateFieldProps = (
  enabled: boolean,
  formatValue?: (date: Date) => string,
  maximumDate?: Date,
  placeholder?: string
): Pick<LumenDateFieldProps, 'enabled' | 'formatValue' | 'maximumDate' | 'placeholder'> => ({
  enabled,
  ...(formatValue ? { formatValue } : {}),
  ...(maximumDate ? { maximumDate } : {}),
  ...(placeholder ? { placeholder } : {})
})

export const LumenDateRangeField = ({
  description,
  enabled = true,
  endLabel = 'End date',
  errorMessage,
  formatValue,
  label,
  maximumDate,
  minimumDate,
  onValueChange,
  placeholder,
  startLabel = 'Start date',
  style,
  value,
  ...props
}: LumenDateRangeFieldProps): ReactElement => {
  const theme = useLumenTheme()
  const endMinimum = resolveLumenDateRangeEndMinimum(value.start, minimumDate)
  const labelColor = resolveDateLabelColor(theme.colors.danger, theme.colors.ink, errorMessage)
  const sharedFieldProps = resolveSharedDateFieldProps(enabled, formatValue, maximumDate, placeholder)

  return (
    <View {...props} accessibilityLabel={label} style={[{ gap: theme.spacing.sm }, style]}>
      <Text
        style={{
          color: labelColor,
          fontSize: theme.fontSizes.sm,
          fontWeight: String(theme.fontWeights.semibold) as TextStyle['fontWeight']
        }}
      >
        {label}
      </Text>
      <LumenDateField
        {...sharedFieldProps}
        label={startLabel}
        {...(minimumDate ? { minimumDate } : {})}
        onValueChange={start => {
          onValueChange(resolveLumenDateRangeStartChange(value, start, minimumDate, maximumDate))
        }}
        value={value.start}
      />
      <LumenDateField
        {...sharedFieldProps}
        label={endLabel}
        {...(endMinimum ? { minimumDate: endMinimum } : {})}
        onValueChange={end => {
          onValueChange(resolveLumenDateRangeEndChange(value, end, minimumDate, maximumDate))
        }}
        value={value.end}
      />
      <DateSupportingText
        {...(description ? { description } : {})}
        {...(errorMessage ? { errorMessage } : {})}
      />
    </View>
  )
}

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
