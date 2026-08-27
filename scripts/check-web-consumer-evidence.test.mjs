import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const checker = path.join(root, 'scripts/check-web-consumer-evidence.mjs')
const sourceLedger = path.join(root, 'registry/web-consumer-evidence.json')
const runChecker = (ledgerPath, ...arguments_) => spawnSync(process.execPath, [checker, `--ledger=${ledgerPath}`, ...arguments_], { encoding: 'utf8' })

test('accepts the truthful pending web consumer ledger', () => {
  const result = runChecker(sourceLedger)

  assert.equal(result.status, 0, result.stderr)
})

test('keeps Lumen 2 graduation blocked while consumer evidence is pending', () => {
  const result = runChecker(sourceLedger, '--require-complete')

  assert.notEqual(result.status, 0)

  assert.match(result.stderr, /candidate revision|Every web adapter/u)
})

test('rejects a complete record backed by a Lumen fixture', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'lumen-web-consumer-'))
  const ledger = JSON.parse(await readFile(sourceLedger, 'utf8'))
  const entry = ledger.adapters[0]

  entry.status = 'complete'

  entry.consumer.repository = 'https://github.com/santi020k/lumen'

  entry.upgrade.revision = 'a'.repeat(40)

  entry.checks = Object.fromEntries(Object.keys(entry.checks).map(key => [key, true]))

  entry.evidence = ['https://github.com/santi020k/lumen/actions/runs/1']

  entry.blockingIssues = []

  const ledgerPath = path.join(directory, 'ledger.json')

  await writeFile(ledgerPath, JSON.stringify(ledger))

  const result = runChecker(ledgerPath)

  assert.notEqual(result.status, 0)

  assert.match(result.stderr, /cannot qualify with a Lumen-owned fixture/u)
})
