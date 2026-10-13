// @vitest-environment jsdom
// cspell:words multiselectable
import { afterEach, expect, test } from 'vitest'

import { enhanceLumenListBoxes } from './define.js'

const element = <T extends Element>(selector: string, type: new () => T): T => {
  const value = document.querySelector(selector)

  if (!(value instanceof type)) throw new Error(`Missing ${selector}`)

  return value
}

afterEach(() => {
  document.body.replaceChildren()
})

const enhancedMarkup = (attributes = '') => `
  <form>
    <label for="reviewer">Reviewer</label>
    <div data-ui-list-box>
      <select data-ui-list-box-native id="reviewer" name="reviewer" required ${attributes}>
        <option value="amina">Amina</option>
        <option value="theo">Theo</option>
      </select>
      <div data-ui-list-box-list role="listbox" tabindex="0">
        <div data-ui-list-box-option data-value="amina" role="option">Amina</div>
        <div data-ui-list-box-option data-value="theo" role="option">Theo</div>
      </div>
    </div>
  </form>`

test('the enhanced list is the only focus stop and carries the native label and required state', () => {
  document.body.innerHTML = enhancedMarkup()
  enhanceLumenListBoxes(document)

  const select = element('select', HTMLSelectElement)
  const list = element('[data-ui-list-box-list]', HTMLElement)
  const label = element('label', HTMLLabelElement)

  expect(select.tabIndex).toBe(-1)
  expect(select.getAttribute('aria-hidden')).toBe('true')
  expect(label.id).not.toBe('')
  expect(list.getAttribute('aria-labelledby')).toBe(label.id)
  expect(list.getAttribute('aria-required')).toBe('true')

  select.focus()
  expect(document.activeElement).toBe(list)
})

test('native invalid marks and focuses the list until a valid choice clears it', () => {
  document.body.innerHTML = enhancedMarkup()
  element('select', HTMLSelectElement).selectedIndex = -1
  enhanceLumenListBoxes(document)

  const form = element('form', HTMLFormElement)
  const list = element('[data-ui-list-box-list]', HTMLElement)

  expect(form.reportValidity()).toBe(false)
  expect(list.getAttribute('aria-invalid')).toBe('true')
  expect(document.activeElement).toBe(list)

  element('[data-value="theo"]', HTMLElement).click()
  expect(list.hasAttribute('aria-invalid')).toBe(false)
  expect(new FormData(form).get('reviewer')).toBe('theo')
})

test('consumer aria attributes on the select name the list and keep consumer invalid state', () => {
  document.body.innerHTML = enhancedMarkup('aria-label="Primary reviewer" aria-describedby="hint" aria-invalid="true"')
  enhanceLumenListBoxes(document)

  const list = element('[data-ui-list-box-list]', HTMLElement)

  expect(list.getAttribute('aria-label')).toBe('Primary reviewer')
  expect(list.hasAttribute('aria-labelledby')).toBe(false)
  expect(list.getAttribute('aria-describedby')).toBe('hint')
  expect(list.getAttribute('aria-invalid')).toBe('true')
})

test('generated lists report boolean busy and multiselectable states', () => {
  document.body.innerHTML = `
    <lumen-list-box aria-label="Loading reviewers" loading multiple name="loading"></lumen-list-box>
    <lumen-list-box aria-label="Reviewers" required multiple name="reviewers"><option value="amina">Amina</option></lumen-list-box>`
  enhanceLumenListBoxes(document)

  const [loadingList, readyList] = [...document.querySelectorAll<HTMLElement>('[data-ui-list-box-list]')]

  expect(loadingList?.getAttribute('aria-busy')).toBe('true')
  expect(loadingList?.getAttribute('aria-multiselectable')).toBe('true')
  expect(readyList?.hasAttribute('aria-busy')).toBe(false)
  expect(readyList?.getAttribute('aria-multiselectable')).toBe('true')
  expect(readyList?.getAttribute('aria-label')).toBe('Reviewers')
  expect(readyList?.getAttribute('aria-required')).toBe('true')
})

test('unnamed lists without ids receive distinct option ids', () => {
  const unnamed = `<div data-ui-list-box>
      <select data-ui-list-box-native><option value="a">A</option></select>
      <div data-ui-list-box-list role="listbox" tabindex="0"><div data-ui-list-box-option data-value="a" role="option">A</div></div>
    </div>`

  document.body.innerHTML = unnamed + unnamed
  enhanceLumenListBoxes(document)

  const ids = [...document.querySelectorAll('[role="option"]')].map(option => option.id)

  expect(ids.every(Boolean)).toBe(true)
  expect(new Set(ids).size).toBe(ids.length)
})

const settle = () => new Promise(resolve => setTimeout(resolve, 0))

