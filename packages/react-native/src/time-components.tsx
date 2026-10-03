import { type ChangeEvent, createElement, type ReactElement, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'

import { DateTimePickerAndroid, type DateTimePickerChangeEvent } from '@react-native-community/datetimepicker'
import { isLumenTimeInBounds, isLumenTimeSelection, type LumenTimeSelection } from '@santi020k/lumen-core'

import { LumenFieldGroup } from './additional-components.js'
import { LumenButton, LumenText } from './foundation-primitives.js'
import { NativeDatePicker } from './native-date-picker.js'
import { type LumenSafeAreaInsets, LumenSheet } from './overlay-components.js'
import { useLumenTheme } from './theme-context.js'

export interface LumenTimeFieldProps {
  confirmLabel?: string
  description?: string
  dismissLabel?: string
  enabled?: boolean
  errorMessage?: string
  is24Hour?: boolean
  label: string
  locale?: string
  maxTime?: LumenTimeSelection
  minTime?: LumenTimeSelection
  onValueChange: (value: LumenTimeSelection) => void
  placeholder?: string
  rangeErrorLabel?: string
  readOnly?: boolean
  safeAreaInsets?: LumenSafeAreaInsets
  value: LumenTimeSelection | null
}

const dateForTime = (time: LumenTimeSelection): Date => new Date(2000, 0, 1, time.hour, time.minute)
const timeForDate = (date: Date): LumenTimeSelection => ({ hour: date.getHours(), minute: date.getMinutes() })
const inputTime = (time: LumenTimeSelection): string => `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`
const timeCopy = (value: string | undefined, fallback: string): string => value ?? fallback

const timeLabels = (confirm?: string, dismiss?: string, placeholder?: string, rangeError?: string) => ({
  confirm: timeCopy(confirm, 'Confirm'),
  dismiss: timeCopy(dismiss, 'Cancel'),
  placeholder: timeCopy(placeholder, 'Choose a time'),
  rangeError: timeCopy(rangeError, 'Choose a time within the allowed range')
})

const initialTime = (
  value: LumenTimeSelection | null, min?: LumenTimeSelection, max?: LumenTimeSelection
): LumenTimeSelection => {
  if (value && !isLumenTimeSelection(value)) throw new RangeError('Time value must be a valid wall-clock value.')

  const fallback = min ?? { hour: 0, minute: 0 }

  isLumenTimeInBounds(fallback, min, max)

  return value && isLumenTimeInBounds(value, min, max) ? value : fallback
}

const timeDisplay = (
  value: LumenTimeSelection | null, placeholder: string, locale?: string, is24Hour?: boolean
): string => {
  if (!value) return placeholder

  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric', ...(is24Hour === undefined ? {} : { hour12: !is24Hour }), minute: '2-digit'
  }).format(dateForTime(value))
}

const supportingProps = (description?: string, errorMessage?: string) => ({
  ...(description === undefined ? {} : { description }), ...(errorMessage === undefined ? {} : { errorMessage })
})

const isTimeEditable = (enabled?: boolean, readOnly?: boolean): boolean => (enabled ?? true) && !(readOnly ?? false)

const LumenTimeFieldControl = ({
  confirmLabel, description, dismissLabel, enabled,
  errorMessage, is24Hour, label, locale, maxTime, minTime, onValueChange,
  placeholder, rangeErrorLabel,
  readOnly, safeAreaInsets, value
}: LumenTimeFieldProps): ReactElement => {
  const theme = useLumenTheme()
  const initial = initialTime(value, minTime, maxTime)
  const labels = timeLabels(confirmLabel, dismissLabel, placeholder, rangeErrorLabel)
  const [draft, setDraft] = useState(initial)
  const [expanded, setExpanded] = useState(false)
  const [selectionError, setSelectionError] = useState<string>()
  const androidOpenRef = useRef(false)
  const editable = isTimeEditable(enabled, readOnly)
  const message = errorMessage ?? selectionError
  const valid = isLumenTimeInBounds(draft, minTime, maxTime)
  const display = timeDisplay(value, labels.placeholder, locale, is24Hour)

  useEffect(() => () => {
    if (androidOpenRef.current) void DateTimePickerAndroid.dismiss('time')

    androidOpenRef.current = false
  }, [])

  const onAndroidChange = (_event: DateTimePickerChangeEvent, date?: Date): void => {
    if (!androidOpenRef.current) return

    androidOpenRef.current = false

    if (!editable || !date) return

    const selected = timeForDate(date)

    if (isLumenTimeInBounds(selected, minTime, maxTime)) {
      setSelectionError(undefined)

      onValueChange(selected)
    } else setSelectionError(labels.rangeError)
  }

  const open = (): void => {
    if (!editable) return

    setDraft(initial)

    setSelectionError(undefined)

    if (Platform.OS === 'android') {
      androidOpenRef.current = true

      DateTimePickerAndroid.open({ ...(is24Hour === undefined ? {} : { is24Hour }),
        mode: 'time',
        onDismiss: () => {
          androidOpenRef.current = false
        },
        onValueChange: onAndroidChange,
        value: dateForTime(initial) })
    } else setExpanded(true)
  }

  return (
    <LumenFieldGroup {...supportingProps(description, message)} label={label}>
      <LumenButton accessibilityHint={errorMessage ?? description} accessibilityLabel={`${label}, ${display}`} disabled={!editable} intent="secondary" onPress={open}>{display}</LumenButton>
      <LumenSheet
        actions={(
          <>
            <LumenButton
              accessibilityLabel={labels.dismiss}
              intent="quiet"
              onPress={() => {
                setExpanded(false)
              }}
            >
              {labels.dismiss}
            </LumenButton>
            <LumenButton
              accessibilityLabel={labels.confirm}
              disabled={!valid}
              onPress={() => {
                if (editable && valid) {
                  onValueChange(draft)

                  setExpanded(false)
                }
              }}
            >
              {labels.confirm}
            </LumenButton>
          </>
        )}
        avoidKeyboard
        onDismiss={() => {
          setExpanded(false)
        }}
        {...(safeAreaInsets === undefined ? {} : { safeAreaInsets })}
        title={label}
        visible={expanded && editable}
      >
        {Platform.OS === 'web' ?
          createElement('input', {
            'aria-label': label,
            disabled: !editable,
            max: maxTime ? inputTime(maxTime) : undefined,
            min: minTime ? inputTime(minTime) : undefined,
            onChange: (event: ChangeEvent<HTMLInputElement>) => {
              const [hour, minute] = event.currentTarget.value.split(':').map(Number)

              if (hour !== undefined && minute !== undefined) {
                const selected = { hour, minute }

                if (isLumenTimeInBounds(selected)) setDraft(selected)
              }
            },
            type: 'time',
            value: inputTime(draft)
          }) :
          (
            <NativeDatePicker
              accentColor={theme.colors.brandSolid}
              disabled={!editable}
              display="spinner"
              {...(is24Hour === undefined ? {} : { is24Hour })}
              mode="time"
              onChange={(_event, date) => {
                if (date && editable) setDraft(timeForDate(date))
              }}
              themeVariant={theme.scheme}
              value={dateForTime(draft)}
            />
          )}
        {!valid ? <LumenText accessibilityLiveRegion="polite">{labels.rangeError}</LumenText> : null}
      </LumenSheet>
    </LumenFieldGroup>
  )
}

export const LumenTimeField = (props: LumenTimeFieldProps): ReactElement => (
  <LumenTimeFieldControl key={`${props.enabled ?? true}-${props.readOnly ?? false}`} {...props} />
)
