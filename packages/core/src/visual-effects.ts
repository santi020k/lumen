import { isLumenWorkflowMotionReduced } from './motion-workflows.js'

export const lumenVisualEffectVariants = ['mesh', 'aurora', 'spotlight', 'grain', 'border', 'draw', 'depth'] as const
export type LumenVisualEffectVariant = typeof lumenVisualEffectVariants[number]

export const normalizeLumenEffectIntensity = (value: unknown): number => typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.5

/** Pointer tracking is optional decoration; content remains operable without this controller. */
export const createLumenSpotlightController = (root: HTMLElement): (() => void) => {
  const view = root.ownerDocument.defaultView
  let frame: number | undefined
  let x = '50%'
  let y = '50%'

  const write = (): void => {
    frame = undefined

    root.style.setProperty('--ui-spotlight-x', x)

    root.style.setProperty('--ui-spotlight-y', y)
  }

  const move = (event: PointerEvent): void => {
    if (event.pointerType === 'touch' || isLumenWorkflowMotionReduced(root)) return

    const rect = root.getBoundingClientRect()

    x = `${Math.min(rect.width, Math.max(0, event.clientX - rect.left))}px`

    y = `${Math.min(rect.height, Math.max(0, event.clientY - rect.top))}px`

    if (frame === undefined && view) frame = view.requestAnimationFrame(write)
  }

  const reset = (): void => {
    if (frame !== undefined) view?.cancelAnimationFrame(frame)

    frame = undefined

    x = '50%'

    y = '50%'

    write()
  }

  const media = view?.matchMedia('(prefers-reduced-motion: reduce)')

  media?.addEventListener('change', reset)

  root.addEventListener('pointermove', move)

  root.addEventListener('pointerleave', reset)

  root.addEventListener('focusout', reset)

  return () => {
    media?.removeEventListener('change', reset)

    root.removeEventListener('pointermove', move)

    root.removeEventListener('pointerleave', reset)

    root.removeEventListener('focusout', reset)

    reset()
  }
}
