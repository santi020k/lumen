import type * as ChildProcess from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { consumerPackageVersion, consumerReleaseVersions } from './consumer-release-versions.js'
import { inspectLumenConsumer, runConsumerRollout, updateLumenManifestSource, updateLumenWorkspaceSource } from './consumer-rollout.js'
import { inspectLumenConsumerUpgrade } from './consumer-upgrade-audit.js'
import { migrateLumenVersion } from './version-migration.js'

const execution = vi.hoisted(() => ({
  run: vi.fn<(
    executable: string, args: string[], options: { cwd: string }
  ) => Promise<{ stdout: string, stderr: string }>>()
}))

vi.mock('node:child_process', async original => {
  const actual = await original<typeof ChildProcess>()
  const { promisify } = await import('node:util')
  const execFile = vi.fn(actual.execFile)

  Object.defineProperty(execFile, promisify.custom, { value: execution.run })

  return { ...actual, execFile }
})

const expected = {
  '@santi020k/lumen': '5.0.0',
  '@santi020k/lumen-astro': '5.0.0',
  '@santi020k/lumen-core': '5.0.0',
  '@santi020k/lumen-react-hook-form': '4.0.2',
  '@santi020k/lumen-icons-brand': '4.0.1',
  '@santi020k/lumen-react-native': '4.0.3',
  '@santi020k/lumen-tokens': '4.0.0'
}
const lock = (versions: Readonly<Record<string, string>>) => `packages:\n${Object.entries(versions)
  .map(([name, version]) => `  '${name}@${version}': {}`).join('\n')}\n`
const roots: string[] = []
const fixture = async () => {
  const root = await mkdtemp(join(tmpdir(), 'lumen-v5-versions-'))

  roots.push(root)
  await writeFile(join(root, 'package.json'), JSON.stringify({
    name: 'consumer',
    packageManager: 'pnpm@12.8.1',
    engines: { node: '>=22' },
    dependencies: {
      '@santi020k/lumen-astro': '^4.4.0',
      '@santi020k/lumen-react-hook-form': '^4.0.1',
      '@santi020k/lumen-icons-brand': '~4.0.0',
      '@santi020k/lumen-react-native': 'catalog:native',
      '@santi020k/lumen-tokens': 'catalog:',
      '@santi020k/lumen-core': 'workspace:*'
    }
  }))
  await writeFile(join(root, 'pnpm-workspace.yaml'), 'catalog:\n  \'@santi020k/lumen-tokens\': ^4.0.0\ncatalogs:\n  native:\n    \'@santi020k/lumen-react-native\': ~4.0.2\nminimumReleaseAgeExclude:\n  - "webpack"\n  - "@santi020k/lumen-react-hook-form@4.0.1"\n  - "@santi020k/lumen-react-native@4.0.2"\n  - "@santi020k/lumen-tokens@4.0.0"\n')
  await writeFile(join(root, 'pnpm-lock.yaml'), lock({ '@santi020k/lumen-react-hook-form': '4.0.1' }))
  await writeFile(join(root, 'Package.swift'), 'let version = "4.4.0"\n')
  await writeFile(join(root, 'build.gradle.kts'), 'implementation("io.github.santi020k:lumen-compose:4.0.1")\n')

  return root
}

beforeEach(() => execution.run.mockReset().mockResolvedValue({ stdout: '', stderr: '' }))
afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

test('uses the bundled release map and refuses unknown release/package guesses while keeping v4 scalar', async () => {
  expect(await consumerReleaseVersions('5.0.0')).toMatchObject(expected)
  await expect(consumerReleaseVersions('5.1.0')).rejects.toThrow('does not describe')
  await expect(consumerReleaseVersions('^5.0.0')).rejects.toThrow('exact semantic')
  expect(await consumerReleaseVersions('4.0.0')).toBeUndefined()
  expect(consumerPackageVersion('@santi020k/lumen-tokens', '4.0.0')).toBe('4.0.0')
  expect(() => consumerPackageVersion('@santi020k/lumen-unknown', '5.0.0', expected)).toThrow('no npm target')
})

test('updates direct ranges and named/default catalogs idempotently without changing indirection', async () => {
  const root = await fixture()
  const manifest = await readFile(join(root, 'package.json'), 'utf8')
  const updated = updateLumenManifestSource(manifest, '5.0.0', expected)

  expect(updated).toContain('"@santi020k/lumen-astro": "^5.0.0"')
  expect(updated).toContain('"@santi020k/lumen-react-hook-form": "^4.0.2"')
  expect(updated).toContain('"@santi020k/lumen-icons-brand": "~4.0.1"')
  expect(updated).toContain('"catalog:native"')
  expect(updated).toContain('"workspace:*"')
  expect(updateLumenManifestSource(updated, '5.0.0', expected)).toBe(updated)
  const workspace = updateLumenWorkspaceSource(await readFile(join(root, 'pnpm-workspace.yaml'), 'utf8'), '5.0.0', expected)

  expect(workspace).toContain('\'@santi020k/lumen-react-native\': ~4.0.3')
  expect(workspace).toContain('\'@santi020k/lumen-tokens\': ^4.0.0')
  expect(updateLumenWorkspaceSource(workspace, '5.0.0', expected)).toBe(workspace)
})

