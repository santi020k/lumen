import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const repositoryRoot = resolve(import.meta.dirname, '..')
const pluginRoot = join(repositoryRoot, 'plugins/lumen-ui')
const readJson = async path => JSON.parse(await readFile(path, 'utf8'))
const manifest = await readJson(join(pluginRoot, 'plugin.json'))
const configuration = await readJson(join(pluginRoot, 'mcp.json'))
const { extensions, $schema: schema, ...metadata } = manifest

const output = new Map([
  ['.codex-plugin/plugin.json', { ...metadata, skills: './skills/', interface: extensions['com.openai'].interface, mcpServers: './.mcp.json' }],
  ['.claude-plugin/plugin.json', { $schema: 'https://json.schemastore.org/claude-code-plugin-manifest.json', ...metadata, displayName: extensions['com.openai'].interface.displayName, skills: './skills/', agents: ['./agents/lumen-reviewer.md'], mcpServers: './.mcp.json' }],
  ['.mcp.json', { mcpServers: Object.fromEntries(Object.entries(configuration.mcpServers).map(([name, { type, ...server }]) => [name, server])) }]
])

const save = async (path, content) => {
  if (process.argv.includes('--check')) {
    if (await readFile(path, 'utf8') !== content) throw new Error(`Stale plugin package: ${path}. Run pnpm run generate:plugin-package.`)
  } else {
    await writeFile(path, content)
  }
}

for (const [path, value] of output) await save(join(pluginRoot, path), `${JSON.stringify(value, null, 2)}\n`)

const copyTree = async (source, destination) => {
  if (!process.argv.includes('--check')) await mkdir(destination, { recursive: true })

  for (const entry of await readdir(source, { withFileTypes: true })) {
    const from = join(source, entry.name)
    const to = join(destination, entry.name)

    if (entry.isDirectory()) await copyTree(from, to)
    else await save(to, await readFile(from, 'utf8'))
  }
}

await copyTree(join(repositoryRoot, 'skills'), join(pluginRoot, 'skills'))

process.stdout.write(`lumen-ui: plugin ${manifest.version} ${process.argv.includes('--check') ? 'is current' : 'generated'}\n`)
