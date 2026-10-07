// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { getVirtualRange } from './data.js'
import { createLumenVirtualListController, type LumenVirtualListController } from './virtual-list.js'

const controllers: LumenVirtualListController[] = []
const fixture = (count = 20) => {
  const root = document.createElement('div')

  root.dataset.uiItemSize = '40'
  root.dataset.uiOverscan = '0'
  Object.defineProperty(root, 'clientHeight', { configurable: true, value: 80 })
  const rows = Array.from({ length: count }, (_, index) => {
    const row = document.createElement('div')
    const button = document.createElement('button')

    button.textContent = `Row ${index + 1}`
    row.append(button)
    root.append(row)

    return row
  })

  document.body.append(root)

  return { root, rows }
}
const bind = (root: HTMLElement) => {
  const controller = createLumenVirtualListController(root)

  controllers.push(controller)

  return controller
}
const flush = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

afterEach(() => {
  for (const controller of controllers.splice(0)) controller.destroy()
  document.body.replaceChildren()
  vi.unstubAllGlobals()
})

test('computes exact inclusive windows and normalizes empty, invalid and out-of-bounds ranges', () => {
  expect(getVirtualRange(0, 80, 40, 20, 0)).toEqual({ startIndex: 0, endIndex: 1 })
  expect(getVirtualRange(41, 80, 40, 20, 0)).toEqual({ startIndex: 1, endIndex: 3 })
  expect(getVirtualRange(9000, 80, 40, 20, 0)).toEqual({ startIndex: 18, endIndex: 19 })
  expect(getVirtualRange(0, 80, 40, 0)).toEqual({ startIndex: 0, endIndex: -1 })
  expect(getVirtualRange(-20, Number.NaN, 0, 20, -1)).toEqual({ startIndex: 0, endIndex: 0 })
  expect(getVirtualRange(Number.NaN, 88, Number.NaN, 20, Number.NaN)).toEqual({ startIndex: 0, endIndex: 5 })
})

test('keeps the full extent and reaches the last row without changing mounted row identity', () => {
  const { root, rows } = fixture()
  const onRange = vi.fn()

  root.addEventListener('ui:virtual-list-range', onRange)
  bind(root)
  expect(rows.filter(row => !row.hidden)).toHaveLength(2)
  expect(root.lastElementChild?.getAttribute('style')).toContain('720px')
  root.scrollTop = 720
  root.dispatchEvent(new Event('scroll'))
  expect(root.dataset.uiRangeStart).toBe('18')
  expect(root.firstElementChild?.getAttribute('style')).toContain('720px')
  expect(root.lastElementChild?.getAttribute('style')).toContain('0px')
  expect(rows.at(-1)?.hidden).toBe(false)
  expect(root.contains(rows[0] ?? null)).toBe(true)
  expect(onRange).toHaveBeenCalledTimes(2)
  root.dispatchEvent(new Event('scroll'))
  expect(onRange).toHaveBeenCalledTimes(2)
})

test('keeps focused controls and neighbors available until focus leaves', async () => {
  const { root, rows } = fixture()

  bind(root)
  const button = rows[0]?.querySelector('button')

  if (!button) throw new Error('Expected row button')

  button.focus()
  root.scrollTop = 720
  root.dispatchEvent(new Event('scroll'))
  expect(document.activeElement).toBe(button)
  expect(rows[0]?.hidden).toBe(false)
  expect(rows[1]?.hidden).toBe(false)
  button.blur()
  await flush()
  expect(rows[0]?.hidden).toBe(true)
})

test('refreshes appended, reordered and removed rows, including an initially empty list', async () => {
  const { root } = fixture(0)

  bind(root)
  expect(root.dataset.uiRangeEnd).toBe('-1')
  const rows = Array.from({ length: 10 }, () => document.createElement('div'))

  root.append(...rows)
  await flush()
  expect(root.lastElementChild?.getAttribute('data-ui-virtual-list-spacer')).toBe('end')
  root.scrollTop = 320
  root.dispatchEvent(new Event('scroll'))
  expect(rows[8]?.hidden).toBe(false)
  for (const row of rows.slice(2)) row.remove()
  await flush()
  expect(root.scrollTop).toBe(0)
  expect(root.dataset.uiRangeEnd).toBe('1')
  const last = rows[1]

  if (!last) throw new Error('Expected second row')

  root.prepend(last)
  await flush()
  expect(root.children[1]).toBe(last)
  expect(last.hidden).toBe(false)
})

test('updates for resizing and changed sizing attributes with invalid values falling back', async () => {
  const { root, rows } = fixture()

  bind(root)
  Object.defineProperty(root, 'clientHeight', { configurable: true, value: 160 })
  window.dispatchEvent(new Event('resize'))
  expect(rows.filter(row => !row.hidden)).toHaveLength(4)
  root.dataset.uiItemSize = '80'
  await flush()
  expect(rows.filter(row => !row.hidden)).toHaveLength(2)
  root.dataset.uiItemSize = '0'
  root.dataset.uiOverscan = '-5'
  await flush()
  expect(rows[0]?.style.blockSize).toBe('44px')
  expect(root.dataset.uiRangeEnd).toBe('7')
})

test('disconnects observers and restores original hidden state and row styles', async () => {
  const { root, rows } = fixture()
  const first = rows[0]
  const second = rows[1]

  if (!first || !second) throw new Error('Expected rows')

  first.hidden = true
  second.style.blockSize = '50px'
  second.style.boxSizing = 'content-box'
  const controller = bind(root)

  expect(first.hidden).toBe(true)
  expect(root.dataset.uiRangeEnd).toBe('1')
  controller.destroy()
  expect(root.children).toHaveLength(20)
  expect(first.hidden).toBe(true)
  expect(second.style.blockSize).toBe('50px')
  expect(second.style.boxSizing).toBe('content-box')
  expect(rows.at(-1)?.hidden).toBe(false)
  root.dataset.uiItemSize = '80'
  await flush()
  expect(second.style.blockSize).toBe('50px')
  expect(root.dataset.uiRangeStart).toBeUndefined()
})

test('windows rows created in a different document', () => {
  const frame = document.createElement('iframe')

  document.body.append(frame)
  const frameDocument = frame.contentDocument

  if (!frameDocument) throw new Error('Expected iframe document')

  const root = frameDocument.createElement('div')

  root.dataset.uiItemSize = '40'
  root.dataset.uiOverscan = '0'
  Object.defineProperty(root, 'clientHeight', { configurable: true, value: 80 })
  const rows = Array.from({ length: 20 }, () => frameDocument.createElement('div'))

  root.append(...rows)
  frameDocument.body.append(root)
  bind(root)
  expect(rows.filter(row => !row.hidden)).toHaveLength(2)
  root.scrollTop = 720
  root.dispatchEvent(new Event('scroll'))
  expect(rows[0]?.hidden).toBe(true)
  expect(rows.at(-1)?.hidden).toBe(false)
})

test('windows parent-created rows adopted into another document', () => {
  const frame = document.createElement('iframe')

  document.body.append(frame)
  const frameDocument = frame.contentDocument

  if (!frameDocument) throw new Error('Expected iframe document')

  const { root, rows } = fixture()

  frameDocument.body.append(root)
  bind(root)
  expect(rows.filter(row => !row.hidden)).toHaveLength(2)
})
