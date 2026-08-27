import {
  type ChangeEvent,
  type ComponentType,
  createElement,
  type ReactElement,
  useEffect,
  useState
} from 'react'
import {
  Platform,
  Pressable,
  Text,
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
  formatLumenDateDisplayValue,
  formatLumenDateInputValue,
  isValidLumenDate,
  type LumenDateRangeValue,
  parseLumenDateInputValue,
  resolveLumenDateBounds,
  resolveLumenDatePickerValue,
  resolveLumenDateRangeEndChange,
  resolveLumenDateRangeEndMinimum,
  resolveLumenDateRangeStartChange
} from './form-recipes.js'
import {
  resolveLumenAriaInvalid,
  resolveLumenButtonOpacity,
  resolveLumenValidationHint
} from './recipes.js'
import { useLumenTheme } from './theme-context.js'

const defaultDateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

interface NativeDatePickerProps {
  accentColor: string
  disabled: boolean
  display: 'default' | 'inline'
  maximumDate?: Date
  minimumDate?: Date
  mode: 'date'
  onChange: (event: DateTimePickerChangeEvent, date?: Date) => void
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

interface DateSupportingTextProps {
  description?: string | undefined
  errorMessage?: string | undefined
}

const resolveDateLabelColor = (
  danger: string,
  ink: string,
  errorMessage?: string
): string => errorMessage ? danger : ink

const resolveDatePickerExpanded = (enabled: boolean, expanded: boolean): boolean => (
  enabled && expanded
)

const dismissAndroidDatePicker = (): void => {
  if (Platform.OS === 'android') void DateTimePickerAndroid.dismiss('date')
}

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
  label: string
  onDateChange: (date: Date) => void
  webValue: Date | null
}

const NativeDatePickerDisclosure = ({
  expanded,
  label,
  onDateChange,
  webValue,
  ...props
}: NativeDatePickerDisclosureProps): ReactElement | null => {
  if (!expanded || Platform.OS === 'android') return null

  if (Platform.OS === 'web') {
    return createElement('input', {
      'aria-label': label,
      disabled: props.disabled,
      max: props.maximumDate ? formatLumenDateInputValue(props.maximumDate) : undefined,
      min: props.minimumDate ? formatLumenDateInputValue(props.minimumDate) : undefined,
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        const date = parseLumenDateInputValue(event.currentTarget.value)

        if (date) onDateChange(date)
      },
      style: {
        accentColor: props.accentColor,
        border: '1px solid currentColor',
        borderRadius: 6,
        colorScheme: props.themeVariant,
        font: 'inherit',
        minHeight: 44,
        padding: '0 12px'
      },
      type: 'date',
      value: webValue ? formatLumenDateInputValue(webValue) : ''
    })
  }

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

const LumenDateFieldControl = ({
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
  const pickerExpanded = resolveDatePickerExpanded(enabled, expanded)
  const validValue = isValidLumenDate(value) ? value : null
  const pickerValue = resolveLumenDatePickerValue(value, minimumDate, maximumDate)

  const displayValue = formatLumenDateDisplayValue(
    value,
    placeholder,
    formatValue ?? defaultDateFormatter.format.bind(defaultDateFormatter)
  )

  const pickerBounds = resolveLumenDateBounds(minimumDate, maximumDate)

  useEffect(() => dismissAndroidDatePicker, [])

  const commitValue = (_event: DateTimePickerChangeEvent, selectedDate?: Date): void => {
    if (!selectedDate) return

    onValueChange(clampLumenDate(selectedDate, minimumDate, maximumDate))
  }

  const openPicker = (): void => {
    if (!enabled) return

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        ...pickerBounds,
        mode: 'date',
        onChange: commitValue,
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
        accessibilityHint={resolveLumenValidationHint(errorMessage, description)}
        accessibilityLabel={`${label}, ${displayValue}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: !enabled, expanded: pickerExpanded }}
        aria-invalid={resolveLumenAriaInvalid(errorMessage)}
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
            color: validValue ? theme.colors.ink : theme.colors.inkMuted,
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
        expanded={pickerExpanded}
        label={label}
        mode="date"
        onDateChange={selectedDate => {
          onValueChange(clampLumenDate(selectedDate, minimumDate, maximumDate))
        }}
        onChange={commitValue}
        themeVariant={theme.scheme}
        value={pickerValue}
        webValue={validValue}
      />
      <DateSupportingText
        {...(description ? { description } : {})}
        {...(errorMessage ? { errorMessage } : {})}
      />
    </View>
  )
}

export const LumenDateField = (props: LumenDateFieldProps): ReactElement => (
  <LumenDateFieldControl key={String(props.enabled ?? true)} {...props} />
)

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
    <View
      {...props}
      accessibilityHint={resolveLumenValidationHint(errorMessage, description, props.accessibilityHint)}
      accessibilityLabel={props.accessibilityLabel ?? label}
      aria-invalid={resolveLumenAriaInvalid(errorMessage)}
      style={[{ gap: theme.spacing.sm }, style]}
    >
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
