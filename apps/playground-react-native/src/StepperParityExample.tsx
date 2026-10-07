import { type ReactElement, useState } from 'react'
import { View } from 'react-native'

import { LumenButton, LumenCheckbox, LumenStepper, LumenText } from '@santi020k/lumen-react-native'

const english = {
  label: 'Example progress',
  horizontal: 'Horizontal layout',
  invalid: 'Duplicate IDs',
  unavailable: 'Steps unavailable',
  back: 'Back',
  next: 'Next',
  reset: 'Reset progress',
  past: 'Past the end',
  negative: 'Negative index',
  nonfinite: 'Nonfinite index',
  titles: ['Choose an accessible experience with a longer title', 'Review the details', 'Confirm'],
  description: 'The host owns navigation and saves progress.',
  states: { complete: 'Complete', current: 'Current', upcoming: 'Upcoming' },
  host: (value: number): string => `Host index: ${value}`
}

const spanish = {
  label: 'Progreso del ejemplo',
  horizontal: 'Vista horizontal',
  invalid: 'IDs duplicados',
  unavailable: 'Pasos no disponibles',
  back: 'Atrás',
  next: 'Siguiente',
  reset: 'Reiniciar',
  past: 'Después del final',
  negative: 'Índice negativo',
  nonfinite: 'Índice no finito',
  titles: ['Elegir una experiencia accesible con un título largo', 'Revisar los detalles', 'Confirmar'],
  description: 'La aplicación controla el progreso.',
  states: { complete: 'Completado', current: 'Actual', upcoming: 'Pendiente' },
  host: (value: number): string => `Índice del host: ${value}`
}

export const StepperParityExample = (): ReactElement => {
  const [current, setCurrent] = useState(0)
  const [horizontal, setHorizontal] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [localized, setLocalized] = useState(false)
  const copy = localized ? spanish : english
  const steps = copy.titles.map((title, index) => ({ id: invalid ? 'duplicate' : `step-${index}`, title, description: copy.description }))

  const move = (offset: number): void => {
    setCurrent(value => Math.min(3, Math.max(0, (Number.isFinite(value) ? value : 0) + offset)))
  }

  return (
    <View style={{ gap: 12 }}>
      <LumenButton
        intent="secondary"
        onPress={() => {
          setLocalized(value => !value)
        }}
      >
        <LumenText>English / Español</LumenText>
      </LumenButton>
      <LumenCheckbox label={copy.horizontal} checked={horizontal} onCheckedChange={setHorizontal} />
      <LumenCheckbox label={copy.invalid} checked={invalid} onCheckedChange={setInvalid} />
      <LumenStepper label={copy.label} steps={steps} currentStep={current} orientation={horizontal ? 'horizontal' : 'vertical'} formatState={state => copy.states[state]} invalidText={copy.unavailable} />
      <LumenText>{copy.host(current)}</LumenText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <LumenButton
          intent="secondary"
          onPress={() => {
            move(-1)
          }}
        >
          <LumenText>{copy.back}</LumenText>
        </LumenButton>
        <LumenButton onPress={() => {
          move(1)
        }}
        >
          <LumenText>{copy.next}</LumenText>
        </LumenButton>
        <LumenButton
          intent="secondary"
          onPress={() => {
            setCurrent(0)
          }}
        >
          <LumenText>{copy.reset}</LumenText>
        </LumenButton>
        <LumenButton
          intent="secondary"
          onPress={() => {
            setCurrent(99)
          }}
        >
          <LumenText>{copy.past}</LumenText>
        </LumenButton>
        <LumenButton
          intent="secondary"
          onPress={() => {
            setCurrent(-3)
          }}
        >
          <LumenText>{copy.negative}</LumenText>
        </LumenButton>
        <LumenButton
          intent="secondary"
          onPress={() => {
            setCurrent(Number.NaN)
          }}
        >
          <LumenText>{copy.nonfinite}</LumenText>
        </LumenButton>
      </View>
    </View>
  )
}
