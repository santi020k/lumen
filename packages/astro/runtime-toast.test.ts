// @vitest-environment jsdom
import { describe, expect, test, vi } from 'vitest'

import { initToasts, readToastDetail } from './runtime/features/toast.js'

describe('toast runtime boundary', () => {
  test('ignores malformed event fields and nonfinite numeric options', () => {
    for (const value of [null, false, 'notice', [], 4]) expect(readToastDetail(value)).toEqual({})
    expect(readToastDetail({
      title: { unsafe: true },
      description: 3,
      duration: Infinity,
      max: NaN,
      id: [],
      placement: 'somewhere',
      action: { label: false, onClick: 'callback' }
    })).toEqual({ action: {} })
  })

  test('preserves caller labels, placement, action values, and callbacks', () => {
    const onClick = vi.fn()
    const detail = {
      id: 'saved',
      title: 'Saved',
      description: 'Ready',
      duration: 0,
      max: 3,
      placement: 'top-center',
      variant: 'success',
      action: { label: 'Undo', event: 'app:undo', onClick, value: { id: 2 } }
    }

    expect(readToastDetail(detail)).toEqual(detail)
  })

  test('creates and dismisses a toast from events without accepting HTML', () => {
    initToasts(document)
    document.dispatchEvent(new CustomEvent('ui:toast', { detail: {
      id: 'notice', title: '<img src=x onerror=alert(1)>', duration: 0
    } }))
    const toast = document.getElementById('notice')

    expect(toast?.textContent).toContain('<img src=x onerror=alert(1)>')
    expect(toast?.querySelector('img')).toBeNull()
    document.dispatchEvent(new CustomEvent('ui:toast-dismiss', { detail: { id: 'notice' } }))
    expect(toast?.dataset.state).toBe('closed')
  })
})

test('reopening a toast by ID cancels its pending removal', () => {
  vi.useFakeTimers()
  try {
    initToasts(document)
    const create = () => document.dispatchEvent(new CustomEvent('ui:toast', { detail: { id: 'retry-toast', title: 'Saving', duration: 0 } }))
    const dismiss = () => document.dispatchEvent(new CustomEvent('ui:toast-dismiss', { detail: { id: 'retry-toast' } }))

    create()
    dismiss()
    vi.advanceTimersByTime(100)
    create()
    vi.advanceTimersByTime(200)
    expect(document.getElementById('retry-toast')?.dataset.state).toBe('open')
    dismiss()
    vi.advanceTimersByTime(240)
    expect(document.getElementById('retry-toast')).toBeNull()
  } finally {
    vi.useRealTimers()
    document.body.replaceChildren()
  }
})
