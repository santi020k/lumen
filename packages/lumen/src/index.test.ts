import { describe, expect, test } from 'vitest'

import {
  lumen,
  lumenComponentNames,
  lumenPackages
} from './index.js'

describe('@santi020k/lumen umbrella package', () => {
  test('exports umbrella metadata and shared package metadata', () => {
    expect(lumen).toEqual({
      name: 'Lumen',
      packageName: '@santi020k/lumen',
      scope: '@santi020k'
    })

    expect(lumenComponentNames).toContain('Button')

    expect(lumenPackages.some(pkg => pkg.packageName === lumen.packageName)).toBe(true)
  })
})
