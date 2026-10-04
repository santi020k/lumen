import { type ReactElement, useState } from 'react'
import { Pressable, View, type ViewProps } from 'react-native'

import {
  formatLumenColor, type LumenColorSwatch, type LumenHSVA,   lumenHSVAToRGBA, type LumenRGBA,
  lumenRGBAToHSVA, parseLumenColor
} from './color-picker-recipes.js'
import { LumenText, LumenTextField } from './primitives.js'
import { useLumenTheme } from './theme-context.js'
import { LumenSlider } from './value-components.js'

export interface LumenColorPickerLabels {
  field: string
  hue: string
  saturation: string
  brightness: string
  alpha: string
  invalid: string
  preview: string
}
export interface LumenColorPickerProps extends Omit<ViewProps, 'children'> {
  label: string
  value: string
  onValueChange: (value: string) => void
  allowAlpha?: boolean
  disabled?: boolean
  readOnly?: boolean
  palette?: readonly LumenColorSwatch[]
  labels?: Partial<LumenColorPickerLabels>
}

const emptyPalette: readonly LumenColorSwatch[] = []

const defaultLabels: LumenColorPickerLabels = {
  field: 'Hex or RGBA color',
  hue: 'Hue',
  saturation: 'Saturation',
  brightness: 'Brightness',
  alpha: 'Opacity',
  invalid: 'Enter a valid color',
  preview: 'Selected color'
}

interface ColorSelection { source: string | null, color: LumenRGBA | null, hsva: LumenHSVA | null }

const describeColor = (value: string, allowAlpha: boolean): ColorSelection => {
  const parsed = parseLumenColor(value)
  const source = parsed ? formatLumenColor(parsed, allowAlpha) : null
  const color = source ? parsed : null

  return { source, color, hsva: color ? lumenRGBAToHSVA(color) : null }
}

const useColorPicker = (value: string, allowAlpha: boolean, enabled: boolean, emit: (value: string) => void) => {
  const actual = describeColor(value, allowAlpha)
  const [draft, setDraft] = useState(value)
  const [selection, setSelection] = useState(actual)
  const [previousValue, setPreviousValue] = useState(value)
  const [previousAlpha, setPreviousAlpha] = useState(allowAlpha)

  if (previousValue !== value || previousAlpha !== allowAlpha) {
    setPreviousAlpha(allowAlpha)

    setPreviousValue(value)

    setDraft(value)

    if (selection.source !== actual.source) setSelection(actual)
  }

  const hsva = selection.source === actual.source ? selection.hsva : actual.hsva

  const select = (next: string, preserveChannels = false): void => {
    if (!enabled) return

    if (!preserveChannels) setSelection(describeColor(next, allowAlpha))

    if (next === actual.source) setDraft(value)

    emit(next)
  }

  const edit = (next: string): void => {
    if (!enabled) return

    setDraft(next)

    const canonical = describeColor(next, allowAlpha).source

    if (canonical) {
      setSelection(describeColor(next, allowAlpha))

      emit(canonical)
    }
  }

  const change = (patch: Partial<LumenHSVA>): void => {
    if (!hsva || !enabled) return

    const candidate = { ...hsva, ...patch }
    const rgba = lumenHSVAToRGBA(candidate)
    const source = rgba ? formatLumenColor(rgba, allowAlpha) : null

    if (!source) return

    setSelection({ source, color: rgba, hsva: candidate })

    select(source, true)
  }

  return { draft,
    invalid: describeColor(draft, allowAlpha).source === null,
    color: actual.color,
    hsva,
    select,
    edit,
    change }
}

