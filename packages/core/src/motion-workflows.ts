import { lumenDurations, lumenEasings } from './foundations.generated.js'

export type LumenWorkflowDuration = keyof typeof lumenDurations

export interface LumenMotionGroupOptions {
  duration?: LumenWorkflowDuration
  enterExit?: boolean
}

export interface LumenMotionGroupController {
  destroy(): void

  refresh(): void

  update(change: () => void): void
}

interface MotionSnapshot {
  element: HTMLElement
  rect: DOMRect
}

const durationMilliseconds = (value: string): number => {
  const parsed = Number.parseFloat(value)

  if (value.endsWith('ms')) return parsed

  if (value.endsWith('s')) return parsed * 1000

  return Number.NaN
}

/** Resolve shared motion tokens without requiring a browser during import. */
export const getLumenWorkflowTiming = (
  element: Element, duration: LumenWorkflowDuration = 'standard'
): { duration: number, easing: string } => {
  const style = element.ownerDocument.defaultView?.getComputedStyle(element)
  const token = duration === 'standard' ? '--ui-duration' : `--ui-duration-${duration}`
  const value = style?.getPropertyValue(token).trim() ?? ''
  const milliseconds = durationMilliseconds(value)

  return {
    duration: Number.isFinite(milliseconds) && milliseconds >= 0 ? milliseconds : lumenDurations[duration],
    easing: style?.getPropertyValue('--ui-ease').trim() || `cubic-bezier(${lumenEasings.standard.join(',')})`
  }
}

export const isLumenWorkflowMotionReduced = (element: Element): boolean => Boolean(element.closest('[data-ui-motion="reduce"]')) ||
  Boolean(element.ownerDocument.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches)

const snapshots = (root: HTMLElement): Map<string, MotionSnapshot> => {
  const result = new Map<string, MotionSnapshot>()
  const duplicates = new Set<string>()

  for (const element of root.querySelectorAll<HTMLElement>(':scope > [data-ui-motion-key]')) {
    const key = element.dataset.uiMotionKey

    if (!key || element.hidden || duplicates.has(key)) continue

    if (result.has(key)) {
      result.delete(key)

      duplicates.add(key)

      continue
    }

    result.set(key, { element, rect: element.getBoundingClientRect() })
  }

  return result
}

const exitGhost = (root: HTMLElement, snapshot: MotionSnapshot): HTMLElement | undefined => {
  const descendants = [snapshot.element, ...snapshot.element.querySelectorAll('*')]

  if (descendants.some(element => element.localName.includes('-') || element.matches('iframe, object, embed, audio, video, canvas, script'))) return undefined

  const ghost = snapshot.element.cloneNode(true)
  const view = root.ownerDocument.defaultView

  if (!view || !(ghost instanceof view.HTMLElement)) return undefined

  for (const element of [ghost, ...ghost.querySelectorAll('*')]) {
    for (const name of ['id', 'name', 'autofocus', 'data-ui-motion-key']) element.removeAttribute(name)
  }

  ghost.setAttribute('aria-hidden', 'true')

  ghost.removeAttribute('hidden')

  ghost.inert = true

  ghost.dataset.uiMotionGhost = ''

  const frame = root.getBoundingClientRect()

  Object.assign(ghost.style, {
    height: `${snapshot.rect.height}px`,
    left: `${snapshot.rect.left - frame.left + root.scrollLeft}px`,
    margin: '0',
    pointerEvents: 'none',
    position: 'absolute',
    top: `${snapshot.rect.top - frame.top + root.scrollTop}px`,
    width: `${snapshot.rect.width}px`
  })

  root.append(ghost)

  return ghost
}

