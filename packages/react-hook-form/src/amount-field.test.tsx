// @vitest-environment jsdom

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { useForm } from 'react-hook-form'

import { expect, test } from 'vitest'

import { LumenAmountFieldController } from './components.js'

test('managed amount fields submit exact drafts, focus invalid controls and reset', async () => {
  const saved: string[] = []
  const container = document.createElement('div')
  const root = createRoot(container)

  document.body.append(container)

  const Fixture = () => {
    const { control, handleSubmit, reset } = useForm<{ amount: string }>({ defaultValues: { amount: '1234.50' } })

    return (
      <form
        noValidate
        onSubmit={handleSubmit(values => {
          saved.push(values.amount)
        })}
      >
        <LumenAmountFieldController control={control} name="amount" locale="es-CO" aria-label="Amount COP" rules={{ validate: value => /^[0-9]+(?:\.[0-9]+)?$/u.test(value) || 'Enter a complete amount.' }} />
        <button
          type="button"
          onClick={() => {
            reset()
          }}
        >
          Reset managed draft
        </button>
      </form>
    )
  }

  try {
    await act(async () => {
      root.render(<Fixture />)

      await Promise.resolve()
    })

    const form = container.querySelector('form')
    const input = container.querySelector<HTMLInputElement>('[data-ui-amount-input]')

    if (!form || !input) throw new Error('Missing managed amount form')

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

      await Promise.resolve()
    })

    expect(saved).toEqual(['1234.50'])

    await act(async () => {
      input.value = '1,'

      input.dispatchEvent(new InputEvent('input', { bubbles: true }))

      await Promise.resolve()
    })

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

      await Promise.resolve()
    })

    expect(saved).toHaveLength(1)
    expect(document.activeElement).toBe(input)

    await act(async () => {
      container.querySelector('button')?.click()

      await Promise.resolve()
    })

    expect(input.value).toBe('1.234,50')
  } finally {
    act(() => {
      root.unmount()
    })

    container.remove()
  }
})
