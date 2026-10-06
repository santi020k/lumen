import type { LumenChartDatum } from './charts.js'
import { getLumenWorkflowTiming, isLumenWorkflowMotionReduced, type LumenWorkflowDuration } from './motion-workflows.js'

export const getLumenChartMotionKey = (seriesId: string, point: Pick<LumenChartDatum, 'id' | 'x'>): string => (
  JSON.stringify([seriesId, point.id ?? [typeof point.x, point.x]])
)

interface MarkSnapshot { element: SVGElement, frame: Keyframe }

const geometryProperties = ['cx', 'cy', 'r', 'x', 'y', 'width', 'height', 'd'] as const

const captureFrame = (element: SVGElement): Keyframe => {
  const frame: Keyframe = {}
  const css = element.ownerDocument.defaultView?.CSS

  for (const property of geometryProperties) {
    const value = element.getAttribute(property)

    if (value === null) continue

    if (property === 'd') {
      const path = `path("${value}")`

      if (css?.supports('d', path)) frame.d = path
    } else if (Number.isFinite(Number(value))) frame[property] = `${value}px`
  }

  return frame
}

const captureMarks = (root: HTMLElement): Map<string, MarkSnapshot> => {
  const result = new Map<string, MarkSnapshot>()
  const duplicate = new Set<string>()

  for (const element of root.querySelectorAll<SVGElement>('[data-ui-chart-motion-key]')) {
    const key = element.getAttribute('data-ui-chart-motion-key')

    if (!key || duplicate.has(key)) continue

    if (result.has(key)) {
      result.delete(key)

      duplicate.add(key)

      continue
    }

    const frame = captureFrame(element)

    result.set(key, { element, frame })
  }

  return result
}

/** Animates decorative SVG geometry only. Tables, summaries, and activation values update immediately. */
export const bindLumenChartMotion = (root: HTMLElement, duration: LumenWorkflowDuration = 'standard'): (() => void) => {
  let previous = captureMarks(root)
  const active = new Map<SVGElement, Animation>()

  const cancel = () => {
    for (const animation of active.values()) animation.cancel()

    active.clear()
  }

  const captureInterruptedFrames = () => {
    const view = root.ownerDocument.defaultView

    if (!view) return

    for (const snapshot of previous.values()) {
      if (!active.has(snapshot.element) || !snapshot.element.isConnected) continue

      const style = view.getComputedStyle(snapshot.element)

      for (const property of geometryProperties) {
        if (!(property in snapshot.frame)) continue

        const value = style.getPropertyValue(property)

        if (value) snapshot.frame[property] = value
      }
    }
  }

  const refresh = () => {
    captureInterruptedFrames()

    const next = captureMarks(root)

    cancel()

    if (!isLumenWorkflowMotionReduced(root)) {
      const timing = getLumenWorkflowTiming(root, duration)

      for (const [key, snapshot] of next) {
        if (typeof snapshot.element.animate !== 'function' || timing.duration === 0) continue

        const old = previous.get(key)
        const frames = old ? [old.frame, snapshot.frame] : [{ opacity: 0 }, { opacity: 1 }]

        if (old && JSON.stringify(old.frame) === JSON.stringify(snapshot.frame)) continue

        let animation: Animation

        try {
          animation = snapshot.element.animate(frames, timing)
        } catch {
          continue
        }

        active.set(snapshot.element, animation)

        void animation.finished.then(() => {
          if (active.get(snapshot.element) === animation) active.delete(snapshot.element)

          return undefined
        }, () => {
          if (active.get(snapshot.element) === animation) active.delete(snapshot.element)

          return undefined
        })
      }
    }

    previous = next
  }

  const observer = new MutationObserver(refresh)

  observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: [...geometryProperties, 'hidden', 'data-ui-chart-motion-key', 'data-ui-motion'] })

  const media = root.ownerDocument.defaultView?.matchMedia('(prefers-reduced-motion: reduce)')

  media?.addEventListener('change', refresh)

  return () => {
    observer.disconnect()

    media?.removeEventListener('change', refresh)

    cancel()
  }
}
