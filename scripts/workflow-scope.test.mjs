import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, matchesGlob, resolve } from 'node:path'
import test from 'node:test'

// cspell:words predev vnext

const repositoryRoot = resolve(import.meta.dirname, '..')
const readRepositoryFile = path => readFile(resolve(repositoryRoot, path), 'utf8')

const [ci, canary, release, docsManifestSource, versionPackages] = await Promise.all([
  readRepositoryFile('.github/workflows/ci.yml'),
  readRepositoryFile('.github/workflows/release-canary.yml'),
  readRepositoryFile('.github/workflows/release.yml'),
  readRepositoryFile('apps/docs/package.json'),
  readRepositoryFile('scripts/version-packages.mjs')
])

test('prepared package versions trigger publication without pending Changesets', async () => {
  const pushConfiguration = release.slice(release.indexOf('  push:'), release.indexOf('  workflow_dispatch:'))

  assert.match(pushConfiguration, /branches: \[main\]/u)

  const patterns = pushConfiguration.split('\n').filter(line => line.trimStart().startsWith('- '))
    .map(line => JSON.parse(line.trim().slice(2)))

  const manifest = JSON.parse(await readRepositoryFile('registry/release-manifest.json'))
  const packages = Object.keys(manifest.release.npm.packages)

  for (const name of packages) {
    const directory = name === '@santi020k/lumen' ? 'lumen' : name.replace('@santi020k/lumen-', '')
    const path = `packages/${directory}/package.json`

    assert.ok(patterns.some(pattern => matchesGlob(path, pattern)), `${path} must trigger publication`)
  }

  for (const path of ['.changeset/release-note.md', 'registry/release-manifest.json', '.github/workflows/release.yml']) {
    assert.ok(patterns.some(pattern => matchesGlob(path, pattern)), `${path} must trigger publication`)
  }

  assert.ok(!patterns.some(pattern => matchesGlob('apps/docs/src/pages/index.astro', pattern)))
})

test('CI delegates path decisions and keeps package-family gates independent', () => {
  assert.match(ci, /node scripts\/classify-workflow-paths\.mjs ci/u)

  assert.match(ci, /HEAD_REPOSITORY: \$\{\{ github\.event\.pull_request\.head\.repo\.full_name \}\}/u)

  assert.match(ci, /\[\[ "\$HEAD_REPOSITORY" == "\$REPOSITORY" \]\]/u)

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

  const changesetGate = /- name: Require a changeset\n([\s\S]*?)\n\s+- name: Run CI checks/u.exec(ci)

  assert.ok(changesetGate, 'CI must define the changeset gate')

  assert.match(changesetGate[1], /needs\.classify\.outputs\.release-pr != 'true'/u)

  assert.match(changesetGate[1], /pnpm changeset status --since=origin\/main/u)
})

test('release pull request detection trusts only same-repository release branches', async () => {
  const match = /- name: Detect release pull request[\s\S]*?\n\s+run: \|\n([\s\S]*?)\n\n\s+- uses: actions\/checkout/u.exec(ci)

  assert.ok(match, 'CI must define executable release pull request detection')

  const script = match[1].replace(/^ {10}/gmu, '')
  const directory = await mkdtemp(join(tmpdir(), 'lumen-release-detection-'))

  const runDetection = async ({ headRef, headRepository, skipRequested = 'false' }) => {
    const outputPath = join(directory, `output-${crypto.randomUUID()}`)

    const result = spawnSync('bash', ['-euo', 'pipefail', '-c', script], {
      encoding: 'utf8',
      env: {
        ...process.env,
        GITHUB_OUTPUT: outputPath,
        HEAD_REF: headRef,
        HEAD_REPOSITORY: headRepository,
        REPOSITORY: 'santi020k/lumen',
        SKIP_CHANGELOG_REQUESTED: skipRequested
      }
    })

    assert.equal(result.status, 0, result.stderr)

    return Object.fromEntries(
      (await readFile(outputPath, 'utf8')).trim().split('\n').map(line => line.split('='))
    )
  }

  try {
    assert.deepEqual(
      await runDetection({
        headRef: 'release/v2.2.0',
        headRepository: 'santi020k/lumen'
      }),
      { value: 'true', 'skip-changelog': 'true' }
    )

    assert.deepEqual(
      await runDetection({
        headRef: 'release/v2.2.0',
        headRepository: 'contributor/lumen'
      }),
      { value: 'false', 'skip-changelog': 'false' }
    )

    assert.deepEqual(
      await runDetection({
        headRef: 'release/vnext',
        headRepository: 'santi020k/lumen'
      }),
      { value: 'false', 'skip-changelog': 'false' }
    )

    assert.deepEqual(
      await runDetection({
        headRef: 'changeset-release/main',
        headRepository: 'santi020k/lumen'
      }),
      { value: 'true', 'skip-changelog': 'true' }
    )
  } finally {
    await rm(directory, { recursive: true })
  }
})

