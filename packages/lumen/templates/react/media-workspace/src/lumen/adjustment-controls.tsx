'use client'

import { useId } from 'react'

import { Badge, Button, Field, Label, Slider, Stack } from '@santi020k/lumen-react'

export interface AdjustmentControlProps {
  defaultValue: number
  disabled?: boolean
  formatValue: (value: number) => string
  label: string
  max: number
  min: number
  modifiedLabel: string
  onValueChange: (value: number) => void
  resetLabel: string
  step: number
  value: number
}

/** Draft adjustment state belongs to the host; a reset requests the declared neutral value. */
export const AdjustmentControlRecipe = ({
  defaultValue, disabled, formatValue, label, max, min, modifiedLabel, onValueChange, resetLabel,
  step, value
}: AdjustmentControlProps) => {
  const id = useId()
  const outputId = useId()
  const modified = value !== defaultValue

  return (
    <Field>
      <Stack direction="horizontal" align="center" justify="between" wrap>
        <Label htmlFor={id}>{label}</Label>
        <output id={outputId} htmlFor={id}>{formatValue(value)}</output>
        {modified && <Badge variant="secondary">{modifiedLabel}</Badge>}
      </Stack>
      <Slider
        id={id}
        aria-describedby={outputId}
        aria-valuetext={formatValue(value)}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={event => {
          onValueChange(event.currentTarget.valueAsNumber)
        }}
      />
      <Button
        variant="ghost"
        disabled={disabled === true || !modified}
        onClick={() => {
          onValueChange(defaultValue)
        }}
      >
        {resetLabel}
      </Button>
    </Field>
  )
}
