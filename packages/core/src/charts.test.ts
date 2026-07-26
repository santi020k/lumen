import { describe, expect, test } from 'vitest'

import {
  alignLumenChartSeries,
  createLumenBarGeometry,
  createLumenLineGeometry,
  getLumenChartCategories,
  getLumenChartDomain,
  getLumenChartTicks,
  hasLumenChartData,
  resolveLumenChartTone,
  scaleLumenChartValue
} from './charts.js'

describe('Lumen chart helpers', () => {
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
      [{ x: 'Only', y: 4 }],
      { height: 100, padding: 10, width: 100 }
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
})
