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

test('amount element clears and updates its generated ID when the host ID changes', () => {
  defineLumenElements()

  const field = document.createElement('lumen-amount-field')

  field.id = 'amount'

  document.body.append(field)

  try {
    const input = field.querySelector<HTMLInputElement>('[data-ui-amount-input]')

    if (!input) throw new Error('Missing amount input')

    expect(input.id).toBe('amount-input')

    field.removeAttribute('id')

    expect(input.hasAttribute('id')).toBe(false)

    field.id = 'replacement'

    expect(input.id).toBe('replacement-input')

    field.id = ''

    expect(input.hasAttribute('id')).toBe(false)
  } finally {
    field.remove()
  }
})

test('amount element restores a supplied input ID after removing the host ID', () => {
  defineLumenElements()

  const field = document.createElement('lumen-amount-field')

  field.innerHTML = '<input data-ui-amount-input id="authored-amount">'

  document.body.append(field)

  try {
    const input = field.querySelector('input')

    if (!input) throw new Error('Missing authored amount input')

    expect(input.id).toBe('authored-amount')

    field.id = 'owner'

    expect(input.id).toBe('owner-input')

    field.removeAttribute('id')

    expect(input.id).toBe('authored-amount')
  } finally {
    field.remove()
  }
})

test('amount element preserves input IDs authored after mount and while generated', () => {
  defineLumenElements()

  const field = document.createElement('lumen-amount-field')

  document.body.append(field)

  try {
    const input = field.querySelector('input')

    if (!input) throw new Error('Missing amount input')

    input.id = 'late-authored'

    field.setAttribute('required', '')

    expect(input.id).toBe('late-authored')

    input.id = 'changed-authored'

    field.setAttribute('locale', 'en')

    expect(input.id).toBe('changed-authored')

    field.id = 'host'

    input.id = 'edited-generated'

    field.setAttribute('name', 'amount')

    expect(input.id).toBe('host-input')

    field.removeAttribute('id')

    expect(input.id).toBe('edited-generated')

    input.removeAttribute('id')

    field.removeAttribute('required')

    expect(input.hasAttribute('id')).toBe(false)
  } finally {
    field.remove()
  }
})

test('amount element tracks a replacement child identity across reconnects', () => {
  defineLumenElements()

  const field = document.createElement('lumen-amount-field')

  field.innerHTML = '<input data-ui-amount-input id="original-child">'

  document.body.append(field)

  field.remove()

  field.innerHTML = '<input data-ui-amount-input id="replacement-child">'

  document.body.append(field)

  try {
    const input = field.querySelector('input')

    if (!input) throw new Error('Missing replacement input')

    expect(input.id).toBe('replacement-child')

    field.id = 'host'

    field.removeAttribute('id')

    expect(input.id).toBe('replacement-child')
  } finally {
    field.remove()
  }
})
