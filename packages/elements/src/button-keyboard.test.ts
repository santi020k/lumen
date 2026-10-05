// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { defineLumenButton } from './components/button.js'

defineLumenButton()
afterEach(() => {
  document.body.replaceChildren()
})

const fixture = () => {
  const button = document.createElement('lumen-button')
  button.textContent = 'Save'
  document.body.append(button)
  const onClick = vi.fn()
  button.addEventListener('click', onClick)
  return { button, onClick }
}
const key = (element: HTMLElement, name: string, type = 'keydown'): KeyboardEvent => {
  const event = new KeyboardEvent(type, { key: name, bubbles: true, cancelable: true })
  element.dispatchEvent(event)
  return event
}

test('Enter and Space activate once; Space activates on release and prevents scrolling', async () => {
  const { button, onClick } = fixture()
  key(button, 'Enter')
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(onClick).toHaveBeenCalledTimes(1)
  expect(key(button, ' ').defaultPrevented).toBe(true)
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(onClick).toHaveBeenCalledTimes(1)
  key(button, ' ', 'keyup')
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(onClick).toHaveBeenCalledTimes(2)
  key(button, ' ', 'keyup')
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(onClick).toHaveBeenCalledTimes(2)
})

test.each(['disabled', 'loading', 'aria-disabled'])('blocks %s activation including direct clicks', async attribute => {
  const { button, onClick } = fixture()
  button.setAttribute(attribute, 'true')
  button.click()
  key(button, 'Enter')
  key(button, ' ')
  key(button, ' ', 'keyup')
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(onClick).not.toHaveBeenCalled()
})

test('respects ancestor cancellation and repeat/composition; retains a nested native button path', async () => {
  const { button, onClick } = fixture()
  const cancel = (event: KeyboardEvent): void => {
    event.preventDefault()
  }
  document.body.addEventListener('keydown', cancel)
  key(button, 'Enter')
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(onClick).not.toHaveBeenCalled()
  document.body.removeEventListener('keydown', cancel)
  for (const options of [{ repeat: true }, { isComposing: true }]) button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, ...options }))
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(onClick).not.toHaveBeenCalled()
  const nested = document.createElement('button')
  button.append(nested)
  key(nested, 'Enter')
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(onClick).not.toHaveBeenCalled()
  nested.click()
  expect(onClick).toHaveBeenCalledOnce()
})

test('reconnection binds once and blur or disconnect cancels a pending Space', async () => {
  const { button, onClick } = fixture()
  key(button, ' ')
  button.dispatchEvent(new Event('blur'))
  key(button, ' ', 'keyup')
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(onClick).not.toHaveBeenCalled()
  key(button, ' ')
  button.remove()
  document.body.append(button)
  key(button, ' ', 'keyup')
  key(button, 'Enter')
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(onClick).toHaveBeenCalledOnce()
})

test('canceled Space before the host or during ancestor release suppresses activation', async () => {
  const { button, onClick } = fixture()
  const cancel = (event: KeyboardEvent): void => {
    event.preventDefault()
  }

  document.body.addEventListener('keydown', cancel, true)
  key(button, ' ')
  key(button, ' ', 'keyup')
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(onClick).not.toHaveBeenCalled()
  document.body.removeEventListener('keydown', cancel, true)
  document.body.addEventListener('keyup', cancel)
  expect(key(button, ' ').defaultPrevented).toBe(true)
  key(button, ' ', 'keyup')
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(onClick).not.toHaveBeenCalled()
  document.body.removeEventListener('keyup', cancel)
  key(button, ' ')
  key(button, ' ', 'keyup')
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(onClick).toHaveBeenCalledOnce()
})

test('reflects blocked semantics and restores application aria-disabled after unblocking', () => {
  const { button } = fixture()
  button.setAttribute('aria-disabled', 'false')
  button.setAttribute('loading', '')
  expect(button.getAttribute('aria-disabled')).toBe('true')
  button.setAttribute('disabled', '')
  button.removeAttribute('loading')
  expect(button.getAttribute('aria-disabled')).toBe('true')
  button.removeAttribute('disabled')
  expect(button.getAttribute('aria-disabled')).toBe('false')
})

test('explicit false flags remain enabled and other released keys do not cancel Space', async () => {
  const { button, onClick } = fixture()
  button.setAttribute('disabled', 'false')
  button.setAttribute('loading', 'false')
  key(button, ' ')
  key(button, 'Shift', 'keyup')
  key(button, ' ', 'keyup')
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(onClick).toHaveBeenCalledOnce()
})
