// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import {
  bindLumenApprovalCard, canSubmitLumenPrompt, createLumenPromptComposerController,
  normalizeLumenPromptLimit, readLumenApprovalResponseDetail, readLumenPromptSubmitDetail, resolveLumenCitationHref
} from './ai-surfaces.js'

afterEach(() => {
  document.body.replaceChildren()
  vi.useRealTimers()
})

const prompt = () => {
  const form = document.createElement('form')
  form.dataset.pending = 'false'
  form.innerHTML = '<textarea data-ui-prompt-input maxlength="10"></textarea><button data-ui-prompt-send type="submit">Send</button><button data-ui-prompt-stop type="button">Stop</button>'
  document.body.append(form)
  const input = form.querySelector('textarea')
  const send = form.querySelector<HTMLButtonElement>('[data-ui-prompt-send]')
  const stop = form.querySelector<HTMLButtonElement>('[data-ui-prompt-stop]')
  if (!input || !send || !stop) throw new Error('Expected composer controls')
  return { form, input, send, stop }
}

test('prompt limits and payloads reject invalid input without changing domain ownership', () => {
  expect(canSubmitLumenPrompt(' \n ')).toBe(false)
  expect(canSubmitLumenPrompt('hello', 4)).toBe(false)
  expect(canSubmitLumenPrompt('hello', 5)).toBe(true)
  expect(normalizeLumenPromptLimit(Number.NaN)).toBe(4000)
  expect(normalizeLumenPromptLimit(0)).toBe(4000)
  expect(normalizeLumenPromptLimit(Number.MAX_SAFE_INTEGER)).toBe(2147483647)
  expect(readLumenPromptSubmitDetail({ text: 'Hello' })).toEqual({ text: 'Hello' })
  expect(readLumenPromptSubmitDetail({ text: 12 })).toBeUndefined()
  expect(readLumenApprovalResponseDetail({ requestId: 'request', response: 'approve' })).toEqual({ requestId: 'request', response: 'approve' })
  expect(readLumenApprovalResponseDetail({ requestId: 1, response: 'approve' })).toBeUndefined()
  expect(readLumenApprovalResponseDetail({ requestId: 'request', response: 'execute' })).toBeUndefined()
})

test.each(['javascript:alert(1)', 'data:text/html,hello', '//evil.example', '/\\evil.example', 'https://user:password@example.com', 'https://example.com\n', 'java\tscript:alert(1)', 'not a URL'])('rejects unsafe citation %s', value => {
  expect(resolveLumenCitationHref(value)).toBeUndefined()
})

test.each([undefined, null, 12, { href: 'https://example.com' }])('rejects non-string citation input %s', value => {
  expect(resolveLumenCitationHref(value)).toBeUndefined()
})

test('citations preserve local paths and normalize safe web URLs', () => {
  expect(resolveLumenCitationHref('/docs/motion?source=assistant#timing')).toBe('/docs/motion?source=assistant#timing')
  expect(resolveLumenCitationHref('https://example.com')).toBe('https://example.com/')
  expect(resolveLumenCitationHref('http://localhost:4321/docs')).toBe('http://localhost:4321/docs')
  expect(resolveLumenCitationHref(`javascript:${'x'.repeat(100000)}`)).toBeUndefined()
})

test('composer emits trimmed text, prevents accidental navigation, and rejects pending and empty submission', () => {
  const { form, input, send } = prompt()
  const listener = vi.fn()
  form.addEventListener('ui:prompt-submit', listener)
  const controller = createLumenPromptComposerController(form)
  expect(send.disabled).toBe(true)
  input.value = ' hello '
  input.dispatchEvent(new Event('input'))
  expect(send.disabled).toBe(false)
  const submit = new Event('submit', { cancelable: true })
  form.dispatchEvent(submit)
  expect(submit.defaultPrevented).toBe(true)
  expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: { text: 'hello' } }))
  form.dataset.pending = 'true'
  form.dispatchEvent(new Event('submit', { cancelable: true }))
  expect(listener).toHaveBeenCalledTimes(1)
  controller.destroy()
  form.dispatchEvent(new Event('submit', { cancelable: true }))
  expect(listener).toHaveBeenCalledTimes(1)
})

test('explicit native actions remain available unless the application cancels the request', () => {
  const { form, input } = prompt()
  form.setAttribute('action', '/messages')
  input.value = 'hello'
  const controller = createLumenPromptComposerController(form)
  const submit = new Event('submit', { cancelable: true })
  form.dispatchEvent(submit)
  expect(submit.defaultPrevented).toBe(false)
  form.addEventListener('ui:prompt-submit', event => {
    event.preventDefault()
  })
  const canceled = new Event('submit', { cancelable: true })
  form.dispatchEvent(canceled)
  expect(canceled.defaultPrevented).toBe(true)
  controller.destroy()
})

test('Enter submission is optional and never intercepts composition, modifiers or canceled keys', () => {
  const { form, input } = prompt()
  input.value = 'hello'
  const submit = vi.spyOn(form, 'requestSubmit').mockImplementation(() => undefined)
  const controller = createLumenPromptComposerController(form)
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }))
  expect(submit).not.toHaveBeenCalled()
  form.dataset.submitOnEnter = 'true'
  const modifiers = [{ isComposing: true }, { shiftKey: true }, { ctrlKey: true }, { altKey: true }, { metaKey: true }]
  for (const modifier of modifiers) {
    input.dispatchEvent(new KeyboardEvent('keydown', { ...modifier, key: 'Enter', cancelable: true }))
  }
  expect(submit).not.toHaveBeenCalled()
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }))
  expect(submit).toHaveBeenCalledTimes(1)
  controller.destroy()
})

test('pending stop and reset behavior updates safely and cleans up delayed work', async () => {
  vi.useFakeTimers()
  const { form, input, send, stop } = prompt()
  const stopRequest = vi.fn()
  form.addEventListener('ui:prompt-stop', stopRequest)
  const controller = createLumenPromptComposerController(form)
  form.dataset.pending = 'true'
  await Promise.resolve()
  expect(stop.hidden).toBe(false)
  stop.click()
  expect(stopRequest).toHaveBeenCalledTimes(1)
  form.dataset.pending = 'false'
  input.value = 'hello'
  input.dispatchEvent(new Event('input'))
  expect(send.disabled).toBe(false)
  form.reset()
  vi.runAllTimers()
  expect(send.disabled).toBe(true)
  controller.destroy()
  stop.click()
  expect(stopRequest).toHaveBeenCalledTimes(1)
})

test('approval emits only a decision for its own pending request and responds to state changes', async () => {
  const root = document.createElement('div')
  root.dataset.uiApprovalCard = ''
  root.dataset.requestId = 'request-1'
  root.dataset.status = 'pending'
  root.innerHTML = '<button data-ui-approval-response="approve">Approve</button>'
  document.body.append(root)
  const button = root.querySelector('button')
  if (!button) throw new Error('Expected approve action')
  const listener = vi.fn()
  root.addEventListener('ui:approval-response', listener)
  const cleanup = bindLumenApprovalCard(root)
  button.click()
  expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: { requestId: 'request-1', response: 'approve' } }))
  root.dataset.status = 'approved'
  await Promise.resolve()
  expect(button.disabled).toBe(true)
  button.click()
  expect(listener).toHaveBeenCalledTimes(1)
  root.dataset.status = 'pending'
  root.dataset.disabled = 'true'
  await Promise.resolve()
  expect(button.disabled).toBe(true)
  cleanup()
})
