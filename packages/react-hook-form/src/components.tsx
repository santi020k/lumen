'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  FieldPath,
  FieldValues,
  RefCallBack,
  UseControllerProps
} from 'react-hook-form'
import { useController } from 'react-hook-form'

import type {
  AmountFieldProps,
  DatePickerProps,
  InputOTPProps,
  ListBoxProps,
  SelectProps
} from '@santi020k/lumen-react'
import {
  AmountField,
  DatePicker,
  InputOTP,
  ListBox,
  Select
} from '@santi020k/lumen-react'

export type LumenAmountFieldControllerProps<
  Values extends FieldValues, Name extends FieldPath<Values>
> = UseControllerProps<Values, Name> & Omit<
  AmountFieldProps, 'defaultValue' | 'disabled' | 'name' | 'onValueChange' | 'value' | 'ref'
>

export const LumenAmountFieldController = <Values extends FieldValues, Name extends FieldPath<Values>>({
  control, defaultValue, disabled, name, rules, shouldUnregister, ...props
}: LumenAmountFieldControllerProps<Values, Name>) => {
  const { field } = useController({
    name,
    ...(control ? { control } : {}),
    ...(defaultValue === undefined ? {} : { defaultValue }),
    ...(disabled === undefined ? {} : { disabled }),
    ...(rules ? { rules } : {}),
    ...(shouldUnregister === undefined ? {} : { shouldUnregister })
  })

  const {
    ref: fieldRef, disabled: fieldDisabled, name: fieldName,
    onBlur: fieldOnBlur, onChange: fieldOnChange, value: fieldValue
  } = field

  return <AmountField {...props} ref={fieldRef} disabled={fieldDisabled} name={fieldName} onBlur={fieldOnBlur} onValueChange={fieldOnChange} value={typeof fieldValue === 'string' ? fieldValue : ''} />
}

interface ManagedControlParts {
  root: string
  trigger: string
}

/**
 * DatePicker, Select, and ListBox keep a hidden native control for forms while users interact with a
 * visible trigger or list. RHF focuses that trigger, keeps native validity on the native control, and
 * marks the field touched only when focus leaves the whole component.
 */
type ManagedNativeControl = HTMLInputElement | HTMLSelectElement

const useManagedNativeControl = (
  fieldRef: RefCallBack,
  fieldOnBlur: () => void,
  parts: ManagedControlParts
): ((node: ManagedNativeControl | null) => void) => {
  const [root, setRoot] = useState<HTMLElement | null>(null)
  const nativeNodeRef = useRef<ManagedNativeControl | null>(null)
  const { root: rootSelector, trigger: triggerSelector } = parts

  const nativeRef = useCallback((node: ManagedNativeControl | null) => {
    const owner = node?.closest<HTMLElement>(rootSelector) ?? null

    nativeNodeRef.current = node

    setRoot(owner)

    if (!node) return

    fieldRef({
      focus: () => {
        (owner?.querySelector<HTMLElement>(triggerSelector) ?? node).focus()
      },
      reportValidity: () => node.reportValidity(),
      setCustomValidity: (message: string) => {
        node.setCustomValidity(message)
      }
    })
  }, [fieldRef, rootSelector, triggerSelector])

  useEffect(() => {
    if (!root) return

    const NodeType = root.ownerDocument.defaultView?.Node

    const handleFocusOut = (event: FocusEvent) => {
      // ListBox also forwards this exit through its native proxy; count the original list exit once.
      if (root.hasAttribute('data-ui-list-box') && !event.isTrusted && event.target === nativeNodeRef.current) return

      if (NodeType && event.relatedTarget instanceof NodeType && root.contains(event.relatedTarget)) return

      fieldOnBlur()
    }

    root.addEventListener('focusout', handleFocusOut)

    return () => {
      root.removeEventListener('focusout', handleFocusOut)
    }
  }, [fieldOnBlur, root])

  return nativeRef
}

const selectParts = { root: '[data-ui-select]', trigger: '[data-ui-select-trigger]' }
const datePickerParts = { root: '[data-ui-date-picker]', trigger: '[data-ui-date-picker-trigger]' }
const listBoxParts = { root: '[data-ui-list-box]', trigger: '[data-ui-list-box-list]' }

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

  const nativeRef = useManagedNativeControl(fieldRef, fieldOnBlur, selectParts)

  return (
    <Select
      {...props}
      disabled={fieldDisabled}
      inputRef={nativeRef}
      name={fieldName}
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

  const nativeRef = useManagedNativeControl(fieldRef, fieldOnBlur, datePickerParts)

  return (
    <DatePicker
      {...props}
      disabled={fieldDisabled}
      inputRef={nativeRef}
      name={fieldName}
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

  const nativeRef = useManagedNativeControl(fieldRef, fieldOnBlur, listBoxParts)

  return (
    <ListBox
      {...props}
      disabled={fieldDisabled}
      multiple={multiple}
      name={fieldName}
      onValueChange={values => {
        fieldOnChange(multiple ? values : values[0] ?? '')
      }}
      ref={nativeRef}
      value={normalizeListBoxValue(fieldValue, multiple)}
    />
  )
}
