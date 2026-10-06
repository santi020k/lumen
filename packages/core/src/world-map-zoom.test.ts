// @vitest-environment jsdom
import { afterEach, expect, test } from 'vitest'

import { initLumenWorldMapZoom, normalizeLumenWorldMapZoom } from './world-map-zoom.js'

afterEach(() => {
  document.body.replaceChildren()
})

test.each([[0, 1], [1.5, 1.5], [10, 8], [NaN, 1], [Infinity, 1]])('clamps zoom %s to %s', (value, expected) => {
  expect(normalizeLumenWorldMapZoom(value)).toBe(expected)
})

test('zoom buttons preserve the center, clamp limits, reset and clean up listeners', () => {
  document.body.innerHTML = `<figure><div data-ui-world-map-viewport></div>
    <button data-ui-world-map-zoom="out"></button><button class="ui-button--disabled" data-ui-world-map-zoom="in"></button>
    <button data-ui-world-map-zoom="reset"></button><output data-ui-world-map-zoom-status></output></figure>`
  const root = document.querySelector('figure')
  const viewport = document.querySelector<HTMLElement>('[data-ui-world-map-viewport]')
  const zoomIn = document.querySelector<HTMLButtonElement>('[data-ui-world-map-zoom="in"]')
  const zoomOut = document.querySelector<HTMLButtonElement>('[data-ui-world-map-zoom="out"]')
  const reset = document.querySelector<HTMLButtonElement>('[data-ui-world-map-zoom="reset"]')
  const status = document.querySelector('output')

  if (!root || !viewport || !zoomIn || !zoomOut || !reset || !status) throw new Error('Expected zoom fixture')

  Object.defineProperties(viewport, { clientWidth: { value: 800 }, clientHeight: { value: 320 } })
  const abort = new AbortController()

  initLumenWorldMapZoom(root, abort.signal)
  expect(zoomIn.classList.contains('ui-button--disabled')).toBe(false)
  expect(zoomOut.disabled).toBe(true)
  expect(reset.disabled).toBe(true)
  zoomIn.click()
  expect(status.value).toBe('150%')
  expect(viewport.scrollLeft).toBe(200)
  expect(viewport.scrollTop).toBe(80)
  for (let index = 0; index < 20; index++) zoomIn.click()
  expect(status.value).toBe('800%')
  expect(zoomIn.disabled).toBe(true)
  expect(zoomIn.classList.contains('ui-button--disabled')).toBe(true)
  zoomOut.click()
  expect(status.value).toBe('750%')
  reset.click()
  expect(status.value).toBe('100%')
  expect(viewport.scrollLeft).toBe(0)
  abort.abort()
  zoomIn.click()
  expect(status.value).toBe('100%')
})
