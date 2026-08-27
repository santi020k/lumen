import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import test from 'node:test'

const repositoryRoot = resolve(import.meta.dirname, '..')
const checkerPath = resolve(repositoryRoot, 'scripts', 'check-native-stability-soak.mjs')
const sourceLedgerPath = resolve(repositoryRoot, 'registry', 'native-stability-soak.json')

const createEvidenceRecord = (repository, revision, runId) => ({
  repository,
  revision,
  revisionUrl: `${repository}/commit/${revision}`,
  verificationUrl: `${repository}/actions/runs/${runId}`
})

const createIteration = (ledger, index) => {
  const revision = `${index + 1}`.repeat(40)

  return {
    id: `native-soak.${index}`,
    date: `2026-08-2${index}`,
    revision,
    versions: {
      compose: `0.${index + 5}.0`,
      reactNative: `0.${index + 5}.0`,
      swift: `1.${index + 6}.0`,
      wear: `0.${index + 5}.0`
    },
    baselines: Object.fromEntries(
      Object.entries(ledger.baselines).map(([adapter, baseline]) => [adapter, baseline.sha256])
    ),
    evidence: {
      release: createEvidenceRecord(
        'https://github.com/santi020k/lumen',
        revision,
        index + 1
      ),
      consumerValidation: Object.fromEntries(
        [
          ['compose', 'compose'],
          ['reactNative', 'react-native'],
          ['swiftUI', 'swift'],
          ['swiftWidget', 'swift-widget'],
          ['wear', 'wear']
        ].map(([adapter, consumer], consumerIndex) => {
          const consumerRevision = `${consumerIndex + 4}`.repeat(40)

          return [
            adapter,
            createEvidenceRecord(
              `https://github.com/example/${consumer}`,
              consumerRevision,
              `${index + 1}-${consumerIndex + 1}`
            )
          ]
        })
      )
    }
  }
}

const runLedger = async (mutate, checkerArguments = []) => {
  const temporaryDirectory = await mkdtemp(resolve(tmpdir(), 'lumen-native-soak-'))

  try {
    const ledger = JSON.parse(await readFile(sourceLedgerPath, 'utf8'))

    ledger.iterations = [createIteration(ledger, 0), createIteration(ledger, 1)]

    mutate(ledger)

    const ledgerPath = resolve(temporaryDirectory, 'ledger.json')

    await writeFile(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`)

    return spawnSync(process.execPath, [checkerPath, '--ledger', ledgerPath, ...checkerArguments], {
      cwd: repositoryRoot,
      encoding: 'utf8'
    })
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true })
  }
}

test('accepts two chronological ordinary-release stability iterations', async () => {
  const result = await runLedger(() => {})

  assert.equal(result.status, 0, result.stderr)

  assert.match(result.stdout, /Validated 2\/2 native stability soak iterations/)
})

test('rejects a stability iteration dated in the future', async () => {
  const result = await runLedger(ledger => {
    ledger.iterations[1].date = '9999-12-31'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /date must not be in the future/)
})

test('requires both iterations in readiness mode', async () => {
  const result = await runLedger(ledger => {
    ledger.iterations.pop()
  }, ['--require-complete'])

  assert.equal(result.status, 1)

  assert.match(result.stderr, /Native stability soak is incomplete: 1 iteration\(s\) remain/)
})

test('rejects a consumer record without an immutable HTTPS URL', async () => {
  const result = await runLedger(ledger => {
    ledger.iterations[0].evidence.consumerValidation.wear.revisionUrl = 'local playground passed'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must be a valid HTTPS URL/)
})

test('rejects a soak ledger that omits the WidgetKit API baseline', async () => {
  const result = await runLedger(ledger => {
    delete ledger.baselines.swiftWidget
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /Soak ledger must cover every native API baseline/)
})

test('rejects an iteration without WidgetKit consumer evidence', async () => {
  const result = await runLedger(ledger => {
    delete ledger.iterations[0].evidence.consumerValidation.swiftWidget
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must record every real-consumer validation surface/)
})

test('rejects a release verification URL outside the repository workflow', async () => {
  const result = await runLedger(ledger => {
    ledger.iterations[0].evidence.release.verificationUrl = 'https://example.com/runs/1'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must be a permanent workflow, pipeline, job, or build URL/)
})

test('rejects release evidence for a different soak revision', async () => {
  const result = await runLedger(ledger => {
    ledger.iterations[0].evidence.release.revision = 'f'.repeat(40)

    ledger.iterations[0].evidence.release.revisionUrl =
      `https://github.com/santi020k/lumen/commit/${'f'.repeat(40)}`
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /revision must match the soak iteration revision/)
})

test('rejects a mutable consumer workflow definition', async () => {
  const result = await runLedger(ledger => {
    ledger.iterations[0].evidence.consumerValidation.compose.verificationUrl =
      'https://github.com/example/compose/actions/workflows/lumen-canary.yml'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must be a permanent workflow, pipeline, job, or build URL/)
})

test('rejects a consumer revision URL for a different revision', async () => {
  const result = await runLedger(ledger => {
    ledger.iterations[0].evidence.consumerValidation.compose.revisionUrl =
      `https://github.com/example/compose/commit/${'f'.repeat(40)}`
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must bind the exact repository revision/)
})

test('rejects a disguised Lumen fixture as consumer evidence', async () => {
  const result = await runLedger(ledger => {
    const evidence = ledger.iterations[0].evidence.consumerValidation.compose

    evidence.repository = 'https://github.com/santi020k/lumen.git/'

    evidence.revisionUrl = `https://github.com/santi020k/lumen/commit/${evidence.revision}`

    evidence.verificationUrl = 'https://github.com/santi020k/lumen/actions/runs/1'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must target an external consumer repository/)
})

test('rejects consumer evidence with URL query state', async () => {
  const result = await runLedger(ledger => {
    ledger.iterations[0].evidence.consumerValidation.compose.verificationUrl += '?attempt=1'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must not use a query string/)
})

test('rejects consumer evidence with URL fragment state', async () => {
  const result = await runLedger(ledger => {
    ledger.iterations[0].evidence.consumerValidation.compose.verificationUrl += '#attempt-1'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must not use a fragment/)
})

test('rejects an uppercase soak iteration revision', async () => {
  const result = await runLedger(ledger => {
    const iteration = ledger.iterations[0]

    iteration.revision = 'A'.repeat(40)

    iteration.evidence.release.revision = iteration.revision

    iteration.evidence.release.revisionUrl =
      `https://github.com/santi020k/lumen/commit/${iteration.revision}`
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /requires a full lowercase Git revision/)
})

test('rejects an iteration that does not upgrade every adapter', async () => {
  const result = await runLedger(ledger => {
    ledger.iterations[1].versions.compose = '0.5.0'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must be newer than the previous stability iteration/)
})

test('rejects prerelease versions', async () => {
  const result = await runLedger(ledger => {
    ledger.iterations[0].versions.reactNative = '1.0.0-rc.0'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must record an ordinary semantic release/)
})

test('rejects version 2 because it is the graduation release, not soak evidence', async () => {
  const result = await runLedger(ledger => {
    ledger.iterations[1].versions.swift = '2.0.0'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must remain on its pre-2\.0 release line/)
})
