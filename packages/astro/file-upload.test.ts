// cspell:words archivos
// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { initFileUploadControllers } from './runtime/controllers/file-upload.js'

afterEach(() => {
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
  await Promise.resolve()
  expect(files.textContent).toBe('one.txt')
  form.removeEventListener('reset', cancel)
  Object.defineProperty(input, 'files', { configurable: true, value: [] })
  form.reset()
  await Promise.resolve()
  expect(files.textContent).toBe('')
  expect(root.dataset.state).toBe('idle')
})
