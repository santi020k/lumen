import { type ReactElement, type ReactNode, type Ref } from 'react'
import {
  type DimensionValue,
  type HostInstance,
  Pressable,
  Text,
  type TextStyle,
  View,
  type ViewProps
} from 'react-native'

import {
  type LumenBackdropIntensity,
  type LumenGraphicSize,
  type LumenIllustrationSize,
  resolveLumenBackdropOpacity,
  resolveLumenDisclosureState,
  resolveLumenGraphicSize,
  resolveLumenIllustrationSize,
  resolveLumenSkeletonHeight } from './content-recipes.js'
import { resolveLumenButtonOpacity } from './recipes.js'
import { useLumenTheme } from './theme-context.js'

export type LumenSkeletonShape = 'circle' | 'rectangle' | 'text'

export interface LumenSkeletonProps extends Omit<ViewProps, 'children'> {
  height?: number
  label?: string
  ref?: Ref<HostInstance>
  shape?: LumenSkeletonShape
  width?: DimensionValue
}

export const LumenSkeleton = ({
  height = 16,
  label,
  ref,
  shape = 'text',
  style,
  width,
  ...props
}: LumenSkeletonProps): ReactElement => {
  const theme = useLumenTheme()
  const safeHeight = resolveLumenSkeletonHeight(height)
  const resolvedWidth = width ?? (shape === 'circle' ? safeHeight : '100%')
  let borderRadius: number = theme.radii.md

  if (shape === 'circle') borderRadius = safeHeight / 2

  if (shape === 'text') borderRadius = theme.radii.sm

  return (
    <View
      ref={ref}
      {...props}
      accessibilityElementsHidden={!label}
      accessibilityLabel={label}
      accessibilityRole={label ? 'progressbar' : undefined}
      aria-busy={label ? true : undefined}
      importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
      style={[
        {
          backgroundColor: theme.colors.surfaceStrong,
          borderRadius,
          height: safeHeight,
          opacity: 0.72,
          width: resolvedWidth
        },
        style
      ]}
    />
  )
}

export type LumenGraphicTone = 'accent' | 'brand' | 'neutral'
export type LumenGraphicVariant = 'glow' | 'grid' | 'orbit'

export interface LumenGraphicProps extends ViewProps {
  children?: ReactNode
  label?: string
  ref?: Ref<HostInstance>
  size?: LumenGraphicSize
  tone?: LumenGraphicTone
  variant?: LumenGraphicVariant
}

const graphicLines = Array.from({ length: 7 }, (_, index) => index)
const backdropDots = Array.from({ length: 48 }, (_, index) => index)

export const LumenGraphic = ({
  children,
  label,
  ref,
  size = 'md',
  style,
  tone = 'brand',
  variant = 'orbit',
  ...props
}: LumenGraphicProps): ReactElement => {
  const theme = useLumenTheme()
  const dimension = resolveLumenGraphicSize(size)

  const color = {
    accent: theme.colors.accent,
    brand: theme.colors.brand,
    neutral: theme.colors.inkMuted
  }[tone]

  return (
    <View
      ref={ref}
      {...props}
      accessible={Boolean(label)}
      accessibilityElementsHidden={!label}
      accessibilityLabel={label}
      accessibilityRole={label ? 'image' : undefined}
      importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
      style={[
        {
          alignItems: 'center',
          height: dimension,
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          width: dimension
        },
        style
      ]}
    >
      {variant === 'glow' ?
        <View style={{ backgroundColor: color, borderRadius: dimension / 2, height: '72%', opacity: 0.18, width: '72%' }} /> :
        null}
      {variant === 'grid' ?
        (
          <View style={{ height: '76%', opacity: 0.18, position: 'absolute', width: '76%' }}>
            {graphicLines.map(index => (
              <View
                key={`horizontal-${index}`}
                style={{ backgroundColor: color, height: 1, left: 0, position: 'absolute', right: 0, top: `${index * 16.66}%` }}
              />
            ))}
            {graphicLines.map(index => (
              <View
                key={`vertical-${index}`}
                style={{ backgroundColor: color, bottom: 0, left: `${index * 16.66}%`, position: 'absolute', top: 0, width: 1 }}
              />
            ))}
          </View>
        ) :
        null}
      {variant === 'orbit' ?
        (
          <>
            {[0.9, 0.62, 0.34].map(ratio => (
              <View
                key={ratio}
                style={{
                  borderColor: color,
                  borderRadius: dimension,
                  borderWidth: 1,
                  height: dimension * ratio,
                  opacity: 0.24,
                  position: 'absolute',
                  width: dimension * ratio
                }}
              />
            ))}
            <View style={{ backgroundColor: color, height: 1, opacity: 0.18, position: 'absolute', width: '72%' }} />
            <View style={{ backgroundColor: color, height: '72%', opacity: 0.18, position: 'absolute', width: 1 }} />
          </>
        ) :
        null}
      <View style={{ alignItems: 'center', justifyContent: 'center', position: 'absolute' }}>
        {children}
      </View>
    </View>
  )
}

