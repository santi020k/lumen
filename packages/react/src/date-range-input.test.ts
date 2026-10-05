// @vitest-environment jsdom
import { act, createElement, useState } from 'react'
import { createRoot } from 'react-dom/client'

import { expect, test, vi } from 'vitest'

import { DateRangeInput } from './date-range-input.js'

const Harness = () => {
  const [value, setValue] = useState({ start: '2026-09-01', end: '2026-09-30' })

  return createElement(DateRangeInput, {
    value,
    onValueChange: setValue,
    label: 'Period',
    labels: { start: 'From', end: 'To', presets: 'Ranges', apply: 'Apply', cancel: 'Cancel' },
    name: { start: 'from', end: 'to' },
    presets: [{ label: 'October', value: { start: '2026-10-01', end: '2026-10-31' } }],
    validate: range => range.start > '2026-10-20' ? 'Too late' : undefined
  })
}

test('confirms drafts, discards cancellation, validates and restores keyboard focus', async () => {
  vi.stubGlobal('ResizeObserver', class {
    observe() { /* No layout in jsdom. */ }
    disconnect() { /* No layout in jsdom. */ }
  })
  const container = document.createElement('div')

  document.body.append(container)

  const root = createRoot(container)
  const run = async (action: () => void) => {
    await act(async () => {
      await Promise.resolve()
      action()
    })
  }
  const click = async (selector: string) => {
    const element = container.querySelector<HTMLElement>(selector)

    if (!element) throw new Error(`Missing ${selector}`)

    await run(() => {
      element.click()
    })
  }
  try {
    await run(() => {
      root.render(createElement(Harness))
    })
    await click('[aria-haspopup="dialog"]')
    await click('nav button')
    expect(container.querySelector<HTMLInputElement>('[name="from"]')?.value).toBe('2026-09-01')
    await click('.ui-range-input__actions button:first-child')
    await click('[aria-haspopup="dialog"]')
    expect(container.querySelector('.ui-range-calendar__endpoint strong')?.textContent).toBe('2026-09-01')
    await click('nav button')
    await click('.ui-range-input__actions button:last-child')
    expect(container.querySelector<HTMLInputElement>('[name="from"]')?.value).toBe('2026-10-01')
    expect(document.activeElement?.getAttribute('aria-haspopup')).toBe('dialog')
    await click('[aria-haspopup="dialog"]')
    await click('section:first-child [data-date="2026-10-25"]')
    expect(container.querySelector<HTMLButtonElement>('.ui-range-input__actions button:last-child')?.disabled).toBe(true)
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe('Too late')
    await run(() => container.querySelector('[role="dialog"]')?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    ))
    expect(container.querySelector('[aria-haspopup="dialog"]')?.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement?.getAttribute('aria-haspopup')).toBe('dialog')
    await click('[aria-haspopup="dialog"]')
    await run(() => document.body.dispatchEvent(new Event('pointerdown', { bubbles: true })))
    expect(container.querySelector('[aria-haspopup="dialog"]')?.getAttribute('aria-expanded')).toBe('false')
  } finally {
    await run(() => {
      root.unmount()
    })
    container.remove()
    vi.unstubAllGlobals()
  }
})

test('dismisses an iframe popover when focus leaves its owning document panel', async () => {
  vi.stubGlobal('ResizeObserver', class {
    observe() { /* No layout in jsdom. */ }
    disconnect() { /* No layout in jsdom. */ }
  })
  const iframe = document.createElement('iframe')

  document.body.append(iframe)
  const owner = iframe.contentDocument

  if (!owner) throw new Error('Missing iframe document')

  const container = owner.createElement('div')
  const outside = owner.createElement('button')

  outside.textContent = 'Outside'
  owner.body.append(container, outside)
  const root = createRoot(container)

  try {
    await act(async () => {
      await Promise.resolve()
      root.render(createElement(Harness))
    })
    const trigger = container.querySelector<HTMLButtonElement>('[aria-haspopup="dialog"]')

    if (!trigger) throw new Error('Missing range trigger')

    await act(async () => {
      await Promise.resolve()
      trigger.click()
    })
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    await act(async () => {
      await Promise.resolve()
      outside.focus()
    })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(owner.activeElement).toBe(outside)
  } finally {
    await act(async () => {
      await Promise.resolve()
      root.unmount()
    })
    iframe.remove()
    vi.unstubAllGlobals()
  }
})
