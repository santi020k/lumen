// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { initChartControllers } from './runtime/controllers/charts.js'

afterEach(() => {
  document.dispatchEvent(new Event('astro:before-swap'))
  document.body.replaceChildren()
})

const chart = (owner: Document) => {
  const root = owner.createElement('figure')
  root.dataset.uiChartInteractive = ''
  root.dataset.uiChartSync = 'report'
  root.innerHTML = `<div data-ui-chart-interaction-plot tabindex="0"><svg><line data-ui-chart-crosshair></line></svg></div>
    <div data-ui-chart-inspection hidden><div data-ui-chart-point="0" data-ui-chart-position="44" hidden><strong>Start</strong></div><div data-ui-chart-point="10" data-ui-chart-position="596" hidden><strong>End</strong></div></div>
    <p data-ui-chart-announcement></p>`
  owner.body.append(root)
  const plot = root.querySelector<HTMLElement>('[data-ui-chart-interaction-plot]')
  if (!plot) throw new Error('Missing chart plot')
  return { root, plot }
}

test('rebinds an adopted chart to destination peers and removes source synchronization', () => {
  const adopted = chart(document)
  const sourcePeer = chart(document)
  initChartControllers(document)
  const iframe = document.createElement('iframe')
  document.body.append(iframe)
  const destination = iframe.contentDocument
  if (!destination) throw new Error('Missing iframe document')
  const destinationPeer = chart(destination)
  destination.body.append(destination.adoptNode(adopted.root))
  initChartControllers(destination)
  initChartControllers(destination)
  const listener = vi.fn()
  adopted.root.addEventListener('ui:chart-cursor-change', listener)
  adopted.plot.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
  expect(destinationPeer.root.querySelector('[data-ui-chart-point="10"]')?.hasAttribute('hidden')).toBe(false)
  expect(sourcePeer.root.querySelector('[data-ui-chart-inspection]')?.hasAttribute('hidden')).toBe(true)
  expect(listener).toHaveBeenCalledOnce()
  destinationPeer.plot.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
  expect(adopted.root.querySelector('[data-ui-chart-point="0"]')?.hasAttribute('hidden')).toBe(false)
  sourcePeer.plot.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
  expect(adopted.root.querySelector('[data-ui-chart-point="0"]')?.hasAttribute('hidden')).toBe(false)
})
