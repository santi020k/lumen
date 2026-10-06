// cspell:words archivos
// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { initFileUploadControllers } from './runtime/controllers/file-upload.js'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
  document.body.replaceChildren()
})

const fixture = () => {
  document.body.innerHTML = '<form><div data-ui-file-upload data-ui-selected-files-label="{count} archivos seleccionados"><input type="file" data-ui-file-upload-input><span data-ui-file-upload-files></span></div></form>'
  const root = document.querySelector<HTMLElement>('[data-ui-file-upload]')
  const input = document.querySelector('input')
  const files = document.querySelector('[data-ui-file-upload-files]')
  const form = document.querySelector('form')
  if (!root || !input || !files || !form) throw new Error('Expected upload fixture')
  return { root, input, files, form }
}

test('preserves file selection, localization and idempotent binding after lazy initialization', () => {
  const { root, input, files } = fixture()
  const listener = vi.spyOn(input, 'addEventListener')
  initFileUploadControllers(document)
  initFileUploadControllers(document)
  expect(listener.mock.calls.filter(([name]) => name === 'change')).toHaveLength(1)
  Object.defineProperty(input, 'files', { configurable: true, value: [new File(['a'], 'one.txt')] })
  input.dispatchEvent(new Event('change'))
  expect(files.textContent).toBe('one.txt')
  expect(root.dataset.state).toBe('selected')
  Object.defineProperty(input, 'files', { configurable: true, value: [new File(['a'], 'one.txt'), new File(['b'], 'two.txt')] })
  input.dispatchEvent(new Event('change'))
  expect(files.textContent).toBe('2 archivos seleccionados')
})

test('blocks disabled drag/drop activation', () => {
  const { root, input } = fixture()
  input.disabled = true
  initFileUploadControllers(document)
  const drag = new Event('dragover', { cancelable: true })
  const drop = new Event('drop', { cancelable: true })
  root.dispatchEvent(drag)
  root.dispatchEvent(drop)
  expect(drag.defaultPrevented).toBe(false)
  expect(drop.defaultPrevented).toBe(false)
  expect(root.dataset.state).toBe('idle')
})

test('accepted resets clear display, canceled resets preserve it', async () => {
  const { root, input, files, form } = fixture()
  initFileUploadControllers(document)
  Object.defineProperty(input, 'files', { configurable: true, value: [new File(['a'], 'one.txt')] })
  input.dispatchEvent(new Event('change'))
  const cancel = (event: Event): void => {
    event.preventDefault()
  }
  form.addEventListener('reset', cancel)
  form.reset()
  await vi.runAllTimersAsync()
  expect(files.textContent).toBe('one.txt')
  form.removeEventListener('reset', cancel)
  Object.defineProperty(input, 'files', { configurable: true, value: [] })
  form.reset()
  await vi.runAllTimersAsync()
  expect(files.textContent).toBe('')
  expect(root.dataset.state).toBe('idle')
})

test.each([false, true])('upload honors effective disabled state and first legend=%s', legend => {
  const { root, input } = fixture()
  const fieldset = document.createElement('fieldset')
  const firstLegend = document.createElement('legend')
  fieldset.disabled = true
  fieldset.append(firstLegend)
  document.body.append(fieldset)
  if (legend) firstLegend.append(root)
  else fieldset.append(root)
  let selected: File[] = []
  Object.defineProperty(input, 'files', { get: () => selected,
    set: (files: File[]) => {
      selected = files
    } })
  initFileUploadControllers(document)
  const drag = new Event('dragover', { cancelable: true })
  const drop = new Event('drop', { cancelable: true })
  Object.defineProperty(drop, 'dataTransfer', { value: { files: [new File(['a'], 'one.txt')] } })
  root.dispatchEvent(drag)
  root.dispatchEvent(drop)
  expect(drag.defaultPrevented).toBe(legend)
  expect(drop.defaultPrevented).toBe(legend)
  expect(selected).toHaveLength(legend ? 1 : 0)
  expect(root.dataset.state).toBe(legend ? 'selected' : 'idle')
})

