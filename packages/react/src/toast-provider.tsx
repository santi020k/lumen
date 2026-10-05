'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { composeClassName } from '@santi020k/lumen-core'

import type { ToastApi, ToastDetail, ToastPlacement, ToastProviderProps, ToastRecord } from './hooks.js'
import { ToastContext, useToast } from './toast-context.js'

const defaultToastDuration = 5000
const defaultToastMax = 5
const closeDelay = 240

const createToastId = (): string => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return `ui-toast-${crypto.randomUUID()}`
  }

  return `ui-toast-${Math.random().toString(36).slice(2)}`
}

const createToastRecord = (
  detail: ToastDetail,
  placement: ToastPlacement
): ToastRecord => ({
  ...detail,
  id: detail.id ?? createToastId(),
  open: true,
  placement: detail.placement ?? placement,
  title: detail.title ?? 'Notification',
  variant: detail.variant ?? 'default'
})

interface ToastItemProps {
  onDismiss: () => void
  toast: ToastRecord
}

const ToastItem = ({ onDismiss, toast }: ToastItemProps) => {
  const toastRef = useRef<HTMLElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const remainingRef = useRef(toast.duration ?? defaultToastDuration)
  const startedAtRef = useRef(0)
  const pauseReasonsRef = useRef(new Set<'focus' | 'hover'>())
  const dismiss = useToast().dismiss

  const clearTimer = useCallback(() => {
    clearTimeout(timerRef.current)

    timerRef.current = undefined
  }, [])

  const startTimer = useCallback(() => {
    const remaining = remainingRef.current

    clearTimer()

    if (!Number.isFinite(remaining) || remaining <= 0 || pauseReasonsRef.current.size > 0) return

    startedAtRef.current = Date.now()

    timerRef.current = setTimeout(() => {
      dismiss(toast.id)
    }, remaining)
  }, [clearTimer, dismiss, toast.id])

  const pauseTimer = useCallback((reason: 'focus' | 'hover') => {
    pauseReasonsRef.current.add(reason)

    if (timerRef.current === undefined) return

    remainingRef.current = Math.max(
      0, remainingRef.current - (Date.now() - startedAtRef.current)
    )

    clearTimer()
  }, [clearTimer])

  const resumeTimer = useCallback((reason: 'focus' | 'hover') => {
    const wasPaused = pauseReasonsRef.current.delete(reason)

    if (wasPaused && pauseReasonsRef.current.size === 0 && remainingRef.current > 0) {
      startTimer()
    }
  }, [startTimer])

  useEffect(() => {
    remainingRef.current = toast.duration ?? defaultToastDuration

    if (toast.open) startTimer()

    return clearTimer
  }, [clearTimer, startTimer, toast.duration, toast.open])

  useEffect(() => {
    if (!toast.open) {
      const timer = setTimeout(onDismiss, closeDelay)

      return () => {
        clearTimeout(timer)
      }
    }
  }, [onDismiss, toast.open])

  const action = toast.action
  const description = toast.description ?? ''
  const variantClass = ['success', 'warning', 'destructive'].includes(toast.variant) && `ui-toast--${toast.variant}`

  return (
    <aside
      aria-live={toast.variant === 'destructive' ? 'assertive' : 'polite'}
      className={composeClassName('ui-toast', variantClass)}
      data-description={description}
      data-state={toast.open ? 'open' : 'closed'}
      data-title={toast.title}
      data-ui-toast
      data-variant={toast.variant}
      id={toast.id}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) resumeTimer('focus')
      }}
      onFocus={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) pauseTimer('focus')
      }}
      onKeyDown={event => {
        if (event.defaultPrevented || event.nativeEvent.isComposing) return

        if (event.key !== 'Escape') return

        event.preventDefault()

        dismiss(toast.id)
      }}
      onMouseEnter={() => {
        pauseTimer('hover')
      }}
      onMouseLeave={() => {
        resumeTimer('hover')
      }}
      ref={toastRef}
      role={toast.variant === 'destructive' ? 'alert' : 'status'}
    >
      <div className="ui-toast__body">
        <strong>{toast.title}</strong>
        {description && <p>{description}</p>}
      </div>
      {action?.label && (
        <button
          className="
            ui-button ui-button--secondary ui-button--sm ui-toast__action
          "
          onClick={event => {
            action.onClick?.(event, toastRef.current)

            toastRef.current?.dispatchEvent(
              new CustomEvent(action.event ?? 'ui:toast-action', {
                bubbles: true,
                detail: { id: toast.id, value: action.value }
              })
            )

            dismiss(toast.id)
          }}
          type="button"
        >
          {action.label}
        </button>
      )}
      <button
        aria-label="Dismiss notification"
        className="ui-toast__dismiss"
        onClick={() => {
          dismiss(toast.id)
        }}
        type="button"
      >
        Dismiss
      </button>
    </aside>
  )
}

interface ToastViewportProps {
  maxCount: number
  placement: ToastPlacement
  removeToast: (id: string) => void
  toasts: ToastRecord[]
}

const ToastViewport = ({
  maxCount,
  placement,
  removeToast,
  toasts
}: ToastViewportProps) => (
  <div
    aria-atomic="false"
    aria-label="Notifications"
    aria-live="polite"
    className="ui-tvp"
    data-placement={placement}
    data-ui-toast-viewport
    data-ui-toast-max={maxCount}
  >
    {toasts.map(toast => (
      <ToastItem
        key={toast.id}
        onDismiss={() => {
          removeToast(toast.id)
        }}
        toast={toast}
      />
    ))}
  </div>
)

export const ToastProvider = ({
  children,
  maxCount = defaultToastMax,
  placement = 'bottom-right'
}: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastRecord[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(current => current.filter(toast => toast.id !== id))
  }, [])

  const dismiss = useCallback((id?: string) => {
    setToasts(current => {
      const targetId = id ?? current.filter(toast => toast.open).pop()?.id

      return current.map(toast => toast.id === targetId ? { ...toast, open: false } : toast)
    })
  }, [])

  const create = useCallback(
    (detail: ToastDetail): string => {
      const record = createToastRecord(detail, placement)
      const stackMax = detail.max ?? maxCount

      setToasts(current => {
        const next = current.some(toast => toast.id === record.id) ?
          current.map(toast => (toast.id === record.id ? record : toast)) :
          [...current, record]

        const samePlacement = next.filter(
          toast => toast.placement === record.placement
        )

        const staleIds = samePlacement
          .slice(0, Math.max(0, samePlacement.length - stackMax))
          .map(toast => toast.id)

        return next.map(toast => staleIds.includes(toast.id) ? { ...toast, open: false } : toast)
      })

      return record.id
    }, [maxCount, placement]
  )

  const update = useCallback((id: string, detail: ToastDetail) => {
    setToasts(current => current.map(toast => {
      if (toast.id !== id) return toast

      return {
        ...toast,
        ...detail,
        id,
        open: true,
        placement: detail.placement ?? toast.placement,
        title: detail.title ?? toast.title,
        variant: detail.variant ?? toast.variant
      }
    }))
  }, [])

  const api = useMemo<ToastApi>(
    () => ({
      create,
      dismiss,
      toasts,
      update
    }), [create, dismiss, toasts, update]
  )

  const placements = [
    ...new Set([placement, ...toasts.map(toast => toast.placement)])
  ]

  return (
    <ToastContext value={api}>
      {children}
      {placements.map(item => (
        <ToastViewport
          key={item}
          maxCount={maxCount}
          placement={item}
          removeToast={removeToast}
          toasts={toasts.filter(toast => toast.placement === item)}
        />
      ))}
    </ToastContext>
  )
}
