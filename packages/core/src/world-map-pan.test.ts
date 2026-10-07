// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { initLumenWorldMapPan } from './world-map-pan.js'

afterEach(() => {
  document.body.replaceChildren()
  vi.useRealTimers()
})

const pointer = (target: HTMLElement, type: string, x: number, y: number, pointerType = 'mouse'): void => {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y })
  Object.defineProperties(event, { pointerId: { value: 1 }, pointerType: { value: pointerType } })
  target.dispatchEvent(event)
}

const fixture = () => {
  const viewport = document.createElement('div')
  const country = document.createElement('button')
  let captured = false
  viewport.setPointerCapture = () => {
    captured = true
  }
  viewport.hasPointerCapture = () => captured
  viewport.releasePointerCapture = () => {
    captured = false
  }
  viewport.dataset.panEnabled = 'true'
  viewport.scrollLeft = 200
  viewport.scrollTop = 100
  viewport.append(country)
  document.body.append(viewport)
  const abort = new AbortController()
  initLumenWorldMapPan(viewport, abort.signal)
  return { viewport, country, abort }
}

test('dragging captures the pointer and suppresses only the resulting country click', () => {
  vi.useFakeTimers()
  const { viewport, country, abort } = fixture()
  const select = vi.fn()
  country.addEventListener('click', select)
  pointer(country, 'pointerdown', 100, 100)
  pointer(country, 'pointermove', 98, 100)
  expect(viewport.scrollLeft).toBe(200)
  country.click()
  expect(select).toHaveBeenCalledTimes(1)
  pointer(country, 'pointermove', 50, 80)
  expect(viewport.scrollLeft).toBe(250)
  expect(viewport.scrollTop).toBe(120)
  expect(viewport.hasPointerCapture(1)).toBe(true)
  pointer(viewport, 'pointerup', 50, 80)
  country.click()
  expect(select).toHaveBeenCalledTimes(1)
  vi.runAllTimers()
  country.click()
  expect(select).toHaveBeenCalledTimes(2)
  abort.abort()
})

test('native touch scrolling and maps at their initial scale stay untouched; abort releases an active drag', () => {
  const { viewport, country, abort } = fixture()
  pointer(country, 'pointerdown', 100, 100, 'touch')
  pointer(country, 'pointermove', 50, 50, 'touch')
  expect(viewport.scrollLeft).toBe(200)
  viewport.dataset.panEnabled = 'false'
  pointer(country, 'pointerdown', 100, 100)
  pointer(country, 'pointermove', 50, 50)
  expect(viewport.scrollLeft).toBe(200)
  viewport.dataset.panEnabled = 'true'
  pointer(country, 'pointerdown', 100, 100)
  pointer(country, 'pointermove', 50, 50)
  abort.abort()
  expect(viewport.hasPointerCapture(1)).toBe(false)
  expect(viewport.hasAttribute('data-panning')).toBe(false)
  pointer(country, 'pointermove', 0, 0)
  expect(viewport.scrollLeft).toBe(250)
})
