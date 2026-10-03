// @vitest-environment jsdom
import { expect, test, vi } from 'vitest'

import { executeLumenRichTextCommand, type LumenRichTextCommandRequestEvent } from './rich-text.js'

test('uses the browser fallback only when no external engine takes ownership', () => {
  const root = document.createElement('section')
  const fallback = vi.fn(() => true)
  const listener = vi.fn()

  root.addEventListener('ui:editor-command-request', listener)
  expect(executeLumenRichTextCommand(root, { command: 'bold' }, fallback)).toBe(true)
  expect(fallback).toHaveBeenCalledOnce()
  expect(listener).toHaveBeenCalledOnce()
})

test.each([true, false])('a canceled request returns %s without running browser or callback commands', executed => {
  const root = document.createElement('section')
  const fallback = vi.fn(() => true)
  const handler = vi.fn(() => true)

  root.addEventListener('ui:editor-command-request', event => {
    const request = event as LumenRichTextCommandRequestEvent

    expect(request.detail.command).toBe('createLink')
    expect(request.detail.value).toBe('https://santi020k.com')
    request.preventDefault()
    request.detail.executed = executed
  })
  expect(executeLumenRichTextCommand(root, { command: 'createLink', value: 'https://santi020k.com' }, fallback, handler)).toBe(executed)
  expect(fallback).not.toHaveBeenCalled()
  expect(handler).not.toHaveBeenCalled()
})

test.each([true, false])('a callback owns the command even when its result is %s', executed => {
  const fallback = vi.fn(() => true)
  const handler = vi.fn(() => executed)

  expect(executeLumenRichTextCommand(null, { command: 'bold' }, fallback, handler)).toBe(executed)
  expect(handler).toHaveBeenCalledWith({ command: 'bold' })
  expect(fallback).not.toHaveBeenCalled()
})
