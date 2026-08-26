import { getLumenPhoneCountries } from '@santi020k/lumen-core'
import { describe, expect, test } from 'vitest'

import { resolveReactPhoneInputCountry } from './phone-recipes.js'

describe('React phone input recipes', () => {
  test('keeps implicit defaults inside restricted country options', () => {
    const countries = getLumenPhoneCountries({ locale: 'en' })
    const colombia = countries.find(country => country.regionCode === 'CO')

    if (!colombia) throw new Error('Expected Colombia phone metadata')

    expect(resolveReactPhoneInputCountry([colombia], 'US', 'en', undefined)).toBe(colombia)
  })
})
