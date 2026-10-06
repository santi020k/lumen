import { type ReactNode, useRef, useState } from 'react'
import { type GestureResponderEvent, ScrollView, View, type ViewProps } from 'react-native'

import { formatLumenMediaZoom, lumenMediaViewportActions, type LumenMediaViewportLabels, lumenMediaViewportLabels } from '@santi020k/lumen-core/media-viewport'
import { applyLumenMediaViewportAction, formatLumenMediaThumbnailState, type LumenMediaViewportValue, normalizeLumenMediaViewport, panLumenMediaViewport, resolveLumenMediaOrder } from '@santi020k/lumen-core/media-workspace'

import { LumenButton, LumenText } from './foundation-primitives.js'
import { useLumenTheme } from './theme-context.js'

export interface LumenMediaThumbnailProps extends Omit<ViewProps, 'children'> {
  children: ReactNode
  disabled?: boolean
  label: string
  onSelectionChange: (selected: boolean) => void
  order?: number
  selected: boolean
  state?: 'ready' | 'loading' | 'error'
  stateLabel?: string
}

export const LumenMediaThumbnail = ({
  children, disabled, label, onSelectionChange, order, selected, state = 'ready', stateLabel, style,
  ...props
}: LumenMediaThumbnailProps) => {
  const theme = useLumenTheme()
  const position = resolveLumenMediaOrder(order)

  return (
    <View {...props} style={style}>
      <LumenButton
        intent="secondary"
        disabled={disabled === true || state !== 'ready'}
        loading={state === 'loading'}
        accessibilityLabel={label}
        accessibilityState={{ selected, busy: state === 'loading' }}
        onPress={() => {
          if (disabled !== true && state === 'ready') onSelectionChange(!selected)
        }}
        style={{ borderColor: selected ? theme.colors.brand : theme.colors.line, borderWidth: selected ? 2 : 1 }}
      >
        <View style={{ gap: theme.spacing.xs, minWidth: 0 }}>
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ aspectRatio: 1, overflow: 'hidden' }}>{children}</View>
          <LumenText>{`${selected ? '✓ ' : ''}${label}`}</LumenText>
          {position !== undefined && <LumenText>{position}</LumenText>}
          {state !== 'ready' && <LumenText>{formatLumenMediaThumbnailState(state, stateLabel)}</LumenText>}
        </View>
      </LumenButton>
    </View>
  )
}

export interface LumenMediaFilmstripProps extends ViewProps {
  label: string
  selectionLabel: string
}

export const LumenMediaFilmstrip = ({
  children, label, selectionLabel, style, ...props
}: LumenMediaFilmstripProps) => {
  const theme = useLumenTheme()

  return (
    <View {...props} style={[{ gap: theme.spacing.sm }, style]}>
      <LumenText>{label}</LumenText>
      <LumenText accessibilityLiveRegion="polite">{selectionLabel}</LumenText>
      <ScrollView horizontal contentContainerStyle={{ gap: theme.spacing.sm, padding: theme.spacing.xs }}>
        {children}
      </ScrollView>
    </View>
  )
}

export interface LumenMediaViewportProps extends ViewProps {
  disabled?: boolean
  label: string
  labels?: Partial<LumenMediaViewportLabels>
  locale?: string
  maxZoom?: number
  onValueChange: (value: LumenMediaViewportValue) => void
  ratio?: number
  value: LumenMediaViewportValue
}

const touchDistance = (event: GestureResponderEvent): number | undefined => {
  const [first, second] = event.nativeEvent.touches

  if (!first || !second) return undefined

  const distance = Math.hypot(second.pageX - first.pageX, second.pageY - first.pageY)

  return distance > 0 && Number.isFinite(distance) ? distance : undefined
}

export const LumenMediaViewport = ({
  children, disabled = false, label, labels, locale, maxZoom = 4, onValueChange, ratio = 16 / 9,
  style, value, ...props
}: LumenMediaViewportProps) => {
  const theme = useLumenTheme()
  const current = normalizeLumenMediaViewport(value, maxZoom)
  const copy = { ...lumenMediaViewportLabels, ...labels }
  const [size, setSize] = useState({ width: 0, height: 0 })

  const gestureRef = useRef<{
    value: LumenMediaViewportValue
    x: number
    y: number
    distance: number | undefined
  } | undefined>(undefined)

  const safeRatio = Number.isFinite(ratio) && ratio >= 0.1 && ratio <= 10 ? ratio : 16 / 9

  const startGesture = (event: GestureResponderEvent) => {
    gestureRef.current = {
      value: current, x: event.nativeEvent.pageX, y: event.nativeEvent.pageY, distance: touchDistance(event)
    }
  }

  const moveGesture = (event: GestureResponderEvent) => {
    if (disabled) return

    const start = gestureRef.current

    if (!start) return

    const distance = touchDistance(event)

    if (distance !== undefined) {
      if (start.distance === undefined) {
        startGesture(event)

        return
      }

      onValueChange(normalizeLumenMediaViewport({
        ...start.value, zoom: start.value.zoom * distance / start.distance
      }, maxZoom))

      return
    }

    onValueChange(panLumenMediaViewport(
      start.value,
      event.nativeEvent.pageX - start.x,
      event.nativeEvent.pageY - start.y,
      size.width,
      size.height,
      maxZoom
    ))
  }

  return (
    <View {...props} style={[{ gap: theme.spacing.sm }, style]}>
      <View
        accessibilityLabel={label}
        onLayout={event => {
          setSize(event.nativeEvent.layout)
        }}
        onMoveShouldSetResponder={event => (
          !disabled && (current.zoom > 1 || event.nativeEvent.touches.length > 1)
        )}
        onResponderGrant={startGesture}
        onResponderMove={moveGesture}
        onResponderRelease={() => {
          gestureRef.current = undefined
        }}
        onResponderTerminate={() => {
          gestureRef.current = undefined
        }}
        onResponderTerminationRequest={() => true}
        style={{ width: '100%', aspectRatio: safeRatio, overflow: 'hidden', backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radii.lg }}
      >
        <View style={{ width: '100%',
          height: '100%',
          transform: [
            { translateX: current.x * (current.zoom - 1) * size.width / 2 },
            { translateY: current.y * (current.zoom - 1) * size.height / 2 },
            { scale: current.zoom }
          ] }}
        >
          {children}
        </View>
      </View>
      <LumenText>{label}</LumenText>
      <LumenText accessibilityLiveRegion="polite">{formatLumenMediaZoom(current.zoom, locale)}</LumenText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        {lumenMediaViewportActions.map(action => {
          const next = applyLumenMediaViewportAction(current, action, maxZoom)
          const unchanged = next.zoom === current.zoom && next.x === current.x && next.y === current.y

          return (
            <LumenButton
              key={action}
              intent="secondary"
              disabled={disabled || unchanged}
              onPress={() => {
                onValueChange(next)
              }}
            >
              {copy[action]}
            </LumenButton>
          )
        })}
      </View>
    </View>
  )
}
