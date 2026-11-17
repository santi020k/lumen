import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { recordArtifact, verifyArtifact } from './docs-deployment-artifact.mjs'

test('docs delivery accepts only the same revision and exact built archive', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lumen-docs-artifact-'))
  const archive = join(directory, 'docs.tar.gz')
  const manifest = join(directory, 'manifest.json')
  const revision = 'a'.repeat(40)

  try {
    await writeFile(archive, 'built pages')

    const digest = await recordArtifact(archive, manifest, revision)

    await verifyArtifact(archive, manifest, revision, digest)

    await assert.rejects(verifyArtifact(archive, manifest, 'b'.repeat(40), digest), /different source/u)

    await assert.rejects(verifyArtifact(archive, manifest, revision, ''), /build job archive digest/u)

    await assert.rejects(verifyArtifact(archive, manifest, revision, 'b'.repeat(64)), /build job digest/u)

    await writeFile(archive, 'different pages')

    await assert.rejects(verifyArtifact(archive, manifest, revision, digest), /checksum mismatch/u)

    await writeFile(archive, 'built pages')

    const original = await readFile(manifest, 'utf8')

    await writeFile(manifest, JSON.stringify({ ...JSON.parse(original), schemaVersion: 2 }))

    await assert.rejects(verifyArtifact(archive, manifest, revision, digest), /Unsupported/u)

    await writeFile(manifest, '{}')

    await assert.rejects(verifyArtifact(archive, manifest, revision, digest))

    await writeFile(manifest, '{')

    await assert.rejects(verifyArtifact(archive, manifest, revision, digest))

    await assert.rejects(recordArtifact(archive, manifest, 'main'), /full source revision/u)

    await writeFile(manifest, original)

    await assert.rejects(verifyArtifact(join(directory, 'missing'), manifest, revision, digest))
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
