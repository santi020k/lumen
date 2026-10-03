import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { cp, lstat, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'

const execute = promisify(execFile)
const root = resolve(import.meta.dirname, '..')
const source = join(root, 'plugins/lumen-ui')
const index = process.argv.indexOf('--output')

assert.ok(index < 0 || process.argv[index + 1] && !process.argv[index + 1].startsWith('--'), '--output requires a directory.')

const output = index < 0 ? join(root, 'dist/plugins') : resolve(process.argv[index + 1])

await execute(process.execPath, [join(root, 'scripts/generate-plugin-package.mjs'), '--check'])

await execute(process.execPath, [join(root, 'scripts/check-plugin-package.mjs')])

const manifest = JSON.parse(await readFile(join(source, 'plugin.json'), 'utf8'))
const endpoint = 'https://mcp.lumen.santi020k.com/mcp'
const staging = await mkdtemp(join(tmpdir(), 'lumen-plugin-package-'))

await mkdir(output, { recursive: true })

try {
  for (const target of ['codex', 'claude']) {
    const directory = join(staging, target)
    const archive = join(output, `lumen-ui-${manifest.version}-${target}.zip`)

    await assert.rejects(lstat(archive), { code: 'ENOENT' }, `Archive already exists: ${archive}`)

    await mkdir(directory)

    for (const name of ['skills', 'assets']) await cp(join(source, name), join(directory, name), { recursive: true })

    if (target === 'codex') {
      await cp(join(source, 'plugin.json'), join(directory, 'plugin.json'))

      const configuration = {
        $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
        mcpServers: { lumen: { type: 'streamable-http', url: endpoint } }
      }

      await writeFile(join(directory, 'mcp.json'), `${JSON.stringify(configuration, null, 2)}\n`)

      await writeFile(join(directory, 'README.md'), `# Lumen UI ${manifest.version}\n\nThis OpenAI submission package contains the build, review, and migration skills and the public, read-only Lumen catalog at ${endpoint}. No account or API key is required. Publish the tested Lumen 4 catalog and verify its version before uploading this archive for review.\n`)
    } else {
      for (const name of ['plugin.json', 'mcp.json', '.codex-plugin', '.claude-plugin', '.mcp.json', 'agents', 'README.md']) {
        await cp(join(source, name), join(directory, name), { recursive: true })
      }
    }

    await execute('zip', ['-X', '-q', '-r', archive, '.'], { cwd: directory })

    process.stdout.write(`${target}: ${archive}\n`)
  }
} finally {
  await rm(staging, { recursive: true, force: true })
}
