import { type ReactElement, useState } from 'react'
import { View } from 'react-native'

import { LumenButton, LumenCheckbox, LumenRating, LumenText, resolveLumenRating } from '@santi020k/lumen-react-native'

const englishCopy = {
  readOnly: 'Read only',
  disabled: 'Disabled',
  invalid: 'Invalid values',
  label: 'Example rating',
  clear: 'Clear rating',
  maximum: 'Set maximum rating',
  maxLabel: (value: number): string => `Maximum: ${value}`,
  option: (value: number, max: number): string => `Rate ${value} of ${max}`,
  valueLabel: (value: number, max: number): string => `Rating: ${value} of ${max}`
}

const spanishCopy = {
  readOnly: 'Solo lectura',
  disabled: 'Deshabilitado',
  invalid: 'Valores inválidos',
  label: 'Calificación del ejemplo',
  clear: 'Sin calificar',
  maximum: 'Calificación máxima',
  maxLabel: (value: number): string => `Máximo: ${value}`,
  option: (value: number, max: number): string => `Calificar ${value} de ${max}`,
  valueLabel: (value: number, max: number): string => `Calificación: ${value} de ${max}`
}

const nextMaximum = (value: number): number => {
  if (value === 5) return 10

  if (value === 10) return 1

  return 5
}

export const RatingParityExample = (): ReactElement => {
  const [value, setValue] = useState(0)
  const [max, setMax] = useState(5)
  const [readOnly, setReadOnly] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [spanish, setSpanish] = useState(false)
  const copy = spanish ? spanishCopy : englishCopy
  const displayed = resolveLumenRating(invalid ? -3 : value, invalid ? 0 : max)

  const change = (rating: number): void => {
    setInvalid(false)

    setValue(rating)
  }

  return (
    <View style={{ gap: 12 }}>
      <LumenButton
        intent="secondary"
        onPress={() => {
          setSpanish(current => !current)
        }}
      >
        <LumenText>English / Español</LumenText>
      </LumenButton>
      <LumenCheckbox label={copy.readOnly} checked={readOnly} onCheckedChange={setReadOnly} />
      <LumenCheckbox label={copy.disabled} checked={disabled} onCheckedChange={setDisabled} />
      <LumenCheckbox label={copy.invalid} checked={invalid} onCheckedChange={setInvalid} />
      <LumenButton
        intent="secondary"
        onPress={() => {
          setInvalid(false)

          setMax(nextMaximum)
        }}
      >
        <LumenText>{copy.maxLabel(max)}</LumenText>
      </LumenButton>
      <LumenRating
        label={copy.label}
        value={invalid ? -3 : value}
        max={invalid ? 0 : max}
        onValueChange={change}
        readOnly={readOnly}
        disabled={disabled}
        formatOption={copy.option}
      />
      <LumenText accessibilityLiveRegion="polite">{copy.valueLabel(displayed.value, displayed.max)}</LumenText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <LumenButton
          intent="secondary"
          onPress={() => {
            setInvalid(false)

            setValue(0)
          }}
        >
          <LumenText>{copy.clear}</LumenText>
        </LumenButton>
        <LumenButton
          intent="secondary"
          onPress={() => {
            setInvalid(false)

            setValue(max)
          }}
        >
          <LumenText>{copy.maximum}</LumenText>
        </LumenButton>
      </View>
    </View>
  )
}
