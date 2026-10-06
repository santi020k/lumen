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

test('changes shell colors independently of content and clears invalid or removed finishes', () => {
  const frame = new LumenDeviceFrameElement()
  const input = document.createElement('input')

  input.value = 'Keep this draft'
  frame.setAttribute('color', 'white')
  frame.append(input)
  document.body.append(frame)
  expect(frame.style.getPropertyValue('--ui-device-color')).toBe('white')
  frame.setAttribute('color', '#a9b8ac')
  expect(frame.style.getPropertyValue('--ui-device-color')).toBe('#a9b8ac')
  frame.setAttribute('color', '#fff;color:red')
  expect(frame.style.getPropertyValue('--ui-device-color')).toBe('')
  frame.setAttribute('color', 'black')
  expect(frame.style.getPropertyValue('--ui-device-color')).toBe('black')
  frame.removeAttribute('color')
  expect(frame.style.getPropertyValue('--ui-device-color')).toBe('')
  expect(frame.querySelector('input')).toBe(input)
  expect(input.value).toBe('Keep this draft')
})

test('preserves consumer CSS colors across orientation and temporary color attributes', () => {
  const frame = new LumenDeviceFrameElement()

  frame.style.setProperty('--ui-device-color', '#abc', 'important')
  document.body.append(frame)
  frame.setAttribute('orientation', 'landscape')
  expect(frame.style.getPropertyValue('--ui-device-color')).toBe('#abc')
  frame.setAttribute('color', 'white')
  expect(frame.style.getPropertyValue('--ui-device-color')).toBe('white')
  frame.removeAttribute('color')
  expect(frame.style.getPropertyValue('--ui-device-color')).toBe('#abc')
  expect(frame.style.getPropertyPriority('--ui-device-color')).toBe('important')
})

test.each([
  ['macbook-pro', '1280 / 800'],
  ['macbook-air', '1280 / 800'],
  ['imac', '1440 / 810'],
  ['pixel', '412 / 915'],
  ['ipad-pro', '834 / 1194']
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
