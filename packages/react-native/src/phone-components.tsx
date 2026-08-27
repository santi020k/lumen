import {
  type ReactElement,
  useMemo,
  useState
} from 'react'
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  type TextStyle,
  View,
  type ViewProps
} from 'react-native'

import {
  getLumenPhoneCountries,
  type LumenPhoneCountry,
  type LumenPhoneCountryOptions,
  type LumenPhoneNumber
} from '@santi020k/lumen-core'

import { LumenFieldGroup } from './additional-components.js'
import { LumenSearchField } from './form-components.js'
import { LumenSheet } from './overlay-components.js'
import {
  resolveLumenPhoneControlledValue,
  resolveLumenPhoneInputValue
} from './phone-recipes.js'
import { LumenIcon } from './primitives.js'
import {
  resolveLumenAriaInvalid,
  resolveLumenButtonOpacity,
  resolveLumenValidationHint
} from './recipes.js'
import { useLumenTheme } from './theme-context.js'

export interface LumenPhoneInputProps extends Omit<ViewProps, 'children'> {
  countries?: readonly LumenPhoneCountry[]
  countryPickerTitle?: string
  countrySearchLabel?: string
  countrySelectorLabel?: string
  description?: string
  enabled?: boolean
  errorMessage?: string
  invalidNumberMessage?: string
  label: string
  locale?: LumenPhoneCountryOptions['locale']
  numberLabel?: string
  onValueChange: (value: LumenPhoneNumber) => void
  required?: boolean
  showValidationError?: boolean
  value: LumenPhoneNumber
}

interface LumenPhoneInputLabels {
  countryPickerTitle: string
  countrySearchLabel: string
  countrySelectorLabel: string
  invalidNumberMessage: string
  numberLabel: string
}

interface LumenPhoneCountryPickerProps {
  countries: readonly LumenPhoneCountry[]
  dismiss: () => void
  enabled: boolean
  labels: LumenPhoneInputLabels
  onSelect: (country: LumenPhoneCountry) => void
  query: string
  selectedRegion: string
  setQuery: (query: string) => void
  visible: boolean
}

const resolvePhoneInputLabels = (props: LumenPhoneInputProps): LumenPhoneInputLabels => ({
  countryPickerTitle: props.countryPickerTitle ?? 'Select country',
  countrySearchLabel: props.countrySearchLabel ?? 'Search countries',
  countrySelectorLabel: props.countrySelectorLabel ?? 'Country code',
  invalidNumberMessage: props.invalidNumberMessage ?? 'Enter a complete phone number.',
  numberLabel: props.numberLabel ?? 'Phone number'
})

const getPhoneOptions = (
  locale: LumenPhoneCountryOptions['locale']
): LumenPhoneCountryOptions => locale === undefined ? {} : { locale }

const filterPhoneCountries = (
  countries: readonly LumenPhoneCountry[],
  query: string
): readonly LumenPhoneCountry[] => {
  const normalizedQuery = query.trim().toLocaleLowerCase()

  if (!normalizedQuery) return countries

  return countries.filter(country => (
    country.displayName.toLocaleLowerCase().includes(normalizedQuery) ||
    country.regionCode.toLocaleLowerCase().includes(normalizedQuery) ||
    country.callingCode.includes(normalizedQuery)
  ))
}

const getPhoneError = (
  errorMessage: string | undefined,
  invalidNumberMessage: string,
  showValidationError: boolean,
  value: LumenPhoneNumber
): string | undefined => {
  if (errorMessage) return errorMessage

  if (!showValidationError || !value.nationalNumber || value.isValid) return undefined

  return invalidNumberMessage
}

const resolvePhoneCountryOpacity = (enabled: boolean, pressed: boolean): number => (
  enabled ? resolveLumenButtonOpacity(false, pressed) : 0.52
)

const resolvePhonePickerVisible = (enabled: boolean, visible: boolean): boolean => (
  enabled && visible
)

const LumenPhoneCountryPicker = ({
  countries,
  dismiss,
  enabled,
  labels,
  onSelect,
  query,
  selectedRegion,
  setQuery,
  visible
}: LumenPhoneCountryPickerProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <LumenSheet
      onDismiss={dismiss}
      title={labels.countryPickerTitle}
      visible={visible}
    >
      <View style={{ gap: theme.spacing.md }}>
        <LumenSearchField
          editable={enabled}
          onChangeText={setQuery}
          prompt={labels.countrySearchLabel}
          value={query}
        />
        <FlatList
          data={countries}
          keyboardShouldPersistTaps="handled"
          keyExtractor={country => country.regionCode}
          renderItem={({ item: country }) => {
            const selected = country.regionCode === selectedRegion

            return (
              <Pressable
                accessibilityLabel={`${country.displayName}, ${country.callingCode}`}
                accessibilityRole="radio"
                accessibilityState={{ disabled: !enabled, selected }}
                disabled={!enabled}
                onPress={() => {
                  onSelect(country)
                }}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  minHeight: 48,
                  opacity: resolvePhoneCountryOpacity(enabled, pressed),
                  paddingHorizontal: theme.spacing.sm
                })}
              >
                <Text
                  style={{
                    color: theme.colors.ink,
                    flex: 1,
                    fontSize: theme.fontSizes.sm,
                    fontWeight: String(theme.fontWeights.medium) as TextStyle['fontWeight']
                  }}
                >
                  {country.pickerLabel}
                </Text>
                {selected ? <LumenIcon decorative name="check" size="sm" /> : null}
              </Pressable>
            )
          }}
          style={{ maxHeight: 440 }}
        />
      </View>
    </LumenSheet>
  )
}

