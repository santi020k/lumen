import { createContext, use } from 'react'

export interface LumenFieldContextValue {
  /** Spoken guidance for controls that announce field context through a hint instead of relationships. */
  description?: string
  descriptionId?: string
  error: boolean
  errorId?: string
  errorMessage?: string
  label: string
  labelId: string
  required: boolean
}

export const LumenFieldContext = createContext<LumenFieldContextValue | null>(null)

export const useLumenFieldContext = (): LumenFieldContextValue | null => use(LumenFieldContext)
