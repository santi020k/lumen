// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { initCopyButtons } from './runtime/features/code'

afterEach(() => {
  document.body.replaceChildren()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

test('failed code copying offers the exact full source without stealing focus, and retry removes recovery', async () => {
  vi.useFakeTimers()
  const source = 'const greeting = "¡Hola!";\nconsole.log(greeting)'
  const writeText = vi.fn().mockRejectedValueOnce(new Error('Denied')).mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { clipboard: { writeText } })
  document.body.innerHTML = '<figure data-ui-code><button data-ui-code-copy data-copy-recovery-label="Select full source">Copy</button><pre><code>Preview only</code></pre></figure>'
  const button = document.querySelector('button')
  if (!button) throw new Error('Missing copy button')
  button.dataset.copyValue = source
  initCopyButtons(document)
  button.focus()
  button.click()
  await Promise.resolve()
  const field = document.querySelector('textarea')
  if (!field) throw new Error('Missing recovery field')
  expect(field.value).toBe(source)
  expect(document.querySelector('label')?.textContent).toBe('Select full source')
  expect(document.activeElement).toBe(button)
  field.focus()
  expect(field.selectionEnd).toBe(source.length)
  vi.advanceTimersByTime(2100)
  expect(document.querySelector('textarea')).toBe(field)
  button.click()
  await Promise.resolve()
  expect(document.querySelector('textarea')).toBeNull()
})

test('standalone copy recovery labels and selects an empty value without requiring Code styles', async () => {
  vi.useFakeTimers()
  vi.stubGlobal('navigator', {})
  document.body.innerHTML = '<button data-ui-copy-button data-copy-value="" data-copy-recovery-label="Copy empty value">Copy</button>'
  initCopyButtons(document)
  const button = document.querySelector('button')
  if (!button) throw new Error('Missing copy button')
  button.click()
  await Promise.resolve()
  expect(document.querySelector('.ui-copy-button__recovery')?.textContent).toBe('Copy empty value')
  expect(document.querySelector('textarea')?.value).toBe('')
})

test('copy enhancement respects React and Elements ownership while keeping Astro controls active', async () => {
  vi.useFakeTimers()
  const writeText = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { clipboard: { writeText } })
  document.body.innerHTML = '<div data-ui-owner="react"><button data-ui-code-copy>React code</button></div><button data-ui-owner="react" data-ui-copy-button>React copy</button><lumen-code><button data-ui-code-copy>Elements code</button></lumen-code><lumen-copy-button><button data-ui-copy-button>Elements copy</button></lumen-copy-button><button id="astro-copy" data-ui-copy-button data-copy-value="Astro">Astro</button>'
  initCopyButtons(document)
  for (const button of document.querySelectorAll('button')) button.click()
  await Promise.resolve()
  expect(writeText).toHaveBeenCalledExactlyOnceWith('Astro')
})
