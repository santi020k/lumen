import { describe, expect, test } from 'vitest'

import { createLumenBoxPlotGeometry, createLumenCalendarHeatmapGeometry, createLumenFunnelGeometry,
  isLumenBoxPlotDatum, isLumenCalendarHeatmapDatum, isLumenFunnelDatum, type LumenBoxPlotDatum,
  type LumenCalendarHeatmapDatum, type LumenFunnelDatum, parseLumenCalendarDate } from './extended-charts.js'

const sparseRows = <T>(row: T, populatedIndex: number | null): T[] => {
  const rows = Array<T>(2)

  if (populatedIndex !== null) rows[populatedIndex] = row

  return rows
}

test.each([null, {}, 'rows', 1, { length: 0 }, new Set()])('extended charts reject non-array decoded collections: %j', data => {
  const calendar: unknown = Reflect.apply(createLumenCalendarHeatmapGeometry, undefined, [data, { startDate: '2024-01-01', endDate: '2024-01-02' }])
  const funnel: unknown = Reflect.apply(createLumenFunnelGeometry, undefined, [data])
  const boxPlot: unknown = Reflect.apply(createLumenBoxPlotGeometry, undefined, [data])

  expect(calendar).toMatchObject({ valid: false, cells: [], weekCount: 0 })
  expect(funnel).toMatchObject({ valid: false, max: 0, rows: [] })
  expect(boxPlot).toMatchObject({ valid: false, rows: [] })
})

describe('calendar heatmap', () => {
  test.each([null, 0, 1])('rejects sparse observations with populated index %s', populatedIndex => {
    const data = sparseRows<LumenCalendarHeatmapDatum>({ date: '2024-01-01', value: 0 }, populatedIndex)
    expect(createLumenCalendarHeatmapGeometry(data, {
      startDate: '2024-01-01', endDate: '2024-01-02'
    })).toMatchObject({ valid: false, cells: [], weekCount: 0 })
    expect(data).toHaveLength(2)
  })
  test('aligns leap days with the selected week start and preserves missing versus zero', () => {
    const data = [{ date: '2024-02-29', value: 0 }, { date: '2024-03-02', value: 3 }]
    const model = createLumenCalendarHeatmapGeometry(data, { startDate: '2024-02-28', endDate: '2024-03-04', weekStartsOn: 1 })
    expect(model.valid).toBe(true)
    expect(model.cells.map(cell => [cell.date, cell.day, cell.week, cell.value])).toEqual([
      ['2024-02-28', 2, 0, null],
      ['2024-02-29', 3, 0, 0],
      ['2024-03-01', 4, 0, null],
      ['2024-03-02', 5, 0, 3],
      ['2024-03-03', 6, 0, null],
      ['2024-03-04', 0, 1, null]
    ])
    expect(model.cells[1]?.ratio).toBe(0)
    expect(model.weekCount).toBe(2)
    expect(data).toEqual([{ date: '2024-02-29', value: 0 }, { date: '2024-03-02', value: 3 }])
  })
  test('rejects impossible dates, timestamp strings, duplicates, and out-of-range observations', () => {
    for (const date of ['2023-02-29', '1900-02-29', '0000-01-01', '2024-04-31', '2024-13-01', '2024-01-01T00:00:00Z', '1'.repeat(100_000)]) {
      expect(parseLumenCalendarDate(date)).toBeNull()
    }
    expect(parseLumenCalendarDate('0001-01-01')).not.toBeNull()
    expect(parseLumenCalendarDate('2000-02-29')).not.toBeNull()
    const options = { startDate: '2024-01-01', endDate: '2024-01-07' }
    for (const data of [[{ date: '2024-01-08', value: 1 }],
      [{ date: '2024-01-01', value: Infinity }],
      [{ date: '2024-01-01', value: 1 }, { date: '2024-01-01', value: 2 }]]) {
      expect(createLumenCalendarHeatmapGeometry(data, options)).toMatchObject({ valid: false, cells: [] })
    }
    expect(isLumenCalendarHeatmapDatum(null)).toBe(false)
  })
  test('bounds work and handles empty ranges without inventing observations', () => {
    expect(createLumenCalendarHeatmapGeometry([], { startDate: '0001-01-01', endDate: '9999-12-31' }).valid).toBe(false)
    expect(createLumenCalendarHeatmapGeometry([], { startDate: '2024-01-02', endDate: '2024-01-01' }).valid).toBe(false)
    const empty = createLumenCalendarHeatmapGeometry([], { startDate: '2024-01-01', endDate: '2024-01-02' })
    expect(empty).toMatchObject({ valid: true, domain: { min: 0, max: 1 } })
    expect(empty.cells.every(cell => cell.value === null && cell.ratio === null)).toBe(true)
    expect(createLumenCalendarHeatmapGeometry([{ date: '2024-01-01', value: 2 }], {
      startDate: '2024-01-01', endDate: '2024-01-02', domain: { min: 0, max: 1 }
    }).valid).toBe(false)
  })
})

