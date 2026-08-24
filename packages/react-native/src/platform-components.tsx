import {
  type ComponentRef,
  type ReactElement,
  type ReactNode,
  type Ref,
  useEffect,
  useState
} from 'react'
import {
  Animated,
  Easing,
  type HostInstance,
  Pressable,
  RefreshControl,
  type RefreshControlProps,
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewProps,
  type ViewStyle
} from 'react-native'

import {
  type LumenNavigationBadge,
  type LumenRefreshIndicatorTone,
  type LumenResolvedNavigationBadge,
  resolveLumenNavigationAction,
  resolveLumenNavigationBadge,
  resolveLumenNavigationItemState,
  resolveLumenRefreshColors
} from './platform-recipes.js'
import { LumenIcon, type LumenIconGraphic } from './primitives.js'
import { useLumenTheme } from './theme-context.js'

export interface LumenNavigationItem {
  badge?: LumenNavigationBadge
  disabled?: boolean
  icon?: LumenIconGraphic
  label: string
  selectedIcon?: LumenIconGraphic
  value: string
}

export interface LumenNavigationBarProps extends Omit<ViewProps, 'children'> {
  accessibilityLabel?: string
  items: readonly LumenNavigationItem[]
  onReselect?: (value: string) => void
  onValueChange: (value: string) => void
  ref?: Ref<HostInstance>
  value: string
}

interface LumenNavigationItemIconProps {
  badge: LumenResolvedNavigationBadge | undefined
  color: string
  graphic: LumenIconGraphic | undefined
}

const LumenNavigationItemIcon = ({
  badge,
  color,
  graphic: Graphic
}: LumenNavigationItemIconProps): ReactElement | null => {
  const theme = useLumenTheme()

  if (!Graphic && !badge) return null

  return (
    <View style={{ minHeight: 24, minWidth: 24 }}>
      {Graphic ?
        (
          <LumenIcon color={color} decorative icon={Graphic} size="md" />
        ) :
        null}
      {badge ?
        (
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              alignItems: 'center',
              backgroundColor: theme.colors.danger,
              borderRadius: 999,
              justifyContent: 'center',
              minHeight: badge.displayValue ? 16 : 8,
              minWidth: badge.displayValue ? 16 : 8,
              maxWidth: badge.displayValue ? 40 : 8,
              paddingHorizontal: badge.displayValue ? 4 : 0,
              position: 'absolute',
              right: -8,
              top: -5
            }}
          >
            {badge.displayValue ?
              (
                <Text
                  numberOfLines={1}
                  style={{
                    color: theme.colors.onDanger,
                    fontSize: 10,
                    fontWeight: '700'
                  }}
                >
                  {badge.displayValue}
                </Text>
              ) :
              null}
          </View>
        ) :
        null}
    </View>
  )
}

interface LumenNavigationDestinationProps {
  item: LumenNavigationItem
  onReselect: ((value: string) => void) | undefined
  onValueChange: (value: string) => void
  value: string
}

const LumenNavigationDestination = ({
  item,
  onReselect,
  onValueChange,
  value
}: LumenNavigationDestinationProps): ReactElement => {
  const theme = useLumenTheme()

  const itemState = resolveLumenNavigationItemState(
    theme.colors,
    item.value,
    value,
    Boolean(item.disabled),
    false
  )

  const selected = itemState.selected
  const badge = resolveLumenNavigationBadge(item.badge)
  const graphic = selected && item.selectedIcon ? item.selectedIcon : item.icon

  return (
    <Pressable
      accessibilityLabel={item.label}
      accessibilityRole="tab"
      accessibilityState={{ disabled: item.disabled, selected }}
      accessibilityValue={badge ? { text: badge.accessibilityLabel } : undefined}
      disabled={item.disabled}
      onPress={() => {
        if (
          resolveLumenNavigationAction(
            item.value,
            value,
            Boolean(onReselect)
          ) === 'reselect'
        )
          onReselect?.(item.value)
        else onValueChange(item.value)
      }}
      style={({ pressed }) => ({
        alignItems: 'center',
        flex: 1,
        gap: theme.spacing.xs,
        justifyContent: 'center',
        minHeight: 64,
        opacity: resolveLumenNavigationItemState(
          theme.colors,
          item.value,
          value,
          Boolean(item.disabled),
          pressed
        ).opacity,
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: theme.spacing.sm
      })}
    >
      <LumenNavigationItemIcon
        badge={badge}
        color={itemState.color}
        graphic={graphic}
      />
      <Text
        numberOfLines={1}
        style={{
          color: itemState.color,
          fontSize: theme.fontSizes.xs,
          fontWeight: String(
            selected ? theme.fontWeights.semibold : theme.fontWeights.medium
          ) as TextStyle['fontWeight']
        }}
      >
        {item.label}
      </Text>
    </Pressable>
  )
}