export type LumenBackdropTone = 'accent' | 'brand' | 'neutral'
export type LumenBackdropVariant = 'aurora' | 'dots' | 'grid' | 'rays'

export interface LumenBackdropProps extends ViewProps {
  children?: ReactNode
  intensity?: LumenBackdropIntensity
  ref?: Ref<HostInstance>
  tone?: LumenBackdropTone
  variant?: LumenBackdropVariant
}

export const LumenBackdrop = ({
  children,
  intensity = 'medium',
  ref,
  style,
  tone = 'brand',
  variant = 'aurora',
  ...props
}: LumenBackdropProps): ReactElement => {
  const theme = useLumenTheme()
  const color = { accent: theme.colors.accent, brand: theme.colors.brand, neutral: theme.colors.inkMuted }[tone]
  const secondaryColor = tone === 'neutral' ? theme.colors.surfaceStrong : theme.colors.accent
  const opacity = resolveLumenBackdropOpacity(intensity)

  return (
    <View ref={ref} {...props} style={[{ minHeight: 160, overflow: 'hidden', position: 'relative' }, style]}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={{ bottom: 0, left: 0, opacity, position: 'absolute', right: 0, top: 0 }}
      >
        {variant === 'aurora' ?
          (
            <>
              <View style={{ backgroundColor: color, borderRadius: 140, height: 280, left: -70, opacity: 0.22, position: 'absolute', top: -100, width: 280 }} />
              <View style={{ backgroundColor: secondaryColor, borderRadius: 120, bottom: -110, height: 240, opacity: 0.18, position: 'absolute', right: -50, width: 240 }} />
            </>
          ) :
          null}
        {variant === 'grid' ?
          (
            <>
              {graphicLines.map(index => (
                <View key={`backdrop-horizontal-${index}`} style={{ backgroundColor: color, height: 1, left: 0, opacity: 0.18, position: 'absolute', right: 0, top: `${index * 16.66}%` }} />
              ))}
              {graphicLines.map(index => (
                <View key={`backdrop-vertical-${index}`} style={{ backgroundColor: color, bottom: 0, left: `${index * 16.66}%`, opacity: 0.18, position: 'absolute', top: 0, width: 1 }} />
              ))}
            </>
          ) :
          null}
        {variant === 'dots' ?
          backdropDots.map(index => (
            <View
              key={`backdrop-dot-${index}`}
              style={{
                backgroundColor: color,
                borderRadius: 2,
                height: 3,
                left: `${(index % 8) * 14 + 1}%`,
                opacity: 0.28,
                position: 'absolute',
                top: `${Math.floor(index / 8) * 19 + 2}%`,
                width: 3
              }}
            />
          )) :
          null}
        {variant === 'rays' ?
          graphicLines.map(index => (
            <View
              key={`backdrop-ray-${index}`}
              style={{
                backgroundColor: color,
                height: 1,
                left: '50%',
                opacity: 0.2,
                position: 'absolute',
                top: '50%',
                transform: [{ rotate: `${index * 24 - 72}deg` }, { translateX: -240 }],
                width: 480
              }}
            />
          )) :
          null}
      </View>
      <View style={{ zIndex: 1 }}>{children}</View>
    </View>
  )
}

export type LumenIllustrationTone = 'accent' | 'auto' | 'brand' | 'neutral'
export type LumenIllustrationVariant = 'empty' | 'error' | 'offline' | 'success'

export interface LumenIllustrationProps extends ViewProps {
  label?: string
  ref?: Ref<HostInstance>
  size?: LumenIllustrationSize
  tone?: LumenIllustrationTone
  variant?: LumenIllustrationVariant
}

interface LumenIllustrationArtworkProps {
  color: string
  dimension: number
  strokeWidth: number
  variant: LumenIllustrationVariant
}

