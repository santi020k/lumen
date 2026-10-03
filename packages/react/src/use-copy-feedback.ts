import type { MouseEvent } from 'react'
import { useEffect, useRef, useState } from 'react'

interface CopyFeedbackOptions {
  copiedLabel: string
  errorLabel: string
  getValue: (button: HTMLButtonElement) => string | undefined
  label: string
  onClick?: ((event: MouseEvent<HTMLButtonElement>) => void) | undefined
  resetAfter?: number
  toast?: boolean
}

const normalizedResetAfter = (value: number): number => Number.isFinite(value) ? Math.max(0, value) : 2000

export const useCopyFeedback = ({
  copiedLabel,
  errorLabel,
  getValue,
  label,
  onClick,
  resetAfter = 2000,
  toast = false
}: CopyFeedbackOptions) => {
  const [state, setState] = useState<'copied' | 'error' | 'idle'>('idle')
  const resetTimerRef = useRef<ReturnType<typeof globalThis.setTimeout>>(undefined)
  const operationRef = useRef(0)

  useEffect(() => () => {
    operationRef.current += 1

    globalThis.clearTimeout(resetTimerRef.current)
  }, [])

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)

    if (event.defaultPrevented) return

    const button = event.currentTarget
    const currentOperation = ++operationRef.current

    globalThis.clearTimeout(resetTimerRef.current)

    let nextState: 'copied' | 'error' = 'copied'

    try {
      const value = getValue(button)

      if (value === undefined) throw new Error(errorLabel)

      await navigator.clipboard.writeText(value)

      if (operationRef.current !== currentOperation) return

      button.dispatchEvent(new CustomEvent('ui:copy-success', { bubbles: true, detail: { value } }))
    } catch (error) {
      if (operationRef.current !== currentOperation) return

      nextState = 'error'

      button.dispatchEvent(new CustomEvent('ui:copy-error', { bubbles: true, detail: { error } }))
    }

    setState(nextState)

    if (toast) {
      document.dispatchEvent(new CustomEvent('ui:toast', {
        detail: {
          title: nextState === 'copied' ? copiedLabel : errorLabel,
          variant: nextState === 'copied' ? 'success' : 'destructive'
        }
      }))
    }

    resetTimerRef.current = globalThis.setTimeout(() => {
      setState('idle')
    }, normalizedResetAfter(resetAfter))
  }

  const accessibleLabel = { copied: copiedLabel, error: errorLabel, idle: label }[state]

  return { accessibleLabel, handleClick, state }
}
