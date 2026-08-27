import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const scriptPath = fileURLToPath(new URL('./check-affected-files.mjs', import.meta.url))

const run = (command, args, cwd, env = process.env) => {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', env })

  assert.equal(result.status, 0, result.stderr || result.stdout)

  return result.stdout
}

test('ignores committed affected files that were deleted during local version preparation', () => {
  const repository = mkdtempSync(join(tmpdir(), 'lumen-affected-files-'))

  try {
    run('git', ['init', '--quiet'], repository)

    run('git', ['config', 'user.email', 'lumen@example.com'], repository)

    run('git', ['config', 'user.name', 'Lumen Test'], repository)

    run('git', ['commit', '--allow-empty', '--quiet', '-m', 'base'], repository)

    const changeset = join(repository, 'version-preparation.md')

    writeFileSync(changeset, '# Version preparation\n')

    run('git', ['add', 'version-preparation.md'], repository)

    run('git', ['commit', '--quiet', '-m', 'add changeset'], repository)

    rmSync(changeset)

    const output = run(process.execPath, [scriptPath], repository, {
      ...process.env,
      TURBO_SCM_BASE: 'HEAD^'
    })

    assert.match(output, /No affected files require repository-level linting/u)
  } finally {
    rmSync(repository, { force: true, recursive: true })
  }
})
