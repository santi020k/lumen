import { expect, test } from 'vitest'

import { LumenTreeSelectModel } from './tree-select-recipes.js'

test('all hierarchical rows are shown and both parents and leaves can be selected', () => {
  const model = new LumenTreeSelectModel([
    { id: 'root', label: 'Root' }, { id: 'leaf', label: 'Leaf', parentId: 'root' }
  ])

  expect(model.rows.map(row => [row.node.id, row.depth])).toEqual([['root', 0], ['leaf', 1]])
  expect(model.selecting('root', 'missing')).toBe('root')
  expect(model.selecting('leaf', null)).toBe('leaf')
  expect(model.selectionLabel('missing', 'Choose', 'Unknown')).toBe('Unknown')
  expect(model.selectionLabel(null, 'Choose', 'Unknown')).toBe('Choose')
})

test('disabled ancestry, excluded nodes and unknown IDs retain the host value', () => {
  const model = new LumenTreeSelectModel([
    { id: 'root', label: 'Root', disabled: true },
    { id: 'leaf', label: 'Leaf', parentId: 'root' },
    { id: 'group', label: 'Group', selectable: false }
  ])

  for (const id of ['root', 'leaf', 'group', 'missing']) expect(model.selecting(id, 'host-only')).toBe('host-only')
  expect(model.selectionLabel('leaf', 'Choose', 'Unknown')).toBe('Leaf')
})

test('invalid graphs hide options and cannot rewrite an unknown controlled selection', () => {
  for (const nodes of [
    [{ id: ' ', label: '' }],
    [{ id: 'a', label: '' }, { id: 'a', label: '' }],
    [{ id: 'a', label: '', parentId: 'missing' }],
    [{ id: 'a', label: '', parentId: 'b' }, { id: 'b', label: '', parentId: 'a' }]
  ]) {
    const model = new LumenTreeSelectModel(nodes)

    expect(model.valid).toBe(false)
    expect(model.rows).toEqual([])
    expect(model.selecting('a', 'unknown')).toBe('unknown')
  }
})

test('deep hierarchy traversal stays iterative', () => {
  const nodes = Array.from({ length: 10000 }, (_, index) => ({
    id: String(index), label: String(index), parentId: index === 0 ? null : String(index - 1)
  }))
  const model = new LumenTreeSelectModel(nodes)

  expect(model.rows).toHaveLength(10000)
  expect(model.rows.at(-1)?.depth).toBe(9999)
})
