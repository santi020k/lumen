import { createContext, use } from 'react'

export interface LumenFieldContextValue {
  descriptionId?: string
  error: boolean
  errorId?: string
  label: string
  labelId: string
  required: boolean
}

export const LumenFieldContext = createContext<LumenFieldContextValue | null>(null)

export const useLumenFieldContext = (): LumenFieldContextValue | null => use(LumenFieldContext)
