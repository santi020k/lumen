// @vitest-environment jsdom
import { act, createElement, StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { VirtualList } from './components.js'

let container: HTMLDivElement
let root: Root
const rows = (count: number) => Array.from({ length: count }, (_, index) => createElement('div', { key: index }, createElement('button', {}, `Row ${index + 1}`)))
const render = (count: number, itemSize = 40) => act(async () => {
  root.render(createElement(StrictMode, {}, createElement(VirtualList, { 'aria-label': 'Records', itemSize, overscan: 0 }, rows(count))))
  await Promise.resolve()
})
const getList = () => {
  const list = container.querySelector<HTMLElement>('[data-ui-virtual-list]')

  if (!list) throw new Error('Expected virtual list')

  return list
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(80)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => {
    root.unmount()
    await Promise.resolve()
  })
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

test('enhances once through StrictMode replay and scrolls to the final row', async () => {
  await render(20)
  const list = getList()

  expect(list.querySelectorAll('[data-ui-virtual-list-spacer]')).toHaveLength(2)
  expect(list.tabIndex).toBe(0)
  list.scrollTop = 720
  list.dispatchEvent(new Event('scroll'))
  expect(list.dataset.uiRangeEnd).toBe('19')
  expect(list.querySelector('div:not([hidden]):not([data-ui-virtual-list-spacer])')?.textContent).toBe('Row 19')
})

test('updates after React appends, removes, and changes sizing without losing row identity', async () => {
  await render(5)
  const firstButton = getList().querySelector('button')

  await render(20)
  expect(getList().querySelector('button')).toBe(firstButton)
  expect(getList().lastElementChild?.getAttribute('style')).toContain('720px')
  getList().scrollTop = 720
  getList().dispatchEvent(new Event('scroll'))
  await render(2, 80)
  expect(getList().scrollTop).toBe(80)
  expect(getList().dataset.uiRangeStart).toBe('1')
  expect(getList().children).toHaveLength(4)
})

test('retains focus when a mounted window moves', async () => {
  await render(20)
  const list = getList()
  const button = list.querySelector('button')

  if (!button) throw new Error('Expected button')

  button.focus()
  list.scrollTop = 720
  list.dispatchEvent(new Event('scroll'))
  expect(document.activeElement).toBe(button)
  expect(button.parentElement?.hidden).toBe(false)
  expect(list.dataset.uiRangeStart).toBe('0')
})
