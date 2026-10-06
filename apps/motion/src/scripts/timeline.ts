import type { gsap as Gsap } from 'gsap'
import type { CustomEase as Ease } from 'gsap/CustomEase'

declare const gsap: typeof Gsap

declare const CustomEase: typeof Ease

declare global {
  interface Window {
    __timelines?: Record<string, ReturnType<typeof Gsap.timeline>>
  }
}

const root = document.querySelector<HTMLElement>('[data-composition-id]')
const isSeekTime = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

const isCommand = (value: unknown): value is { type: unknown, time?: unknown } => (
  typeof value === 'object' && value !== null && 'type' in value
)

if (root?.dataset.compositionId) {
  const id = root.dataset.compositionId
  const timeline = gsap.timeline({ paused: true })
  const scenes = root.querySelectorAll<HTMLElement>('.scene')

  gsap.set(scenes, { opacity: 0 })

  const ease = CustomEase.create('lumen-emphasized', root.dataset.ease ?? '')
  const compactWidth = root.dataset.format === 'landscape' ? '46%' : '82%'

  scenes.forEach((scene, index) => {
    const start = index * 6
    const viewport = scene.querySelector('.viewport')
    const pieces = scene.querySelectorAll('.workspace-heading, .ui-stat, .project-heading, .project, .workspace-footer')

    timeline.to(scene, { opacity: 1, duration: index === 0 ? 0 : 0.65, ease: 'power2.inOut' }, start)

    if (index > 0) {
      const previous = scenes[index - 1]

      if (previous) timeline.to(previous, { opacity: 0, duration: 0.65, ease: 'power2.inOut' }, start)
    }

    const layout = index === 1 ?
      { initial: compactWidth, target: '100%', wide: 0, compact: 1 } :
      { initial: '100%', target: compactWidth, wide: 1, compact: 0 }

    timeline.fromTo(viewport, { width: layout.initial }, { width: layout.target, duration: 1.6, ease }, start + 3)

    if (index === 0) {
      timeline.fromTo(scene.querySelector('.intro'), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease }, 0)

      timeline.fromTo(viewport, { y: 28 }, { y: 0, duration: 0.9, ease }, 0.15)

      const entrance = { y: 0, opacity: 1, duration: 0.5, stagger: 0.045, ease }

      timeline.fromTo(pieces, { y: 14, opacity: 0 }, entrance, 0.1)

      timeline.fromTo(scene.querySelectorAll('[data-slot="progress-indicator"]'), { scaleX: 0, transformOrigin: 'left' }, { scaleX: 1, duration: 1.1, stagger: 0.12, ease }, 0.8)
    }

    timeline.fromTo(scene.querySelector('.layout-wide'), { opacity: layout.wide }, { opacity: 1 - layout.wide, duration: 0.2 }, start + (layout.wide ? 3.2 : 3.55))

    timeline.fromTo(scene.querySelector('.layout-compact'), { opacity: layout.compact }, { opacity: 1 - layout.compact, duration: 0.2 }, start + (layout.compact ? 3.2 : 3.55))
  })

  timeline.to({}, { duration: 18 }, 0)

  window.__timelines ??= {}

  window.__timelines[id] = timeline

  const publishState = () => {
    if (window.parent === window) return

    window.parent.postMessage({ type: 'lumen-motion-state', time: timeline.time(), playing: !timeline.paused() && timeline.time() < 18 }, window.location.origin)
  }

  timeline.eventCallback('onUpdate', publishState)

  timeline.eventCallback('onComplete', publishState)

  // The local preview controls this same paused timeline. HyperFrames owns export seeking.
  window.addEventListener('message', (event: MessageEvent<unknown>) => {
    if (event.origin !== window.location.origin || event.source !== window.parent) return

    const command = event.data

    if (!isCommand(command)) return

    if (command.type === 'lumen-motion-play') timeline.restart()

    if (command.type === 'lumen-motion-pause') {
      timeline.pause()

      publishState()
    }

    if (command.type !== 'lumen-motion-seek') return

    if (isSeekTime(command.time)) timeline.pause().seek(Math.max(0, Math.min(18, command.time)))
  })

  timeline.seek(2)
}
