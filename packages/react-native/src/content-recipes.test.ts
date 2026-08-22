import { describe, expect, test } from 'vitest'

import {
  resolveLumenBackdropOpacity,
  resolveLumenDisclosureState,
  resolveLumenGraphicSize,
  resolveLumenIllustrationSize,
  resolveLumenSkeletonHeight
} from './content-recipes.js'

describe('content state recipes', () => {
  test('preserves controlled disclosure state', () => {
    expect(resolveLumenDisclosureState(true, false)).toEqual({
      contentVisible: true,
      disabled: false,
      opacity: 1
    })
    expect(resolveLumenDisclosureState(false, true)).toEqual({
      contentVisible: false,
      disabled: true,
      opacity: 0.52
    })
  })

  test('normalizes invalid skeleton heights', () => {
    expect(resolveLumenSkeletonHeight(24)).toBe(24)
    expect(resolveLumenSkeletonHeight(0)).toBe(16)
    expect(resolveLumenSkeletonHeight(Number.NaN)).toBe(16)
  })

  test('keeps graphic sizes aligned with the shared contract', () => {
    expect(resolveLumenGraphicSize('sm')).toBe(160)
    expect(resolveLumenGraphicSize('md')).toBe(240)
    expect(resolveLumenGraphicSize('lg')).toBe(320)
  })

  test('normalizes backdrop intensity and illustration sizes', () => {
    expect(resolveLumenBackdropOpacity('subtle')).toBe(0.4)
    expect(resolveLumenBackdropOpacity('medium')).toBe(0.68)
    expect(resolveLumenBackdropOpacity('strong')).toBe(1)
    expect(resolveLumenIllustrationSize('sm')).toBe(96)
    expect(resolveLumenIllustrationSize('md')).toBe(128)
    expect(resolveLumenIllustrationSize('lg')).toBe(176)
  })
})
