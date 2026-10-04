import { describe, expect, test } from 'vitest'

import { createLumenScatterGeometry, createLumenScatterReferences, getLumenScatterXTicks } from './charts.js'

const series = [{ id: 'reach', label: 'Reach', data: [{ x: 1, y: 0 }, { x: 10, y: 5 }, { x: 100, y: 10 }, { x: 0, y: 2 }, { x: -1, y: 4 }, { x: 3, y: null }] }]

describe('scatter dashboard geometry', () => {
  test('plots logarithmic reach without changing the underlying data or missing values', () => {
    const geometry = createLumenScatterGeometry(series, { xScale: 'log', xDomain: { min: 1, max: 100 }, domain: { min: 0, max: 10 } })

    expect(geometry.points).toHaveLength(3)
    expect(geometry.points.map(point => point.x)).toEqual([1, 10, 100])
    expect(geometry.points.map(point => point.xCoordinate)).toEqual([44, 320, 596])
    expect(getLumenScatterXTicks(geometry.xDomain, 'log')).toEqual([1, Math.sqrt(10), 10, 10 ** 1.5, 100])
  })
  test('rejects impossible domains and keeps empty log charts finite', () => {
    expect(() => createLumenScatterGeometry(series, { xScale: 'log', xDomain: { min: 0 } })).toThrow(RangeError)
    expect(() => createLumenScatterGeometry(series, { xDomain: { min: 10, max: 1 } })).toThrow(RangeError)
    expect(createLumenScatterGeometry([], { xScale: 'log' }).xDomain).toEqual({ min: 1, max: 10 })
    expect(createLumenScatterGeometry([]).xDomain).toEqual({ min: 0, max: 1 })
    expect(() => createLumenScatterGeometry(series, { domain: { min: 5, max: 1 } })).toThrow(RangeError)
  })
  test('projects lines and regions in the same domain as the plotted points', () => {
    const geometry = createLumenScatterGeometry(series, { xScale: 'log', xDomain: { min: 1, max: 100 }, domain: { min: 0, max: 10 } })
    const references = createLumenScatterReferences([
      { id: 'reach', label: 'Reach threshold', x: 10 },
      { id: 'target', label: 'Target region', x: 10, xEnd: 100, y: 5, yEnd: 10 },
      { id: 'invalid', label: 'Invalid log reference', x: 0 }
    ], geometry, 'log')

    expect(references).toHaveLength(2)
    expect(references[0]).toMatchObject({ x1: 320, x2: 320, region: false })
    expect(references[1]).toMatchObject({ x1: 320, x2: 596, y1: 160, y2: 44, region: true })
  })
})

describe('automatic scatter bounds', () => {
  test.each(['linear', 'log', 'time'] as const)('keeps complete bubbles inside the %s plot', xScale => {
    const data = xScale === 'time' ?
      [{ x: '2026-09-01', y: -12, size: 10 }, { x: '2026-09-30', y: 84, size: 96 }] :
      [{ x: 1, y: -12, size: 10 }, { x: 100, y: 84, size: 96 }]

    const geometry = createLumenScatterGeometry([{ id: 'cohorts', label: 'Cohorts', data }], { xScale })

    expect(geometry.points).toHaveLength(2)

    for (const point of geometry.points) {
      expect(point.xCoordinate - point.radius).toBeGreaterThanOrEqual(46)
      expect(point.xCoordinate + point.radius).toBeLessThanOrEqual(594)
      expect(point.yCoordinate - point.radius).toBeGreaterThanOrEqual(46)
      expect(point.yCoordinate + point.radius).toBeLessThanOrEqual(274)
    }
  })

  test('preserves explicit limits while padding the automatic side', () => {
    const geometry = createLumenScatterGeometry(series, { domain: { min: 0 }, xDomain: { max: 100 } })

    expect(geometry.domain.min).toBe(0)
    expect(geometry.domain.max).toBeGreaterThan(10)
    expect(geometry.xDomain.max).toBe(100)
    expect(geometry.xDomain.min).toBeLessThan(-1)
  })

  test('keeps reference coordinates aligned with automatic extents', () => {
    const geometry = createLumenScatterGeometry(series, { xScale: 'log' })
    const references = createLumenScatterReferences([{ id: 'target', label: 'Target', x: 10, y: 5 }], geometry, 'log')
    const point = geometry.points.find(item => item.x === 10)

    expect(references[0]?.x1).toBe(point?.xCoordinate)
    expect(references[0]?.y1).toBe(point?.yCoordinate)
  })

  test('does not expand an already padded single-point domain', () => {
    const geometry = createLumenScatterGeometry([{ id: 'one', label: 'One', data: [{ x: 10, y: 20 }] }])

    expect(geometry.xDomain).toEqual({ min: 9, max: 11 })
    expect(geometry.domain).toEqual({ min: 18, max: 22 })
    expect(geometry.points[0]).toMatchObject({ xCoordinate: 320, yCoordinate: 160 })
  })
})
