// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { initMotionControllers } from './runtime/controllers/motion.js'

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

test('uses the latest visibility change in an observer batch', () => {
  document.body.innerHTML = '<div data-ui-scroll-reveal data-ui-reveal-once="false"></div>'
  const root = document.querySelector('div')
  if (!root) throw new Error('Expected reveal fixture')
  const callbacks: IntersectionObserverCallback[] = []
  const observers: IntersectionObserver[] = []
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
  vi.stubGlobal('IntersectionObserver', class implements IntersectionObserver {
    root = null
    rootMargin = '0px'
    scrollMargin = '0px'
    thresholds = [0]
    disconnect = vi.fn()
    observe = vi.fn()
    unobserve = vi.fn()
    takeRecords = (): IntersectionObserverEntry[] => []
    constructor(callback: IntersectionObserverCallback) {
      callbacks.push(callback)
      observers.push(this)
    }
  })
  initMotionControllers(document)
  const callback = callbacks[0]
  const observer = observers[0]
  if (!callback || !observer) throw new Error('Expected observer')
  const entry = (isIntersecting: boolean): IntersectionObserverEntry => ({
    boundingClientRect: root.getBoundingClientRect(),
    intersectionRatio: isIntersecting ? 1 : 0,
    intersectionRect: root.getBoundingClientRect(),
    isIntersecting,
    rootBounds: null,
    target: root,
    time: 0
  })
  callback([entry(true), entry(false)], observer)
  expect(root.classList.contains('is-revealed')).toBe(false)
  callback([entry(false), entry(true)], observer)
  expect(root.classList.contains('is-revealed')).toBe(true)
})
