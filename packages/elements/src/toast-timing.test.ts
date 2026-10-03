import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { defineLumenElements, LumenToast } from './index.js'

beforeEach(() => {
  vi.useFakeTimers()
  defineLumenElements()
})
afterEach(() => {
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
  document.body.replaceChildren()
})

test('keeps overlapping hover and focus pauses until both end without losing duration', () => {
  LumenToast.create({ id: 'overlap-toast', title: 'Paused', duration: 1000, action: { label: 'Action' } })
  const toast = document.getElementById('overlap-toast')
  const action = toast?.querySelector('button')
  if (!toast || !action) throw new Error('Expected toast action')
  vi.advanceTimersByTime(100)
  toast.dispatchEvent(new MouseEvent('mouseenter'))
  vi.advanceTimersByTime(200)
  action.focus()
  toast.dispatchEvent(new MouseEvent('mouseleave'))
  vi.advanceTimersByTime(2000)
  expect(toast.dataset.state).not.toBe('closed')
  action.blur()
  vi.advanceTimersByTime(899)
  expect(toast.dataset.state).not.toBe('closed')
  vi.advanceTimersByTime(1)
  expect(toast.dataset.state).toBe('closed')
})