test('v5 dependency dry-run reports individual targets and leaves manifests, catalogs, locks and native pins untouched', async () => {
  const root = await fixture()
  const files = ['package.json', 'pnpm-workspace.yaml', 'pnpm-lock.yaml', 'Package.swift', 'build.gradle.kts']
  const before = await Promise.all(files.map(file => readFile(join(root, file), 'utf8')))
  const report = await migrateLumenVersion({ cwd: root, version: 'v5', dependencies: true })

  expect(report.packageVersions).toMatchObject(expected)
  expect(report.applied).toBe(false)
  expect(execution.run.mock.calls.filter(([command]) => command === 'corepack')).toHaveLength(0)
  expect(await Promise.all(files.map(file => readFile(join(root, file), 'utf8')))).toEqual(before)
})

test('applies exact mixed targets, restores range styles, cleans stale release-age exceptions and verifies the lock', async () => {
  const root = await fixture()

  execution.run.mockImplementation(async (executable, args, options) => {
    if (executable === 'corepack' && args.includes('update')) {
      await writeFile(join(options.cwd, 'pnpm-lock.yaml'), lock(expected))
      await writeFile(join(options.cwd, 'package.json'), '{}')
    }

    return { stdout: '', stderr: '' }
  })
  const report = await migrateLumenVersion({ cwd: root, version: 'v5', dependencies: true, apply: true, allowDirty: true })
  const update = execution.run.mock.calls.find(([command, args]) => command === 'corepack' && args.includes('update'))

  for (const [name, version] of Object.entries(expected).filter(([name]) => name !== '@santi020k/lumen')) {
    expect(update?.[1]).toContain(`${name}@${version}`)
  }

  expect(update?.[1]).toContain('@santi020k/lumen-react-hook-form@4.0.2')
  expect(update?.[1]).toContain('@santi020k/lumen-react-native@4.0.3')
  expect(update?.[1]).toContain('@santi020k/lumen-tokens@4.0.0')
  expect(update?.[1]).not.toContain('@santi020k/lumen-react-hook-form@5.0.0')
  expect(report.dependencies?.repositories[0]?.warnings).toEqual([])
  expect(report.consumerAudit?.findings.filter(finding => finding.classification === 'compatibility-failure')).toEqual([])
  const workspace = await readFile(join(root, 'pnpm-workspace.yaml'), 'utf8')

  expect(workspace).toContain('"webpack"')
  expect(workspace).toContain('"@santi020k/lumen-react-hook-form@4.0.2"')
  expect(workspace).not.toContain('"@santi020k/lumen-react-hook-form@4.0.1"')
  expect(workspace).not.toContain('"@santi020k/lumen-react-native@4.0.2"')
  expect(await readFile(join(root, 'package.json'), 'utf8')).toContain('"^4.0.2"')
  expect(await readFile(join(root, 'Package.swift'), 'utf8')).toBe('let version = "4.4.0"\n')
  expect(await readFile(join(root, 'build.gradle.kts'), 'utf8')).toContain('lumen-compose:4.0.1')
})

test('rejects wrong resolved companion versions even when declared ranges include their correct targets', async () => {
  const root = await fixture()

  await writeFile(join(root, 'package.json'), updateLumenManifestSource(await readFile(join(root, 'package.json'), 'utf8'), '5.0.0', expected))
  await writeFile(join(root, 'pnpm-workspace.yaml'), updateLumenWorkspaceSource(await readFile(join(root, 'pnpm-workspace.yaml'), 'utf8'), '5.0.0', expected))
  await writeFile(join(root, 'pnpm-lock.yaml'), lock({ ...expected, '@santi020k/lumen-react-hook-form': '5.0.0' }))
  const audit = await inspectLumenConsumerUpgrade(root, '5.0.0')

  const failures = audit.findings.filter(finding => finding.rule === 'consumer-resolved-version')

  expect(failures).toHaveLength(1)
  expect(failures[0]?.message).toContain('target is 4.0.2')
  expect(failures[0]?.classification).toBe('compatibility-failure')
  expect((await inspectLumenConsumer(root, '5.0.0')).warnings).toContain('@santi020k/lumen-react-hook-form resolves 5.0.0 instead of only 4.0.2.')
  await expect(runConsumerRollout({ repositories: [root], targetVersion: '5.1.0', apply: true })).rejects.toThrow('does not describe')
})
