import { describe, expect, test } from 'vitest'

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
  test('returns the complete breaking web inventory for each adapter', () => {
    for (const packageName of ['@santi020k/lumen-astro', '@santi020k/lumen-react', '@santi020k/lumen-elements']) {
      const result = getMigration({ packageName })

      expect(result.data.changes.map(change => change.id)).toEqual(expect.arrayContaining(webChanges))
      expect(result.data.status).toBe('draft')
      expect(result.text).toContain('visualSize')
    }
  })

  test('keeps web-only renames out of Swift migration results', () => {
    const result = getMigration({ packageName: 'LumenUI' })

    expect(result.data.changes.map(change => change.id)).not.toEqual(expect.arrayContaining(webChanges))
    expect(result.data.changes.every(change => !change.id.startsWith('web-'))).toBe(true)
  })
})
