// cspell:words archivos seleccionados
import { afterEach, beforeAll, expect, test, vi } from 'vitest'

import { defineLumenElements } from './index.js'

beforeAll(() => {
  defineLumenElements()
})
afterEach(() => {
  vi.unstubAllGlobals()
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
  await new Promise(resolve => {
    setTimeout(resolve, 0)
  })
  expect(summary.textContent).toBe('')
})

test('preserves cancelled resets and ignores disabled drops', async () => {
  const { form, input, select, summary, upload } = mount()
  select(['uno.txt'])
  form.addEventListener('reset', event => {
    event.preventDefault()
  })
  form.reset()
  await new Promise(resolve => {
    setTimeout(resolve, 0)
  })
  expect(summary.textContent).toBe('uno.txt')
  input.disabled = true
  const drop = new Event('drop', { bubbles: true, cancelable: true })
  Object.defineProperty(drop, 'dataTransfer', { value: { files: [new File(['example'], 'dos.txt')] } })
  upload.dispatchEvent(drop)
  expect(drop.defaultPrevented).toBe(false)
  expect(summary.textContent).toBe('uno.txt')
})

test.each([false, true])('file drops respect disabled fieldset state and first legend=%s', legend => {
  const { form, input, upload, summary } = mount()
  const fieldset = document.createElement('fieldset')
  const firstLegend = document.createElement('legend')

  fieldset.disabled = true

  fieldset.append(firstLegend)

  form.append(fieldset)

  if (legend) firstLegend.append(upload)
  else fieldset.append(upload)

  let files: File[] = []

  Object.defineProperty(input, 'files', {
    configurable: true,
    get: () => files,
    set: (value: File[]) => {
      files = value
    }
  })

  const drag = new Event('dragover', { bubbles: true, cancelable: true })
  const drop = new Event('drop', { bubbles: true, cancelable: true })

  Object.defineProperty(drop, 'dataTransfer', { value: { files: [new File(['example'], 'selected.txt')] } })

  upload.dispatchEvent(drag)

  upload.dispatchEvent(drop)

  expect(drag.defaultPrevented).toBe(legend)

  expect(drop.defaultPrevented).toBe(legend)

  expect(summary.textContent).toBe(legend ? 'selected.txt' : '')
})

test('upload reset follows reassigned form owner without refreshing for other forms', async () => {
  const { form, input, select, summary, upload } = mount()
  form.id = 'initial-upload-owner'
  const owner = document.createElement('form')
  owner.id = 'current-upload-owner'
  document.body.append(owner)
  select(['one.txt'])
  input.setAttribute('form', owner.id)
  Object.defineProperty(input, 'files', { configurable: true, value: [] })
  form.reset()
  await new Promise(resolve => {
    setTimeout(resolve, 0)
  })
  expect(summary.textContent).toBe('one.txt')
  const cancel = (event: Event) => {
    event.preventDefault()
  }
  owner.addEventListener('reset', cancel)
  owner.reset()
  await new Promise(resolve => {
    setTimeout(resolve, 0)
  })
  expect(summary.textContent).toBe('one.txt')
  owner.removeEventListener('reset', cancel)
  owner.reset()
  await new Promise(resolve => {
    setTimeout(resolve, 0)
  })
  expect(summary.textContent).toBe('')
  expect(upload.getAttribute('data-state')).toBe('idle')
})

test('dropping text preserves selected files and restores the selection state', () => {
  const { input, select, summary, upload } = mount()
  select(['selected.txt'])
  let changes = 0
  input.addEventListener('change', () => {
    changes++
  })
  const drop = new Event('drop', { bubbles: true, cancelable: true })
  Object.defineProperty(drop, 'dataTransfer', { value: { types: ['text/plain'], files: [] } })
  upload.dispatchEvent(new Event('dragover', { bubbles: true, cancelable: true }))
  upload.dispatchEvent(drop)

  expect(input.files?.[0]?.name).toBe('selected.txt')
  expect(summary.textContent).toBe('selected.txt')
  expect(upload.getAttribute('data-state')).toBe('selected')
  expect(changes).toBe(0)
})

