import { isLuState, type LuSnapshot, type LuState, mountLu } from '@santi020k/lumen/lu'
import atlas from '@santi020k/lumen/lu/sprites.webp?url'

const descriptions: Record<LuState, string> = {
  idle: 'A gentle breath and blink.',
  thinking: 'A curious tilt while Lu thinks.',
  celebration: 'A happy hop, then back to idle.'
}

export const mountLuDemo = (root: HTMLElement): (() => void) => {
  const mascot = root.querySelector<HTMLElement>('[data-lu-mascot]')
  const playback = root.querySelector<HTMLButtonElement>('[data-lu-playback]')
  const status = root.querySelector<HTMLElement>('[data-lu-status]')
  const controls = root.querySelector<HTMLElement>('[data-lu-controls]')
  const choices = [...root.querySelectorAll<HTMLButtonElement>('[data-lu-choice]')]

  if (!mascot || !playback || !status || !controls) return () => { /* No player was mounted. */ }

  const render = (snapshot: LuSnapshot) => {
    controls.inert = snapshot.status !== 'ready'

    for (const button of choices) {
      button.disabled = snapshot.status !== 'ready'

      button.setAttribute('aria-pressed', String(button.dataset.luChoice === snapshot.state))
    }

    playback.disabled = snapshot.status !== 'ready' || snapshot.reducedMotion

    playback.textContent = snapshot.playing ? 'Pause' : 'Play'

    playback.setAttribute('aria-label', snapshot.playing ? 'Pause Lu animation' : 'Play Lu animation')

    if (snapshot.status === 'error') {
      status.textContent = 'Lu is resting. Refresh to try the animation again.'
    } else if (snapshot.reducedMotion) {
      status.textContent = 'Reduced motion is on. Choose a still pose.'
    } else {
      status.textContent = snapshot.playing ? descriptions[snapshot.state] : 'Lu is resting. Choose a state to start.'
    }
  }

  const player = mountLu(mascot, { atlas, onChange: render })
  const events = new AbortController()

  for (const button of choices) {
    button.addEventListener('click', () => {
      const state = button.dataset.luChoice

      if (!isLuState(state)) return

      player.setState(state)

      player.play()
    }, { signal: events.signal })
  }

  playback.addEventListener('click', () => {
    if (player.snapshot.playing) player.pause()
    else player.play()
  }, { signal: events.signal })

  render(player.snapshot)

  return () => {
    events.abort()

    player.destroy()
  }
}
