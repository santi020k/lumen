// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { defineLumenElements } from './define.js'

afterEach(() => {
  document.body.replaceChildren()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const fixture = (value: string | null = 'Complete link\n¡Hola!') => {
  defineLumenElements()
  const copy = document.createElement('lumen-copy-button')
  copy.setAttribute('recovery-label', 'Select complete link')
  if (value !== null) copy.setAttribute('value', value)
  copy.textContent = 'Copy link'
  document.body.append(copy)
  return copy
}

const click = async (copy: HTMLElement) => {
  copy.click()
  await Promise.resolve()
  await Promise.resolve()
}

test('manual recovery stays outside the button, survives feedback reset, and clears on successful retry', async () => {
  vi.useFakeTimers()
  const writeText = vi.fn().mockRejectedValue(new Error('Denied'))
  vi.stubGlobal('navigator', { clipboard: { writeText } })
  const copy = fixture()
  copy.focus()
  await click(copy)
  const field = document.querySelector('textarea')
  if (!field) throw new Error('Expected manual recovery')
  expect(field.value).toBe('Complete link\n¡Hola!')
  expect(copy.contains(field)).toBe(false)
  expect(field.readOnly).toBe(true)
  expect(document.activeElement).toBe(copy)
  field.focus()
  expect(field.selectionEnd).toBe(field.value.length)
  await vi.advanceTimersByTimeAsync(2000)
  expect(document.querySelector('textarea')).toBe(field)
  writeText.mockResolvedValue(undefined)
  await click(copy)
  expect(document.querySelector('textarea')).toBeNull()
  expect(copy.dataset.state).toBe('copied')
})

test.each(['value', 'target', 'recovery-label'])('changing %s clears stale recovery', async name => {
  vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) } })
  const copy = fixture()
  await click(copy)
  expect(document.querySelector('textarea')).not.toBeNull()
  copy.setAttribute(name, 'Changed')
  await Promise.resolve()
  expect(document.querySelector('textarea')).toBeNull()
})

test('a clipboard rejection after disconnect cannot restore recovery', async () => {
  let rejectCopy: ((error: Error) => void) | undefined
  vi.stubGlobal('navigator', { clipboard: { writeText: () => new Promise<void>((_resolve, reject) => {
    rejectCopy = reject
  }) } })
  const copy = fixture()
  copy.click()
  copy.remove()
  rejectCopy?.(new Error('Denied'))
  await Promise.resolve()
  expect(document.querySelector('textarea')).toBeNull()
})

test.each(['#missing', '['])('unresolved target %s does not create recovery', async target => {
  const copy = fixture(null)
  copy.setAttribute('target', target)
  await Promise.resolve()
  await click(copy)
  expect(copy.dataset.state).toBe('error')
  expect(document.querySelector('textarea')).toBeNull()
})

test('changed inputs invalidate a pending clipboard result', async () => {
  let rejectCopy: ((error: Error) => void) | undefined
  vi.stubGlobal('navigator', { clipboard: { writeText: () => new Promise<void>((_resolve, reject) => {
    rejectCopy = reject
  }) } })
  const copy = fixture()
  copy.click()
  copy.setAttribute('value', 'New link')
  await Promise.resolve()
  rejectCopy?.(new Error('Denied'))
  await Promise.resolve()
  expect(document.querySelector('textarea')).toBeNull()
})

test('recovery resolves a form control in its owning frame and removes generated siblings on disconnect', async () => {
  vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) } })
  const iframe = document.createElement('iframe')
  document.body.append(iframe)
  const owner = iframe.contentDocument
  if (!owner) throw new Error('Expected frame document')
  owner.body.innerHTML = '<input id="generated-value" value="Frame value">'
  const copy = fixture(null)
  copy.setAttribute('target', '#generated-value')
  owner.body.append(copy)
  await Promise.resolve()
  await click(copy)
  expect(owner.querySelector('textarea')?.value).toBe('Frame value')
  copy.remove()
  expect(owner.querySelector('textarea')).toBeNull()
  expect(owner.querySelector('[role="status"]')).toBeNull()
})

test('without recovery-label, error feedback keeps the existing UI', async () => {
  vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) } })
  const copy = fixture()
  copy.removeAttribute('recovery-label')
  await Promise.resolve()
  await click(copy)
  expect(copy.dataset.state).toBe('error')
  expect(document.querySelector('textarea')).toBeNull()
})
