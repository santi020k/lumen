// @vitest-environment jsdom
// cspell:words archivos seleccionados
import { act, createElement, createRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { FileUpload, type FileUploadProps } from './components.js'

let root: Root | undefined

const acceptsValueProp: 'value' extends keyof FileUploadProps ? true : false = false
const acceptsDefaultValueProp: 'defaultValue' extends keyof FileUploadProps ? true : false = false

test('excludes controlled file values and ignores decoded value props', async () => {
  expect(acceptsValueProp).toBe(false)
  expect(acceptsDefaultValueProp).toBe(false)
  const decoded = { value: '/private/report.csv', defaultValue: '/private/report.csv', multiple: true }
  const { input } = await mount(decoded)

  expect(input.value).toBe('')
  expect(input.multiple).toBe(true)
})

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
})

afterEach(async () => {
  await act(async () => {
    await Promise.resolve()
    root?.unmount()
  })
  root = undefined
  document.body.replaceChildren()
})

const mount = async (props: Parameters<typeof FileUpload>[0] = {}) => {
  const container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await act(async () => {
    await Promise.resolve()
    root?.render(createElement('form', null, createElement(FileUpload, props)))
  })
  const form = container.querySelector('form')
  const input = container.querySelector('input')
  const summary = container.querySelector('[aria-live]')
  if (!form || !input || !summary) throw new Error('Missing upload fixture')
  const select = async (names: string[]) => {
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: names.map(name => new File(['example'], name))
    })
    await act(async () => {
      await Promise.resolve()
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })
  }
  return { form, input, select, summary }
}

test('localizes count announcements, preserves filenames and forwards the input ref', async () => {
  const ref = createRef<HTMLInputElement>()
  const { input, select, summary } = await mount({ ref, selectedFilesLabel: '{count} archivos seleccionados' })
  expect(ref.current).toBe(input)
  await select(['uno.txt', 'dos.txt'])
  expect(summary.textContent).toBe('2 archivos seleccionados')
  await select(['uno.txt'])
  expect(summary.textContent).toBe('uno.txt')
})

test('clears the announcement on native reset', async () => {
  const { form, select, summary } = await mount()
  await select(['report.csv'])
  await act(async () => {
    await Promise.resolve()
    form.reset()
    await Promise.resolve()
  })
  expect(summary.textContent).toBe('')
  expect(summary.closest('label')?.dataset.state).toBe('idle')
})

test('preserves selected-file feedback when reset is cancelled', async () => {
  const { form, select, summary } = await mount()
  await select(['report.csv'])
  form.addEventListener('reset', event => {
    event.preventDefault()
  })
  await act(async () => {
    await Promise.resolve()
    form.reset()
    await Promise.resolve()
  })
  expect(summary.textContent).toBe('report.csv')
})

test('retains native disabled, accept, multiple and field associations', async () => {
  const { input } = await mount({ disabled: true, accept: '.csv', multiple: true, name: 'reports', id: 'upload-reports', 'aria-describedby': 'upload-help' })
  expect(input.disabled).toBe(true)
  expect(input.accept).toBe('.csv')
  expect(input.multiple).toBe(true)
  expect(input.name).toBe('reports')
  expect(input.labels?.[0]?.htmlFor).toBe('upload-reports')
  expect(input.getAttribute('aria-describedby')).toBe('upload-help')
})

test('follows replaced external forms and ignores unrelated or canceled resets', async () => {
  const original = document.createElement('form')

  original.id = 'external-upload'
  document.body.append(original)
  const { input, select, summary } = await mount({ form: original.id })

  await select(['report.csv'])
  const current = document.createElement('form')

  current.id = original.id
  original.replaceWith(current)
  expect(input.form).toBe(current)
  const unrelated = document.createElement('form')

  document.body.append(unrelated)
  await act(async () => {
    unrelated.reset()
    await Promise.resolve()
  })
  expect(summary.textContent).toBe('report.csv')
  current.addEventListener('reset', event => {
    event.preventDefault()
  }, { once: true })
  await act(async () => {
    current.reset()
    await Promise.resolve()
  })
  expect(summary.textContent).toBe('report.csv')
  await act(async () => {
    current.reset()
    await Promise.resolve()
  })
  expect(summary.textContent).toBe('')
  expect(summary.closest('label')?.dataset.state).toBe('idle')
})
