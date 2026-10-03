// cspell:words Elegir fecha enero
import { describe, expect, test } from 'vitest'

import { isLumenDateBoundsValid, isLumenDateRangeValid, parseLumenDate, resolveLumenDateLabels, resolveLumenDateLocale } from './dates.js'

describe('Gregorian date contracts', () => {
  test.each([null, undefined, 20260101, ['2026-01-01'], {}])('rejects non-string input (%#)', value => {
    expect(parseLumenDate(value)).toBeNull()
  })

  test.each(['0001-01-01', '0099-12-31', '2000-02-29', '2024-02-29', '9999-12-31'])('accepts %s exactly', value => {
    expect(parseLumenDate(value)?.toISOString().slice(0, 10)).toBe(value)
  })

  test.each(['', '0000-01-01', '2026-2-01', '2026-02-29', '1900-02-29', '2026-04-31', '2026-00-10', '2026-13-01', '2026-01-00', '+010000-01-01', '2026-01-01T12:00Z', '1'.repeat(100_000)])('rejects invalid dates without normalization (%#)', value => {
    expect(parseLumenDate(value)).toBeNull()
  })

  test('checks complete ordered ranges and inclusive real bounds', () => {
    const range = { start: '2026-01-01', end: '2026-01-31' }

    expect(isLumenDateRangeValid(range, range.start, range.end)).toBe(true)
    expect(isLumenDateRangeValid({ start: range.end, end: range.start })).toBe(false)
    expect(isLumenDateRangeValid(range, '2026-01-02')).toBe(false)
    expect(isLumenDateRangeValid(range, undefined, '2026-01-30')).toBe(false)
    expect(isLumenDateBoundsValid('2026-02-30')).toBe(false)
    expect(isLumenDateBoundsValid('2026-02-01', '2026-01-01')).toBe(false)
    expect(isLumenDateBoundsValid()).toBe(true)
    expect(isLumenDateBoundsValid('')).toBe(false)
  })

  test('normalizes locale tags safely and supplies English/Spanish label defaults', () => {
    expect(resolveLumenDateLocale('es-co')).toBe('es-CO')
    expect(resolveLumenDateLocale('not_a_locale')).toBe('en')
    expect(resolveLumenDateLabels('es-CO').previousMonth).toBe('Mes anterior')
    expect(resolveLumenDateLabels('es').chooseDate).toBe('Elegir fecha')
    expect(resolveLumenDateLabels('fr').chooseDate).toBe('Choose date')
  })
})
