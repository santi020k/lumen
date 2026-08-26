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
  getLumenChartCategories,
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

  test('centers a single line-chart point', () => {
    const geometry = createLumenLineGeometry(
      [{ x: 'Only', y: 4 }], { height: 100, padding: 10, width: 100 }
    )

    expect(geometry.points[0]?.xCoordinate).toBe(50)
  })

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
})
