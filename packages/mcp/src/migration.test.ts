import { describe, expect, test } from 'vitest'

import { loadLumenData } from './data.js'
import { getMigration } from './migration.js'

const webChanges = [
  'web-content-flow',
  'web-control-visual-size',
  'web-form-value-ownership',
  'web-combobox-focus',
  'web-phone-input-identity',
  'web-virtual-list-ranges',
  'web-rich-text-command-ownership'
]

describe('v4 migration inventory', () => {
  test('selects v5 explicitly and separates optional adoption from contract reviews', () => {
    const result = getMigration({ targetVersion: '5.0.0', packageName: '@santi020k/lumen-astro' })

    expect(result.data.targetVersion).toBe('5.0.0')
    expect(result.data.contractSource).toBe('registry/lumen-5-contract.json')
    expect(result.data.publication).toBe('unverified')
    expect(result.data.changes).toContainEqual(expect.objectContaining({
      id: 'async-astro-runtime', classification: 'compatibility-review'
    }))
    expect(result.data.changes).toContainEqual(expect.objectContaining({
      id: 'component-css', classification: 'adoption-opportunity'
    }))
    expect(result.data.changes.some(change => webChanges.includes(change.id))).toBe(false)
    expect(result.text).toContain('migrate v5 --dry-run --json')
    expect(result.text).toContain('does not establish registry availability')
    expect(getMigration().data.targetVersion).toBe('5.0.0')
  })

  test('keeps bundled v5 minor and patch releases on the v5 migration contract', () => {
    const data = loadLumenData()
    const fixture = {
      ...data,
      releaseManifest: {
        ...data.releaseManifest,
        release: { ...data.releaseManifest.release, version: '5.2.1' }
      }
    }
    const result = getMigration({}, fixture)

    expect(result.data.contractSource).toBe('registry/lumen-5-contract.json')
    expect(result.text).toContain('migrate v5 --dry-run --json')
  })

  test('returns the complete breaking web inventory for each adapter', () => {
    for (const packageName of ['@santi020k/lumen-astro', '@santi020k/lumen-react', '@santi020k/lumen-elements']) {
      const result = getMigration({ packageName, targetVersion: '4.0.0' })

      expect(result.data.changes.map(change => change.id)).toEqual(expect.arrayContaining(webChanges))
      expect(result.data.status).toBe(loadLumenData().migration.status)
      expect(result.text).toContain('visualSize')
    }
  })

  test.each(['draft', 'approved'])('preserves the %s publication status without changing inventory', status => {
    const data = loadLumenData()
    const fixture = { ...data, migration: { ...data.migration, status } }
    const result = getMigration({ targetVersion: '4.0.0' }, fixture)

    expect(result.data.status).toBe(status)
    expect(result.text).toContain(`migration (${status})`)
    expect(result.data.changes).toHaveLength(data.migration.changes.length)
  })

  test('keeps web-only renames out of Swift migration results', () => {
    const result = getMigration({ packageName: 'LumenUI' })

    expect(result.data.changes.map(change => change.id)).not.toEqual(expect.arrayContaining(webChanges))
    expect(result.data.changes.every(change => !change.id.startsWith('web-'))).toBe(true)
  })
})

test.each(['astro', 'react', 'elements'])('v5 palette guidance reaches %s consumers', adapter => {
  const result = getMigration({ targetVersion: '5.0.0', packageName: `@santi020k/lumen-${adapter}` })

  expect(result.data.changes.map(change => change.id)).toContain('default-palette-refresh')
})
