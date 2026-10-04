// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'

import { createLumenVirtualCollectionController } from './virtual-collection.js'
import { getLumenVirtualWindow } from './virtual-window.js'

afterEach(() => {
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

const createList = () => {
  const root = document.createElement('div')

  root.dataset.uiVirtualList = ''
  root.tabIndex = 0
  Object.defineProperty(root, 'clientHeight', { configurable: true, value: 80 })
  document.body.append(root)

  return root
}
const records = (count: number) => Array.from({ length: count }, (_, id) => ({ id, label: `Row ${id}` }))

test('iframe collections pin focused rows, reuse realm-owned controls, and restore removed focus to the root', () => {
  const frame = document.createElement('iframe')
  document.body.append(frame)
  const frameDocument = frame.contentDocument
  if (!frameDocument) throw new Error('Missing iframe document')
  const root = frameDocument.createElement('div')
  root.dataset.uiVirtualList = ''
  root.tabIndex = 0
  Object.defineProperty(root, 'clientHeight', { configurable: true, value: 80 })
  frameDocument.body.append(root)
  const items = records(10)
  const previousControls: HTMLElement[] = []
  const controller = createLumenVirtualCollectionController(root, {
    items,
    getKey: item => item.id,
    itemSize: 40,
    overscan: 0,
    renderItem: (item, _index, previous) => {
      if (previous) previousControls.push(previous)
      const button = previous ?? frameDocument.createElement('button')
      button.textContent = item.label
      return button
    }
  })
  const button = root.querySelector('button')
  if (!button) throw new Error('Missing iframe control')
  button.focus()
  root.scrollTop = 320
  root.dispatchEvent(new Event('scroll'))
  expect(frameDocument.activeElement).toBe(button)
  expect(root.querySelector('[data-ui-virtual-list-index="0"]')).not.toBeNull()
  controller.update([...items].reverse())
  expect(previousControls).toContain(button)
  expect(frameDocument.activeElement).toBe(button)
  controller.update(items.slice(1))
  expect(frameDocument.activeElement).toBe(root)
  controller.destroy()
  frame.remove()
})

test('mounts a bounded window for 20,000 records and preserves total scroll geometry', () => {
  const root = createList()
  const renderItem = vi.fn((item: { id: number, label: string }) => {
    const button = document.createElement('button')

    button.textContent = item.label

    return button
  })
  const controller = createLumenVirtualCollectionController(root, {
    items: records(20_000), getKey: item => item.id, renderItem, itemSize: 40, overscan: 0
  })

  expect(root.querySelectorAll('button')).toHaveLength(2)
  expect(renderItem).toHaveBeenCalledTimes(2)
  expect(root.firstElementChild?.getAttribute('style')).toContain('800000px')
  root.scrollTop = 799_920
  root.dispatchEvent(new Event('scroll'))
  expect(root.querySelectorAll('button')).toHaveLength(2)
  expect(root.textContent).toBe('Row 19998Row 19999')
  expect(renderItem).toHaveBeenCalledTimes(4)
  controller.destroy()
  expect(root.children).toHaveLength(0)
  expect(root.dataset.uiRangeStart).toBeUndefined()
})

test('pins focus and its Tab neighbors across a distant scroll without mounting the intervening rows', () => {
  const root = createList()
  const controller = createLumenVirtualCollectionController(root, {
    items: records(1000),
    getKey: item => item.id,
    itemSize: 40,
    overscan: 0,
    renderItem: item => {
      const button = document.createElement('button')
      button.textContent = item.label
      return button
    }
  })
  const button = root.querySelector('button')

  button?.focus()
  root.scrollTop = 39_920
  root.dispatchEvent(new Event('scroll'))
  expect(document.activeElement).toBe(button)
  expect(root.querySelectorAll('button')).toHaveLength(4)
  expect(root.querySelector('[data-ui-virtual-list-index="1"]')).not.toBeNull()
  controller.destroy()
})

test('updates keyed content and clamps the window after the collection shrinks to empty', () => {
  const root = createList()
  const controller = createLumenVirtualCollectionController(root, {
    items: records(50),
    getKey: item => item.id,
    itemSize: 40,
    overscan: 0,
    renderItem: (item, _index, previous) => {
      const button = previous ?? document.createElement('button')
      button.textContent = item.label
      return button
    }
  })
  const first = root.querySelector('button')

  controller.update([{ id: 0, label: 'Updated' }, { id: 1, label: 'Second' }])
  expect(root.querySelector('button')).toBe(first)
  expect(root.textContent).toBe('UpdatedSecond')
  controller.update([])
  expect(root.dataset.uiRangeEnd).toBe('-1')
  expect(root.querySelectorAll('button')).toHaveLength(0)
  expect(root.scrollTop).toBe(0)
  controller.destroy()
  controller.update(records(5))
  expect(root.children).toHaveLength(0)
})

test('retains focused keyed content and refreshes its index when reordered', () => {
  const root = createList()
  const items = records(100)
  const controller = createLumenVirtualCollectionController(root, {
    items,
    getKey: item => item.id,
    renderItem: (item, index, previous) => {
      const button = previous ?? document.createElement('button')

      button.textContent = `${item.label} at ${index}`
      return button
    }
  })
  const focused = root.querySelector('button')

  focused?.focus()
  controller.update([...items.slice(1), ...items.slice(0, 1)])
  expect(document.activeElement).toBe(focused)
  expect(focused?.textContent).toBe('Row 0 at 99')
  expect(root.querySelectorAll('button').length).toBeLessThan(12)
  controller.update([])
  expect(document.activeElement).toBe(root)
  controller.destroy()
})

test('rejects duplicate keys before replacing an existing collection', () => {
  const root = createList()
  const controller = createLumenVirtualCollectionController(root, {
    items: records(2),
    getKey: item => item.id,
    renderItem: item => {
      const span = document.createElement('span')
      span.textContent = item.label
      return span
    }
  })
  const original = root.textContent

  expect(() => {
    controller.update([{ id: 1, label: 'First' }, { id: 1, label: 'Duplicate' }])
  }).toThrow('unique')
  expect(root.textContent).toBe(original)
  controller.destroy()
})

test('normalizes malformed geometry and keeps only a small disjoint focus window', () => {
  expect(getLumenVirtualWindow(-1, Number.NaN, -3, -1, Number.NaN)).toEqual({
    startIndex: 0, endIndex: -1, indexes: [], itemSize: 44, totalSize: 0
  })
  const window = getLumenVirtualWindow(400_000, 80, 20_000, 40, 0, 0)

  expect(window.indexes).toEqual([0, 1, 10_000, 10_001])
  expect(window.totalSize).toBe(800_000)
})
