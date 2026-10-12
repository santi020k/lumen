// @vitest-environment jsdom
import { act, createElement } from 'react'
import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { DatePicker } from './components.js'

let container: HTMLDivElement
let root: Root

const run = async (action: () => void) => {
  await act(async () => {
    action()
    await new Promise(resolve => setTimeout(resolve, 0))
  })
}

const nativeInput = (): HTMLInputElement => {
  const input = container.querySelector('input[type="date"]')
  if (!(input instanceof HTMLInputElement)) throw new Error('Missing native date input')
  return input
}

const trigger = (): HTMLButtonElement => {
  const button = container.querySelector('[data-ui-date-picker-trigger]')
  if (!(button instanceof HTMLButtonElement)) throw new Error('Missing date trigger')
  return button
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await run(() => {
    root.unmount()
  })
  container.remove()
  vi.unstubAllGlobals()
})

test('DatePicker opens on the selected month after a consumer updates its controlled value', async () => {
  await run(() => {
    root.render(createElement(DatePicker, { value: '2026-09-10', locale: 'en' }))
  })
  await run(() => {
    root.render(createElement(DatePicker, { value: '2024-03-12', locale: 'en' }))
  })
  await run(() => {
    trigger().click()
  })

  expect(container.querySelector('[data-ui-calendar-label]')?.textContent).toBe('March 2024')
  expect(document.activeElement?.getAttribute('data-date')).toBe('2024-03-12')
})

test('DatePicker clears a generated invalid state after the controlled date becomes valid', async () => {
  await run(() => {
    root.render(createElement(DatePicker, { required: true, value: '', locale: 'en' }))
  })
  await run(() => {
    expect(nativeInput().checkValidity()).toBe(false)
  })
  expect(trigger().getAttribute('aria-invalid')).toBe('true')

  await run(() => {
    root.render(createElement(DatePicker, { required: true, value: '2026-09-10', locale: 'en' }))
  })

  expect(nativeInput().validity.valid).toBe(true)
  expect(trigger().getAttribute('aria-invalid')).not.toBe('true')
})

test('DatePicker exposes a consumer-provided invalid state on its visible trigger', async () => {
  await run(() => {
    root.render(createElement(DatePicker, {
      'aria-invalid': true,
      'aria-describedby': 'date-error',
      'aria-errormessage': 'date-error',
      value: '2026-09-10'
    }))
  })

  expect(trigger().getAttribute('aria-invalid')).toBe('true')
  expect(trigger().getAttribute('aria-describedby')).toBe('date-error')
  expect(trigger().getAttribute('aria-errormessage')).toBe('date-error')
})

test.each([true, false, 'grammar', 'spelling'] as const)('DatePicker retains an explicit invalid state %s through native validation', async invalid => {
  await run(() => {
    root.render(createElement(DatePicker, { 'aria-invalid': invalid, required: true, value: '' }))
  })
  await run(() => {
    expect(nativeInput().checkValidity()).toBe(false)
  })
  expect(trigger().getAttribute('aria-invalid')).toBe(String(invalid))
})

test('DatePicker clears generated errors on reset but retains them when reset is canceled', async () => {
  await run(() => {
    root.render(createElement('form', null, createElement(DatePicker, { required: true, defaultValue: '' })))
  })
  const form = container.querySelector('form')

  if (!form) throw new Error('Missing date form')

  await run(() => {
    nativeInput().checkValidity()
  })
  expect(trigger().getAttribute('aria-invalid')).toBe('true')
  await run(() => {
    form.addEventListener('reset', event => {
      event.preventDefault()
    }, { once: true })
    form.reset()
  })
  expect(trigger().getAttribute('aria-invalid')).toBe('true')
  await run(() => {
    form.reset()
  })
  expect(trigger().hasAttribute('aria-invalid')).toBe(false)
})

test('DatePicker still handles Escape when month navigation leaves focus on the document', async () => {
  await run(() => {
    root.render(createElement(DatePicker, { value: '2024-03-12' }))
  })
  await run(() => {
    trigger().click()
  })
  expect(trigger().getAttribute('aria-expanded')).toBe('true')
  await run(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  })
  expect(trigger().getAttribute('aria-expanded')).toBe('false')
  expect(document.activeElement).toBe(trigger())
})
