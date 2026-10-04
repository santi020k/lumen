import { describe, expect, test } from 'vitest'

import chartConformance from '../../../charts/lumen.chart-conformance.json' with { type: 'json' }

import {
  alignLumenChartSeries,
  appendLumenChartDatum,
  createLumenBarGeometry,
  createLumenHeatmapGeometry,
  createLumenLineGeometry,
  createLumenPieGeometry,
  createLumenRangeGeometry,
  createLumenScatterGeometry,
  downsampleLumenChartData,
  formatLumenChartSummary,
  getLumenChartAxisPadding,
  getLumenChartCategories,
  getLumenChartCategoryLabel,
  getLumenChartCategoryTicks,
  getLumenChartDomain,
  getLumenChartTicks,
  hasLumenChartData,
  hasLumenPieData,
  resolveLumenChartTone,
  scaleLumenChartValue,
  validateLumenChartSeries
} from './charts.js'

describe('Lumen chart helpers', () => {
  test('matches the shared cross-platform conformance fixtures', () => {
    const categorical = createLumenLineGeometry(chartConformance.line.categorical.data)
    const linear = createLumenLineGeometry(chartConformance.line.linear.data, {
      height: 100,
      padding: 0,
      width: 100,
      xScale: 'linear'
    })
    const stacked = createLumenBarGeometry(chartConformance.stackedBar.series, {
      layout: 'stacked'
    })
    const heatmap = createLumenHeatmapGeometry(chartConformance.heatmap.data)

    expect(categorical.domain).toEqual(chartConformance.line.categorical.expected.domain)
    expect(categorical.points).toHaveLength(
      chartConformance.line.categorical.expected.pointCount
    )
    expect(categorical.areaPaths).toHaveLength(
      chartConformance.line.categorical.expected.segmentCount
    )
    expect(linear.xDomain).toEqual(chartConformance.line.linear.expected.xDomain)
    expect(linear.points.map(point => point.xCoordinate)).toEqual(
      chartConformance.line.linear.expected.xCoordinates
    )
    expect(stacked.domain).toEqual(chartConformance.stackedBar.expected.domain)
    expect(stacked.marks).toHaveLength(chartConformance.stackedBar.expected.markCount)
    expect(heatmap.cells).toHaveLength(chartConformance.heatmap.expected.cellCount)
    expect(heatmap.xCategories).toHaveLength(
      chartConformance.heatmap.expected.xCategoryCount
    )
    expect(heatmap.yCategories).toHaveLength(
      chartConformance.heatmap.expected.yCategoryCount
    )
  })

  test('detects usable chart data across empty and missing-value series', () => {
    expect(hasLumenChartData([])).toBe(false)
    expect(hasLumenChartData([{
      data: [],
      id: 'empty',
      label: 'Empty'
    }])).toBe(false)
    expect(hasLumenChartData([{
      data: [{ x: 'Mon', y: null }],
      id: 'missing',
      label: 'Missing'
    }])).toBe(false)
    expect(hasLumenChartData([{
      data: [{ x: 'Mon', y: 0 }],
      id: 'available',
      label: 'Available'
    }])).toBe(true)
  })

  test('creates safe domains for empty, flat, positive, and mixed values', () => {
    expect(getLumenChartDomain([])).toEqual({ max: 1, min: 0 })
    expect(getLumenChartDomain([5])).toEqual({ max: 5, min: 0 })
    expect(getLumenChartDomain([5], false)).toEqual({ max: 5.5, min: 4.5 })
    expect(getLumenChartDomain([-4, 8])).toEqual({ max: 8, min: -4 })
  })

  test('scales values and creates deterministic ticks', () => {
    const domain = { max: 10, min: 0 }

    expect(scaleLumenChartValue(5, domain, 0, 100)).toBe(50)
    expect(getLumenChartTicks(domain, 3)).toEqual([0, 5, 10])
  })

  test('scales finite domains that span opposite numeric extremes', () => {
    const domain = { min: -Number.MAX_VALUE, max: Number.MAX_VALUE }
    expect(scaleLumenChartValue(0, domain, 0, 100)).toBe(50)
    expect(scaleLumenChartValue(domain.min, domain, 0, 100)).toBe(0)
    expect(scaleLumenChartValue(domain.max, domain, 0, 100)).toBe(100)
    expect(scaleLumenChartValue(1, { min: NaN, max: 10 }, 4, 100)).toBe(4)
    const largestDomain = getLumenChartDomain([Number.MAX_VALUE], false)
    expect(largestDomain.max).toBe(Number.MAX_VALUE)
    expect(largestDomain.min).toBeGreaterThan(0)
    expect(largestDomain.min).toBeLessThan(largestDomain.max)
    expect(getLumenChartDomain([Number.MIN_VALUE], false)).toEqual({ min: 0, max: Number.MIN_VALUE * 2 })
  })

  test('reserves enough axis padding for long formatted values', () => {
    expect(getLumenChartAxisPadding(['$ 0', '$ 3.000.000'])).toBe(93)
    expect(getLumenChartAxisPadding(['0'], 60)).toBe(60)
    expect(getLumenChartAxisPadding(['x'.repeat(100)])).toBe(240)
  })

  test('reserves wider axis padding for wide glyphs', () => {
    expect(getLumenChartAxisPadding(['WWWW'], 0)).toBe(56)
    expect(getLumenChartAxisPadding(['iiii'], 0)).toBe(44)
    expect(getLumenChartAxisPadding(['界界界'], 0)).toBe(49)
  })

  test('builds line and area geometry while preserving missing-value gaps', () => {
    const geometry = createLumenLineGeometry([
      { x: 'Mon', y: 4 },
      { x: 'Tue', y: null },
      { x: 'Wed', y: 8 },
      { x: 'Thu', y: 6 }
    ], { height: 100, padding: 0, width: 100 })

    expect(geometry.path).toContain('M 0.000')
    expect(geometry.path).toContain('M 66.667')
    expect(geometry.areaPaths).toHaveLength(2)
    expect(geometry.points).toHaveLength(3)
  })

  test('places a singleton label at the same coordinate as its mark', () => {
    const geometry = createLumenLineGeometry([{ x: 'Only day', y: 4 }], { padding: 44, width: 640 })
    const ticks = getLumenChartCategoryTicks(['Only day'], { end: 596, start: 44 })

    expect(ticks).toEqual([{ index: 0, label: 'Only day', position: geometry.points[0]?.xCoordinate, textAnchor: 'middle' }])
  })

  test('keeps dense endpoint labels apart without removing source points', () => {
    const labels = Array.from({ length: 30 }, (_, index) => `Sep ${index + 1}`)
    const ticks = getLumenChartCategoryTicks(labels, { end: 596, start: 44 })

    expect(ticks[0]).toMatchObject({ index: 0, textAnchor: 'start' })
    expect(ticks.at(-1)).toMatchObject({ index: 29, textAnchor: 'end' })
    expect(ticks.some(tick => tick.index === 28)).toBe(false)
    expect(ticks.length).toBeLessThan(labels.length)

    for (const [index, tick] of ticks.entries()) {
      const previous = ticks[index - 1]

      if (!previous) continue

      const previousEnd = previous.position + previous.label.length * 7 * (previous.textAnchor === 'start' ? 1 : 0.5)
      const currentStart = tick.position - tick.label.length * 7 * (tick.textAnchor === 'end' ? 1 : 0.5)

      expect(currentStart - previousEnd).toBeGreaterThanOrEqual(16)
    }
  })

  test('bounds verbose category labels and rejects invalid plot bounds', () => {
    const ticks = getLumenChartCategoryTicks(['W'.repeat(500), 'W'.repeat(500)], { end: 300, start: 0 })

    expect(ticks).toHaveLength(2)
    expect(ticks.every(tick => tick.label.endsWith('…') && tick.label.length < 20)).toBe(true)
    expect(getLumenChartCategoryTicks([], { end: 300, start: 0 })).toEqual([])
    expect(getLumenChartCategoryTicks(['A'], { end: 0, start: 100 })).toEqual([])
  })

  test('fits labels to bar centers and normalizes invalid custom positions', () => {
    const labels = ['W'.repeat(500), 'W'.repeat(500)]
    const ticks = getLumenChartCategoryTicks(labels, { end: 600, positions: [180, 460], start: 40 })

    expect(ticks.map(tick => tick.position)).toEqual([180, 460])
    expect(ticks.every(tick => tick.label.length < 15)).toBe(true)
    expect(getLumenChartCategoryTicks(['A', 'B'], { end: 600, positions: [Number.NaN, 460], start: 40 }))
      .toEqual(getLumenChartCategoryTicks(['A', 'B'], { end: 600, start: 40 }))
  })

  test('separates concise labels from full category descriptions', () => {
    const series = [{ data: [{ x: '2026-09-01', xLabel: 'Sep 1', y: 4 }], id: 'daily', label: 'Daily' }]
    const formatCategory = () => 'September 1, 2026'

    expect(getLumenChartCategoryLabel(series, '2026-09-01', formatCategory)).toBe('Sep 1')
    expect(getLumenChartCategoryLabel(series, '2026-09-01', formatCategory, 'detail')).toBe('September 1, 2026')
    expect(getLumenChartCategoryLabel(series, '2026-09-01', undefined, 'detail')).toBe('Sep 1')
  })

  test('diagnoses duplicate categories and consistently retains the last observation', () => {
    const item = { data: [{ x: 'A', y: 100 }, { x: 'A', y: 160 }, { x: 'B', y: 220 }], id: 'daily', label: 'Daily' }
    const series = [item]
    const categories = getLumenChartCategories(series)

    expect(validateLumenChartSeries(series)).toEqual([{
      code: 'duplicate-category',
      message: 'Category x values must be unique within a series. Use xLabel for repeated display labels.',
      path: 'series[0].data[1].x'
    }])
    expect(alignLumenChartSeries(item, categories).data.map(datum => datum.y)).toEqual([160, 220])
    expect(createLumenBarGeometry(series).marks.map(mark => mark.value)).toEqual([160, 220])
  })

  test('preserves distinct stable keys with repeated display labels and repeated continuous coordinates', () => {
    const series = [{ data: [{ x: 1, xLabel: 'Sep 1', y: 4 }, { x: '1', xLabel: 'Sep 1', y: 8 }], id: 'daily', label: 'Daily' }]

    expect(validateLumenChartSeries(series)).toEqual([])
    expect(createLumenBarGeometry(series).categories.map(category => category.label)).toEqual(['Sep 1', 'Sep 1'])
    expect(validateLumenChartSeries([{ data: [{ x: 1, y: 4 }, { x: 1, y: 8 }], id: 'continuous', label: 'Continuous' }], 'linear')).toEqual([])
  })

  test('shares bounded bar margins with formatted numeric axes and category labels', () => {
    const series = [{ data: [{ x: 'A', y: -3_000_000 }, { x: 'B', y: 4_000_000 }], id: 'money', label: 'Money' }]
    const vertical = createLumenBarGeometry(series, { formatValue: value => `$ ${value.toLocaleString('en')}` })
    const horizontal = createLumenBarGeometry(series, { formatCategory: () => 'W'.repeat(100), orientation: 'horizontal' })

    expect(vertical.margin.left).toBeGreaterThan(52)
    expect(vertical.marks.every(mark => mark.x >= vertical.margin.left && Number.isFinite(mark.height))).toBe(true)
    expect(horizontal.margin.left).toBe(240)
    expect(horizontal.marks.every(mark => mark.x >= horizontal.margin.left && Number.isFinite(mark.width))).toBe(true)
    expect(horizontal.categories[0]?.label).toBe('W'.repeat(100))
  })

  test('centers a single line-chart point', () => {
    const geometry = createLumenLineGeometry(
      [{ x: 'Only', y: 4 }], { height: 100, padding: 10, width: 100 }
    )

    expect(geometry.points[0]?.xCoordinate).toBe(50)
  })

  test('supports an expanded left axis without changing vertical padding', () => {
    const geometry = createLumenLineGeometry(
      [{ x: 'First', y: 0 }, { x: 'Last', y: 10 }],
      { height: 100, padding: 10, paddingLeft: 30, width: 100 }
    )

    expect(geometry.points.map(point => point.xCoordinate)).toEqual([30, 90])
    expect(geometry.points.map(point => point.yCoordinate)).toEqual([90, 10])
  })

  test.each([[0, 5, 10], [-10, -5, 0], [-5, 0, 5], [7]].map(values => ({ values })))(
    'shares vertical bar and line geometry for equal values $values', ({ values }) => {
      const data = values.map((y, x) => ({ x, y }))
      const bars = createLumenBarGeometry([{ data, id: 'bars', label: 'Bars' }], { height: 320 })
      const line = createLumenLineGeometry(data, {
        domain: bars.domain,
        height: bars.height,
        paddingBottom: bars.margin.bottom,
        paddingTop: bars.margin.top
      })
      const barEndpoints = bars.marks.map(mark => mark.y + (mark.value < 0 ? mark.height : 0))

      expect(line.points.map(point => point.yCoordinate)).toEqual(barEndpoints)
      expect(line.areaPaths[0]).toContain(
        scaleLumenChartValue(0, bars.domain, bars.height - bars.margin.bottom, bars.margin.top).toFixed(3)
      )
    }
  )

  test('aligns differently shaped series to their shared category domain', () => {
    const first = {
      data: [{ x: 'Mon', y: 4 }],
      id: 'first',
      label: 'First'
    }
    const second = {
      data: [{ x: 'Tue', y: 8 }],
      id: 'second',
      label: 'Second'
    }
    const categories = getLumenChartCategories([first, second])

    expect(categories).toEqual(['Mon', 'Tue'])
    expect(alignLumenChartSeries(first, categories).data).toEqual([
      { x: 'Mon', y: 4 },
      { x: 'Tue', y: null }
    ])
  })

  test('cycles categorical tones without using status semantics by default', () => {
    expect(resolveLumenChartTone(undefined, 0)).toBe('series-1')
    expect(resolveLumenChartTone(undefined, 8)).toBe('series-1')
    expect(resolveLumenChartTone('danger', 0)).toBe('danger')
  })

  test('builds pie and donut slices from positive finite values', () => {
    const data = [
      { label: 'Core', tone: 'brand' as const, x: 'core', y: 60 },
      { label: 'Astro', x: 'astro', y: 30 },
      { label: 'Ignored', x: 'ignored', y: -10 },
      { label: 'Missing', x: 'missing', y: null }
    ]
    const donut = createLumenPieGeometry(data)
    const pie = createLumenPieGeometry(data, { variant: 'pie' })

    expect(hasLumenPieData(data)).toBe(true)
    expect(donut.total).toBe(90)
    expect(donut.slices).toHaveLength(2)
    expect(donut.slices[0]).toMatchObject({
      label: 'Core',
      percentage: 2 / 3,
      tone: 'brand',
      value: 60
    })
    expect(donut.innerRadius).toBeGreaterThan(0)
    expect(pie.innerRadius).toBe(0)
    expect(pie.slices[0]?.path).toContain('M 160.000 160.000')
  })

  test('creates a valid full-circle path for one pie slice', () => {
    const geometry = createLumenPieGeometry([
      { x: 'All', y: 100 }
    ])

    expect(geometry.slices[0]?.path.match(/ A /g)).toHaveLength(4)
    expect(hasLumenPieData([{ x: 'Zero', y: 0 }])).toBe(false)
  })

  test('lays out grouped and stacked bars in both orientations', () => {
    const series = [
      {
        data: [
          { x: 'Alpha', y: 10 },
          { x: 'Beta', y: 20 }
        ],
        id: 'views',
        label: 'Views'
      },
      {
        data: [
          { x: 'Alpha', y: 5 },
          { x: 'Beta', y: 8 }
        ],
        id: 'visits',
        label: 'Visits'
      }
    ] as const
    const grouped = createLumenBarGeometry(series)
    const stacked = createLumenBarGeometry(series, {
      layout: 'stacked',
      orientation: 'horizontal'
    })

    expect(grouped.categories).toHaveLength(2)
    expect(grouped.marks).toHaveLength(4)
    expect(grouped.marks[0]?.height).toBeGreaterThan(0)
    expect(stacked.domain.max).toBe(28)
    expect(stacked.marks[0]?.width).toBeGreaterThan(0)
    expect(stacked.marks[1]?.x).toBeGreaterThan(stacked.marks[0]?.x ?? 0)
  })

  test('omits unavailable values from bar geometry', () => {
    const geometry = createLumenBarGeometry([{
      data: [
        { x: 'Finite', y: 8 },
        { x: 'Missing', y: null },
        { x: 'NaN', y: Number.NaN },
        { x: 'Infinite', y: Number.POSITIVE_INFINITY }
      ],
      id: 'values',
      label: 'Values'
    }])

    expect(geometry.marks.map(mark => mark.category)).toEqual(['Finite'])
  })

  test('uses numeric and temporal x values instead of index spacing', () => {
    const linear = createLumenLineGeometry([
      { x: 0, y: 2 },
      { x: 10, y: 4 },
      { x: 100, y: 8 }
    ], { height: 100, padding: 0, width: 100, xScale: 'linear' })
    const temporal = createLumenLineGeometry([
      { x: '2026-01-01T00:00:00Z', y: 1 },
      { x: '2026-01-03T00:00:00Z', y: 2 }
    ], { height: 100, padding: 0, width: 100, xScale: 'time' })

    expect(linear.points.map(point => point.xCoordinate)).toEqual([0, 10, 100])
    expect(linear.xDomain).toEqual({ max: 100, min: 0 })
    expect(temporal.points.map(point => point.xCoordinate)).toEqual([0, 100])
  })

  test('excludes invalid x values from continuous line domains', () => {
    const linear = createLumenLineGeometry([
      { x: 0, y: 1 },
      { x: 1, y: 2 },
      { x: 'invalid', y: 1000 }
    ], { includeZero: false, xScale: 'linear' })
    const temporal = createLumenLineGeometry([
      { x: '2026-01-01T00:00:00Z', y: 3 },
      { x: '2026-01-02T00:00:00Z', y: 4 },
      { x: 'not-a-date', y: -1000 }
    ], { includeZero: false, xScale: 'time' })

    expect(linear.domain).toEqual({ max: 2, min: 1 })
    expect(linear.points.map(point => point.y)).toEqual([1, 2])
    expect(temporal.domain).toEqual({ max: 4, min: 3 })
    expect(temporal.points.map(point => point.y)).toEqual([3, 4])
  })

  test('rejects blank linear coordinates while preserving numeric strings and zero', () => {
    const geometry = createLumenLineGeometry([
      { x: '', y: 1000 },
      { x: ' \t\n', y: -1000 },
      { x: ' 0 ', y: 2 },
      { x: '1', y: 3 }
    ], { includeZero: false, xScale: 'linear' })

    expect(geometry.points.map(point => point.y)).toEqual([2, 3])
    expect(geometry.domain).toEqual({ max: 3, min: 2 })
    expect(geometry.xDomain).toEqual({ max: 1, min: 0 })
  })

  test('validates identifiers, values, sizes, and ordered continuous axes', () => {
    const issues = validateLumenChartSeries([
      {
        data: [
          { id: 'point', size: -1, x: 2, y: Number.NaN },
          { id: 'point', x: 1, y: 4 }
        ],
        id: 'series',
        label: 'First'
      },
      { data: [], id: 'series', label: 'Second' }
    ], 'linear')

    expect(issues.map(issue => issue.code)).toEqual([
      'invalid-y',
      'invalid-size',
      'duplicate-datum-id',
      'unsorted-x',
      'duplicate-series-id'
    ])
  })

  test('summarizes available and missing values without subjective language', () => {
    const series = [{
      data: [{ x: 'A', y: 2 }, { x: 'B', y: null }, { x: 'C', y: 8 }],
      id: 'views',
      label: 'Views'
    }]

    expect(formatLumenChartSummary(series)).toBe(
      '1 series, 2 points. Values range from 2 to 8. 1 missing value.'
    )
    expect(formatLumenChartSummary(series, String, {
      formatSummary: summary => `${summary.availablePointCount} puntos disponibles.`
    })).toBe('2 puntos disponibles.')
  })

  test('reduces large datasets while preserving endpoints and missing gaps', () => {
    const data = Array.from({ length: 100 }, (_, index) => ({
      x: index,
      y: index === 50 ? null : Math.sin(index)
    }))
    const sampled = downsampleLumenChartData(data, 12)

    expect(sampled).toHaveLength(12)
    expect(sampled[0]).toEqual(data[0])
    expect(sampled.at(-1)).toEqual(data.at(-1))
    expect(sampled.some(datum => datum.y === null)).toBe(true)
  })

  test('keeps a bounded real-time series window', () => {
    const next = appendLumenChartDatum({
      data: [{ x: 1, y: 1 }, { x: 2, y: 2 }],
      id: 'live',
      label: 'Live'
    }, { x: 3, y: 3 }, 2)

    expect(next.data).toEqual([{ x: 2, y: 2 }, { x: 3, y: 3 }])
  })

  test('builds scatter, bubble, heatmap, and range geometry', () => {
    const scatter = createLumenScatterGeometry([{
      data: [{ size: 1, x: 0, y: 2 }, { size: 9, x: 10, y: 8 }],
      id: 'points',
      label: 'Points'
    }], { height: 100, padding: 0, width: 100 })
    const heatmap = createLumenHeatmapGeometry([
      { value: 1, x: 'Mon', y: 'AM' },
      { value: 3, x: 'Tue', y: 'PM' }
    ], 100, 100)
    const range = createLumenRangeGeometry([
      { high: 8, low: 2, x: 'Mon' },
      { high: 10, low: 4, x: 'Tue' }
    ], { height: 100, padding: 0, width: 100 })

    expect(scatter.points).toHaveLength(2)
    expect(scatter.points[1]?.radius).toBeGreaterThan(scatter.points[0]?.radius ?? 0)
    expect(heatmap.cells).toHaveLength(2)
    expect(heatmap.xCategories).toEqual(['Mon', 'Tue'])
    expect(range.areaPath).toContain('Z')
    expect(range.points).toHaveLength(2)
  })

  test('derives scatter domains only from points that can be drawn', () => {
    const scatter = createLumenScatterGeometry([{
      data: [{ x: 0, y: 1 }, { x: 'invalid', y: 1000 }],
      id: 'points',
      label: 'Points'
    }], { height: 100, padding: 0, width: 100 })

    expect(scatter.points).toHaveLength(1)
    expect(scatter.domain).toEqual({ max: 1.1, min: 0.9 })
    expect(scatter.points[0]?.yCoordinate).toBeCloseTo(50)
  })

  test('excludes negative bubble sizes from radius scaling', () => {
    const scatter = createLumenScatterGeometry([{
      data: [
        { id: 'invalid', size: -1_000, x: 0, y: 1 },
        { id: 'small', size: 1, x: 1, y: 2 },
        { id: 'large', size: 2, x: 2, y: 3 }
      ],
      id: 'points',
      label: 'Points'
    }], { maximumRadius: 18, minimumRadius: 4 })

    expect(scatter.points.find(point => point.id === 'invalid')?.radius).toBe(4)
    expect(scatter.points.find(point => point.id === 'small')?.radius).toBe(4)
    expect(scatter.points.find(point => point.id === 'large')?.radius).toBe(18)
  })

  test('splits range bands around missing intervals', () => {
    const range = createLumenRangeGeometry([
      { high: 8, low: 2, x: 'Mon' },
      { high: null, low: null, x: 'Tue' },
      { high: 10, low: 4, x: 'Wed' }
    ], { height: 100, padding: 0, width: 100 })

    expect(range.areaPath.match(/M /g)).toHaveLength(2)
    expect(range.areaPath.match(/Z/g)).toHaveLength(2)
    expect(range.points).toHaveLength(2)
  })

  test('derives range domains only from complete intervals', () => {
    const range = createLumenRangeGeometry([
      { high: 2, low: 1, x: 'Available' },
      { high: 1000, low: null, x: 'Unavailable' }
    ], { height: 100, padding: 0, width: 100 })

    expect(range.domain).toEqual({ max: 2, min: 1 })
    expect(range.points).toHaveLength(1)
    expect(range.points[0]?.highCoordinate).toBe(0)
    expect(range.points[0]?.lowCoordinate).toBe(100)
  })
})
