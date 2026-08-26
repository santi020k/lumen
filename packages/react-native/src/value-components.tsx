import {
  type ReactElement,
  type ReactNode,
  type Ref,
  useState
} from 'react'
import {
  type AccessibilityActionEvent,
  type HostInstance,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type NativeTouchEvent,
  Pressable,
  Text,
  type TextStyle,
  View,
  type ViewProps
} from 'react-native'
import { Circle, Svg } from 'react-native-svg'

import { LumenIcon } from './primitives.js'
import { resolveLumenProgressValue } from './shared-recipes.js'
import {
  type LumenMetricTone,
  resolveLumenMetricColor
} from './structured-recipes.js'
import { useLumenTheme } from './theme-context.js'
import {
  resolveLumenSliderPosition,
  resolveLumenSliderValue,
  stepLumenSliderValue
} from './value-recipes.js'

export interface LumenPickerOption<Value extends number | string> {
  disabled?: boolean
  label: string
  value: Value
}

export interface LumenPickerProps<Value extends number | string> extends Omit<ViewProps, 'children'> {
  enabled?: boolean
  label: string
  onValueChange: (value: Value) => void
  options: readonly LumenPickerOption<Value>[]
  ref?: Ref<HostInstance>
  value: Value
}

const resolveControlOpacity = (enabled: boolean, pressed: boolean): number => {
  if (!enabled) return 0.5

  return pressed ? 0.82 : 1
}

