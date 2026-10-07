// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { observeLumenVirtualWindow } from './virtual-window.js'

afterEach(() => {
  document.body.replaceChildren()
})

test('observes iframe container resizing and disconnects the owning document observer', () => {
  const frame = document.createElement('iframe')

  document.body.append(frame)
  const frameDocument = frame.contentDocument
  const view = frameDocument?.defaultView

  if (!frameDocument || !view) throw new Error('Expected iframe document')

  let notifyResize: (() => void) | undefined
  const observe = vi.fn()
  const disconnect = vi.fn()

  class FrameResizeObserver {
    constructor(callback: () => void) {
      notifyResize = callback
    }

    observe = observe
    disconnect = disconnect
  }

  Object.defineProperty(view, 'ResizeObserver', { configurable: true, value: FrameResizeObserver })
  const root = frameDocument.createElement('div')
  let height = 80

  Object.defineProperty(root, 'clientHeight', { configurable: true, get: () => height })
  frameDocument.body.append(root)
  const onChange = vi.fn()
  const controller = observeLumenVirtualWindow(root, {
    itemCount: 20, itemSize: 40, overscan: 0, onChange
  })

  try {
    expect(observe).toHaveBeenCalledWith(root)
    expect(root.dataset.uiRangeEnd).toBe('1')
    height = 160
    notifyResize?.()
    expect(root.dataset.uiRangeEnd).toBe('3')
    expect(onChange).toHaveBeenCalledTimes(2)
  } finally {
    controller.destroy()
  }

  expect(disconnect).toHaveBeenCalledTimes(1)
  notifyResize?.()
  root.dispatchEvent(new Event('scroll'))
  expect(onChange).toHaveBeenCalledTimes(2)
  expect(root.dataset.uiRangeEnd).toBeUndefined()
})
