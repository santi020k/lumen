// cspell:words Menciones sugerencias coincidencias Cargando selección inválida Restaurar lectura Deshabilitado
import { type ReactElement, useState } from 'react'
import { View } from 'react-native'

import { LumenButton, LumenMentions, type LumenMentionsValue, LumenText } from '@santi020k/lumen-react-native'

const initial: LumenMentionsValue = { text: 'Hello 😀 @al!', selection: { start: 12, end: 12 } }

const options = [
  { id: 'alice', label: 'Alice — Design', value: 'alice' },
  { id: 'alex', label: 'Alex — Engineering', value: 'alex' },
  { id: 'archived', label: 'Albert — Archived', value: 'albert', disabled: true }
]

export const MentionsParityExample = (): ReactElement => {
  const [value, setValue] = useState(initial)
  const [spanish, setSpanish] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const [composing, setComposing] = useState(false)
  const [status, setStatus] = useState<'ready' | 'loading' | 'error'>('ready')

  return (
    <View testID="mentions-parity-example" style={{ gap: 12 }}>
      <LumenButton onPress={() => {
        setSpanish(!spanish)
      }}
      >
        English / Español
      </LumenButton>
      <LumenButton onPress={() => {
        setDisabled(!disabled)
      }}
      >
        {spanish ? 'Deshabilitado' : 'Disabled'}
        :
        {String(disabled)}
      </LumenButton>
      <LumenButton onPress={() => {
        setReadOnly(!readOnly)
      }}
      >
        {spanish ? 'Solo lectura' : 'Read-only'}
        :
        {String(readOnly)}
      </LumenButton>
      <LumenButton onPress={() => {
        setComposing(!composing)
      }}
      >
        Composition hint:
        {String(composing)}
      </LumenButton>
      <LumenButton onPress={() => {
        setStatus(status === 'loading' ? 'ready' : 'loading')
      }}
      >
        Loading
      </LumenButton>
      <LumenButton onPress={() => {
        setStatus(status === 'error' ? 'ready' : 'error')
      }}
      >
        Error
      </LumenButton>
      <LumenButton onPress={() => {
        setValue({ ...value, selection: { start: -1, end: -1 } })
      }}
      >
        {spanish ? 'Selección inválida' : 'Invalid selection'}
      </LumenButton>
      <LumenButton onPress={() => {
        setValue(initial)

        setDisabled(false)

        setReadOnly(false)

        setComposing(false)

        setStatus('ready')
      }}
      >
        {spanish ? 'Restaurar' : 'Restore'}
      </LumenButton>
      <LumenMentions
        label={spanish ? 'Menciones de ejemplo' : 'Example mentions'}
        value={value}
        onValueChange={setValue}
        options={options}
        disabled={disabled}
        readOnly={readOnly}
        isComposing={composing}
        status={status}
        labels={spanish ?
          { suggestions: 'Sugerencias',
            empty: 'Sin coincidencias',
            loading: 'Cargando sugerencias',
            error: 'No se pudieron cargar las sugerencias',
            invalid: 'Selección inválida',
            readOnly: 'Solo lectura' } :
          undefined}
      />
      <LumenText>{value.text}</LumenText>
    </View>
  )
}
