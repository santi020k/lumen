const frame = document.querySelector<HTMLIFrameElement>('#composition')
const container = document.querySelector<HTMLElement>('.frame-container')
const play = document.querySelector<HTMLButtonElement>('#play')
const playbackStatus = document.querySelector<HTMLElement>('#playback-status')
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const themeButtons = document.querySelectorAll<HTMLButtonElement>('[data-time]')
let selectedTime = 2
let playing = false

const isPlaybackTime = (time: unknown): time is number => (
  typeof time === 'number' && Number.isFinite(time) && time >= 0 && time <= 18
)

const isPlaybackState = (state: unknown): state is { type: string, time: number, playing: boolean } => {
  if (typeof state !== 'object' || state === null) return false

  if (!('type' in state) || state.type !== 'lumen-motion-state') return false

  if (!('time' in state) || !isPlaybackTime(state.time)) return false

  return 'playing' in state && typeof state.playing === 'boolean'
}

const send = (type: string, time?: number) => {
  frame?.contentWindow?.postMessage({ type, time }, window.location.origin)
}

const updateState = (time: number, active: boolean) => {
  playing = active

  const index = Math.min(2, Math.floor(time / 6))

  themeButtons.forEach((button, buttonIndex) => {
    button.setAttribute('aria-pressed', String(buttonIndex === index))
  })

  const themeName = ['Lumen Light', 'Lumen Dark', 'Studio'][index] ?? 'Lumen Light'

  if (playbackStatus) playbackStatus.textContent = `${active ? 'Playing' : 'Paused'} · ${themeName}`
}

const resize = () => {
  if (!frame || !container) return

  const format = container.dataset.previewFormat
  const width = format === 'landscape' ? 1920 : 1080
  const height = format === 'portrait' ? 1920 : 1080

  frame.style.width = `${width}px`

  frame.style.height = `${height}px`

  frame.style.transform = `scale(${container.clientWidth / width})`
}

if (container) new ResizeObserver(resize).observe(container)

frame?.addEventListener('load', () => {
  resize()

  send('lumen-motion-seek', selectedTime)

  updateState(selectedTime, false)
})

document.querySelectorAll<HTMLButtonElement>('[data-format]').forEach(button => {
  button.addEventListener('click', () => {
    const format = button.dataset.format

    if (!frame || !container || (format !== 'portrait' && format !== 'square' && format !== 'landscape')) return

    container.dataset.previewFormat = format

    frame.src = `/${format}/`

    document.querySelectorAll<HTMLButtonElement>('[data-format]').forEach(choice => {
      choice.setAttribute('aria-pressed', String(choice === button))
    })

    updateState(selectedTime, false)

    resize()
  })
})

themeButtons.forEach(button => {
  button.addEventListener('click', () => {
    selectedTime = Number(button.dataset.time)

    send('lumen-motion-seek', selectedTime)

    updateState(selectedTime, false)
  })
})

play?.addEventListener('click', () => {
  if (reducedMotion.matches) return

  send('lumen-motion-play')

  updateState(0, true)
})

document.querySelector('#pause')?.addEventListener('click', () => {
  send('lumen-motion-pause')

  updateState(selectedTime, false)
})

window.addEventListener('message', (event: MessageEvent<unknown>) => {
  if (event.origin !== window.location.origin || event.source !== frame?.contentWindow) return

  const state = event.data

  if (!isPlaybackState(state)) return

  selectedTime = state.time

  updateState(state.time, state.playing)
})

const syncMotionPreference = () => {
  if (play) play.disabled = reducedMotion.matches

  const notice = document.querySelector<HTMLElement>('#motion-preference')

  if (notice) notice.hidden = !reducedMotion.matches

  if (reducedMotion.matches && playing) {
    send('lumen-motion-pause')

    updateState(selectedTime, false)
  }
}

reducedMotion.addEventListener('change', syncMotionPreference)

syncMotionPreference()

resize()
