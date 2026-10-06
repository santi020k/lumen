// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ApprovalCard, PromptComposer, SourceCitation, StreamMessage } from './ai-surfaces.js'

const roots: Root[] = []
const mount = () => {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  roots.push(root)
  return { root, container }
}
const required = <T extends Element>(element: T | null): T => {
  if (!element) throw new Error('Expected a rendered control')
  return element
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
})
afterEach(() => {
  for (const root of roots.splice(0)) act(() => {
    root.unmount()
  })
  document.body.replaceChildren()
  vi.unstubAllGlobals()
})

test('controlled prompt emits trimmed text and stop requests without owning transport', () => {
  const { root, container } = mount()
  const submit = vi.fn()
  const stop = vi.fn()
  act(() => {
    root.render(createElement(PromptComposer, { value: ' Hello ', onPromptSubmit: submit, onStop: stop }))
  })
  const form = required(container.querySelector('form'))
  act(() => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
  expect(submit).toHaveBeenCalledWith({ text: 'Hello' })
  act(() => {
    root.render(createElement(PromptComposer, { value: ' Hello ', pending: true, onPromptSubmit: submit, onStop: stop }))
  })
  act(() => {
    required(container.querySelector<HTMLButtonElement>('[data-ui-prompt-stop]')).click()
  })
  expect(stop).toHaveBeenCalledTimes(1)
  expect(required(container.querySelector('textarea')).value).toBe(' Hello ')
})

test('native reset updates the uncontrolled React draft and canceled reset keeps it', () => {
  const { root, container } = mount()
  const change = vi.fn()
  act(() => {
    root.render(createElement(PromptComposer, { defaultValue: 'Initial', onValueChange: change }))
  })
  act(() => {
    required(container.querySelector('form')).reset()
  })
  expect(change).toHaveBeenCalledWith('Initial')
  act(() => {
    root.render(createElement(PromptComposer, { defaultValue: 'Initial',
      onValueChange: change,
      onReset: event => {
        event.preventDefault()
      } }))
  })
  act(() => {
    required(container.querySelector('form')).reset()
  })
  expect(change).toHaveBeenCalledTimes(1)
})

test('approval callbacks stop when the consumer changes the request status', () => {
  const { root, container } = mount()
  const respond = vi.fn()
  act(() => {
    root.render(createElement(ApprovalCard, { label: 'Review', requestId: 'one', statusLabel: 'Pending', onResponse: respond }))
  })
  const button = required(container.querySelector<HTMLButtonElement>('[data-ui-approval-response="approve"]'))
  act(() => {
    button.click()
  })
  expect(respond).toHaveBeenCalledWith({ requestId: 'one', response: 'approve' })
  act(() => {
    root.render(createElement(ApprovalCard, { label: 'Review', requestId: 'one', status: 'approved', statusLabel: 'Approved', onResponse: respond }))
  })
  expect(button.disabled).toBe(true)
  act(() => {
    button.click()
  })
  expect(respond).toHaveBeenCalledTimes(1)
})

test('stream content remains outside polite status and invalid citations are inert', () => {
  const { root, container } = mount()
  act(() => {
    root.render(createElement(StreamMessage, { status: 'streaming', statusLabel: 'Writing' }, createElement(SourceCitation, { href: 'javascript:alert(1)', label: 'Source' })))
  })
  expect(required(container.querySelector('[data-ui-stream-content]')).getAttribute('aria-live')).toBe('off')
  expect(required(container.querySelector('[role="status"]')).textContent).toBe('Writing')
  expect(container.querySelector('a')).toBeNull()
})
