import { describe, expect, test } from 'vitest'

import { isLumenDecimalInBounds, isLumenTimeInBounds, isLumenTimeSelection, normalizeLumenNumericOTP, parseLumenDecimalDraft, stepLumenDecimalDraft } from './native-input.js'

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
  test('parses locale digits outside the Unicode decimal number category', () => {
    const locale = 'en-US-u-nu-hanidec'
    const formatter = new Intl.NumberFormat(locale, { useGrouping: false })
    const draft = formatter.format(12.3)

    expect(parseLumenDecimalDraft(draft, locale)).toEqual({ coefficient: 123n, kind: 'valid', scale: 1 })
    for (let digit = 0; digit < 10; digit += 1) {
      expect(parseLumenDecimalDraft(formatter.format(digit), locale)).toEqual({ coefficient: BigInt(digit), kind: 'valid', scale: 0 })
    }
    expect(parseLumenDecimalDraft('Ⅻ', locale).kind).toBe('invalid')
    expect(normalizeLumenNumericOTP(formatter.format(123))).toBeNull()
    expect(isLumenDecimalInBounds(draft, { locale, min: '12', max: '13' })).toBe(true)
    expect(stepLumenDecimalDraft(draft, 1, { locale, step: '0.2' })).toBe(formatter.format(12.5))
    expect(parseLumenDecimalDraft(draft, 'en-US').kind).toBe('invalid')

    const firstStep = stepLumenDecimalDraft('', 1, { locale })

    expect(firstStep).toBe(formatter.format(1))
    if (firstStep === null) throw new Error('Expected a localized decimal step')
    expect(stepLumenDecimalDraft(firstStep, 1, { locale })).toBe(formatter.format(2))
    expect(stepLumenDecimalDraft(`-${draft}`, -1, { locale, step: '0.2' })).toBe(`-${formatter.format(12.5)}`)
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

test.each([null,
  undefined,
  0,
  '12:00',
  [],
  {},
  { hour: 12 },
  { hour: '12', minute: 0 },
  { hour: 12, minute: null },
  { hour: NaN, minute: 0 },
  { hour: 12, minute: Infinity },
  { hour: -1, minute: 0 },
  { hour: 12, minute: 60 },
  { hour: 1.5, minute: 0 }
])('time validators reject malformed decoded selections safely: %j', value => {
  expect(isLumenTimeSelection(value)).toBe(false)
  expect(isLumenTimeInBounds(value)).toBe(false)
})

test('time selection predicates narrow valid decoded midnight and end-of-day values', () => {
  for (const value of [{ hour: 0, minute: 0 }, { hour: 23, minute: 59 }]) {
    const decoded: unknown = value
    expect(isLumenTimeSelection(decoded)).toBe(true)
    if (!isLumenTimeSelection(decoded)) throw new Error('Expected valid decoded time')
    expect(isLumenTimeInBounds(decoded, value, value)).toBe(true)
  }
})
