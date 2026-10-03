// cspell:words archivos seleccionados
import { afterEach, beforeAll, expect, test } from 'vitest'

import { defineLumenElements } from './index.js'

beforeAll(() => {
  defineLumenElements()
})
afterEach(() => {
  document.body.replaceChildren()
})

const mount = () => {
  document.body.innerHTML = '<form><lumen-file-upload selected-files-label="{count} archivos seleccionados"><input type="file" data-ui-file-upload-input multiple><span aria-live="polite" data-ui-file-upload-files></span></lumen-file-upload></form>'
  const form = document.querySelector('form')
  const input = document.querySelector('input')
  const summary = document.querySelector('[aria-live]')
  const upload = document.querySelector('lumen-file-upload')
  if (!form || !input || !summary || !upload) throw new Error('Missing upload fixture')
  let files: File[] = []
  Object.defineProperty(input, 'files', { configurable: true, get: () => files })
  const select = (names: string[]) => {
    files = names.map(name => new File(['example'], name))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }
  return { form, input, select, summary, upload }
}

test('announces localized counts and clears accepted resets', async () => {
  const { form, select, summary } = mount()
  select(['uno.txt', 'dos.txt'])
  expect(summary.textContent).toBe('2 archivos seleccionados')
  form.addEventListener('reset', () => {
    select([])
  })
  form.reset()
  await Promise.resolve()
  expect(summary.textContent).toBe('')
})

test('preserves cancelled resets and ignores disabled drops', async () => {
  const { form, input, select, summary, upload } = mount()
  select(['uno.txt'])
  form.addEventListener('reset', event => {
    event.preventDefault()
  })
  form.reset()
  await Promise.resolve()
  expect(summary.textContent).toBe('uno.txt')
  input.disabled = true
  const drop = new Event('drop', { bubbles: true, cancelable: true })
  Object.defineProperty(drop, 'dataTransfer', { value: { files: [new File(['example'], 'dos.txt')] } })
  upload.dispatchEvent(drop)
  expect(drop.defaultPrevented).toBe(false)
  expect(summary.textContent).toBe('uno.txt')
})
