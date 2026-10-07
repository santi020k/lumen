import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { installPublishedPackages } from './install-published-packages.mjs'

// cspell:words ETARGET EINTEGRITY E401

test('waits for published versions to propagate without skipping installation', async () => {
  let calls = 0
  let waits = 0

  await installPublishedPackages(['@santi020k/lumen@4.0.0'], {
    run: () => ++calls === 1 ? { status: 1, stderr: 'npm error code ETARGET' } : { status: 0 },
    wait: async () => { waits++ },
    report: () => {}
  })

  assert.equal(calls, 2)

  assert.equal(waits, 1)
})

test('fails after a bounded registry propagation window', async () => {
  let calls = 0

  await assert.rejects(installPublishedPackages(['@santi020k/lumen@4.0.0'], {
    run: () => { calls++;

      return { status: 1, stderr: 'npm ERR! code ETARGET' } },
    wait: async () => {},
    report: () => {}
  }), /installation failed/u)

  assert.equal(calls, 6)
})

test('does not retry authentication, integrity, or process failures', async () => {
  for (const diagnostic of ['npm error code E401', 'npm error code EINTEGRITY', 'unrelated ETARGET text']) {
    await assert.rejects(installPublishedPackages([], {
      run: () => ({ status: 1, stderr: diagnostic }),
      wait: async () => { assert.fail('Non-propagation errors must fail immediately') }
    }), /installation failed/u)
  }

  await assert.rejects(installPublishedPackages([], {
    run: () => ({ error: new Error('npm executable unavailable') }),
    wait: async () => { assert.fail('Process errors must fail immediately') }
  }), /executable unavailable/u)
})


test('CLI installs the exact family in the audit directory with scripts disabled', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lumen-registry-install-'))

  try {
    const bin = join(root, 'bin')

    await mkdir(bin)

    await writeFile(join(bin, 'npm'), '#!/bin/sh\nprintf "%s\\n" "$@" > "$MOCK_NPM_ARGUMENTS"\npwd > "$MOCK_NPM_DIRECTORY"\n', { mode: 0o755 })

    const result = spawnSync(process.execPath, [
      join(import.meta.dirname, 'install-published-packages.mjs'),
      '@santi020k/lumen@4.0.0', '@santi020k/lumen-react-native@4.0.0'
    ], { cwd: root, encoding: 'utf8', env: {
      ...process.env, PATH: `${bin}:${process.env.PATH}`,
      MOCK_NPM_ARGUMENTS: join(root, 'arguments'), MOCK_NPM_DIRECTORY: join(root, 'directory')
    } })

    assert.equal(result.status, 0, result.stderr)

    assert.deepEqual((await readFile(join(root, 'arguments'), 'utf8')).trim().split('\n'), [
      'install', '--ignore-scripts', '--legacy-peer-deps', '--no-audit', '--no-fund', '--',
      '@santi020k/lumen@4.0.0', '@santi020k/lumen-react-native@4.0.0'
    ])

    const directory = (await readFile(join(root, 'directory'), 'utf8')).trim()

    assert.ok(directory.endsWith(root), directory)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
