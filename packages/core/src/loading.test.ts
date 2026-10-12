import { describe, expect, test } from 'vitest'

import {
  normalizeLumenProgress,
  resolveLumenLoadingSemantics,
  resolveLumenSkeletonAnimation,
  resolveLumenSkeletonShape,
  resolveLumenSkeletonSize
} from './index.js'

describe('normalizeLumenProgress', () => {
  test('keeps determinate values and the omitted value default of 0', () => {
    expect(normalizeLumenProgress()).toEqual({ max: 100, percentage: 0, value: 0 })
    expect(normalizeLumenProgress(200, 50)).toEqual({ max: 200, percentage: 25, value: 50 })
    expect(normalizeLumenProgress('80', '20')).toEqual({ max: 80, percentage: 25, value: 20 })
  })

  test.each([
    [Number.NaN, 40, { max: 100, percentage: 40, value: 40 }],
    [Number.POSITIVE_INFINITY, 40, { max: 100, percentage: 40, value: 40 }],
    [-5, 40, { max: 100, percentage: 40, value: 40 }],
    [0, 40, { max: 100, percentage: 40, value: 40 }],
    [100, Number.NaN, { max: 100, percentage: 0, value: 0 }],
    [100, Number.POSITIVE_INFINITY, { max: 100, percentage: 0, value: 0 }],
    [100, Number.NEGATIVE_INFINITY, { max: 100, percentage: 0, value: 0 }],
    [100, 140, { max: 100, percentage: 100, value: 100 }],
    [100, -1, { max: 100, percentage: 0, value: 0 }],
    [null, '', { max: 100, percentage: 0, value: 0 }],
    [{}, [], { max: 100, percentage: 0, value: 0 }]
  ])('normalizes max %s and value %s to finite ARIA values', (max, value, expected) => {
    const result = normalizeLumenProgress(max, value)

    expect(result).toEqual(expected)
    expect(Object.values(result).every(Number.isFinite)).toBe(true)
  })
})

describe('Skeleton options', () => {
  test('falls back to the existing rectangle shimmer appearance', () => {
    expect(resolveLumenSkeletonShape(undefined)).toBe('rectangle')
    expect(resolveLumenSkeletonShape('triangle')).toBe('rectangle')
    expect(resolveLumenSkeletonShape('circle')).toBe('circle')
    expect(resolveLumenSkeletonAnimation(undefined)).toBe('shimmer')
    expect(resolveLumenSkeletonAnimation('spin')).toBe('shimmer')
    expect(resolveLumenSkeletonAnimation('none')).toBe('none')
  })

  test('resolves numeric and CSS length sizes', () => {
    expect(resolveLumenSkeletonSize(8)).toBe('8px')
    expect(resolveLumenSkeletonSize('8')).toBe('8px')
    expect(resolveLumenSkeletonSize(' 0.75rem ')).toBe('0.75rem')
    expect(resolveLumenSkeletonSize('60%')).toBe('60%')
    expect(resolveLumenSkeletonSize('calc(100% - 2rem)')).toBe('calc(100% - 2rem)')
    expect(resolveLumenSkeletonSize('min(12rem, 80%)')).toBe('min(12rem, 80%)')
  })

  test('preserves case-sensitive custom properties in variable expressions', () => {
    expect(resolveLumenSkeletonSize('var(--PreviewWidth)')).toBe('var(--PreviewWidth)')
    expect(resolveLumenSkeletonSize('calc(var(--row_width) - 1rem)')).toBe('calc(var(--row_width) - 1rem)')
    expect(resolveLumenSkeletonSize('var(--ui-space-md, 0.75rem)')).toBe('var(--ui-space-md, 0.75rem)')
  })

  test.each([
    undefined,
    null,
    '',
    -1,
    '-4',
    Number.NaN,
    Number.POSITIVE_INFINITY,
    '1rem; background: red',
    '1rem} .x{color:red',
    'url(javascript:alert(1))"',
    '<script>',
    'var(--x)!important',
    'var(\n--x)',
    '1rem\u0000',
    'var(--x) "a"',
    'var(--\u00e9)'
  ])('rejects unsafe or invalid size %s', value => {
    expect(resolveLumenSkeletonSize(value)).toBeUndefined()
  })

  test('rejects adversarially long sizes without scanning past the length limit', () => {
    expect(resolveLumenSkeletonSize(`${'1'.repeat(100_000)}px`)).toBeUndefined()
    expect(resolveLumenSkeletonSize(`calc(${'('.repeat(30)}`)).toBe(`calc(${'('.repeat(30)}`)
  })
})

describe('resolveLumenLoadingSemantics', () => {
  test('hides unnamed indicators and exposes named indicators as status', () => {
    expect(resolveLumenLoadingSemantics({})).toEqual({ ariaHidden: 'true', role: undefined })
    expect(resolveLumenLoadingSemantics({ ariaLabel: '  ' })).toEqual({ ariaHidden: 'true', role: undefined })
    expect(resolveLumenLoadingSemantics({ ariaLabel: 'Loading' })).toEqual({ ariaHidden: undefined, role: 'status' })
    expect(resolveLumenLoadingSemantics({ ariaLabelledby: 'title' })).toEqual({ ariaHidden: undefined, role: 'status' })
  })

  test('preserves explicit ARIA overrides', () => {
    expect(resolveLumenLoadingSemantics({ ariaHidden: false })).toEqual({ ariaHidden: undefined, role: undefined })
    expect(resolveLumenLoadingSemantics({ ariaHidden: 'true', ariaLabel: 'Loading' })).toEqual({ ariaHidden: undefined, role: 'status' })
    expect(resolveLumenLoadingSemantics({ ariaLabel: 'Loading', role: 'img' })).toEqual({ ariaHidden: undefined, role: undefined })
  })
})
