import type { MouseEvent } from 'react'
import { use, useEffect, useRef, useState } from 'react'

import type { ToastApi, ToastDetail } from './hooks.js'
import { ToastContext } from './toast-context.js'

type CopyState = 'copied' | 'error' | 'idle'

interface CopyFeedbackState {
  key: unknown
  recoveryValue: string | undefined
  state: CopyState
}

const recoveryValueFor = (
  state: CopyState, label: string | undefined, value: string | undefined
): string | undefined => state === 'error' && label ? value : undefined

interface CopyFeedbackOptions {
  copiedLabel: string
  errorLabel: string
  getValue: (button: HTMLButtonElement) => string | undefined
  label: string
  recoveryLabel?: string | undefined
  recoveryKey?: unknown
  onClick?: ((event: MouseEvent<HTMLButtonElement>) => void) | undefined
  resetAfter?: number
  toast?: boolean
}

const normalizedResetAfter = (value: number): number => Number.isFinite(value) ? Math.max(0, value) : 2000

// Embedded editors such as Figma can permit a user-initiated copy event while
// withholding the async Clipboard API. Supply plain text without moving focus.
const copyInFrame = (doc: Document, value: string): boolean => {
  const view = doc.defaultView
  const commands: { execCommand?: (command: 'copy') => boolean } = doc

  if (!view || view === view.parent || !commands.execCommand) return false

  let handled = false

  const supplyText = (event: ClipboardEvent) => {
    if (!event.clipboardData) return

    event.clipboardData.setData('text/plain', value)

    event.preventDefault()

    handled = true
  }

  doc.addEventListener('copy', supplyText)

  try {
    return commands.execCommand('copy') && handled
  } catch {
    return false
  } finally {
    doc.removeEventListener('copy', supplyText)
  }
}

const publishCopyToast = (
  button: HTMLButtonElement, api: ToastApi | null, copied: boolean, copiedLabel: string, errorLabel: string
): void => {
  const detail: ToastDetail = { title: copied ? copiedLabel : errorLabel, variant: copied ? 'success' : 'destructive' }

  if (api) {
    api.create(detail)

    return
  }

  const EventConstructor = button.ownerDocument.defaultView?.CustomEvent ?? CustomEvent

  button.ownerDocument.dispatchEvent(new EventConstructor('ui:toast', { detail }))
}

export const useCopyFeedback = ({
  copiedLabel,
  errorLabel,
  getValue,
  label,
  onClick,
  recoveryLabel,
  recoveryKey,
  resetAfter = 2000,
  toast = false
}: CopyFeedbackOptions) => {
  const toastApi = use(ToastContext)

  const [feedback, setFeedback] = useState<CopyFeedbackState>(() => ({
    key: recoveryKey, recoveryValue: undefined, state: 'idle'
  }))

  const state = feedback.key === recoveryKey ? feedback.state : 'idle'
  const recoveryValue = feedback.key === recoveryKey ? feedback.recoveryValue : undefined
  const resetTimerRef = useRef<ReturnType<typeof globalThis.setTimeout>>(undefined)
  const operationRef = useRef<{ key: unknown } | undefined>(undefined)

  useEffect(() => {
    if (operationRef.current?.key === recoveryKey) return

    operationRef.current = undefined

    globalThis.clearTimeout(resetTimerRef.current)
  }, [recoveryKey])

  useEffect(() => () => {
    operationRef.current = undefined

    globalThis.clearTimeout(resetTimerRef.current)
  }, [])

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)

    if (event.defaultPrevented) return

    const button = event.currentTarget
    const currentOperation = { key: recoveryKey }

    operationRef.current = currentOperation

    globalThis.clearTimeout(resetTimerRef.current)

    let nextState: 'copied' | 'error' = 'copied'
    let value: string | undefined

    try {
      value = getValue(button)

      if (value === undefined) throw new Error(errorLabel)

      if (!copyInFrame(button.ownerDocument, value)) await navigator.clipboard.writeText(value)

      if (operationRef.current !== currentOperation) return

      button.dispatchEvent(new CustomEvent('ui:copy-success', { bubbles: true, detail: { value } }))
    } catch (error) {
      if (operationRef.current !== currentOperation) return

      nextState = 'error'

      button.dispatchEvent(new CustomEvent('ui:copy-error', { bubbles: true, detail: { error } }))
    }

    setFeedback({
      key: recoveryKey, state: nextState, recoveryValue: recoveryValueFor(nextState, recoveryLabel, value)
    })

    if (toast) publishCopyToast(button, toastApi, nextState === 'copied', copiedLabel, errorLabel)

    resetTimerRef.current = globalThis.setTimeout(() => {
      setFeedback(current => current.key === recoveryKey ? { ...current, state: 'idle' } : current)
    }, normalizedResetAfter(resetAfter))
  }

  const accessibleLabel = { copied: copiedLabel, error: errorLabel, idle: label }[state]

  return { accessibleLabel, handleClick, recoveryValue, state }
}
