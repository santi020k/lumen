// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'

import { expect, test, vi } from 'vitest'

import { Segmented } from './components.js'

const options = [{ label: 'Draft', value: 'draft' }, { label: 'Published', value: 'published' }]

test('controlled segmented selection remains owned by its value prop and reports selection once', () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const container = document.createElement('div')
  const root = createRoot(container)
  const onValueChange = vi.fn<(value: string) => void>()

  document.body.append(container)
  try {
    act(() => {
      root.render(createElement(Segmented, { options, value: 'draft', onValueChange }))
    })
    const radios = [...container.querySelectorAll('input')]
    const draft = radios[0]
    const published = radios[1]

    if (!draft || !published) throw new Error('Expected segmented options')

    act(() => {
      published.click()
    })
    expect(onValueChange.mock.calls).toEqual([['published']])
    expect(draft.checked).toBe(true)
    expect(published.checked).toBe(false)
    act(() => {
      root.render(createElement(Segmented, { options, value: 'published', onValueChange }))
    })
    expect(draft.checked).toBe(false)
    expect(published.checked).toBe(true)
  } finally {
    act(() => {
      root.unmount()
    })
    container.remove()
    vi.unstubAllGlobals()
  }
})

test('uncontrolled segmented selection resets to its default without reporting another change', () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const container = document.createElement('div')
  const root = createRoot(container)
  const onValueChange = vi.fn<(value: string) => void>()

  document.body.append(container)
  try {
    act(() => {
      root.render(createElement('form', null, createElement(Segmented, { options, defaultValue: 'draft', onValueChange })))
    })
    const form = container.querySelector('form')
    const draft = container.querySelector<HTMLInputElement>('input[value="draft"]')
    const published = container.querySelector<HTMLInputElement>('input[value="published"]')

    if (!form || !draft || !published) throw new Error('Expected segmented form')

    act(() => {
      published.click()
    })
    expect(published.checked).toBe(true)
    form.addEventListener('reset', event => {
      event.preventDefault()
    }, { once: true })
    act(() => {
      form.reset()
    })
    expect(published.checked).toBe(true)
    act(() => {
      form.reset()
    })
    expect(draft.checked).toBe(true)
    expect(onValueChange.mock.calls).toEqual([['published']])
    expect(new FormData(form).get('segmented')).toBe('draft')
  } finally {
    act(() => {
      root.unmount()
    })
    container.remove()
    vi.unstubAllGlobals()
  }
})
