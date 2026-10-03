// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { Tabs, TabsList, TabsPanel, TabsTrigger } from './components.js'

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

const trigger = (value: string, disabled = false) => createElement(TabsTrigger, { value, disabled }, value)

const getTab = (label: string): HTMLButtonElement => {
  const result = [...container.querySelectorAll('button')].find(button => button.textContent === label)
  if (!result) throw new Error(`Expected tab ${label}`)
  return result
}

test('wraps outer tabs without selecting or focusing nested tabs', async () => {
  const changed = vi.fn()
  await act(async () => {
    await Promise.resolve()
    root.render(createElement(Tabs, { defaultValue: 'second', onValueChange: changed }, createElement(TabsList, {}, trigger('first'), trigger('second')), createElement(TabsPanel, { value: 'first' }, 'First panel'), createElement(TabsPanel, { value: 'second' }, createElement(Tabs, { defaultValue: 'nested' }, createElement(TabsList, {}, trigger('nested')), createElement(TabsPanel, { value: 'nested' }, 'Nested panel')))))
  })
  await act(async () => {
    await Promise.resolve()
    getTab('second').focus()
    getTab('second').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
  })
  expect(document.activeElement).toBe(getTab('first'))
  expect(changed).toHaveBeenCalledExactlyOnceWith('first')
  expect(getTab('nested').getAttribute('aria-selected')).toBe('true')
})

test.each(['ArrowRight', 'End'])('skips disabled tabs when navigating with %s', async key => {
  const changed = vi.fn()
  await act(async () => {
    await Promise.resolve()
    root.render(createElement(Tabs, { defaultValue: 'first', onValueChange: changed }, createElement(TabsList, {}, trigger('first'), trigger('disabled', true), trigger('last'), trigger('disabled-last', true)), createElement(TabsPanel, { value: 'first' }, 'First panel'), createElement(TabsPanel, { value: 'last' }, 'Last panel')))
  })
  await act(async () => {
    await Promise.resolve()
    getTab('first').focus()
    getTab('first').dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  })
  expect(document.activeElement).toBe(getTab('last'))
  expect(changed).toHaveBeenCalledExactlyOnceWith('last')
  expect(getTab('disabled').getAttribute('aria-selected')).toBe('false')
})
