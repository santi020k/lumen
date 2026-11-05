import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, test } from 'vitest'

import { formatLumenConsumerUpgradeAudit, inspectLumenConsumerUpgrade } from './consumer-upgrade-audit.js'
import { loadLumenV5Contract } from './v5-contract.js'
import { formatLumenVersionMigration, migrateLumenVersion, migrateLumenVersionSource } from './version-migration.js'

test.each(['View.tsx', 'Page.astro', 'styles.css', 'Screen.swift'])('v5 never replays v4 source transforms in %s', file => {
  const source = 'import { Stack, Select } from "@santi020k/lumen-react"\n' +
    'import { Client } from "@modelcontextprotocol/sdk/client/index.js"\n' +
    '<Stack gap="md"><Select size="sm" /></Stack>\n' + '/* Lumen */'.repeat(20_000)

  expect(migrateLumenVersionSource(source, file, 'v5')).toEqual({ changes: [], manualReview: [], source })
})

test('v5 apply preserves source, CSS, patches and v4 ledgers while reporting explicit target evidence', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lumen-v5-review-'))
  const external = await mkdtemp(join(tmpdir(), 'lumen-v5-ledger-'))
  const files = {
    'package.json': JSON.stringify({
      packageManager: 'pnpm@12.8.1',
      dependencies: { '@santi020k/lumen-astro': '^4.4.0' },
      scripts: { check: 'lumen doctor' }
    }),
    'View.astro': 'import { Stack } from "@santi020k/lumen-astro"\n<Stack gap="md" />\n<script>LumenInitUiPrimitives(document)</script>',
    'styles.css': '@import "@santi020k/lumen/styles.css"; .ui-timeline { margin: 1rem; }',
    'lumen.patch': 'diff --git a/runtime/UIPrimitives.astro b/runtime/UIPrimitives.astro'
  }

  try {
    await writeFile(join(external, 'migrations-v4.json'), '{"untouched":true}')
    await symlink(external, join(root, '.lumen'))
    for (const [file, source] of Object.entries(files)) await writeFile(join(root, file), source)
    const preview = await migrateLumenVersion({ cwd: root, version: 'v5' })
    const applied = await migrateLumenVersion({ cwd: root, version: 'v5', apply: true })

    expect(applied.changedFiles).toEqual([])
    expect(applied.changes).toEqual([])
    expect(applied.dependencies).toBeUndefined()
    expect(applied.dependencyVersion).toBe('5.0.0')
    expect(applied.consumerAudit).toEqual(preview.consumerAudit)
    const contract = await loadLumenV5Contract()
    expect(applied.consumerAudit?.contract).toEqual({ targetVersion: '5.0.0', status: contract.status, publication: contract.publication })
    const findings = applied.consumerAudit?.findings ?? []

    expect(findings).toContainEqual(expect.objectContaining({ rule: 'consumer-package-version', classification: 'compatibility-failure' }))
    expect(findings).toContainEqual(expect.objectContaining({ rule: 'async-astro-runtime', classification: 'compatibility-review' }))
    expect(findings).toContainEqual(expect.objectContaining({ rule: 'runtime-only-adapters', classification: 'compatibility-review' }))
    expect(findings).toContainEqual(expect.objectContaining({ rule: 'component-css', classification: 'adoption-opportunity' }))
    expect(formatLumenVersionMigration(applied)).toContain('no automatic source rewrites')
    for (const [file, source] of Object.entries(files)) expect(await readFile(join(root, file), 'utf8')).toBe(source)
    expect(await readFile(join(external, 'migrations-v4.json'), 'utf8')).toBe('{"untouched":true}')
  } finally {
    await rm(root, { force: true, recursive: true })
    await rm(external, { force: true, recursive: true })
  }
})

test('adoption is target-specific and never inferred from domain component names', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lumen-v5-adoption-'))

  try {
    await writeFile(join(root, 'package.json'), JSON.stringify({ dependencies: { '@santi020k/lumen-react': '^5.0.0' } }))
    await writeFile(join(root, 'Domain.tsx'), 'import { Button, Timeline, Share } from "./domain"; export const View = () => <Button />')
    await mkdir(join(root, 'node_modules'))
    await writeFile(join(root, 'node_modules/ignored.css'), '@import "@santi020k/lumen/styles.css"')
    const report = await inspectLumenConsumerUpgrade(root, '5.0.0')

    expect(report.findings).toEqual([])
    expect(formatLumenConsumerUpgradeAudit(report)).toContain('not evidence of registry availability')
    const old = await inspectLumenConsumerUpgrade(root, '4.0.0')

    expect(old.contract).toBeUndefined()
    expect(old.findings.every(finding => finding.classification !== 'adoption-opportunity')).toBe(true)
    expect(old.findings[0]?.remediation).toContain('migrate v4')
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})
