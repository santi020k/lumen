import { afterEach, beforeAll, expect, test, vi } from 'vitest'

import { defineLumenMediaFilmstrip, defineLumenMediaThumbnail, LumenMediaFilmstripElement, LumenMediaThumbnailElement } from './components/media-selection.js'
import { defineLumenMediaViewport, LumenMediaViewportElement } from './components/media-viewport.js'

beforeAll(() => {
  defineLumenMediaThumbnail()
  defineLumenMediaFilmstrip()
  defineLumenMediaViewport()
})
afterEach(() => {
  document.body.replaceChildren()
})

test('selection requests preserve host state and media through reconnects', () => {
  const element = new LumenMediaThumbnailElement()
  element.setAttribute('media-id', 'lake')
  element.setAttribute('label', 'Lake')
  element.setAttribute('selected', '')
  const image = document.createElement('img')
  element.append(image)
  document.body.append(element)
  const button = element.querySelector('button')
  if (!button) throw new Error('Expected thumbnail button')
  const requests = vi.fn()
  element.addEventListener('ui:media-selection-request', requests)
  button.click()
  expect(requests).toHaveBeenCalledOnce()
  const request: unknown = requests.mock.calls[0]?.[0]
  if (!(request instanceof CustomEvent)) throw new Error('Expected selection event')
  expect(request.detail).toEqual({ id: 'lake', selected: false })
  expect(element.hasAttribute('selected')).toBe(true)
  for (const state of ['loading', 'error']) {
    element.setAttribute('state', state)
    button.click()
    expect(requests).toHaveBeenCalledOnce()
    expect(button.disabled).toBe(true)
  }
  element.remove()
  document.body.append(element)
  expect(element.querySelector('img')).toBe(image)
  expect(element.querySelectorAll('button')).toHaveLength(1)
})

test('viewport reflects bounded properties and binds once after reconnection', () => {
  const element = new LumenMediaViewportElement()
  element.setAttribute('label', 'Inspect photo')
  document.body.append(element)
  const requests = vi.fn()
  element.addEventListener('ui:media-viewport-change', requests)
  const button = element.querySelector<HTMLButtonElement>('[data-ui-media-viewport-action="zoom-in"]')
  if (!button) throw new Error('Expected zoom action')
  button.click()
  expect(element.value).toEqual({ zoom: 1.25, x: 0, y: 0 })
  element.remove()
  document.body.append(element)
  button.click()
  expect(requests).toHaveBeenCalledTimes(2)
  element.value = { zoom: 100, x: 100, y: Number.NaN }
  expect(element.value).toEqual({ zoom: 4, x: 1, y: 0 })
  element.setAttribute('disabled', '')
  button.click()
  expect(requests).toHaveBeenCalledTimes(2)
})

test('filmstrip retains ordered consumer items and updates localized selection status', () => {
  const element = new LumenMediaFilmstripElement()
  const item = document.createElement('li')
  element.append(item)
  element.setAttribute('label', 'Photos')
  element.setAttribute('selection-label', '1 selected')
  document.body.append(element)
  expect(element.querySelector('ol > li')).toBe(item)
  element.setAttribute('selection-label', '2 selected')
  expect(element.querySelector('[role="status"]')?.textContent).toBe('2 selected')
})
