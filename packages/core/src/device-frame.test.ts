// @vitest-environment jsdom
import { expect, test, vi } from 'vitest'

import { observeLumenDeviceFrame, resolveLumenDeviceFrame } from './device-frame.js'

test('uses each screen preset and orders custom dimensions for orientation', () => {
  expect(resolveLumenDeviceFrame('iphone')).toEqual({ height: 844, width: 390 })
  expect(resolveLumenDeviceFrame('tablet', 'landscape')).toEqual({ height: 820, width: 1180 })
  expect(resolveLumenDeviceFrame('laptop', 'portrait', 1200, 700)).toEqual({ height: 1200, width: 700 })
})

test.each([NaN, Infinity, 0, -1, 16385])('rejects invalid screen dimension %s', value => {
  expect(resolveLumenDeviceFrame('laptop', undefined, value, value)).toEqual({ height: 800, width: 1280 })
})

test('scales iframe layout width on resize and removes listeners on cleanup', () => {
  const screen = document.createElement('div')
  let available = 195

  Object.defineProperty(screen, 'clientWidth', { get: () => available })
  const cleanup = observeLumenDeviceFrame(screen, 390)

  expect(screen.style.getPropertyValue('--ui-device-frame-scale')).toBe('0.5')
  available = 390
  window.dispatchEvent(new Event('resize'))
  expect(screen.style.getPropertyValue('--ui-device-frame-scale')).toBe('1')
  cleanup()
  window.dispatchEvent(new Event('resize'))
  expect(screen.style.getPropertyValue('--ui-device-frame-scale')).toBe('')
})

test('observes the owning window and disconnects on removal', () => {
  const disconnect = vi.fn()
  const observe = vi.fn()

  class Observer {
    observe = observe
    disconnect = disconnect
  }
  vi.stubGlobal('ResizeObserver', Observer)
  const cleanup = observeLumenDeviceFrame(document.createElement('div'), 390)

  expect(observe).toHaveBeenCalledOnce()
  cleanup()
  expect(disconnect).toHaveBeenCalledOnce()
  vi.unstubAllGlobals()
})
