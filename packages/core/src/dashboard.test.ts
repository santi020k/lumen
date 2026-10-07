import { describe, expect, test } from 'vitest'

import { readLumenActiveFilters, readLumenChangeSummaryItems } from './dashboard.js'

describe('dashboard data boundaries', () => {
  test('retains explicit equality and copies caller records', () => {
    const input = [{ id: 'amount', label: 'Amount', before: '0', after: '0.00', changed: false }]
    const items = readLumenChangeSummaryItems(input)

    expect(items).toEqual(input)
    expect(items[0]).not.toBe(input[0])
  })
  test('rejects malformed records and duplicate identities', () => {
    expect(() => readLumenChangeSummaryItems(null)).toThrow(TypeError)
    expect(() => readLumenChangeSummaryItems([{ id: 'x' }])).toThrow(TypeError)
    expect(() => readLumenActiveFilters([{ id: 'x', label: 'Status', value: 'Active' }, { id: 'x', label: 'Owner', value: 'Alice' }])).toThrow(TypeError)
    expect(readLumenActiveFilters([])).toEqual([])
  })
})
