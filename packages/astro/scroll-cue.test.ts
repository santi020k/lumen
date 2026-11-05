// @vitest-environment jsdom
// cspell:words loadingdone
import { afterEach, expect, test, vi } from 'vitest'

import { clearScrollCues, initScrollCues, refreshScrollCues } from './runtime/controllers/scroll-cue.js'

const observers: { update: () => void, disconnect: ReturnType<typeof vi.fn>, observe: ReturnType<typeof vi.fn> }[] = []

class MockResizeObserver {
  constructor(update: () => void) {
    observers.push({ disconnect: this.disconnect, observe: this.observe, update })
  }

  disconnect = vi.fn()
  observe = vi.fn()
}

vi.stubGlobal('ResizeObserver', MockResizeObserver)
let nextFrame = 0
const frames = new Map<number, FrameRequestCallback>()

vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
  frames.set(++nextFrame, callback)

  return nextFrame
})
vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))

const flushFrame = (): void => {
  const queued = [...frames.values()]

  frames.clear()

  for (const callback of queued) callback(0)
}

const fonts = new EventTarget()

Object.defineProperty(fonts, 'ready', { get: () => {
  throw new Error('Font readiness must not force style resolution')
} })
Object.defineProperty(document, 'fonts', { configurable: true, value: fonts })

const fixture = (type: 'code' | 'table' = 'table') => {
  const root = document.createElement('div')

  root.setAttribute('data-ui-scroll-cue', '')
  root.innerHTML = type === 'code' ?
    '<pre aria-describedby="author-note"><code>const example = 1</code></pre><div data-scroll-cue-message hidden>Read more</div>' :
    '<div data-scroll-cue-message hidden>Compare</div><div data-scroll-cue-viewport aria-describedby="author-note"><table><tr><td>Metric</td></tr></table></div>'
  document.body.append(root)
  const viewport = root.querySelector<HTMLElement>('[data-scroll-cue-viewport], pre')
  const message = root.querySelector<HTMLElement>('[data-scroll-cue-message]')

  if (!viewport || !message) throw new Error('Expected scroll cue fixture')

  const size = { width: 300, content: 500 }

  Object.defineProperties(viewport, {
    clientWidth: { configurable: true, get: () => size.width },
    scrollWidth: { get: () => size.content }
  })

  return { message, root, size, viewport }
}

afterEach(() => {
  clearScrollCues()
  document.body.replaceChildren()
  observers.length = 0
})

test.each(['code', 'table'] as const)('describes overflowing %s and follows viewport/content reflow', type => {
  const { message, size, viewport } = fixture(type)

  initScrollCues(document)
  flushFrame()
  expect(message.hidden).toBe(false)
  expect(viewport.getAttribute('aria-describedby')).toBe(`author-note ${message.id}`)
  expect(observers[0]?.observe).toHaveBeenCalledTimes(2)
  // Another owner can append a description while this controller is active.
  viewport.setAttribute('aria-describedby', `${viewport.getAttribute('aria-describedby') ?? ''} later-note`)
  size.width = 600
  observers[0]?.update()
  flushFrame()
  expect(message.hidden).toBe(true)
  expect(viewport.getAttribute('aria-describedby')).toBe('author-note later-note')
  size.content = 800
  observers[0]?.update()
  flushFrame()
  expect(message.hidden).toBe(false)
  expect(viewport.getAttribute('aria-describedby')).toBe(`author-note later-note ${message.id}`)
  size.width = 0
  observers[0]?.update()
  flushFrame()
  expect(message.hidden).toBe(true)
  size.width = 300
  observers[0]?.update()
  flushFrame()
  expect(message.hidden).toBe(false)
})

test('uses distinct IDs, preserves caller IDs and initializes each instance once', () => {
  const first = fixture()
  const second = fixture('code')

  first.message.id = 'comparison-hint'
  initScrollCues(document)
  flushFrame()
  initScrollCues(document)
  flushFrame()
  expect(observers).toHaveLength(2)
  expect(first.message.id).toBe('comparison-hint')
  expect(second.message.id).not.toBe(first.message.id)
  expect(second.message.id).not.toBe('')
})

test('cleans up descriptions and observers across navigation, then reconnects', () => {
  const { message, root, viewport } = fixture()

  initScrollCues(document)
  flushFrame()
  clearScrollCues()
  expect(observers[0]?.disconnect).toHaveBeenCalledOnce()
  expect(message.hidden).toBe(true)
  expect(viewport.getAttribute('aria-describedby')).toBe('author-note')
  observers[0]?.update()
  flushFrame()
  expect(message.hidden).toBe(true)
  initScrollCues(document)
  flushFrame()
  expect(message.hidden).toBe(false)
  root.remove()
  initScrollCues(document)
  flushFrame()
  expect(observers[1]?.disconnect).toHaveBeenCalledOnce()
})

test('hides guidance at the overflow tolerance and ignores incomplete markup', () => {
  const { message, root, size } = fixture()

  size.content = size.width + 1
  initScrollCues(document)
  flushFrame()
  expect(message.hidden).toBe(true)
  clearScrollCues()
  root.querySelector('table')?.remove()
  expect(() => {
    initScrollCues(document)
    flushFrame()
  }).not.toThrow()
  expect(message.hidden).toBe(true)
})

test('settles initial cue geometry synchronously and measures every region before writing', () => {
  const first = fixture()
  const second = fixture('code')
  const measurements: boolean[] = []

  Object.defineProperty(second.viewport, 'clientWidth', {
    get: () => {
      measurements.push(first.message.hidden === true)

      return 300
    }
  })
  initScrollCues(document)
  expect(measurements).toEqual([true])
  expect(first.message.hidden).toBe(false)
  expect(second.message.hidden).toBe(false)
  expect(frames.size).toBe(0)
})

test('refreshes visible tab-panel cues before the next animation frame', () => {
  const { message, root, size } = fixture()
  const other = fixture('code')
  const panel = document.createElement('section')

  root.before(panel)
  panel.append(root)
  size.width = 0
  initScrollCues(document)
  expect(message.hidden).toBe(true)
  size.width = 300
  other.size.width = 0
  refreshScrollCues(panel)
  expect(message.hidden).toBe(false)
  expect(other.message.hidden).toBe(false)
  expect(frames.size).toBe(0)
})

test('observes font completion once per document and releases it on navigation', () => {
  const addListener = vi.spyOn(fonts, 'addEventListener')
  const removeListener = vi.spyOn(fonts, 'removeEventListener')
  const first = fixture()
  const second = fixture('code')

  initScrollCues(document)
  initScrollCues(document)
  expect(addListener).toHaveBeenCalledTimes(1)
  first.size.content = 100
  second.size.content = 100
  fonts.dispatchEvent(new Event('loadingdone'))
  expect(first.message.hidden).toBe(true)
  expect(second.message.hidden).toBe(true)
  clearScrollCues()
  expect(removeListener).toHaveBeenCalledTimes(1)
  first.size.content = 500
  fonts.dispatchEvent(new Event('loadingdone'))
  expect(first.message.hidden).toBe(true)
  initScrollCues(document)
  expect(addListener).toHaveBeenCalledTimes(2)
  expect(first.message.hidden).toBe(false)
})
