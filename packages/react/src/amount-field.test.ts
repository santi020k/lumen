// @vitest-environment jsdom

import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'

import { expect, test } from 'vitest'

import { AmountField } from './amount-field.js'

test('AmountField keeps controlled drafts host-owned and submits canonical strings', () => {
  const container = document.createElement('div')
  const root = createRoot(container)
  const drafts: string[] = []

  const render = (value: string, disabled = false) => {
    act(() => {
      root.render(createElement('form', {}, createElement(AmountField, { value,
        name: 'amount',
        locale: 'es-CO',
        'aria-label': 'Monto COP',
        disabled,
        onValueChange: draft => {
          drafts.push(draft)
        } })))
    })
  }

  try {
    render('1234.50')

    const input = container.querySelector<HTMLInputElement>('[data-ui-amount-input]')
    const form = container.querySelector('form')

    if (!input || !form) throw new Error('Missing amount form')

    expect(input.value).toBe('1.234,50')
    expect(new FormData(form).get('amount')).toBe('1234.50')

    act(() => {
      input.value = '9,50'

      input.dispatchEvent(new InputEvent('input', { bubbles: true }))
    })

    expect(drafts).toEqual(['9.50'])
    expect(input.value).toBe('1.234,50')

    render('9.50')

    expect(input.value).toBe('9,50')

    render('9.50', true)

    expect(new FormData(form).has('amount')).toBe(false)
  } finally {
    act(() => {
      root.unmount()
    })
  }
})

test('uncontrolled amount survives parent loading renders and resets its submitted value', async () => {
  const container = document.createElement('div')
  const root = createRoot(container)
  const render = (disabled: boolean) => {
    act(() => {
      root.render(createElement('form', {}, createElement(AmountField, {
        defaultValue: '1234.50', name: 'amount', locale: 'es-CO', disabled
      })))
    })
  }

  try {
    render(false)

    const input = container.querySelector<HTMLInputElement>('[data-ui-amount-input]')
    const form = container.querySelector('form')

    if (!input || !form) throw new Error('Missing uncontrolled amount form')

    act(() => {
      input.value = '9,50'

      input.dispatchEvent(new InputEvent('input', { bubbles: true }))
    })

    render(true)

    expect(input.value).toBe('9,50')

    render(false)

    expect(new FormData(form).get('amount')).toBe('9.50')

    await act(async () => {
      form.reset()

      await new Promise<void>(resolve => {
        setTimeout(resolve, 0)
      })
    })

    expect(input.value).toBe('1.234,50')
    expect(new FormData(form).get('amount')).toBe('1234.50')
  } finally {
    act(() => {
      root.unmount()
    })
  }
})

test('updated uncontrolled default changes reset baseline without discarding the current draft', async () => {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  const render = (defaultValue: string) => {
    act(() => {
      root.render(createElement('form', {}, createElement(AmountField, { defaultValue, name: 'amount' })))
    })
  }
  try {
    render('1.50')
    const input = container.querySelector<HTMLInputElement>('[data-ui-amount-input]')
    const form = container.querySelector('form')
    if (!input || !form) throw new Error('Missing amount default fixture')
    act(() => {
      input.value = '9.25'
      input.dispatchEvent(new InputEvent('input', { bubbles: true }))
    })
    render('2.75')
    expect(input.value).toBe('9.25')
    expect(new FormData(form).get('amount')).toBe('9.25')
    await act(async () => {
      form.reset()
      await new Promise<void>(resolve => {
        setTimeout(resolve, 0)
      })
    })
    expect(input.value).toBe('2.75')
    expect(new FormData(form).get('amount')).toBe('2.75')
  } finally {
    act(() => {
      root.unmount()
    })
    container.remove()
  }
})
