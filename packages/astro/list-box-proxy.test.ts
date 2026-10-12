// @vitest-environment jsdom
import { afterEach, expect, test } from 'vitest'

import { bindListBoxProxy } from './runtime/controllers/list-box-proxy.js'

let labelCount = 0

const fixture = (selectAttributes = '') => {
  document.body.innerHTML = `<form>
    <label for="reviewer">Reviewer</label>
    <div data-ui-list-box>
      <select data-ui-list-box-native id="reviewer" name="reviewer" required ${selectAttributes}>
        <option value="amina">Amina</option>
        <option value="theo">Theo</option>
      </select>
      <div data-ui-list-box-list role="listbox" tabindex="0"></div>
    </div>
  </form>`

  const root = document.querySelector<HTMLElement>('[data-ui-list-box]')
  const select = document.querySelector<HTMLSelectElement>('select')
  const list = document.querySelector<HTMLElement>('[data-ui-list-box-list]')

  if (!root || !select || !list) throw new Error('Expected list box fixture')

  select.selectedIndex = -1
  bindListBoxProxy(root, select, list, () => `generated-label-${++labelCount}`)

  return { list, select }
}

afterEach(() => {
  document.body.replaceChildren()
})

test('Astro list boxes move naming, required state, and focus to the visible list', () => {
  const { list, select } = fixture()

  expect(select.tabIndex).toBe(-1)
  expect(select.getAttribute('aria-hidden')).toBe('true')
  expect(list.getAttribute('aria-labelledby')).toBe(document.querySelector('label')?.id)
  expect(list.getAttribute('aria-required')).toBe('true')

  select.focus()
  expect(document.activeElement).toBe(list)
})

test('Astro list boxes mark native invalid state on the list and clear it after a valid change', () => {
  const { list, select } = fixture()

  expect(select.form?.reportValidity()).toBe(false)
  expect(list.getAttribute('aria-invalid')).toBe('true')
  expect(document.activeElement).toBe(list)

  select.value = 'theo'
  select.dispatchEvent(new Event('change', { bubbles: true }))
  expect(list.hasAttribute('aria-invalid')).toBe(false)
})

test('Astro list boxes keep an explicit name and consumer invalid state', () => {
  const { list } = fixture('aria-label="Primary reviewer" aria-invalid="false"')

  expect(list.getAttribute('aria-label')).toBe('Primary reviewer')
  expect(list.hasAttribute('aria-labelledby')).toBe(false)
  expect(list.getAttribute('aria-invalid')).toBe('false')
})

test('a disabled Astro list does not receive redirected focus', () => {
  const { list, select } = fixture()

  list.removeAttribute('tabindex')
  list.setAttribute('aria-disabled', 'true')
  select.focus()
  expect(document.activeElement).not.toBe(list)
})

const settle = () => new Promise(resolve => setTimeout(resolve, 0))

test('Astro list boxes follow later disabled, naming, required, and consumer invalid changes', async () => {
  const { list, select } = fixture()

  select.setAttribute('disabled', '')
  await settle()
  expect(list.tabIndex).toBe(-1)
  expect(list.getAttribute('aria-disabled')).toBe('true')

  select.removeAttribute('disabled')
  select.setAttribute('aria-label', 'Lead reviewer')
  select.setAttribute('aria-describedby', 'reviewer-hint')
  select.required = false
  select.setAttribute('aria-invalid', 'true')
  await settle()
  expect(list.tabIndex).toBe(0)
  expect(list.hasAttribute('aria-disabled')).toBe(false)
  expect(list.getAttribute('aria-label')).toBe('Lead reviewer')
  expect(list.getAttribute('aria-describedby')).toBe('reviewer-hint')
  expect(list.hasAttribute('aria-required')).toBe(false)
  expect(list.getAttribute('aria-invalid')).toBe('true')

  select.removeAttribute('aria-invalid')
  await settle()
  expect(list.hasAttribute('aria-invalid')).toBe(false)
})

test('an accepted reset clears generated invalid state on an empty required multiple list; a canceled reset keeps it', async () => {
  const { list, select } = fixture('multiple')
  const form = select.form

  expect(form?.reportValidity()).toBe(false)
  expect(list.getAttribute('aria-invalid')).toBe('true')

  const cancel = (event: Event) => {
    event.preventDefault()
  }

  form?.addEventListener('reset', cancel)
  form?.reset()
  await settle()
  expect(list.getAttribute('aria-invalid')).toBe('true')

  form?.removeEventListener('reset', cancel)
  form?.reset()
  await settle()
  expect(select.validity.valid).toBe(false)
  expect(list.hasAttribute('aria-invalid')).toBe(false)
})

test('generated invalid state clears when the list stops validating after an invalid submission', async () => {
  const { list, select } = fixture('multiple')

  expect(select.form?.reportValidity()).toBe(false)
  expect(list.getAttribute('aria-invalid')).toBe('true')

  select.required = false
  await settle()
  expect(list.hasAttribute('aria-invalid')).toBe(false)

  select.required = true
  expect(select.form?.reportValidity()).toBe(false)
  expect(list.getAttribute('aria-invalid')).toBe('true')

  select.disabled = true
  await settle()
  expect(list.hasAttribute('aria-invalid')).toBe(false)

  select.disabled = false
  await settle()
  expect(list.hasAttribute('aria-invalid')).toBe(false)

  select.setAttribute('aria-invalid', 'true')
  select.required = false
  await settle()
  expect(list.getAttribute('aria-invalid')).toBe('true')
})
