import { type ReactElement, useMemo } from 'react'
import { View, type ViewProps } from 'react-native'
import { Path, Rect, Svg } from 'react-native-svg'

import { LumenText } from './primitives.js'
import { encodeLumenQRCode, type LumenQRCodeCorrection, lumenQRCodePath } from './qrcode-recipes.js'
import { useLumenTheme } from './theme-context.js'

export interface LumenQRCodeProps extends Omit<ViewProps, 'children'> {
  value: string
  label: string
  size?: number
  quietZone?: number
  correction?: LumenQRCodeCorrection
  errorLabel?: string
  showValue?: boolean
}

const isQRCodeSize = (size: number): boolean => Number.isFinite(size) && size > 0 && size <= 4096

export const LumenQRCode = ({ value, label, size = 160, quietZone = 4, correction = 'M',
  errorLabel = 'Unable to generate QR code', showValue = true, style, ...props }: LumenQRCodeProps): ReactElement => {
  const theme = useLumenTheme()
  const result = useMemo(() => encodeLumenQRCode(value, correction, quietZone), [value, correction, quietZone])
  const validSize = isQRCodeSize(size)
  const path = useMemo(() => result.status === 'ready' ? lumenQRCodePath(result.modules) : '', [result])

  return (
    <View {...props} style={[{ alignItems: 'flex-start', gap: theme.spacing.xs }, style]}>
      {result.status === 'ready' && validSize ?
        (
          <View accessible accessibilityRole="image" accessibilityLabel={label} accessibilityValue={{ text: value }}>
            <Svg width={size} height={size} viewBox={`0 0 ${result.dimension} ${result.dimension}`} accessible={false}>
              <Rect width={result.dimension} height={result.dimension} fill="#ffffff" />
              <Path d={path} fill="#000000" />
            </Svg>
          </View>
        ) :
        <LumenText accessibilityRole="alert">{errorLabel}</LumenText>}
      {showValue && <LumenText>{value}</LumenText>}
    </View>
  )
}
