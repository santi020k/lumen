import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const digest = async path => {
  const hash = createHash('sha256')

  for await (const chunk of createReadStream(path)) hash.update(chunk)

  return hash.digest('hex')
}

export const recordArtifact = async (archive, manifest, revision) => {
  assert.match(revision, /^[a-f0-9]{40}$/u, 'Expected a full source revision')

  const sha256 = await digest(archive)

  await writeFile(manifest, `${JSON.stringify({ schemaVersion: 1, revision, sha256 })}\n`)

  return sha256
}

export const verifyArtifact = async (archive, manifest, revision, expectedDigest) => {
  const metadata = JSON.parse(await readFile(manifest, 'utf8'))

  assert.match(revision, /^[a-f0-9]{40}$/u, 'Expected a full source revision')

  assert.match(expectedDigest, /^[a-f0-9]{64}$/u, 'Expected the build job archive digest')

  assert.equal(metadata.schemaVersion, 1, 'Unsupported docs artifact manifest')

  assert.equal(metadata.revision, revision, 'Docs artifact belongs to a different source revision')

  assert.equal(metadata.sha256, await digest(archive), 'Docs artifact checksum mismatch')

  assert.equal(metadata.sha256, expectedDigest, 'Docs artifact does not match the build job digest')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [mode, archive, manifest, expectedDigest, ...extra] = process.argv.slice(2)

  assert.ok(['record', 'verify'].includes(mode) && archive && manifest && extra.length === 0,
    'Usage: docs-deployment-artifact.mjs record|verify archive manifest [expected-digest]')

  const revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()

  if (mode === 'record') console.log(await recordArtifact(archive, manifest, revision))
  else await verifyArtifact(archive, manifest, revision, expectedDigest)
}
