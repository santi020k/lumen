import { type ReactElement, useState } from 'react'
import { ScrollView, type TextInputProps, View } from 'react-native'

import { isLumenDecimalInBounds, type LumenDecimalDraft, type LumenDecimalOptions, normalizeLumenNumericOTP, parseLumenDecimalDraft, stepLumenDecimalDraft } from '@santi020k/lumen-core'

import { LumenFieldGroup } from './additional-components.js'
import { LumenButton, LumenText, LumenTextField } from './foundation-primitives.js'
import type { LumenTextInputRef } from './native-ref-types.js'
import { useLumenTheme } from './theme-context.js'

interface ControlledFieldProps extends Omit<TextInputProps, 'editable' | 'onChangeText' | 'value'> {
  description?: string
  enabled?: boolean
  errorMessage?: string
  label: string
  onValueChange: (value: string) => void
  readOnly?: boolean
  ref?: LumenTextInputRef
  value: string
}

const isEditable = (enabled?: boolean, readOnly?: boolean): boolean => (enabled ?? true) && !(readOnly ?? false)

const fieldGroupProps = (label: string, description?: string, errorMessage?: string) => ({
  ...(description === undefined ? {} : { description }),
  ...(errorMessage === undefined ? {} : { errorMessage }),
  label
})

export interface LumenPasswordFieldProps extends Omit<ControlledFieldProps, 'secureTextEntry' | 'textContentType' | 'autoComplete'> {
  hideLabel?: string
  newPassword?: boolean
  showLabel?: string
}

const LumenPasswordFieldControl = ({
  description, enabled, errorMessage, hideLabel = 'Hide password', label,
  newPassword = false, onBlur, onValueChange, readOnly, ref,
  showLabel = 'Show password', value, ...props
}: LumenPasswordFieldProps): ReactElement => {
  const [revealed, setRevealed] = useState(false)
  const editable = isEditable(enabled, readOnly)
  const visible = editable && revealed

  return (
    <LumenFieldGroup {...fieldGroupProps(label, description, errorMessage)}>
      <LumenTextField
        {...(ref ? { ref } : {})}
        {...props}
        autoCapitalize="none"
        autoComplete={newPassword ? 'new-password' : 'current-password'}
        autoCorrect={false}
        editable={editable}
        onBlur={event => {
          setRevealed(false)

          onBlur?.(event)
        }}
        onChangeText={proposal => {
          if (editable) onValueChange(proposal)
        }}
        secureTextEntry={!visible}
        textContentType={newPassword ? 'newPassword' : 'password'}
        value={value}
      />
      <LumenButton
        disabled={!editable}
        intent="quiet"
        accessibilityLabel={visible ? hideLabel : showLabel}
        onPress={() => {
          if (editable) setRevealed(current => !current)
        }}
      >
        {visible ? hideLabel : showLabel}
      </LumenButton>
    </LumenFieldGroup>
  )
}

export const LumenPasswordField = (props: LumenPasswordFieldProps): ReactElement => (
  <LumenPasswordFieldControl key={`${props.enabled ?? true}-${props.readOnly ?? false}`} {...props} />
)

export interface LumenInputOTPProps extends Omit<ControlledFieldProps, 'autoComplete' | 'keyboardType' | 'maxLength' | 'secureTextEntry' | 'textContentType'> {
  length?: number
  masked?: boolean
  onComplete?: (value: string) => void
}

export const LumenInputOTP = ({
  description, enabled, errorMessage, label, length = 6, masked = false,
  onComplete, onValueChange, readOnly, ref, value, ...props
}: LumenInputOTPProps): ReactElement => {
  if (normalizeLumenNumericOTP(value, length) !== value) throw new RangeError('OTP value must contain at most length ASCII digits.')

  const editable = isEditable(enabled, readOnly)

  return (
    <LumenFieldGroup {...fieldGroupProps(label, description, errorMessage)}>
      <LumenTextField
        {...(ref ? { ref } : {})}
        {...props}
        autoComplete="one-time-code"
        autoCorrect={false}
        editable={editable}
        keyboardType="number-pad"
        onChangeText={proposal => {
          if (!editable) return

          const normalized = normalizeLumenNumericOTP(proposal, length)

          if (normalized === null || normalized === value) return

          onValueChange(normalized)

          if (normalized.length === length) onComplete?.(normalized)
        }}
        secureTextEntry={masked}
        textContentType="oneTimeCode"
        value={value}
      />
    </LumenFieldGroup>
  )
}

