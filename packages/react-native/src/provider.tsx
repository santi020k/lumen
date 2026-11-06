import {
  type ReactNode,
  useMemo } from 'react'
import { useColorScheme } from 'react-native'

import { createLumenTheme, type LumenTheme, type LumenThemeDefinition, type LumenThemePreset } from './theme.js'
import { LumenThemeContext, useLumenTheme } from './theme-context.js'
import type { LumenColorScheme } from './tokens.generated.js'

export interface LumenProviderProps {
  children: ReactNode
  scheme?: LumenColorScheme | 'system'
  definition?: LumenThemeDefinition
  theme?: LumenTheme
  preset?: LumenThemePreset
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
  definition,
  preset = 'default',
  scheme = 'system',
  theme
}: LumenProviderProps) => {
  const systemScheme = useColorScheme()
  const resolvedScheme = resolveLumenProviderScheme(scheme, systemScheme)

  const value = useMemo(
    () => theme ?? createLumenTheme(resolvedScheme, { ...definition && { definition }, preset }),
    [definition, preset, resolvedScheme, theme]
  )

  return (
    <LumenThemeContext value={value}>
      {children}
    </LumenThemeContext>
  )
}

export interface LumenThemeScopeProps {
  children: ReactNode
  definition: LumenThemeDefinition
  scheme?: LumenColorScheme
}

/** A local appearance. Omit the scheme to follow the surrounding Lumen provider. */
export const LumenThemeScope = ({ children, definition, scheme }: LumenThemeScopeProps) => {
  const parent = useLumenTheme()
  const resolvedScheme = scheme ?? parent.scheme
  const theme = useMemo(() => createLumenTheme(resolvedScheme, { definition }), [definition, resolvedScheme])

  return <LumenThemeContext value={theme}>{children}</LumenThemeContext>
}
