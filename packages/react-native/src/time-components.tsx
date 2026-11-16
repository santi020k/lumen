import { type ChangeEvent, createElement, type ReactElement, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'

import { DateTimePickerAndroid, type DateTimePickerChangeEvent } from '@react-native-community/datetimepicker'
import { isLumenTimeInBounds, isLumenTimeSelection, type LumenTimeSelection } from '@santi020k/lumen-core/native-input'

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

  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric', ...(is24Hour === undefined ? {} : { hour12: !is24Hour }), minute: '2-digit'
  }

  try {
    return new Intl.DateTimeFormat(locale, options).format(dateForTime(value))
  } catch (error: unknown) {
    if (!(error instanceof RangeError)) throw error

    return new Intl.DateTimeFormat('en', options).format(dateForTime(value))
  }
}

const supportingProps = (description?: string, errorMessage?: string) => ({
  ...(description === undefined ? {} : { description }), ...(errorMessage === undefined ? {} : { errorMessage })
})

const isTimeEditable = (enabled?: boolean, readOnly?: boolean): boolean => (enabled ?? true) && !(readOnly ?? false)
// Android keeps the first listener when open() is called again for an existing dialog.
let activeAndroidTimePicker: symbol | undefined

const releaseAndroidTimePicker = (owner: symbol | undefined): boolean => {
  if (owner === undefined || activeAndroidTimePicker !== owner) return false

  activeAndroidTimePicker = undefined

  return true
}

const dismissAndroidTimePicker = async (owner: symbol): Promise<void> => {
  try {
    await DateTimePickerAndroid.dismiss('time')
  } catch {
    // The native activity can disappear before cleanup; allow a later field to retry.
  } finally {
    releaseAndroidTimePicker(owner)
  }
}

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
  const androidTimePickerRef = useRef<symbol | undefined>(undefined)
  const editable = isTimeEditable(enabled, readOnly)
  const message = errorMessage ?? selectionError
  const valid = isLumenTimeInBounds(draft, minTime, maxTime)
  const display = timeDisplay(value, labels.placeholder, locale, is24Hour)

  useEffect(() => () => {
    const owner = androidTimePickerRef.current

    androidTimePickerRef.current = undefined

    if (owner !== undefined && activeAndroidTimePicker === owner) void dismissAndroidTimePicker(owner)
  }, [])

  const onAndroidChange = (_event: DateTimePickerChangeEvent, date?: Date): void => {
    if (!editable || !date) return

    const selected = timeForDate(date)

    if (isLumenTimeInBounds(selected, minTime, maxTime)) {
      setSelectionError(undefined)

      onValueChange(selected)
    } else setSelectionError(labels.rangeError)
  }

  const androidChangeRef = useRef(onAndroidChange)

  useLayoutEffect(() => {
    androidChangeRef.current = onAndroidChange
  })

  const open = (): void => {
    if (!editable) return

    setDraft(initial)

    setSelectionError(undefined)

    if (Platform.OS === 'android') {
      if (activeAndroidTimePicker !== undefined) return

      const owner = Symbol('LumenTimeField')

      activeAndroidTimePicker = owner

      androidTimePickerRef.current = owner

      const releasePicker = (): boolean => {
        if (androidTimePickerRef.current !== owner) return false

        androidTimePickerRef.current = undefined

        return releaseAndroidTimePicker(owner)
      }

      try {
        DateTimePickerAndroid.open({ ...(is24Hour === undefined ? {} : { is24Hour }),
          mode: 'time',
          onDismiss: () => {
            releasePicker()
          },
          onError: () => {
            releasePicker()
          },
          onValueChange: (event, date) => {
            if (releasePicker()) androidChangeRef.current(event, date)
          },
          value: dateForTime(initial) })
      } catch (error) {
        releasePicker()

        throw error
      }
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

export const LumenTimeField = (props: LumenTimeFieldProps): ReactElement => {
  const sheetIdentity = Platform.OS === 'android' ?
    '' :
    [
      props.value ? inputTime(props.value) : 'empty',
      props.minTime ? inputTime(props.minTime) : 'unbounded',
      props.maxTime ? inputTime(props.maxTime) : 'unbounded'
    ].join('|')

  return <LumenTimeFieldControl key={`${props.enabled ?? true}-${props.readOnly ?? false}-${sheetIdentity}`} {...props} />
}
