import toastStyles from '../../styles/runtime/toast.css?url'
import { loadRuntimeStylesheet } from '../styles.js'

import { nextRuntimeId } from './shared.js'

const getToastVariantClass = (variant: string | undefined): string => {
  if (variant === 'success') return 'ui-toast--success'

  if (variant === 'warning') return 'ui-toast--warning'

  if (variant === 'destructive') return 'ui-toast--destructive'

  return ''
}

type ToastPlacement =
  | 'bottom-center' |
  'bottom-left' |
  'bottom-right' |
  'top-center' |
  'top-left' |
  'top-right'

interface ToastAction {
  event?: string
  label?: string
  onClick?: (event: MouseEvent, toast: HTMLElement) => void
  value?: unknown
}

export interface ToastDetail {
  action?: ToastAction
  description?: string
  duration?: number
  id?: string
  max?: number
  placement?: ToastPlacement
  title?: string
  variant?: string
}

export interface ToastApi {
  create: (detail: ToastDetail) => string
  dismiss: (id?: string) => void
  update: (id: string, detail: ToastDetail) => void
}

const defaultToastDuration = 5000
const defaultToastMax = 5
const noop = (): void => undefined
let toastDocumentApiDocument: Document | null = null

const toastTimers = new WeakMap<HTMLElement, {
  cleanup: () => void
  duration: number
  remaining: number
  startedAt: number
  timer: number
}>()

const isToastPlacement = (placement: string | undefined): placement is ToastPlacement => placement === 'top-left' ||
  placement === 'top-center' ||
  placement === 'top-right' ||
  placement === 'bottom-left' ||
  placement === 'bottom-center' ||
  placement === 'bottom-right'

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const isActionCallback = (value: unknown): value is NonNullable<ToastAction['onClick']> => typeof value === 'function'

const readToastAction = (value: unknown): ToastAction | undefined => {
  if (!isRecord(value)) return undefined

  const action: ToastAction = {}

  if (typeof value.label === 'string') action.label = value.label

  if (typeof value.event === 'string') action.event = value.event

  if (isActionCallback(value.onClick)) action.onClick = value.onClick

  if ('value' in value) action.value = value.value

  return action
}

export const readToastDetail = (value: unknown): ToastDetail => {
  if (!isRecord(value)) return {}

  const detail: ToastDetail = {}

  for (const key of ['description', 'id', 'title', 'variant'] as const) {
    if (typeof value[key] === 'string') detail[key] = value[key]
  }

  for (const key of ['duration', 'max'] as const) {
    if (typeof value[key] === 'number' && Number.isFinite(value[key])) detail[key] = value[key]
  }

  if (typeof value.placement === 'string' && isToastPlacement(value.placement)) detail.placement = value.placement

  const action = readToastAction(value.action)

  if (action) detail.action = action

  return detail
}

const detailFromEvent = (event: Event): ToastDetail => (
  readToastDetail(event instanceof CustomEvent ? event.detail : undefined)
)

const getToastPlacement = (placement: string | undefined): ToastPlacement => (
  isToastPlacement(placement) ? placement : 'bottom-right'
)

const getToastViewport = (placement: string | undefined): HTMLElement => {
  const resolvedPlacement = getToastPlacement(placement)
  const shouldUseAnyViewport = placement === undefined

  const existing = document.querySelector<HTMLElement>(`[data-ui-toast-viewport][data-placement="${resolvedPlacement}"]`) ??
    (shouldUseAnyViewport ? document.querySelector<HTMLElement>('[data-ui-toast-viewport]') : null)

  if (existing) {
    existing.dataset.placement = existing.dataset.placement ?? resolvedPlacement

    existing.setAttribute('aria-live', existing.getAttribute('aria-live') ?? 'polite')

    existing.setAttribute('aria-atomic', existing.getAttribute('aria-atomic') ?? 'false')

    return existing
  }

  const viewport = document.createElement('div')

  viewport.className = 'ui-tvp'

  viewport.dataset.uiToastViewport = ''

  viewport.dataset.placement = resolvedPlacement

  viewport.setAttribute('aria-live', 'polite')

  viewport.setAttribute('aria-atomic', 'false')

  viewport.setAttribute('aria-label', 'Notifications')

  document.body.append(viewport)

  return viewport
}

