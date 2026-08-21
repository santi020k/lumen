import {
  type ReactNode,
  useMemo } from 'react'
import { useColorScheme } from 'react-native'

import {
  createLumenTheme,
  type LumenTheme
} from './theme.js'
import { LumenThemeContext } from './theme-context.js'
import type { LumenColorScheme } from './tokens.generated.js'

export interface LumenProviderProps {
  children: ReactNode
  scheme?: LumenColorScheme | 'system'
  theme?: LumenTheme
}

export const LumenProvider = ({
  children,
  scheme = 'system',
  theme
}: LumenProviderProps) => {
  const systemScheme = useColorScheme()
  const resolvedScheme = scheme === 'system' ? systemScheme ?? 'light' : scheme

  const value = useMemo(
    () => theme ?? createLumenTheme(resolvedScheme),
    [resolvedScheme, theme]
  )

  return (
    <LumenThemeContext value={value}>
      {children}
    </LumenThemeContext>
  )
}
