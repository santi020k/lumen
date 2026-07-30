'use client'

import type {
  FieldPath,
  FieldValues,
  UseControllerProps
} from 'react-hook-form'
import { useController } from 'react-hook-form'

import type {
  DatePickerProps,
  InputOTPProps,
  ListBoxProps,
  SelectProps
} from '@santi020k/lumen-react'
import {
  DatePicker,
  InputOTP,
  ListBox,
  Select
} from '@santi020k/lumen-react'

type ControllerOptions<
  Values extends FieldValues,
  Name extends FieldPath<Values>
> = UseControllerProps<Values, Name>

export type LumenSelectControllerProps<
  Values extends FieldValues,
  Name extends FieldPath<Values>
> = ControllerOptions<Values, Name> & Omit<
  SelectProps,
  'defaultValue' | 'disabled' | 'inputRef' | 'name' | 'onValueChange' | 'value'
>

export const LumenSelectController = <
  Values extends FieldValues,
  Name extends FieldPath<Values>
>({
  control,
  defaultValue,
  disabled,
  name,
  rules,
  shouldUnregister,
  ...props
}: LumenSelectControllerProps<Values, Name>) => {
  const { field } = useController({
    name,
    ...(control ? { control } : {}),
    ...(defaultValue === undefined ? {} : { defaultValue }),
    ...(disabled === undefined ? {} : { disabled }),
    ...(rules ? { rules } : {}),
    ...(shouldUnregister === undefined ? {} : { shouldUnregister })
  })

  const {
    disabled: fieldDisabled,
    name: fieldName,
    onBlur: fieldOnBlur,
    onChange: fieldOnChange,
    ref: fieldRef,
    value: fieldValue
  } = field

  return (
    <Select
      {...props}
      disabled={fieldDisabled}
      inputRef={fieldRef}
      name={fieldName}
      onBlur={fieldOnBlur}
      onValueChange={fieldOnChange}
      value={typeof fieldValue === 'string' ? fieldValue : ''}
    />
  )
}

export type LumenDatePickerControllerProps<
  Values extends FieldValues,
  Name extends FieldPath<Values>
> = ControllerOptions<Values, Name> & Omit<
  DatePickerProps,
  'defaultValue' | 'disabled' | 'inputRef' | 'name' | 'onValueChange' | 'value'
>

export const LumenDatePickerController = <
  Values extends FieldValues,
  Name extends FieldPath<Values>
>({
  control,
  defaultValue,
  disabled,
  name,
  rules,
  shouldUnregister,
  ...props
}: LumenDatePickerControllerProps<Values, Name>) => {
  const { field } = useController({
    name,
    ...(control ? { control } : {}),
    ...(defaultValue === undefined ? {} : { defaultValue }),
    ...(disabled === undefined ? {} : { disabled }),
    ...(rules ? { rules } : {}),
    ...(shouldUnregister === undefined ? {} : { shouldUnregister })
  })

  const {
    disabled: fieldDisabled,
    name: fieldName,
    onBlur: fieldOnBlur,
    onChange: fieldOnChange,
    ref: fieldRef,
    value: fieldValue
  } = field

  return (
    <DatePicker
      {...props}
      disabled={fieldDisabled}
      inputRef={fieldRef}
      name={fieldName}
      onBlur={fieldOnBlur}
      onValueChange={fieldOnChange}
      value={typeof fieldValue === 'string' ? fieldValue : ''}
    />
  )
}

export type LumenInputOTPControllerProps<
  Values extends FieldValues,
  Name extends FieldPath<Values>
> = ControllerOptions<Values, Name> & Omit<
  InputOTPProps,
  'defaultValue' | 'disabled' | 'name' | 'onBlur' | 'onChange' | 'ref' | 'value'
>

export const LumenInputOTPController = <
  Values extends FieldValues,
  Name extends FieldPath<Values>
>({
  control,
  defaultValue,
  disabled,
  name,
  rules,
  shouldUnregister,
  ...props
}: LumenInputOTPControllerProps<Values, Name>) => {
  const { field } = useController({
    name,
    ...(control ? { control } : {}),
    ...(defaultValue === undefined ? {} : { defaultValue }),
    ...(disabled === undefined ? {} : { disabled }),
    ...(rules ? { rules } : {}),
    ...(shouldUnregister === undefined ? {} : { shouldUnregister })
  })

  const {
    disabled: fieldDisabled,
    name: fieldName,
    onBlur: fieldOnBlur,
    onChange: fieldOnChange,
    ref: fieldRef,
    value: fieldValue
  } = field

  return (
    <InputOTP
      {...props}
      disabled={fieldDisabled}
      name={fieldName}
      onBlur={fieldOnBlur}
      onChange={fieldOnChange}
      ref={fieldRef}
      value={typeof fieldValue === 'string' ? fieldValue : ''}
    />
  )
}

export interface LumenListBoxControllerOptions {
  multiple?: boolean
}

export type LumenListBoxControllerProps<
  Values extends FieldValues,
  Name extends FieldPath<Values>
> = ControllerOptions<Values, Name> & LumenListBoxControllerOptions & Omit<
  ListBoxProps,
  'defaultValue' | 'disabled' | 'multiple' | 'name' | 'onValueChange' | 'ref' | 'value'
>

const normalizeListBoxValue = (value: unknown, multiple: boolean): string | string[] => {
  if (multiple) {
    if (!Array.isArray(value)) return []

    return value.map(String)
  }

  return typeof value === 'string' ? value : ''
}

export const LumenListBoxController = <
  Values extends FieldValues,
  Name extends FieldPath<Values>
>({
  control,
  defaultValue,
  disabled,
  multiple = false,
  name,
  rules,
  shouldUnregister,
  ...props
}: LumenListBoxControllerProps<Values, Name>) => {
  const { field } = useController({
    name,
    ...(control ? { control } : {}),
    ...(defaultValue === undefined ? {} : { defaultValue }),
    ...(disabled === undefined ? {} : { disabled }),
    ...(rules ? { rules } : {}),
    ...(shouldUnregister === undefined ? {} : { shouldUnregister })
  })

  const {
    disabled: fieldDisabled,
    name: fieldName,
    onBlur: fieldOnBlur,
    onChange: fieldOnChange,
    ref: fieldRef,
    value: fieldValue
  } = field

  return (
    <ListBox
      {...props}
      disabled={fieldDisabled}
      multiple={multiple}
      name={fieldName}
      onBlur={fieldOnBlur}
      onValueChange={values => {
        fieldOnChange(multiple ? values : values[0] ?? '')
      }}
      ref={fieldRef}
      value={normalizeListBoxValue(fieldValue, multiple)}
    />
  )
}
