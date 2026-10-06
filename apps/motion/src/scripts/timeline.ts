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

const fitDevices = (scene: HTMLElement) => {
  const stage = scene.querySelector<HTMLElement>('.composition-stage')

  if (!stage) return

  scene.querySelectorAll<HTMLElement>('.desktop-device, .phone-device').forEach(device => {
    const scale = Math.min(
      (stage.clientWidth - 24) / device.offsetWidth, (stage.clientHeight - 24) / device.offsetHeight
    )

    gsap.set(device, { scale })
  })
}

if (root?.dataset.compositionId) {
  const id = root.dataset.compositionId
  const timeline = gsap.timeline({ paused: true })
  const scenes = root.querySelectorAll<HTMLElement>('.scene')

  gsap.set(scenes, { opacity: 0 })

  const ease = CustomEase.create('lumen-emphasized', root.dataset.ease ?? '')
  const starts = [0, 5, 8, 11]

  scenes.forEach((scene, index) => {
    const start = starts[index] ?? 11
    const pieces = scene.querySelectorAll('.desktop-content .workspace-heading, .desktop-content .ui-stat, .desktop-content .project-heading, .desktop-content .project, .desktop-content .workspace-footer')

    fitDevices(scene)

    timeline.to(scene, { opacity: 1, duration: index === 0 ? 0 : 0.55, ease: 'power2.inOut' }, start)

    const previous = scenes[index - 1]

    if (previous) timeline.to(previous, { opacity: 0, duration: 0.55, ease: 'power2.inOut' }, start)

    if (index === 0) {
      timeline.fromTo(scene.querySelectorAll('.composition-header, .intro, .theme-label, .composition-footer'), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65, stagger: 0.08, ease }, 0.15)

      timeline.fromTo(scene.querySelector('.desktop-device'), { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease }, 0.3)

      timeline.fromTo(pieces, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.03, ease }, 0.25)

      timeline.fromTo(scene.querySelectorAll('.desktop-content [data-slot="progress-indicator"]'), { scaleX: 0, transformOrigin: 'left' }, { scaleX: 1, duration: 0.85, stagger: 0.12, ease }, 1.05)
    }

    if (index === 3) {
      timeline.to(scene.querySelector('.desktop-device'), { opacity: 0, y: -16, duration: 0.6, ease }, 14)

      timeline.fromTo(scene.querySelector('.phone-device'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.85, ease }, 14.25)

      timeline.to(scene, { opacity: 0, duration: 0.6 }, 18)
    }
  })

  timeline.to(root.querySelector('.end-card'), { opacity: 1, duration: 0.6 }, 18)

  timeline.fromTo(root.querySelector('.end-card .lumen-logo'), { scale: 0.94, y: 12 }, { scale: 1, y: 0, duration: 0.8, ease }, 18)

  timeline.fromTo(root.querySelectorAll('.end-card p, .end-card strong'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease }, 18.35)

  timeline.to({}, { duration: 20 }, 0)

  window.__timelines ??= {}

  window.__timelines[id] = timeline

  const publishState = () => {
    if (window.parent === window) return

    window.parent.postMessage({ type: 'lumen-motion-state', time: timeline.time(), playing: !timeline.paused() && timeline.time() < 20 }, window.location.origin)
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

    if (isSeekTime(command.time)) timeline.pause().seek(Math.max(0, Math.min(20, command.time)))
  })

  timeline.seek(2)
}
