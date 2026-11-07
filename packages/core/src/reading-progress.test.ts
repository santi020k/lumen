// @vitest-environment jsdom

import { expect, test, vi } from 'vitest'

import { getLumenScrollProgress } from './anchor.js'

test('content progress excludes page content before and after the reading target', () => {
  const scroller = document.documentElement
  const target = document.createElement('article')
  document.body.append(target)
  Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: 600 })
  const bounds = { top: 100, bottom: 1300, height: 1200 }
  vi.spyOn(target, 'getBoundingClientRect').mockImplementation(() => new DOMRect(0, bounds.top, 100, bounds.height))
  expect(getLumenScrollProgress(scroller, target)).toBe(0)
  bounds.top = -300
  expect(getLumenScrollProgress(scroller, target)).toBe(0.5)
  bounds.top = -900
  expect(getLumenScrollProgress(scroller, target)).toBe(1)
  bounds.height = 0
  expect(getLumenScrollProgress(scroller, target)).toBe(0)
  target.remove()
})

test('document progress remains bounded when a content target is absent', () => {
  const scroller = document.createElement('div')
  Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: 600 })
  Object.defineProperty(scroller, 'scrollHeight', { configurable: true, value: 1800 })
  scroller.scrollTop = 600
  expect(getLumenScrollProgress(scroller)).toBe(0.5)
  scroller.scrollTop = -40
  expect(getLumenScrollProgress(scroller)).toBe(0)
  scroller.scrollTop = 1800
  expect(getLumenScrollProgress(scroller)).toBe(1)
})
