// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { initDocumentNavigationControllers } from './runtime/controllers/document-navigation.js'

afterEach(() => {
  document.body.replaceChildren()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const fixture = (scrollHeight: number) => {
  document.body.innerHTML = '<nav data-ui-anchor><a href="#first">First</a><a href="#last">Last</a></nav><section id="first"></section><section id="last"></section>'
  vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(scrollHeight)
  vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(800)
  vi.spyOn(document.documentElement, 'scrollTop', 'get').mockReturnValue(0)
  for (const [index, target] of [...document.querySelectorAll('section')].entries()) {
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, index * 200, 100, 100))
  }
  return [...document.querySelectorAll('a')]
}

test('shares one scroll/resize listener pair across repeated anchor markup and skips detached anchors', () => {
  const iframe = document.createElement('iframe')
  document.body.append(iframe)
  const owner = iframe.contentDocument
  const view = owner?.defaultView
  if (!owner || !view) throw new Error('Expected anchor document')
  const addEventListenerSpy = vi.spyOn(view, 'addEventListener')
  const frames: FrameRequestCallback[] = []
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.push(callback)
    return frames.length
  })

  vi.spyOn(owner.documentElement, 'scrollHeight', 'get').mockReturnValue(800)
  vi.spyOn(owner.documentElement, 'clientHeight', 'get').mockReturnValue(800)
  vi.spyOn(owner.documentElement, 'scrollTop', 'get').mockReturnValue(0)

  owner.body.innerHTML = '<nav data-ui-anchor><a href="#first">First</a></nav><section id="first"></section>'

  const firstTarget = owner.getElementById('first')
  if (!firstTarget) throw new Error('Expected first target')

  const firstRectSpy = vi.spyOn(firstTarget, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 100))

  initDocumentNavigationControllers(owner)

  const firstNav = owner.querySelector('nav')
  const firstReadsAfterInit = firstRectSpy.mock.calls.length

  owner.body.innerHTML = '<nav data-ui-anchor><a href="#second">Second</a></nav><section id="second"></section>'

  const secondTarget = owner.getElementById('second')
  if (!secondTarget) throw new Error('Expected second target')

  const secondRectSpy = vi.spyOn(secondTarget, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 100))

  initDocumentNavigationControllers(owner)

  view.dispatchEvent(new Event('scroll'))

  for (const frame of frames) frame(0)

  expect(addEventListenerSpy.mock.calls.filter(([type]) => type === 'resize')).toHaveLength(1)
  expect(addEventListenerSpy.mock.calls.filter(([type]) => type === 'scroll')).toHaveLength(1)
  expect(firstNav?.isConnected).toBe(false)
  expect(firstRectSpy.mock.calls).toHaveLength(firstReadsAfterInit)
  expect(secondRectSpy).toHaveBeenCalled()
  expect(owner.querySelector('[href="#second"]')?.getAttribute('aria-current')).toBe('location')
})

test('keeps the first visible section current when the page cannot scroll', () => {
  const [first, last] = fixture(800)
  initDocumentNavigationControllers(document)
  expect(first?.getAttribute('aria-current')).toBe('location')
  expect(last?.hasAttribute('aria-current')).toBe(false)
})

test('marks the final section current at the bottom of a scrollable page', () => {
  const [first, last] = fixture(1000)
  vi.spyOn(document.documentElement, 'scrollTop', 'get').mockReturnValue(200)
  initDocumentNavigationControllers(document)
  expect(first?.hasAttribute('aria-current')).toBe(false)
  expect(last?.getAttribute('aria-current')).toBe('location')
})

test('isolates malformed fragments while enhancing valid links and scroll progress', () => {
  fixture(1000)
  const nav = document.querySelector('nav')
  if (!nav) throw new Error('Expected navigation fixture')
  nav.insertAdjacentHTML('afterbegin', '<a href="#invalid%g">Invalid</a><a href="#100%">Percent</a><a href="#caf%C3%A9">Encoded</a>')
  document.body.insertAdjacentHTML('beforeend', '<section id="100%"></section><section id="café"></section><div data-ui-scroll-progress><span class="ui-scroll-progress__bar"></span></div>')
  const frames: FrameRequestCallback[] = []
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.push(callback)
    return frames.length
  })
  expect(() => {
    initDocumentNavigationControllers(document)
  }).not.toThrow()
  nav.querySelector<HTMLAnchorElement>('[href="#100%"]')?.click()
  expect(nav.querySelector('[href="#100%"]')?.getAttribute('aria-current')).toBe('location')
  nav.querySelector<HTMLAnchorElement>('[href="#caf%C3%A9"]')?.click()
  expect(nav.querySelector('[href="#caf%C3%A9"]')?.getAttribute('aria-current')).toBe('location')
  for (const frame of frames) frame(0)
  expect(document.querySelector('[data-ui-scroll-progress]')?.getAttribute('aria-valuenow')).toBe('0')
})
