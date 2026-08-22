import { type ComponentRef, type ReactElement, type Ref } from 'react'
import {
  type HostInstance,
  Pressable,
  RefreshControl,
  type RefreshControlProps,
  Text,
  type TextStyle,
  View,
  type ViewProps
} from 'react-native'

import {
  type LumenRefreshIndicatorTone,
  resolveLumenNavigationItemState,
  resolveLumenRefreshColors
} from './platform-recipes.js'
import {
  LumenIcon,
  type LumenIconGraphic
} from './primitives.js'
import { useLumenTheme } from './theme-context.js'

export interface LumenNavigationItem {
  disabled?: boolean
  icon?: LumenIconGraphic
  label: string
  selectedIcon?: LumenIconGraphic
  value: string
}

export interface LumenNavigationBarProps extends Omit<ViewProps, 'children'> {
  accessibilityLabel?: string
  items: readonly LumenNavigationItem[]
  onValueChange: (value: string) => void
  ref?: Ref<HostInstance>
  value: string
}

/**
 * A controlled, token-aware destination bar for app-level navigation.
 * Screen routing and navigation history remain application-owned.
 */
export const LumenNavigationBar = ({
  accessibilityLabel = 'Primary navigation',
  items,
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
      {items.map(item => {
        const itemState = resolveLumenNavigationItemState(
          theme.colors,
          item.value,
          value,
          Boolean(item.disabled),
          false
        )

        const selected = itemState.selected
        const Graphic = selected && item.selectedIcon ? item.selectedIcon : item.icon

        return (
          <Pressable
            accessibilityLabel={item.label}
            accessibilityRole="tab"
            accessibilityState={{ disabled: item.disabled, selected }}
            disabled={item.disabled}
            key={item.value}
            onPress={() => {
              onValueChange(item.value)
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
            {Graphic ?
              (
                <LumenIcon color={itemState.color} decorative icon={Graphic} size="md" />
              ) :
              null}
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
      })}
    </View>
  )
}

export interface LumenRefreshControlProps extends Omit<
  RefreshControlProps,
  'accessibilityLabel' | 'colors' | 'onRefresh' | 'progressBackgroundColor' | 'tintColor' | 'titleColor'
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
