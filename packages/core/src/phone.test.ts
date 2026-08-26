import { describe, expect, test } from 'vitest'

import {
  createEmptyLumenPhoneNumber,
  getLumenPhoneCountries,
  getLumenPhoneCountry,
  resolveLumenPhoneNumber,
  sanitizeLumenPhoneInput
} from './phone.js'

const colombia = getLumenPhoneCountry('CO', { locale: 'en-US' })

if (!colombia) throw new Error('Expected Colombia phone metadata')

describe('phone contracts', () => {
  test('provides localized country metadata and calling codes', () => {
    expect(colombia).toMatchObject({
      callingCode: '+57',
      displayName: 'Colombia',
      flag: '🇨🇴',
      regionCode: 'CO'
    })
    expect(getLumenPhoneCountries({ locale: 'en-US' }).length).toBeGreaterThan(200)
  })

  test('formats valid national numbers and returns E.164', () => {
    expect(resolveLumenPhoneNumber(colombia, '6015550123', { locale: 'en-US' }))
      .toMatchObject({
        country: { regionCode: 'CO' },
        e164: '+576015550123',
        isValid: true,
        nationalNumber: '(601) 5550123'
      })
  })

  test('keeps incomplete numbers editable without returning E.164', () => {
    const number = resolveLumenPhoneNumber(colombia, '60155')

    expect(number.isValid).toBe(false)
    expect(number.e164).toBeNull()
    expect(number.nationalNumber.replaceAll(/\D/g, '')).toBe('60155')
  })

  test('detects the country when an international number is pasted', () => {
    expect(resolveLumenPhoneNumber(colombia, '+1 212 555 0123', { locale: 'en-US' }))
      .toMatchObject({
        country: { callingCode: '+1', regionCode: 'US' },
        e164: '+12125550123',
        isValid: true,
        nationalNumber: '(212) 555-0123'
      })
  })

  test('sanitizes input linearly and exposes an empty controlled value', () => {
    expect(sanitizeLumenPhoneInput(' +57 (601) 555-0123 ext. 9 ')).toBe('+5760155501239')
    expect(createEmptyLumenPhoneNumber(colombia)).toEqual({
      country: colombia,
      e164: null,
      isValid: false,
      nationalNumber: ''
    })
    expect(getLumenPhoneCountry('ZZ')).toBeNull()
  })
})
