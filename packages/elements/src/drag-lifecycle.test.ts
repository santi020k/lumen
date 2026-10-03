import { afterEach, expect, test, vi } from 'vitest'

import { enhanceLumenResizable, enhanceLumenSchedules } from './index.js'

afterEach(() => {
  document.body.replaceChildren()
})

test('schedule ignores text drops naming unrelated document elements', () => {
  document.body.innerHTML = `<header id="outside">Outside</header><div data-ui-schedule>
    <div data-ui-schedule-slot="target"></div></div>`
  const outside = document.querySelector('header')
  const slot = document.querySelector('[data-ui-schedule-slot]')
  if (!outside || !slot) throw new Error('Expected schedule fixture')
  enhanceLumenSchedules(document)
  const event = new Event('drop', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'dataTransfer', { value: { getData: () => 'outside' } })
  slot.dispatchEvent(event)
  expect(outside.parentElement).toBe(document.body)
  expect(slot.children).toHaveLength(0)
})

test('resizable clears dragging state after pointer cancellation', () => {
  document.body.innerHTML = '<div data-ui-resizable><div>First</div><div>Second</div></div>'
  enhanceLumenResizable(document)
  const root = document.querySelector<HTMLElement>('[data-ui-resizable]')
  const handle = root?.querySelector<HTMLElement>('[data-ui-resizable-handle]')
  if (!root || !handle) throw new Error('Expected resize fixture')
  Object.defineProperty(handle, 'setPointerCapture', { value: vi.fn() })
  Object.defineProperty(handle, 'releasePointerCapture', { value: vi.fn() })
  Object.defineProperty(handle, 'hasPointerCapture', { value: () => false })
  handle.dispatchEvent(new MouseEvent('pointerdown', { button: 0, clientX: 10 }))
  expect(root.dataset.resizing).toBe('true')
  handle.dispatchEvent(new MouseEvent('pointercancel'))
  expect(root.dataset.resizing).toBeUndefined()
  expect(handle.dataset.active).toBeUndefined()
})

test('schedule moves its actively dragged event without an explicit ID', () => {
  document.body.innerHTML = `<div data-ui-schedule><div data-ui-schedule-slot="first">
    <article data-ui-schedule-event data-ui-draggable="true">Planning</article></div>
    <div data-ui-schedule-slot="second"></div></div>`
  const article = document.querySelector('article')
  const slot = document.querySelector('[data-ui-schedule-slot="second"]')
  if (!article || !slot) throw new Error('Expected schedule fixture')
  enhanceLumenSchedules(document)
  let payload = ''
  const transfer = { getData: () => payload,
    setData: (_type: string, value: string) => {
      payload = value
    } }
  for (const [target, type] of [[article, 'dragstart'], [slot, 'drop']] as const) {
    const event = new Event(type, { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'dataTransfer', { value: transfer })
    target.dispatchEvent(event)
  }
  expect(article.parentElement).toBe(slot)
})
