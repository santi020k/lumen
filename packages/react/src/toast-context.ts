'use client'

import { createContext, use } from 'react'

import type { ToastApi } from './hooks.js'

export const ToastContext = createContext<ToastApi | null>(null)

export const useToast = (): ToastApi => {
  const api = use(ToastContext)

  if (!api) {
    throw new Error('useToast must be used inside a ToastProvider.')
  }

  return api
}
