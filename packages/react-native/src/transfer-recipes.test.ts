import { expect, test } from 'vitest'

import { isLumenTransferItemsValid, isLumenTransferValueValid, type LumenTransferItem, lumenTransferLists, type LumenTransferValue, moveLumenTransferItems, toggleLumenTransferItem } from './transfer-recipes.js'
const items: readonly LumenTransferItem[] = [
  { id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta', disabled: true }, { id: 'c', label: 'Gamma' }
]
const value: LumenTransferValue = {
  selectedIds: Object.freeze(['missing', 'c']), checkedIds: Object.freeze(['unknown-check', 'b', 'a', 'c'])
}
test('moves only checked enabled source IDs and preserves unknown and disabled state', () => {
  expect(lumenTransferLists(items, value)?.source.map(item => item.id)).toEqual(['a', 'b'])
  const next = moveLumenTransferItems(items, value, 'target')
  expect(next).toEqual({ selectedIds: ['missing', 'c', 'a'], checkedIds: ['unknown-check', 'b', 'c'] })
  expect(value.selectedIds).toEqual(['missing', 'c'])
  expect(value.checkedIds).toEqual(['unknown-check', 'b', 'a', 'c'])
  if (!next) throw new Error('Missing transfer')
  expect(moveLumenTransferItems(items, next, 'source')).toEqual({ selectedIds: ['missing', 'a'], checkedIds: ['unknown-check', 'b'] })
})
test('staging is controlled, preserves membership and unknown checks, and rejects noops', () => {
  const next = toggleLumenTransferItem(items, value, 'a', false)
  expect(next).toEqual({ selectedIds: ['missing', 'c'], checkedIds: ['unknown-check', 'b', 'c'] })
  expect(toggleLumenTransferItem(items, value, 'b', false)).toBeNull()
  expect(toggleLumenTransferItem(items, value, 'unknown-check', false)).toBeNull()
  expect(toggleLumenTransferItem(items, value, 'a', true)).toBeNull()
  expect(moveLumenTransferItems([], value, 'target')).toBeNull()
  expect(lumenTransferLists([], value)).toEqual({ source: [], target: [] })
})
test('duplicates and blank stable IDs fail closed; adversarial IDs use linear scans', () => {
  for (const input of [[...items, items[0] ?? { id: 'a', label: 'Alpha' }], [{ id: ' ', label: 'Blank' }]]) {
    expect(isLumenTransferItemsValid(input)).toBe(false)
    expect(lumenTransferLists(input, value)).toBeNull()
    expect(moveLumenTransferItems(input, value, 'source')).toBeNull()
  }
  for (const input of [{ selectedIds: ['a', 'a'], checkedIds: [] }, { selectedIds: [], checkedIds: [' ', 'a'] }]) {
    expect(isLumenTransferValueValid(input)).toBe(false)
    expect(toggleLumenTransferItem(items, input, 'a', true)).toBeNull()
  }
  expect(isLumenTransferItemsValid([{ id: 'x'.repeat(100000), label: 'Long ID' }])).toBe(true)
})
