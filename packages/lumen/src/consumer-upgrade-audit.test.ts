import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, test } from 'vitest'

import { inspectLumenConsumerUpgrade } from './consumer-upgrade-audit.js'

describe('consumer upgrade review signals', () => {
  test('reports installed versions, patches and selectors without modifying consumer files', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-upgrade-audit-'))

    try {
      await mkdir(join(root, 'patches'))
      await mkdir(join(root, 'node_modules'))

      const manifest = JSON.stringify({ packageManager: 'pnpm@12.8.1', dependencies: { '@santi020k/lumen-react': '^2.1.0', '@santi020k/lumen-core': 'catalog:' } })

      await writeFile(join(root, 'package.json'), manifest)
      await writeFile(join(root, 'pnpm-lock.yaml'), '\'@santi020k/lumen-react@2.1.0\': {}')
      await writeFile(join(root, 'pnpm-workspace.yaml'), 'catalog:\n  "@santi020k/lumen-core": 3.0.0\npatchedDependencies:\n  "@santi020k/lumen-react@2.1.0": patches/lumen.patch\n')
      await writeFile(join(root, 'patches/lumen.patch'), 'diff --git a/dist/chart.js b/dist/chart.js')
      await writeFile(join(root, 'styles.css'), '.ui-line-chart { padding: 0 }')
      await writeFile(join(root, 'node_modules/ignored.css'), '.ui-button { color: red }')
      await symlink(join(root, 'styles.css'), join(root, 'linked.css'))

      const report = await inspectLumenConsumerUpgrade(root)

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

  test('accepts target-compatible ranges and rejects an invalid target', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-upgrade-audit-'))

    try {
      await writeFile(join(root, 'package.json'), JSON.stringify({ dependencies: { '@santi020k/lumen-react': '^4.0.0' } }))

      expect((await inspectLumenConsumerUpgrade(root)).findings).toEqual([])

      await expect(inspectLumenConsumerUpgrade(root, 'latest')).rejects.toThrow('exact semantic')
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
