// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'

import { expect, test, vi } from 'vitest'

import { DeviceFrame } from './device-frame.js'

test('renders accessible children, updates orientation, and retains consumer iframe controls', () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const container = document.createElement('div')
  const root = createRoot(container)
  const child = createElement('iframe', { sandbox: '', title: 'Mobile demo' })

  act(() => {
    root.render(createElement(DeviceFrame, { device: 'android' }, child))
  })
  const screen = container.querySelector<HTMLElement>('.ui-device-frame__screen')

  expect(screen?.style.aspectRatio).toBe('412 / 915')
  expect(container.querySelector('iframe')?.title).toBe('Mobile demo')
  expect(container.querySelector('iframe')?.getAttribute('sandbox')).toBe('')
  act(() => {
    root.render(createElement(DeviceFrame, { device: 'android', orientation: 'landscape', scroll: false }, child))
  })
  expect(screen?.style.aspectRatio).toBe('915 / 412')
  expect(screen?.dataset.scroll).toBe('false')
  expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2)
  act(() => {
    root.unmount()
  })
  vi.unstubAllGlobals()
})

test.each([
  ['macbook-pro', '1280 / 800'],
  ['imac', '1440 / 810'],
  ['pixel', '412 / 915']
] as const)('renders the %s viewport with separate decorative chrome', (device, ratio) => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const container = document.createElement('div')
  const root = createRoot(container)

  act(() => {
    root.render(createElement(DeviceFrame, { device }, createElement('button', {}, 'Open demo')))
  })
  expect(container.querySelector<HTMLElement>('.ui-device-frame')?.dataset.device).toBe(device)
  expect(container.querySelector<HTMLElement>('.ui-device-frame__screen')?.style.aspectRatio).toBe(ratio)
  expect(container.querySelector('.ui-device-frame__screen')?.textContent).toBe('Open demo')
  expect(container.querySelector('.ui-device-frame__screen .ui-device-frame__camera')).toBeNull()
  act(() => {
    root.unmount()
  })
  vi.unstubAllGlobals()
})
