// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

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

  const resync = bindListBoxProxy(root, select, list, () => `generated-label-${++labelCount}`)

  return { list, resync, root, select }
}

const externalLabel = (target: string, text: string): HTMLLabelElement => {
  const label = document.createElement('label')

  label.htmlFor = target
  label.textContent = text

  return label
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

test('Astro list boxes follow external labels that mount, change, or leave after enhancement', async () => {
  const { list } = fixture()
  const initial = document.querySelector('label')
  const late = externalLabel('reviewer', 'Late reviewer')
  const owned = externalLabel('reviewer', 'Owned reviewer')

  owned.id = 'consumer-reviewer-label'
  initial?.remove()
  await settle()
  expect(list.hasAttribute('aria-labelledby')).toBe(false)
  document.body.append(late, owned)
  await settle()
  expect(late.id).not.toBe('')
  expect(list.getAttribute('aria-labelledby')).toBe(`${late.id} consumer-reviewer-label`)
  owned.id = 'renamed-reviewer-label'
  late.htmlFor = 'elsewhere'
  await settle()
  expect(list.getAttribute('aria-labelledby')).toBe('renamed-reviewer-label')
})

test('a later external label keeps an explicit Astro list box name', async () => {
  const { list } = fixture('aria-label="Primary reviewer"')

  document.body.append(externalLabel('reviewer', 'Outside'))
  await settle()
  expect(list.getAttribute('aria-label')).toBe('Primary reviewer')
  expect(list.hasAttribute('aria-labelledby')).toBe(false)
})

test('a removed Astro list box stops following labels until it is reinserted and resynchronized', async () => {
  const { list, resync, root } = fixture()
  const labels = vi.spyOn(HTMLSelectElement.prototype, 'labels', 'get')
  const form = root.closest('form')

  if (!form) throw new Error('Expected form')

  form.remove()
  await settle()
  labels.mockClear()
  document.body.append(externalLabel('reviewer', 'While removed'))
  await settle()
  expect(labels).not.toHaveBeenCalled()

  document.body.append(form)
  resync()

  const late = externalLabel('reviewer', 'After return')

  document.body.append(late)
  await settle()
  expect(list.getAttribute('aria-labelledby')?.split(' ')).toContain(late.id)
  // Generated ids settle after one extra pass instead of looping.
  labels.mockClear()
  document.body.append(document.createElement('section'))
  await settle()
  expect(labels).not.toHaveBeenCalled()
  labels.mockRestore()
})

test('a changed Astro select id follows the labels that target the new id', async () => {
  const { list, select } = fixture()
  const initial = document.querySelector('label')
  const next = externalLabel('next-reviewer', 'Next reviewer')

  document.body.append(next)
  await settle()
  expect(list.getAttribute('aria-labelledby')).toBe(initial?.id)
  select.id = 'next-reviewer'
  await settle()
  expect(next.id).not.toBe('')
  expect(list.getAttribute('aria-labelledby')).toBe(next.id)
  select.id = 'unlabelled-reviewer'
  await settle()
  expect(list.hasAttribute('aria-labelledby')).toBe(false)
})

test('list box resets only with its current form after reassignment', async () => {
  const { root, select, list, resync } = fixture()
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

test('list box follows a late external form and its replacement', async () => {
  const { select, list } = fixture()
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
