import { describe, expect, test } from 'vitest'

import {
  createLumenHeatmapModel,
  createLumenHistogramGeometry,
  createLumenLineChartModel,
  createLumenWaterfallGeometry,
  getLumenHeatmapColor,
  getLumenHeatmapColorMix
} from './chart-models.js'

describe('continuous line chart model', () => {
  for (const width of [240, 320]) {
    for (const xScale of ['categorical', 'linear'] as const) {
      test(`keeps a positive ${xScale} plot at ${width}px with verbose value labels`, () => {
        const model = createLumenLineChartModel([
          { id: 'amount', label: 'Amount', data: [{ x: 0, y: 10 }, { x: 10, y: 20 }] }
        ], { width, xScale, formatValue: value => `$${value.toFixed(2)} Colombian pesos` })

        expect(model.width - model.padding - model.paddingLeft).toBeGreaterThanOrEqual(40)
        expect(model.positions[1]).toBeGreaterThan(model.positions[0] ?? 0)
        expect(model.geometries[0]?.points.map(point => point.xCoordinate)).toEqual(model.positions)
        expect(model.categoryTicks.length).toBeGreaterThan(0)
      })
    }
  }

  test('shares the actual elapsed-time domain across sparse series and sorts coordinates', () => {
    const model = createLumenLineChartModel([
      { id: 'a', label: 'A', data: [{ x: 100, y: 8 }, { x: 0, y: 2 }] },
      { id: 'b', label: 'B', data: [{ x: 10, y: 4 }] }
    ], { xScale: 'linear' })
    expect(model.categories).toEqual([0, 10, 100])
    const [start = 0, middle = 0, end = 0] = model.positions
    expect((middle - start) / (end - start)).toBeCloseTo(0.1)
    expect(model.geometries[1]?.points[0]?.xCoordinate).toBe(middle)
    expect(model.series[0]?.data[1]?.y).toBeNull()
  })

  test('preserves missing observations and rejects invalid time coordinates', () => {
    const model = createLumenLineChartModel([{ id: 'a',
      label: 'A',
      data: [
        { x: '2026-10-01T00:00:00Z', y: 3 },
        { x: '2026-10-02T00:00:00Z', y: null },
        { x: '2026-10-04T00:00:00Z', y: 6 },
        { x: 'invalid', y: 99 }
      ] }], { xScale: 'time' })
    expect(model.categories).toHaveLength(3)
    expect(model.geometries[0]?.path.match(/M/gu)).toHaveLength(2)
    expect(model.domain.max).toBeLessThan(99)
  })

  test('positions annotations in data space and omits out-of-domain annotations', () => {
    const model = createLumenLineChartModel([{ id: 'a', label: 'A', data: [{ x: 0, y: 1 }, { x: 10, y: 9 }] }], {
      annotations: [
        { axis: 'x', id: 'event', label: 'Launch', value: 5 },
        { id: 'target', label: 'Goal', value: 6 },
        { id: 'outside', label: 'Outside', value: 50 }
      ],
      xScale: 'linear'
    })
    expect(model.annotationMarks.map(mark => mark.id)).toEqual(['event', 'target'])
    expect(model.annotationMarks[0]?.coordinate).toBe((model.paddingLeft + model.width - model.padding) / 2)
  })

  test('keeps source observations while limiting ticks to an explicit viewport', () => {
    const model = createLumenLineChartModel([{ id: 'a',
      label: 'A',
      data: [{ x: 0, y: 0 }, { x: 50, y: 50 }, { x: 100, y: 100 }] }], {
      xScale: 'linear', xDomain: { min: 25, max: 75 }, domain: { min: 25, max: 75 }
    })
    expect(model.categories).toEqual([0, 50, 100])
    expect(model.categoryTicks.every(tick => tick.position >= model.paddingLeft &&
      tick.position <= model.width - model.padding)).toBe(true)
    expect(model.domain).toEqual({ min: 25, max: 75 })
  })
})

