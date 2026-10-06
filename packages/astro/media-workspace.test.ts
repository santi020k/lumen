// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { initMediaSelectionControllers } from './runtime/controllers/media-selection.js'
import { initMediaViewportControllers } from './runtime/controllers/media-viewport.js'

afterEach(() => {
  document.body.replaceChildren()
})

test('Astro inspection enhances once and keeps reflected values and disabled state synchronized', async () => {
  document.body.innerHTML = `<figure data-ui-media-viewport data-zoom="1" data-max-zoom="2">
    <div data-ui-media-viewport-stage tabindex="0"><div data-ui-media-viewport-content><img alt="Landscape"></div></div>
    <span data-ui-media-viewport-status></span><button data-ui-media-viewport-action="zoom-in" disabled>Zoom in</button>
  </figure>`
  const root = document.querySelector('figure')
  const button = document.querySelector('button')
  if (!root || !button) throw new Error('Missing viewport fixture')
  const requests = vi.fn()
  root.addEventListener('ui:media-viewport-change', requests)
  initMediaViewportControllers(document)
  initMediaViewportControllers(document)
  button.click()
  expect(root.dataset.zoom).toBe('1.25')
  expect(requests).toHaveBeenCalledOnce()
  const request: unknown = requests.mock.calls[0]?.[0]
  if (!(request instanceof CustomEvent)) throw new Error('Missing viewport event')
  expect(request.detail).toEqual({ zoom: 1.25, x: 0, y: 0 })
  root.dataset.disabled = 'true'
  await Promise.resolve()
  expect(button.disabled).toBe(true)
  button.click()
  expect(requests).toHaveBeenCalledOnce()
  root.dataset.zoom = '100'
  await Promise.resolve()
  expect(root.querySelector('[data-ui-media-viewport-status]')?.textContent).toBe('200%')
})

test('Astro selection requests do not mutate canonical state or fire from disabled buttons', () => {
  document.body.innerHTML = '<button data-ui-media-thumbnail data-media-id="lake" aria-pressed="true">Lake</button>'
  const button = document.querySelector('button')
  if (!button) throw new Error('Missing thumbnail fixture')
  const requests = vi.fn()
  button.addEventListener('ui:media-selection-request', requests)
  initMediaSelectionControllers(document)
  initMediaSelectionControllers(document)
  button.click()
  expect(requests).toHaveBeenCalledOnce()
  expect(button.getAttribute('aria-pressed')).toBe('true')
  const request: unknown = requests.mock.calls[0]?.[0]
  if (!(request instanceof CustomEvent)) throw new Error('Missing selection request')
  expect(request.detail).toEqual({ id: 'lake', selected: false })
  button.disabled = true
  button.click()
  expect(requests).toHaveBeenCalledOnce()
})
