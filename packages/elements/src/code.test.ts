// @vitest-environment jsdom
import { afterEach, beforeAll, expect, test, vi } from 'vitest'

import { defineLumenElements } from './index.js'

beforeAll(() => {
  defineLumenElements(customElements)
})

afterEach(() => {
  document.body.replaceChildren()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

const renderCode = () => {
  const code = document.createElement('lumen-code')
  code.setAttribute('variant', 'block')
  code.setAttribute('copy', '')
  code.setAttribute('copy-label', 'Copy snippet')
  code.setAttribute('copied-label', 'Snippet saved')
  code.setAttribute('error-label', 'Select and copy manually.')
  code.setAttribute('code-label', 'Example source')
  code.innerHTML = '<pre><code>pnpm install</code></pre>'
  document.body.append(code)
  const button = code.querySelector('button')
  if (!button) throw new Error('Expected copy button')
  return { code, button }
}

test('enhances the code child contract with named keyboard access and localized copy feedback', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { clipboard: { writeText } })
  const { code, button } = renderCode()
  expect(code.querySelector('pre')?.tabIndex).toBe(0)
  expect(code.querySelector('pre')?.getAttribute('aria-label')).toBe('Example source')
  button.click()
  await vi.waitFor(() => {
    expect(button.dataset.state).toBe('copied')
  })
  expect(writeText).toHaveBeenCalledWith('pnpm install')
  expect(button.getAttribute('aria-label')).toBe('Snippet saved')
  expect(code.querySelector('[role="status"]')?.textContent).toBe('Snippet saved')
})

test.each(['unavailable', 'rejected'])('announces %s clipboard access and can recover on another attempt', async mode => {
  vi.stubGlobal('navigator', mode === 'unavailable' ? {} : { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) } })
  const { code, button } = renderCode()
  button.click()
  await vi.waitFor(() => {
    expect(button.dataset.state).toBe('error')
  })
  expect(code.querySelector('[role="status"]')?.textContent).toBe('Select and copy manually.')
  vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
  button.click()
  await vi.waitFor(() => {
    expect(button.dataset.state).toBe('copied')
  })
})

test('supports code children inserted after connection and keeps authored region names', async () => {
  const code = document.createElement('lumen-code')
  code.setAttribute('variant', 'block')
  document.body.append(code)
  code.innerHTML = '<pre aria-label="Authored name"><code>x</code></pre>'
  await vi.waitFor(() => {
    expect(code.querySelector('pre')?.tabIndex).toBe(0)
  })
  expect(code.querySelector('pre')?.getAttribute('aria-label')).toBe('Authored name')
})

test.each(['removed', 'false'])('removes only generated copy UI when copy is %s and can enable it again', async mode => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { clipboard: { writeText } })
  const { code, button } = renderCode()
  const authored = document.createElement('span')
  authored.dataset.uiCodeStatus = ''
  authored.textContent = 'Authored status'
  code.append(authored)
  if (mode === 'removed') code.removeAttribute('copy')
  else code.setAttribute('copy', 'false')
  await vi.waitFor(() => {
    expect(button.isConnected).toBe(false)
    expect(code.querySelector('button')).toBeNull()
    expect(code.querySelector('[role="status"]')).toBeNull()
  })
  expect(authored.isConnected).toBe(true)
  expect(authored.textContent).toBe('Authored status')
  code.setAttribute('copy', '')
  await vi.waitFor(() => {
    expect(code.querySelector('button')).not.toBeNull()
  })
  code.querySelector('button')?.click()
  await vi.waitFor(() => {
    expect(writeText).toHaveBeenCalledOnce()
  })
})

test('removes generated scroll semantics on wrap changes and preserves authored replacements', async () => {
  const { code } = renderCode()
  const pre = code.querySelector('pre')
  if (!pre) throw new Error('Expected code region')
  code.setAttribute('wrap', 'true')
  await vi.waitFor(() => {
    expect(pre.hasAttribute('tabindex')).toBe(false)
    expect(pre.hasAttribute('role')).toBe(false)
    expect(pre.hasAttribute('aria-label')).toBe(false)
  })
  code.setAttribute('wrap', 'false')
  await vi.waitFor(() => {
    expect(pre.tabIndex).toBe(0)
  })
  pre.setAttribute('tabindex', '-1')
  pre.setAttribute('role', 'group')
  pre.setAttribute('aria-label', 'Authored replacement')
  code.setAttribute('wrap', 'true')
  await vi.waitFor(() => {
    expect(pre.getAttribute('tabindex')).toBe('-1')
    expect(pre.getAttribute('role')).toBe('group')
    expect(pre.getAttribute('aria-label')).toBe('Authored replacement')
  })
})

test('keeps pre-authored keyboard and naming attributes when enabling wrap', async () => {
  const code = document.createElement('lumen-code')
  code.setAttribute('variant', 'block')
  code.innerHTML = '<pre tabindex="0" role="group" aria-labelledby="source-heading"><code>x</code></pre>'
  document.body.append(code)
  code.setAttribute('wrap', 'true')
  await Promise.resolve()
  await Promise.resolve()
  expect(code.querySelector('pre')?.outerHTML).toContain('tabindex="0" role="group" aria-labelledby="source-heading"')
})

test('cancels pending copy feedback when the source is removed and copying is disabled', async () => {
  let completeClipboard: (() => void) | undefined
  const pending = new Promise<void>(resolve => {
    completeClipboard = resolve
  })
  const writeText = vi.fn(() => pending)
  vi.stubGlobal('navigator', { clipboard: { writeText } })
  const { code, button } = renderCode()
  const success = vi.fn()
  code.addEventListener('ui:copy-success', success)
  button.click()
  expect(writeText).toHaveBeenCalledOnce()
  code.querySelector('pre')?.remove()
  code.removeAttribute('copy')
  await vi.waitFor(() => {
    expect(code.querySelector('button')).toBeNull()
    expect(code.querySelector('[role="status"]')).toBeNull()
  })
  completeClipboard?.()
  await pending
  await Promise.resolve()
  expect(success).not.toHaveBeenCalled()
})

test('refreshes generated code labels while preserving authored replacements', async () => {
  const { code } = renderCode()
  const pre = code.querySelector('pre')
  if (!pre) throw new Error('Expected code region')
  code.setAttribute('code-label', 'Updated source')
  await vi.waitFor(() => {
    expect(pre.getAttribute('aria-label')).toBe('Updated source')
  })
  pre.setAttribute('aria-label', 'Authored replacement')
  code.setAttribute('code-label', 'Another source')
  await Promise.resolve()
  await Promise.resolve()
  expect(pre.getAttribute('aria-label')).toBe('Authored replacement')
})

test('refreshes inherited generated labels when reconnecting under another code-tabs container', async () => {
  const { code } = renderCode()
  code.removeAttribute('code-label')
  const first = document.createElement('lumen-code-tabs')
  const second = document.createElement('lumen-code-tabs')
  first.setAttribute('code-label', 'First source')
  second.setAttribute('code-label', 'Second source')
  document.body.append(first, second)
  first.append(code)
  await vi.waitFor(() => {
    expect(code.querySelector('pre')?.getAttribute('aria-label')).toBe('First source')
  })
  second.append(code)
  await vi.waitFor(() => {
    expect(code.querySelector('pre')?.getAttribute('aria-label')).toBe('Second source')
  })
})
