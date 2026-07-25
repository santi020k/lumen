import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, test } from 'vitest'

import {
  inspectLumenConsumer,
  updateLumenManifestSource,
  updateLumenWorkspaceSource
} from './consumer-rollout.js'

describe('consumer rollout', () => {
  test('preserves catalog indirection and semver range style in manifests', () => {
    const source = `${JSON.stringify({
      dependencies: {
        '@santi020k/lumen-astro': 'catalog:',
        '@santi020k/lumen-react': '^0.1.0',
        astro: '^7.0.0'
      },
      devDependencies: {
        '@santi020k/lumen-core': '~0.1.0'
      },
      name: 'consumer'
    }, undefined, 2)}\n`
    const updated = JSON.parse(updateLumenManifestSource(source, '0.2.0')) as {
      dependencies: Record<string, string>
      devDependencies: Record<string, string>
    }

    expect(updated.dependencies['@santi020k/lumen-astro']).toBe('catalog:')
    expect(updated.dependencies['@santi020k/lumen-react']).toBe('^0.2.0')
    expect(updated.devDependencies['@santi020k/lumen-core']).toBe('~0.2.0')
    expect(updated.dependencies.astro).toBe('^7.0.0')
  })

  test('updates all catalog packages as one release unit', () => {
    const source = `
catalog:
  "@santi020k/lumen": 0.1.0
  "@santi020k/lumen-astro": ^0.1.0
  unrelated: 0.1.0
`

    expect(updateLumenWorkspaceSource(source, '0.2.0')).toContain('"@santi020k/lumen": 0.2.0')
    expect(updateLumenWorkspaceSource(source, '0.2.0')).toContain('"@santi020k/lumen-astro": ^0.2.0')
    expect(updateLumenWorkspaceSource(source, '0.2.0')).toContain('unrelated: 0.1.0')
  })

  test('inventories manifests, catalogs, lock files, frameworks, and environment contracts', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-consumer-'))

    try {
      await mkdir(join(root, 'apps', 'site'), { recursive: true })
      await writeFile(join(root, 'package.json'), `${JSON.stringify({
        engines: { node: '>=22' },
        name: 'workspace',
        packageManager: 'pnpm@10.32.1'
      }, undefined, 2)}\n`)
      await writeFile(join(root, 'apps', 'site', 'package.json'), `${JSON.stringify({
        dependencies: {
          '@santi020k/lumen-astro': 'catalog:'
        },
        name: 'site'
      }, undefined, 2)}\n`)
      await writeFile(join(root, 'pnpm-workspace.yaml'), `
packages:
  - apps/*
catalog:
  "@santi020k/lumen-astro": ^0.2.0
`)
      await writeFile(join(root, 'pnpm-lock.yaml'), `
packages:
  '@santi020k/lumen-astro@0.2.0': {}
  '@santi020k/lumen-core@0.2.0': {}
`)

      const inventory = await inspectLumenConsumer(root, '0.2.0')

      expect(inventory.packageManager).toBe('pnpm@10.32.1')
      expect(inventory.frameworks).toEqual(['astro'])
      expect(inventory.references.map(item => item.source)).toEqual(
        expect.arrayContaining(['manifest', 'catalog', 'lockfile'])
      )
      expect(inventory.resolvedVersions).toEqual({
        '@santi020k/lumen-astro': ['0.2.0'],
        '@santi020k/lumen-core': ['0.2.0']
      })
      expect(inventory.warnings).not.toContain(expect.stringContaining('resolves'))
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })
})
