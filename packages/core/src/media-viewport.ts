import {
  applyLumenMediaViewportAction,
  type LumenMediaViewportAction,
  type LumenMediaViewportValue,
  normalizeLumenMediaViewport,
  panLumenMediaViewport
} from './media-workspace.js'

export interface LumenMediaViewportLabels {
  down: string
  fit: string
  left: string
  right: string
  up: string
  'zoom-in': string
  'zoom-out': string
}

export const lumenMediaViewportLabels: LumenMediaViewportLabels = {
  down: 'Pan down',
  fit: 'Fit to view',
  left: 'Pan left',
  right: 'Pan right',
  up: 'Pan up',
  'zoom-in': 'Zoom in',
  'zoom-out': 'Zoom out'
}

export const lumenMediaViewportActions = ['zoom-in', 'zoom-out', 'fit', 'left', 'right', 'up', 'down'] as const

export const isLumenMediaViewportAction = (value: unknown): value is LumenMediaViewportAction => (
  value === 'zoom-in' || value === 'zoom-out' || value === 'fit' || value === 'left' || value === 'right' || value === 'up' || value === 'down'
)

export const formatLumenMediaZoom = (zoom: number, locale?: string): string => {
  try {
    return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(zoom)
  } catch {
    return new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 0 }).format(zoom)
  }
}

/** Shared pointer/keyboard interaction; the consumer decides whether to accept each requested value. */
export const bindLumenMediaViewport = (
  root: HTMLElement,
  options: {
    disabled: () => boolean
    getValue: () => LumenMediaViewportValue
    maxZoom: () => number
    onValueChange: (value: LumenMediaViewportValue) => void
  }
): (() => void) => {
  const stage = root.querySelector<HTMLElement>('[data-ui-media-viewport-stage]')

  if (!stage) return () => undefined

  const view = root.ownerDocument.defaultView
  const abort = new (view?.AbortController ?? AbortController)()
  const { signal } = abort
  let drag: { id: number, x: number, y: number, value: LumenMediaViewportValue } | undefined

  const act = (action: LumenMediaViewportAction) => {
    if (options.disabled()) return

    options.onValueChange(applyLumenMediaViewportAction(options.getValue(), action, options.maxZoom()))
  }

  root.addEventListener('click', event => {
    const target = event.target

    if (!view || !(target instanceof view.Element)) return

    const button = target.closest<HTMLButtonElement>('button[data-ui-media-viewport-action]')
    const action = button?.dataset.uiMediaViewportAction

    if (!button || button.disabled || !root.contains(button) || !isLumenMediaViewportAction(action)) return

    act(action)
  }, { signal })

  const keys: Readonly<Record<string, LumenMediaViewportAction>> = {
    ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', Home: 'fit', '+': 'zoom-in', '=': 'zoom-in', '-': 'zoom-out'
  }

  stage.addEventListener('keydown', event => {
    if (event.target !== stage || event.altKey || event.ctrlKey || event.metaKey || options.disabled()) return

    const action = keys[event.key]

    if (!action) return

    event.preventDefault()

    act(action)
  }, { signal })

  stage.addEventListener('pointerdown', event => {
    if (options.disabled() || drag || event.button !== 0 || options.getValue().zoom <= 1) return

    const target = event.target

    if (view && target instanceof view.Element && target.closest('button, input, a, select, textarea, [contenteditable]')) return

    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, value: options.getValue() }

    stage.setPointerCapture(event.pointerId)

    event.preventDefault()
  }, { signal })

  stage.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId || options.disabled()) return

    const bounds = stage.getBoundingClientRect()

    options.onValueChange(panLumenMediaViewport(
      drag.value, event.clientX - drag.x, event.clientY - drag.y, bounds.width, bounds.height, options.maxZoom()
    ))
  }, { signal })

  const stopDrag = (event: PointerEvent) => {
    if (drag?.id !== event.pointerId) return

    drag = undefined

    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId)
  }

  stage.addEventListener('pointerup', stopDrag, { signal })

  stage.addEventListener('pointercancel', stopDrag, { signal })

  stage.addEventListener('lostpointercapture', stopDrag, { signal })

  stage.addEventListener('dragstart', event => {
    event.preventDefault()
  }, { signal })

  return () => {
    if (drag && stage.hasPointerCapture(drag.id)) stage.releasePointerCapture(drag.id)

    drag = undefined

    abort.abort()
  }
}

const viewportTouchAction = (zoom: number, disabled: boolean): string => zoom > 1 && !disabled ? 'none' : 'pan-y'

const sameViewportValue = (left: LumenMediaViewportValue, right: LumenMediaViewportValue): boolean => (
  left.zoom === right.zoom && left.x === right.x && left.y === right.y
)

/** Writes only Lumen-owned styles and controls; image loading and contents stay application-owned. */
export const syncLumenMediaViewport = (
  root: HTMLElement, value: LumenMediaViewportValue, maxZoom = 4, disabled = false, locale?: string
): void => {
  const current = normalizeLumenMediaViewport(value, maxZoom)
  const content = root.querySelector<HTMLElement>('[data-ui-media-viewport-content]')
  const stage = root.querySelector<HTMLElement>('[data-ui-media-viewport-stage]')
  const status = root.querySelector<HTMLElement>('[data-ui-media-viewport-status]')

  if (content) {
    content.style.transform = `translate(${current.x * (current.zoom - 1) * 50}%, ${current.y * (current.zoom - 1) * 50}%) scale(${current.zoom})`
  }

  if (stage) {
    stage.style.touchAction = viewportTouchAction(current.zoom, disabled)

    stage.setAttribute('aria-disabled', String(disabled))
  }

  if (status) status.textContent = formatLumenMediaZoom(current.zoom, locale)

  for (const button of root.querySelectorAll<HTMLButtonElement>('button[data-ui-media-viewport-action]')) {
    const action = button.dataset.uiMediaViewportAction
    const next = isLumenMediaViewportAction(action) ? applyLumenMediaViewportAction(current, action, maxZoom) : current

    button.disabled = disabled || sameViewportValue(next, current)
  }
}