describe('waterfall geometry', () => {
  test.each([null,
    undefined,
    1,
    'row',
    [],
    {},
    { id: 1, label: 'A', value: 2 },
    { id: 'a', label: null, value: 2 },
    { id: 'a', label: 'A', value: '2' },
    { id: 'a', label: 'A', value: 2, kind: 'other' },
    { id: 'a', label: 'A', value: 2, tone: 'other' }
  ])('rejects malformed decoded waterfall rows: %j', row => {
    const model = createLumenWaterfallGeometry([{ id: 'valid', label: 'Valid', value: 3 }, row])
    expect(model).toMatchObject({ marks: [], connectors: [], categoryTicks: [], valid: false })
  })

  test('reserves axis space using the renderer font size and keeps a positive plotting width', () => {
    const data = [{ id: 'value', label: 'Value', value: 120 }]
    const native = createLumenWaterfallGeometry(data, { width: 266, axisFontSize: 12 })
    const web = createLumenWaterfallGeometry(data, { width: 266 })
    expect(native.left).toBe(web.left / 2)
    const large = createLumenWaterfallGeometry(data, { width: 266, axisFontSize: 48, formatValue: value => `${value} very long units` })
    expect(large.marks[0]?.width).toBeGreaterThan(0)
    expect(large.right - large.left).toBeGreaterThanOrEqual(40)
    expect(createLumenWaterfallGeometry(data, { axisFontSize: NaN }).left).toBe(createLumenWaterfallGeometry(data).left)
  })

  test('uses signed changes and explicit totals without mutating input', () => {
    const data = [
      { id: 'opening', label: 'Opening', kind: 'total' as const, value: 100 },
      { id: 'income', label: 'Income', value: 40 },
      { id: 'costs', label: 'Costs', value: -180 },
      { id: 'closing', label: 'Closing', kind: 'total' as const, value: -40 }
    ]
    const model = createLumenWaterfallGeometry(data)
    expect(model.marks.map(({ start, end }) => [start, end])).toEqual([[0, 100], [100, 140], [140, -40], [0, -40]])
    expect(model.marks.every(mark => mark.height >= 0 && Number.isFinite(mark.y))).toBe(true)
    expect(model.connectors).toHaveLength(3)
    expect(data[1]).not.toHaveProperty('start')
  })

  test('fails closed for non-finite changes, overflowing totals and duplicate identities', () => {
    for (const data of [
      [{ id: 'a', label: 'A', value: NaN }],
      [{ id: 'a', label: 'A', value: Number.MAX_VALUE }, { id: 'b', label: 'B', value: Number.MAX_VALUE }],
      [{ id: 'a', label: 'A', value: 1 }, { id: 'a', label: 'B', value: 2 }]
    ]) {
      expect(createLumenWaterfallGeometry(data)).toMatchObject({ marks: [], valid: false })
    }
  })
})

describe('histogram geometry', () => {
  test.each([null,
    undefined,
    1,
    'bin',
    [],
    {},
    { start: '0', end: 10, count: 1 },
    { start: 0, end: null, count: 1 },
    { start: 0, end: 10, count: '1' },
    { start: 0, end: 10, count: 1, label: null }
  ])('rejects malformed decoded histogram bins before sorting: %j', bin => {
    const model = createLumenHistogramGeometry([{ start: 10, end: 20, count: 3 }, bin])
    expect(model).toMatchObject({ bins: [], marks: [], categoryTicks: [], valid: false, xDomain: { min: 0, max: 1 } })
  })

  test('keeps gaps and zero bins, and sorts without mutating the input', () => {
    const bins = [{ start: 20, end: 30, count: 0 }, { start: 0, end: 10, count: 4 }]
    const model = createLumenHistogramGeometry(bins)
    expect(model.marks.map(mark => mark.start)).toEqual([0, 20])
    expect(model.marks[1]?.height).toBe(0)
    expect(bins[0]?.start).toBe(20)
    expect(model.valid).toBe(true)
  })

  test('requires density for unequal-width bins and preserves area proportional to frequency', () => {
    const bins = [{ start: 0, end: 10, count: 20 }, { start: 10, end: 30, count: 20 }]
    expect(createLumenHistogramGeometry(bins).valid).toBe(false)
    const model = createLumenHistogramGeometry(bins, { frequency: 'density' })
    expect(model.marks.map(mark => mark.value)).toEqual([2, 1])
    expect(model.marks[1]?.width).toBeCloseTo(2 * ((model.marks[0]?.width ?? 0) + 1) - 1)
  })

  test('rejects overlapping, reversed, negative and non-finite bins', () => {
    for (const bins of [
      [{ start: 0, end: 10, count: 1 }, { start: 5, end: 15, count: 2 }],
      [{ start: 10, end: 0, count: 1 }],
      [{ start: 0, end: 10, count: -1 }],
      [{ start: 0, end: Infinity, count: 1 }]
    ]) expect(createLumenHistogramGeometry(bins)).toMatchObject({ marks: [], valid: false })
  })
})

