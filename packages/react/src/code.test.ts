// @vitest-environment jsdom
import { act, createElement, useState } from 'react'
import { createPortal } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { Code, CodeTabs, CopyButton } from './components.js'
import { ToastProvider } from './toast-provider.js'

let container: HTMLDivElement
let root: Root
const fixtures: HTMLElement[] = []

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
  for (const fixture of fixtures.splice(0)) fixture.remove()
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

test.each([true, false])('CopyButton sends %s clipboard feedback to its React toast provider', async success => {
  const writeText = success ? vi.fn().mockResolvedValue(undefined) : vi.fn().mockRejectedValue(new Error('Unavailable'))
  vi.stubGlobal('navigator', { clipboard: { writeText } })
  await act(async () => {
    await Promise.resolve()
    root.render(createElement(ToastProvider, null, createElement(CopyButton, { value: 'Example', toast: true })))
  })
  await click()
  expect(container.querySelector('[data-ui-toast]')?.getAttribute('data-variant')).toBe(success ? 'success' : 'destructive')
  expect(container.querySelector('[data-ui-toast]')?.textContent).toContain(success ? 'Copied to clipboard' : 'Could not copy to clipboard')
})

test('CopyButton resolves duplicate target selectors in its owning iframe document', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { clipboard: { writeText } })
  const iframe = document.createElement('iframe')
  document.body.append(iframe)
  fixtures.push(iframe)
  const owner = iframe.contentDocument
  if (!owner) throw new Error('Missing iframe document')
  owner.body.innerHTML = '<p id="copy-target">Iframe value</p><div id="portal"></div>'
  const host = document.createElement('p')
  host.id = 'copy-target'
  host.textContent = 'Host value'
  document.body.append(host)
  fixtures.push(host)
  const portal = owner.getElementById('portal')
  if (!portal) throw new Error('Missing portal')
  await act(async () => {
    await Promise.resolve()
    root.render(createPortal(createElement(CopyButton, { target: '#copy-target' }), portal))
  })
  const copy = portal.querySelector('button')
  if (!copy) throw new Error('Missing iframe copy button')
  await act(async () => {
    await Promise.resolve()
    copy.click()
  })
  expect(writeText).toHaveBeenCalledWith('Iframe value')
})

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

test('highlighted code removes only generated region attributes and updates labels on the same pre', () => {
  const children = createElement('pre', {}, createElement('code', {}, 'let x = 1'))
  const render = (wrap: boolean, codeLabel: string) => {
    act(() => {
      root.render(createElement(Code, { variant: 'block', highlighted: true, wrap, codeLabel }, children))
    })
  }

  render(false, 'First label')
  const pre = container.querySelector('pre')

  if (!pre) throw new Error('Missing highlighted code')

  expect(pre.getAttribute('aria-label')).toBe('First label')
  render(false, 'Second label')
  expect(container.querySelector('pre')).toBe(pre)
  expect(pre.getAttribute('aria-label')).toBe('Second label')
  render(true, 'Second label')
  expect(pre.hasAttribute('tabindex')).toBe(false)
  expect(pre.hasAttribute('role')).toBe(false)
  expect(pre.hasAttribute('aria-label')).toBe(false)
  render(false, 'Generated')
  pre.setAttribute('role', 'group')
  pre.setAttribute('aria-label', 'Consumer label')
  render(true, 'Generated')
  expect(pre.getAttribute('role')).toBe('group')
  expect(pre.getAttribute('aria-label')).toBe('Consumer label')
  expect(pre.hasAttribute('tabindex')).toBe(false)
})

test('highlighted code preserves newly adopted equal-valued consumer region attributes', () => {
  act(() => {
    root.render(createElement(Code, { variant: 'block', highlighted: true, codeLabel: 'Example' }, createElement('pre', {}, 'Code')))
  })
  const pre = container.querySelector('pre')

  if (!pre) throw new Error('Missing highlighted code')

  act(() => {
    root.render(createElement(Code, { variant: 'block', highlighted: true, wrap: true, codeLabel: 'Example' }, createElement('pre', { tabIndex: 0, role: 'region', 'aria-label': 'Example' }, 'Code')))
  })
  expect(container.querySelector('pre')).toBe(pre)
  expect(pre.getAttribute('tabindex')).toBe('0')
  expect(pre.getAttribute('role')).toBe('region')
  expect(pre.getAttribute('aria-label')).toBe('Example')
})

const AdoptingCodeChild = () => {
  const [adopted, setAdopted] = useState(false)

  return createElement('div', {}, createElement('button', { onClick: () => {
    setAdopted(true)
  } }, 'Adopt'), createElement('pre', adopted ? { tabIndex: 0, role: 'region', 'aria-label': 'Example' } : {}, 'Code'))
}

test('highlighted code preserves attributes adopted by an independently updating child', async () => {
  const children = createElement(AdoptingCodeChild)

  act(() => {
    root.render(createElement(Code, { variant: 'block', highlighted: true, codeLabel: 'Example' }, children))
  })
  const pre = container.querySelector('pre')
  const adopt = container.querySelector('button')

  if (!pre || !adopt) throw new Error('Missing adopting fixture')

  act(() => {
    adopt.click()
  })
  // Parent cleanup must see queued ownership changes even before the observer callback.
  act(() => {
    root.render(createElement(Code, { variant: 'block', highlighted: true, wrap: true, codeLabel: 'Example' }, children))
  })
  await Promise.resolve()
  expect(container.querySelector('pre')).toBe(pre)
  expect(pre.getAttribute('tabindex')).toBe('0')
  expect(pre.getAttribute('role')).toBe('region')
  expect(pre.getAttribute('aria-label')).toBe('Example')
})
