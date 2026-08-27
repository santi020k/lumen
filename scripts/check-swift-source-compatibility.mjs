import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(import.meta.dirname, '..')

export const parseSwiftApiBreakages = output => [...output.matchAll(/API breakage:\s+(.+)$/gm)]
  .map(match => match[1].trim())
  .sort()

export const assertSwiftApiBreakages = (actual, expected) => {
  assert.deepEqual(
    [...actual].sort(),
    [...expected].sort(),
    'Swift source breakage changed; restore compatibility or review the Lumen 2 contract'
  )
}

const checkSwiftSourceCompatibility = () => {
  const contract = JSON.parse(
    readFileSync(resolve(repositoryRoot, 'registry/lumen-2-contract.json'), 'utf8')
  )

  const change = contract.changes.find(item => item.id === 'swift-surface-scale-expansion')

  assert.ok(change, 'The Lumen 2 contract must classify Swift surface-scale breakage')

  assert.ok(
    Array.isArray(change.swiftApiBreakages) && change.swiftApiBreakages.length > 0,
    'The Swift surface-scale change must list its expected API diagnostics'
  )

  const result = spawnSync(
    'swift',
    ['package', 'diagnose-api-breaking-changes', 'v1.6.0', '--products', 'LumenUI'],
    { cwd: repositoryRoot, encoding: 'utf8' }
  )

  if (result.error) throw result.error

  const output = [result.stdout, result.stderr].filter(Boolean).join('\n')
  const actualBreakages = parseSwiftApiBreakages(output)

  assert.ok(
    result.status === 0 || actualBreakages.length > 0,
    `Swift compatibility diagnosis failed without API diagnostics:\n${output}`
  )

  assertSwiftApiBreakages(actualBreakages, change.swiftApiBreakages)

  process.stdout.write(
    `Validated ${actualBreakages.length} reviewed Swift source breakages against v1.6.0.\n`
  )
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  checkSwiftSourceCompatibility()
}
