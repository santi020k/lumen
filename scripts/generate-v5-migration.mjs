import assert from 'node:assert/strict'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { validateContractApproval } from './check-lumen-3-contract.mjs'

const validateChange = async (change, root) => {
  assert.ok(['adoption', 'breaking'].includes(change.kind))

  for (const field of ['id', 'currentContract', 'replacement', 'migration']) {
    assert.ok(typeof change[field] === 'string' && change[field].trim())
  }

  for (const field of ['docs', 'evidence', 'packages', 'tests', 'signals', 'extensions']) {
    assert.ok(Array.isArray(change[field]) && change[field].every(item => typeof item === 'string' && item.trim()))
  }

  for (const path of [...change.docs, ...change.evidence]) {
    assert.ok(!path.startsWith('/') && !path.includes('..') && !path.includes('\\'))

    assert.ok((await stat(resolve(root, path))).isFile(), `Missing contract reference: ${path}`)
  }
}

export const validateLumen5Contract = async (contract, root) => {
  assert.equal(contract.schemaVersion, 1)

  assert.equal(contract.targetVersion, '5.0.0')

  assert.equal(contract.publication, 'unverified', 'Bundled contracts cannot establish registry availability')

  assert.ok(['draft', 'approved'].includes(contract.status), 'status must be draft or approved')

  assert.equal(contract.swiftApiBaseline, 'v4.4.0', 'The v5 Swift baseline must be v4.4.0')

  assert.deepEqual(validateContractApproval(contract), [], 'Lumen 5 approval validation failed')

  assert.ok(contract.npmPublicationVersions && typeof contract.npmPublicationVersions === 'object' &&
    !Array.isArray(contract.npmPublicationVersions), 'The v5 publication set is required')

  assert.equal(contract.npmPublicationVersions['@santi020k/lumen'], '5.0.0')

  for (const [name, version] of Object.entries(contract.npmPublicationVersions)) {
    assert.match(name, /^@santi020k\/lumen(?:-[a-z-]+)?$/u)

    assert.match(version, /^\d+\.\d+\.\d+$/u)
  }

  assert.ok(Array.isArray(contract.changes) && contract.changes.length > 0)

  assert.equal(new Set(contract.changes.map(change => change.id)).size, contract.changes.length)

  for (const change of contract.changes) await validateChange(change, root)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(import.meta.dirname, '..')
  const source = await readFile(resolve(root, 'registry/lumen-5-contract.json'), 'utf8')

  await validateLumen5Contract(JSON.parse(source), root)

  const target = resolve(root, 'packages/lumen/v5-migration.json')

  if (process.argv.includes('--check')) {
    assert.equal(await readFile(target, 'utf8'), source, 'Stale v5 contract. Run pnpm run generate:v5-migration.')
  } else await writeFile(target, source)

  process.stdout.write('lumen: v5 contract and references are current\n')
}
