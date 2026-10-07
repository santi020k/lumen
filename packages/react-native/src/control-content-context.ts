import { createContext, use } from 'react'
import type { ColorValue } from 'react-native'

/** Default foreground for content nested inside a themed control. */
export const LumenControlContentContext = createContext<ColorValue | null>(null)

export const useLumenControlContentColor = (): ColorValue | null => use(LumenControlContentContext)
