import {
  createContext,
  use
} from 'react'

import {
  createLumenTheme,
  type LumenTheme
} from './theme.js'

export const LumenThemeContext = createContext<LumenTheme>(createLumenTheme('light'))

export const useLumenTheme = (): LumenTheme => use(LumenThemeContext)
