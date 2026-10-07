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

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

const validBreadcrumbItem = (item: unknown): item is LumenBreadcrumbItem => {
  if (!isRecord(item) || typeof item.id !== 'string' || !item.id.trim() || typeof item.label !== 'string') return false

  return item.disabled === undefined || typeof item.disabled === 'boolean'
}

const validBreadcrumbItems = (value: unknown): value is readonly LumenBreadcrumbItem[] => {
  if (!Array.isArray(value)) return false

  const ids = new Set<string>()

  for (const item of value as readonly unknown[]) {
    if (!validBreadcrumbItem(item) || ids.has(item.id)) return false

    ids.add(item.id)
  }

  return true
}

export const LumenBreadcrumb = ({ label, items, onNavigate, currentLabel = 'Current',
  disabled = false, style, ...props }: LumenBreadcrumbProps): ReactElement => {
  const theme = useLumenTheme()
  const valid = validBreadcrumbItems(items)

  return (
    <View {...props} accessibilityLabel={label} style={style}>
      <ScrollView horizontal>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.xs }}>
          {(valid ? items : []).map((item, index) => {
            const current = index === items.length - 1
            const locked = disabled || Boolean(item.disabled)

            return (
              <View key={item.id} style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.xs }}>
                {index > 0 ?
                  (
                    <Text
                      aria-hidden
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
                      accessibilityLabel={`${item.label}, ${currentLabel}`}
                      aria-current="page"
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