test('Elements list boxes follow later disabled and consumer invalid changes', async () => {
  document.body.innerHTML = enhancedMarkup()
  enhanceLumenListBoxes(document)

  const select = element('select', HTMLSelectElement)
  const list = element('[data-ui-list-box-list]', HTMLElement)

  select.setAttribute('disabled', '')
  await settle()
  expect(list.tabIndex).toBe(-1)
  expect(list.getAttribute('aria-disabled')).toBe('true')

  select.removeAttribute('disabled')
  select.setAttribute('aria-invalid', 'true')
  select.setAttribute('aria-label', 'Lead reviewer')
  await settle()
  expect(list.tabIndex).toBe(0)
  expect(list.hasAttribute('aria-disabled')).toBe(false)
  expect(list.getAttribute('aria-invalid')).toBe('true')
  expect(list.getAttribute('aria-label')).toBe('Lead reviewer')
})

test('Elements generated invalid state clears when required is removed or the select is disabled', async () => {
  document.body.innerHTML = enhancedMarkup('multiple')
  enhanceLumenListBoxes(document)

  const form = element('form', HTMLFormElement)
  const select = element('select', HTMLSelectElement)
  const list = element('[data-ui-list-box-list]', HTMLElement)

  expect(form.reportValidity()).toBe(false)
  expect(list.getAttribute('aria-invalid')).toBe('true')

  select.required = false
  await settle()
  expect(list.hasAttribute('aria-invalid')).toBe(false)

  select.required = true
  expect(form.reportValidity()).toBe(false)
  select.disabled = true
  await settle()
  expect(list.hasAttribute('aria-invalid')).toBe(false)

  select.disabled = false
  await settle()
  expect(list.hasAttribute('aria-invalid')).toBe(false)
})

test('list box resets only with its current form after reassignment', async () => {
  document.body.innerHTML = enhancedMarkup()
  enhanceLumenListBoxes(document)
  const root = element('[data-ui-list-box]', HTMLElement)
  const select = element('select', HTMLSelectElement)
  const list = element('[data-ui-list-box-list]', HTMLElement)
  const resync = () => {
    enhanceLumenListBoxes(document)
  }
  const former = select.form
  const current = document.createElement('form')

  if (!former) throw new Error('Missing original form')

  current.id = 'next-form'
  document.body.append(current)
  select.setAttribute('form', current.id)
  select.selectedIndex = -1
  await new Promise(resolve => setTimeout(resolve, 0))
  select.reportValidity()
  expect(list.getAttribute('aria-invalid')).toBe('true')
  former.reset()
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(list.getAttribute('aria-invalid')).toBe('true')
  current.reset()
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(list.hasAttribute('aria-invalid')).toBe(false)

  select.removeAttribute('form')
  current.append(root)
  await new Promise(resolve => setTimeout(resolve, 0))
  select.selectedIndex = -1
  select.reportValidity()
  current.reset()
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(list.hasAttribute('aria-invalid')).toBe(false)
  resync()
})

test('Elements labels follow insertion, replacement, for/id changes and select id changes', async () => {
  document.body.innerHTML = enhancedMarkup()
  enhanceLumenListBoxes(document)
  const select = element('select', HTMLSelectElement)
  const list = element('[data-ui-list-box-list]', HTMLElement)
  const label = element('label', HTMLLabelElement)

  label.remove()
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(list.hasAttribute('aria-labelledby')).toBe(false)
  document.body.append(label)
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(list.getAttribute('aria-labelledby')).toBe(label.id)
  label.id = 'replacement-label'
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(list.getAttribute('aria-labelledby')).toBe('replacement-label')
  select.id = 'changed-select'
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(list.hasAttribute('aria-labelledby')).toBe(false)
  label.htmlFor = select.id
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(list.getAttribute('aria-labelledby')).toBe('replacement-label')
})

test('list box follows a late external form and its replacement', async () => {
  document.body.innerHTML = enhancedMarkup()
  enhanceLumenListBoxes(document)
  const select = element('select', HTMLSelectElement)
  const list = element('[data-ui-list-box-list]', HTMLElement)
  select.setAttribute('form', 'late-form')
  await new Promise(resolve => setTimeout(resolve, 0))
  const form = document.createElement('form')

  form.id = 'late-form'
  document.body.append(form)
  await new Promise(resolve => setTimeout(resolve, 0))
  select.selectedIndex = -1
  select.reportValidity()
  form.reset()
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(list.hasAttribute('aria-invalid')).toBe(false)
  const replacement = document.createElement('form')

  replacement.id = form.id
  form.replaceWith(replacement)
  await new Promise(resolve => setTimeout(resolve, 0))
  select.selectedIndex = -1
  select.reportValidity()
  replacement.reset()
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(list.hasAttribute('aria-invalid')).toBe(false)
})
