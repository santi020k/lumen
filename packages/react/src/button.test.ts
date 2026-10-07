// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { Button } from './components.js'

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
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
  vi.unstubAllGlobals()
})

test.each(['disabled', 'loading'] as const)('blocks %s slotted pointer and keyboard activation', async state => {
  const onClick = vi.fn()
  const onKeyDown = vi.fn()
  await act(async () => {
    await Promise.resolve()
    root.render(createElement(Button, {
      asChild: true,
      [state]: true
    }, createElement('a', { href: '/upload', onClick, onKeyDown }, 'Upload')))
  })
  const link = container.querySelector('a')
  if (!link) throw new Error('Expected slotted link')
  expect(link.getAttribute('aria-disabled')).toBe('true')
  expect(link.tabIndex).toBe(-1)
  for (const event of [
    new MouseEvent('click', { bubbles: true, cancelable: true }),
    new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' }),
    new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: ' ' })
  ]) {
    link.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  }
  expect(onClick).not.toHaveBeenCalled()
  expect(onKeyDown).not.toHaveBeenCalled()
})

test('loading prevents duplicate native submission and preserves the accessible label', async () => {
  const onClick = vi.fn()
  await act(async () => {
    await Promise.resolve()
    root.render(createElement(Button, { loading: true, onClick, type: 'submit' }, 'Save changes'))
  })
  const button = container.querySelector('button')
  if (!button) throw new Error('Expected native button')
  expect(button.disabled).toBe(true)
  expect(button.textContent).toBe('Save changes')
  expect(button.getAttribute('aria-busy')).toBe('true')
  button.click()
  expect(onClick).not.toHaveBeenCalled()
})

test('enabled slotted controls keep consumer capture and bubble handlers', async () => {
  const onClick = vi.fn()
  const onClickCapture = vi.fn()
  await act(async () => {
    await Promise.resolve()
    root.render(createElement(Button, {
      asChild: true,
      onClickCapture
    }, createElement('a', { onClick, tabIndex: 2 }, 'Upload')))
  })
  const link = container.querySelector('a')
  if (!link) throw new Error('Expected slotted link')
  link.click()
  expect(onClick).toHaveBeenCalledOnce()
  expect(onClickCapture).toHaveBeenCalledOnce()
  expect(link.tabIndex).toBe(2)
})
