import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, test } from 'vitest'

import { bundledReleaseTarget } from './consumer-release-versions.js'
import { runConsumerRollout } from './consumer-rollout.js'
import { inspectLumenConsumerUpgrade } from './consumer-upgrade-audit.js'

describe('consumer upgrade review signals', () => {
  test('reports installed versions, patches and selectors without modifying consumer files', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-upgrade-audit-'))

    try {
      await mkdir(join(root, 'patches'))
      await mkdir(join(root, 'node_modules'))

      const manifest = JSON.stringify({ packageManager: 'pnpm@12.8.1', dependencies: { '@santi020k/lumen-react': '^2.1.0', '@santi020k/lumen-core': 'catalog:' } })

      await writeFile(join(root, 'package.json'), manifest)
      await writeFile(join(root, 'pnpm-lock.yaml'), 'packages:\n  \'@santi020k/lumen-react@2.1.0\': {}')
      await writeFile(join(root, 'pnpm-workspace.yaml'), 'catalog:\n  "@santi020k/lumen-core": 3.0.0\npatchedDependencies:\n  "@santi020k/lumen-react@2.1.0": patches/lumen.patch\n')
      await writeFile(join(root, 'patches/lumen.patch'), 'diff --git a/dist/chart.js b/dist/chart.js')
      await writeFile(join(root, 'styles.css'), '.ui-line-chart { padding: 0 }')
      await writeFile(join(root, 'node_modules/ignored.css'), '.ui-button { color: red }')
      await symlink(join(root, 'styles.css'), join(root, 'linked.css'))

      const report = await inspectLumenConsumerUpgrade(root)

      expect(report.findings.filter(item => item.rule === 'migration-history-review').map(item => item.remediation)).toEqual([
        'https://github.com/santi020k/lumen/blob/main/docs/migrating-v2-to-v3.md',
        'https://github.com/santi020k/lumen/blob/main/docs/migrating-v3-to-v4.md',
        'https://github.com/santi020k/lumen/blob/main/docs/migrating-v4-to-v5.md'
      ])
      expect(report.findings.map(item => item.rule)).toContain('consumer-package-version')
      expect(report.findings.map(item => item.rule)).toContain('consumer-resolved-version')
      expect(report.findings.map(item => item.rule)).toContain('consumer-patch-configuration')
      expect(report.findings.filter(item => item.rule === 'consumer-package-patch')).toHaveLength(1)
      expect(report.findings.filter(item => item.rule === 'consumer-css-review')).toHaveLength(1)
      expect(await readFile(join(root, 'package.json'), 'utf8')).toBe(manifest)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  test('uses independent targets and detects a stale shared umbrella in a pnpm graph', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-release-audit-'))

    try {
      const manifestPath = join(root, 'release-manifest.json')
      const packages = {
        '@santi020k/lumen': { version: '4.2.0' },
        '@santi020k/lumen-astro': { version: '4.1.0' },
        '@santi020k/lumen-core': { version: '4.1.0' },
        '@santi020k/lumen-react': { version: '4.1.0' },
        '@santi020k/lumen-react-native': { version: '4.0.1' }
      }

      await writeFile(manifestPath, JSON.stringify({ release: {
        compose: { version: '4.0.0' }, npm: { packages }, swift: { tag: 'v4.2.0' }, version: '4.2.0'
      } }))
      await expect(inspectLumenConsumerUpgrade(root, '5.0.0', manifestPath)).rejects.toThrow('before v5')
      await expect(runConsumerRollout({ manifestPath, repositories: [root], targetVersion: '5.0.0' }))
        .rejects.toThrow('before v5')
      await expect(inspectLumenConsumerUpgrade(root, '4.3.0', manifestPath)).rejects.toThrow('must match')
      const consumerManifest = JSON.stringify({
        dependencies: { '@santi020k/lumen-astro': 'catalog:web', '@santi020k/lumen-react': '^4.1.0', '@santi020k/lumen-react-native': '4.0.1' },
        packageManager: 'pnpm@12.8.1'
      })

      await writeFile(join(root, 'package.json'), consumerManifest)
      await writeFile(join(root, 'pnpm-workspace.yaml'), 'catalogs:\n  web:\n    "@santi020k/lumen-astro": ^4.1.0\n')
      const lockPath = join(root, 'pnpm-lock.yaml')
      const lock = `lockfileVersion: '9.0'\npackages:\n${Object.entries(packages).map(([name, { version }]) => `  '${name}@${version}': {}\n`).join('')}`

      await writeFile(lockPath, lock.replace('lumen@4.2.0', 'lumen@4.1.0'))
      const stale = await inspectLumenConsumerUpgrade(root, '4.2.0', manifestPath)

      expect(stale.findings).toEqual([expect.objectContaining({
        rule: 'consumer-resolved-version'
      })])

      expect(stale.findings[0]?.remediation).toContain('Refresh the transitive umbrella')

      await writeFile(lockPath, lock)
      const report = await runConsumerRollout({ manifestPath, repositories: [root], targetVersion: '4.2.0' })

      expect(report.repositories[0]?.warnings).toEqual([])
      expect(report.nativeTargets).toEqual({ composeVersion: '4.0.0', swiftTag: 'v4.2.0' })
      expect((await inspectLumenConsumerUpgrade(root, '4.2.0', manifestPath)).findings).toEqual([])

      await writeFile(lockPath, lock.replace('lumen@4.2.0', 'lumen@4.3.0'))
      await expect(runConsumerRollout({ apply: true, manifestPath, repositories: [root], targetVersion: '4.2.0' }))
        .rejects.toThrow('would downgrade @santi020k/lumen')
      expect(await readFile(join(root, 'package.json'), 'utf8')).toBe(consumerManifest)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  test('accepts target-compatible ranges and rejects an invalid target', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-upgrade-audit-'))

    try {
      await writeFile(join(root, 'package.json'), JSON.stringify({ dependencies: { '@santi020k/lumen-react': '^4.0.0' } }))

      expect((await inspectLumenConsumerUpgrade(root, '4.0.0')).findings).toEqual([])
      expect((await inspectLumenConsumerUpgrade(root)).targetVersion).toBe(await bundledReleaseTarget())

      await expect(inspectLumenConsumerUpgrade(root, 'latest')).rejects.toThrow('exact semantic')
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
