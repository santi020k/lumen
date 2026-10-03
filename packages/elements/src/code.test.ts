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
