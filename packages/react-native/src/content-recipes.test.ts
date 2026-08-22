import { describe, expect, test } from 'vitest'

import {
  resolveLumenDisclosureState,
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
})
