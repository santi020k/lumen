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

const addDeviceMorph = (
  timeline: ReturnType<typeof Gsap.timeline>,
  scene: HTMLElement,
  index: number,
  ease: ReturnType<typeof Ease.create>
) => {
  const viewport = scene.querySelector<HTMLElement>('.viewport')
  const desktop = scene.querySelector<HTMLElement>('.desktop-content')
  const stage = scene.querySelector<HTMLElement>('.composition-stage')

  if (!viewport || !desktop || !stage) return

  const start = index * 6
  const beginsOnPhone = index === 1
  const scale = Math.min((stage.clientHeight - 24) / 868, (stage.clientWidth - 32) / 414)
  const wide = { width: '100%', height: desktop.getBoundingClientRect().height, borderRadius: getComputedStyle(viewport).borderRadius }
  const phone = { width: 414 * scale, height: 868 * scale, borderRadius: 55 * scale }
  const layers = scene.querySelectorAll('.phone-screen, .phone-hardware')

  const state = beginsOnPhone ?
    { from: phone, to: wide, desktop: 0, mobile: 1 } :
    { from: wide, to: phone, desktop: 1, mobile: 0 }

  viewport.style.setProperty('--phone-scale', String(scale))

  timeline.fromTo(viewport, state.from, {
    ...state.to, duration: 1.1, ease
  }, start + 3.2)

  timeline.fromTo(desktop, { opacity: state.desktop }, {
    opacity: state.mobile, duration: 0.2
  }, start + (state.desktop ? 3.05 : 3.95))

  timeline.fromTo(layers, { opacity: state.mobile }, {
    opacity: state.desktop, duration: 0.2
  }, start + (state.mobile ? 3.05 : 3.95))
}

if (root?.dataset.compositionId) {
  const id = root.dataset.compositionId
  const timeline = gsap.timeline({ paused: true })
  const scenes = root.querySelectorAll<HTMLElement>('.scene')

  gsap.set(scenes, { opacity: 0 })

  const ease = CustomEase.create('lumen-emphasized', root.dataset.ease ?? '')

  scenes.forEach((scene, index) => {
    const start = index * 6
    const viewport = scene.querySelector('.viewport')
    const pieces = scene.querySelectorAll('.desktop-content .workspace-heading, .desktop-content .ui-stat, .desktop-content .project-heading, .desktop-content .project, .desktop-content .workspace-footer')

    timeline.to(scene, { opacity: 1, duration: index === 0 ? 0 : 0.65, ease: 'power2.inOut' }, start)

    if (index > 0) {
      const previous = scenes[index - 1]

      if (previous) timeline.to(previous, { opacity: 0, duration: 0.65, ease: 'power2.inOut' }, start)
    }

    addDeviceMorph(timeline, scene, index, ease)

    if (index === 0) {
      timeline.fromTo(scene.querySelector('.intro'), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease }, 0)

      timeline.fromTo(viewport, { y: 28 }, { y: 0, duration: 0.9, ease }, 0.15)

      const entrance = { y: 0, opacity: 1, duration: 0.5, stagger: 0.045, ease }

      timeline.fromTo(pieces, { y: 14, opacity: 0 }, entrance, 0.1)

      timeline.fromTo(scene.querySelectorAll('.desktop-content [data-slot="progress-indicator"]'), { scaleX: 0, transformOrigin: 'left' }, { scaleX: 1, duration: 1.1, stagger: 0.12, ease }, 0.8)
    }
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
