import { describe, expect, test } from 'vitest'

import { getLumenTableCell, type LumenTableColumn, type LumenTableRow, type LumenTableSortValue,
  nextLumenTableSort, sortLumenTableRows, toggleLumenTableRow, toggleLumenTableVisibleRows, validateLumenTable } from './table-recipes.js'

const columns: readonly LumenTableColumn[] = [{ key: 'amount', label: 'Amount', sortable: true }]
const row = (id: string, value: LumenTableSortValue): LumenTableRow => ({ id,
  label: id,
  cells: { amount: { text: String(value), sortValue: value } } })

describe('native table models', () => {
  test('manual sorting retains server order and client sorting is stable with missing values last', () => {
    const rows = [row('large', 20), row('small', 2), row('equal', 2), row('missing', null), row('nan', Number.NaN)]
    expect(sortLumenTableRows(rows, columns, { key: 'amount', direction: 'ascending' }, 'manual')).toBe(rows)
    expect(sortLumenTableRows(rows, columns, { key: 'amount', direction: 'ascending' }, 'client').map(item => item.id))
      .toEqual(['small', 'equal', 'large', 'missing', 'nan'])
    expect(sortLumenTableRows(rows, columns, { key: 'amount', direction: 'descending' }, 'client').map(item => item.id))
      .toEqual(['large', 'small', 'equal', 'missing', 'nan'])
    expect(rows.map(item => item.id)).toEqual(['large', 'small', 'equal', 'missing', 'nan'])
    expect(sortLumenTableRows(rows, columns, { key: 'unknown', direction: 'ascending' }, 'client')).toBe(rows)
    expect(sortLumenTableRows(rows, [{ key: 'amount', label: 'Amount' }], { key: 'amount', direction: 'ascending' }, 'client')).toBe(rows)
  })
  test('cycles ascending, descending and unsorted and resets new columns', () => {
    expect(nextLumenTableSort(null, 'amount')).toEqual({ key: 'amount', direction: 'ascending' })
    expect(nextLumenTableSort({ key: 'amount', direction: 'ascending' }, 'amount'))
      .toEqual({ key: 'amount', direction: 'descending' })
    expect(nextLumenTableSort({ key: 'amount', direction: 'descending' }, 'amount')).toBeNull()
    expect(nextLumenTableSort({ key: 'other', direction: 'descending' }, 'amount'))
      .toEqual({ key: 'amount', direction: 'ascending' })
  })
  test('selection preserves hidden IDs, rejects disabled rows and toggles only available visible rows', () => {
    const selection = new Set(['hidden', 'locked'])
    const rows = [row('one', 1), { ...row('locked', 2), disabled: true }]
    expect(toggleLumenTableVisibleRows(selection, rows)).toEqual(new Set(['hidden', 'locked', 'one']))
    expect(toggleLumenTableVisibleRows(new Set(['hidden', 'locked', 'one']), rows)).toEqual(selection)
    expect(toggleLumenTableRow(selection, rows[1] ?? row('fallback', 0))).toEqual(selection)
    expect(toggleLumenTableVisibleRows(selection, [])).toEqual(selection)
    expect(selection).toEqual(new Set(['hidden', 'locked']))
  })
  test('rejects duplicate identities and inherited cells without truncating source rows', () => {
    expect(validateLumenTable(columns, [row('same', 1), row('same', 2)])).toBe(false)
    expect(validateLumenTable([...columns, ...columns], [row('one', 1)])).toBe(false)
    expect(validateLumenTable(columns, [row('', 1)])).toBe(false)
    expect(validateLumenTable([], [])).toBe(true)
    expect(getLumenTableCell({ id: 'one', label: 'One', cells: {} }, 'toString')).toBeUndefined()
  })
  test('mixed values have transitive type ordering and invalid locales fall back safely', () => {
    const rows = [row('text', '2'), row('ten', 10), row('three', 3), row('false', false), row('true', true)]
    expect(sortLumenTableRows(rows, columns, { key: 'amount', direction: 'ascending' }, 'client', 'invalid_locale')
      .map(item => item.id)).toEqual(['three', 'ten', 'false', 'true', 'text'])
  })
})

test('rejects decoded table collections, identities and nested cells before rendering', () => {
  const validRow = row('a', 1)
  const malformed: unknown[] = [null,
    42,
    [],
    {},
    { ...validRow, id: 1 },
    { ...validRow, label: null },
    { ...validRow, cells: null },
    { ...validRow, cells: [] },
    { ...validRow, cells: { amount: null } },
    { ...validRow, cells: { amount: { text: 42 } } },
    { ...validRow, cells: { amount: { text: '', sortValue: {} } } }]

  for (const input of [...malformed.map(item => [item]), null, {}, 'rows', new Array<unknown>(1)]) {
    expect(Reflect.apply(validateLumenTable, undefined, [columns, input])).toBe(false)
  }
  for (const input of [null,
    {},
    'columns',
    [null],
    [42],
    [{ key: 42, label: '' }],
    [{ key: 'a', label: null }],
    [{ key: 'a', label: '', sortable: 'false' }],
    new Array<unknown>(1)]) {
    expect(Reflect.apply(validateLumenTable, undefined, [input, [validRow]])).toBe(false)
  }
})
