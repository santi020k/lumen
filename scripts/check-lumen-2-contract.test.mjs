import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import test from 'node:test'

const repositoryRoot = resolve(import.meta.dirname, '..')
const checkerPath = resolve(repositoryRoot, 'scripts', 'check-lumen-2-contract.mjs')
const sourceContractPath = resolve(repositoryRoot, 'registry', 'lumen-2-contract.json')
const sourceReleaseManifestPath = resolve(repositoryRoot, 'registry', 'release-manifest.json')
const reviewedRevision = 'a'.repeat(40)
const releaseRevision = 'b'.repeat(40)

const approveContract = contract => {
  contract.status = 'approved'

  contract.approval = {
    approver: 'Lumen release owner',
    date: '2026-08-20',
    reviewedRevision,
    evidence: [
      `https://github.com/santi020k/lumen/commit/${reviewedRevision}`,
      'https://github.com/santi020k/lumen/pull/200'
    ]
  }
}

const graduateContract = contract => {
  contract.graduation = {
    verifiedBy: 'Lumen release owner',
    date: '2026-08-21',
    version: '2.0.0',
    releaseRevision,
    evidence: [
      `https://github.com/santi020k/lumen/commit/${releaseRevision}`,
      'https://github.com/santi020k/lumen/releases/tag/v2.0.0'
    ]
  }
}

const runContract = async (mutate, { targetVersions = false } = {}) => {
  const temporaryDirectory = await mkdtemp(resolve(tmpdir(), 'lumen-v2-contract-'))

  try {
    const contract = JSON.parse(await readFile(sourceContractPath, 'utf8'))

    approveContract(contract)

    mutate(contract)

    const contractPath = resolve(temporaryDirectory, 'contract.json')
    const releaseManifestPath = resolve(temporaryDirectory, 'release-manifest.json')

    await writeFile(contractPath, `${JSON.stringify(contract, null, 2)}\n`)

    const releaseManifest = JSON.parse(await readFile(sourceReleaseManifestPath, 'utf8'))

    if (targetVersions) {
      releaseManifest.release.version = contract.targetVersion

      for (const packageDefinition of Object.values(releaseManifest.release.npm.packages)) {
        packageDefinition.version = contract.targetVersion
      }
    }

    await writeFile(releaseManifestPath, `${JSON.stringify(releaseManifest, null, 2)}\n`)

    return spawnSync(
      process.execPath,
      [
        checkerPath,
        '--contract', contractPath,
        '--release-manifest', releaseManifestPath,
        '--require-approved'
      ],
      { cwd: repositoryRoot, encoding: 'utf8' }
    )
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true })
  }
}

test('accepts approval bound to the reviewed revision and a permanent decision record', async () => {
  const result = await runContract(() => {})

  assert.equal(result.status, 0, result.stderr)

  assert.match(result.stdout, /Lumen 2 approved contract check passed/)
})

test('rejects reviewed removed exports once package manifests reach version 2', async () => {
  const result = await runContract(() => {}, { targetVersions: true })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /Sonner is still exported from the current package root/)

  assert.match(result.stderr, /LumenDateField is still exported from the current package root/)
})

test('rejects an approval date in the future', async () => {
  const result = await runContract(contract => {
    contract.approval.date = '9999-12-31'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /approval\.date must not be in the future/)
})

test('rejects generic HTTPS approval evidence', async () => {
  const result = await runContract(contract => {
    contract.approval.evidence[1] = 'https://example.com/approval'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must use immutable Lumen revision or permanent decision URLs/)
})

test('rejects approval evidence for a different reviewed revision', async () => {
  const result = await runContract(contract => {
    contract.approval.evidence[0] =
      `https://github.com/santi020k/lumen/commit/${'f'.repeat(40)}`
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must include the exact recorded revision/)
})

test('reports a malformed reviewed revision without compiling it as a pattern', async () => {
  const result = await runContract(contract => {
    contract.approval.reviewedRevision = '[invalid-revision'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /reviewedRevision must be a full lowercase Git revision/)

  assert.doesNotMatch(result.stderr, /Invalid regular expression/)
})

test('rejects mutable approval evidence state', async () => {
  const result = await runContract(contract => {
    contract.approval.evidence[1] = 'https://github.com/santi020k/lumen/pull/200?review=approved'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must not use a query string/)
})

test('rejects approval without a separate permanent decision record', async () => {
  const result = await runContract(contract => {
    contract.approval.evidence = [
      `https://github.com/santi020k/lumen/commit/${reviewedRevision}`,
      `https://github.com/santi020k/lumen/blob/${reviewedRevision}/registry/lumen-2-contract.json`
    ]
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must include a permanent decision record/)
})

test('accepts graduation bound to the release revision and immutable v2 tag', async () => {
  const result = await runContract(graduateContract)

  assert.equal(result.status, 0, result.stderr)
})

test('rejects a graduation date in the future', async () => {
  const result = await runContract(contract => {
    graduateContract(contract)

    contract.graduation.date = '9999-12-31'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /graduation\.date must not be in the future/)
})

test('rejects graduation evidence for a different release revision', async () => {
  const result = await runContract(contract => {
    graduateContract(contract)

    contract.graduation.evidence[0] =
      `https://github.com/santi020k/lumen/commit/${'f'.repeat(40)}`
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must include the exact recorded revision/)
})

test('rejects graduation without a permanent tag or verification run', async () => {
  const result = await runContract(contract => {
    graduateContract(contract)

    contract.graduation.evidence[1] = 'https://github.com/santi020k/lumen/issues/200'
  })

  assert.equal(result.status, 1)

  assert.match(result.stderr, /must include a permanent decision record/)
})