/**
 * A controlled, token-aware destination bar for app-level navigation.
 * Screen routing and navigation history remain application-owned.
 */
export const LumenNavigationBar = ({
  accessibilityLabel = 'Primary navigation',
  items,
  onReselect,
  onValueChange,
  ref,
  style,
  value,
  ...props
}: LumenNavigationBarProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <View
      ref={ref}
      {...props}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="tablist"
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.line,
          borderTopWidth: 1,
          flexDirection: 'row',
          minHeight: 64,
          paddingHorizontal: theme.spacing.sm
        },
        style
      ]}
    >
      {items.map(item => (
        <LumenNavigationDestination
          item={item}
          key={item.value}
          onReselect={onReselect}
          onValueChange={onValueChange}
          value={value}
        />
      ))}
    </View>
  )
}

export interface LumenNavigationAccessoryProps extends Omit<ViewProps, 'children'> {
  children: ReactNode
}

/** A compact token-aware status or action surface placed above bottom navigation. */
export const LumenNavigationAccessory = ({
  children,
  style,
  ...props
}: LumenNavigationAccessoryProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <View
      {...props}
      style={[
        {
          alignItems: 'center',
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.line,
          borderTopWidth: 1,
          flexDirection: 'row',
          height: 48,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.sm
        },
        style
      ]}
    >
      {children}
    </View>
  )
}

export interface LumenCollapsibleNavigationBarProps extends LumenNavigationBarProps {
  accessory?: ReactNode
  containerStyle?: StyleProp<ViewStyle>
  visible: boolean
}

/** An animated, layout-collapsing wrapper around LumenNavigationBar. */
export const LumenCollapsibleNavigationBar = ({
  accessory,
  containerStyle,
  visible,
  ...props
}: LumenCollapsibleNavigationBarProps): ReactElement => {
  const theme = useLumenTheme()
  const [progress] = useState(() => new Animated.Value(visible ? 1 : 0))

  useEffect(() => {
    const animation = Animated.timing(progress, {
      duration: theme.durations.standard,
      easing: Easing.bezier(0.32, 0.72, 0, 1),
      toValue: visible ? 1 : 0,
      useNativeDriver: false
    })

    animation.start()

    return () => {
      animation.stop()
    }
  }, [progress, theme.durations.standard, visible])

  return (
    <Animated.View
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        containerStyle,
        {
          height: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, accessory ? 112 : 64]
          }),
          opacity: progress,
          overflow: 'hidden'
        }
      ]}
    >
      {accessory ?
        <LumenNavigationAccessory>{accessory}</LumenNavigationAccessory> :
        null}
      <LumenNavigationBar {...props} />
    </Animated.View>
  )
}

export interface LumenRefreshControlProps extends Omit<
  RefreshControlProps,
  | 'accessibilityLabel' |
  'colors' |
  'onRefresh' |
  'progressBackgroundColor' |
  'tintColor' |
  'titleColor'
> {
  accessibilityLabel: string
  indicatorTone?: LumenRefreshIndicatorTone
  onRefresh: NonNullable<RefreshControlProps['onRefresh']>
  ref?: Ref<ComponentRef<typeof RefreshControl>>
}

/**
 * A token-aware native pull-to-refresh indicator for React Native scroll containers.
 */
export const LumenRefreshControl = ({
  indicatorTone = 'brand',
  ref,
  ...props
}: LumenRefreshControlProps): ReactElement => {
  const theme = useLumenTheme()
  const colors = resolveLumenRefreshColors(theme.colors, indicatorTone)

  return (
    <RefreshControl
      ref={ref}
      {...props}
      colors={[colors.indicator]}
      progressBackgroundColor={colors.surface}
      tintColor={colors.indicator}
      titleColor={colors.title}
    />
  )
}
