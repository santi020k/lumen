// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { Select } from './components.js'

let container: HTMLDivElement
let root: Root
const options = [{ label: 'Draft', value: 'draft' }, { label: 'Published', value: 'published' }]

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => {
    root.unmount()
  })
  container.remove()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const render = (props: Parameters<typeof Select>[0]) => {
  act(() => {
    root.render(createElement('form', { id: 'selection-form' }, createElement(Select, { options, ...props })))
  })
  const form = container.querySelector('form')
  const trigger = container.querySelector<HTMLButtonElement>('[data-ui-select-trigger]')
  const option = container.querySelector<HTMLButtonElement>('[data-value="published"]')
  const native = container.querySelector('select')

  if (!form || !trigger || !option || !native) throw new Error('Expected select fixture')

  return { form, trigger, option, native }
}

test('Select forwards accessible descriptions and emits both public callbacks once for option activation', () => {
  const onChange = vi.fn<NonNullable<Parameters<typeof Select>[0]['onChange']>>()
  const onValueChange = vi.fn<(value: string) => void>()
  const { trigger, option, form } = render({ 'aria-label': 'Publication state', 'aria-describedby': 'state-help', defaultValue: 'draft', name: 'state', onChange, onValueChange })

  expect(trigger.getAttribute('aria-label')).toBe('Publication state')
  expect(trigger.getAttribute('aria-describedby')).toBe('state-help')
  act(() => {
    trigger.click()
  })
  act(() => {
    option.click()
  })
  expect(onChange).toHaveBeenCalledTimes(1)
  expect(onChange.mock.calls[0]?.[0].target).toBe(form.querySelector('select'))
  expect(onValueChange.mock.calls).toEqual([['published']])
  expect(new FormData(form).get('state')).toBe('published')
})

test('accepted select resets restore the uncontrolled default and close without change callbacks', () => {
  vi.useFakeTimers()
  const onValueChange = vi.fn<(value: string) => void>()
  const { trigger, option, form } = render({ defaultValue: 'draft', name: 'state', onValueChange })

  act(() => {
    trigger.click()
    option.click()
  })
  act(() => {
    trigger.click()
  })
  onValueChange.mockClear()
  act(() => {
    form.reset()
    vi.runAllTimers()
  })
  expect(trigger.textContent).toBe('Draft')
  expect(trigger.getAttribute('aria-expanded')).toBe('false')
  expect(new FormData(form).get('state')).toBe('draft')
  expect(onValueChange).not.toHaveBeenCalled()
})

test('cancelled select reset preserves both selection and its open popup', () => {
  vi.useFakeTimers()
  const { trigger, option, form } = render({ defaultValue: 'draft', name: 'state' })

  act(() => {
    trigger.click()
    option.click()
  })
  act(() => {
    trigger.click()
  })
  form.addEventListener('reset', event => {
    event.preventDefault()
  })
  act(() => {
    form.reset()
    vi.runAllTimers()
  })
  expect(trigger.textContent).toBe('Published')
  expect(trigger.getAttribute('aria-expanded')).toBe('true')
})

test('controlled select retains owner state through rejected selections and accepted resets', () => {
  vi.useFakeTimers()
  const onChange = vi.fn<NonNullable<Parameters<typeof Select>[0]['onChange']>>()
  const onValueChange = vi.fn<(value: string) => void>()
  const { trigger, option, form, native } = render({ defaultValue: 'draft', value: 'draft', name: 'state', onChange, onValueChange })

  act(() => {
    trigger.click()
    option.click()
  })
  expect(trigger.textContent).toBe('Draft')
  expect(native.value).toBe('draft')
  expect(onChange).toHaveBeenCalledTimes(1)
  expect(onValueChange.mock.calls).toEqual([['published']])
  render({ defaultValue: 'draft', value: 'published', name: 'state', onChange, onValueChange })
  onValueChange.mockClear()
  onChange.mockClear()
  act(() => {
    form.reset()
    vi.runAllTimers()
  })
  expect(trigger.textContent).toBe('Published')
  expect(native.value).toBe('published')
  expect(onValueChange).not.toHaveBeenCalled()
  expect(onChange).not.toHaveBeenCalled()
})

test('select resets follow the current explicit form owner and retain accepted batched resets', () => {
  vi.useFakeTimers()
  const { trigger, option, form } = render({ defaultValue: 'draft', name: 'state', form: 'other-selection-form' })
  const external = document.createElement('form')

  external.id = 'other-selection-form'
  container.append(external)
  act(() => {
    trigger.click()
    option.click()
  })
  act(() => {
    form.reset()
    vi.runAllTimers()
  })
  expect(trigger.textContent).toBe('Published')
  let count = 0

  external.addEventListener('reset', event => {
    if (count++ === 1) event.preventDefault()
  })
  act(() => {
    external.reset()
    external.reset()
    vi.runAllTimers()
  })
  expect(trigger.textContent).toBe('Draft')
  expect(new FormData(external).get('state')).toBe('draft')
})

test('select unmount cancels pending resets without notifying the value owner', () => {
  vi.useFakeTimers()
  const onValueChange = vi.fn<(value: string) => void>()
  const { form } = render({ defaultValue: 'draft', onValueChange })

  act(() => {
    form.reset()
    root.render(null)
  })
  expect(vi.getTimerCount()).toBe(0)
  act(() => {
    vi.runAllTimers()
  })
  expect(onValueChange).not.toHaveBeenCalled()
})
