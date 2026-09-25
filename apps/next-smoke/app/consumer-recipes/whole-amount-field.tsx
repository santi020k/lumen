import { useEffect, useId, useRef } from 'react'

import { Field, Label, NumberField } from '@santi020k/lumen-react'

/** Whole-unit recipe; fractional currencies require an explicit minor-unit contract. */
export const WholeAmountField = ({ currency, errorLabel, hint, label, locale, max, onChange, value }: {
  currency: string
  errorLabel: string
  hint: string
  label: string
  locale: string
  max: number
  onChange: (value: string) => void
  value: string
}) => {
  const id = useId()
  const fieldRef = useRef<HTMLInputElement>(null)
  // Keep the editable value as text: clearing a field must not silently become zero.
  const amount = /^[0-9]+$/.test(value) ? Number(value) : Number.NaN
  const valid = Number.isSafeInteger(amount) && amount >= 0 && amount <= max
  const invalid = value !== '' && !valid

  const formatted = valid ?
    new Intl.NumberFormat(locale, {
      currency,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
      style: 'currency'
    }).format(amount) :
    ''

  useEffect(() => {
    fieldRef.current?.setCustomValidity(invalid ? errorLabel : '')
  }, [errorLabel, invalid])

  return (
    <Field>
      <Label htmlFor={id}>
        {label}
        {' '}
        (
        {currency}
        )
      </Label>
      <NumberField
        aria-describedby={`${id}-hint ${id}-preview${invalid ? ` ${id}-error` : ''}`}
        aria-invalid={invalid}
        id={id}
        inputMode="numeric"
        onChange={event => {
          onChange(event.currentTarget.value)
        }}
        pattern="[0-9]+"
        ref={fieldRef}
        required
        type="text"
        value={value}
      />
      <p id={`${id}-hint`}>{hint}</p>
      <output id={`${id}-preview`} htmlFor={id}>{formatted}</output>
      {invalid && <p id={`${id}-error`} role="alert">{errorLabel}</p>}
    </Field>
  )
}
