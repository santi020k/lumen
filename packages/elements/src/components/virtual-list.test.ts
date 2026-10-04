// @vitest-environment jsdom
import { afterEach, expect, test } from 'vitest'

import { defineLumenElements } from '../define.js'

import { defineLumenVirtualList, LumenVirtualListElement } from './virtual-list.js'

const requireElement = <T extends Element>(element: T | null | undefined): T => {
  if (!element) throw new Error('Expected virtual-list element')

  return element
}

afterEach(() => {
  document.body.replaceChildren()
})

test('granular registration windows rows, restores state, and reconnects without duplicate spacers', () => {
  defineLumenVirtualList()
  defineLumenVirtualList()
  expect(customElements.get('lumen-virtual-list')).toBe(LumenVirtualListElement)
  const list = document.createElement('lumen-virtual-list')
  const rows = Array.from({ length: 8 }, () => document.createElement('button'))

  list.setAttribute('item-size', '40')
  list.setAttribute('overscan', '0')
  list.setAttribute('glass', 'subtle')
  Object.defineProperty(list, 'clientHeight', { value: 80 })
  list.append(...rows)
  document.body.append(list)
  expect(list.classList.contains('ui-glass-subtle')).toBe(true)
  expect(requireElement(rows.at(-1)).hidden).toBe(true)
  list.scrollTop = 240
  list.dispatchEvent(new Event('scroll'))
  expect(list.dataset.uiRangeStart).toBe('6')
  expect(requireElement(rows.at(-1)).hidden).toBe(false)
  list.remove()
  expect(list.querySelectorAll('[data-ui-virtual-list-spacer]')).toHaveLength(0)
  expect(rows.every(row => !row.hidden)).toBe(true)
  document.body.append(list)
  expect(list.querySelectorAll('[data-ui-virtual-list-spacer]')).toHaveLength(2)
})

test('granular and complete registration share constructors and preserve prior registrations', () => {
  const constructors = new Map<string, CustomElementConstructor>()
  const registry = {
    define: (name: string, constructor: CustomElementConstructor) => {
      constructors.set(name, constructor)
    },
    get: (name: string) => constructors.get(name)
  }

  defineLumenVirtualList(registry)
  defineLumenElements(['VirtualList'], registry)
  expect([...constructors.keys()]).toEqual(['lumen-virtual-list'])
  expect(registry.get('lumen-virtual-list')).toBe(LumenVirtualListElement)
})
