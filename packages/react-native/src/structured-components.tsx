import {
  type ReactElement,
  type ReactNode,
  type Ref
} from 'react'
import {
  type HostInstance,
  Pressable,
  Text,
  type TextStyle,
  View,
  type ViewProps
} from 'react-native'

import { LumenBadge } from './primitives.js'
import {
  type LumenBannerVariant,
  type LumenMetricTone,
  resolveLumenBannerColors,
  resolveLumenMetricColor
} from './structured-recipes.js'
import { useLumenTheme } from './theme-context.js'

export interface LumenEmptyStateProps extends ViewProps {
  actions?: ReactNode
  children?: ReactNode
  description?: string
  graphic?: ReactNode
  ref?: Ref<HostInstance>
  title: string
}

export const LumenEmptyState = ({
  actions,
  children,
  description,
  graphic,
  ref,
  style,
  title,
  ...props
}: LumenEmptyStateProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <View
      ref={ref}
      {...props}
      accessibilityRole="summary"
      style={[
        {
          alignItems: 'center',
          gap: theme.spacing.lg,
          justifyContent: 'center',
          maxWidth: 440,
          padding: theme.spacing.xl,
          width: '100%'
        },
        style
      ]}
    >
      {graphic ?
        (
          <View
            style={{
              alignItems: 'center',
              backgroundColor: theme.colors.surfaceMuted,
              borderRadius: theme.radii.full,
              height: 56,
              justifyContent: 'center',
              width: 56
            }}
          >
            {graphic}
          </View>
        ) :
        null}
      <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
        <Text
          style={{
            color: theme.colors.ink,
            fontSize: theme.fontSizes.lg,
            fontWeight: String(theme.fontWeights.semibold) as TextStyle['fontWeight'],
            textAlign: 'center'
          }}
        >
          {title}
        </Text>
        {description ?
          (
            <Text
              style={{
                color: theme.colors.inkMuted,
                fontSize: theme.fontSizes.sm,
                lineHeight: 20,
                textAlign: 'center'
              }}
            >
              {description}
            </Text>
          ) :
          null}
        {children}
      </View>
      {actions ? <View style={{ alignItems: 'center' }}>{actions}</View> : null}
    </View>
  )
}

export interface LumenListRowProps extends ViewProps {
  children: ReactNode
  leading?: ReactNode
  ref?: Ref<HostInstance>
  trailing?: ReactNode
}

export const LumenListRow = ({
  children,
  leading,
  ref,
  style,
  trailing,
  ...props
}: LumenListRowProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <View
      ref={ref}
      {...props}
      style={[
        {
          alignItems: 'center',
          flexDirection: 'row',
          gap: theme.spacing.md,
          minHeight: 56,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md
        },
        style
      ]}
    >
      {leading ? <View>{leading}</View> : null}
      <View style={{ flex: 1 }}>{children}</View>
      {trailing ? <View>{trailing}</View> : null}
    </View>
  )
}

export interface LumenBannerProps extends ViewProps {
  actions?: ReactNode
  description?: string
  dismissLabel?: string
  graphic?: ReactNode
  onDismiss?: () => void
  ref?: Ref<HostInstance>
  title: string
  variant?: LumenBannerVariant
}

export const LumenBanner = ({
  actions,
  description,
  dismissLabel = 'Dismiss',
  graphic,
  onDismiss,
  ref,
  style,
  title,
  variant = 'default',
  ...props
}: LumenBannerProps): ReactElement => {
  const theme = useLumenTheme()
  const colors = resolveLumenBannerColors(theme.colors, variant)

  return (
    <View
      ref={ref}
      {...props}
      style={[
        {
          alignItems: 'center',
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          borderLeftColor: colors.accentColor,
          borderLeftWidth: 3,
          borderRadius: theme.radii.md,
          borderWidth: 1,
          flexDirection: 'row',
          gap: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md
        },
        style
      ]}
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
          (
            <Text style={{ color: theme.colors.inkSoft, fontSize: theme.fontSizes.xs }}>
              {description}
            </Text>
          ) :
          null}
      </View>
      {actions}
      {onDismiss ?
        (
          <Pressable
            accessibilityLabel={dismissLabel}
            accessibilityRole="button"
            hitSlop={8}
            onPress={onDismiss}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, padding: theme.spacing.sm })}
          >
            <Text
              style={{
                color: colors.accentColor,
                fontSize: theme.fontSizes.xs,
                fontWeight: String(theme.fontWeights.semibold) as TextStyle['fontWeight']
              }}
            >
              {dismissLabel}
            </Text>
          </Pressable>
        ) :
        null}
    </View>
  )
}

