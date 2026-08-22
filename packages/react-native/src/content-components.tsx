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

import { resolveLumenDisclosureState, resolveLumenSkeletonHeight } from './content-recipes.js'
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
