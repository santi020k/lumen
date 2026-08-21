import { describe, expect, test } from 'vitest'

import {
  createLumenKanbanMoveDetail,
  getAdjacentKanbanColumn
} from './kanban.js'

describe('kanban contracts', () => {
  test('normalizes a controlled move request', () => {
    expect(createLumenKanbanMoveDetail({
      beforeId: ' next ',
      fromColumn: ' inbox ',
      input: 'keyboard',
      itemId: ' item-1 ',
      toColumn: ' planned '
    })).toEqual({
      beforeId: 'next',
      fromColumn: 'inbox',
      input: 'keyboard',
      itemId: 'item-1',
      toColumn: 'planned'
    })
  })

  test('rejects incomplete move requests', () => {
    expect(createLumenKanbanMoveDetail({
      fromColumn: 'inbox',
      input: 'pointer',
      itemId: '',
      toColumn: 'planned'
    })).toBeNull()
  })

  test('resolves adjacent columns in both writing directions', () => {
    const columns = ['inbox', 'planned', 'released']

    expect(getAdjacentKanbanColumn(columns, 'planned', 1)).toBe('released')
    expect(getAdjacentKanbanColumn(columns, 'planned', 1, true)).toBe('inbox')
    expect(getAdjacentKanbanColumn(columns, 'released', 1)).toBeUndefined()
  })
})