/** A controlled international phone editor with searchable country metadata and E.164 output. */
const LumenPhoneInputControl = (props: LumenPhoneInputProps): ReactElement => {
  const theme = useLumenTheme()
  const [countryQuery, setCountryQuery] = useState('')
  const [pickerVisible, setPickerVisible] = useState(false)
  const labels = resolvePhoneInputLabels(props)
  const enabled = props.enabled ?? true
  const required = props.required ?? false
  const showValidationError = props.showValidationError ?? true
  const phoneOptions = useMemo(() => getPhoneOptions(props.locale), [props.locale])

  const availableCountries = useMemo(
    () => props.countries ?? getLumenPhoneCountries(phoneOptions),
    [phoneOptions, props.countries]
  )

  const countrySelectorDisabled = !enabled || availableCountries.length === 0
  const pickerEnabled = !countrySelectorDisabled
  const pickerVisibleForState = resolvePhonePickerVisible(pickerEnabled, pickerVisible)

  const filteredCountries = useMemo(
    () => filterPhoneCountries(availableCountries, countryQuery),
    [availableCountries, countryQuery]
  )

  const value = useMemo(
    () => resolveLumenPhoneControlledValue(availableCountries, props.value, phoneOptions),
    [availableCountries, phoneOptions, props.value]
  )

  const effectiveError = getPhoneError(
    props.errorMessage,
    labels.invalidNumberMessage,
    showValidationError,
    value
  )

  const dismissPicker = (): void => {
    setPickerVisible(false)

    setCountryQuery('')
  }

  const selectCountry = (country: LumenPhoneCountry): void => {
    props.onValueChange(resolveLumenPhoneInputValue(
      availableCountries,
      country,
      value.nationalNumber,
      phoneOptions
    ))

    dismissPicker()
  }

  const {
    countries: _countries,
    countryPickerTitle: _countryPickerTitle,
    countrySearchLabel: _countrySearchLabel,
    countrySelectorLabel: _countrySelectorLabel,
    description,
    enabled: _enabled,
    errorMessage: _errorMessage,
    invalidNumberMessage: _invalidNumberMessage,
    label,
    locale: _locale,
    numberLabel: _numberLabel,
    onValueChange: _onValueChange,
    required: _required,
    showValidationError: _showValidationError,
    style,
    value: _value,
    ...viewProps
  } = props

  return (
    <View {...viewProps} style={style}>
      <LumenFieldGroup
        {...(description === undefined ? {} : { description })}
        {...(effectiveError === undefined ? {} : { errorMessage: effectiveError })}
        label={label}
        required={required}
      >
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm }}>
          <Pressable
            accessibilityLabel={`${labels.countrySelectorLabel}, ${value.country.displayName}, ${value.country.callingCode}`}
            accessibilityRole="button"
            accessibilityState={{
              disabled: countrySelectorDisabled,
              expanded: pickerVisibleForState
            }}
            disabled={countrySelectorDisabled}
            onPress={() => {
              setCountryQuery('')

              setPickerVisible(true)
            }}
            style={({ pressed }) => ({
              alignItems: 'center',
              backgroundColor: theme.colors.surface,
              borderColor: effectiveError ? theme.colors.danger : theme.colors.line,
              borderRadius: theme.radii.sm,
              borderWidth: 1,
              flexDirection: 'row',
              gap: theme.spacing.xs,
              minHeight: 44,
              opacity: countrySelectorDisabled ? 0.52 : resolveLumenButtonOpacity(false, pressed),
              paddingHorizontal: theme.spacing.md
            })}
          >
            <Text style={{ color: theme.colors.ink, fontSize: theme.fontSizes.sm }}>
              {value.country.flag}
              {' '}
              {value.country.callingCode}
            </Text>
          </Pressable>
          <TextInput
            accessibilityHint={resolveLumenValidationHint(effectiveError, description)}
            accessibilityLabel={labels.numberLabel}
            accessibilityState={{ disabled: !enabled }}
            aria-invalid={resolveLumenAriaInvalid(effectiveError)}
            autoComplete="tel"
            editable={enabled}
            keyboardType="phone-pad"
            onChangeText={input => {
              props.onValueChange(resolveLumenPhoneInputValue(
                availableCountries,
                value.country,
                input,
                phoneOptions
              ))
            }}
            placeholder={labels.numberLabel}
            placeholderTextColor={theme.colors.inkMuted}
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: effectiveError ? theme.colors.danger : theme.colors.line,
              borderRadius: theme.radii.sm,
              borderWidth: 1,
              color: theme.colors.ink,
              flex: 1,
              fontSize: theme.fontSizes.sm,
              minHeight: 44,
              opacity: enabled ? 1 : 0.52,
              paddingHorizontal: theme.spacing.md
            }}
            textContentType="telephoneNumber"
            value={value.nationalNumber}
          />
        </View>
      </LumenFieldGroup>

      <LumenPhoneCountryPicker
        countries={filteredCountries}
        dismiss={dismissPicker}
        enabled={pickerEnabled}
        labels={labels}
        onSelect={selectCountry}
        query={countryQuery}
        selectedRegion={value.country.regionCode}
        setQuery={setCountryQuery}
        visible={pickerVisibleForState}
      />
    </View>
  )
}

export const LumenPhoneInput = (props: LumenPhoneInputProps): ReactElement => {
  const pickerEnabled = (props.enabled ?? true) && (props.countries?.length ?? 1) > 0

  return <LumenPhoneInputControl key={String(pickerEnabled)} {...props} />
}
