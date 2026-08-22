import { type ComponentRef, type ReactElement, type Ref } from 'react'
import {
  RefreshControl,
  type RefreshControlProps
} from 'react-native'

import {
  type LumenRefreshIndicatorTone,
  resolveLumenRefreshColors
} from './platform-recipes.js'
import { useLumenTheme } from './theme-context.js'

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