/** Animate keyed direct children while leaving DOM ordering and focus with the application. */
export const createLumenMotionGroupController = (
  root: HTMLElement, options: LumenMotionGroupOptions = {}
): LumenMotionGroupController => {
  let previous = snapshots(root)
  let destroyed = false
  const animations = new Map<Animation, (() => void) | undefined>()
  const preference = root.ownerDocument.defaultView?.matchMedia('(prefers-reduced-motion: reduce)')

  const cancel = (): void => {
    for (const [animation, cleanup] of animations) {
      animation.cancel()

      cleanup?.()
    }

    animations.clear()
  }

  const animate = (element: HTMLElement, keyframes: Keyframe[], cleanup?: () => void): void => {
    if (typeof element.animate !== 'function') {
      cleanup?.()

      return
    }

    try {
      const animation = element.animate(keyframes, getLumenWorkflowTiming(root, options.duration))

      animations.set(animation, cleanup)

      const finish = (): void => {
        if (!animations.has(animation)) return

        animations.delete(animation)

        cleanup?.()
      }

      void animation.finished.then(finish, finish)
    } catch {
      cleanup?.()
    }
  }

  const animateChildren = (current: Map<string, MotionSnapshot>): void => {
    for (const [key, snapshot] of current) {
      const old = previous.get(key)

      if (old) {
        const x = old.rect.left - snapshot.rect.left
        const y = old.rect.top - snapshot.rect.top

        if (x || y) animate(snapshot.element, [{ translate: `${x}px ${y}px` }, { translate: '0px 0px' }])
      } else if (options.enterExit !== false) {
        animate(snapshot.element, [{ opacity: 0, translate: '0px 8px' }, { opacity: 1, translate: '0px 0px' }])
      }
    }
  }

  const animateExits = (current: Map<string, MotionSnapshot>): void => {
    if (options.enterExit === false) return

    for (const [key, snapshot] of previous) {
      if (current.has(key)) continue

      const ghost = exitGhost(root, snapshot)

      if (ghost) animate(ghost, [{ opacity: 1 }, { opacity: 0 }], () => {
        ghost.remove()
      })
    }
  }

  const refresh = (): void => {
    if (destroyed) return

    const interrupted = animations.size > 0

    cancel()

    const current = snapshots(root)
    const canAnimate = !interrupted && !isLumenWorkflowMotionReduced(root)

    if (canAnimate && getLumenWorkflowTiming(root, options.duration).duration > 0) {
      animateChildren(current)

      animateExits(current)
    }

    previous = current
  }

  const reduce = (): void => {
    if (preference?.matches) cancel()
  }

  preference?.addEventListener('change', reduce)

  return {
    destroy: () => {
      destroyed = true

      cancel()

      preference?.removeEventListener('change', reduce)

      previous.clear()
    },
    refresh,
    update: change => {
      if (destroyed) {
        change()

        return
      }

      previous = snapshots(root)

      const focused = root.ownerDocument.activeElement

      try {
        change()
      } finally {
        refresh()

        const view = root.ownerDocument.defaultView

        if (view && focused instanceof view.HTMLElement && root.contains(focused) &&
          root.ownerDocument.activeElement === root.ownerDocument.body) focused.focus({ preventScroll: true })
      }
    }
  }
}

/** Observe application-owned child changes; animation ghosts never trigger another refresh. */
export const bindLumenMotionGroup = (
  root: HTMLElement, options: LumenMotionGroupOptions = {}
): (() => void) => {
  const controller = createLumenMotionGroupController(root, options)
  const view = root.ownerDocument.defaultView

  if (!view) return () => {
    controller.destroy()
  }

  const isGhost = (node: Node): boolean => node instanceof view.Element && node.hasAttribute('data-ui-motion-ghost')

  const observer = new view.MutationObserver(records => {
    if (records.some(record => record.type === 'attributes' || [...record.addedNodes, ...record.removedNodes].some(node => !isGhost(node)))) controller.refresh()
  })

  observer.observe(root, { attributeFilter: ['hidden', 'data-ui-motion-key'], attributes: true, childList: true, subtree: true })

  return () => {
    observer.disconnect()

    controller.destroy()
  }
}

/** Execute application updates exactly once, whether a view transition is available or not. */
export const runLumenViewTransition = async (
  ownerDocument: Document, update: () => void | Promise<void>
): Promise<void> => {
  const view = ownerDocument.defaultView

  if (typeof ownerDocument.startViewTransition !== 'function' ||
    view?.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    ownerDocument.documentElement.dataset.uiMotion === 'reduce') {
    await update()

    return
  }

  let pendingUpdate: Promise<void> | undefined

  const once = (): Promise<void> => {
    pendingUpdate ??= Promise.resolve().then(update)

    return pendingUpdate
  }

  let transition: ViewTransition

  try {
    transition = ownerDocument.startViewTransition(once)
  } catch {
    await once()

    return
  }

  // Rendering/animation failures must not suppress a successful application update.
  void transition.ready.catch(() => undefined)

  void transition.finished.catch(() => undefined)

  await transition.updateCallbackDone

  await transition.finished.catch(() => undefined)
}
