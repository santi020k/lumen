import { describe, expect, test } from 'vitest'

import {
  formatLumenLanguageLabel,
  getLumenLocalePair,
  normalizeLumenLocales
} from './language.js'

describe('language toggle contracts', () => {
  test('normalizes unique non-empty locale options', () => {
    expect(normalizeLumenLocales([
      { label: ' English ', value: ' en ' },
      { label: 'Duplicate', value: 'en' },
      { label: '', value: 'fr' }
    ])).toEqual([{ label: 'English', value: 'en' }])
  })

  test('cycles locale options and formats accessible labels', () => {
    const locales = normalizeLumenLocales([
      { label: 'English', value: 'en' },
      { label: 'Español', value: 'es' }
    ])
    const pair = getLumenLocalePair(locales, 'es')

    expect(pair.next.value).toBe('en')
    expect(formatLumenLanguageLabel('Change from {current} to {next}', pair.current, pair.next))
      .toBe('Change from Español to English')
  })
})
