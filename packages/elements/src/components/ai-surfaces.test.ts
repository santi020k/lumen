// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { defineLumenElements } from '../define.js'

import { LumenPromptComposerElement, LumenStreamMessageElement } from './ai-surfaces.js'

const required = <T extends Element>(element: T | null): T => {
  if (!element) throw new Error('Expected a rendered control')
  return element
}

afterEach(() => {
  document.body.replaceChildren()
})

test('prompt preserves an edited draft across state changes and reconnects with one controller', async () => {
  defineLumenElements(['PromptComposer'])
  const root = document.createElement('lumen-prompt-composer')
  root.setAttribute('value', 'Original')
  document.body.append(root)
  await Promise.resolve()
  expect(root).toBeInstanceOf(LumenPromptComposerElement)
  const input = required(root.querySelector('textarea'))
  input.value = 'Edited'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  root.setAttribute('pending', '')
  expect(input.value).toBe('Edited')
  expect(required(root.querySelector('[data-ui-prompt-stop]')).hasAttribute('hidden')).toBe(false)
  root.removeAttribute('pending')
  root.remove()
  document.body.append(root)
  await Promise.resolve()
  const submit = vi.fn()
  root.addEventListener('ui:prompt-submit', submit)
  required(root.querySelector('form')).dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  expect(submit).toHaveBeenCalledTimes(1)
  expect(submit).toHaveBeenCalledWith(expect.objectContaining({ detail: { text: 'Edited' } }))
  expect(root.querySelectorAll('textarea')).toHaveLength(1)
  root.setAttribute('value', 'Replacement')
  expect(input.value).toBe('Replacement')
  root.setAttribute('disabled', '')
  expect(input.disabled).toBe(true)
})

test('approval status and disabled changes prevent decisions while keeping content', async () => {
  defineLumenElements(['ApprovalCard'])
  const root = document.createElement('lumen-approval-card')
  root.setAttribute('request-id', 'proposal')
  root.textContent = 'Review before publishing'
  document.body.append(root)
  await Promise.resolve()
  const respond = vi.fn()
  root.addEventListener('ui:approval-response', respond)
  const approve = required(root.querySelector<HTMLButtonElement>('[data-ui-approval-response="approve"]'))
  approve.click()
  expect(respond).toHaveBeenCalledTimes(1)
  root.setAttribute('status', 'approved')
  approve.click()
  expect(respond).toHaveBeenCalledTimes(1)
  expect(approve.disabled).toBe(true)
  expect(root.textContent).toContain('Review before publishing')
  root.setAttribute('status', 'pending')
  root.setAttribute('disabled', '')
  expect(approve.disabled).toBe(true)
})

test('streaming text never becomes markup or a token-by-token live region', async () => {
  defineLumenElements(['StreamMessage', 'SourceCitation'])
  const message = document.createElement('lumen-stream-message')
  message.setAttribute('text', '<img src=x onerror=alert(1)>')
  message.setAttribute('status', 'streaming')
  message.setAttribute('status-label', 'Writing')
  document.body.append(message)
  await Promise.resolve()
  expect(message).toBeInstanceOf(LumenStreamMessageElement)
  expect(message.querySelector('img')).toBeNull()
  const content = required(message.querySelector('[data-ui-stream-content]'))
  expect(content.getAttribute('aria-live')).toBe('off')
  expect(content.getAttribute('aria-busy')).toBe('true')
  expect(required(message.querySelector('[role="status"]')).textContent).toBe('Writing')
  const citation = document.createElement('lumen-source-citation')
  citation.setAttribute('href', 'javascript:alert(1)')
  citation.setAttribute('label', 'Unsafe source')
  document.body.append(citation)
  await Promise.resolve()
  expect(citation.querySelector('a')).toBeNull()
  citation.setAttribute('href', 'https://example.com')
  expect(required(citation.querySelector('a')).rel).toBe('noopener noreferrer')
})
