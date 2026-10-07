// cspell:words Exceso Restaurar generar
import { type ReactElement, useState } from 'react'
import { View } from 'react-native'

import { LumenButton, LumenQRCode } from '@santi020k/lumen-react-native'

export const QRCodeParityExample = (): ReactElement => {
  const [value, setValue] = useState('https://lumen.santi020k.com')
  const [spanish, setSpanish] = useState(false)

  return (
    <View testID="qrcode-parity-example" style={{ gap: 12 }}>
      <LumenButton onPress={() => {
        setSpanish(!spanish)
      }}
      >
        English / Español
      </LumenButton>
      <LumenButton onPress={() => {
        setValue('https://lumen.santi020k.com/日本語?name=Molina🌞')
      }}
      >
        Unicode
      </LumenButton>
      <LumenButton onPress={() => {
        setValue('')
      }}
      >
        {spanish ? 'Vacío' : 'Empty'}
      </LumenButton>
      <LumenButton onPress={() => {
        setValue('A'.repeat(10000))
      }}
      >
        {spanish ? 'Exceso' : 'Oversize'}
      </LumenButton>
      <LumenButton onPress={() => {
        setValue('https://lumen.santi020k.com')
      }}
      >
        {spanish ? 'Restaurar' : 'Restore'}
      </LumenButton>
      <LumenQRCode
        label={spanish ? 'Código QR de ejemplo' : 'Example QR code'}
        value={value}
        errorLabel={spanish ? 'No se pudo generar el código QR' : 'Unable to generate QR code'}
        showValue={value.length < 200}
      />
    </View>
  )
}