export interface LumenNumberFieldProps extends ControlledFieldProps {
  decrementLabel?: string
  incrementLabel?: string
  invalidNumberLabel?: string
  locale?: string
  max?: string
  min?: string
  outOfRangeLabel?: string
  showStepper?: boolean
  step?: string
}

const numberLabels = (
  decrementLabel?: string, incrementLabel?: string, invalidNumberLabel?: string, outOfRangeLabel?: string
) => ({
  decrement: decrementLabel ?? 'Decrease value',
  increment: incrementLabel ?? 'Increase value',
  invalid: invalidNumberLabel ?? 'Enter a valid number',
  range: outOfRangeLabel ?? 'Enter a number within the allowed range'
})

const numberOptions = (locale?: string, max?: string, min?: string, step?: string): LumenDecimalOptions => ({
  ...(locale === undefined ? {} : { locale }),
  ...(max === undefined ? {} : { max }),
  ...(min === undefined ? {} : { min }),
  ...(step === undefined ? {} : { step })
})

const numberValidation = (
  draft: LumenDecimalDraft, inBounds: boolean, labels: ReturnType<typeof numberLabels>
): string | undefined => {
  if (draft.kind === 'empty') return undefined

  if (draft.kind !== 'valid') return labels.invalid

  return inBounds ? undefined : labels.range
}

export const LumenNumberField = ({
  decrementLabel, description, enabled, errorMessage,
  incrementLabel, invalidNumberLabel,
  label, locale, max, min, onValueChange, outOfRangeLabel,
  readOnly, ref, showStepper = true, step, value, ...props
}: LumenNumberFieldProps): ReactElement => {
  const theme = useLumenTheme()
  const options = numberOptions(locale, max, min, step)
  const labels = numberLabels(decrementLabel, incrementLabel, invalidNumberLabel, outOfRangeLabel)
  const draft = parseLumenDecimalDraft(value, locale)
  const inBounds = isLumenDecimalInBounds(value, options)
  const validation = numberValidation(draft, inBounds, labels)
  const editable = isEditable(enabled, readOnly)
  const message = errorMessage ?? validation
  const decrease = stepLumenDecimalDraft(value, -1, options)
  const increase = stepLumenDecimalDraft(value, 1, options)

  const canStep = (proposal: string | null): boolean => {
    if (proposal === null) return false

    if (draft.kind !== 'valid') return true

    const next = parseLumenDecimalDraft(proposal, locale)

    return next.kind === 'valid' &&
      next.coefficient * 10n ** BigInt(draft.scale) !== draft.coefficient * 10n ** BigInt(next.scale)
  }

  return (
    <LumenFieldGroup {...fieldGroupProps(label, description, message)}>
      <LumenTextField
        {...(ref ? { ref } : {})}
        {...props}
        editable={editable}
        keyboardType="decimal-pad"
        onChangeText={proposal => {
          if (editable) onValueChange(proposal)
        }}
        value={value}
      />
      {showStepper ?
        (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            <LumenButton
              disabled={!editable || !canStep(decrease)}
              intent="quiet"
              accessibilityLabel={labels.decrement}
              onPress={() => {
                if (editable && decrease !== null) onValueChange(decrease)
              }}
            >
              {labels.decrement}
            </LumenButton>
            <LumenButton
              disabled={!editable || !canStep(increase)}
              intent="quiet"
              accessibilityLabel={labels.increment}
              onPress={() => {
                if (editable && increase !== null) onValueChange(increase)
              }}
            >
              {labels.increment}
            </LumenButton>
          </View>
        ) :
        null}
    </LumenFieldGroup>
  )
}

