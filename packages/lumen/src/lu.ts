import manifest from './lu-manifest.json' with { type: 'json' }

export type LuState = keyof typeof manifest.states

export interface LuSnapshot {
  readonly state: LuState
  readonly playing: boolean
  readonly reducedMotion: boolean
  readonly status: 'loading' | 'ready' | 'error'
}

export interface LuPlayerOptions {
  /** URL emitted by the consumer's bundler or served from its public directory. */
  atlas: string
  state?: LuState
  autoplay?: boolean
  /** Reports meaningful changes, never individual animation frames. */
  onChange?: (snapshot: LuSnapshot) => void
}

export interface LuPlayer {
  readonly snapshot: LuSnapshot
  setState: (state: LuState) => void
  play: () => void
  pause: () => void
  destroy: () => void
}

const mounted = new WeakSet<HTMLElement>()

export const isLuState = (value: unknown): value is LuState => typeof value === 'string' && Object.hasOwn(manifest.states, value)

/**
 * Mount Lu's optional sprite player. Import its CSS separately and retain an
 * image child as the server-rendered, loading and failure fallback.
 */
export const mountLu = (element: HTMLElement, options: LuPlayerOptions): LuPlayer => {
  const document = element.ownerDocument
  const view = document.defaultView
  const initialState = options.state ?? 'idle'

  if (!view) throw new TypeError('Lu needs an element belonging to a browser document.')

  if (typeof options.atlas !== 'string' || !options.atlas.trim()) throw new TypeError('Lu needs an atlas URL.')

  if (!isLuState(initialState)) throw new TypeError('Unknown Lu animation state.')

  if (mounted.has(element)) throw new Error('Destroy the existing Lu player before mounting another.')

  const media = view.matchMedia('(prefers-reduced-motion: reduce)')
  const image = document.createElement('img')
  const attributes = ['data-lu-state', 'data-lu-frame', 'data-lu-ready'] as const
  const previousAttributes = attributes.map(name => [name, element.getAttribute(name)] as const)
  const properties = ['background-image', 'background-position'] as const

  const previousStyles = properties.map(name => [
    name, element.style.getPropertyValue(name), element.style.getPropertyPriority(name)
  ] as const)

  const hadClass = element.classList.contains('lumen-lu')
  let state: LuState = initialState
  let status: LuSnapshot['status'] = 'loading'
  let playing = options.autoplay ?? false
  let destroyed = false
  let startedLoading = false
  let elapsed = 0
  let lastTime: number | null = null
  let request: number | null = null
  let visible = typeof IntersectionObserver === 'undefined'
  const snapshot = (): LuSnapshot => ({ state, playing, reducedMotion: media.matches, status })
  const notify = () => options.onChange?.(snapshot())

  const draw = (frame: number) => {
    element.style.backgroundPosition = `${frame / (manifest.columns - 1) * 100}% ${manifest.states[state].row / (manifest.rows - 1) * 100}%`

    element.dataset.luState = state

    element.dataset.luFrame = String(frame)
  }

  const stopClock = () => {
    if (request !== null) view.cancelAnimationFrame(request)

    request = null

    lastTime = null
  }

  const canAnimate = () => !destroyed && status === 'ready' && playing && visible && !document.hidden && !media.matches

  const queueFrame = (callback: FrameRequestCallback) => {
    if (canAnimate() && request === null) request = view.requestAnimationFrame(callback)
  }

  const tick = (time: number) => {
    request = null

    if (!canAnimate()) return

    if (lastTime !== null) elapsed += Math.max(0, time - lastTime)

    lastTime = time

    const animation = manifest.states[state]
    const duration = animation.durations.reduce((sum, value) => sum + value, 0)

    if (elapsed >= duration && !animation.loop) {
      state = 'idle'

      elapsed = 0

      draw(0)

      notify()
    } else {
      elapsed %= duration

      let remaining = elapsed
      let frame = 0

      for (const delay of animation.durations) {
        if (remaining < delay) break

        remaining -= delay

        frame++
      }

      draw(frame)
    }

    // A consumer callback may pause or destroy the player.
    queueFrame(tick)
  }

  const updateClock = () => {
    stopClock()

    queueFrame(tick)
  }

  const startLoading = () => {
    if (startedLoading || destroyed || !visible) return

    startedLoading = true

    image.src = options.atlas
  }

  const observer = typeof IntersectionObserver === 'undefined' ?
    null :
    new IntersectionObserver(entries => {
      const entry = entries.find(item => item.target === element)

      if (!entry || destroyed) return

      visible = entry.isIntersecting

      startLoading()

      updateClock()
    })

  const onMotionPreference = () => {
    if (media.matches) {
      elapsed = 0

      draw(0)
    }

    updateClock()

    notify()
  }

  image.onload = () => {
    if (destroyed) return

    element.style.backgroundImage = `url(${JSON.stringify(options.atlas)})`

    element.dataset.luReady = 'true'

    status = 'ready'

    updateClock()

    notify()
  }

  image.onerror = () => {
    if (destroyed) return

    status = 'error'

    element.dataset.luReady = 'false'

    updateClock()

    notify()
  }

  mounted.add(element)

  element.classList.add('lumen-lu')

  element.dataset.luReady = 'false'

  draw(0)

  document.addEventListener('visibilitychange', updateClock)

  media.addEventListener('change', onMotionPreference)

  observer?.observe(element)

  startLoading()

  return {
    get snapshot() {
      return snapshot()
    },
    setState(next) {
      if (destroyed) return

      if (!isLuState(next)) throw new TypeError('Unknown Lu animation state.')

      state = next

      elapsed = 0

      draw(0)

      updateClock()

      notify()
    },
    play() {
      if (destroyed) return

      playing = true

      updateClock()

      notify()
    },
    pause() {
      if (destroyed) return

      playing = false

      updateClock()

      notify()
    },
    destroy() {
      if (destroyed) return

      destroyed = true

      playing = false

      stopClock()

      observer?.disconnect()

      document.removeEventListener('visibilitychange', updateClock)

      media.removeEventListener('change', onMotionPreference)

      image.onload = null

      image.onerror = null

      for (const [name, value] of previousAttributes) {
        if (value === null) element.removeAttribute(name)
        else element.setAttribute(name, value)
      }

      for (const [name, value, priority] of previousStyles) {
        if (value) element.style.setProperty(name, value, priority)
        else element.style.removeProperty(name)
      }

      if (!hadClass) element.classList.remove('lumen-lu')

      mounted.delete(element)
    }
  }
}
