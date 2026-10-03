// @vitest-environment jsdom
// cspell:words posinset setsize
import { act, createElement, StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { VirtualList } from './virtual-list.js'

interface RecordItem { id: number, label: string }
const records = (count: number): RecordItem[] => Array.from({ length: count }, (_, id) => ({ id, label: `Row ${id}` }))
const getKey = (item: RecordItem) => item.id
const renderItem = (item: RecordItem) => createElement('button', {}, item.label)
let container: HTMLDivElement
let root: Root

const render = (items: RecordItem[]) => act(async () => {
  await Promise.resolve()
  root.render(createElement(StrictMode, {}, createElement(VirtualList<RecordItem>, { 'aria-label': 'Records', items, getKey, renderItem, itemSize: 40, overscan: 0 })))
})
const list = () => {
  const element = container.querySelector<HTMLElement>('[data-ui-virtual-list]')

  if (!element) throw new Error('Expected VirtualList')

  return element
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
    await Promise.resolve()
    root.unmount()
  })
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

test('renders only visible records, including the final window, through StrictMode replay', async () => {
  await render(records(20_000))
  expect(list().querySelectorAll('button')).toHaveLength(2)
  expect(list().firstElementChild?.getAttribute('style')).toContain('800000px')
  await act(async () => {
    await Promise.resolve()
    list().scrollTop = 799_920
    list().dispatchEvent(new Event('scroll'))
  })
  expect(list().textContent).toBe('Row 19998Row 19999')
  expect(list().querySelectorAll('button')).toHaveLength(2)
  expect(list().querySelector('[role="listitem"]')?.getAttribute('aria-posinset')).toBe('19999')
  expect(list().querySelector('[role="listitem"]')?.getAttribute('aria-setsize')).toBe('20000')
})

test('retains focused content and a bounded number of Tab neighbors while scrolling', async () => {
  await render(records(1000))
  const button = list().querySelector('button')

  await act(async () => {
    await Promise.resolve()
    button?.focus()
    list().scrollTop = 39_920
    list().dispatchEvent(new Event('scroll'))
  })
  expect(document.activeElement).toBe(button)
  expect(list().querySelectorAll('button')).toHaveLength(4)
  await act(async () => {
    await Promise.resolve()
    list().focus()
    await Promise.resolve()
  })
  expect(list().querySelectorAll('button')).toHaveLength(2)
})

test('updates keyed content and handles a shrunk or empty collection', async () => {
  await render(records(100))
  const first = list().querySelector('button')

  await render([{ id: 0, label: 'Updated' }, { id: 1, label: 'Second' }])
  expect(list().querySelector('button')).toBe(first)
  expect(list().textContent).toBe('UpdatedSecond')
  await render([])
  expect(list().querySelectorAll('button')).toHaveLength(0)
  expect(list().dataset.uiRangeEnd).toBe('-1')
})

test('server rendering is bounded and does not require browser globals', () => {
  const html = renderToString(createElement(VirtualList<RecordItem>, {
    items: records(20_000), getKey, renderItem, itemSize: 40, overscan: 2
  }))

  expect(html.match(/<button/gu)).toHaveLength(3)
  expect(html).toContain('800000px')
})

test('keeps a focused key mounted when data is reordered beyond the visible window', async () => {
  const items = records(100)

  await render(items)
  const first = list().querySelector('button')

  await act(async () => {
    first?.focus()
    await Promise.resolve()
  })
  await render([...items.slice(1), ...items.slice(0, 1)])
  expect(list().querySelector('[data-ui-virtual-list-index="99"] button')).toBe(first)
  expect(document.activeElement).toBe(first)
  expect(list().querySelectorAll('button').length).toBeLessThan(7)
})
