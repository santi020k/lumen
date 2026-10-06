import { expect, test } from 'vitest'

import { getLumenTableCell, type LumenTableCell } from './table-recipes.js'
import { LumenTreeGridModel, type LumenTreeGridRecord } from './tree-grid-recipes.js'

const columns = [{ key: 'status', label: 'Status' }]
const records: readonly LumenTreeGridRecord[] = [
  { node: { id: 'root', label: 'Packages' }, cells: { status: { text: 'Group' } } },
  { node: { id: 'child', parentId: 'root', label: 'Astro' }, cells: { status: { text: 'Ready' } } },
  { node: { id: 'locked', label: 'Locked', disabled: true }, cells: {} },
  { node: { id: 'locked-child', parentId: 'locked', label: 'Locked child' }, cells: {} },
  { node: { id: 'locked-leaf', parentId: 'locked-child', label: 'Locked leaf' }, cells: {} }
]

test('visible hierarchical records retain cells, sibling order and full levels', () => {
  const model = new LumenTreeGridModel(columns, records)

  expect(model.valid).toBe(true)
  expect(model.visibleRows(new Set()).map(row => row.tree.node.id)).toEqual(['root', 'locked'])
  const rows = model.visibleRows(new Set(['root']))

  expect(rows.map(row => row.tree.node.id)).toEqual(['root', 'child', 'locked'])
  expect(rows[1]?.tree.depth).toBe(1)
  expect(rows[1]?.record.cells.status?.text).toBe('Ready')
})

test('collapse retains hidden descendant and unknown IDs; disabled ancestry prevents expansion changes', () => {
  const model = new LumenTreeGridModel(columns, records)
  const expanded = new Set(['root', 'child', 'unknown', 'locked', 'locked-child'])

  expect(model.togglingExpansion('root', expanded)).toEqual(new Set(['child', 'unknown', 'locked', 'locked-child']))
  expect(expanded.has('root')).toBe(true)
  expect(model.togglingExpansion('locked-child', expanded)).toEqual(expanded)
  expect(model.visibleRows(expanded).find(row => row.tree.node.id === 'locked-child')?.tree.disabled).toBe(true)
  expect(model.togglingExpansion('unknown', expanded)).toEqual(expanded)
})

test('invalid columns, duplicate or blank IDs and malformed graphs hide all records', () => {
  for (const badColumns of [[], [columns[0], columns[0]].filter(column => column !== undefined), [{ key: ' ', label: 'Status' }], [{ key: 'status', label: ' ' }]]) {
    expect(new LumenTreeGridModel(badColumns, records).valid).toBe(false)
  }
  for (const badRecords of [
    [records[0], records[0]].filter(record => record !== undefined),
    [{ node: { id: ' ', label: 'Blank' }, cells: {} }],
    [{ node: { id: 'cycle', label: 'Cycle', parentId: 'cycle' }, cells: {} }],
    [{ node: { id: 'orphan', label: 'Orphan', parentId: 'missing' }, cells: {} }]
  ]) {
    const model = new LumenTreeGridModel(columns, badRecords)

    if (!(model instanceof LumenTreeGridModel)) throw new Error('Unexpected model')

    expect(model.valid).toBe(false)
    expect(model.visibleRows(new Set(['cycle']))).toEqual([])
    expect(model.togglingExpansion('cycle', new Set(['unknown']))).toEqual(new Set(['unknown']))
  }
})

test('own prototype-named cells work; inherited cells do not become displayed values', () => {
  class Cells {
    [key: string]: LumenTableCell
    status = { text: 'Ready' }
  }
  const cellRecord = { id: 'cell', label: 'Cell', cells: new Cells() }

  expect(getLumenTableCell(cellRecord, 'toString')).toBeUndefined()
  const ownRecord = { node: { id: 'own', label: 'Own' }, cells: { constructor: { text: 'Owned' } } }

  expect(new LumenTreeGridModel([{ key: 'constructor', label: 'Constructor' }], [ownRecord]).valid).toBe(true)
  expect(getLumenTableCell({ ...ownRecord.node, cells: ownRecord.cells }, 'constructor')?.text).toBe('Owned')
})

test('untrusted runtime cell text is rejected before rendering', () => {
  const model: unknown = Reflect.construct(LumenTreeGridModel, [columns, [
    { node: { id: 'bad', label: 'Bad' }, cells: { status: { text: 42 } } }
  ]])

  expect(model).toBeInstanceOf(LumenTreeGridModel)
  if (!(model instanceof LumenTreeGridModel)) throw new Error('Missing model')
  expect(model.valid).toBe(false)
})

test('deep records use the iterative graph and keep uncapped semantic depth', () => {
  const deep = Array.from({ length: 1000 }, (_, index) => ({
    node: { id: String(index), label: `Record ${index}`, parentId: index === 0 ? null : String(index - 1) }, cells: {}
  }))
  const model = new LumenTreeGridModel(columns, deep)

  expect(model.visibleRows(new Set(deep.map(record => record.node.id))).at(-1)?.tree.depth).toBe(999)
})

test('rejects malformed decoded grid records before extracting nested tree nodes', () => {
  for (const records of [null,
    {},
    'records',
    [null],
    [42],
    [{}],
    [{ node: null, cells: {} }],
    [{ node: { id: 42, label: 'Node' }, cells: {} }],
    new Array<unknown>(1)]) {
    const model: unknown = Reflect.construct(LumenTreeGridModel, [columns, records])

    if (!(model instanceof LumenTreeGridModel)) throw new Error('Unexpected model')

    expect(model.valid).toBe(false)
    expect(model.visibleRows(new Set())).toEqual([])
  }
  for (const columns of [null, {}, [null], [42], [{ key: null, label: 'Column' }], new Array<unknown>(1)]) {
    const model: unknown = Reflect.construct(LumenTreeGridModel, [columns, records])

    if (!(model instanceof LumenTreeGridModel)) throw new Error('Unexpected model')

    expect(model.valid).toBe(false)
  }
})
