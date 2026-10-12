import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { performance } from 'node:perf_hooks'
import test from 'node:test'

import { isExactSemanticVersion, pluginMcpPinPaths, synchronizePluginMcpPin, syncPluginMcpVersion } from './sync-plugin-mcp-version.mjs'

const writeFixture = async (root, path, content) => {
  await mkdir(dirname(join(root, path)), { recursive: true })

  await writeFile(join(root, path), content)
}

test('rewrites exact and prerelease MCP pins without touching other packages', () => {
  assert.equal(
    synchronizePluginMcpPin('npx -y @santi020k/lumen-mcp@4.0.0 and @santi020k/lumen-mcp@4.1.0-rc.1; keep @santi020k/lumen-core@4.0.0', '4.2.0'),
    'npx -y @santi020k/lumen-mcp@4.2.0 and @santi020k/lumen-mcp@4.2.0; keep @santi020k/lumen-core@4.0.0'
  )
})

test('a version transition repins the canonical plugin source and its documentation', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lumen-plugin-pin-'))

  try {
    await writeFixture(root, 'packages/mcp/package.json', JSON.stringify({ version: '4.2.0' }))

    for (const path of pluginMcpPinPaths) {
      await writeFixture(root, path, path.endsWith('.json') ?
        JSON.stringify({ mcpServers: { lumen: { args: ['-y', '@santi020k/lumen-mcp@4.1.0'] } } }, null, 2) :
        'Pins `@santi020k/lumen-mcp@4.1.0` for both clients.\n')
    }

    const stale = await syncPluginMcpVersion({ check: true, root })

    assert.deepEqual(stale.stalePaths, pluginMcpPinPaths)

    assert.match(await readFile(join(root, pluginMcpPinPaths[0]), 'utf8'), /lumen-mcp@4\.1\.0/u)

    await syncPluginMcpVersion({ root })

    for (const path of pluginMcpPinPaths) {
      assert.match(await readFile(join(root, path), 'utf8'), /@santi020k\/lumen-mcp@4\.2\.0/u, path)
    }

    assert.deepEqual((await syncPluginMcpVersion({ check: true, root })).stalePaths, [])
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})

test('the canonical plugin source must keep an MCP pin', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lumen-plugin-pin-'))

  try {
    await writeFixture(root, 'packages/mcp/package.json', JSON.stringify({ version: '4.2.0' }))

    for (const path of pluginMcpPinPaths) await writeFixture(root, path, '{}')

    await assert.rejects(syncPluginMcpVersion({ check: true, root }), /must pin @santi020k\/lumen-mcp/u)
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})

test('the release branch pins match its MCP package', async () => {
  assert.deepEqual((await syncPluginMcpVersion({ check: true })).stalePaths, [])
})

test('full SemVer pins with hyphenated prerelease and build metadata are rewritten whole', () => {
  assert.equal(
    synchronizePluginMcpPin('pin `@santi020k/lumen-mcp@4.1.0-beta-fix.1+build.2` and @santi020k/lumen-mcp@4.1.0.', '4.2.0-rc-2.1+meta-x'),
    'pin `@santi020k/lumen-mcp@4.2.0-rc-2.1+meta-x` and @santi020k/lumen-mcp@4.2.0-rc-2.1+meta-x.'
  )
})

test('a malformed pin anywhere rejects the sync before any file is written', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lumen-plugin-pin-'))

  try {
    await writeFixture(root, 'packages/mcp/package.json', JSON.stringify({ version: '4.2.0' }))

    for (const path of pluginMcpPinPaths) await writeFixture(root, path, 'Pins `@santi020k/lumen-mcp@4.1.0`.\n')

    await writeFixture(root, pluginMcpPinPaths.at(-1), 'Pins `@santi020k/lumen-mcp@4.1.0-beta_fix`.\n')

    await assert.rejects(syncPluginMcpVersion({ root }), /Malformed MCP pins: @santi020k\/lumen-mcp@4\.1\.0-beta_fix/u)

    for (const path of pluginMcpPinPaths.slice(0, -1)) {
      assert.match(await readFile(join(root, path), 'utf8'), /lumen-mcp@4\.1\.0`/u, path)
    }
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})

test('SemVer validation accepts prerelease and build identifiers and rejects malformed versions', () => {
  for (const valid of ['4.1.0', '4.1.0-beta-fix.1+build.2', '1.0.0-0.3.7', '1.0.0+20130313144700', '1.0.0-x-y-z.--']) {
    assert.ok(isExactSemanticVersion(valid), valid)
  }

  for (const invalid of ['4.1', '04.1.0', '4.1.0-', '4.1.0-01', '4.1.0+', '4.1.0-beta_fix', '4.1.0+a+b', '4.1.0-beta..1']) {
    assert.ok(!isExactSemanticVersion(invalid), invalid)
  }
})

test('pin scanning stays linear on adversarially long input', () => {
  const longPin = `@santi020k/lumen-mcp@4.1.0-${'a-'.repeat(50_000)}a`
  const started = performance.now()

  assert.equal(synchronizePluginMcpPin(`${longPin} `, '4.2.0'), '@santi020k/lumen-mcp@4.2.0 ')

  assert.ok(performance.now() - started < 1000)
})

test('malformed dot runs fail without quadratic trailing-punctuation scans', () => {
  const pin = `@santi020k/lumen-mcp@4.1.0-${'.'.repeat(100_000)}x`
  const started = performance.now()

  assert.throws(() => synchronizePluginMcpPin(pin, '4.2.0'), /Malformed MCP pins/u)

  assert.ok(performance.now() - started < 1000)
})