const clearToastTimer = (toast: HTMLElement): void => {
  const timer = toastTimers.get(toast)

  if (!timer) return

  window.clearTimeout(timer.timer)

  timer.cleanup()

  toastTimers.delete(toast)
}

const dismissToast = (toast: HTMLElement): void => {
  clearToastTimer(toast)

  toast.dataset.state = 'closed'

  window.setTimeout(() => {
    toast.remove()
  }, 240)
}

const scheduleToastDismiss = (toast: HTMLElement, duration: number): void => {
  clearToastTimer(toast)

  if (!Number.isFinite(duration) || duration <= 0) return

  const timerState = {
    cleanup: noop,
    duration,
    remaining: duration,
    startedAt: Date.now(),
    timer: 0
  }

  let hovered = false
  let paused = false

  const start = (): void => {
    paused = false

    timerState.startedAt = Date.now()

    timerState.timer = window.setTimeout(() => {
      dismissToast(toast)
    }, timerState.remaining)
  }

  const pause = (): void => {
    if (paused) return

    paused = true

    window.clearTimeout(timerState.timer)

    timerState.remaining = Math.max(0, timerState.remaining - (Date.now() - timerState.startedAt))
  }

  const resume = (): void => {
    if (!paused || hovered || toast.contains(document.activeElement)) return

    start()
  }

  const enter = (): void => {
    hovered = true

    pause()
  }

  const leave = (): void => {
    hovered = false

    resume()
  }

  const blur = (event: FocusEvent): void => {
    if (event.relatedTarget instanceof Node && toast.contains(event.relatedTarget)) return

    resume()
  }

  timerState.cleanup = () => {
    toast.removeEventListener('mouseenter', enter)

    toast.removeEventListener('mouseleave', leave)

    toast.removeEventListener('focusin', pause)

    toast.removeEventListener('focusout', blur)
  }

  toast.addEventListener('mouseenter', enter)

  toast.addEventListener('mouseleave', leave)

  toast.addEventListener('focusin', pause)

  toast.addEventListener('focusout', blur)

  toastTimers.set(toast, timerState)

  start()
}

const setToastVariant = (toast: HTMLElement, detail: ToastDetail): void => {
  const variant = detail.variant ?? toast.dataset.variant ?? 'default'
  const variantClass = getToastVariantClass(variant)

  toast.className = variantClass ? `ui-toast ${variantClass}` : 'ui-toast'

  toast.dataset.variant = variant

  toast.setAttribute('role', variant === 'destructive' ? 'alert' : 'status')

  toast.setAttribute('aria-live', variant === 'destructive' ? 'assertive' : 'polite')
}

const setToastContent = (toast: HTMLElement, detail: ToastDetail): void => {
  const title = detail.title ?? toast.dataset.title ?? 'Notification'
  const description = detail.description ?? toast.dataset.description ?? ''

  toast.dataset.title = title

  toast.dataset.description = description

  setToastVariant(toast, detail)

  toast.replaceChildren()

  const body = document.createElement('div')
  const heading = document.createElement('strong')

  body.className = 'ui-toast__body'

  heading.textContent = title

  body.append(heading)

  if (description) {
    const text = document.createElement('p')

    text.textContent = description

    body.append(text)
  }

  toast.append(body)

  if (detail.action?.label) {
    const action = document.createElement('button')

    action.className = 'ui-button ui-button--secondary ui-button--sm ui-toast__action'

    action.type = 'button'

    action.textContent = detail.action.label

    action.addEventListener('click', event => {
      detail.action?.onClick?.(event, toast)

      toast.dispatchEvent(new CustomEvent(detail.action?.event ?? 'ui:toast-action', {
        bubbles: true,
        detail: { id: toast.id, value: detail.action?.value }
      }))

      dismissToast(toast)
    })

    toast.append(action)
  }

  const dismiss = document.createElement('button')

  dismiss.className = 'ui-toast__dismiss'

  dismiss.type = 'button'

  dismiss.setAttribute('aria-label', 'Dismiss notification')

  dismiss.textContent = 'Dismiss'

  dismiss.addEventListener('click', () => {
    dismissToast(toast)
  })

  toast.append(dismiss)
}

