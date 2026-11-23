import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { defineLumenButton, LumenButtonElement } from './components/button.js'

defineLumenButton()

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  document.body.replaceChildren()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

const mount = (attributes = 'type="submit"') => {
  document.body.innerHTML = `<form><input name="title" value="Draft"><lumen-button ${attributes}><span>Save</span></lumen-button></form>`
  const form = document.querySelector('form')
  const button = document.querySelector('lumen-button')
  const input = document.querySelector('input')

  if (!form || !(button instanceof LumenButtonElement) || !input) throw new Error('Missing form fixture')

  const submissions: SubmitEvent[] = []

  form.addEventListener('submit', event => {
    event.preventDefault()
    submissions.push(event)
  })

  return { button, form, input, submissions }
}

test('explicit submit buttons submit once for pointer, Enter, and Space activation', () => {
  const { button, submissions } = mount()
  const label = button.querySelector('span')

  if (!label) throw new Error('Missing label')

  label.click()
  vi.runAllTimers()
  expect(submissions).toHaveLength(1)

  button.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' }))
  vi.runAllTimers()
  expect(submissions).toHaveLength(2)

  button.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: ' ' }))
  vi.runAllTimers()
  expect(submissions).toHaveLength(2)
  button.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: ' ' }))
  vi.runAllTimers()
  expect(submissions).toHaveLength(3)
  expect(button.querySelector('button')).toBeNull()
})

test.each(['', 'type="button"', 'type="invalid"'])('preserves ordinary action behavior for %s', attributes => {
  const { button, submissions } = mount(attributes)
  button.click()
  vi.runAllTimers()
  expect(submissions).toHaveLength(0)
})

test('respects ancestor click cancellation but not propagation stopping alone', () => {
  const { button, form, submissions } = mount()
  form.addEventListener('click', event => {
    event.preventDefault()
  }, { once: true })
  button.click()
  vi.runAllTimers()
  expect(submissions).toHaveLength(0)

  form.addEventListener('click', event => {
    event.stopPropagation()
  }, { once: true })
  button.click()
  vi.runAllTimers()
  expect(submissions).toHaveLength(1)
})

test('retains native validation and forwards submitter data and form overrides', () => {
  const { button, form, input, submissions } = mount('type="submit" name="intent" value="save" formaction="/save" formenctype="multipart/form-data" formmethod="post" formtarget="result"')
  input.required = true
  input.value = ''
  button.click()
  vi.runAllTimers()
  expect(submissions).toHaveLength(0)

  input.value = 'Ready'
  const submitted: { values: [string, FormDataEntryValue][], submitter: HTMLButtonElement }[] = []
  form.addEventListener('submit', event => {
    if (!(event.submitter instanceof HTMLButtonElement)) return
    submitted.push({ submitter: event.submitter, values: [...new FormData(form, event.submitter)] })
  })
  button.click()
  vi.runAllTimers()
  expect(submissions).toHaveLength(1)
  const submission = submitted[0]
  if (!submission) throw new Error('Missing submission')
  expect(submission.values).toEqual([['title', 'Ready'], ['intent', 'save']])
  expect(submission.submitter.getAttribute('formaction')).toBe('/save')
  expect(submission.submitter.getAttribute('formenctype')).toBe('multipart/form-data')
  expect(submission.submitter.getAttribute('formmethod')).toBe('post')
  expect(submission.submitter.getAttribute('formtarget')).toBe('result')
  expect(button.querySelector('button')).toBeNull()
})

test('the native submitter carries the per-button validation override', () => {
  const { button, submissions } = mount('type="submit" formnovalidate')
  button.click()
  vi.runAllTimers()
  expect(submissions).toHaveLength(1)
  expect(submissions[0]?.submitter?.hasAttribute('formnovalidate')).toBe(true)
})

test('an explicit form owner takes precedence over the containing form', () => {
  const { button, submissions } = mount('type="submit" form="other"')
  const other = document.createElement('form')
  other.id = 'other'
  document.body.append(other)
  const submit = vi.fn((event: SubmitEvent) => {
    event.preventDefault()
  })
  other.addEventListener('submit', submit)
  button.click()
  vi.runAllTimers()
  expect(submissions).toHaveLength(0)
  expect(submit).toHaveBeenCalledOnce()

  button.setAttribute('form', 'missing')
  button.click()
  vi.runAllTimers()
  expect(submit).toHaveBeenCalledOnce()
  expect(submissions).toHaveLength(0)
})

test.each(['disabled', 'loading', 'aria-disabled'])('%s blocks submit activation', attribute => {
  const { button, submissions } = mount()
  button.setAttribute(attribute, 'true')
  button.click()
  vi.runAllTimers()
  expect(submissions).toHaveLength(0)
  button.setAttribute(attribute, 'false')
  button.click()
  vi.runAllTimers()
  expect(submissions).toHaveLength(1)
})

test.each([false, true])('respects a disabled fieldset and the first legend exception: %s', inFirstLegend => {
  const { button, form, submissions } = mount()
  const fieldset = document.createElement('fieldset')
  const legend = document.createElement('legend')
  fieldset.disabled = true
  fieldset.append(legend)
  form.append(fieldset)
  if (inFirstLegend) legend.append(button)
  else fieldset.append(button)
  button.click()
  vi.runAllTimers()
  expect(submissions).toHaveLength(inFirstLegend ? 1 : 0)
})

test('nested native submit buttons keep their own activation without a duplicate submit', () => {
  const { button, submissions } = mount()
  const native = document.createElement('button')
  native.type = 'submit'
  native.innerHTML = '<span>Native save</span>'
  button.append(native)
  native.querySelector('span')?.click()
  vi.runAllTimers()
  expect(submissions).toHaveLength(1)
  expect(submissions[0]?.submitter).toBe(native)
})

test('disconnecting cancels queued activation even when the button is reconnected', () => {
  const { button, form, submissions } = mount()
  button.click()
  button.remove()
  form.append(button)
  vi.runAllTimers()
  expect(submissions).toHaveLength(0)
  button.click()
  vi.runAllTimers()
  expect(submissions).toHaveLength(1)
})

test('state changes made by click handlers can cancel pending submission', () => {
  const { button, form, submissions } = mount()
  form.addEventListener('click', () => {
    button.setAttribute('loading', '')
  }, { once: true })
  button.click()
  vi.runAllTimers()
  expect(submissions).toHaveLength(0)
})
