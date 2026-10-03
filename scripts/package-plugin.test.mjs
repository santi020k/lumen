import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'
import { promisify } from 'node:util'

const execute = promisify(execFile)
const root = resolve(import.meta.dirname, '..')
const source = join(root, 'plugins/lumen-ui')
const manifest = JSON.parse(await readFile(join(source, 'plugin.json'), 'utf8'))
const readArchive = async (archive, path) => JSON.parse((await execute('unzip', ['-p', archive, path])).stdout)

test('builds a hosted Codex upload and a version-pinned Claude package with the same skills', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lumen-plugin-test-'))

  try {
    await execute(process.execPath, [join(root, 'scripts/package-plugin.mjs'), '--output', directory])

    const codex = join(directory, `lumen-ui-${manifest.version}-codex.zip`)
    const claude = join(directory, `lumen-ui-${manifest.version}-claude.zip`)

    assert.deepEqual(await readArchive(codex, 'plugin.json'), manifest)

    assert.deepEqual(await readArchive(codex, 'mcp.json'), {
      $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
      mcpServers: { lumen: { type: 'streamable-http', url: 'https://mcp.lumen.santi020k.com/mcp' } }
    })

    assert.deepEqual(await readArchive(claude, '.mcp.json'), JSON.parse(await readFile(join(source, '.mcp.json'), 'utf8')))

    assert.equal((await readArchive(claude, '.claude-plugin/plugin.json')).version, manifest.version)

    const paths = (await execute('unzip', ['-Z', '-1', codex])).stdout.split('\n').filter(Boolean)

    assert.ok(paths.every(path => ['plugin.json', 'mcp.json', 'README.md'].includes(path) || path.startsWith('skills/') || path.startsWith('assets/')))

    for (const skill of ['lumen-ui', 'lumen-review', 'lumen-migrate']) {
      const path = `skills/${skill}/SKILL.md`
      const expected = await readFile(join(source, path), 'utf8')

      assert.equal((await execute('unzip', ['-p', codex, path])).stdout, expected)

      assert.equal((await execute('unzip', ['-p', claude, path])).stdout, expected)
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('never replaces an existing distribution archive', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lumen-plugin-preserve-'))
  const archive = join(directory, `lumen-ui-${manifest.version}-codex.zip`)

  try {
    await mkdir(directory, { recursive: true })

    await writeFile(archive, 'existing release evidence')

    await assert.rejects(execute(process.execPath, [join(root, 'scripts/package-plugin.mjs'), '--output', directory]), /Archive already exists/u)

    assert.equal(await readFile(archive, 'utf8'), 'existing release evidence')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
