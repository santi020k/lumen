// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { createLumenRevealController, normalizeLumenRevealThreshold } from './reveal.js'

interface ObserverRecord {
  callback: IntersectionObserverCallback
  observer: IntersectionObserver
  options?: IntersectionObserverInit
}

const records: ObserverRecord[] = []
const cleanup: (() => void)[] = []

class Observer implements IntersectionObserver {
  root = null
  rootMargin = '0px'
  scrollMargin = '0px'
  thresholds = [0]
  disconnect = vi.fn<() => void>()
  observe = vi.fn<(element: Element) => void>()
  unobserve = vi.fn<(element: Element) => void>()
  takeRecords = (): IntersectionObserverEntry[] => []

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    records.push({ callback, observer: this, ...(options ? { options } : {}) })
  }
}

const fixture = (height = 100): HTMLElement => {
  const root = document.createElement('div')

  document.body.append(root)
  vi.spyOn(root, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, height))

  return root
}

const deliver = (root: HTMLElement, ratio: number): void => {
  const record = records.at(-1)

  if (!record) throw new Error('Expected active reveal observer')
  record.callback([{ target: root,
    isIntersecting: ratio > 0,
    intersectionRatio: ratio,
    boundingClientRect: root.getBoundingClientRect(),
    intersectionRect: root.getBoundingClientRect(),
    rootBounds: null,
    time: 0 }], record.observer)
}

beforeEach(() => {
  records.length = 0
  vi.stubGlobal('matchMedia', () => Object.assign(new EventTarget(), { matches: false }))
  vi.stubGlobal('IntersectionObserver', Observer)
})

afterEach(() => {
  for (const destroy of cleanup.splice(0)) destroy()
  document.body.replaceChildren()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

test('preserves explicit thresholds, including zero, and normalizes nonfinite input', () => {
  expect(normalizeLumenRevealThreshold(0)).toBe(0)
  expect(normalizeLumenRevealThreshold(0.8)).toBe(0.8)
  expect(normalizeLumenRevealThreshold(2)).toBe(1)
  expect(normalizeLumenRevealThreshold(-1)).toBe(0)
  for (const value of [undefined, NaN, Infinity]) expect(normalizeLumenRevealThreshold(value)).toBe(0.15)
})

test('an intersecting entry below the requested ratio does not prematurely reveal', () => {
  const root = fixture()

  cleanup.push(createLumenRevealController(root, { once: false, threshold: 0.8 }).destroy)
  expect(records[0]?.options?.threshold).toBe(0.8)
  deliver(root, 0.5)
  expect(root.classList.contains('is-revealed')).toBe(false)
  deliver(root, 0.8)
  expect(root.classList.contains('is-revealed')).toBe(true)
  deliver(root, 0)
  expect(root.classList.contains('is-revealed')).toBe(false)
})

test('unreachable tall groups stay visible without lowering the requested threshold', () => {
  const root = fixture(10_000)

  root.dataset.uiRevealThreshold = '0.8'
  cleanup.push(createLumenRevealController(root, { threshold: 0.8 }).destroy)
  expect(records).toHaveLength(0)
  expect(root.classList.contains('is-revealed')).toBe(true)
  expect(root.dataset.uiScrollRevealBound).toBeUndefined()
  expect(root.dataset.uiRevealThreshold).toBe('0.8')
})

test('clipping containers and enlarged text cannot strand content after initialization', () => {
  const parent = document.createElement('div')
  const root = fixture(200)

  document.body.append(parent)
  parent.append(root)
  parent.style.overflowY = 'auto'
  vi.spyOn(parent, 'clientHeight', 'get').mockReturnValue(200)
  cleanup.push(createLumenRevealController(root, { threshold: 0.5 }).destroy)
  expect(records).toHaveLength(1)
  vi.spyOn(root, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 2_000))
  window.dispatchEvent(new Event('resize'))
  expect(root.classList.contains('is-revealed')).toBe(true)
  expect(root.dataset.uiScrollRevealBound).toBeUndefined()
})

test('keyboard focus and reduced motion immediately bypass decorative hiding', () => {
  const media = Object.assign(new EventTarget(), { matches: false })

  vi.stubGlobal('matchMedia', () => media)
  const focused = fixture()
  const button = document.createElement('button')

  focused.append(button)
  cleanup.push(createLumenRevealController(focused).destroy)
  button.focus()
  expect(focused.dataset.uiScrollRevealBound).toBeUndefined()
  const reduced = fixture()

  cleanup.push(createLumenRevealController(reduced).destroy)
  media.matches = true
  media.dispatchEvent(new Event('change'))
  expect(reduced.classList.contains('is-revealed')).toBe(true)
  expect(reduced.dataset.uiScrollRevealBound).toBeUndefined()
})

test('destroy removes hiding and ignores queued observer entries', () => {
  const root = fixture()
  const controller = createLumenRevealController(root)

  controller.destroy()
  deliver(root, 1)
  expect(root.dataset.uiScrollRevealBound).toBeUndefined()
  expect(root.classList.contains('is-revealed')).toBe(false)
})
