import { expect, test } from 'vitest'

import { matchesDataTableRange } from './data-table-range-model.js'
import { parseDataTableViewState } from './data-table-state.js'

test('numeric ranges retain zero, reject missing/nonfinite data, and respect both inclusive bounds', () => {
  const range = { id: 'amount', from: '0', to: '100' }
  expect(matchesDataTableRange(0, range, 'number')).toBe(true)
  expect(matchesDataTableRange(100, range, 'number')).toBe(true)
  for (const value of [-1, 101, null, undefined, '', Infinity, NaN]) expect(matchesDataTableRange(value, range, 'number')).toBe(false)
  expect(matchesDataTableRange(50, { ...range, from: '100', to: '0' }, 'number')).toBe(false)
  expect(matchesDataTableRange(50, { ...range, from: 'bad' }, 'number')).toBe(false)
})

test('date ranges use valid date-only values, including leap days, without a timezone shift', () => {
  const range = { id: 'date', from: '2024-02-29', to: '2024-03-01' }
  expect(matchesDataTableRange('2024-02-29', range, 'date')).toBe(true)
  expect(matchesDataTableRange('2024-03-01', range, 'date')).toBe(true)
  for (const value of ['2024-02-30', '2023-02-29', '2024-02-28', '2024-03-01T00:00:00Z', '']) expect(matchesDataTableRange(value, range, 'date')).toBe(false)
  expect(matchesDataTableRange('2024-03-01', { ...range, from: 'invalid' }, 'date')).toBe(false)
})

test('saved state parsing rejects malformed input and detaches preferences from record and selection data', () => {
  const source = { search: '', filters: [{ id: 'status', value: 'due', record: 'private-id' }], ranges: [{ id: 'amount', from: '0', to: '', record: 'private-id' }], visibility: { amount: true }, pagination: { pageIndex: 1, pageSize: 25, record: 'private-id' }, sorting: [{ id: 'amount', desc: false, record: 'private-id' }], density: 'compact', selectedIds: ['private-id'], rows: [{ id: 'private-id' }] }
  const parsed = parseDataTableViewState(source)
  const first = source.filters[0]
  if (!first) throw new Error('Missing fixture filter')
  first.value = 'changed'
  source.visibility.amount = false
  expect(parsed.filters).toEqual([{ id: 'status', value: 'due' }])
  expect(parsed.visibility.amount).toBe(true)
  expect(parsed.pagination).toEqual({ pageIndex: 1, pageSize: 25 })
  expect(parsed.ranges).toEqual([{ id: 'amount', from: '0', to: '' }])
  expect(parsed.sorting).toEqual([{ id: 'amount', desc: false }])
  expect(parsed).not.toHaveProperty('rows')
  expect(parsed).not.toHaveProperty('selectedIds')
  const malformed = [
    null, {}, { ...source, ranges: [null] }, { ...source, pagination: { pageIndex: -1, pageSize: 25 } }
  ]
  for (const value of malformed) expect(() => parseDataTableViewState(value)).toThrow()
})
