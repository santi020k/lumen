import { getLumenPhoneCountry } from '@santi020k/lumen-core'
import { describe, expect, test } from 'vitest'

import {
  resolveLumenPhoneControlledValue,
  resolveLumenPhoneInputValue
} from './phone-recipes.js'

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

  test('constrains externally controlled values before display', () => {
    const colombia = getLumenPhoneCountry('CO')
    const unitedStates = getLumenPhoneCountry('US')

    expect(colombia).toBeDefined()
    expect(unitedStates).toBeDefined()

    if (!colombia || !unitedStates) return

    const externalValue = resolveLumenPhoneInputValue(
      [unitedStates],
      unitedStates,
      '2125550123',
      {}
    )
    const constrainedValue = resolveLumenPhoneControlledValue(
      [colombia],
      externalValue,
      {}
    )

    expect(constrainedValue.country.regionCode).toBe('CO')
    expect(constrainedValue.nationalNumber).toContain('212')
  })
})
