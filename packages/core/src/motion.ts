import { lumenDurations, lumenMotion } from './tokens.js'

export type LumenMotionPreset = 'fade' | 'slide-up' | 'scale'
export type LumenMotionDuration = 'fast' | 'standard' | 'slow'
export type LumenMotionResult = 'finished' | 'cancelled' | 'skipped'

export interface LumenPresenceOptions {
  duration?: LumenMotionDuration
  phase?: 'enter' | 'exit'
  preset?: LumenMotionPreset
  signal?: AbortSignal
}

const activeAnimations = new WeakMap<HTMLElement, Animation>()

const readDuration = (style: CSSStyleDeclaration, duration: LumenMotionDuration): number => {
  const token = duration === 'standard' ? '--ui-duration' : `--ui-duration-${duration}`
  const match = /^(\d+(?:\.\d+)?|\.\d+)(ms|s)$/.exec(style.getPropertyValue(token).trim())

  if (!match) return lumenDurations[duration]

  const value = Number(match[1]) * (match[2] === 's' ? 1000 : 1)

  return Number.isFinite(value) ? value : lumenDurations[duration]
}

const presenceFrames = (style: CSSStyleDeclaration, preset: LumenMotionPreset): Keyframe[] => {
  const transform = style.transform || 'none'
  const baseTransform = transform === 'none' ? '' : `${transform} `
  let offsetTransform = transform

  if (preset === 'scale') offsetTransform = `${baseTransform}scale(0.96)`

  if (preset === 'slide-up') offsetTransform = `${baseTransform}translateY(0.75rem)`

  return [
    { opacity: '0', transform: offsetTransform },
    { opacity: style.opacity || '1', transform }
  ]
}

const settleAnimation = async (
  animation: Animation, preference: MediaQueryList, signal?: AbortSignal
): Promise<LumenMotionResult> => {
  const state = { reduced: false }

  const cancel = (): void => {
    animation.cancel()
  }

  const onPreferenceChange = (event: MediaQueryListEvent): void => {
    if (!event.matches) return

    state.reduced = true

    cancel()
  }

  signal?.addEventListener('abort', cancel, { once: true })

  preference.addEventListener('change', onPreferenceChange)

  if (signal?.aborted) cancel()

  try {
    await animation.finished

    return 'finished'
  } catch (error: unknown) {
    if (animation.playState === 'idle') return state.reduced ? 'skipped' : 'cancelled'

    throw error
  } finally {
    signal?.removeEventListener('abort', cancel)

    preference.removeEventListener('change', onPreferenceChange)
  }
}

const motionContext = (element: HTMLElement) => {
  const view = element.ownerDocument.defaultView

  if (!view || !element.isConnected || typeof element.animate !== 'function') return undefined

  if (typeof view.matchMedia !== 'function') return undefined

  const preference = view.matchMedia('(prefers-reduced-motion: reduce)')

  if (preference.matches || element.closest('[data-ui-motion="reduce"]')) return undefined

  return { preference, style: view.getComputedStyle(element) }
}

const startPresence = (element: HTMLElement, style: CSSStyleDeclaration, options: LumenPresenceOptions) => {
  const duration = readDuration(style, options.duration ?? 'standard')

  if (duration === 0) return undefined

  const frames = presenceFrames(style, options.preset ?? 'fade')

  if (options.phase === 'exit') frames.reverse()

  return element.animate(frames, {
    duration,
    easing: style.getPropertyValue('--ui-ease-emphasized').trim() || lumenMotion.easeEmphasized
  })
}

/** Animate presentation only; consumers retain DOM, focus, and framework state ownership. */
export const animateLumenPresence = async (
  element: HTMLElement, options: LumenPresenceOptions = {}
): Promise<LumenMotionResult> => {
  // An aborted request must not cancel another caller's active animation.
  if (options.signal?.aborted) return 'cancelled'

  activeAnimations.get(element)?.cancel()

  const context = motionContext(element)

  if (!context) return 'skipped'

  const animation = startPresence(element, context.style, options)

  if (!animation) return 'skipped'

  activeAnimations.set(element, animation)

  try {
    return await settleAnimation(animation, context.preference, options.signal)
  } finally {
    if (activeAnimations.get(element) === animation) activeAnimations.delete(element)
  }
}
