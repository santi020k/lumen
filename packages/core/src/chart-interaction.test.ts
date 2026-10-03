// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { createLumenChartInteractionController } from './chart-interaction.js'

const controllers: ReturnType<typeof createLumenChartInteractionController>[] = []
afterEach(() => {
  controllers.forEach(controller => {
    controller.destroy()
  })
  controllers.length = 0
  document.body.replaceChildren()
})

const fixture = (group = '') => {
  const root = document.createElement('div')
  root.dataset.uiChartSync = group
  root.innerHTML = `<button data-ui-chart-toggle="a" aria-pressed="true" disabled>A</button>
    <div data-ui-chart-interaction-plot tabindex="0"><svg><g data-ui-chart-series="a"></g><line data-ui-chart-crosshair></line></svg></div>
    <div data-ui-chart-inspection hidden><div data-ui-chart-point="0" data-ui-chart-position="44" hidden><strong>Start</strong><span data-ui-chart-series-value="a">A: 5</span></div><div data-ui-chart-point="10" data-ui-chart-position="596" hidden><strong>End</strong><span data-ui-chart-series-value="a">A: 9</span></div></div>
    <p data-ui-chart-announcement></p>`
  document.body.append(root)
  const controller = createLumenChartInteractionController(root)
  controllers.push(controller)
  const plot = root.querySelector<HTMLElement>('[data-ui-chart-interaction-plot]')
  if (!plot) throw new Error('Expected chart plot')
  return { root, plot, controller }
}

test('supports keyboard boundaries, polite announcements, Escape, and exact-identity synchronization', () => {
  const first = fixture('report')
  const second = fixture('report')
  const unrelated = fixture('other')
  const listener = vi.fn()
  first.root.addEventListener('ui:chart-cursor-change', listener)
  first.plot.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }))
  expect(first.root.querySelector('[data-ui-chart-announcement]')?.textContent).toBe('End. A: 9')
  expect(second.root.querySelector('[data-ui-chart-point="10"]')?.hasAttribute('hidden')).toBe(false)
  expect(unrelated.root.querySelector('[data-ui-chart-inspection]')?.hasAttribute('hidden')).toBe(true)
  expect(listener).toHaveBeenCalledOnce()
  second.root.dispatchEvent(new Event('pointerleave'))
  expect(first.root.querySelector('[data-ui-chart-point="10"]')?.hasAttribute('hidden')).toBe(false)
  first.plot.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
  expect(first.root.querySelector('[data-ui-chart-inspection]')?.hasAttribute('hidden')).toBe(true)
  expect(second.root.querySelector('[data-ui-chart-inspection]')?.hasAttribute('hidden')).toBe(true)
})

test('toggles visible series without removing their source data and releases listeners on destruction', () => {
  const { root, plot, controller } = fixture()
  const button = root.querySelector('button')
  button?.click()
  expect(button?.getAttribute('aria-pressed')).toBe('false')
  expect(root.querySelector<SVGElement>('[data-ui-chart-series]')?.style.display).toBe('none')
  expect(root.querySelector('[data-ui-chart-series-value]')?.textContent).toBe('A: 5')
  controller.destroy()
  const listener = vi.fn()
  root.addEventListener('ui:chart-cursor-change', listener)
  plot.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
  expect(listener).not.toHaveBeenCalled()
  expect(root.querySelector<SVGElement>('[data-ui-chart-series]')?.style.display).toBe('')
})

test('synchronizes and announces controlled keyboard selection only when the owner accepts it', () => {
  const first = fixture('controlled')
  const second = fixture('controlled')
  first.controller.setControlledCursor(0)
  first.plot.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
  expect(second.root.querySelector('[data-ui-chart-point="0"]')?.hasAttribute('hidden')).toBe(false)
  expect(first.root.querySelector('[data-ui-chart-announcement]')?.textContent).toBe('')
  first.controller.setControlledCursor(10)
  expect(first.root.querySelector('[data-ui-chart-announcement]')?.textContent).toBe('End. A: 9')
  expect(second.root.querySelector('[data-ui-chart-point="10"]')?.hasAttribute('hidden')).toBe(false)
})
