// @vitest-environment jsdom
import { expect, test, vi } from 'vitest'

import { initAmountFields } from './runtime/controllers/amount-field.js'

test('reinitialization rebinds adopted amount resets without duplicate edits or losing drafts', async () => {
  const frame = document.createElement('iframe')
  const form = document.createElement('form')

  form.innerHTML = '<span data-ui-amount-field default-value="1"><input data-ui-amount-input><input data-ui-amount-value type="hidden"></span>'

  document.body.append(form, frame)

  const destination = frame.contentDocument
  const input = form.querySelector('input')
  const submission = form.querySelector<HTMLInputElement>('[data-ui-amount-value]')

  if (!destination || !input || !submission) throw new Error('Missing amount adoption fixture')

  const listener = vi.spyOn(input, 'addEventListener')
  const changed = vi.fn()

  form.addEventListener('ui:amount-change', changed)

  try {
    initAmountFields(document)

    input.value = '9.'

    input.dispatchEvent(new Event('input'))

    destination.body.append(destination.adoptNode(form))

    initAmountFields(destination)

    initAmountFields(destination)

    expect(input.value).toBe('9.')

    expect(listener).toHaveBeenCalledTimes(3)

    expect(changed).toHaveBeenCalledTimes(1)

    form.addEventListener('reset', event => {
      event.preventDefault()
    }, { once: true })

    form.reset()

    await new Promise<void>(resolve => setTimeout(resolve, 0))

    expect(input.value).toBe('9.')

    form.reset()

    await new Promise<void>(resolve => setTimeout(resolve, 0))

    expect(input.value).toBe('1')

    expect(submission.value).toBe('1')
  } finally {
    form.remove()

    frame.remove()
  }
})
