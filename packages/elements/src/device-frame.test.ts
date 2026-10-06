import { afterEach, beforeAll, expect, test } from 'vitest'

import { defineLumenDeviceFrame, LumenDeviceFrameElement } from './components/device-frame.js'

beforeAll(() => {
  defineLumenDeviceFrame()
})
afterEach(() => {
  document.body.replaceChildren()
})

test('preserves children and iframe permissions and updates dimensions without rebuilding content', () => {
  const frame = new LumenDeviceFrameElement()
  const iframe = document.createElement('iframe')

  iframe.title = 'Application demo'
  iframe.setAttribute('sandbox', '')
  frame.setAttribute('device', 'iphone')
  frame.append(iframe)
  document.body.append(frame)
  const screen = frame.querySelector<HTMLElement>('.ui-device-frame__screen')

  expect(screen?.firstElementChild).toBe(iframe)
  expect(screen?.style.aspectRatio).toBe('390 / 844')
  frame.setAttribute('orientation', 'landscape')
  frame.setAttribute('tone', 'light')
  frame.setAttribute('scroll', 'false')
  expect(screen?.style.aspectRatio).toBe('844 / 390')
  expect(frame.dataset.tone).toBe('light')
  expect(screen?.dataset.scroll).toBe('false')
  expect(iframe.getAttribute('sandbox')).toBe('')
  expect(iframe.title).toBe('Application demo')
  frame.remove()
  document.body.append(frame)
  expect(frame.querySelectorAll('.ui-device-frame__screen')).toHaveLength(1)
  expect(screen?.firstElementChild).toBe(iframe)
})

test('falls back for invalid attributes and honors custom sizes', () => {
  const frame = new LumenDeviceFrameElement()

  frame.setAttribute('device', 'unknown')
  frame.setAttribute('screen-width', 'bad')
  document.body.append(frame)
  const screen = frame.querySelector<HTMLElement>('.ui-device-frame__screen')

  expect(screen?.style.aspectRatio).toBe('1280 / 800')
  frame.setAttribute('screen-width', '1024')
  frame.setAttribute('screen-height', '768')
  expect(screen?.style.aspectRatio).toBe('1024 / 768')
})

test.each([
  ['macbook-pro', '1280 / 800'],
  ['imac', '1440 / 810'],
  ['pixel', '412 / 915']
])('switches to %s while preserving the interactive screen', (device, ratio) => {
  const frame = new LumenDeviceFrameElement()
  const button = document.createElement('button')

  button.textContent = 'Keep editing'
  frame.append(button)
  document.body.append(frame)
  frame.setAttribute('device', device)
  expect(frame.dataset.device).toBe(device)
  expect(frame.querySelector<HTMLElement>('.ui-device-frame__screen')?.style.aspectRatio).toBe(ratio)
  expect(frame.querySelector('.ui-device-frame__screen')?.firstElementChild).toBe(button)
  expect(frame.querySelectorAll('.ui-device-frame__glass')).toHaveLength(1)
})
