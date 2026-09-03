import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'

// cspell:words predev

const repositoryRoot = resolve(import.meta.dirname, '..')
const readRepositoryFile = path => readFile(resolve(repositoryRoot, path), 'utf8')

const [ci, canary, release, docsManifestSource, versionPackages] = await Promise.all([
  readRepositoryFile('.github/workflows/ci.yml'),
  readRepositoryFile('.github/workflows/release-canary.yml'),
  readRepositoryFile('.github/workflows/release.yml'),
  readRepositoryFile('apps/docs/package.json'),
  readRepositoryFile('scripts/version-packages.mjs')
])

test('CI delegates path decisions and keeps package-family gates independent', () => {
  assert.match(ci, /node scripts\/classify-workflow-paths\.mjs ci/u)

  assert.match(ci, /needs\.classify\.outputs\.bundle-size/u)

  assert.match(ci, /needs\.classify\.outputs\.framework-contracts/u)

  assert.match(ci, /needs\.classify\.outputs\.consumer-packages/u)

  assert.match(
    ci,
    /bundle-size[\s\S]*?consumer-packages[\s\S]*?pnpm run build:release-scope[\s\S]*?pnpm run check:bundle-size/u
  )

  assert.match(
    ci,
    /consumer-packages[\s\S]*?pnpm run check:consumer-packages/u
  )

  assert.doesNotMatch(
    ci,
    /if \[\[ "\$\{\{ needs\.classify\.outputs\.compatibility \}\}" == "true" \]\]; then\n[\s\S]*?pnpm run build\n/u
  )
})

test('release canaries keep manual full-matrix coverage and scope pull requests', () => {
  assert.match(canary, /workflow_dispatch: \{\}/u)

  assert.match(canary, /node scripts\/classify-workflow-paths\.mjs canary/u)

  assert.match(canary, /pnpm run build:release-scope/u)

  assert.match(canary, /needs\.classify\.outputs\.browser/u)

  assert.match(canary, /needs\.classify\.outputs\.react-native/u)

  assert.match(canary, /needs\.classify\.outputs\.native/u)
})

test('npm release resolves and forwards the exact publication scope', () => {
  assert.match(release, /node scripts\/release-scope\.mjs --github-output/u)

  assert.match(release, /LUMEN_RELEASE_PACKAGES: \$\{\{ steps\.scope\.outputs\.packages \}\}/u)

  assert.match(release, /LUMEN_RELEASE_PREPARED: "true"/u)

  assert.match(release, /pnpm run build:release-scope/u)

  assert.doesNotMatch(release, /pnpm run build &&/u)
})

test('version preparation scopes native, Swift, and MCP regeneration', () => {
  assert.match(versionPackages, /if \(classification\.native\)/u)

  assert.match(versionPackages, /if \(includesUmbrella\)/u)

  assert.match(versionPackages, /if \(classification\.mcp\)/u)

  assert.match(versionPackages, /generate:release-manifest/u)
})

test('Turbo owns the docs dependency build without a duplicate prebuild invocation', () => {
  const docsManifest = JSON.parse(docsManifestSource)

  assert.equal(docsManifest.scripts.prebuild, 'pnpm run prepare:native-live-previews')

  assert.match(docsManifest.scripts.predev, /lumen-playground-react-native/u)
})
