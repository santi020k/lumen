import { describe, expect, test } from 'vitest'

import { createLumenComparisonGeometry, type LumenComparisonDatum } from './comparison-chart.js'

describe('comparison chart geometry', () => {
  test.each([null, undefined, {}, 'data', 42])('rejects non-array comparisons %s', data => {
    const result: unknown = Reflect.apply(createLumenComparisonGeometry, undefined, [data])

    expect(result).toMatchObject({ valid: false, rows: [], domain: { min: 0, max: 1 } })
  })
  test.each([null, 0, 1])('rejects sparse comparisons with populated index %s', populatedIndex => {
    const data = Array<LumenComparisonDatum>(2)

    if (populatedIndex !== null) data[populatedIndex] = { id: 'a', label: 'A', value: 0 }

    expect(createLumenComparisonGeometry(data)).toMatchObject({ valid: false, rows: [] })
    expect(data).toHaveLength(2)
  })
  test('preserves row order and uses one scale for increasing and decreasing pairs', () => {
    const data = [{ id: 'a', label: 'A', reference: 20, value: 80 }, { id: 'b', label: 'B', reference: 90, value: 30 }]
    const model = createLumenComparisonGeometry(data, { paired: true, domain: { min: 0, max: 100 } })
    expect(model.valid).toBe(true)
    expect(model.rows.map(row => [row.id, row.start, row.width])).toEqual([['a', 0.2, 0.6000000000000001], ['b', 0.3, 0.6000000000000001]])
    expect(data[0]?.reference).toBe(20)
  })

  test('draws rankings from zero and preserves missing and zero values', () => {
    const model = createLumenComparisonGeometry([{ id: 'a', label: 'A', value: -10 }, { id: 'b', label: 'B', value: 0 }, { id: 'c', label: 'C', value: null }])
    expect(model.domain).toEqual({ min: -10, max: 0 })
    expect(model.rows.map(row => row.valuePosition)).toEqual([0, 1, null])
    const paired = createLumenComparisonGeometry([{ id: 'a', label: 'A', value: 0 }], { paired: true })
    expect(paired.rows[0]?.referencePosition).toBeNull()
    expect(paired.rows[0]?.width).toBe(0)
  })

  test('rejects duplicate identities, invalid values and truncated domains', () => {
    const row = { id: 'a', label: 'A', value: 10 }
    expect(createLumenComparisonGeometry([row, row]).valid).toBe(false)
    expect(createLumenComparisonGeometry([{ ...row, value: Infinity }]).valid).toBe(false)
    expect(createLumenComparisonGeometry([{ ...row, label: ' ' }]).valid).toBe(false)
    expect(createLumenComparisonGeometry([row], { domain: { min: 2, max: 10 } }).valid).toBe(false)
    expect(createLumenComparisonGeometry([{ ...row, reference: NaN }], { paired: true }).valid).toBe(false)
  })

  test('keeps empty and extreme finite datasets safe', () => {
    expect(createLumenComparisonGeometry([]).rows).toEqual([])
    const model = createLumenComparisonGeometry([{ id: 'x', label: 'X', reference: -Number.MAX_VALUE, value: Number.MAX_VALUE }], { paired: true })
    expect(model.valid).toBe(true)
    expect(model.rows[0]?.width).toBe(1)
    expect(model.ticks.every(Number.isFinite)).toBe(true)
  })
})
