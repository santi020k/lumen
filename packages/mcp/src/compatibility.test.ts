import { describe, expect, test } from 'vitest'

import { checkCompatibility } from './compatibility.js'
import { loadLumenData } from './data.js'

describe('installed version compatibility', () => {
  test('accepts only resolved exact matches including native packages', () => {
    const versions = loadLumenData().meta.packageVersions
    expect(checkCompatibility({ packageVersions: {
      '@santi020k/lumen-react': versions['@santi020k/lumen-react'] ?? '',
      LumenUI: versions.LumenUI ?? '',
      'com.santi020k:lumen-compose': versions['com.santi020k:lumen-compose'] ?? ''
    } }).data.compatible).toBe(true)
    expect(versions.LumenUI).not.toBe('workspace')
  })

  test.each(['3.0.1', '^4.0.0', '4.0.1', '4.0.0-beta.1', 'workspace:*'])('does not claim compatibility for %s', version => {
    const result = checkCompatibility({ packageVersions: { '@santi020k/lumen-react': version } })
    expect(result.data.compatible).toBe(false)
    expect(result.data.checks[0]?.status).toBe('mismatch')
    expect(result.data.guidance).toContain('installed public types')
  })

  test('unknown packages and empty inventory require local verification', () => {
    expect(checkCompatibility({ packageVersions: {} }).data.compatible).toBe(false)
    expect(checkCompatibility({ packageVersions: { other: '4.0.0' } }).data.checks).toEqual([
      { catalogVersion: null, installedVersion: '4.0.0', packageName: 'other', status: 'unknown' }
    ])
  })
})
