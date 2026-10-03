import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import Ajv2020 from 'ajv/dist/2020.js'

const validator = new Ajv2020({ allErrors: true })
const readSchema = async name => JSON.parse(await readFile(new URL(`../schemas/${name}.json`, import.meta.url), 'utf8'))
const validateManifest = validator.compile(await readSchema('agent-plugin.schema'))
const validateMcp = validator.compile(await readSchema('agent-mcp.schema'))

export const validatePluginContracts = ({ portable, portableMcp, openai, claude, legacyMcp, mcpVersion }) => {
  assert.ok(validateManifest(portable), validator.errorsText(validateManifest.errors))

  assert.ok(validateMcp(portableMcp), validator.errorsText(validateMcp.errors))

  assert.match(portable.version, /^[1-9]\d*\.\d+\.\d+$/u)

  for (const fallback of [openai, claude]) {
    assert.equal(fallback.name, portable.name, 'Plugin identities differ.')

    assert.equal(fallback.version, portable.version, 'Plugin versions differ.')
  }

  assert.deepEqual(portableMcp.mcpServers, {
    lumen: { args: ['-y', `@santi020k/lumen-mcp@${mcpVersion}`], command: 'npx', type: 'stdio' }
  }, 'The portable plugin must pin the tested MCP version.')

  assert.deepEqual(legacyMcp.mcpServers.lumen, {
    args: portableMcp.mcpServers.lumen.args,
    command: portableMcp.mcpServers.lumen.command
  }, 'MCP configurations differ.')

  assert.deepEqual(openai.interface, portable.extensions['com.openai'].interface)

  assert.deepEqual(claude.agents, ['./agents/lumen-reviewer.md'])
}

export const validateReviewer = source => {
  const lines = source.split('\n')
  const end = lines.indexOf('---', 1)

  assert.equal(lines[0], '---')

  assert.ok(end > 1, 'Missing reviewer frontmatter.')

  const tools = lines.slice(1, end).find(line => line.startsWith('tools: '))

  assert.equal(tools, 'tools: Read, Glob, Grep, mcp__lumen__*', 'Reviewer must retain the read-only tool allowlist.')
}
