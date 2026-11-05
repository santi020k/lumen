import assert from 'node:assert/strict'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const source = await readFile(resolve(root, 'registry/lumen-5-contract.json'), 'utf8')
const contract = JSON.parse(source)

assert.equal(contract.schemaVersion, 1)

assert.equal(contract.targetVersion, '5.0.0')

assert.equal(typeof contract.publication, 'string')

assert.equal(typeof contract.status, 'string')

assert.ok(Array.isArray(contract.changes) && contract.changes.length > 0)

assert.equal(new Set(contract.changes.map(change => change.id)).size, contract.changes.length)

for (const change of contract.changes) {
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

const target = resolve(root, 'packages/lumen/v5-migration.json')

if (process.argv.includes('--check')) {
  assert.equal(await readFile(target, 'utf8'), source, 'Stale v5 contract. Run pnpm run generate:v5-migration.')
} else await writeFile(target, source)

process.stdout.write('lumen: v5 contract and references are current\n')
