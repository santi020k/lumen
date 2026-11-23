import { createHash } from 'node:crypto'
import { constants } from 'node:fs'
import type * as Fs from 'node:fs/promises'
import { link, mkdir, mkdtemp, readFile, rm, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { migrateLumenV2 } from './v2-migration.js'
import { migrateLumenV4 } from './v4-migration.js'
import { migrateLumenVersion } from './version-migration.js'

const hook = vi.hoisted(() => ({
  onOpen: undefined as ((path: unknown, flags: number, actual: typeof Fs) => Promise<void>) | undefined
}))

vi.mock('node:fs/promises', async importOriginal => {
  const actual = await importOriginal<typeof Fs>()
  const guardedOpen: typeof actual.open = async (...args) => {
    const flags = typeof args[1] === 'number' ? args[1] : 0

    if (hook.onOpen) await hook.onOpen(args[0], flags, actual)

    return actual.open(...args)
  }

  return { ...actual, open: guardedOpen }
})

let cwd: string

beforeEach(async () => {
  hook.onOpen = undefined
  cwd = await mkdtemp(join(tmpdir(), 'lumen-migration-safety-'))
})

afterEach(async () => {
  hook.onOpen = undefined
  await rm(cwd, { force: true, recursive: true })
})

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')
const isWriteFlags = (flags: number) => (flags & (constants.O_WRONLY | constants.O_RDWR)) !== 0

describe('migration file-writer safety', () => {
  test('allows readonly preview and no-op scans on hard-linked source files while refusing apply mutations', async () => {
    const project = join(cwd, 'project')
    const outsideV2 = join(cwd, 'outside-v2.astro')
    const outsideV4 = join(cwd, 'outside-v4.ts')
    const outsideVersion = join(cwd, 'outside-version.astro')
    const outsideNoop = join(cwd, 'outside-noop.astro')

    const v2Content = '---\nimport { UIPrimitives } from "@santi020k/lumen-astro"\n---\n<UIPrimitives />\n'
    const v4Content = 'import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"\nexport { McpServer }\n'
    const versionContent = '<lumen-stack gap="md">Keep</lumen-stack>'
    const noopContent = '<div>Unchanged</div>'

    await mkdir(project, { recursive: true })
    await writeFile(outsideV2, v2Content, 'utf8')
    await writeFile(outsideV4, v4Content, 'utf8')
    await writeFile(outsideVersion, versionContent, 'utf8')
    await writeFile(outsideNoop, noopContent, 'utf8')

    await link(outsideNoop, join(project, 'noop.astro'))

    const noopV2 = await migrateLumenV2({ apply: true, cwd: project })
    const noopV4 = await migrateLumenV4({ apply: true, cwd: project })
    const noopVersion = await migrateLumenVersion({ apply: true, cwd: project, version: 'v4' })

    expect(noopV2.changedFiles).toEqual([])
    expect(noopV4.changedFiles).toEqual([])
    expect(noopVersion.changedFiles).toEqual([])

    await link(outsideV2, join(project, 'v2.astro'))
    await link(outsideV4, join(project, 'v4.ts'))
    await link(outsideVersion, join(project, 'version.astro'))

    const v2Preview = await migrateLumenV2({ apply: false, cwd: project })
    const v4Preview = await migrateLumenV4({ apply: false, cwd: project })
    const versionPreview = await migrateLumenVersion({ apply: false, cwd: project, version: 'v4' })

    expect(v2Preview.changedFiles).toEqual(['v2.astro'])
    expect(v4Preview.changedFiles).toEqual(['v4.ts'])
    expect(versionPreview.changedFiles).toEqual(['v4.ts', 'version.astro'])

    await expect(migrateLumenV2({ apply: true, cwd: project })).rejects.toThrow('hard-linked')
    await expect(migrateLumenV4({ apply: true, cwd: project })).rejects.toThrow('hard-linked')
    await expect(migrateLumenVersion({ apply: true, cwd: project, version: 'v4' })).rejects.toThrow('hard-linked')

    expect(await readFile(outsideV2, 'utf8')).toBe(v2Content)
    expect(await readFile(outsideV4, 'utf8')).toBe(v4Content)
    expect(await readFile(outsideVersion, 'utf8')).toBe(versionContent)
    expect(await readFile(outsideNoop, 'utf8')).toBe(noopContent)
  })

  test('refuses post-discovery source symlink swaps across v2, v4, and version-migration', async () => {
    const project = join(cwd, 'project')
    const outside = join(cwd, 'outside.txt')
    const v2File = join(project, 'v2.astro')
    const v4File = join(project, 'v4.ts')
    const versionFile = join(project, 'version.astro')

    await mkdir(project, { recursive: true })
    await writeFile(outside, 'keep-outside', 'utf8')
    await writeFile(v2File, '---\nimport { UIPrimitives } from "@santi020k/lumen-astro"\n---\n<UIPrimitives />\n', 'utf8')
    await writeFile(v4File, 'import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"\nexport { McpServer }\n', 'utf8')
    await writeFile(versionFile, '<lumen-stack gap="md">Content</lumen-stack>', 'utf8')

    for (const [target, run] of [
      [v2File, () => migrateLumenV2({ apply: true, cwd: project })],
      [v4File, () => migrateLumenV4({ apply: true, cwd: project })],
      [versionFile, () => migrateLumenVersion({ apply: true, cwd: project, version: 'v4' })]
    ] as const) {
      let swapped = false

      hook.onOpen = async (path, flags, actual) => {
        if (!swapped && path === target && isWriteFlags(flags)) {
          swapped = true
          await actual.unlink(target)
          await actual.symlink(outside, target)
        }
      }

      await expect(run()).rejects.toThrow()
      expect(await readFile(outside, 'utf8')).toBe('keep-outside')
      await unlink(target)
      await writeFile(target, '<div>clean</div>', 'utf8')
    }
  })

  test('v2 preserves concurrent editor edit and inode replacement during apply', async () => {
    const project = join(cwd, 'project')
    const file = join(project, 'page.astro')
    const original = '---\nimport { UIPrimitives } from "@santi020k/lumen-astro"\n---\n<UIPrimitives />\n'
    const editorSave = '---\nimport { UIPrimitives } from "@santi020k/lumen-astro"\n---\n<UIPrimitives />\n<!-- saved -->\n'

    await mkdir(project, { recursive: true })
    await writeFile(file, original, 'utf8')

    let edited = false

    hook.onOpen = async (path, flags, actual) => {
      if (!edited && path === file && isWriteFlags(flags)) {
        edited = true
        await actual.writeFile(file, editorSave, 'utf8')
      }
    }

    await expect(migrateLumenV2({ apply: true, cwd: project })).rejects.toThrow('Source changed during migration: page.astro')
    expect(await readFile(file, 'utf8')).toBe(editorSave)

    let replaced = false
    const pending = join(cwd, 'pending.astro')

    await writeFile(pending, original, 'utf8')
    hook.onOpen = async (path, flags, actual) => {
      if (!replaced && path === file && isWriteFlags(flags)) {
        replaced = true
        await actual.rename(pending, file)
      }
    }

    await expect(migrateLumenV2({ apply: true, cwd: project })).rejects.toThrow('Source changed during migration: page.astro')
    expect(await readFile(file, 'utf8')).toBe(original)
  })

  test('refuses new, existing, and rollback v4 ledger symlink swaps and hard-linked ledgers', async () => {
    const project = join(cwd, 'project')
    const outside = join(cwd, 'outside.json')
    const ledgerPath = join(project, '.lumen', 'migrations-v4.json')
    const sourcePath = join(project, 'page.astro')

    const outsideContent = '{"sentinel":"0000000000000000000000000000000000000000000000000000000000000000"}'

    await mkdir(project, { recursive: true })
    await writeFile(outside, outsideContent, 'utf8')
    await writeFile(sourcePath, '<lumen-stack gap="md">Content</lumen-stack>', 'utf8')

    // 1. New ledger symlink swap before exclusive create
    let newSwapped = false

    hook.onOpen = async (path, flags, actual) => {
      if (!newSwapped && path === ledgerPath && isWriteFlags(flags)) {
        newSwapped = true
        await actual.symlink(outside, ledgerPath)
      }
    }

    await expect(migrateLumenVersion({ apply: true, cwd: project, version: 'v4' })).rejects.toThrow()
    expect(await readFile(outside, 'utf8')).toBe(outsideContent)
    await unlink(ledgerPath)

    // 2. Hard-linked ledger refusal
    await link(outside, ledgerPath)
    hook.onOpen = undefined
    await expect(migrateLumenVersion({ apply: true, cwd: project, version: 'v4' })).rejects.toThrow('hard-linked')
    expect(await readFile(outside, 'utf8')).toBe(outsideContent)
    await unlink(ledgerPath)

    // 3. Existing ledger symlink swap before write
    await writeFile(ledgerPath, '{}\n', 'utf8')
    let existingSwapped = false

    hook.onOpen = async (path, flags, actual) => {
      if (!existingSwapped && path === ledgerPath && isWriteFlags(flags)) {
        existingSwapped = true
        await actual.unlink(ledgerPath)
        await actual.symlink(outside, ledgerPath)
      }
    }

    await expect(migrateLumenVersion({ apply: true, cwd: project, version: 'v4' })).rejects.toThrow()
    expect(await readFile(outside, 'utf8')).toBe(outsideContent)
    await unlink(ledgerPath)

    // 4. Rollback ledger symlink swap after source change
    await writeFile(ledgerPath, '{}\n', 'utf8')
    let writeCount = 0

    hook.onOpen = async (path, flags, actual) => {
      if (path === ledgerPath && isWriteFlags(flags)) {
        writeCount += 1
        if (writeCount === 2) {
          await actual.unlink(ledgerPath)
          await actual.symlink(outside, ledgerPath)
        }
      } else if (path === sourcePath && isWriteFlags(flags)) {
        await actual.writeFile(sourcePath, '<lumen-stack gap="md">Edited</lumen-stack>', 'utf8')
      }
    }

    await expect(migrateLumenVersion({ apply: true, cwd: project, version: 'v4' })).rejects.toThrow()
    expect(await readFile(outside, 'utf8')).toBe(outsideContent)
  })

  test('v4 ledger preserves existing entries, is idempotent on repeat, and flags interrupted intent', async () => {
    const project = join(cwd, 'project')
    const first = join(project, 'first.astro')
    const second = join(project, 'second.astro')

    await mkdir(project, { recursive: true })
    await writeFile(first, '<lumen-stack gap="md">First</lumen-stack>', 'utf8')

    const initial = await migrateLumenVersion({ apply: true, cwd: project, version: 'v4' })

    expect(initial.changedFiles).toEqual(['first.astro'])

    const repeated = await migrateLumenVersion({ apply: true, cwd: project, version: 'v4' })

    expect(repeated.changedFiles).toEqual([])
    expect(repeated.manualReview).toEqual([])

    const ledgerPath = join(project, '.lumen', 'migrations-v4.json')
    const ledgerBefore: unknown = JSON.parse(await readFile(ledgerPath, 'utf8'))

    expect(ledgerBefore).toEqual({
      'first.astro': sha256('<lumen-stack gap="group">First</lumen-stack>')
    })

    await writeFile(second, '<lumen-stack gap="md">Second</lumen-stack>', 'utf8')
    await writeFile(
      ledgerPath,
      `${JSON.stringify({
        'first.astro': sha256('<lumen-stack gap="group">First</lumen-stack>'),
        'second.astro': sha256('<lumen-stack gap="group">Second</lumen-stack>')
      }, undefined, 2)}\n`,
      'utf8'
    )

    const resumed = await migrateLumenVersion({ apply: true, cwd: project, version: 'v4' })

    expect(resumed.changedFiles).toEqual([])
    expect(resumed.manualReview.some(item => item.file === 'second.astro' && item.kind === 'layout-gap')).toBe(true)
    expect(await readFile(first, 'utf8')).toBe('<lumen-stack gap="group">First</lumen-stack>')
  })
})