export interface LumenAutocompleteOption {
  description?: string
  disabled?: boolean
  label: string
  value: string
}

export interface LumenAutocompleteProps extends Omit<ControlledFieldProps, 'onValueChange' | 'value'> {
  dismissLabel?: string
  emptyLabel?: string
  loading?: boolean
  loadingLabel?: string
  onQueryChange: (query: string) => void
  onRetry?: () => void
  onValueChange: (value: string) => void
  options: readonly LumenAutocompleteOption[]
  query: string
  resultsErrorMessage?: string
  retryLabel?: string
  value?: string
}

const defaultCopy = (value: string | undefined, fallback: string): string => value ?? fallback

interface AutocompleteLabels { dismiss: string, empty: string, loading: string, retry: string }

const autocompleteStatus = (loading: boolean | undefined, error: string | undefined, count: number,
  labels: AutocompleteLabels): string | undefined => {
  if (loading) return labels.loading

  if (error !== undefined) return error

  return count === 0 ? labels.empty : undefined
}

const LumenAutocompleteControl = ({
  description, dismissLabel, emptyLabel, enabled,
  errorMessage, label, loading, loadingLabel, onFocus,
  onQueryChange, onRetry, onValueChange, options, query, readOnly, ref,
  resultsErrorMessage, retryLabel, value, ...props
}: LumenAutocompleteProps): ReactElement => {
  const theme = useLumenTheme()
  const [expanded, setExpanded] = useState(false)
  const editable = isEditable(enabled, readOnly)

  if (new Set(options.map(option => option.value)).size !== options.length) throw new RangeError('Autocomplete option values must be unique.')

  const labels = {
    dismiss: defaultCopy(dismissLabel, 'Close results'),
    empty: defaultCopy(emptyLabel, 'No results'),
    loading: defaultCopy(loadingLabel, 'Loading results'),
    retry: defaultCopy(retryLabel, 'Retry')
  }

  const status = autocompleteStatus(loading, resultsErrorMessage, options.length, labels)

  return (
    <LumenFieldGroup {...fieldGroupProps(label, description, errorMessage)}>
      <LumenTextField
        {...(ref ? { ref } : {})}
        {...props}
        accessibilityRole="combobox"
        accessibilityState={{ expanded }}
        editable={editable}
        onChangeText={proposal => {
          if (editable) {
            onQueryChange(proposal)

            setExpanded(true)
          }
        }}
        onFocus={event => {
          if (editable) setExpanded(true)

          onFocus?.(event)
        }}
        value={query}
      />
      {expanded && editable ?
        (
          <View style={{ gap: theme.spacing.sm }}>
            {status ? <LumenText accessibilityLiveRegion="polite">{status}</LumenText> : null}
            {!loading && resultsErrorMessage && onRetry ?
              (
                <LumenButton
                  intent="quiet"
                  accessibilityLabel={labels.retry}
                  onPress={() => {
                    onRetry()
                  }}
                >
                  {labels.retry}
                </LumenButton>
              ) :
              null}
            {!status ?
              (
                <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 240 }}>
                  {options.map(option => (
                    <LumenButton
                      accessibilityHint={option.description}
                      accessibilityState={{ selected: option.value === value }}
                      disabled={option.disabled}
                      intent="quiet"
                      key={option.value}
                      accessibilityLabel={option.label}
                      onPress={() => {
                        if (option.disabled) return

                        onQueryChange(option.label)

                        onValueChange(option.value)

                        setExpanded(false)
                      }}
                    >
                      {option.label}
                    </LumenButton>
                  ))}
                </ScrollView>
              ) :
              null}
            <LumenButton
              intent="quiet"
              accessibilityLabel={labels.dismiss}
              onPress={() => {
                setExpanded(false)
              }}
            >
              {labels.dismiss}
            </LumenButton>
          </View>
        ) :
        null}
    </LumenFieldGroup>
  )
}

export const LumenAutocomplete = (props: LumenAutocompleteProps): ReactElement => (
  <LumenAutocompleteControl key={`${props.enabled ?? true}-${props.readOnly ?? false}`} {...props} />
)
