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

    // Fractional frame dimensions must not change how GSAP resolves percentage centering.
    gsap.set(device, { scale, x: 0, y: 0, xPercent: -50, yPercent: -50 })
  })
}

if (root?.dataset.compositionId) {
  const id = root.dataset.compositionId
  const timeline = gsap.timeline({ paused: true })
  const scenes = root.querySelectorAll<HTMLElement>('.scene')

  if (scenes.length) gsap.set(scenes, { autoAlpha: 0 })

  const ease = CustomEase.create('lumen-emphasized', root.dataset.ease ?? '')
  const duration = Number(root.dataset.duration)
  const outroStart = Number(root.dataset.outroStart)

  scenes.forEach((scene, index) => {
    const start = Number(scene.dataset.sceneStart)
    const pieces = scene.querySelectorAll('.desktop-content .workspace-heading, .desktop-content .ui-stat, .desktop-content .project-heading, .desktop-content .project, .desktop-content .workspace-footer')

    fitDevices(scene)

    timeline.to(scene, { autoAlpha: 1, duration: index === 0 ? 0 : 0.4, ease: 'power2.inOut' }, start)

    const previous = scenes[index - 1]

    if (previous) timeline.to(previous, { autoAlpha: 0, duration: 0.4, ease: 'power2.inOut' }, start)

    timeline.fromTo(scene.querySelectorAll('.intro, .theme-label'), { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease }, start + 0.08)

    timeline.fromTo(pieces, { y: 10, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.42, stagger: 0.035, ease
    }, start + 0.16)

    const indicators = scene.querySelectorAll('.desktop-content [data-slot="progress-indicator"]')

    timeline.fromTo(indicators, { scaleX: 0.15, transformOrigin: 'left' }, { scaleX: 1, duration: 0.9, stagger: 0.12, ease }, start + 0.7)

    timeline.fromTo(scene.querySelectorAll('.desktop-content .project-art'), { y: 6 }, { y: 0, duration: 0.9, stagger: 0.1, ease }, start + 0.5)

    if (index === 0) {
      timeline.fromTo(scene.querySelectorAll('.composition-header, .composition-footer'), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease }, 0.1)

      timeline.fromTo(scene.querySelector('.desktop-device'), { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease }, 0.18)
    }

    const lights = scene.querySelectorAll('.glass-light-field span')

    if (lights.length) {
      timeline.fromTo(lights, { xPercent: -12, yPercent: -8, rotation: -12 }, { xPercent: 18, yPercent: 12, rotation: 18, duration: 3.4, stagger: 0.08, ease: 'sine.inOut' }, start)
    }

    if (index === scenes.length - 1) {
      timeline.to(scene.querySelector('.desktop-device'), { opacity: 0, y: -24, duration: 0.45, ease }, 9.7)

      timeline.fromTo(scene.querySelector('.phone-device'), { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.65, ease }, 9.85)

      timeline.fromTo(scene.querySelectorAll('.phone-screen .workspace-heading, .phone-screen .ui-stat, .phone-screen .project, .phone-screen .workspace-footer'), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.055, ease }, 9.95)

      timeline.fromTo(scene.querySelectorAll('.phone-screen [data-slot="progress-indicator"]'), { scaleX: 0.1, transformOrigin: 'left' }, { scaleX: 1, duration: 0.65, stagger: 0.1, ease }, 10.45)

      timeline.to(scene, { autoAlpha: 0, duration: 0.4 }, outroStart)
    }
  })

  // Shared by the complete film and each standalone brand ending.
  timeline.to(root.querySelector('.end-card'), { opacity: 1, duration: 0.4 }, outroStart)

  timeline.fromTo(root.querySelector('.brand-light'), { scale: 0.5, rotation: -25, opacity: 0 }, { scale: 1.15, rotation: 15, opacity: 1, duration: 2.6, ease: 'power2.out' }, outroStart)

  timeline.fromTo(root.querySelectorAll('.brand-orbit'), { scale: 0.65, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.5, stagger: 0.12, ease }, outroStart + 0.05)

  timeline.fromTo(root.querySelector('.end-logo-mark'), { scale: 0.72, rotation: -10, y: 24, opacity: 0 }, { scale: 1, rotation: 0, y: 0, opacity: 1, duration: 0.8, ease }, outroStart + 0.1)

  timeline.fromTo(root.querySelector('.end-logo-mark circle'), { scale: 0, transformOrigin: 'center' }, { scale: 1, duration: 0.55, ease: 'back.out(2)' }, outroStart + 0.55)

  timeline.fromTo(root.querySelector('.end-card .lumen-logo__wordmark'), { clipPath: 'inset(0 100% 0 0)', x: -12, opacity: 0 }, { clipPath: 'inset(0 0% 0 0)', x: 0, opacity: 1, duration: 0.7, ease }, outroStart + 0.28)

  timeline.fromTo(root.querySelectorAll('.end-card p, .end-card strong'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.1, ease }, outroStart + 0.48)

  timeline.to({}, { duration }, 0)

  window.__timelines ??= {}

  window.__timelines[id] = timeline

  const publishState = () => {
    if (window.parent === window) return

    window.parent.postMessage({ type: 'lumen-motion-state', time: timeline.time(), playing: !timeline.paused() && timeline.time() < duration }, window.location.origin)
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

    if (isSeekTime(command.time)) timeline.pause().seek(Math.max(0, Math.min(duration, command.time)))
  })

  timeline.seek(2)
}
