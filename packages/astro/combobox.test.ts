// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { clearComboboxes, initComboboxes } from './runtime/controllers/combobox.js'

afterEach(() => {
  clearComboboxes()

  document.body.replaceChildren()
})

const fixture = () => {
  const form = document.createElement('form')

  form.innerHTML = '<fieldset><div data-ui-combobox><input role="combobox"><div role="listbox"><span role="option">Alpha</span><span role="option">Beta</span></div></div></fieldset>'

  document.body.append(form)

  const root = form.querySelector<HTMLElement>('[data-ui-combobox]')
  const input = form.querySelector('input')
  const list = form.querySelector<HTMLElement>('[role="listbox"]')
  const fieldset = form.querySelector('fieldset')

  if (!root || !input || !list || !fieldset) throw new Error('Missing combobox adoption fixture')

  return { form, root, input, list, fieldset }
}

const settle = async (): Promise<void> => {
  await new Promise<void>(resolve => setTimeout(resolve, 0))
}

test('adopted combobox initialization moves reset and disabled observers to its current document', async () => {
  const { form, input, list, fieldset } = fixture()
  const frame = document.createElement('iframe')

  document.body.append(frame)

  const destination = frame.contentDocument

  if (!destination) throw new Error('Missing combobox destination document')

  initComboboxes(document)

  destination.body.append(destination.adoptNode(form))

  initComboboxes(destination)

  const listener = vi.spyOn(input, 'addEventListener')

  initComboboxes(destination)

  expect(listener).not.toHaveBeenCalled()

  input.value = 'Beta'

  input.dispatchEvent(new Event('input'))

  expect(list.hidden).toBe(false)

  form.addEventListener('reset', event => {
    event.preventDefault()
  }, { once: true })

  form.reset()

  await settle()

  expect(input.value).toBe('Beta')

  expect(list.hidden).toBe(false)

  form.reset()

  await settle()

  expect(input.value).toBe('')

  expect(list.hidden).toBe(true)

  input.dispatchEvent(new Event('focus'))

  expect(list.hidden).toBe(false)

  fieldset.disabled = true

  await settle()

  expect(list.hidden).toBe(true)
})

test('moving a connected combobox into a shadow root rebinds reset without changing documents', async () => {
  const { form, input, list } = fixture()
  const host = document.createElement('div')

  document.body.append(host)

  const shadow = host.attachShadow({ mode: 'open' })

  initComboboxes(document)

  shadow.append(form)

  initComboboxes(shadow)

  input.value = 'Beta'

  input.dispatchEvent(new Event('input'))

  expect(list.hidden).toBe(false)

  form.reset()

  await settle()

  expect(input.value).toBe('')

  expect(list.hidden).toBe(true)
})
