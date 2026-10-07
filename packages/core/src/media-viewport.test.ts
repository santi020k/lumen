// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { bindLumenMediaViewport, formatLumenMediaZoom, lumenMediaViewportActions, syncLumenMediaViewport } from './media-viewport.js'
import type { LumenMediaViewportValue } from './media-workspace.js'

const cleanups: (() => void)[] = []

afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup()

  document.body.replaceChildren()
  vi.restoreAllMocks()
})

const fixture = () => {
  const root = document.createElement('figure')

  root.className = 'ui-media-viewport'

  root.innerHTML = '<div data-ui-media-viewport-stage tabindex="0"><div data-ui-media-viewport-content><img alt="Landscape"></div></div><span data-ui-media-viewport-status></span>'

  for (const action of lumenMediaViewportActions) {
    const button = document.createElement('button')

    button.dataset.uiMediaViewportAction = action

    root.append(button)
  }
  document.body.append(root)
  const stage = root.querySelector<HTMLElement>('[data-ui-media-viewport-stage]')
  const content = root.querySelector<HTMLElement>('[data-ui-media-viewport-content]')

  if (!stage || !content) throw new Error('Expected viewport fixture')

  stage.setPointerCapture = vi.fn()
  stage.hasPointerCapture = vi.fn(() => false)
  stage.releasePointerCapture = vi.fn()

  return { root, stage, content }
}

const button = (root: HTMLElement, action: string) => {
  const found = root.querySelector<HTMLButtonElement>(`[data-ui-media-viewport-action="${action}"]`)

  if (!found) throw new Error('Expected viewport action')

  return found
}

test('formats zoom safely even for malformed locale identifiers', () => {
  expect(formatLumenMediaZoom(1.25, 'en')).toBe('125%')
  expect(formatLumenMediaZoom(2, 'invalid_tag')).toBe('200%')
})

test('adopted content controls keep their pointer interaction instead of starting a pan', () => {
  const { root, stage, content } = fixture()
  const capture = vi.spyOn(stage, 'setPointerCapture')
  const control = document.createElement('button')
  const child = document.createElement('span')

  control.append(child)
  content.append(control)
  const iframe = document.createElement('iframe')

  document.body.append(iframe)
  const destination = iframe.contentDocument

  if (!destination) throw new Error('Missing destination document')

  destination.body.append(destination.adoptNode(root))
  cleanups.push(bindLumenMediaViewport(root, {
    disabled: () => false, getValue: () => ({ zoom: 2, x: 0, y: 0 }), maxZoom: () => 4, onValueChange: vi.fn()
  }))
  for (const target of [control, child]) {
    const event = new MouseEvent('pointerdown', { button: 0, bubbles: true, cancelable: true })

    target.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  }
  expect(capture).not.toHaveBeenCalled()
})

test('adopted original-realm buttons and destination-created descendants remain interactive', () => {
  const { root } = fixture()
  const iframe = document.createElement('iframe')

  document.body.append(iframe)
  const destination = iframe.contentDocument

  if (!destination) throw new Error('Missing destination document')

  destination.body.append(destination.adoptNode(root))
  let value: LumenMediaViewportValue = { zoom: 1, x: 0, y: 0 }

  cleanups.push(bindLumenMediaViewport(root, {
    disabled: () => false,
    getValue: () => value,
    maxZoom: () => 4,
    onValueChange: next => {
      value = next
    }
  }))
  const zoom = button(root, 'zoom-in')

  zoom.click()
  expect(value.zoom).toBe(1.25)
  const child = destination.createElement('span')

  zoom.append(child)
  child.click()
  expect(value.zoom).toBe(1.5)
  zoom.disabled = true
  child.click()
  expect(value.zoom).toBe(1.5)
})

test('supports keyboard and visible actions, enforces bounds and resets to fit', () => {
  const { root, stage, content } = fixture()
  let value: LumenMediaViewportValue = { zoom: 1, x: 0, y: 0 }
  const changes = vi.fn()

  cleanups.push(bindLumenMediaViewport(root, {
    disabled: () => false,
    getValue: () => value,
    maxZoom: () => 2,
    onValueChange: next => {
      value = next

      changes(next)

      syncLumenMediaViewport(root, value, 2)
    }
  }))
  syncLumenMediaViewport(root, value, 2)
  expect(button(root, 'fit').disabled).toBe(true)
  button(root, 'zoom-in').click()
  expect(value.zoom).toBe(1.25)
  stage.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }))
  expect(value.x).toBe(-0.25)
  expect(content.style.transform).toBe('translate(-3.125%, 0%) scale(1.25)')
  expect(root.querySelector('[data-ui-media-viewport-status]')?.textContent).toBe('125%')
  expect(stage.style.touchAction).toBe('none')
  button(root, 'fit').click()
  expect(value).toEqual({ zoom: 1, x: 0, y: 0 })
  expect(stage.style.touchAction).toBe('pan-y')
  expect(button(root, 'left').disabled).toBe(true)
  expect(changes).toHaveBeenCalledTimes(3)
})

test('respects disabled state and does not steal keyboard input from descendant controls', () => {
  const { root, stage } = fixture()
  const changes = vi.fn()
  const input = document.createElement('input')

  stage.append(input)
  cleanups.push(bindLumenMediaViewport(root, {
    disabled: () => false, getValue: () => ({ zoom: 2, x: 0, y: 0 }), maxZoom: () => 4, onValueChange: changes
  }))
  input.dispatchEvent(new KeyboardEvent('keydown', { key: '+', bubbles: true, cancelable: true }))
  expect(changes).not.toHaveBeenCalled()
  cleanups.push(bindLumenMediaViewport(root, {
    disabled: () => true, getValue: () => ({ zoom: 2, x: 0, y: 0 }), maxZoom: () => 4, onValueChange: changes
  }))
  syncLumenMediaViewport(root, { zoom: 2, x: 0, y: 0 }, 4, true)
  button(root, 'zoom-in').click()
  expect(changes).not.toHaveBeenCalled()
})

test('pans by pointer displacement, cancels cleanly and removes listeners on cleanup', () => {
  const { root, stage } = fixture()
  const changes = vi.fn()
  let value = { zoom: 2, x: 0, y: 0 }

  vi.spyOn(stage, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 200))
  const cleanup = bindLumenMediaViewport(root, {
    disabled: () => false,
    getValue: () => value,
    maxZoom: () => 4,
    onValueChange: next => {
      value = next

      changes(next)
    }
  })

  cleanups.push(cleanup)
  const pointer = (type: string, x: number, y: number) => {
    stage.dispatchEvent(Object.assign(new Event(type, { bubbles: true, cancelable: true }), {
      button: 0, pointerId: 1, clientX: x, clientY: y
    }))
  }

  pointer('pointerdown', 0, 0)
  pointer('pointermove', 25, 50)
  expect(value).toEqual({ zoom: 2, x: 0.5, y: 0.5 })
  pointer('pointercancel', 25, 50)
  pointer('pointermove', 100, 100)
  expect(changes).toHaveBeenCalledOnce()
  cleanup()
  button(root, 'fit').click()
  expect(changes).toHaveBeenCalledOnce()
})
