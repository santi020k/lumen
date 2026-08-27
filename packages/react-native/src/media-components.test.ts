import { describe, expect, test } from 'vitest'

import {
  resolveLumenImageAspectRatio,
  resolveLumenImageRadius
} from './media-recipes.js'
import { lumenRadii } from './tokens.generated.js'

describe('LumenImage recipes', () => {
  test('accepts only positive finite aspect ratios', () => {
    expect(resolveLumenImageAspectRatio(16 / 9)).toBe(16 / 9)
    expect(resolveLumenImageAspectRatio(0)).toBeUndefined()
    expect(resolveLumenImageAspectRatio(-1)).toBeUndefined()
    expect(resolveLumenImageAspectRatio(Number.NaN)).toBeUndefined()
    expect(resolveLumenImageAspectRatio(Number.POSITIVE_INFINITY)).toBeUndefined()
    expect(resolveLumenImageAspectRatio(undefined)).toBeUndefined()
  })

  test('maps image radii to canonical tokens', () => {
    expect(resolveLumenImageRadius(lumenRadii, 'none')).toBe(0)
    expect(resolveLumenImageRadius(lumenRadii, 'sm')).toBe(lumenRadii.sm)
    expect(resolveLumenImageRadius(lumenRadii, 'md')).toBe(lumenRadii.md)
    expect(resolveLumenImageRadius(lumenRadii, 'lg')).toBe(lumenRadii.lg)
    expect(resolveLumenImageRadius(lumenRadii, 'full')).toBe(lumenRadii.full)
  })
})
