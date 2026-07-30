'use client'

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
import type {
  FieldPath,
  FieldValues,
  UseControllerProps
} from 'react-hook-form'
import { useController } from 'react-hook-form'

export interface LumenManagedFieldState {
  'aria-describedby'?: string | undefined
  'aria-invalid': boolean
  controlId: string
  errorId: string
  errorMessage?: string | undefined
  invalid: boolean
}

export interface LumenFieldStateInput {
  error?: {
    message?: unknown
  } | undefined
  invalid: boolean
}

export const getLumenManagedFieldState = (
  fieldState: LumenFieldStateInput,
  controlId: string,
  describedBy?: string
): LumenManagedFieldState => {
  const errorId = `${controlId}-error`
  const errorMessage = typeof fieldState.error?.message === 'string' ?
    fieldState.error.message :
    undefined
  const descriptionIds = [
    describedBy,
    fieldState.invalid ? errorId : undefined
  ].filter((value): value is string => Boolean(value))

  return {
    'aria-describedby': descriptionIds.length ? descriptionIds.join(' ') : undefined,
    'aria-invalid': fieldState.invalid,
    controlId,
    errorId,
    errorMessage,
    invalid: fieldState.invalid
  }
}

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

  return (
    <Select
      {...props}
      disabled={field.disabled}
      inputRef={field.ref}
      name={field.name}
      onBlur={field.onBlur}
      onValueChange={field.onChange}
      value={typeof field.value === 'string' ? field.value : ''}
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

  return (
    <DatePicker
      {...props}
      disabled={field.disabled}
      inputRef={field.ref}
      name={field.name}
      onBlur={field.onBlur}
      onValueChange={field.onChange}
      value={typeof field.value === 'string' ? field.value : ''}
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

  return (
    <InputOTP
      {...props}
      disabled={field.disabled}
      name={field.name}
      onBlur={field.onBlur}
      onChange={field.onChange}
      ref={field.ref}
      value={typeof field.value === 'string' ? field.value : ''}
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

  return (
    <ListBox
      {...props}
      disabled={field.disabled}
      multiple={multiple}
      name={field.name}
      onBlur={field.onBlur}
      onValueChange={values => {
        field.onChange(multiple ? values : values[0] ?? '')
      }}
      ref={field.ref}
      value={normalizeListBoxValue(field.value, multiple)}
    />
  )
}
