import { type ComponentType, createElement, type ReactElement } from 'react'

import type { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker'
import * as NativeDateTimePickerModule from '@react-native-community/datetimepicker'

export interface NativeDatePickerProps {
  accentColor: string
  disabled: boolean
  display: 'default' | 'inline' | 'spinner'
  is24Hour?: boolean
  maximumDate?: Date
  minimumDate?: Date
  mode: 'date' | 'time'
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

const ResolvedNativeDatePicker = nativeDatePickerCandidate

export const NativeDatePicker = (props: NativeDatePickerProps): ReactElement => (
  createElement(ResolvedNativeDatePicker, props)
)
