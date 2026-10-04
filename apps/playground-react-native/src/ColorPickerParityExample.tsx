// cspell:words inválido Restaurar Transparente Deshabilitado acento Azul Rojo Matiz Saturación Opacidad
import { type ReactElement, useState } from 'react'
import { View } from 'react-native'

import { LumenButton, LumenColorPicker, LumenText } from '@santi020k/lumen-react-native'

export const ColorPickerParityExample = (): ReactElement => {
  const [value, setValue] = useState('#3366cc80')
  const [spanish, setSpanish] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const [disabled, setDisabled] = useState(false)

  return (
    <View testID="color-picker-parity-example" style={{ gap: 12 }}>
      <LumenButton onPress={() => {
        setSpanish(!spanish)
      }}
      >
        English / Español
      </LumenButton>
      <LumenButton onPress={() => {
        setValue('bad')
      }}
      >
        {spanish ? 'Color inválido' : 'Invalid color'}
      </LumenButton>
      <LumenButton onPress={() => {
        setValue('#3366cc80')
      }}
      >
        {spanish ? 'Restaurar' : 'Restore'}
      </LumenButton>
      <LumenButton onPress={() => {
        setValue('#00000000')
      }}
      >
        {spanish ? 'Transparente' : 'Transparent black'}
      </LumenButton>
      <LumenButton onPress={() => {
        setReadOnly(!readOnly)
      }}
      >
        {spanish ? 'Solo lectura' : 'Read only'}
        :
        {' '}
        {String(readOnly)}
      </LumenButton>
      <LumenButton onPress={() => {
        setDisabled(!disabled)
      }}
      >
        {spanish ? 'Deshabilitado' : 'Disabled'}
        :
        {' '}
        {String(disabled)}
      </LumenButton>
      <LumenColorPicker
        label={spanish ? 'Color de acento' : 'Accent color'}
        value={value}
        onValueChange={setValue}
        allowAlpha
        readOnly={readOnly}
        disabled={disabled}
        palette={[{ id: 'blue', label: spanish ? 'Azul' : 'Blue', value: '#3366cc80' },
          { id: 'red', label: spanish ? 'Rojo' : 'Red', value: '#cc3333ff' }]}
        labels={spanish ?
          { field: 'Color hexadecimal o RGBA',
            hue: 'Matiz',
            saturation: 'Saturación',
            brightness: 'Brillo',
            alpha: 'Opacidad',
            invalid: 'Introduce un color válido',
            preview: 'Color seleccionado' } :
          undefined}
      />
      <LumenText>{value}</LumenText>
    </View>
  )
}
