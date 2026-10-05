// @vitest-environment jsdom

import { afterEach, expect, test, vi } from 'vitest'

import { createLumenMessageScrollerController } from './message-scroller.js'

afterEach(() => {
  document.body.replaceChildren()

  vi.restoreAllMocks()
})

test('follows appended/streamed content only at the end and preserves a reader anchor on prepend', async () => {
  const viewport = document.createElement('div')
  const item = document.createElement('article')
  const jump = document.createElement('button')
  let height = 1000
  let itemTop = 10
  const frames: FrameRequestCallback[] = []

  item.dataset.uiMessageItem = ''

  jump.dataset.uiMessageJump = ''

  viewport.append(item, jump)

  viewport.style.scrollBehavior = 'smooth'

  viewport.style.overflowAnchor = 'auto'

  document.body.append(viewport)

  Object.defineProperty(viewport, 'scrollHeight', { get: () => height })

  Object.defineProperty(viewport, 'clientHeight', { get: () => 200 })

  vi.spyOn(item, 'getBoundingClientRect').mockImplementation(() => ({ x: 0, y: itemTop, top: itemTop, bottom: itemTop + 40, left: 0, right: 100, width: 100, height: 40, toJSON: () => ({}) }))

  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
    frames.push(callback)

    return frames.length
  })

  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})

  const controller = createLumenMessageScrollerController(viewport)
  const refresh = async () => {
    await Promise.resolve()

    for (const frame of frames.splice(0)) frame(0)
  }

  expect(viewport.scrollTop).toBe(800)
  expect(jump.hidden).toBe(true)
  expect(viewport.style.scrollBehavior).toBe('auto')

  height = 1100

  // A delayed programmatic scroll event must not classify a growing feed as reader-owned.
  viewport.dispatchEvent(new Event('scroll'))

  item.textContent = 'Streaming response'

  await refresh()

  expect(viewport.scrollTop).toBe(900)

  viewport.scrollTop = 300

  viewport.dispatchEvent(new Event('scroll'))

  expect(jump.hidden).toBe(false)

  height = 1200

  item.append(' more')

  await refresh()

  expect(viewport.scrollTop).toBe(300)

  itemTop += 80

  viewport.prepend(document.createElement('article'))

  await refresh()

  expect(viewport.scrollTop).toBe(380)

  jump.click()

  expect(viewport.scrollTop).toBe(1000)

  controller.destroy()

  expect(viewport.style.scrollBehavior).toBe('smooth')
  expect(viewport.style.overflowAnchor).toBe('auto')

  height = 2000

  item.append(' after disposal')

  await refresh()

  expect(viewport.scrollTop).toBe(1000)
})

test('rejects invalid thresholds before mounting', () => {
  expect(() => createLumenMessageScrollerController(document.createElement('div'), { threshold: -1 })).toThrow(RangeError)
})
