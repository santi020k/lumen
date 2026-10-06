// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { bindLumenTabIndicator } from './tab-indicator.js'

afterEach(() => {
  document.body.replaceChildren()
  vi.unstubAllGlobals()
})

test('selection indicator follows active geometry and cleans up its frame and positioning', async () => {
  const root = document.createElement('div')
  root.innerHTML = '<div role="tablist" style="position:static"><button role="tab" aria-selected="true">One</button><button role="tab" aria-selected="false">Two</button></div>'
  document.body.append(root)
  const list = root.querySelector<HTMLElement>('[role="tablist"]')
  const tabs = root.querySelectorAll<HTMLButtonElement>('[role="tab"]')
  if (!list || !tabs[0] || !tabs[1]) throw new Error('Expected tabs fixture')
  vi.spyOn(list, 'getBoundingClientRect').mockReturnValue(new DOMRect(10, 20, 200, 40))
  vi.spyOn(tabs[0], 'getBoundingClientRect').mockReturnValue(new DOMRect(10, 20, 80, 40))
  vi.spyOn(tabs[1], 'getBoundingClientRect').mockReturnValue(new DOMRect(90, 20, 120, 40))
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  const frames: FrameRequestCallback[] = []
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.push(callback)
    return frames.length
  })
  const cancel = vi.fn()
  vi.stubGlobal('cancelAnimationFrame', cancel)
  const cleanup = bindLumenTabIndicator(root)
  const marker = list.querySelector<HTMLElement>('.ui-tabs__moving-indicator')
  if (!marker) throw new Error('Expected decorative marker')
  expect(marker.getAttribute('aria-hidden')).toBe('true')
  expect(marker.style.width).toBe('80px')
  tabs[0].setAttribute('aria-selected', 'false')
  tabs[1].setAttribute('aria-selected', 'true')
  await Promise.resolve()
  expect(frames).toHaveLength(1)
  frames[0]?.(0)
  expect(marker.style.width).toBe('120px')
  expect(marker.style.translate).toBe('80px 0')
  root.dataset.uiMotion = 'reduce'
  await Promise.resolve()
  frames[1]?.(0)
  expect(marker.style.transition).toContain('0ms')
  tabs[1].setAttribute('aria-selected', 'false')
  await Promise.resolve()
  cleanup()
  expect(cancel).toHaveBeenCalled()
  expect(list.style.position).toBe('static')
  expect(list.querySelector('.ui-tabs__moving-indicator')).toBeNull()
  expect(tabs[0].textContent).toBe('One')
})
