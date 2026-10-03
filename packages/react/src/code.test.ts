// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { Code, CodeTabs, CopyButton } from './components.js'

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.useFakeTimers()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => {
    await Promise.resolve()
    root.unmount()
  })
  container.remove()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const button = () => {
  const value = container.querySelector('button.ui-code__copy, button.ui-copy-button')
  if (!(value instanceof HTMLButtonElement)) throw new Error('Expected copy button')
  return value
}
const click = async () => {
  await act(async () => {
    await Promise.resolve()
    button().click()
  })
}

test('Code copies exact text, announces localized success, and restarts feedback after repeated clicks', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { clipboard: { writeText } })
  await act(async () => {
    await Promise.resolve()
    root.render(createElement(Code, { code: 'const answer = 42\n', variant: 'block', copy: true, copyLabel: 'Copy snippet', copiedLabel: 'Snippet saved', codeLabel: 'Example source' }))
  })
  expect(container.querySelector('pre')?.getAttribute('tabindex')).toBe('0')
  expect(container.querySelector('pre')?.getAttribute('aria-label')).toBe('Example source')
  await click()
  expect(writeText).toHaveBeenCalledWith('const answer = 42\n')
  expect(button().getAttribute('aria-label')).toBe('Snippet saved')
  expect(container.querySelector('[role="status"]')?.textContent).toBe('Snippet saved')
  await act(async () => {
    await Promise.resolve()
    vi.advanceTimersByTime(1500)
  })
  await click()
  await act(async () => {
    await Promise.resolve()
    vi.advanceTimersByTime(600)
  })
  expect(button().dataset.state).toBe('copied')
  await act(async () => {
    await Promise.resolve()
    vi.advanceTimersByTime(1400)
  })
  expect(button().dataset.state).toBe('idle')
  expect(button().getAttribute('aria-label')).toBe('Copy snippet')
})

test.each(['unavailable', 'rejected'])('CodeTabs reports %s clipboard access with localized recovery', async mode => {
  vi.stubGlobal('navigator', mode === 'unavailable' ? {} : { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) } })
  await act(async () => {
    await Promise.resolve()
    root.render(createElement(CodeTabs, {
      items: [{ code: 'pnpm install', label: 'pnpm', value: 'pnpm' }],
      errorLabel: 'Select and copy manually.',
      copyLabel: 'Copy snippet'
    }))
  })
  await click()
  expect(button().dataset.state).toBe('error')
  expect(button().getAttribute('aria-label')).toBe('Select and copy manually.')
  expect(container.querySelector('[role="status"]')?.textContent).toBe('Select and copy manually.')
})

test('highlighted code preserves a supplied accessible name and wrapped blocks avoid extra tab stops', async () => {
  await act(async () => {
    await Promise.resolve()
    root.render(createElement(Code, {
      variant: 'block',
      highlighted: true,
      codeLabel: 'Example'
    }, createElement('pre', { 'aria-label': 'Custom sample' }, createElement('code', {}, 'let x = 1'))))
  })
  expect(container.querySelector('pre')?.tabIndex).toBe(0)
  expect(container.querySelector('pre')?.getAttribute('aria-label')).toBe('Custom sample')
  await act(async () => {
    await Promise.resolve()
    root.render(createElement(Code, { variant: 'block', wrap: true, code: 'x' }))
  })
  expect(container.querySelector('pre')?.hasAttribute('tabindex')).toBe(false)
})

test('shared copy behavior preserves consumer cancellation and empty values', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { clipboard: { writeText } })
  await act(async () => {
    await Promise.resolve()
    root.render(createElement(CopyButton, { value: '',
      onClick: event => {
        event.preventDefault()
      } }))
  })
  await click()
  expect(writeText).not.toHaveBeenCalled()
  await act(async () => {
    await Promise.resolve()
    root.render(createElement(CopyButton, { value: '' }))
  })
  await click()
  expect(writeText).toHaveBeenCalledWith('')
})

test('a late clipboard result cannot replace feedback from the latest attempt', async () => {
  let finishFirst: (() => void) | undefined
  const first = new Promise<void>(resolve => {
    finishFirst = resolve
  })
  const writeText = vi.fn().mockReturnValueOnce(first).mockRejectedValueOnce(new Error('Denied'))
  vi.stubGlobal('navigator', { clipboard: { writeText } })
  await act(async () => {
    await Promise.resolve()
    root.render(createElement(Code, { variant: 'block', code: 'x', copy: true, errorLabel: 'Copy manually' }))
  })
  await click()
  await click()
  expect(button().dataset.state).toBe('error')
  await act(async () => {
    finishFirst?.()
    await first
  })
  expect(button().dataset.state).toBe('error')
  expect(button().getAttribute('aria-label')).toBe('Copy manually')
})
