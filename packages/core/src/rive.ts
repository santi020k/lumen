import { Rive, type RiveParameters } from '@rive-app/canvas'

import { isLumenWorkflowMotionReduced } from './motion-workflows.js'

export type LumenRiveStatus = 'loading' | 'ready' | 'error' | 'destroyed'
export interface LumenRiveBinding {
  boolean: (path: string) => { value: boolean } | null
  number: (path: string) => { value: number } | null
  string: (path: string) => { value: string } | null
  trigger: (path: string) => { trigger: () => void } | null
}
export type LumenRiveRuntime = Pick<Rive, 'cleanup' | 'pause' | 'play' | 'resizeDrawingSurfaceToCanvas'> & {
  readonly viewModelInstance: LumenRiveBinding | null
}
export interface LumenRiveOptions {
  autoplay?: boolean
  canvas: HTMLCanvasElement
  createRuntime?: (parameters: RiveParameters) => LumenRiveRuntime
  onStatus?: (status: LumenRiveStatus) => void
  src: string
  stateMachine: string
}
export interface LumenRiveController {
  destroy: () => void
  play: () => boolean
  pause: () => void
  setValue: (path: string, value: boolean | number | string) => boolean
  trigger: (name: string) => boolean
}

const observeRiveEnvironment = (canvas: HTMLCanvasElement, resize: () => void, sync: () => void): (() => void) => {
  const view = canvas.ownerDocument.defaultView
  const media = view?.matchMedia('(prefers-reduced-motion: reduce)')
  const resizeObserver = view?.ResizeObserver ? new view.ResizeObserver(resize) : undefined
  const motionObserver = view?.MutationObserver ? new view.MutationObserver(sync) : undefined

  resizeObserver?.observe(canvas)

  motionObserver?.observe(canvas.ownerDocument.documentElement, {
    attributes: true, attributeFilter: ['data-ui-motion'], subtree: true
  })

  media?.addEventListener('change', sync)

  canvas.ownerDocument.addEventListener('visibilitychange', sync)

  return () => {
    resizeObserver?.disconnect()

    motionObserver?.disconnect()

    media?.removeEventListener('change', sync)

    canvas.ownerDocument.removeEventListener('visibilitychange', sync)
  }
}

const defaultRuntime = (parameters: RiveParameters): LumenRiveRuntime => new Rive(parameters)

/** SDK is confined to this optional entry point; the consumer supplies its own licensed asset. */
export const createLumenRiveController = (options: LumenRiveOptions): LumenRiveController => {
  const { canvas, stateMachine } = options
  let runtime: LumenRiveRuntime | undefined
  let destroyed = false
  let ready = false
  let requestedPlayback = options.autoplay === true
  let status: LumenRiveStatus = 'loading'

  const notify = (next: LumenRiveStatus): void => {
    status = next

    options.onStatus?.(next)
  }

  const syncPlayback = (): void => {
    if (!runtime || !ready || destroyed) return

    const playing = requestedPlayback && !isLumenWorkflowMotionReduced(canvas) && !canvas.ownerDocument.hidden

    if (playing) runtime.play(stateMachine)
    else runtime.pause(stateMachine)
  }

  const resize = (): void => {
    if (!destroyed && ready) runtime?.resizeDrawingSurfaceToCanvas()
  }

  const onLoad = (): void => {
    queueMicrotask(() => {
      if (destroyed || status === 'error') return

      ready = true

      resize()

      syncPlayback()

      notify('ready')
    })
  }

  const onError = (): void => {
    if (destroyed) return

    ready = false

    runtime?.pause(stateMachine)

    notify('error')
  }

  const binding = () => ready && !destroyed ? runtime?.viewModelInstance : undefined

  notify('loading')

  try {
    runtime = (options.createRuntime ?? defaultRuntime)({
      autoBind: true, autoplay: false, canvas, onLoad, onLoadError: onError, src: options.src, stateMachine
    })
  } catch {
    onError()
  }

  const cleanupEnvironment = observeRiveEnvironment(canvas, resize, syncPlayback)

  return {
    destroy: () => {
      if (destroyed) return

      destroyed = true

      cleanupEnvironment()

      runtime?.cleanup()

      runtime = undefined

      notify('destroyed')
    },
    pause: () => {
      requestedPlayback = false

      syncPlayback()
    },
    play: () => {
      requestedPlayback = true

      syncPlayback()

      return ready && !destroyed && !isLumenWorkflowMotionReduced(canvas) && !canvas.ownerDocument.hidden
    },
    setValue: (path, value) => {
      const model = binding()

      if (!model) return false

      if (typeof value === 'number' && Number.isFinite(value)) {
        const property = model.number(path)

        if (!property) return false

        property.value = value

        return true
      }

      if (typeof value === 'boolean') {
        const property = model.boolean(path)

        if (!property) return false

        property.value = value

        return true
      }

      if (typeof value === 'string') {
        const property = model.string(path)

        if (!property) return false

        property.value = value

        return true
      }

      return false
    },
    trigger: path => {
      const property = binding()?.trigger(path)

      if (!property || isLumenWorkflowMotionReduced(canvas)) return false

      property.trigger()

      return true
    }
  }
}
