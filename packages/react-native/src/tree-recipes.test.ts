import { describe, expect, test } from 'vitest'

import { LumenTreeModel, type LumenTreeNode } from './tree-recipes.js'

describe('tree hierarchy', () => {
  test('rejects duplicate, dangling, empty and cyclic identities', () => {
    for (const nodes of [[{ id: '', label: '' }],
      [{ id: 'a', label: '' }, { id: 'a', label: '' }],
      [{ id: 'a', label: '', parentId: 'missing' }],
      [{ id: 'a', label: '', parentId: 'b' }, { id: 'b', label: '', parentId: 'a' }]]) {
      const model = new LumenTreeModel(nodes)

      expect(model.valid).toBe(false)
      expect(model.visibleRows(new Set())).toEqual([])
      expect(model.path('a')).toEqual([])
    }
  })
  test('preserves graph order and unknown selected IDs, propagating disabled ancestors', () => {
    const model = new LumenTreeModel([{ id: 'r', label: 'Root' },
      { id: 'c', parentId: 'r', label: 'Child' },
      { id: 'd', label: 'Disabled', disabled: true },
      { id: 'x', parentId: 'd', label: 'Blocked' }])

    expect(model.visibleRows(new Set(['r'])).map(row => [row.node.id, row.depth])).toEqual([['r', 0], ['c', 1], ['d', 0]])
    expect(model.path('c').map(node => node.id)).toEqual(['r', 'c'])
    expect([...model.togglingSelection('c', new Set(['missing', 'r']))]).toEqual(['missing', 'r', 'c'])
    expect([...model.togglingSelection('x', new Set(['missing']))]).toEqual(['missing'])
    expect([...model.togglingExpansion('d', new Set())]).toEqual([])
  })
  test('handles adversarial wide and deep graphs without call-stack or argument limits', () => {
    const wide: LumenTreeNode[] = [{ id: 'r', label: 'Root' }]
    const deep: LumenTreeNode[] = []

    for (let index = 0; index < 150000; index += 1) {
      wide.push({ id: `w${index}`, label: '', parentId: 'r' })
      deep.push({ id: String(index), label: '', parentId: index === 0 ? null : String(index - 1) })
    }

    expect(new LumenTreeModel(wide).visibleRows(new Set(['r']))).toHaveLength(150001)
    const model = new LumenTreeModel(deep)

    expect(model.valid).toBe(true)
    expect(model.path('149999')).toHaveLength(150000)
    expect(model.visibleRows(new Set(deep.map(node => node.id)))).toHaveLength(150000)
  })
})
