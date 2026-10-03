import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(import.meta.dirname, '..')
const diagnosticMarker = / \[#api-digester-breaking-change\]$/u

export const parseSwiftApiBreakages = output => [
  ...new Set(
    [...output.matchAll(/API breakage:\s+(.+)$/gm)]
      .map(match => match[1].trim().replace(diagnosticMarker, ''))
  )
].sort()

export const assertSwiftApiBreakages = (actual, expected) => {
  assert.deepEqual(
    [...actual].sort(),
    [...expected].sort(),
    'Swift source breakage changed; restore compatibility or review the current major contract'
  )
}

export const resolveSwiftCompatibilityExpectation = (major, contract) => {
  assert.equal(contract.targetVersion, `${major}.0.0`, 'The Swift compatibility contract must match the release major')

  const baseline = major === 3 ? 'v2.1.0' : contract.swiftApiBaseline
  const breakages = contract.changes.flatMap(change => change.swiftApiBreakages ?? [])

  assert.match(baseline ?? '', /^v\d+\.\d+\.\d+$/u, 'The Swift baseline must be an immutable release tag')

  assert.ok(breakages.every(item => typeof item === 'string' && item.length > 0), 'Expected Swift diagnostics must be non-empty strings')

  assert.equal(new Set(breakages).size, breakages.length, 'Expected Swift diagnostics must be unique')

  return { baseline, breakages }
}

const checkSwiftSourceCompatibility = () => {
  const manifest = JSON.parse(readFileSync(resolve(repositoryRoot, 'packages/lumen/package.json'), 'utf8'))
  const major = Math.max(3, Number.parseInt(manifest.version, 10))

  const contract = JSON.parse(
    readFileSync(resolve(repositoryRoot, `registry/lumen-${major}-contract.json`), 'utf8')
  )

  const { baseline, breakages } = resolveSwiftCompatibilityExpectation(major, contract)

  const result = spawnSync(
    'swift',
    ['package', 'diagnose-api-breaking-changes', baseline, '--products', 'LumenUI'],
    { cwd: repositoryRoot, encoding: 'utf8' }
  )

  if (result.error) throw result.error

  const output = [result.stdout, result.stderr].filter(Boolean).join('\n')
  const actualBreakages = parseSwiftApiBreakages(output)

  assert.ok(
    result.status === 0 || actualBreakages.length > 0,
    `Swift compatibility diagnosis failed without API diagnostics:\n${output}`
  )

  assertSwiftApiBreakages(actualBreakages, breakages)

  process.stdout.write(
    `Validated ${actualBreakages.length} reviewed Swift source breakages against ${baseline}.\n`
  )
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  checkSwiftSourceCompatibility()
}
