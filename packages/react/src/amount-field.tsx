'use client'

import type { ComponentPropsWithRef } from 'react'
import { useLayoutEffect, useRef, useState } from 'react'

import { composeClassName, createLumenAmountFieldController, formatLumenAmountDraft, getLumenAmountValue, type LumenAmountChangeDetail, type LumenAmountFieldController, type LumenAmountOptions } from '@santi020k/lumen-core'

export interface AmountFieldProps extends Omit<ComponentPropsWithRef<'input'>, 'value' | 'defaultValue' | 'type' | 'min' | 'max' | 'step'>, LumenAmountOptions {
  value?: string
  defaultValue?: string
  invalidMessage?: string
  onValueChange?: (draft: string, detail: LumenAmountChangeDetail) => void
}

/** Formatting owns no currency conversion, rounding or domain validation. */
export const AmountField = ({ value, defaultValue = '', locale = 'en-US', fractionDigits = 2, allowNegative = false, invalidMessage, onValueChange, name, form, disabled, readOnly, className, ...props }: AmountFieldProps) => {
  const rootRef = useRef<HTMLSpanElement>(null)
  const controllerRef = useRef<LumenAmountFieldController | undefined>(undefined)
  const latestRef = useRef({ value, onValueChange })
  const options = { locale, fractionDigits, allowNegative }
  const initial = value ?? defaultValue
  const [draft, setDraft] = useState(initial)

  useLayoutEffect(() => {
    latestRef.current = { value, onValueChange }
  })

  useLayoutEffect(() => {
    const root = rootRef.current

    if (!root) return

    const controller = createLumenAmountFieldController(root, detail => {
      setDraft(detail.draft)

      latestRef.current.onValueChange?.(detail.draft, detail)

      if (latestRef.current.value !== undefined) controller.setValue(latestRef.current.value)
    })

    controllerRef.current = controller

    return () => {
      controller.destroy()

      controllerRef.current = undefined
    }
  }, [locale, fractionDigits, allowNegative, form])

  useLayoutEffect(() => {
    if (value !== undefined) controllerRef.current?.setValue(value)
  }, [value])

  return (
    <span
      ref={rootRef}
      data-ui-amount-field
      {...{ locale, 'fraction-digits': String(fractionDigits), 'allow-negative': allowNegative ? '' : undefined, value: value ?? draft, 'default-value': defaultValue, 'invalid-message': invalidMessage }}
    >
      <input
        {...props}
        className={composeClassName('ui-input ui-amount-field', className)}
        defaultValue={formatLumenAmountDraft(initial, options)}
        data-ui-amount-input
        disabled={disabled}
        readOnly={readOnly}
        form={form}
        type="text"
        inputMode="decimal"
      />
      <input data-ui-amount-value type="hidden" name={name} form={form} disabled={disabled} value={getLumenAmountValue(value ?? draft) ?? ''} />
    </span>
  )
}
