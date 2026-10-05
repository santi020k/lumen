// @vitest-environment jsdom

import { expect, test } from 'vitest'

import { defineLumenElements } from './define.js'

test('amount element forwards naming, form and disabled state and supports changes and reset', async () => {
  defineLumenElements()

  const form = document.createElement('form')
  const field = document.createElement('lumen-amount-field')

  field.setAttribute('name', 'amount')

  field.setAttribute('locale', 'es-CO')

  field.setAttribute('default-value', '1234.50')

  field.setAttribute('aria-label', 'Monto COP')

  form.append(field)

  document.body.append(form)

  try {
    const input = field.querySelector<HTMLInputElement>('[data-ui-amount-input]')

    if (!input) throw new Error('Missing amount input')

    expect(input.value).toBe('1.234,50')
    expect(input.getAttribute('aria-label')).toBe('Monto COP')
    expect(new FormData(form).get('amount')).toBe('1234.50')

    input.value = '9,50'

    input.dispatchEvent(new InputEvent('input', { bubbles: true }))

    expect(field.getAttribute('value')).toBe('9.50')

    field.setAttribute('disabled', '')

    expect(new FormData(form).has('amount')).toBe(false)

    field.removeAttribute('disabled')

    form.reset()

    await new Promise<void>(resolve => {
      setTimeout(resolve, 0)
    })

    expect(input.value).toBe('1.234,50')
    expect(field.getAttribute('value')).toBe('1234.50')
  } finally {
    form.remove()
  }
})
