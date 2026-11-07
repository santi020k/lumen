// @vitest-environment jsdom
import { afterEach, expect, test } from 'vitest'

import { registerEditableTickets } from '../templates/astro/editable-ticket/src/lumen/editable-ticket-controller.js'

registerEditableTickets()

afterEach(() => {
  document.body.replaceChildren()
})

const mount = () => {
  const root = document.createElement('lumen-editable-ticket')
  root.innerHTML = '<h2 data-name>Type</h2><p data-venue>North</p><button data-edit="name">Name</button><button data-edit="venue">Venue</button><form data-editor hidden><div data-field="name"><input name="name" required maxlength="120"></div><div data-field="venue"><input name="venue" required maxlength="120"></div><button data-cancel type="button">Cancel</button></form><h3 data-name>Type</h3><span data-venue>North</span><button data-undo>Undo</button><p data-status></p>'
  document.body.append(root)
  const get = <T extends Element>(selector: string, type: new() => T): T => {
    const node = root.querySelector<T>(selector)
    if (!(node instanceof type)) throw new Error('Missing fixture ' + selector)
    return node
  }
  const edit = (field: 'name' | 'venue', text: string) => {
    get('[data-edit="' + field + '"]', HTMLButtonElement).click()
    const input = get('input[name="' + field + '"]', HTMLInputElement)
    input.value = text
    input.dispatchEvent(new Event('input', { bubbles: true }))
    return input
  }
  const save = () => get('form', HTMLElement).dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  return { root, get, edit, save }
}

test('drafts synchronize both views, save trims and undo restores the complete event', () => {
  const { root, edit, save, get } = mount()
  const events: unknown[] = []
  root.addEventListener('ui:event-change', event => {
    if (event instanceof CustomEvent) events.push(event.detail)
  })
  edit('venue', ' South ')
  expect([...root.querySelectorAll('[data-venue]')].map(node => node.textContent)).toEqual([' South ', ' South '])
  expect(events).toEqual([])
  save()
  expect(get('[data-venue]', HTMLElement).textContent).toBe('South')
  expect(document.activeElement).toBe(get('[data-edit="venue"]', HTMLElement))
  get('[data-undo]', HTMLButtonElement).click()
  expect(get('[data-venue]', HTMLElement).textContent).toBe('North')
  expect(events).toEqual([{ value: { name: 'Type', venue: 'South' }, reason: 'save' }, { value: { name: 'Type', venue: 'North' }, reason: 'undo' }])
})

test('Escape cancels, unchanged saves retain undo, and instances stay isolated', () => {
  const first = mount(), second = mount()
  first.edit('name', 'Changed')
  first.save()
  first.edit('name', 'Discard').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  expect(first.get('[data-name]', HTMLElement).textContent).toBe('Changed')
  first.edit('name', 'Changed')
  first.save()
  first.get('[data-undo]', HTMLButtonElement).click()
  expect(first.get('[data-name]', HTMLElement).textContent).toBe('Type')
  expect(second.get('[data-name]', HTMLElement).textContent).toBe('Type')
})

test('invalid input keeps the editor open and markup stays text', () => {
  const { get, edit, save } = mount()
  edit('name', '   ')
  save()
  expect(get('[data-editor]', HTMLElement).hidden).toBe(false)
  expect(get('input[name="name"]', HTMLInputElement).validationMessage).toBeTruthy()
  const input = get('input[name="name"]', HTMLInputElement)
  input.value = '<img src=x>'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  save()
  expect(get('[data-name]', HTMLElement).textContent).toBe('<img src=x>')
  expect(get('[data-name]', HTMLElement).children).toHaveLength(0)
})

test('reconnection cancels drafts and keeps committed history without duplicate listeners', () => {
  const { root, edit, save, get } = mount()
  edit('venue', 'South')
  save()
  edit('name', 'Draft')
  root.remove()
  document.body.append(root)
  expect(get('[data-name]', HTMLElement).textContent).toBe('Type')
  get('[data-undo]', HTMLButtonElement).click()
  expect(get('[data-venue]', HTMLElement).textContent).toBe('North')
})