const ColorChannels = ({ hsva, enabled, labels, allowAlpha, change }: {
  hsva: LumenHSVA | null
  enabled: boolean
  labels: LumenColorPickerLabels
  allowAlpha: boolean
  change: (patch: Partial<LumenHSVA>) => void
}): ReactElement | null => {
  if (!hsva) return null

  return (
    <>
      <LumenSlider
        label={labels.hue}
        value={hsva.hue}
        min={0}
        max={360}
        step={1}
        enabled={enabled}
        onValueChange={hue => {
          change({ hue })
        }}
      />
      <LumenSlider
        label={labels.saturation}
        value={hsva.saturation * 100}
        min={0}
        max={100}
        step={1}
        enabled={enabled}
        onValueChange={saturation => {
          change({ saturation: saturation / 100 })
        }}
      />
      <LumenSlider
        label={labels.brightness}
        value={hsva.value * 100}
        min={0}
        max={100}
        step={1}
        enabled={enabled}
        onValueChange={brightness => {
          change({ value: brightness / 100 })
        }}
      />
      {allowAlpha && (
        <LumenSlider
          label={labels.alpha}
          value={hsva.alpha * 100}
          min={0}
          max={100}
          step={1}
          enabled={enabled}
          onValueChange={alpha => {
            change({ alpha: alpha / 100 })
          }}
        />
      )}
    </>
  )
}

const ColorPreview = ({ color, value, label }: { color: LumenRGBA | null, value: string, label: string }) => {
  const theme = useLumenTheme()

  if (!color) return null

  return (
    <View
      accessibilityRole="image"
      accessible
      accessibilityLabel={label}
      accessibilityValue={{ text: value }}
      style={{ width: 64,
        height: 44,
        borderWidth: 1,
        borderColor: theme.colors.line,
        borderRadius: theme.radii.sm,
        backgroundColor: `rgba(${color.red},${color.green},${color.blue},${color.alpha})` }}
    />
  )
}

const ColorPalette = ({ options, value, enabled, allowAlpha, label, select }: {
  options: readonly LumenColorSwatch[]
  value: string | null
  enabled: boolean
  allowAlpha: boolean
  label: string
  select: (value: string) => void
}): ReactElement | null => {
  const theme = useLumenTheme()
  const usedIds = new Set<string>()

  const swatches = options.flatMap(option => {
    const canonical = describeColor(option.value, allowAlpha).source

    if (!canonical || usedIds.has(option.id)) return []

    usedIds.add(option.id)

    return [{ ...option, canonical }]
  })

  if (!swatches.length) return null

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}
    >
      {swatches.map(option => (
        <Pressable
          key={option.id}
          accessibilityRole="radio"
          accessibilityLabel={option.label}
          disabled={!enabled || option.disabled}
          accessibilityState={{ disabled: !enabled || option.disabled, selected: value === option.canonical }}
          onPress={() => {
            if (!option.disabled) select(option.canonical)
          }}
          style={{ opacity: !enabled || option.disabled ? 0.5 : 1,
            minWidth: 44,
            minHeight: 44,
            borderWidth: value === option.canonical ? 3 : 1,
            borderColor: theme.colors.ink,
            borderRadius: theme.radii.sm,
            backgroundColor: option.canonical }}
        />
      ))}
    </View>
  )
}

export const LumenColorPicker = ({
  label, value, onValueChange, allowAlpha = false, disabled = false, readOnly = false,
  palette = emptyPalette, labels, style, ...props
}: LumenColorPickerProps): ReactElement => {
  const theme = useLumenTheme()
  const text = { ...defaultLabels, ...labels }
  const enabled = !disabled && !readOnly
  const state = useColorPicker(value, allowAlpha, enabled, onValueChange)
  const canonicalValue = describeColor(value, allowAlpha).source

  return (
    <View {...props} style={[{ gap: theme.spacing.sm }, style]} accessibilityLabel={label}>
      <LumenText>{label}</LumenText>
      <ColorPreview color={state.color} value={value} label={text.preview} />
      <LumenTextField
        accessibilityLabel={text.field}
        value={state.draft}
        onChangeText={state.edit}
        editable={enabled}
        autoCapitalize="none"
        autoCorrect={false}
        error={state.invalid}
      />
      {state.invalid && <LumenText accessibilityRole="alert" tone="danger">{text.invalid}</LumenText>}
      <ColorChannels hsva={state.hsva} enabled={enabled} labels={text} allowAlpha={allowAlpha} change={state.change} />
      <ColorPalette
        options={palette}
        value={canonicalValue}
        enabled={enabled}
        allowAlpha={allowAlpha}
        label={label}
        select={state.select}
      />
    </View>
  )
}
