import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const requireComplete = process.argv.includes('--require-complete')
const ledgerArgument = process.argv.find(argument => argument.startsWith('--ledger='))
const ledgerPath = ledgerArgument ? path.resolve(process.cwd(), ledgerArgument.slice(9)) : path.join(root, 'registry/web-consumer-evidence.json')
const ledger = JSON.parse(await readFile(ledgerPath, 'utf8'))
const requiredAdapters = ['astro', 'elements', 'react']
const requiredChecks = ['accessibility', 'browser', 'build', 'exactCandidate', 'installation', 'lint', 'migration', 'tests', 'typecheck']

assert.equal(ledger.schemaVersion, 1, 'Unsupported web consumer evidence schema')

assert.match(ledger.candidate.version, /^2\.0\.0(?:-|$)/u, 'The web candidate must target Lumen 2')

assert.ok(Array.isArray(ledger.adapters), 'Web consumer evidence requires adapters')

assert.deepEqual(ledger.adapters.map(entry => entry.id).sort(), requiredAdapters, 'Web consumer evidence must cover Astro, React, and Elements exactly once')

for (const entry of ledger.adapters) {
  const label = `web consumer ${entry.id}`

  assert.ok(['complete', 'partial', 'pending'].includes(entry.status), `${label} has an invalid status`)

  assert.ok(Array.isArray(entry.evidence), `${label} requires evidence links`)

  assert.ok(Array.isArray(entry.blockingIssues), `${label} requires blocking issues`)

  for (const check of requiredChecks) assert.equal(typeof entry.checks?.[check], 'boolean', `${label} requires boolean ${check} evidence`)

  if (entry.status === 'complete') {
    assert.match(entry.consumer.name, /\S/u, `${label} requires an active consumer name`)

    assert.match(entry.consumer.repository, /^https:\/\//u, `${label} requires an HTTPS consumer repository`)

    assert.ok(!entry.consumer.repository.endsWith('/lumen'), `${label} cannot qualify with a Lumen-owned fixture`)

    assert.match(entry.upgrade.revision, /^[\da-f]{40}$/iu, `${label} requires a full consumer revision`)

    assert.equal(entry.upgrade.toVersion, ledger.candidate.version, `${label} must upgrade the exact candidate`)

    assert.ok(Object.values(entry.checks).every(Boolean), `${label} must pass every required check`)

    assert.ok(entry.evidence.length > 0, `${label} requires immutable evidence`)

    assert.ok(entry.evidence.every(item => /^https:\/\//u.test(item)), `${label} evidence must use HTTPS URLs`)

    assert.deepEqual(entry.blockingIssues, [], `${label} cannot retain blockers when complete`)
  } else {
    assert.ok(entry.blockingIssues.length > 0, `${label} must explain why qualification is incomplete`)
  }
}

if (requireComplete) {
  assert.match(ledger.candidate.revision, /^[\da-f]{40}$/iu, 'Complete web evidence requires the Lumen candidate revision')

  assert.match(ledger.candidate.releaseManifestUrl, /^https:\/\//u, 'Complete web evidence requires an immutable release manifest URL')

  assert.ok(ledger.adapters.every(entry => entry.status === 'complete'), 'Every web adapter requires complete consumer evidence')
}

console.log(`Web consumer evidence is valid${requireComplete ? ' and complete' : ''}.`)
