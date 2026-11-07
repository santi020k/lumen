import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, test } from 'vitest'

import {
  addReleaseAgeTarget,
  type ConsumerRolloutReport,
  consumerRolloutSucceeded,
  inspectLumenConsumer,
  resolveConsumerRolloutTargets,
  satisfiesNodeEngine,
  updateLumenManifestSource,
  updateLumenWorkspaceSource
} from './consumer-rollout.js'

describe('consumer rollout', () => {
  test('distinguishes an optional target version from repository paths', () => {
    expect(resolveConsumerRolloutTargets(['../site', '../dashboard'], '/workspace')).toEqual({
      repositories: ['../site', '../dashboard']
    })
    expect(resolveConsumerRolloutTargets(['1.2.3', '../site'], '/workspace')).toEqual({
      repositories: ['../site'],
      targetVersion: '1.2.3'
    })
    expect(resolveConsumerRolloutTargets([], '/workspace')).toEqual({
      repositories: ['/workspace']
    })
  })

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

  test('updates incompatible full catalog ranges and preserves compatible declarations and comments', () => {
    const source = [
      'catalogs:',
      '  web:',
      '    "@santi020k/lumen-astro": ">=4.0.0 <5" # upgrade',
      '    \'@santi020k/lumen-react\': \'^4 || ^5\' # keep',
      '    "@santi020k/lumen-elements": >=4 <5 # upgrade',
      ''
    ].join('\r\n')

    expect(updateLumenWorkspaceSource(source, '5.0.0', {
      '@santi020k/lumen-astro': '5.0.0',
      '@santi020k/lumen-react': '5.0.0',
      '@santi020k/lumen-elements': '5.0.0'
    }, true)).toBe(source.replace('>=4.0.0 <5', '5.0.0').replace('>=4 <5', '5.0.0'))
  })

  test.each(['app/package.json', 'pnpm-workspace.yaml', 'pnpm-lock.yaml'])(
    'refuses to follow a linked migration file: %s',
    async file => {
      const directory = await mkdtemp(join(tmpdir(), 'lumen-consumer-links-'))
      const repository = join(directory, 'consumer')
      const outside = join(directory, 'outside')
      const source = '{"dependencies":{"@santi020k/lumen-astro":"^4.4.0"}}'

      try {
        await mkdir(join(repository, 'app'), { recursive: true })
        await writeFile(join(repository, 'package.json'), source)
        await writeFile(outside, source)
        await symlink(outside, join(repository, file))

        await expect(inspectLumenConsumer(repository)).rejects.toThrow('Consumer migration requires a regular file')
        expect(await readFile(outside, 'utf8')).toBe(source)
      } finally {
        await rm(directory, { recursive: true, force: true })
      }
    }
  )

  test('evaluates complete Node engine ranges', () => {
    expect(satisfiesNodeEngine('~22.12.0', '22.12.9')).toBe(true)
    expect(satisfiesNodeEngine('~22.12.0', '22.13.0')).toBe(false)
    expect(satisfiesNodeEngine('22.x', '22.13.0')).toBe(true)
    expect(satisfiesNodeEngine('22.12.0 - 22.14.0', '22.13.0')).toBe(true)
  })

  test('preserves quoted and unquoted flow-style release-age exclusions', () => {
    const source = `
minimumReleaseAge: 1440
minimumReleaseAgeExclude: [webpack, "esbuild"]
`
    const updated = addReleaseAgeTarget(source, ['@santi020k/lumen-astro'], '0.2.0')

    expect(updated).toContain('  - "webpack"')
    expect(updated).toContain('  - "esbuild"')
    expect(updated).toContain('  - "@santi020k/lumen-astro@0.2.0"')
  })

  test.each(['', '  ', '    '])('preserves block sequence indentation %j and scopes release-age edits', indent => {
    const source = [
      'overridesList:',
      '- "@santi020k/lumen-astro@5.0.0"',
      'minimumReleaseAgeExclude: # keep this note',
      '# keep this comment',
      `${indent}- "webpack"`,
      'packages:',
      '  - apps/*',
      ''
    ].join('\r\n')
    const updated = addReleaseAgeTarget(source, ['@santi020k/lumen-astro'], '5.0.0')

    expect(updated).toBe(source.replace('\r\n# keep this comment', `\r\n${indent}- "@santi020k/lumen-astro@5.0.0"\r\n# keep this comment`))
    expect(addReleaseAgeTarget(updated, ['@santi020k/lumen-astro'], '5.0.0')).toBe(updated)
  })

  test('preserves comments and leaves a satisfied flow list byte-for-byte intact', () => {
    const source = 'minimumReleaseAgeExclude: [webpack, "@santi020k/lumen@5.0.0"]  # reviewed [keep]\r\n'

    expect(addReleaseAgeTarget(source, ['@santi020k/lumen'], '5.0.0')).toBe(source)
    expect(addReleaseAgeTarget(source, ['@santi020k/lumen-react'], '5.0.0'))
      .toContain('minimumReleaseAgeExclude:  # reviewed [keep]\r\n')
  })

  test('reports command and post-upgrade validation failures to the CLI', () => {
    const repository: ConsumerRolloutReport['repositories'][number] = {
      branch: 'main',
      commands: [{ command: 'corepack pnpm install', ok: false, output: 'failed' }],
      currentCommit: 'abc123',
      dirty: true,
      frameworks: ['astro'],
      integration: {
        catalogFingerprint: 'fixture',
        findings: [],
        frameworks: ['astro'],
        generatedAt: '2026-07-25T00:00:00.000Z',
        healthy: true,
        repository: '/consumer',
        runtimeComponents: []
      },
      nodeEngine: '>=22',
      nodeEngineSatisfied: true,
      packageManager: 'pnpm@10.32.1',
      references: [],
      repository: '/consumer',
      resolvedVersions: {},
      targetVersion: '0.2.0',
      valid: false,
      warnings: ['Upgrade did not complete.']
    }

    expect(consumerRolloutSucceeded({
      generatedAt: '2026-07-25T00:00:00.000Z',
      mode: 'apply',
      repositories: [repository],
      targetVersion: '0.2.0'
    })).toBe(false)
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
          '@santi020k/lumen-astro': 'catalog:',
          '@santi020k/lumen-react-native': 'catalog:'
        },
        name: 'site'
      }, undefined, 2)}\n`)
      await writeFile(join(root, 'pnpm-workspace.yaml'), `
packages:
  - apps/*
catalog:
  "@santi020k/lumen-astro": ^0.2.0
  "@santi020k/lumen-react-native": ^0.2.0
`)
      await writeFile(join(root, 'pnpm-lock.yaml'), `
packages:
  '@santi020k/lumen-astro@0.2.0': {}
  '@santi020k/lumen-core@0.2.0': {}
  '@santi020k/lumen-react-native@0.2.0': {}
`)

      const inventory = await inspectLumenConsumer(root, '0.2.0')

      expect(inventory.packageManager).toBe('pnpm@10.32.1')
      expect(inventory.frameworks).toEqual(['astro', 'react-native'])
      expect(inventory.references.map(item => item.source)).toEqual(
        expect.arrayContaining(['manifest', 'catalog', 'lockfile'])
      )
      expect(inventory.resolvedVersions).toEqual({
        '@santi020k/lumen-astro': ['0.2.0'],
        '@santi020k/lumen-core': ['0.2.0'],
        '@santi020k/lumen-react-native': ['0.2.0']
      })
      expect(inventory.warnings).not.toContain(expect.stringContaining('resolves'))
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })
})
