import type { ReactElement, ReactNode } from 'react'
import { View, type ViewProps } from 'react-native'

import { useLumenTheme } from './theme-context.js'

export interface LumenTimelineProps extends ViewProps { label: string }
export interface LumenTimelineItemProps extends ViewProps { dot?: ReactNode }

/** Items retain host content and its accessible controls. */
export const LumenTimeline = ({ label, children, style, ...props }: LumenTimelineProps): ReactElement => {
  const theme = useLumenTheme()

  return <View {...props} accessibilityLabel={label} style={[{ gap: theme.spacing.md }, style]}>{children}</View>
}

export const LumenTimelineItem = ({ children, dot, style, ...props }: LumenTimelineItemProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <View {...props} style={[{ flexDirection: 'row', gap: theme.spacing.md }, style]}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ alignItems: 'center', width: 20 }}
      >
        {dot ?? (
          <View style={{
            width: 8, height: 8, borderRadius: theme.radii.full, backgroundColor: theme.colors.brandSolid
          }}
          />
        )}
        <View style={{
          flex: 1, minHeight: 16, borderLeftWidth: 1, borderColor: theme.colors.line, marginTop: theme.spacing.xs
        }}
        />
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  )
}
