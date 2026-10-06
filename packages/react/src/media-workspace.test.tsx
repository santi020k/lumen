// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { MediaFilmstrip, MediaThumbnail } from './media-selection.js'
import { MediaViewport } from './media-viewport.js'

let container: HTMLDivElement
let root: Root
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => {
    root.unmount()
  })
  container.remove()
  vi.unstubAllGlobals()
})
const button = (label: string): HTMLButtonElement => {
  const match = Array.from(container.querySelectorAll('button')).find(item => item.textContent.includes(label))
  if (!match) throw new Error(`Missing ${label}`)
  return match
}

test('keeps controlled inspection until accepted, then fits without replacing media', () => {
  const onValueChange = vi.fn()
  const image = createElement('img', { src: '/photo.jpg', alt: 'Landscape' })
  const props = { label: 'Inspect photo', value: { zoom: 1, x: 0, y: 0 }, onValueChange, children: image }
  act(() => {
    root.render(createElement(MediaViewport, props))
  })
  const media = container.querySelector('img')
  act(() => {
    button('Zoom in').click()
  })
  expect(onValueChange).toHaveBeenLastCalledWith({ zoom: 1.25, x: 0, y: 0 })
  expect(container.querySelector('[role="status"]')?.textContent).toBe('100%')
  act(() => {
    root.render(createElement(MediaViewport, { ...props, value: { zoom: 2, x: 1, y: -1 } }))
  })
  expect(container.querySelector('img')).toBe(media)
  expect(button('Pan right').disabled).toBe(true)
  act(() => {
    button('Fit to view').click()
  })
  expect(onValueChange).toHaveBeenLastCalledWith({ zoom: 1, x: 0, y: 0 })
})

test('supports uncontrolled keyboard inspection and blocks disabled changes', () => {
  const onValueChange = vi.fn()
  act(() => {
    root.render(createElement(MediaViewport, { label: 'Inspect', onValueChange, maxZoom: 1.25 }))
  })
  const stage = container.querySelector<HTMLElement>('[data-ui-media-viewport-stage]')
  if (!stage) throw new Error('Missing inspection stage')
  act(() => {
    stage.dispatchEvent(new KeyboardEvent('keydown', { key: '+', bubbles: true }))
  })
  expect(container.querySelector('[role="status"]')?.textContent).toBe('125%')
  expect(button('Zoom in').disabled).toBe(true)
  act(() => {
    root.render(createElement(MediaViewport, { label: 'Inspect', onValueChange, disabled: true }))
  })
  act(() => {
    stage.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
  })
  expect(onValueChange).toHaveBeenCalledTimes(1)
})

test.each(['loading', 'error'] as const)('exposes %s thumbnails without accepting selection', state => {
  const onClick = vi.fn()
  act(() => {
    root.render(createElement(MediaThumbnail, { label: 'Lake', selected: true, state, order: 2, onClick }))
  })
  const thumbnail = button('Lake')
  expect(thumbnail.getAttribute('aria-pressed')).toBe('true')
  expect(thumbnail.disabled).toBe(true)
  act(() => {
    thumbnail.click()
  })
  expect(onClick).not.toHaveBeenCalled()
})

test('filmstrip exposes host-formatted count and native ordered children', () => {
  act(() => {
    root.render(createElement(MediaFilmstrip, { label: 'Photos', selectionLabel: '2 selected' }, createElement('li', null, 'Lake')))
  })
  expect(container.querySelector('section')?.getAttribute('aria-label')).toBe('Photos')
  expect(container.querySelector('ol > li')?.textContent).toBe('Lake')
  expect(container.querySelector('[role="status"]')?.textContent).toBe('2 selected')
})
