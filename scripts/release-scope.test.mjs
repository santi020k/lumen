import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  classifyReleasePackages,
  mergeReleasePackageNames,
  selectPendingReleaseNames
} from './release-scope.mjs'

const readPendingChangesetPlan = async root => {
  const pending = (await readdir(join(root, '.changeset')))
    .filter(name => name.endsWith('.md') && name !== 'README.md')

  // Version preparation consumes the notes; an empty directory is a valid release state.
  if (pending.length === 0) return []

  const directory = await mkdtemp(join(tmpdir(), 'lumen-changeset-regression-'))
  const output = join(directory, 'status.json')

  try {
    const cli = fileURLToPath(import.meta.resolve('@changesets/cli/bin.js'))

    const result = spawnSync(process.execPath, [cli, 'status', '--output', output], {
      cwd: root,
      encoding: 'utf8'
    })

    assert.equal(result.status, 0, result.error?.message ?? `${result.stdout}\n${result.stderr}`)

    const status = JSON.parse(await readFile(output, 'utf8'))

    assert.ok(Array.isArray(status.releases), 'Changesets must produce a valid release plan')

    return status.releases
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
}

test('pending changesets resolve without mixing private and public release packages', async () => {
  await readPendingChangesetPlan(fileURLToPath(new URL('..', import.meta.url)))
})

test('changeset validation accepts prepared releases and rejects mixed private package notes', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lumen-changeset-states-'))

  const runGit = args => {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' })

    assert.equal(result.status, 0, result.error?.message ?? result.stderr)
  }

  try {
    await mkdir(join(root, '.changeset'))

    await mkdir(join(root, 'packages/public'), { recursive: true })

    await mkdir(join(root, 'packages/private'), { recursive: true })

    await writeFile(join(root, 'package.json'), JSON.stringify({
      name: 'release-fixture', private: true, packageManager: 'pnpm@12.18.0'
    }))

    await writeFile(join(root, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n")

    await writeFile(join(root, 'packages/public/package.json'), JSON.stringify({ name: '@fixture/public', version: '1.0.0' }))

    await writeFile(join(root, 'packages/private/package.json'), JSON.stringify({ name: '@fixture/private', version: '1.0.0', private: true }))

    await writeFile(join(root, '.changeset/config.json'), JSON.stringify({
      changelog: false, commit: false, fixed: [], linked: [], access: 'public',
      baseBranch: 'main', updateInternalDependencies: 'patch', ignore: []
    }))

    await writeFile(join(root, '.changeset/README.md'), '# Changesets\n')

    runGit(['init', '-b', 'main'])

    runGit(['add', '.'])

    runGit(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--no-gpg-sign', '-m', 'fixture'])

    const note = join(root, '.changeset/release.md')

    await writeFile(note, '---\n"@fixture/public": patch\n---\n\nFix a public behavior.\n')

    const plan = await readPendingChangesetPlan(root)

    assert.ok(plan.some(release => release.name === '@fixture/public' && release.newVersion === '1.0.1'))

    await writeFile(note, '---\n"@fixture/public": patch\n"@fixture/private": patch\n---\n\nFix a public behavior.\n')

    await assert.rejects(readPendingChangesetPlan(root), /private|ignored/u)

    await rm(note)

    await writeFile(join(root, 'packages/public/package.json'), JSON.stringify({ name: '@fixture/public', version: '1.0.1' }))

    assert.deepEqual(await readPendingChangesetPlan(root), [])
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})

test('release scope merges pending and unpublished packages deterministically', () => {
  assert.deepEqual(
    mergeReleasePackageNames({
      pending: ['@santi020k/lumen-react', '@santi020k/lumen-core'],
      unpublished: ['@santi020k/lumen-react', '@santi020k/lumen-elements']
    }),
    [
      '@santi020k/lumen-core',
      '@santi020k/lumen-elements',
      '@santi020k/lumen-react'
    ]
  )
})

test('release scope ignores private packages Changesets reports as unchanged', () => {
  assert.deepEqual(
    selectPendingReleaseNames([
      { name: '@santi020k/lumen-core', type: 'minor' },
      { name: '@santi020k/lumen-docs', type: 'none' }
    ]),
    ['@santi020k/lumen-core']
  )
})

test('an isolated React release selects web validation only', () => {
  assert.deepEqual(
    classifyReleasePackages(['@santi020k/lumen-react']),
    { mcp: true, mcpPackage: false, native: false, reactNative: false, web: true }
  )
})

test('a React Native release selects native validation without Swift or Compose publication', () => {
  assert.deepEqual(
    classifyReleasePackages(['@santi020k/lumen-react-native']),
    { mcp: false, mcpPackage: false, native: true, reactNative: true, web: false }
  )
})

test('shared tokens select every relevant release contract', () => {
  assert.deepEqual(
    classifyReleasePackages(['@santi020k/lumen-tokens']),
    { mcp: true, mcpPackage: false, native: true, reactNative: true, web: false }
  )
})

test('an MCP release selects its packed package smoke', () => {
  assert.deepEqual(
    classifyReleasePackages(['@santi020k/lumen-mcp']),
    { mcp: true, mcpPackage: true, native: false, reactNative: false, web: false }
  )
})