test('single-file drop retains only the first file while multiple preserves all files and order', () => {
  const createFileList = (list: File[]): FileList => Object.assign([...list], {
    item: (index: number) => list[index] ?? null
  })

  class MockDataTransfer {
    private list: File[] = []

    items = {
      add: (file: File) => {
        this.list.push(file)
      }
    }

    get files(): FileList {
      return createFileList(this.list)
    }
  }

  if (typeof globalThis.DataTransfer !== 'function') {
    vi.stubGlobal('DataTransfer', MockDataTransfer)
  }

  document.body.innerHTML = '<lumen-file-upload><input type="file" data-ui-file-upload-input><span data-ui-file-upload-files></span></lumen-file-upload>'
  const singleUpload = document.querySelector('lumen-file-upload')
  const singleInput = document.querySelector('input')
  const singleSummary = document.querySelector('[data-ui-file-upload-files]')
  if (!singleUpload || !singleInput || !singleSummary) throw new Error('Missing single upload fixture')

  let singleFiles: FileList = createFileList([])
  Object.defineProperty(singleInput, 'files', {
    configurable: true,
    get: () => singleFiles,
    set: (value: FileList) => {
      singleFiles = value
    }
  })

  let singleChanges = 0
  singleInput.addEventListener('change', () => {
    singleChanges += 1
  })

  const first = new File(['a'], 'first.txt')
  const second = new File(['b'], 'second.txt')
  const singleDrop = new Event('drop', { bubbles: true, cancelable: true })
  const droppedList = createFileList([first, second])
  Object.defineProperty(singleDrop, 'dataTransfer', { value: { files: droppedList } })
  singleUpload.dispatchEvent(singleDrop)

  expect(singleChanges).toBe(1)
  expect([...singleFiles].map(file => file.name)).toEqual(['first.txt'])
  expect(singleSummary.textContent).toBe('first.txt')

  const { input: multiInput, summary: multiSummary, upload: multiUpload } = mount()
  let multiFiles: FileList = createFileList([])
  Object.defineProperty(multiInput, 'files', {
    configurable: true,
    get: () => multiFiles,
    set: (value: FileList) => {
      multiFiles = value
    }
  })

  let multiChanges = 0
  multiInput.addEventListener('change', () => {
    multiChanges += 1
  })

  const multiDrop = new Event('drop', { bubbles: true, cancelable: true })
  Object.defineProperty(multiDrop, 'dataTransfer', { value: { files: droppedList } })
  multiUpload.dispatchEvent(multiDrop)

  expect(multiChanges).toBe(1)
  expect(multiFiles).toBe(droppedList)
  expect([...multiFiles].map(file => file.name)).toEqual(['first.txt', 'second.txt'])
  expect(multiSummary.textContent).toBe('2 archivos seleccionados')
})

test('single-file multi-drop preserves existing selection with no change event when DataTransfer is unavailable', () => {
  const createFileList = (list: File[]): FileList => Object.assign([...list], {
    item: (index: number) => list[index] ?? null
  })

  vi.stubGlobal('DataTransfer', undefined)

  document.body.innerHTML = '<lumen-file-upload><input type="file" data-ui-file-upload-input><span data-ui-file-upload-files></span></lumen-file-upload>'
  const upload = document.querySelector('lumen-file-upload')
  const input = document.querySelector('input')
  const summary = document.querySelector('[data-ui-file-upload-files]')
  if (!upload || !input || !summary) throw new Error('Missing upload fixture')

  let files: FileList = createFileList([new File(['existing'], 'existing.txt')])
  Object.defineProperty(input, 'files', {
    configurable: true,
    get: () => files,
    set: (value: FileList) => {
      files = value
    }
  })

  input.dispatchEvent(new Event('change'))

  let changes = 0
  input.addEventListener('change', () => {
    changes += 1
  })

  const drop = new Event('drop', { bubbles: true, cancelable: true })
  Object.defineProperty(drop, 'dataTransfer', {
    value: { files: createFileList([new File(['a'], 'first.txt'), new File(['b'], 'second.txt')]) }
  })
  upload.dispatchEvent(new Event('dragover', { bubbles: true, cancelable: true }))
  upload.dispatchEvent(drop)

  expect(changes).toBe(0)
  expect([...files].map(file => file.name)).toEqual(['existing.txt'])
  expect(summary.textContent).toBe('existing.txt')
  expect(upload.getAttribute('data-state')).toBe('selected')
})