const LumenIllustrationArtwork = ({
  color,
  dimension,
  strokeWidth,
  variant
}: LumenIllustrationArtworkProps): ReactElement | null => {
  const line = (width: number, rotation: string, left: number, top: number): ReactElement => (
    <View
      style={{
        backgroundColor: color,
        borderRadius: strokeWidth,
        height: strokeWidth,
        left,
        position: 'absolute',
        top,
        transform: [{ rotate: rotation }],
        width
      }}
    />
  )

  if (variant === 'empty') {
    return (
      <View
        style={{
          borderColor: color,
          borderRadius: dimension * 0.08,
          borderWidth: strokeWidth,
          height: dimension * 0.34,
          marginTop: dimension * 0.14,
          width: dimension * 0.52
        }}
      >
        <View style={{ backgroundColor: color, height: strokeWidth, left: '18%', opacity: 0.7, position: 'absolute', top: '38%', width: '64%' }} />
      </View>
    )
  }

  if (variant === 'offline') {
    return (
      <View style={{ height: dimension * 0.52, position: 'relative', width: dimension * 0.64 }}>
        <View style={{ borderColor: color, borderRadius: dimension, borderWidth: strokeWidth, bottom: dimension * 0.08, height: dimension * 0.32, position: 'absolute', width: '100%' }} />
        {line(dimension * 0.72, '45deg', -dimension * 0.04, dimension * 0.24)}
      </View>
    )
  }

  return (
    <View style={{ borderColor: color, borderRadius: dimension, borderWidth: strokeWidth, height: dimension * 0.52, position: 'relative', width: dimension * 0.52 }}>
      {variant === 'success' ?
        (
          <>
            {line(dimension * 0.16, '45deg', dimension * 0.1, dimension * 0.25)}
            {line(dimension * 0.26, '-45deg', dimension * 0.19, dimension * 0.21)}
          </>
        ) :
        (
          <>
            {line(dimension * 0.28, '45deg', dimension * 0.11, dimension * 0.25)}
            {line(dimension * 0.28, '-45deg', dimension * 0.11, dimension * 0.25)}
          </>
        )}
    </View>
  )
}

export const LumenIllustration = ({
  label,
  ref,
  size = 'md',
  style,
  tone = 'auto',
  variant = 'empty',
  ...props
}: LumenIllustrationProps): ReactElement => {
  const theme = useLumenTheme()
  const dimension = resolveLumenIllustrationSize(size)

  const semanticColor = {
    empty: theme.colors.brand,
    error: theme.colors.danger,
    offline: theme.colors.inkMuted,
    success: theme.colors.success
  }[variant]

  const color = tone === 'auto' ?
    semanticColor :
    {
      accent: theme.colors.accent,
      brand: theme.colors.brand,
      neutral: theme.colors.inkMuted
    }[tone]

  const strokeWidth = Math.max(2, dimension / 48)

  return (
    <View
      ref={ref}
      {...props}
      accessible={Boolean(label)}
      accessibilityElementsHidden={!label}
      accessibilityLabel={label}
      accessibilityRole={label ? 'image' : undefined}
      importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
      style={[{ alignItems: 'center', height: dimension, justifyContent: 'center', position: 'relative', width: dimension }, style]}
    >
      <View style={{ backgroundColor: color, borderRadius: dimension, height: '82%', opacity: 0.1, position: 'absolute', width: '82%' }} />
      <LumenIllustrationArtwork color={color} dimension={dimension} strokeWidth={strokeWidth} variant={variant} />
    </View>
  )
}

export interface LumenDisclosureProps extends Omit<ViewProps, 'children'> {
  children: ReactNode
  description?: string
  disabled?: boolean
  expanded: boolean
  graphic?: ReactNode
  onExpandedChange: (expanded: boolean) => void
  ref?: Ref<HostInstance>
  title: string
}

export const LumenDisclosure = ({
  children,
  description,
  disabled = false,
  expanded,
  graphic,
  onExpandedChange,
  ref,
  style,
  title,
  ...props
}: LumenDisclosureProps): ReactElement => {
  const theme = useLumenTheme()
  const state = resolveLumenDisclosureState(expanded, disabled)

  return (
    <View
      ref={ref}
      {...props}
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.line,
          borderRadius: theme.radii.md,
          borderWidth: 1,
          overflow: 'hidden'
        },
        style
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded }}
        aria-disabled={disabled}
        aria-expanded={expanded}
        disabled={disabled}
        onPress={() => {
          onExpandedChange(!expanded)
        }}
        style={({ pressed }) => ({
          alignItems: 'center',
          flexDirection: 'row',
          gap: theme.spacing.md,
          minHeight: 48,
          opacity: state.opacity * resolveLumenButtonOpacity(disabled, pressed),
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md
        })}
      >
        {graphic ? <View>{graphic}</View> : null}
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <Text
            style={{
              color: theme.colors.ink,
              fontSize: theme.fontSizes.sm,
              fontWeight: String(theme.fontWeights.semibold) as TextStyle['fontWeight']
            }}
          >
            {title}
          </Text>
          {description ?
            <Text style={{ color: theme.colors.inkMuted, fontSize: theme.fontSizes.xs }}>{description}</Text> :
            null}
        </View>
        <Text
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ color: theme.colors.inkSoft, fontSize: theme.fontSizes.lg }}
        >
          {expanded ? '−' : '+'}
        </Text>
      </Pressable>
      {state.contentVisible ?
        (
          <View
            style={{
              borderTopColor: theme.colors.line,
              borderTopWidth: 1,
              padding: theme.spacing.lg
            }}
          >
            {children}
          </View>
        ) :
        null}
    </View>
  )
}
