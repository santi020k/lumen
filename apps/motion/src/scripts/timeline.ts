import type { gsap as Gsap } from 'gsap'

declare const gsap: typeof Gsap

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

  scenes.forEach((scene, index) => {
    const start = index * 4

    timeline.to(scene, { opacity: 1, duration: index === 0 ? 0 : 0.55, ease: 'power2.inOut' }, start)

    if (index > 0) {
      const previous = scenes[index - 1]

      if (previous) timeline.to(previous, { opacity: 0, duration: 0.55, ease: 'power2.inOut' }, start)
    }
  })

  timeline.fromTo('.intro', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out' }, 0)

  timeline.to({}, { duration: 12 }, 0)

  window.__timelines ??= {}

  window.__timelines[id] = timeline

  const publishState = () => {
    if (window.parent === window) return

    window.parent.postMessage({ type: 'lumen-motion-state', time: timeline.time(), playing: !timeline.paused() && timeline.time() < 12 }, window.location.origin)
  }

  timeline.eventCallback('onUpdate', publishState)

  timeline.eventCallback('onComplete', publishState)

  // The local preview controls this same paused timeline. HyperFrames owns export seeking.
  window.addEventListener('message', (event: MessageEvent<unknown>) => {
    if (event.origin !== window.location.origin || event.source !== window.parent) return

    const command = event.data

    if (!isCommand(command)) return

    if (command.type === 'lumen-motion-play') timeline.restart()

    if (command.type === 'lumen-motion-pause') timeline.pause()

    if (command.type !== 'lumen-motion-seek') return

    if (isSeekTime(command.time)) timeline.pause().seek(Math.max(0, Math.min(12, command.time)))
  })

  timeline.seek(1)
}
