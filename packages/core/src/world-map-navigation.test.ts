// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { fitHighlightedMap, getHighlightedMapBounds, initMapWheelZoom } from './world-map-navigation.js'

afterEach(() => {
  document.body.replaceChildren()
})

const fixture = () => {
  const root = document.createElement('figure')
  const viewport = document.createElement('div')
  Object.defineProperties(viewport, { clientWidth: { value: 800 }, clientHeight: { value: 320 } })
  root.append(viewport)
  document.body.append(root)
  return { root, viewport }
}

const addCountry = (root: HTMLElement, bounds: DOMRect): void => {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.classList.add('ui-world-map__country--highlighted')
  path.getBBox = () => bounds
  root.append(path)
}

test('fits the union of highlighted geometry with padding and centers the viewport', () => {
  const { root, viewport } = fixture()
  const update = vi.fn()
  addCountry(root, new DOMRect(100, 50, 100, 50))
  addCountry(root, new DOMRect(300, 100, 50, 50))
  expect(getHighlightedMapBounds(root)).toEqual({ x: 100, y: 50, width: 250, height: 100 })
  fitHighlightedMap(root, viewport, update)
  expect(update).toHaveBeenCalledWith(3.4)
  expect(viewport.scrollLeft).toBeCloseTo(212)
  expect(viewport.scrollTop).toBeCloseTo(112)
})

test('empty or invalid geometry leaves the world unchanged; tiny regions clamp at maximum zoom', () => {
  const { root, viewport } = fixture()
  const update = vi.fn()
  addCountry(root, new DOMRect(NaN, 0, 1, 1))
  fitHighlightedMap(root, viewport, update)
  expect(update).not.toHaveBeenCalled()
  addCountry(root, new DOMRect(500, 200, 0, 0))
  fitHighlightedMap(root, viewport, update)
  expect(update).toHaveBeenCalledWith(8)
})

test('only modified wheel zooms toward the pointer and abort removes the handler', () => {
  const { viewport } = fixture()
  const abort = new AbortController()
  const update = vi.fn()
  initMapWheelZoom(viewport, () => 2, update, abort.signal)
  const ordinary = new WheelEvent('wheel', { deltaY: -100, cancelable: true })
  viewport.dispatchEvent(ordinary)
  expect(ordinary.defaultPrevented).toBe(false)
  expect(update).not.toHaveBeenCalled()
  const zoom = new WheelEvent('wheel', { ctrlKey: true, deltaY: -100, clientX: 200, clientY: 60, cancelable: true })
  viewport.dispatchEvent(zoom)
  expect(zoom.defaultPrevented).toBe(true)
  expect(update).toHaveBeenCalledExactlyOnceWith(2 * Math.exp(0.2), { x: 200, y: 60 })
  abort.abort()
  viewport.dispatchEvent(zoom)
  expect(update).toHaveBeenCalledTimes(1)
})
