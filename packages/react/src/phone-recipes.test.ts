import { getLumenPhoneCountries, resolveLumenPhoneNumber } from '@santi020k/lumen-core'
import { describe, expect, test } from 'vitest'

import { resolveReactPhoneInputCountry } from './phone-recipes.js'

describe('React phone input recipes', () => {
  test('keeps implicit defaults inside restricted country options', () => {
    const countries = getLumenPhoneCountries({ locale: 'en' })
    const colombia = countries.find(country => country.regionCode === 'CO')

    if (!colombia) throw new Error('Expected Colombia phone metadata')

    expect(resolveReactPhoneInputCountry([colombia], 'US', 'en', undefined)).toBe(colombia)

    const unitedStates = countries.find(country => country.regionCode === 'US')

    if (!unitedStates) throw new Error('Expected United States phone metadata')

    const controlledValue = resolveLumenPhoneNumber(unitedStates, '4155552671', { locale: 'en' })

    expect(resolveReactPhoneInputCountry([colombia], 'US', 'en', controlledValue)).toBe(colombia)
  })
})
