import { describe, expect, test } from 'vitest'

import { LumenCascaderModel } from './cascader-recipes.js'

const nodes = [{ id: 'root', label: 'Root' },
  { id: 'leaf', parentId: 'root', label: 'Leaf' },
  { id: 'no', label: 'Unselectable', selectable: false },
  { id: 'locked', label: 'Locked', disabled: true },
  { id: 'child', parentId: 'locked', label: 'Child' }]

describe('controlled cascader paths', () => {
  test('branches navigate; only selectable enabled leaves commit a canonical path', () => {
    const model = new LumenCascaderModel(nodes)
    const current = ['unknown']

    for (const id of ['root', 'no', 'locked', 'child', 'missing']) {
      expect(model.canSelect(id)).toBe(false)
      expect(model.selecting(id, current)).toBe(current)
    }

    expect(model.selecting('leaf', current)).toEqual(['root', 'leaf'])
    expect(current).toEqual(['unknown'])
  })
  test('checks full ancestry and retains unknown, reordered and partial host paths', () => {
    const model = new LumenCascaderModel(nodes)

    expect(model.isPathValid(['root', 'leaf'])).toBe(true)
    expect(model.isPathValid([])).toBe(true)

    for (const path of [['leaf'], ['root', 'missing'], ['leaf', 'root']]) expect(model.isPathValid(path)).toBe(false)
  })
  test('invalid graphs fail closed', () => {
    const model = new LumenCascaderModel([{ id: 'a', label: '', parentId: 'a' }])

    expect(model.canSelect('a')).toBe(false)
    expect(model.isPathValid(['a'])).toBe(false)
    expect(model.selecting('a', ['host'])).toEqual(['host'])
  })
})
