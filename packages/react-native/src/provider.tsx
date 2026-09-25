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

const resolveLumenProviderScheme = (
  scheme: LumenColorScheme | 'system',
  systemScheme: ReturnType<typeof useColorScheme>
): LumenColorScheme => {
  if (scheme !== 'system') return scheme

  return systemScheme === 'dark' ? 'dark' : 'light'
}

export const LumenProvider = ({
  children,
  scheme = 'system',
  theme
}: LumenProviderProps) => {
  const systemScheme = useColorScheme()
  const resolvedScheme = resolveLumenProviderScheme(scheme, systemScheme)

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