test('heatmaps keep missing cells distinct from zero and use the same first cell for each coordinate', () => {
  const model = createLumenHeatmapModel([
    { x: 'A', y: 'Day', value: null },
    { x: 'B', y: 'Day', value: 0 },
    { x: 'B', y: 'Day', value: 100 },
    { x: 'C', y: 'Day', value: -2 }
  ], { colorScale: 'diverging' })
  expect(model.cells.map(cell => cell.value)).toEqual([null, 0, -2])
  expect(model.xTicks.length).toBeGreaterThan(0)
  expect(model.yTicks[0]?.label).toBe('Day')
  expect(getLumenHeatmapColor(null, model.domain)).not.toBe(getLumenHeatmapColor(0, model.domain))
  expect(getLumenHeatmapColor(-2, model.domain, 'diverging')).toContain('diverging-negative')
})

test('diverging color domains and legends agree at their neutral midpoint', () => {
  const data = [{ x: 'A', y: 'Day', value: -2 }, { x: 'B', y: 'Day', value: 6 }]
  const automatic = createLumenHeatmapModel(data, { colorScale: 'diverging' })
  expect(automatic.domain.min).toBe(-automatic.domain.max)
  expect(automatic.midpointPercent).toBe(50)
  const custom = createLumenHeatmapModel(data, { colorScale: 'diverging', domain: { min: -2, max: 6 } })
  expect(custom.midpointPercent).toBe(25)
  const invalid = createLumenHeatmapModel(data, { colorScale: 'diverging', domain: { min: 1, max: 5 } })
  expect(invalid.domain).toEqual(automatic.domain)
})

test('native and web heatmap weights preserve zero, signs, clamping, and extreme domains', () => {
  const domain = { min: -10, max: 20 }
  expect(getLumenHeatmapColorMix(null, domain)).toBeNull()
  expect(getLumenHeatmapColorMix(NaN, domain)).toBeNull()
  expect(getLumenHeatmapColorMix(0, domain, 'diverging')).toEqual({ base: 'divergingMid', overlay: 'divergingPositive', ratio: 0 })
  expect(getLumenHeatmapColorMix(-5, domain, 'diverging')).toMatchObject({ overlay: 'divergingNegative', ratio: 0.5 })
  expect(getLumenHeatmapColorMix(10, domain, 'diverging')).toMatchObject({ overlay: 'divergingPositive', ratio: 0.5 })
  expect(getLumenHeatmapColorMix(30, domain, 'diverging')?.ratio).toBe(1)
  expect(getLumenHeatmapColorMix(-30, domain, 'diverging')?.ratio).toBe(1)
  expect(getLumenHeatmapColorMix(0, { min: -Number.MAX_VALUE, max: Number.MAX_VALUE })?.ratio).toBe(0.5)
  const extreme = createLumenHeatmapModel([{ x: 'X', y: 'Y', value: Number.MAX_VALUE }], { colorScale: 'diverging' })
  expect(extreme.midpointPercent).toBe(50)
})
