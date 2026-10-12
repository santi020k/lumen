import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const defaultRoot = fileURLToPath(new URL('..', import.meta.url))

// The canonical plugin source pins the MCP package exactly; documentation repeats that pin.
export const pluginMcpPinPaths = [
  'plugins/lumen-ui/mcp.json',
  'plugins/lumen-ui/README.md',
  'docs/claude-code-plugin.md',
  'docs/openai-plugin-submission.md'
]

const pinPrefix = '@santi020k/lumen-mcp@'
// A pin runs until a delimiter, so malformed suffixes stay part of the token instead of surviving a rewrite.
const pinTokenPattern = /@santi020k\/lumen-mcp@[^\s"'`),;\]<>]*/gu
const identifierPattern = /^[0-9A-Za-z-]+$/u
const numericPattern = /^\d+$/u
const isNumericIdentifier = value => numericPattern.test(value)
const hasLeadingZero = value => value.length > 1 && value.startsWith('0')

const isValidIdentifiers = (value, rejectNumericLeadingZero) => value.split('.').every(identifier => (
  identifierPattern.test(identifier) &&
  !(rejectNumericLeadingZero && isNumericIdentifier(identifier) && hasLeadingZero(identifier))
))

/** Validates a full SemVer 2.0.0 version, including prerelease and build metadata, without backtracking. */
export const isExactSemanticVersion = value => {
  const [withoutBuild, build, ...extraBuild] = value.split('+')

  if (extraBuild.length > 0 || (build !== undefined && !isValidIdentifiers(build, false))) return false

  const separator = withoutBuild.indexOf('-')
  const core = separator === -1 ? withoutBuild : withoutBuild.slice(0, separator)
  const prerelease = separator === -1 ? undefined : withoutBuild.slice(separator + 1)
  const parts = core.split('.')

  if (parts.length !== 3 || !parts.every(part => isNumericIdentifier(part) && !hasLeadingZero(part))) return false

  return prerelease === undefined || isValidIdentifiers(prerelease, true)
}

// A sentence may end right after a pin; SemVer never ends with a period.
const splitPinToken = token => {
  let end = token.length

  while (end > 0 && token[end - 1] === '.') end -= 1

  const pin = token.slice(0, end)

  return { pin, suffix: token.slice(pin.length), version: pin.slice(pinPrefix.length) }
}

export const synchronizePluginMcpPin = (source, version) => {
  assert.ok(isExactSemanticVersion(version), `${version} is not an exact semantic version.`)

  const malformed = [...source.matchAll(pinTokenPattern)]
    .map(([token]) => splitPinToken(token))
    .filter(({ version: pinned }) => !isExactSemanticVersion(pinned))
    .map(({ pin }) => pin)

  if (malformed.length > 0) throw new Error(`Malformed MCP pins: ${malformed.join(', ')}`)

  return source.replaceAll(pinTokenPattern, token => `${pinPrefix}${version}${splitPinToken(token).suffix}`)
}

/** Rewrites the exact MCP package pin to the current package version; `check` only reports stale files. */
export const syncPluginMcpVersion = async ({ check = false, root = defaultRoot } = {}) => {
  const { version } = JSON.parse(await readFile(join(root, 'packages/mcp/package.json'), 'utf8'))
  const updates = []

  // Every file is validated before any is written, so a malformed pin never leaves a partial rewrite.
  for (const path of pluginMcpPinPaths) {
    const source = await readFile(join(root, path), 'utf8')

    if (path === pluginMcpPinPaths[0]) assert.ok(source.includes(pinPrefix), `${path} must pin @santi020k/lumen-mcp.`)

    const synchronized = synchronizePluginMcpPin(source, version)

    if (synchronized !== source) updates.push({ path, synchronized })
  }

  if (!check) {
    for (const { path, synchronized } of updates) await writeFile(join(root, path), synchronized)
  }

  return { stalePaths: updates.map(update => update.path), version }
}

const run = async () => {
  const check = process.argv.includes('--check')
  const { stalePaths, version } = await syncPluginMcpVersion({ check })

  if (check && stalePaths.length > 0) {
    throw new Error(`Plugin MCP pins are not synchronized with ${version}:\n${stalePaths.join('\n')}\nRun pnpm sync:plugin-mcp-version.`)
  }

  console.log(`Plugin MCP pins use @santi020k/lumen-mcp@${version}.`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await run()
