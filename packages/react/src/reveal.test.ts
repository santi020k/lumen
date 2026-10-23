// @vitest-environment jsdom
import { act, createElement, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { RevealGroup, ScrollReveal } from './components.js'

interface ObserverRecord {
  callback: IntersectionObserverCallback
  observer: MockIntersectionObserver
  options: IntersectionObserverInit | undefined
}

const observers: ObserverRecord[] = []
let root: Root | undefined

class MockIntersectionObserver implements IntersectionObserver {
  root = null
  rootMargin = '0px'
  scrollMargin = '0px'
  thresholds = [0]
  disconnect = vi.fn<() => void>()
  observe = vi.fn<(target: Element) => void>()
  unobserve = vi.fn<(target: Element) => void>()
  takeRecords = (): IntersectionObserverEntry[] => []
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    observers.push({ callback, observer: this, options })
  }
}

const components = [
  { name: 'ScrollReveal', render: (once: boolean) => createElement(ScrollReveal, { once, threshold: 2 }) },
  { name: 'RevealGroup', render: (once: boolean) => createElement(RevealGroup, { once, threshold: 2 }, createElement('span')) }
]

const mount = (element: ReactElement): HTMLElement => {
  const container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => root?.render(element))
  const reveal = container.firstElementChild
  if (!(reveal instanceof HTMLElement)) throw new Error('Expected reveal root')
  return reveal
}

const latestObserver = (): ObserverRecord => {
  const record = observers.at(-1)
  if (!record) throw new Error('Expected observer')
  return record
}

const deliver = (target: HTMLElement, states: boolean[]) => {
  const { callback, observer } = latestObserver()
  const entries = states.map((isIntersecting): IntersectionObserverEntry => ({
    boundingClientRect: target.getBoundingClientRect(),
    intersectionRatio: isIntersecting ? 1 : 0,
    intersectionRect: target.getBoundingClientRect(),
    isIntersecting,
    rootBounds: null,
    target,
    time: 0
  }))
  act(() => {
    callback(entries, observer)
  })
}

beforeEach(() => {
  observers.length = 0
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
})

afterEach(() => {
  act(() => root?.unmount())
  root = undefined
  document.body.replaceChildren()
  vi.unstubAllGlobals()
})

describe.each(components)('$name', ({ render }) => {
  test('observes its root with a clamped threshold and disconnects on unmount', () => {
    const reveal = mount(render(true))
    const { observer, options } = latestObserver()
    expect(observer.observe).toHaveBeenCalledWith(reveal)
    expect(options?.threshold).toBe(1)
    expect(reveal.dataset.uiScrollRevealBound).toBe('true')
    act(() => root?.unmount())
    root = undefined
    expect(observer.disconnect).toHaveBeenCalledOnce()
  })

  test('ignores empty observer batches', () => {
    const reveal = mount(render(true))
    deliver(reveal, [])
    expect(reveal.classList.contains('is-revealed')).toBe(false)
    expect(latestObserver().observer.disconnect).not.toHaveBeenCalled()
  })

  test('once only disconnects when the latest entry in a batch intersects', () => {
    const reveal = mount(render(true))
    const { observer } = latestObserver()
    deliver(reveal, [true, false])
    expect(reveal.classList.contains('is-revealed')).toBe(false)
    expect(observer.disconnect).not.toHaveBeenCalled()
    deliver(reveal, [false, true])
    expect(reveal.classList.contains('is-revealed')).toBe(true)
    expect(observer.disconnect).toHaveBeenCalledOnce()
  })

  test('repeatable reveals follow the latest entry and keep observing', () => {
    const reveal = mount(render(false))
    const { observer } = latestObserver()
    deliver(reveal, [false, true])
    expect(reveal.classList.contains('is-revealed')).toBe(true)
    deliver(reveal, [true, false])
    expect(reveal.classList.contains('is-revealed')).toBe(false)
    deliver(reveal, [false, true])
    expect(reveal.classList.contains('is-revealed')).toBe(true)
    expect(observer.disconnect).not.toHaveBeenCalled()
  })

  test('reveals immediately when reduced motion is preferred', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const reveal = mount(render(true))
    expect(reveal.classList.contains('is-revealed')).toBe(true)
    expect(observers).toHaveLength(0)
  })

  test('reveals immediately when IntersectionObserver is unavailable', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const reveal = mount(render(true))
    expect(reveal.classList.contains('is-revealed')).toBe(true)
    expect(observers).toHaveLength(0)
  })
})
