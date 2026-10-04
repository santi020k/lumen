import type { ReactElement } from 'react'
import { Pressable, ScrollView, Text, View, type ViewProps } from 'react-native'

import { useLumenTheme } from './theme-context.js'

export interface LumenBreadcrumbItem { id: string, label: string, disabled?: boolean }
export interface LumenBreadcrumbProps extends Omit<ViewProps, 'children'> {
  label: string
  items: readonly LumenBreadcrumbItem[]
  onNavigate: (id: string) => void
  currentLabel?: string
  disabled?: boolean
}

export const LumenBreadcrumb = ({ label, items, onNavigate, currentLabel = 'Current',
  disabled = false, style, ...props }: LumenBreadcrumbProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <View {...props} accessibilityLabel={label} style={style}>
      <ScrollView horizontal>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.xs }}>
          {items.map((item, index) => {
            const current = index === items.length - 1
            const locked = disabled || Boolean(item.disabled)

            return (
              <View key={item.id} style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.xs }}>
                {index > 0 ?
                  (
                    <Text
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                      style={{ color: theme.colors.inkMuted }}
                    >
                      /
                    </Text>
                  ) :
                  null}
                {current ?
                  (
                    <Text
                      accessible
                      accessibilityLabel={item.label}
                      accessibilityValue={{ text: currentLabel }}
                      accessibilityState={{ selected: true }}
                      style={{ color: theme.colors.ink }}
                    >
                      {item.label}
                    </Text>
                  ) :
                  (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={item.label}
                      accessibilityState={{ disabled: locked }}
                      disabled={locked}
                      onPress={() => {
                        if (!locked) onNavigate(item.id)
                      }}
                      style={{ justifyContent: 'center',
                        minHeight: 44,
                        minWidth: 44,
                        paddingHorizontal: theme.spacing.sm,
                        opacity: locked ? 0.52 : 1 }}
                    >
                      <Text style={{ color: theme.colors.brandSolid }}>{item.label}</Text>
                    </Pressable>
                  )}
              </View>
            )
          })}
        </View>
      </ScrollView>
    </View>
  )
}
