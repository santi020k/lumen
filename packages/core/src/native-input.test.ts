import { describe, expect, test } from 'vitest'

import { isLumenDecimalInBounds, isLumenTimeInBounds, normalizeLumenNumericOTP, parseLumenDecimalDraft, stepLumenDecimalDraft } from './native-input.js'

describe('native input contracts', () => {
  test('preserves empty and intermediate localized decimal drafts', () => {
    expect(parseLumenDecimalDraft('')).toEqual({ kind: 'empty' })
    for (const draft of ['-', '.', '-.', '12.']) expect(parseLumenDecimalDraft(draft).kind).toBe('incomplete')
    expect(parseLumenDecimalDraft('١٢٫٣', 'ar-EG')).toEqual({ coefficient: 123n, kind: 'valid', scale: 1 })
    expect(parseLumenDecimalDraft('-12,3', 'es-CO')).toEqual({ coefficient: -123n, kind: 'valid', scale: 1 })
  })
  test('rejects grouping, exponents, whitespace, malformed and adversarial drafts', () => {
    for (const draft of ['1,234', '1e3', ' 2', '--2', '1.2.3', '9'.repeat(100_000)]) {
      expect(parseLumenDecimalDraft(draft).kind).toBe('invalid')
    }
    expect(stepLumenDecimalDraft('12.', 1)).toBeNull()
  })
  test('steps exactly beyond floating point precision and clamps inclusive bounds', () => {
    expect(stepLumenDecimalDraft('9007199254740993.1', 1, { step: '0.2' }))
      .toBe('9007199254740993.3')
    expect(stepLumenDecimalDraft('0,1', 1, { locale: 'es-CO', step: '0.2' })).toBe('0,3')
    expect(stepLumenDecimalDraft('9.9', 1, { max: '10', step: '0.2' })).toBe('10')
    expect(stepLumenDecimalDraft('-0.1', -1, { min: '-0.2', step: '0.2' })).toBe('-0.2')
    expect(stepLumenDecimalDraft('', 1, { min: '5' })).toBe('6')
    expect(isLumenDecimalInBounds('10', { max: '10' })).toBe(true)
    expect(isLumenDecimalInBounds('10.01', { max: '10' })).toBe(false)
    expect(() => stepLumenDecimalDraft('1', 1, { step: '0' })).toThrow(RangeError)
    expect(() => stepLumenDecimalDraft('1', 1, { step: '١' })).toThrow(RangeError)
    expect(() => stepLumenDecimalDraft('1', 1, { max: '1', min: '2' })).toThrow(RangeError)
  })
  test('normalizes pasted codes and rejects excess digits or unrelated text', () => {
    expect(normalizeLumenNumericOTP('١٢٣-４５６')).toBe('123456')
    expect(normalizeLumenNumericOTP('123 456')).toBe('123456')
    expect(normalizeLumenNumericOTP('1234567')).toBeNull()
    expect(normalizeLumenNumericOTP('code 123456')).toBeNull()
    expect(normalizeLumenNumericOTP('1'.repeat(100_000))).toBeNull()
    expect(() => normalizeLumenNumericOTP('1', 13)).toThrow(RangeError)
  })
  test('validates same-day wall-clock values and inclusive bounds', () => {
    expect(isLumenTimeInBounds({ hour: 9, minute: 30 }, { hour: 9, minute: 30 }, { hour: 17, minute: 0 })).toBe(true)
    expect(isLumenTimeInBounds({ hour: 24, minute: 0 })).toBe(false)
    expect(isLumenTimeInBounds({ hour: 8, minute: 59 }, { hour: 9, minute: 0 })).toBe(false)
    expect(() => isLumenTimeInBounds(
      { hour: 12, minute: 0 }, { hour: 17, minute: 0 }, { hour: 9, minute: 0 }
    )).toThrow(RangeError)
  })
})

test.each(['invalid_tag', 'en--US', '💥'])('uses English decimal symbols for malformed locale %s', locale => {
  expect(parseLumenDecimalDraft('-12.3', locale)).toEqual({ coefficient: -123n, kind: 'valid', scale: 1 })
  expect(parseLumenDecimalDraft('12,3', locale).kind).toBe('invalid')
  expect(isLumenDecimalInBounds('1.5', { locale, min: '1', max: '2' })).toBe(true)
  expect(stepLumenDecimalDraft('1.5', 1, { locale, step: '0.2' })).toBe('1.7')
})