describe('funnel chart', () => {
  test.each([null, 0, 1])('rejects sparse stages with populated index %s', populatedIndex => {
    const data = sparseRows<LumenFunnelDatum>({ id: 'a', label: 'A', value: 0 }, populatedIndex)
    expect(createLumenFunnelGeometry(data)).toEqual({ valid: false, rows: [], max: 0 })
    expect(data).toHaveLength(2)
  })
  test('retains stage order, missing values, zero and increases', () => {
    const model = createLumenFunnelGeometry([{ id: 'a', label: 'Visit', value: 10 },
      { id: 'b', label: 'Signup', value: null },
      { id: 'c', label: 'Purchase', value: 20 },
      { id: 'd', label: 'Refund', value: 0 }])
    expect(model.valid).toBe(true)
    expect(model.rows.map(row => [row.id, row.ratio])).toEqual([
      ['a', 0.5], ['b', null], ['c', 1], ['d', 0]
    ])
  })
  test('rejects invalid observations, identities and tones without plotting partial data', () => {
    for (const value of [-1, NaN, Infinity]) {
      expect(createLumenFunnelGeometry([{ id: 'a', label: 'A', value }])).toMatchObject({ valid: false, rows: [] })
    }
    const duplicates = [{ id: 'a', label: 'A', value: 1 }, { id: 'a', label: 'B', value: 2 }]
    expect(createLumenFunnelGeometry(duplicates).valid).toBe(false)
    expect(isLumenFunnelDatum({ id: '', label: 'A', value: 0 })).toBe(false)
    expect(isLumenFunnelDatum({ id: 'a', label: 'A', value: 0, tone: 'invalid' })).toBe(false)
    expect(createLumenFunnelGeometry([{ id: 'a', label: 'A', value: 0 }]).rows[0]?.ratio).toBe(0)
    expect(createLumenFunnelGeometry([])).toMatchObject({ valid: true, rows: [], max: 0 })
  })
})

describe('box plot', () => {
  const row = { id: 'a', label: 'A', min: 1, q1: 2, median: 3, q3: 4, max: 5, outliers: [-2, 8] }
  test.each([null, 0, 1])('rejects sparse summaries with populated index %s', populatedIndex => {
    const data = sparseRows<LumenBoxPlotDatum>(row, populatedIndex)
    expect(createLumenBoxPlotGeometry(data)).toMatchObject({ valid: false, rows: [] })
    expect(data).toHaveLength(2)
  })
  test.each([null, 0, 1])('rejects sparse outliers with populated index %s', populatedIndex => {
    const outliers = sparseRows(-2, populatedIndex)
    const data = { ...row, outliers }
    expect(isLumenBoxPlotDatum(data)).toBe(false)
    expect(createLumenBoxPlotGeometry([data])).toMatchObject({ valid: false, rows: [] })
    expect(outliers).toHaveLength(2)
  })
  test('uses one scale for quartiles, whiskers and outliers', () => {
    const model = createLumenBoxPlotGeometry([row])
    expect(model.valid).toBe(true)
    expect(model.domain).toEqual({ min: -2, max: 8 })
    expect(model.rows[0]).toMatchObject({ minPosition: 0.3,
      q1Position: 0.4,
      medianPosition: 0.5,
      q3Position: 0.6,
      maxPosition: 0.7,
      outlierPositions: [0, 1] })
    expect(row.outliers).toEqual([-2, 8])
  })
  test('rejects reversed, partial, nonfinite, duplicate and truncated summaries', () => {
    for (const invalid of [
      { ...row, median: 6 }, { ...row, q1: null }, { ...row, min: NaN }, { ...row, outliers: [Infinity] }
    ]) {
      expect(createLumenBoxPlotGeometry([invalid])).toMatchObject({ valid: false, rows: [] })
    }
    expect(createLumenBoxPlotGeometry([row, row]).valid).toBe(false)
    expect(createLumenBoxPlotGeometry([row], { domain: { min: 1, max: 5 } }).valid).toBe(false)
    expect(isLumenBoxPlotDatum({ ...row, tone: 'invalid' })).toBe(false)
    expect(isLumenBoxPlotDatum({})).toBe(false)
  })
  test('preserves missing rows and expands constant/extreme domains finitely', () => {
    const missing = { id: 'm', label: 'Missing', min: null, q1: null, median: null, q3: null, max: null }
    expect(createLumenBoxPlotGeometry([missing]).rows[0]).toMatchObject({ medianPosition: null, outlierPositions: [] })
    expect(createLumenBoxPlotGeometry([{ ...missing, outliers: [1] }]).valid).toBe(false)
    for (const value of [0, Number.MAX_VALUE, -Number.MAX_VALUE]) {
      const model = createLumenBoxPlotGeometry([{ id: 'x',
        label: 'X',
        min: value,
        q1: value,
        median: value,
        q3: value,
        max: value }])
      expect(model.valid).toBe(true)
      expect(Number.isFinite(model.rows[0]?.medianPosition)).toBe(true)
    }
    const extreme = createLumenBoxPlotGeometry([{ ...row,
      min: -Number.MAX_VALUE,
      q1: -1,
      median: 0,
      q3: 1,
      max: Number.MAX_VALUE }])
    expect(extreme.valid).toBe(true)
    expect(extreme.rows[0]?.medianPosition).toBe(0.5)
  })
})
