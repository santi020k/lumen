// @vitest-environment jsdom

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { isLuState, type LuPlayer, type LuSnapshot, mountLu } from './lu.js'

let element: HTMLSpanElement
let images: HTMLImageElement[]
let sources: string[]
let frames: Map<number, FrameRequestCallback>
let nextId: number
let players: LuPlayer[]
let motion: MotionPreference

class MotionPreference extends EventTarget {
  matches = false
}

beforeEach(() => {
  element = document.createElement('span')
  element.innerHTML = '<img alt="Lu">'
  document.body.append(element)
  images = []
  sources = []
  frames = new Map()
  nextId = 0
  players = []
  motion = new MotionPreference()
  vi.stubGlobal('matchMedia', () => motion)
  vi.stubGlobal('IntersectionObserver', undefined)
  vi.spyOn(HTMLImageElement.prototype, 'src', 'set').mockImplementation(function (this: HTMLImageElement, value: string) {
    images.push(this)
    sources.push(value)
  })
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
    const id = ++nextId
    frames.set(id, callback)
    return id
  })
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => {
    frames.delete(id)
  })
})

afterEach(() => {
  for (const player of players) player.destroy()
  document.body.replaceChildren()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const step = (time: number) => {
  const pending = [...frames.values()]
  frames.clear()
  for (const callback of pending) callback(time)
}

const loaded = () => {
  const image = images.at(-1)
  if (!image) throw new Error('No atlas requested')
  image.dispatchEvent(new Event('load'))
}

const create = (options: Parameters<typeof mountLu>[1] = { atlas: '/lu.webp' }) => {
  const player = mountLu(element, options)
  players.push(player)
  return player
}

test('recognizes only the three supported states, including untrusted values', () => {
  for (const state of ['idle', 'thinking', 'celebration']) expect(isLuState(state)).toBe(true)
  for (const value of [null, undefined, 4, {}, [], 'constructor', '__proto__', 'running']) expect(isLuState(value)).toBe(false)
})

test('preserves the still while loading, defaults to paused, and changes state without autoplay', () => {
  const player = create()
  expect(element.dataset.luReady).toBe('false')
  expect(element.querySelector('img')?.alt).toBe('Lu')
  loaded()
  expect(player.snapshot).toEqual({ state: 'idle', playing: false, reducedMotion: false, status: 'ready' })
  expect(frames.size).toBe(0)
  player.setState('thinking')
  expect(element.dataset.luState).toBe('thinking')
  expect(element.dataset.luFrame).toBe('0')
  expect(frames.size).toBe(0)
  expect(element.style.backgroundImage).toContain('/lu.webp')
})

test('loops with authored timing, preserves pause position, and celebrates once', () => {
  const player = create({ atlas: '/lu.webp', autoplay: true, state: 'thinking' })
  loaded()
  step(0)
  step(500)
  expect(element.dataset.luFrame).toBe('1')
  player.pause()
  expect(frames.size).toBe(0)
  step(900)
  expect(element.dataset.luFrame).toBe('1')
  player.play()
  step(1000)
  step(2400)
  expect(element.dataset.luFrame).toBe('0')
  player.setState('celebration')
  step(2500)
  step(2870)
  expect(element.dataset.luFrame).toBe('3')
  step(3700)
  expect(player.snapshot.state).toBe('idle')
  expect(element.dataset.luFrame).toBe('0')
})

test('honors initial and changing reduced motion while keeping state selection available', () => {
  motion.matches = true
  const player = create({ atlas: '/lu.webp', autoplay: true })
  loaded()
  expect(frames.size).toBe(0)
  player.setState('thinking')
  expect(element.dataset.luFrame).toBe('0')
  motion.matches = false
  motion.dispatchEvent(new Event('change'))
  step(0)
  step(500)
  expect(element.dataset.luFrame).toBe('1')
  motion.matches = true
  motion.dispatchEvent(new Event('change'))
  expect(frames.size).toBe(0)
  expect(element.dataset.luFrame).toBe('0')
  expect(player.snapshot.reducedMotion).toBe(true)
})

test('defers atlas loading until visible and suspends offscreen or in a hidden tab', () => {
  let changeVisibility: ((visible: boolean) => void) | undefined
  const disconnect = vi.fn()
  vi.stubGlobal('IntersectionObserver', class {
    disconnect = disconnect
    constructor(callback: (entries: { target: Element, isIntersecting: boolean }[]) => void) {
      changeVisibility = visible => {
        callback([{ target: element, isIntersecting: visible }])
      }
    }

    observe() { /* Visibility is controlled explicitly by the test. */ }
  })
  create({ atlas: '/lu.webp', autoplay: true })
  expect(sources).toEqual([])
  changeVisibility?.(true)
  expect(sources).toEqual(['/lu.webp'])
  loaded()
  expect(frames.size).toBe(1)
  changeVisibility?.(false)
  expect(frames.size).toBe(0)
  changeVisibility?.(true)
  expect(sources).toHaveLength(1)
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
  document.dispatchEvent(new Event('visibilitychange'))
  expect(frames.size).toBe(0)
  hidden.mockReturnValue(false)
  document.dispatchEvent(new Event('visibilitychange'))
  expect(frames.size).toBe(1)
  players[0]?.destroy()
  expect(disconnect).toHaveBeenCalledOnce()
})

test('keeps failure fallback and reports meaningful changes without frame notifications', () => {
  const changes: LuSnapshot[] = []
  const player = create({ atlas: '/missing.webp', onChange: value => changes.push(value) })
  images[0]?.dispatchEvent(new Event('error'))
  expect(player.snapshot.status).toBe('error')
  expect(element.dataset.luReady).toBe('false')
  expect(element.style.backgroundImage).toBe('')
  player.destroy()

  changes.length = 0
  create({ atlas: '/valid.webp', autoplay: true, onChange: value => changes.push(value) })
  loaded()
  step(0)
  step(1800)
  expect(changes).toHaveLength(1)
})

test('restores authored state, prevents duplicate mounts, and permits remounting after cleanup', () => {
  element.className = 'app-mascot'
  element.dataset.luState = 'authored'
  element.style.backgroundPosition = '10% 20%'
  const player = create({ atlas: '/lu.webp', autoplay: true })
  expect(() => mountLu(element, { atlas: '/second.webp' })).toThrow('existing Lu player')
  loaded()
  player.destroy()
  player.destroy()
  player.play()
  expect(frames.size).toBe(0)
  expect(element.className).toBe('app-mascot')
  expect(element.dataset.luState).toBe('authored')
  expect(element.style.backgroundPosition).toBe('10% 20%')
  expect(element.dataset.luReady).toBeUndefined()
  const replacement = create()
  loaded()
  expect(replacement.snapshot.status).toBe('ready')
})

test('does not restart the clock when a completion callback destroys the player', () => {
  const player: LuPlayer = create({
    atlas: '/lu.webp',
    autoplay: true,
    state: 'celebration',
    onChange: value => {
      if (value.state === 'idle') player.destroy()
    }
  })
  loaded()
  step(0)
  step(1200)
  expect(frames.size).toBe(0)
  expect(element.dataset.luReady).toBeUndefined()
})

test('rejects an empty atlas before changing the host element', () => {
  expect(() => mountLu(element, { atlas: ' ' })).toThrow('atlas URL')
  expect(element.className).toBe('')
  expect(sources).toEqual([])
})
