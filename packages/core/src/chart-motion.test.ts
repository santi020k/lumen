// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { bindLumenChartMotion, getLumenChartMotionKey } from './chart-motion.js'

const rootFixture = () => {
  const root = document.createElement('div')
  root.innerHTML = '<svg aria-hidden="true"><circle data-ui-chart-motion-key="point" cx="10" cy="20" r="3"></circle></svg><p role="status">Current value: 20</p>'
  root.style.setProperty('--ui-duration', '240ms')
  document.body.append(root)
  const circle = root.querySelector('circle')
  if (!circle) throw new Error('Expected chart mark')
  const cancel = vi.fn()
  const animate = vi.fn(() => ({ cancel, finished: Promise.resolve() }))
  Object.defineProperty(circle, 'animate', { value: animate })
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  return { root, circle, animate, cancel }
}

afterEach(() => {
  document.body.replaceChildren()
  vi.unstubAllGlobals()
})

test('stable chart identities distinguish explicit IDs, categories, and series', () => {
  expect(getLumenChartMotionKey('one', { id: 'stable', x: 1 })).toBe(getLumenChartMotionKey('one', { id: 'stable', x: 2 }))
  expect(getLumenChartMotionKey('one', { x: 1 })).not.toBe(getLumenChartMotionKey('one', { x: '1' }))
  expect(getLumenChartMotionKey('one', { x: 'a' })).not.toBe(getLumenChartMotionKey('two', { x: 'a' }))
})

test('only decorative geometry animates while accessible content updates immediately', async () => {
  const { root, circle, animate } = rootFixture()
  const cleanup = bindLumenChartMotion(root)
  circle.setAttribute('cy', '40')
  const status = root.querySelector('[role="status"]')
  if (!status) throw new Error('Expected accessible value')
  status.textContent = 'Current value: 40'
  await Promise.resolve()
  expect(animate).toHaveBeenCalledWith([{ cx: '10px', cy: '20px', r: '3px' }, { cx: '10px', cy: '40px', r: '3px' }], expect.objectContaining({ duration: 240 }))
  expect(status.textContent).toBe('Current value: 40')
  cleanup()
  circle.setAttribute('cy', '60')
  await Promise.resolve()
  expect(animate).toHaveBeenCalledTimes(1)
})

test('reduced motion and browsers without animation preserve immediate geometry', async () => {
  const { root, circle, animate } = rootFixture()
  root.dataset.uiMotion = 'reduce'
  const cleanup = bindLumenChartMotion(root)
  circle.setAttribute('cy', '50')
  await Promise.resolve()
  expect(animate).not.toHaveBeenCalled()
  expect(circle.getAttribute('cy')).toBe('50')
  cleanup()
})