test('release canaries keep manual full-matrix coverage and scope pull requests', () => {
  assert.match(canary, /workflow_dispatch: \{\}/u)

  assert.match(canary, /node scripts\/classify-workflow-paths\.mjs canary/u)

  assert.match(canary, /pnpm run build:release-scope/u)

  assert.match(canary, /needs\.classify\.outputs\.browser/u)

  assert.match(canary, /needs\.classify\.outputs\.react-native/u)

  assert.match(canary, /node scripts\/prepare-packed-react-native-canary\.mjs/u)

  assert.match(canary, /- "scripts\/prepare-packed-react-native-canary\.mjs"/u)

  assert.match(canary, /needs\.classify\.outputs\.native/u)
})

test('manual release canaries classify every surface without a pull request base', async () => {
  const fetchStep = /- name: Fetch comparison base\n([\s\S]*?)\n\s+- name:/u.exec(canary)

  assert.ok(fetchStep, 'The canary must define its comparison fetch')

  assert.match(fetchStep[1], /if: github\.event_name == 'pull_request'/u)

  const classifyStep = /- name: Classify changed paths[\s\S]*?\n\s+run: >-\n([\s\S]*?)\n\n/u.exec(canary)

  assert.ok(classifyStep, 'The canary must define executable path classification')

  const directory = await mkdtemp(join(tmpdir(), 'lumen-manual-canary-'))

  try {
    const outputPath = join(directory, 'outputs')
    const script = classifyStep[1].trim().split('\n').map(line => line.trim()).join(' ')

    const result = spawnSync('bash', ['-euo', 'pipefail', '-c', script], {
      cwd: repositoryRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        BASE_SHA: '',
        GITHUB_EVENT_NAME: 'workflow_dispatch',
        GITHUB_OUTPUT: outputPath,
        HEAD_SHA: ''
      }
    })

    assert.equal(result.status, 0, result.stderr)

    const outputs = Object.fromEntries(
      (await readFile(outputPath, 'utf8')).trim().split('\n').map(line => line.split('='))
    )

    for (const surface of ['browser', 'compose', 'consumer-packages', 'native', 'react-native', 'swift', 'web', 'web-contracts']) {
      assert.equal(outputs[surface], 'true', `${surface} must run for a manual canary`)
    }

    assert.equal(JSON.parse(outputs['npm-packages']).length, 10)
  } finally {
    await rm(directory, { recursive: true })
  }
})

test('npm release resolves and forwards the exact publication scope', () => {
  assert.match(
    release,
    /git update-ref refs\/heads\/main "\$GITHUB_SHA"[\s\S]*node scripts\/release-scope\.mjs --github-output/u
  )

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

test('MCP deployment skips unpublished and stale-tag revisions before production approval', async () => {
  const workflow = await readRepositoryFile('.github/workflows/deploy-mcp.yml')
  const [publication, deployment] = workflow.split('  deploy:\n')

  assert.ok(publication && deployment)

  assert.doesNotMatch(publication, /environment: production/u)

  assert.match(deployment, /needs: publication/u)

  assert.match(deployment, /if: needs\.publication\.outputs\.published == 'true'/u)

  assert.match(deployment, /environment: production/u)

  const script = publication.split('        run: |\n')[1]?.trimEnd().split('\n')
    .map(line => line.slice(10)).join('\n')

  assert.ok(script)

  for (const scenario of ['unpublished', 'published', 'stale']) {
    const directory = await mkdtemp(join(tmpdir(), 'lumen-mcp-publication-'))

    try {
      const git = args => {
        const result = spawnSync('git', ['-c', 'user.name=Release test', '-c', 'user.email=release@example.com', ...args], {
          cwd: directory, encoding: 'utf8'
        })

        assert.equal(result.status, 0, result.stderr)
      }

      git(['init', '--initial-branch=main'])

      await mkdir(join(directory, 'packages/lumen'), { recursive: true })

      await writeFile(join(directory, 'packages/lumen/package.json'), '{"version":"4.0.0"}')

      git(['add', '.'])

      git(['commit', '-m', 'fixture'])

      if (scenario !== 'unpublished') git(['tag', '-a', 'v4.0.0', '-m', 'fixture release'])

      if (scenario === 'stale') git(['commit', '--allow-empty', '-m', 'next revision'])

      const output = join(directory, 'outputs')

      const result = spawnSync('bash', ['-euo', 'pipefail', '-c', script], {
        cwd: directory, encoding: 'utf8', env: { ...process.env, GITHUB_OUTPUT: output }
      })

      assert.equal(result.status, 0, result.stderr)

      assert.equal(await readFile(output, 'utf8'), `published=${scenario === 'published'}\n`)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  }
})
