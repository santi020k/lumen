import { getLumenPhoneCountries, resolveLumenPhoneNumber } from '@santi020k/lumen-core'
import { describe, expect, test } from 'vitest'

import {
  resolveReactPhoneInputCountry,
  resolveReactPhoneInputValue
} from './phone-recipes.js'

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

  test('keeps pasted international numbers inside restricted country options', () => {
    const countries = getLumenPhoneCountries({ locale: 'en' })
    const colombia = countries.find(country => country.regionCode === 'CO')

    if (!colombia) throw new Error('Expected Colombia phone metadata')

    const value = resolveReactPhoneInputValue(
      [colombia],
      colombia,
      '+1 212 555 0123',
      { locale: 'en' }
    )

    expect(value.country).toBe(colombia)
    expect(value.nationalNumber).toContain('212')

    const incompleteValue = resolveReactPhoneInputValue(
      [colombia],
      colombia,
      '+33 1',
      { locale: 'en' }
    )

    expect(incompleteValue.country).toBe(colombia)
    expect(incompleteValue.nationalNumber).not.toContain('+')

    const france = countries.find(country => country.regionCode === 'FR')

    if (!france) throw new Error('Expected France phone metadata')

    const controlledValue = resolveLumenPhoneNumber(france, '+33 1', { locale: 'en' })
    const remappedControlledValue = resolveReactPhoneInputValue(
      [colombia],
      colombia,
      controlledValue.nationalNumber,
      { locale: 'en' }
    )

    expect(remappedControlledValue.country).toBe(colombia)
    expect(remappedControlledValue.nationalNumber).not.toContain('+')
  })
})