export const LumenPicker = <Value extends number | string,>({
  enabled = true,
  label,
  onValueChange,
  options,
  ref,
  style,
  value,
  ...props
}: LumenPickerProps<Value>): ReactElement => {
  const theme = useLumenTheme()
  const [expanded, setExpanded] = useState(false)
  const selected = options.find(option => option.value === value)
  const selectedLabel = selected?.label ?? String(value)
  const menuVisible = enabled && expanded

  return (
    <View ref={ref} {...props} style={[{ gap: theme.spacing.xs }, style]}>
      <Text
        style={{
          color: theme.colors.ink,
          fontSize: theme.fontSizes.sm,
          fontWeight: String(theme.fontWeights.semibold) as TextStyle['fontWeight']
        }}
      >
        {label}
      </Text>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="combobox"
        accessibilityState={{ disabled: !enabled, expanded: menuVisible }}
        accessibilityValue={{ text: selectedLabel }}
        disabled={!enabled}
        onPress={() => {
          setExpanded(current => !current)
        }}
        style={({ pressed }) => ({
          alignItems: 'center',
          backgroundColor: theme.colors.surface,
          borderColor: menuVisible ? theme.colors.brand : theme.colors.line,
          borderRadius: theme.radii.md,
          borderWidth: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
          minHeight: 44,
          opacity: resolveControlOpacity(enabled, pressed),
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm
        })}
      >
        <Text style={{ color: theme.colors.ink, fontSize: theme.fontSizes.sm }}>{selectedLabel}</Text>
        <LumenIcon
          color={theme.colors.inkMuted}
          decorative
          name={menuVisible ? 'chevron-up' : 'chevron-down'}
          size="sm"
        />
      </Pressable>
      {menuVisible ?
        (
          <View
            accessibilityLabel={`${label} options`}
            accessibilityRole="menu"
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.line,
              borderRadius: theme.radii.md,
              borderWidth: 1,
              overflow: 'hidden'
            }}
          >
            {options.map(option => {
              const optionDisabled = option.disabled ?? false
              const optionSelected = option.value === value

              return (
                <Pressable
                  accessibilityRole="menuitem"
                  accessibilityState={{ disabled: optionDisabled, selected: optionSelected }}
                  disabled={optionDisabled}
                  key={`${typeof option.value}:${String(option.value)}`}
                  onPress={() => {
                    onValueChange(option.value)

                    setExpanded(false)
                  }}
                  style={({ pressed }) => ({
                    backgroundColor: optionSelected ? theme.colors.brandSoft : theme.colors.surface,
                    minHeight: 44,
                    opacity: resolveControlOpacity(!optionDisabled, pressed),
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm
                  })}
                >
                  <Text style={{ color: theme.colors.ink, fontSize: theme.fontSizes.sm }}>
                    {option.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        ) :
        null}
    </View>
  )
}

export interface LumenSliderProps extends Omit<ViewProps, 'children'> {
  enabled?: boolean
  label: string
  max?: number
  min?: number
  onValueChange: (value: number) => void
  ref?: Ref<HostInstance>
  step?: number
  value: number
  valueLabel?: string
}

export const LumenSlider = ({
  enabled = true,
  label,
  max = 100,
  min = 0,
  onValueChange,
  ref,
  step,
  style,
  value,
  valueLabel,
  ...props
}: LumenSliderProps): ReactElement => {
  const theme = useLumenTheme()
  const [trackWidth, setTrackWidth] = useState(0)
  const resolved = resolveLumenSliderValue(value, min, max, step)
  const formattedValue = valueLabel ?? String(resolved.value)

  const updateFromTouch = (event: NativeSyntheticEvent<NativeTouchEvent>): void => {
    if (!enabled) return

    onValueChange(resolveLumenSliderPosition(event.nativeEvent.locationX, trackWidth, resolved))
  }

  const handleAccessibilityAction = (event: AccessibilityActionEvent): void => {
    if (!enabled) return

    const action = event.nativeEvent.actionName

    if (action === 'increment' || action === 'decrement') {
      onValueChange(stepLumenSliderValue(resolved, action))
    }
  }

  const handleLayout = (event: LayoutChangeEvent): void => {
    setTrackWidth(event.nativeEvent.layout.width)
  }

  return (
    <View ref={ref} {...props} style={[{ gap: theme.spacing.sm }, style]}>
      <View style={{ alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text
          style={{
            color: theme.colors.ink,
            fontSize: theme.fontSizes.sm,
            fontWeight: String(theme.fontWeights.semibold) as TextStyle['fontWeight']
          }}
        >
          {label}
        </Text>
        <Text style={{ color: theme.colors.inkMuted, fontSize: theme.fontSizes.xs }}>
          {formattedValue}
        </Text>
      </View>
      <View
        accessibilityActions={[{ name: 'decrement' }, { name: 'increment' }]}
        accessibilityLabel={label}
        accessibilityRole="adjustable"
        accessibilityState={{ disabled: !enabled }}
        accessibilityValue={{
          max: resolved.max,
          min: resolved.min,
          now: resolved.value,
          text: formattedValue
        }}
        onAccessibilityAction={handleAccessibilityAction}
        onLayout={handleLayout}
        onMoveShouldSetResponder={() => enabled}
        onResponderGrant={updateFromTouch}
        onResponderMove={updateFromTouch}
        onStartShouldSetResponder={() => enabled}
        style={{
          height: 44,
          justifyContent: 'center',
          opacity: enabled ? 1 : 0.5
        }}
      >
        <View
          importantForAccessibility="no-hide-descendants"
          style={{
            backgroundColor: theme.colors.surfaceStrong,
            borderRadius: theme.radii.full,
            height: 6,
            overflow: 'visible'
          }}
        >
          <View
            style={{
              backgroundColor: theme.colors.brandSolid,
              borderRadius: theme.radii.full,
              height: 6,
              width: `${resolved.percentage}%`
            }}
          />
          <View
            style={{
              backgroundColor: theme.colors.brandSolid,
              borderColor: theme.colors.surface,
              borderRadius: 10,
              borderWidth: 2,
              height: 20,
              left: `${resolved.percentage}%`,
              marginLeft: -10,
              position: 'absolute',
              top: -7,
              width: 20
            }}
          />
        </View>
      </View>
    </View>
  )
}

export interface LumenGaugeProps extends Omit<ViewProps, 'children'> {
  center?: ReactNode
  label: string
  max?: number
  ref?: Ref<HostInstance>
  tone?: LumenMetricTone
  value: number
  valueLabel: string
}

export const LumenGauge = ({
  center,
  label,
  max = 100,
  ref,
  style,
  tone = 'brand',
  value,
  valueLabel,
  ...props
}: LumenGaugeProps): ReactElement => {
  const theme = useLumenTheme()
  const progress = resolveLumenProgressValue(value, max)
  const circumference = 2 * Math.PI * 44
  const strokeDashoffset = circumference * (1 - progress.percentage / 100)

  return (
    <View
      ref={ref}
      {...props}
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      accessibilityValue={{ max: progress.max, min: 0, now: progress.value, text: valueLabel }}
      style={[{ alignItems: 'center', gap: theme.spacing.sm }, style]}
    >
      <View
        importantForAccessibility="no-hide-descendants"
        style={{ alignItems: 'center', height: 108, justifyContent: 'center', width: 108 }}
      >
        <Svg height={108} style={{ position: 'absolute' }} viewBox="0 0 108 108" width={108}>
          <Circle
            cx={54}
            cy={54}
            fill="none"
            r={44}
            stroke={theme.colors.surfaceStrong}
            strokeWidth={10}
          />
          <Circle
            cx={54}
            cy={54}
            fill="none"
            r={44}
            stroke={resolveLumenMetricColor(theme.colors, tone)}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            strokeWidth={10}
            transform="rotate(-90 54 54)"
          />
        </Svg>
        {center ?? (
          <Text
            style={{
              color: theme.colors.ink,
              fontSize: theme.fontSizes.sm,
              fontWeight: String(theme.fontWeights.semibold) as TextStyle['fontWeight']
            }}
          >
            {valueLabel}
          </Text>
        )}
      </View>
      <Text
        style={{
          color: theme.colors.inkSoft,
          fontSize: theme.fontSizes.xs,
          fontWeight: String(theme.fontWeights.semibold) as TextStyle['fontWeight']
        }}
      >
        {label}
      </Text>
    </View>
  )
}
