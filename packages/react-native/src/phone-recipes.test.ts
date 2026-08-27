import { getLumenPhoneCountry } from '@santi020k/lumen-core'
import { describe, expect, test } from 'vitest'

import { resolveLumenPhoneInputValue } from './phone-recipes.js'

describe('Lumen React Native phone recipes', () => {
  test('keeps pasted international numbers within the allowed country list', () => {
    const unitedStates = getLumenPhoneCountry('US')
    const unitedKingdom = getLumenPhoneCountry('GB')

    expect(unitedStates).toBeDefined()
    expect(unitedKingdom).toBeDefined()

    if (!unitedStates || !unitedKingdom) return

    const value = resolveLumenPhoneInputValue(
      [unitedStates],
      unitedStates,
      '+442071838750',
      {}
    )

    expect(value.country.regionCode).toBe('US')
    expect(value.country.regionCode).not.toBe(unitedKingdom.regionCode)
  })
})