const bindToastDocumentApi = (): void => {
  const createToast = (detail: ToastDetail): string => {
    const viewport = getToastViewport(detail.placement)
    const id = detail.id ?? nextRuntimeId('ui-toast', document)
    const duration = detail.duration ?? defaultToastDuration
    const max = detail.max ?? Number(viewport.dataset.uiToastMax ?? defaultToastMax)
    const existingToast = document.getElementById(id)

    if (existingToast instanceof HTMLElement && existingToast.hasAttribute('data-ui-toast')) {
      existingToast.dataset.state = 'open'

      setToastContent(existingToast, detail)

      viewport.append(existingToast)

      scheduleToastDismiss(existingToast, duration)

      return id
    }

    const toast = document.createElement('aside')

    toast.id = id

    toast.dataset.uiToast = ''

    toast.dataset.uiBound = 'true'

    toast.dataset.state = 'open'

    toast.addEventListener('keydown', event => {
      if (event.defaultPrevented || event.isComposing) return

      if (event.key !== 'Escape') return

      event.preventDefault()

      dismissToast(toast)
    })

    setToastContent(toast, detail)

    viewport.append(toast)

    scheduleToastDismiss(toast, duration)

    const toasts = [...viewport.querySelectorAll<HTMLElement>('[data-ui-toast]')]

    for (const staleToast of toasts.slice(0, Math.max(0, toasts.length - max))) {
      dismissToast(staleToast)
    }

    return id
  }

  const updateToast = (id: string, detail: ToastDetail): void => {
    const toast = document.getElementById(id)

    if (!(toast instanceof HTMLElement) || !toast.hasAttribute('data-ui-toast')) return

    setToastContent(toast, { ...detail, id })

    if (detail.duration !== undefined) {
      scheduleToastDismiss(toast, detail.duration)
    }
  }

  const dismissToastById = (id?: string): void => {
    const selector = id ? `#${CSS.escape(id)}` : '[data-ui-toast]'

    for (const toast of document.querySelectorAll<HTMLElement>(selector)) {
      if (toast.hasAttribute('data-ui-toast')) {
        dismissToast(toast)
      }
    }
  }

  const api: ToastApi = {
    create: createToast,
    dismiss: dismissToastById,
    update: updateToast
  }

    ;(window as Window & { LumenToast?: ToastApi }).LumenToast = api

  document.addEventListener('ui:toast', event => {
    createToast(detailFromEvent(event))
  })

  document.addEventListener('ui:toast-update', event => {
    const detail = detailFromEvent(event)

    if (detail.id) updateToast(detail.id, detail)
  })

  document.addEventListener('ui:toast-dismiss', event => {
    const detail = detailFromEvent(event)

    dismissToastById(detail.id)
  })
}

export const initToasts = (scope: ParentNode): void => {
  if (toastDocumentApiDocument !== document) {
    toastDocumentApiDocument = document

    bindToastDocumentApi()
  }

  for (const viewport of scope.querySelectorAll<HTMLElement>('[data-ui-toast-viewport]')) {
    viewport.dataset.placement = getToastPlacement(viewport.dataset.placement)

    viewport.setAttribute('aria-live', viewport.getAttribute('aria-live') ?? 'polite')

    viewport.setAttribute('aria-atomic', viewport.getAttribute('aria-atomic') ?? 'false')
  }

  for (const toast of scope.querySelectorAll<HTMLElement>('[data-ui-toast], .ui-toast')) {
    if (toast.dataset.uiBound === 'true') continue

    toast.dataset.uiBound = 'true'

    toast.addEventListener('keydown', event => {
      if (event.defaultPrevented || event.isComposing) return

      if (event.key !== 'Escape') return

      event.preventDefault()

      dismissToast(toast)
    })
  }
}

export const loadToastStyles = (): Promise<void> => loadRuntimeStylesheet(document, toastStyles)
