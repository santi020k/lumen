import { type ReactElement, useState } from 'react'
import { I18nManager, type ImageSourcePropType, View, type ViewProps, type ViewStyle } from 'react-native'

import { formatLumenImageComparisonValue, type LumenImageComparisonMode, normalizeLumenImageComparisonMode } from '@santi020k/lumen-core'

import { LumenText } from './foundation-primitives.js'
import { LumenImage, type LumenImageFit } from './media-components.js'
import { useLumenTheme } from './theme-context.js'
import { LumenSlider } from './value-components.js'

export interface LumenImageComparisonProps extends Omit<ViewProps, 'children'> {
  after: ImageSourcePropType
  afterLabel?: string
  aspectRatio?: number
  before: ImageSourcePropType
  beforeLabel?: string
  enabled?: boolean
  fit?: LumenImageFit
  label: string
  locale?: string
  mode?: LumenImageComparisonMode
  onValueChange: (value: number) => void
  value: number
}

const comparisonPosition = (value: number): number => Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.5

const comparisonRatio = (ratio: number): number => {
  if (!Number.isFinite(ratio) || ratio < 0.1 || ratio > 10) return 16 / 9

  return ratio
}

const comparisonEdge = (rtl: boolean): Pick<ViewStyle, 'left' | 'right'> => rtl ? { right: 0 } : { left: 0 }

const ComparisonAlternatePreview = ({ mode, ratio, before, after, beforeLabel, afterLabel, label, fit }: {
  mode: LumenImageComparisonMode
  ratio: number
  before: ImageSourcePropType
  after: ImageSourcePropType
  beforeLabel: string
  afterLabel: string
  label: string
  fit: LumenImageFit
}) => {
  const theme = useLumenTheme()

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <LumenText>{label}</LumenText>
      <View style={{ flexDirection: mode === 'side-by-side' ? 'row' : 'column', gap: theme.spacing.sm }}>
        {mode !== 'after' && (
          <View style={{ flex: 1, minWidth: 0, gap: theme.spacing.xs }}>
            <LumenImage decorative fit={fit} radius="lg" source={before} aspectRatio={ratio} />
            <LumenText>{beforeLabel}</LumenText>
          </View>
        )}
        {mode !== 'before' && (
          <View style={{ flex: 1, minWidth: 0, gap: theme.spacing.xs }}>
            <LumenImage decorative fit={fit} radius="lg" source={after} aspectRatio={ratio} />
            <LumenText>{afterLabel}</LumenText>
          </View>
        )}
      </View>
    </View>
  )
}

export const LumenImageComparison = ({
  after, afterLabel = 'After', aspectRatio = 16 / 9, before, beforeLabel = 'Before',
  enabled = true, fit = 'cover', label, locale, mode: requestedMode, onValueChange, style, value, ...props
}: LumenImageComparisonProps): ReactElement => {
  const mode = normalizeLumenImageComparisonMode(requestedMode)
  const theme = useLumenTheme()
  const [width, setWidth] = useState(0)
  const position = comparisonPosition(value)
  const ratio = comparisonRatio(aspectRatio)
  const percentage = formatLumenImageComparisonValue(position * 100, '', locale).trim()
  const rtl = I18nManager.isRTL

  return (
    <View {...props} style={[{ gap: theme.spacing.sm }, style]}>
      {mode !== 'reveal' ?
        (
          <ComparisonAlternatePreview
            mode={mode}
            ratio={ratio}
            before={before}
            after={after}
            beforeLabel={beforeLabel}
            afterLabel={afterLabel}
            label={label}
            fit={fit}
          />
        ) :
        (
          <>
            <View
              onLayout={event => {
                setWidth(event.nativeEvent.layout.width)
              }}
              style={{ aspectRatio: ratio, borderRadius: theme.radii.lg, overflow: 'hidden', width: '100%' }}
            >
              <LumenImage decorative fit={fit} radius="none" source={before} style={{ height: '100%', position: 'absolute' }} />
              <View style={{ bottom: 0, ...comparisonEdge(rtl), overflow: 'hidden', position: 'absolute', top: 0, width: `${position * 100}%` }}>
                <LumenImage decorative fit={fit} radius="none" source={after} style={{ height: '100%', ...comparisonEdge(rtl), position: 'absolute', width }} />
              </View>
              <View pointerEvents="none" style={{ backgroundColor: theme.colors.ink, bottom: 0, left: `${(rtl ? 1 - position : position) * 100}%`, position: 'absolute', top: 0, width: theme.spacing.xs }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <LumenText>{afterLabel}</LumenText>
              <LumenText>{beforeLabel}</LumenText>
            </View>
            <LumenSlider enabled={enabled} label={label} max={1} min={0} onValueChange={onValueChange} step={0.01} value={position} valueLabel={`${afterLabel} ${percentage}`} />
          </>
        )}
    </View>
  )
}
