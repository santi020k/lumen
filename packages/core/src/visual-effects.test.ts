// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { createLumenSpotlightController, normalizeLumenEffectIntensity } from './visual-effects.js'

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

test('untrusted intensities remain bounded and finite', () => {
  expect([Number.NaN, Infinity, '0.5', null].map(normalizeLumenEffectIntensity)).toEqual([0.5, 0.5, 0.5, 0.5])
  expect([-10, 0.25, 10].map(normalizeLumenEffectIntensity)).toEqual([0, 0.25, 1])
})

test('spotlight clamps pointer coordinates, batches frames, and cleans up pending work', () => {
  const root = document.createElement('div')
  document.body.append(root)
  vi.spyOn(root, 'getBoundingClientRect').mockReturnValue(new DOMRect(20, 30, 100, 60))
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  const callbacks: FrameRequestCallback[] = []
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callbacks.push(callback)
    return callbacks.length
  })
  const cancel = vi.fn()
  vi.stubGlobal('cancelAnimationFrame', cancel)
  const cleanup = createLumenSpotlightController(root)
  root.dispatchEvent(new MouseEvent('pointermove', { clientX: 250, clientY: 5 }))
  root.dispatchEvent(new MouseEvent('pointermove', { clientX: 250, clientY: 5 }))
  expect(callbacks).toHaveLength(1)
  callbacks[0]?.(0)
  expect(root.style.getPropertyValue('--ui-spotlight-x')).toBe('100px')
  expect(root.style.getPropertyValue('--ui-spotlight-y')).toBe('0px')
  root.dispatchEvent(new MouseEvent('pointermove', { clientX: 30, clientY: 40 }))
  cleanup()
  expect(cancel).toHaveBeenCalledWith(2)
  expect(root.style.getPropertyValue('--ui-spotlight-x')).toBe('50%')
  root.dispatchEvent(new MouseEvent('pointermove'))
  expect(callbacks).toHaveLength(2)
})
