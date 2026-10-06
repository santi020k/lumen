import { expect, test } from 'vitest'

import { type LumenKanbanColumnData, LumenKanbanModel } from './kanban-recipes.js'

const columns: readonly LumenKanbanColumnData[] = [
  { id: 'todo', label: 'To do', cards: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], capacity: 2 },
  { id: 'done', label: 'Done', cards: [], capacity: 1 }
]

test('moves and reorders stable identities without mutating the host', () => {
  const model = new LumenKanbanModel(columns)

  expect(model.moving('a', 'todo', 1)?.[0]?.cards.map(card => card.id)).toEqual(['b', 'a'])
  expect(model.moving('b', 'done', 0)?.map(column => column.cards.map(card => card.id))).toEqual([['a'], ['b']])
  expect(columns[0]?.cards.map(card => card.id)).toEqual(['a', 'b'])
  expect(model.moving('a', 'todo', 0)).toBeNull()
  expect(model.moving('a', 'done', 1)).toBeNull()
  expect(model.moving('missing', 'done', 0)).toBeNull()
  expect(model.moving('a', 'done', 0.5)).toBeNull()
})

test('invalid identities, capacity and disabled records reject updates', () => {
  for (const data of [
    [{ id: '', label: '', cards: [] }],
    [...columns, columns[0]].filter((column): column is LumenKanbanColumnData => column !== undefined),
    [{ id: 'x', label: '', cards: [{ id: 'a', label: '' }, { id: 'a', label: '' }] }],
    [{ id: 'x', label: '', cards: [], capacity: -1 }]
  ]) expect(new LumenKanbanModel(data).valid).toBe(false)
  expect(new LumenKanbanModel(columns.map(column => ({ ...column, disabled: true }))).moving('a', 'done', 0)).toBeNull()
  expect(new LumenKanbanModel(columns.map(column => ({ ...column, capacity: column.cards.length }))).moving('a', 'done', 0)).toBeNull()
})

test('disabled cards and full targets block moves while full source reorders', () => {
  const model = new LumenKanbanModel([
    { id: 'a', label: '', cards: [{ id: 'one', label: '' }, { id: 'two', label: '', disabled: true }], capacity: 2 },
    { id: 'b', label: '', cards: [], capacity: 0 }
  ])

  expect(model.valid).toBe(true)
  expect(model.moving('one', 'b', 0)).toBeNull()
  expect(model.moving('two', 'a', 0)).toBeNull()
  expect(model.moving('one', 'a', 1)?.[0]?.cards.map(card => card.id)).toEqual(['two', 'one'])
  expect(model.moving('one', 'unknown', 0)).toBeNull()
})

test('rejects decoded columns and cards before constructing or moving', () => {
  const malformed: unknown[] = [null,
    42,
    [],
    {},
    { id: 42, label: '', cards: [] },
    { id: 'a', label: null, cards: [] },
    { id: 'a', label: '', cards: null },
    { id: 'a', label: '', cards: [], capacity: '1' },
    ...[null,
      42,
      [],
      {},
      { id: null, label: '' },
      { id: 'c', label: 42 },
      { id: 'c', label: '', disabled: 'false' }].map(card => ({ id: 'a', label: '', cards: [card] }))]

  for (const input of [...malformed.map(column => [column]), null, {}, 'columns', new Array<unknown>(1)]) {
    const model: unknown = Reflect.construct(LumenKanbanModel, [input])

    if (!(model instanceof LumenKanbanModel)) throw new Error('Unexpected model')

    expect(model.valid).toBe(false)
    expect(model.moving('a', 'b', 0)).toBeNull()
  }
})
