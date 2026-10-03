import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { validatePluginContracts, validateReviewer } from './lib/plugin-contract.mjs'

const readJson = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'))

const fixture = {
  claude: await readJson('plugins/lumen-ui/.claude-plugin/plugin.json'),
  legacyMcp: await readJson('plugins/lumen-ui/.mcp.json'),
  mcpVersion: (await readJson('packages/mcp/package.json')).version,
  openai: await readJson('plugins/lumen-ui/.codex-plugin/plugin.json'),
  portable: await readJson('plugins/lumen-ui/plugin.json'),
  portableMcp: await readJson('plugins/lumen-ui/mcp.json')
}

test('portable manifests validate against the official offline schemas and client overlays', () => {
  validatePluginContracts(fixture)
})

test('rejects divergent client versions and unpinned MCP configuration', () => {
  for (const client of ['openai', 'claude']) {
    const changed = structuredClone(fixture)

    changed[client].version = '0.1.0'

    assert.throws(() => validatePluginContracts(changed), /versions differ/u)
  }

  const changed = structuredClone(fixture)

  changed.portableMcp.mcpServers.lumen.args = ['-y', '@santi020k/lumen-mcp@latest']

  assert.throws(() => validatePluginContracts(changed), /pin the tested/u)
})

test('rejects invalid portable transports and unsupported metadata', () => {
  const changed = structuredClone(fixture)

  changed.portableMcp.mcpServers.lumen.type = 'http'

  assert.throws(() => validatePluginContracts(changed))

  const manifest = structuredClone(fixture)

  manifest.portable.skills = '../outside'

  assert.throws(() => validatePluginContracts(manifest))
})

test('the optional reviewer rejects mutation and execution tools', async () => {
  const source = await readFile(new URL('../plugins/lumen-ui/agents/lumen-reviewer.md', import.meta.url), 'utf8')

  validateReviewer(source)

  for (const tool of ['Write', 'Edit', 'Bash', 'Agent']) {
    assert.throws(() => validateReviewer(source.replace('tools: Read,', `tools: ${tool},`)), /read-only/u)
  }
})