export interface LumenStatProps extends ViewProps {
  detail?: string
  graphic?: ReactNode
  label: string
  ref?: Ref<HostInstance>
  tone?: LumenMetricTone
  value: string
}

export const LumenStat = ({
  detail,
  graphic,
  label,
  ref,
  style,
  tone = 'brand',
  value,
  ...props
}: LumenStatProps): ReactElement => {
  const theme = useLumenTheme()
  const accentColor = resolveLumenMetricColor(theme.colors, tone)
  const accessibilityLabel = [label, value, detail].filter(Boolean).join(', ')

  return (
    <View
      ref={ref}
      {...props}
      accessible
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          backgroundColor: `${accentColor}0F`,
          borderColor: `${accentColor}2E`,
          borderRadius: theme.radii.md,
          borderWidth: 1,
          gap: theme.spacing.sm,
          padding: theme.spacing.lg
        },
        style
      ]}
    >
      {graphic}
      <Text
        style={{
          color: theme.colors.ink,
          fontSize: theme.fontSizes['2xl'],
          fontVariant: ['tabular-nums'],
          fontWeight: String(theme.fontWeights.bold) as TextStyle['fontWeight']
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          color: theme.colors.inkSoft,
          fontSize: theme.fontSizes.xs,
          fontWeight: String(theme.fontWeights.semibold) as TextStyle['fontWeight']
        }}
      >
        {label}
      </Text>
      {detail ?
        <Text style={{ color: theme.colors.inkMuted, fontSize: theme.fontSizes.xs }}>{detail}</Text> :
        null}
    </View>
  )
}

export interface LumenSectionHeaderProps extends ViewProps {
  actions?: ReactNode
  count?: string
  ref?: Ref<HostInstance>
  subtitle?: string
  title: string
}

export const LumenSectionHeader = ({
  actions,
  count,
  ref,
  style,
  subtitle,
  title,
  ...props
}: LumenSectionHeaderProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <View
      ref={ref}
      {...props}
      style={[
        { alignItems: 'flex-start', flexDirection: 'row', gap: theme.spacing.md },
        style
      ]}
    >
      <View style={{ flex: 1, gap: theme.spacing.xs }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm }}>
          <Text
            accessibilityRole="header"
            style={{
              color: theme.colors.ink,
              fontSize: theme.fontSizes.md,
              fontWeight: String(theme.fontWeights.semibold) as TextStyle['fontWeight']
            }}
          >
            {title}
          </Text>
          {count ? <LumenBadge>{count}</LumenBadge> : null}
        </View>
        {subtitle ?
          <Text style={{ color: theme.colors.inkMuted, fontSize: theme.fontSizes.xs }}>{subtitle}</Text> :
          null}
      </View>
      {actions}
    </View>
  )
}

export interface LumenStatusBarProps extends ViewProps {
  message: string
  ref?: Ref<HostInstance>
  tone?: LumenMetricTone
  trailing?: ReactNode
}

export const LumenStatusBar = ({
  message,
  ref,
  style,
  tone = 'neutral',
  trailing,
  ...props
}: LumenStatusBarProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <View
      ref={ref}
      {...props}
      style={[
        {
          alignItems: 'center',
          backgroundColor: theme.colors.surfaceMuted,
          flexDirection: 'row',
          gap: theme.spacing.sm,
          minHeight: 36,
          paddingHorizontal: theme.spacing.lg
        },
        style
      ]}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={{
          backgroundColor: resolveLumenMetricColor(theme.colors, tone),
          borderRadius: theme.radii.full,
          height: 7,
          width: 7
        }}
      />
      <Text numberOfLines={1} style={{ color: theme.colors.inkSoft, flex: 1, fontSize: theme.fontSizes.xs }}>
        {message}
      </Text>
      {trailing}
    </View>
  )
}
