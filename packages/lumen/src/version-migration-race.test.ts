import type * as Fs from 'node:fs/promises'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, test, vi } from 'vitest'

import { migrateLumenVersion } from './version-migration.js'

const race = vi.hoisted(() => ({ ledger: '', source: '', fired: false }))

vi.mock('node:fs/promises', async importOriginal => {
  const original = await importOriginal<typeof Fs>()
  const guardedWrite: typeof original.writeFile = async (...args) => {
    if (!race.fired && args[0] === race.ledger) {
      race.fired = true
      await original.writeFile(race.source, '<lumen-stack gap="md">New editor content</lumen-stack>', 'utf8')
    }

    return original.writeFile(...args)
  }

  return { ...original, writeFile: guardedWrite }
})

test('preserves an editor save during apply and removes its unapplied ledger fingerprint', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lumen-migration-race-'))

  race.source = join(root, 'page.astro')
  race.ledger = join(root, '.lumen/migrations-v4.json')
  race.fired = false

  try {
    await writeFile(race.source, '<lumen-stack gap="md">Original</lumen-stack>', 'utf8')
    await expect(migrateLumenVersion({ cwd: root, version: 'v4', apply: true })).rejects.toThrow('Source changed during migration: page.astro')
    expect(await readFile(race.source, 'utf8')).toBe('<lumen-stack gap="md">New editor content</lumen-stack>')
    expect(JSON.parse(await readFile(race.ledger, 'utf8'))).toEqual({})
    const retry = await migrateLumenVersion({ cwd: root, version: 'v4', apply: true })

    expect(retry.changedFiles).toEqual(['page.astro'])
    expect(await readFile(race.source, 'utf8')).toBe('<lumen-stack gap="group">New editor content</lumen-stack>')
  } finally {
    race.ledger = ''
    race.source = ''
    await rm(root, { force: true, recursive: true })
  }
})