test('upload resets follow current form ownership and retain canceled selections', async () => {
  const { root, input, files, form } = fixture()
  form.id = 'old-upload-owner'
  const owner = document.createElement('form')
  owner.id = 'new-upload-owner'
  document.body.append(owner)
  initFileUploadControllers(document)
  Object.defineProperty(input, 'files', { configurable: true, value: [new File(['a'], 'one.txt')] })
  input.dispatchEvent(new Event('change'))
  input.setAttribute('form', owner.id)
  Object.defineProperty(input, 'files', { configurable: true, value: [] })
  form.reset()
  await vi.runAllTimersAsync()
  expect(files.textContent).toBe('one.txt')
  const cancel = (event: Event) => {
    event.preventDefault()
  }
  owner.addEventListener('reset', cancel)
  owner.reset()
  await vi.runAllTimersAsync()
  expect(files.textContent).toBe('one.txt')
  owner.removeEventListener('reset', cancel)
  owner.reset()
  await vi.runAllTimersAsync()
  expect(files.textContent).toBe('')
  expect(root.dataset.state).toBe('idle')
})

test('upload transitions reuse one reset delegate without retaining removed control callbacks', async () => {
  const frame = document.createElement('iframe')
  document.body.append(frame)
  const owner = frame.contentDocument
  if (!owner) throw new Error('Missing upload transition document')
  const listeners = vi.spyOn(owner, 'addEventListener')
  const load = () => {
    owner.body.innerHTML = '<form><div data-ui-file-upload><input type="file" data-ui-file-upload-input><span data-ui-file-upload-files></span></div></form>'
    initFileUploadControllers(owner)
    const input = owner.querySelector('input')
    const root = owner.querySelector<HTMLElement>('[data-ui-file-upload]')
    const form = owner.querySelector('form')
    if (!input || !root || !form) throw new Error('Missing transition upload')
    return { input, root, form }
  }
  const previous = load()
  const staleFiles = vi.fn(() => [])
  Object.defineProperty(previous.input, 'files', { get: staleFiles })
  const current = load()
  expect(listeners.mock.calls.filter(([type]) => type === 'reset')).toHaveLength(1)
  current.form.reset()
  await vi.runAllTimersAsync()
  expect(staleFiles).not.toHaveBeenCalled()
  expect(current.root.dataset.state).toBe('idle')
  frame.remove()
  listeners.mockRestore()
})

test('adopted uploads rebind reset delegation without duplicating change listeners', async () => {
  const { root, input, files } = fixture()
  const changes = vi.spyOn(input, 'addEventListener')
  initFileUploadControllers(document)
  Object.defineProperty(input, 'files', { configurable: true, value: [new File(['a'], 'one.txt')] })
  input.dispatchEvent(new Event('change'))
  const frame = document.createElement('iframe')
  document.body.append(frame)
  const destination = frame.contentDocument
  if (!destination) throw new Error('Missing destination document')
  const owner = destination.createElement('form')
  destination.body.append(owner)
  owner.append(destination.adoptNode(root))
  initFileUploadControllers(destination)
  initFileUploadControllers(destination)
  expect(changes.mock.calls.filter(([type]) => type === 'change')).toHaveLength(1)
  Object.defineProperty(input, 'files', { configurable: true, value: [] })
  const cancel = (event: Event) => {
    event.preventDefault()
  }
  owner.addEventListener('reset', cancel)
  owner.reset()
  await vi.runAllTimersAsync()
  expect(files.textContent).toBe('one.txt')
  owner.removeEventListener('reset', cancel)
  owner.reset()
  await vi.runAllTimersAsync()
  expect(files.textContent).toBe('')
  expect(root.dataset.state).toBe('idle')
  frame.remove()
  changes.mockRestore()
})
