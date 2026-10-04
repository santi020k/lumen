// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ToastProvider, useToast } from './index.js'

let container: HTMLDivElement
let root: Root

const ToastActions = () => {
  const toast = useToast()

  return createElement('div', null, createElement('button', {
    onClick: () => toast.create({ duration: 0, id: 'save', title: 'Saving' })
  }, 'Save'), createElement('button', {
    onClick: () => {
      toast.update('save', { title: 'Saved', variant: 'success' })
    }
  }, 'Complete'), createElement('button', {
    onClick: () => toast.create({ duration: 1000, id: 'timed', title: 'Temporary' })
  }, 'Timed'))
}

const clickButton = async (label: string) => {
  const button = [...container.querySelectorAll('button')]
    .find(element => element.textContent === label || element.getAttribute('aria-label') === label)

  if (!button) throw new Error(`Missing button: ${label}`)

  await act(async () => {
    button.click()
    await Promise.resolve()
  })
}

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.useFakeTimers()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)

  await act(async () => {
    root.render(createElement(ToastProvider, { maxCount: 1 }, createElement(ToastActions)))
    await Promise.resolve()
  })
})

afterEach(async () => {
  await act(async () => {
    root.unmount()
    await Promise.resolve()
  })
  container.remove()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

test('provides the toast API to mounted children and updates and dismisses feedback', async () => {
  await clickButton('Save')
  expect(container.querySelector('[role="status"]')?.textContent).toContain('Saving')

  await clickButton('Complete')
  expect(container.querySelector('#save')?.getAttribute('data-variant')).toBe('success')
  expect(container.querySelectorAll('[data-ui-toast]')).toHaveLength(1)
  expect(container.querySelector('#save')?.textContent).toContain('Saved')

  await clickButton('Dismiss notification')
  expect(container.querySelector('#save')?.getAttribute('data-state')).toBe('closed')

  await act(() => vi.advanceTimersByTimeAsync(240))
  expect(container.querySelector('#save')).toBeNull()
})

test('enforces the viewport limit and expires timed notifications', async () => {
  await clickButton('Save')
  await clickButton('Timed')

  expect(container.querySelector('#save')?.getAttribute('data-state')).toBe('closed')
  expect(container.querySelector('#timed')?.getAttribute('data-state')).toBe('open')

  await act(() => vi.advanceTimersByTimeAsync(240))
  expect(container.querySelector('#save')).toBeNull()

  await act(() => vi.advanceTimersByTimeAsync(760))
  expect(container.querySelector('#timed')?.getAttribute('data-state')).toBe('closed')

  await act(() => vi.advanceTimersByTimeAsync(240))
  expect(container.querySelectorAll('[data-ui-toast]')).toHaveLength(0)
})
