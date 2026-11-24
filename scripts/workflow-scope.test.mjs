import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, matchesGlob, resolve } from 'node:path'
import test from 'node:test'

// cspell:words predev vnext

const repositoryRoot = resolve(import.meta.dirname, '..')
const readRepositoryFile = path => readFile(resolve(repositoryRoot, path), 'utf8')
const appleWorkflow = await readRepositoryFile('.github/workflows/apple-native.yml')

const appleGateScript = name => {
  const section = appleWorkflow.split(`      - name: ${name}\n`)[1]?.split('      - uses:')[0]

  assert.ok(section, `Missing Apple scope gate: ${name}`)

  const script = section.split('        run: |\n')[1]

  assert.ok(script, `Missing executable Apple scope gate: ${name}`)

  return script.replace(/^ {10}/gmu, '')
}

test('Apple required check identities stay present while unaffected modes use Linux', () => {
  assert.match(appleWorkflow, /check: \[swift, react-native, visual, framework-visual\]/u)

  assert.match(appleWorkflow, /name: Apple \$\{\{ matrix\.check \}\}/u)

  assert.match(appleWorkflow, /name: Apple captures/u)

  assert.match(appleWorkflow, /needs\.classify\.outputs\[matrix\.check\] == 'true' && 'macos-26' \|\| 'ubuntu-latest'/u)

  assert.match(appleWorkflow, /node scripts\/classify-workflow-paths\.mjs apple/u)

  assert.match(appleWorkflow, /HEAD_REF: \$\{\{ github\.head_ref \}\}/u)

  assert.match(appleWorkflow, /HEAD_REPOSITORY: \$\{\{ github\.event\.pull_request\.head\.repo\.full_name \}\}/u)

  const gate = appleWorkflow.split('      - name: Run equivalent Apple gate\n')[1]?.split('      - name:')[0]

  assert.ok(gate)

  assert.match(gate, /if: needs\.classify\.outputs\[matrix\.check\] == 'true'/u)

  assert.match(gate, /run-native-checks\.sh/u)
})

test('Apple check gates reject failed classification and missing or malformed selection', () => {
  const script = appleGateScript('Require a valid Apple scope')

  for (const classification of ['success', 'failure', 'cancelled', 'skipped', '']) {
    for (const selected of ['true', 'false', '', 'unexpected']) {
      const result = spawnSync('bash', ['-euo', 'pipefail', '-c', script], {
        encoding: 'utf8',
        env: { ...process.env, CLASSIFICATION_RESULT: classification, SELECTED: selected, SCOPE_REASON: 'owned-inputs' }
      })

      assert.equal(result.status === 0, classification === 'success' && ['true', 'false'].includes(selected), `${classification}/${selected}`)
    }
  }
})

test('Apple capture gate requires complete selected shards or a verified unaffected plan', () => {
  const script = appleGateScript('Require every selected native capture group')

  for (const selected of ['true', 'false', '', 'unexpected']) {
    for (const buildResult of ['success', 'failure', 'cancelled', 'skipped']) {
      for (const captureResult of ['success', 'failure', 'cancelled', 'skipped']) {
        for (const classification of ['success', 'failure']) {
          const result = spawnSync('bash', ['-euo', 'pipefail', '-c', script], {
            encoding: 'utf8',
            env: { ...process.env, CLASSIFICATION_RESULT: classification, SELECTED: selected, BUILD_RESULT: buildResult, CAPTURE_RESULT: captureResult }
          })

          const expectedStatus = { true: 'success', false: 'skipped' }[selected]
          const expected = classification === 'success' && [buildResult, captureResult].every(status => status === expectedStatus)

          assert.equal(result.status === 0, expected, `${classification}/${selected}/${buildResult}/${captureResult}`)
        }
      }
    }
  }
})

test('signing eligibility requires executed Apple surfaces and successful aggregates', () => {
  const script = appleGateScript('Require every Apple surface before signing eligibility')

  const valid = {
    CLASSIFICATION_RESULT: 'success', CHECKS_RESULT: 'success', CAPTURES_RESULT: 'success',
    SWIFT_SELECTED: 'true', REACT_NATIVE_SELECTED: 'true', CAPTURES_SELECTED: 'true',
    VISUAL_SELECTED: 'true', FRAMEWORK_VISUAL_SELECTED: 'true'
  }

  const run = environment => spawnSync('bash', ['-euo', 'pipefail', '-c', script], {
    encoding: 'utf8', env: { ...process.env, ...environment }
  })

  assert.equal(run(valid).status, 0)

  for (const key of Object.keys(valid)) {
    for (const value of ['', 'false', 'skipped', 'failure', 'cancelled']) {
      assert.notEqual(run({ ...valid, [key]: value }).status, 0, `${key}/${value}`)
    }
  }

  const qualification = appleWorkflow.slice(appleWorkflow.indexOf('\n  qualification:'))

  assert.match(qualification, /needs: \[classify, checks, captures\]/u)

  assert.match(qualification, /if: always\(\).*needs\.classify\.outputs\.full == 'true'/u)
})

test('Apple CLI keeps manual and release qualification full with no changed files', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lumen-apple-scope-'))
  const script = resolve(repositoryRoot, 'scripts/classify-workflow-paths.mjs')

  try {
    for (const context of [
      { event: 'workflow_dispatch', branch: '', base: '', full: true },
      { event: 'pull_request', branch: 'release/v5.3.0', base: 'HEAD', full: true },
      { event: 'pull_request', branch: 'changeset-release/main', base: 'HEAD', full: true },
      { event: 'pull_request', branch: 'feature/button', base: 'HEAD', full: false }
    ]) {
      const outputPath = join(directory, crypto.randomUUID())

      const result = spawnSync(process.execPath, [script, 'apple', '--base', context.base, '--head', context.base, '--output', outputPath], {
        cwd: repositoryRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          GITHUB_EVENT_NAME: context.event, HEAD_REF: context.branch,
          GITHUB_REPOSITORY: 'santi020k/lumen', HEAD_REPOSITORY: 'santi020k/lumen'
        }
      })

      assert.equal(result.status, 0, result.stderr)

      const outputs = Object.fromEntries((await readFile(outputPath, 'utf8')).trim().split('\n').map(line => line.split('=')))

      for (const check of ['swift', 'react-native', 'captures', 'visual', 'framework-visual', 'full']) {
        assert.equal(outputs[check], String(context.full), `${context.branch}/${check}`)
      }
    }
  } finally {
    await rm(directory, { recursive: true })
  }
})

test('motion browser tests wait for their preview build and inherit the browser cache path', () => {
  const result = spawnSync(process.execPath, [
    resolve(repositoryRoot, 'node_modules/turbo/bin/turbo'),
    'run', 'test', '--filter=@santi020k/lumen-motion', '--dry=json', '--no-daemon'
  ], { cwd: repositoryRoot, encoding: 'utf8', timeout: 30_000 })

  assert.equal(result.status, 0, result.stderr)

  const task = JSON.parse(result.stdout).tasks.find(item => item.taskId === '@santi020k/lumen-motion#test')

  assert.ok(task, 'The task graph must include the motion browser suite')

  assert.ok(task.dependencies.includes('@santi020k/lumen-motion#build'))

  assert.ok(task.resolvedTaskDefinition.passThroughEnv.includes('PLAYWRIGHT_BROWSERS_PATH'))

  assert.ok(task.resolvedTaskDefinition.passThroughEnv.includes('LUMEN_MOTION_PORT'))
})

test('docs build hashes change when imported repository Markdown changes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lumen-docs-build-inputs-'))

  try {
    await mkdir(join(directory, 'apps/docs'), { recursive: true })

    await mkdir(join(directory, 'docs'))

    await writeFile(join(directory, 'package.json'), JSON.stringify({
      name: 'docs-cache-fixture', private: true,
      packageManager: JSON.parse(await readRepositoryFile('package.json')).packageManager
    }))

    await writeFile(join(directory, 'pnpm-workspace.yaml'), "packages:\n  - apps/*\n")

    await writeFile(join(directory, 'pnpm-lock.yaml'), "lockfileVersion: '9.0'\nimporters:\n  .: {}\n  apps/docs: {}\n")

    await writeFile(join(directory, 'turbo.json'), await readRepositoryFile('turbo.json'))

    await writeFile(join(directory, 'apps/docs/turbo.json'), await readRepositoryFile('apps/docs/turbo.json'))

    await writeFile(join(directory, 'apps/docs/package.json'), JSON.stringify({
      name: '@santi020k/lumen-docs', version: '0.0.0', scripts: { build: 'node -e ""' }
    }))

    const markdown = join(directory, 'docs/release.md')

    await writeFile(markdown, '# Release\nBefore\n')

    const buildHash = () => {
      const result = spawnSync(process.execPath, [
        resolve(repositoryRoot, 'node_modules/turbo/bin/turbo'),
        'run', 'build', '--filter=@santi020k/lumen-docs', '--dry=json', '--no-daemon'
      ], { cwd: directory, encoding: 'utf8', timeout: 30_000 })

      assert.equal(result.status, 0, result.stderr)

      const task = JSON.parse(result.stdout).tasks.find(item => item.taskId === '@santi020k/lumen-docs#build')

      assert.ok(task, 'The fixture must resolve the docs build task')

      return task.hash
    }

    const before = buildHash()

    await writeFile(markdown, '# Release\nAfter\n')

    assert.notEqual(buildHash(), before, 'Imported Markdown must invalidate cached HTML')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

const [ci, canary, release, docsManifestSource, versionPackages] = await Promise.all([
  readRepositoryFile('.github/workflows/ci.yml'),
  readRepositoryFile('.github/workflows/release-canary.yml'),
  readRepositoryFile('.github/workflows/release.yml'),
  readRepositoryFile('apps/docs/package.json'),
  readRepositoryFile('scripts/version-packages.mjs')
])

test('primitive motion has browser coverage for ordinary and release pull requests', () => {
  const ciBrowser = ci.slice(ci.indexOf('\n  browser-contracts:\n'), ci.indexOf('\n  react-native-captures:\n'))
  const releaseBrowser = canary.slice(canary.indexOf('\n  browser:\n'))
  const trigger = canary.slice(canary.indexOf('  pull_request:'), canary.indexOf('  workflow_dispatch:'))

  assert.match(ciBrowser, /run: pnpm run test:motion/u)

  assert.match(ciBrowser, /browsers: chromium firefox webkit/u)

  assert.match(releaseBrowser, /browsers: chromium webkit/u)

  assert.match(releaseBrowser, /if: matrix\.shard == 1 && needs\.classify\.outputs\.ci-browser != 'true'\n\s+run: pnpm run test:motion/u)

  assert.match(trigger, /- "tests\/motion\/\*\*"/u)

  assert.match(trigger, /- "playwright\.motion\.config\.ts"/u)
})

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

test('release canary classification checks out merge-base history', () => {
  const checkout = canary.split('      - name: Classify changed paths')[0]

  assert.match(checkout, /fetch-depth: 0/u)
})

test('manual release canaries classify every surface without a pull request base', async () => {
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


test('the HarmonyOS bundle check runs on the built workspace packages in the React Native job', () => {
  const job = ci.split('  react-native-captures:\n')[1]?.split(/\n {2}[a-z][a-z-]*:\n/u)[0]

  assert.ok(job, 'CI must preserve the React Native job')

  assert.match(job, /runs-on: ubuntu-latest/u)

  const build = job.indexOf('pnpm --filter @santi020k/lumen-react-native... run build')
  const bundle = job.indexOf('run: pnpm run check:harmony-bundle')
  const packed = job.indexOf('node scripts/prepare-packed-react-native-canary.mjs')

  assert.ok(build !== -1 && build < bundle, 'The HarmonyOS bundle needs the built React Native package')

  assert.ok(bundle < packed, 'The HarmonyOS bundle must resolve workspace packages, not the packed canary')
})

test('early failures block every expensive CI and release canary lane', () => {
  const expensiveJobs = {
    ci: ['native-android', 'native-android-device', 'browser-contracts', 'react-native-captures', 'mcp-node-20'],
    canary: ['web', 'compose', 'react-native-android', 'browser']
  }

  for (const [name, source] of [['ci', ci], ['canary', canary]]) {
    for (const job of expensiveJobs[name]) {
      const section = source.split(`  ${job}:\n`)[1]?.split(/\n {2}[a-z][a-z-]*:\n/u)[0]

      assert.ok(section, `${name} must preserve ${job}`)

      assert.match(section, /needs: \[classify, preflight\]/u)

      assert.doesNotMatch(section, /^ {4}if:.*always\(\)/mu)
    }
  }

  assert.match(ci, /quality\/\.github\/workflows\/reusable-pnpm-ci\.yml@[a-f0-9]{40}/u)

  assert.match(canary, /Check repository and dependency security before builds/u)
})

test('release preflight fetches the history required by graduated release checks', () => {
  const preflight = canary.split('  preflight:\n')[1]?.split('  web:\n')[0]

  assert.ok(preflight)

  assert.match(preflight, /actions\/checkout@[a-f0-9]{40}[^\n]*\n\s+with:\n\s+fetch-depth: 0/u)

  assert.match(preflight, /pnpm run check:graduated-release-revision/u)
})

test('browser sharding covers the entire suite and native consumers run independently', () => {
  const browser = canary.split('  browser:\n')[1]

  assert.match(browser, /fail-fast: true/u)

  assert.match(browser, /shard: \[1, 2\]/u)

  assert.match(browser, /test:a11y --shard=\$\{\{ matrix\.shard \}\}\/2 --max-failures=1/u)

  assert.match(browser, /if: matrix\.shard == 1/u)

  assert.match(browser, /pnpm run test:framework-conformance/u)

  const compose = canary.split('  compose:\n')[1].split('  react-native-android:\n')[0]

  assert.match(compose, /gradlew test lint apiCheck verifyMavenPublication/u)

  assert.doesNotMatch(compose, /check:react-native-native-package:android/u)

  assert.match(canary.split('  react-native-android:\n')[1], /check:react-native-native-package:android/u)
})

test('browser cache hits retain operating-system prerequisites', async () => {
  const action = await readRepositoryFile('.github/actions/setup-playwright/action.yml')

  assert.match(action, /hashFiles\('pnpm-lock\.yaml'\)/u)

  assert.match(action, /pnpm exec playwright install-deps "\$\{browsers\[@\]\}"/u)

  assert.match(action, /pnpm exec playwright install --with-deps "\$\{browsers\[@\]\}"/u)

  for (const source of [ci, canary]) {
    assert.match(source, /task-cache-path: \.turbo\/cache/u)

    assert.match(source, /cache: gradle/u)
  }
})


test('the required build context fails instead of skipping after failed preflight', () => {
  const build = ci.split('  build:\n')[1]

  assert.match(build, /if: always\(\)/u)

  const assertion = build.split('        run: |\n')[1]?.split('\n\n')[0]
    .replace(/^ {10}/gmu, '')

  assert.ok(assertion)

  for (const classification of ['success', 'failure', 'cancelled', 'skipped']) {
    for (const preflight of ['success', 'failure', 'cancelled', 'skipped']) {
      const result = spawnSync('bash', ['-euo', 'pipefail', '-c', assertion], {
        encoding: 'utf8',
        env: { ...process.env, CLASSIFICATION_RESULT: classification, PREFLIGHT_RESULT: preflight }
      })

      assert.equal(result.status, classification === 'success' && preflight === 'success' ? 0 : 1)
    }
  }

  assert.ok(build.indexOf('Require successful preflight') < build.indexOf('actions/checkout@'))
})

test('browser setup bounds Linux mirror waits and propagates configuration failures', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lumen-apt-test-'))
  const bin = join(root, 'bin')
  const config = join(root, 'apt.conf')
  const log = join(root, 'sudo.log')
  const script = resolve(repositoryRoot, '.github/actions/setup-playwright/configure-apt.sh')

  try {
    await mkdir(bin)

    await writeFile(join(bin, 'sudo'), `#!/bin/bash
printf '%s\\n' "$@" > "$MOCK_APT_LOG"
if [[ "$MOCK_APT_FAILURE" == true ]]; then exit 1; fi
if [[ "$1" == cp ]]; then cp "$2" "$3"; else cat > "$MOCK_APT_CONFIG"; fi
`, { mode: 0o755 })

    const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, MOCK_APT_CONFIG: config, MOCK_APT_LOG: log }
    const skipped = spawnSync('bash', [script], { encoding: 'utf8', env: { ...env, RUNNER_OS: 'macOS' } })

    assert.equal(skipped.status, 0, skipped.stderr)

    await assert.rejects(readFile(config), { code: 'ENOENT' })

    const mirrors = join(root, 'apt-mirrors.txt')

    await writeFile(mirrors, 'http://azure.archive.ubuntu.com/ubuntu/ priority:1\nhttps://archive.ubuntu.com/ubuntu/ priority:2\nhttps://security.ubuntu.com/ubuntu/ priority:3\n')

    const installed = spawnSync('bash', [script, mirrors], { encoding: 'utf8', env: { ...env, RUNNER_OS: 'Linux' } })

    assert.equal(installed.status, 0, installed.stderr)

    assert.equal(await readFile(mirrors, 'utf8'), 'https://archive.ubuntu.com/ubuntu/ priority:2\nhttps://security.ubuntu.com/ubuntu/ priority:3\n')

    assert.equal(await readFile(log, 'utf8'), 'tee\n/etc/apt/apt.conf.d/99-lumen-network\n')

    assert.equal(await readFile(config, 'utf8'), 'Acquire::http::Timeout "30";\nAcquire::https::Timeout "30";\nAcquire::Retries "2";\n')

    const unchangedMirrors = await readFile(mirrors, 'utf8')
    const repeated = spawnSync('bash', [script, mirrors], { encoding: 'utf8', env: { ...env, RUNNER_OS: 'Linux' } })

    assert.equal(repeated.status, 0, repeated.stderr)

    assert.equal(await readFile(mirrors, 'utf8'), unchangedMirrors)

    await writeFile(mirrors, 'http://azure.archive.ubuntu.com/ubuntu/ priority:1\n')

    const noFallback = spawnSync('bash', [script, mirrors], { encoding: 'utf8', env: { ...env, RUNNER_OS: 'Linux' } })

    assert.equal(noFallback.status, 0, noFallback.stderr)

    assert.equal(await readFile(mirrors, 'utf8'), 'http://azure.archive.ubuntu.com/ubuntu/ priority:1\n')

    const failed = spawnSync('bash', [script, mirrors], { encoding: 'utf8', env: { ...env, RUNNER_OS: 'Linux', MOCK_APT_FAILURE: 'true' } })

    assert.notEqual(failed.status, 0)

    const withFallback = 'http://azure.archive.ubuntu.com/ubuntu/ priority:1\nhttps://archive.ubuntu.com/ubuntu/ priority:2\n'

    await writeFile(mirrors, withFallback)

    const failedRewrite = spawnSync('bash', [script, mirrors], { encoding: 'utf8', env: { ...env, RUNNER_OS: 'Linux', MOCK_APT_FAILURE: 'true' } })

    assert.notEqual(failedRewrite.status, 0)

    assert.equal(await readFile(mirrors, 'utf8'), withFallback)

    const action = await readRepositoryFile('.github/actions/setup-playwright/action.yml')

    assert.match(action, /if: runner.os == 'Linux'/u)

    assert.ok(action.indexOf('configure-apt.sh') < action.indexOf('pnpm exec playwright install-deps'))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('shared Quality actions use the published immutable v2 revision', async () => {
  for (const name of await readdir(resolve(repositoryRoot, '.github/workflows'))) {
    if (!name.endsWith('.yml')) continue

    const workflow = await readRepositoryFile(`.github/workflows/${name}`)

    for (const reference of workflow.matchAll(/santi020k\/quality[^\s]*@([a-f0-9]+|v[0-9.]+)/gu)) {
      assert.equal(reference[1], 'ff490e9efbd5fdfbdb1e6c404f1741d04c57f585', name)
    }
  }
})

test('Quality impact remains shadow planning with explicit full release selection', async () => {
  const workflow = await readRepositoryFile('.github/workflows/quality-impact.yml')

  assert.match(workflow, /fetch-depth: 0/u)

  assert.match(workflow, /persist-credentials: false/u)

  assert.match(workflow, /quality\/ff490e9efbd5fdfbdb1e6c404f1741d04c57f585\/install\.sh/u)

  assert.match(workflow, /santi020k\/quality v2\.0\.0/u)

  assert.match(workflow, /'quality 2\.0\.0'/u)

  assert.match(workflow, /quality impact plan --full --head HEAD/u)

  assert.match(workflow, /quality impact plan --base "\$BASE_SHA" --head HEAD/u)

  assert.match(workflow, /workflow_dispatch/u)

  assert.match(workflow, /head\.repo\.full_name == github\.repository/u)

  assert.match(workflow, /startsWith\(github\.head_ref, 'release\/'\)/u)

  assert.match(workflow, /startsWith\(github\.head_ref, 'changeset-release\/'\)/u)

  assert.match(workflow, /node --test scripts\/quality-impact\.test\.mjs/u)

  assert.match(workflow, /Invalid impact selector or missing pull request base/u)

  assert.doesNotMatch(ci, /needs:[^\n]*impact/u)
})

test('docs deployment retries restore the same verified archive without rebuilding', async () => {
  const workflow = await readRepositoryFile('.github/workflows/deploy-docs.yml')
  const build = workflow.split('  build:\n')[1].split('  build-and-deploy:\n')[0]
  const deploy = workflow.split('  build-and-deploy:\n')[1]

  assert.match(build, /pnpm run docs:build/u)

  assert.match(build, /docs-deployment-artifact\.mjs record/u)

  assert.match(build, /name: docs-deployment-\$\{\{ github\.run_attempt \}\}/u)

  assert.match(build, /artifact-id: \$\{\{ steps\.upload\.outputs\.artifact-id \}\}/u)

  assert.match(workflow, /cancel-in-progress: false/u)

  assert.match(build, /retention-days: 7/u)

  assert.match(build, /if: github\.ref == 'refs\/heads\/main'/u)

  assert.match(build, /environment: production/u)

  assert.doesNotMatch(build, /secrets\./u)

  assert.match(deploy, /needs: build/u)

  assert.match(deploy, /name: Build and deploy docs/u)

  assert.match(deploy, /environment: production/u)

  assert.match(deploy, /actions\/download-artifact@[a-f0-9]{40}/u)

  assert.match(deploy, /artifact-ids: \$\{\{ needs\.build\.outputs\.artifact-id \}\}/u)

  assert.match(deploy, /EXPECTED_ARCHIVE_SHA256: \$\{\{ needs\.build\.outputs\.archive-sha256 \}\}/u)

  assert.doesNotMatch(deploy, /run-id:|github-token:|docs:build|turbo run build/u)

  assert.ok(deploy.indexOf('docs-deployment-artifact.mjs verify') < deploy.indexOf('tar -xzf'))

  assert.ok(deploy.indexOf('check-approved-release-revision.mjs') < deploy.indexOf('wrangler pages deploy'))

  assert.match(deploy, /Smoke test the public docs/u)
})

test('parallel browser suites share an environment-driven worker count', async () => {
  const { resolvePlaywrightWorkers } = await import('../playwright.shared.config.ts')

  assert.equal(resolvePlaywrightWorkers({}, 8), 2)

  assert.equal(resolvePlaywrightWorkers({ CI: 'true' }, 8), 4)

  assert.equal(resolvePlaywrightWorkers({ CI: 'true' }, 3), 3)

  assert.equal(resolvePlaywrightWorkers({ CI: 'true', LUMEN_PLAYWRIGHT_WORKERS: '6' }, 2), 6)

  assert.equal(resolvePlaywrightWorkers({ LUMEN_PLAYWRIGHT_WORKERS: '' }, 8), 2)

  for (const invalid of ['0', '-1', '1.5', 'four', '1000']) {
    assert.throws(() => resolvePlaywrightWorkers({ LUMEN_PLAYWRIGHT_WORKERS: invalid }, 8), /positive integer/u)
  }

  const configurations = (await readdir(repositoryRoot))
    .filter(name => /^playwright(?:\.[^.]+)?\.config\.ts$/u.test(name) && name !== 'playwright.shared.config.ts')

  // The Figma and rendered-audit suites stay serial by design.
  const serial = new Set(['playwright.figma.config.ts', 'playwright.rendered-audit.config.ts'])

  for (const name of configurations) {
    const source = await readRepositoryFile(name)

    if (serial.has(name)) assert.match(source, /workers: 1\b/u, name)
    else assert.match(source, /workers: playwrightWorkers\b/u, name)
  }

  const vitest = await readRepositoryFile('vitest.config.ts')

  assert.match(vitest, /process\.env\.LUMEN_VITEST_MAX_WORKERS/u)

  assert.match(vitest, /maxWorkers: suiteWorkers/u)
})

test('release canaries skip only the gates CI runs for the same revision', () => {
  const section = name => canary.split(`  ${name}:\n`)[1]?.split(/\n {2}[a-z][a-z-]*:\n/u)[0]
  const ciBrowser = ci.slice(ci.indexOf('\n  browser-contracts:\n'), ci.indexOf('\n  react-native-captures:\n'))
  const ciCompose = ci.slice(ci.indexOf('\n  native-android:\n'), ci.indexOf('\n  browser-contracts:\n'))

  assert.match(ci, /pull_request:\n\s+branches: \[main\]/u)

  assert.match(canary, /BASE_REF: \$\{\{ github\.base_ref \}\}/u)

  assert.match(section('preflight'), /if: needs\.classify\.outputs\.ci-preflight != 'true'\n\s+run: pnpm run ci:preflight/u)

  assert.match(ci, /command: pnpm run ci:preflight/u)

  assert.match(section('compose'), /if: needs\.classify\.outputs\.compose == 'true' && needs\.classify\.outputs\.ci-compose != 'true'/u)

  // Every command of a skipped canary gate must still run in the CI job that replaces it.
  for (const command of section('compose').matchAll(/(?:run: (?:>-\n\s+)?|^\s+)((?:\.\/gradlew|\.\/packages\/compose\/gradlew|pnpm run check:compose|node scripts\/check-wear)[^\n]*)/gmu)) {
    if (command[1].startsWith('./gradlew ')) {
      for (const task of command[1].split(' ').slice(1)) assert.match(ciCompose, new RegExp(`gradlew [^\\n]*\\b${task}\\b`, 'u'), task)
    } else {
      assert.ok(ciCompose.includes(command[1]), command[1])
    }
  }

  assert.match(ciCompose, /assembleDebug :app:verifyLumenArtifactIsolation/u)

  const skipped = [...section('browser').matchAll(/if: matrix\.shard == 1 && needs\.classify\.outputs\.ci-browser != 'true'\n(?:\s+env:\n\s+[^\n]+\n)?\s+run: ([^\n]+)/gu)]
    .flatMap(match => match[1].split(' && '))

  assert.deepEqual(skipped, [
    'pnpm run test:framework-conformance', 'pnpm run test:motion', 'pnpm run check:route-delivery', 'pnpm run measure:subscribe-form'
  ])

  for (const command of skipped) assert.ok(ciBrowser.includes(command), command)

  assert.doesNotMatch(ciBrowser.split('    steps:')[0] + ciCompose.split('    steps:')[0], /release-pr/u)
})

test('path classification uses a partial checkout that still contains its only inputs', async () => {
  const classifier = await readRepositoryFile('scripts/classify-workflow-paths.mjs')

  // The sparse checkout holds the scripts directory only, so the classifier must stay self-contained.
  for (const [, specifier] of classifier.matchAll(/^import [^\n]* from '([^']+)'$/gmu)) {
    assert.match(specifier, /^node:/u, specifier)
  }

  for (const [name, source] of [['ci', ci], ['canary', canary], ['apple', appleWorkflow]]) {
    const checkout = source.split('  classify:\n')[1].split(`node scripts/classify-workflow-paths.mjs ${name}`)[0]

    assert.match(checkout, /fetch-depth: 0\n(?:\s+#[^\n]*\n)*\s+filter: blob:none\n\s+sparse-checkout: scripts\n/u, name)
  }

  // Full-tree jobs that compare against the merge base keep every commit but skip old file contents.
  for (const source of [ci.split('  build:\n')[1], canary.split('  preflight:\n')[1]]) {
    for (const [checkout] of source.matchAll(/fetch-depth: 0\n(?:[^\n]*\n){0,3}/gu)) {
      assert.match(checkout, /filter: blob:none/u)

      assert.doesNotMatch(checkout, /sparse-checkout/u)
    }
  }
})

test('docs performance reuses cached builds while deployments always build fresh', async () => {
  const deployBuild = (await readRepositoryFile('.github/workflows/deploy-docs.yml')).split('  build:\n')[1].split('  build-and-deploy:\n')[0]
  const performance = await readRepositoryFile('.github/workflows/docs-performance.yml')

  assert.doesNotMatch(deployBuild, /task-cache|TURBO_TOKEN|QUALITY_TASK_RUNTIME/u)

  assert.match(performance, /TURBO_TOKEN: \$\{\{ secrets\.TURBO_TOKEN \}\}\n\s+TURBO_TEAM: \$\{\{ secrets\.TURBO_TEAM \}\}/u)

  assert.ok(performance.indexOf('QUALITY_TASK_RUNTIME=$(node --version)') > 0)

  assert.ok(performance.indexOf('QUALITY_TASK_RUNTIME=$(node --version)') < performance.indexOf('pnpm run docs:build'))
})

test('CI browser contracts run every suite exactly once across parallel lanes', async () => {
  const job = ci.slice(ci.indexOf('\n  browser-contracts:\n'), ci.indexOf('\n  react-native-captures:\n'))
  const manifest = JSON.parse(await readRepositoryFile('package.json'))

  assert.match(job, /lane: \[interactions-1, interactions-2, frameworks, motion\]/u)

  assert.match(job, /fail-fast: false/u)

  const steps = job.split('    steps:\n')[1].split(/\n\n(?= {6}- )/u).filter(step => step.includes('        run: pnpm'))
  const lanes = Object.fromEntries(steps.map(step => [/run: ([^\n]+)/u.exec(step)[1], /if: ([^\n]+)/u.exec(step)?.[1]]))

  assert.deepEqual(lanes, {
    'pnpm run test:interactions --shard="$SHARD"': "startsWith(matrix.lane, 'interactions-')",
    'pnpm run test:framework-conformance && pnpm run test:figma-plugin': "matrix.lane == 'frameworks'",
    'pnpm exec turbo run build --filter=@santi020k/lumen-motion --concurrency=2 && pnpm --filter @santi020k/lumen-motion test': "matrix.lane == 'motion'",
    'pnpm run test:motion && pnpm run check:route-delivery': "matrix.lane == 'motion'",
    'pnpm run measure:subscribe-form': "matrix.lane == 'motion'",
    'pnpm run test:web-coverage': "matrix.lane == 'motion'"
  })

  // Both halves of the split suite must be scheduled, and nothing else may be sharded.
  assert.match(job, /SHARD: \$\{\{ matrix\.lane == 'interactions-1' && '1\/2' \|\| '2\/2' \}\}/u)

  assert.equal(job.match(/--shard/gu).length, 1)

  assert.match(job, /TURBO_TOKEN: \$\{\{ secrets\.TURBO_TOKEN \}\}/u)

  assert.ok(job.indexOf('QUALITY_TASK_RUNTIME=') < job.indexOf('pnpm run test:interactions'))

  // Browser servers build their packages through Turbo so those lanes can reuse cached outputs.
  assert.match(manifest.scripts['prepare:docs-browser'], /^turbo run build (?:--filter=\S+ )+--concurrency=2$/u)
})

test('the isolated CI motion lane builds core exports before its preview', () => {
  const step = ci.split('      - name: Check local motion previews\n')[1]?.split('      - name:')[0]
  const command = /run: (.+?) && /u.exec(step ?? '')?.[1]

  assert.ok(command, 'The motion preview must be built before browser tests run')

  assert.ok(command.startsWith('pnpm exec turbo '), 'Workspace build dependencies must be scheduled')

  const result = spawnSync(process.execPath, [
    resolve(repositoryRoot, 'node_modules/turbo/bin/turbo'),
    ...command.slice('pnpm exec turbo '.length).split(' '), '--dry=json', '--no-daemon'
  ], { cwd: repositoryRoot, encoding: 'utf8', timeout: 30_000 })

  assert.equal(result.status, 0, result.stderr)

  const { tasks } = JSON.parse(result.stdout)
  const preview = tasks.find(task => task.taskId === '@santi020k/lumen-motion#build')

  assert.ok(preview)

  for (const dependency of ['@santi020k/lumen-core#build', '@santi020k/lumen-astro#build']) {
    assert.ok(preview.dependencies.includes(dependency), `Preview must wait for ${dependency}`)

    assert.ok(tasks.some(task => task.taskId === dependency), `${dependency} must be scheduled`)
  }
})

test('Compose library gates and device checks run as independent jobs', async () => {
  const library = ci.slice(ci.indexOf('\n  native-android:\n'), ci.indexOf('\n  native-android-device:\n'))
  const device = ci.slice(ci.indexOf('\n  native-android-device:\n'), ci.indexOf('\n  browser-contracts:\n'))
  const settings = await readRepositoryFile('apps/playground-android/settings.gradle.kts')

  assert.match(library, /run: \.\/gradlew test lint apiCheck verifyMavenPublication\n/u)

  assert.match(library, /-PlumenComposeRepository=\.\.\/\.\.\/packages\/compose\/build\/central-staging\n\s+assembleDebug :app:verifyLumenArtifactIsolation/u)

  assert.doesNotMatch(library, /emulator|connectedDebugAndroidTest/u)

  // The device job never reads the staged artifact: without the repository property the
  // playground consumes the library as an included source build.
  assert.doesNotMatch(device, /lumenComposeRepository|central-staging/u)

  assert.match(settings, /if \(!lumenComposeRepository\.isPresent\) \{\n\s+includeBuild\("\.\.\/\.\.\/packages\/compose"\)/u)

  for (const command of [
    '"system-images;android-35;google_apis;x86_64"',
    "run_phase 'Compose instrumentation' ./gradlew connectedDebugAndroidTest",
    "run_phase 'Android consumer install' ./gradlew -p ../../apps/playground-android :app:assembleDebug :app:installDebug",
    '--compare --platform=android --source=default --tolerance=0.12',
    'name: compose-android-test-reports'
  ]) {
    assert.ok(device.includes(command), command)
  }

  for (const job of [library, device]) {
    assert.match(job, /if: needs\.classify\.outputs\.android == 'true'/u)

    assert.match(job, /cache: gradle/u)
  }
})

test('main seeds the shared caches with the exact keys pull request jobs read', async () => {
  const seed = await readRepositoryFile('.github/workflows/ci-caches.yml')
  const keys = source => [...source.matchAll(/^ {10}key: (swift-[^\n]+)$/gmu)].map(match => match[1]).sort()
  const gradlePaths = source => /cache: gradle\n\s+cache-dependency-path: \|\n((?: {12}[^\n]+\n)+)/u.exec(source)?.[1]

  assert.match(seed, /push:\n\s+branches: \[main\]/u)

  assert.doesNotMatch(seed, /pull_request/u)

  for (const job of seed.split('\njobs:\n')[1].split(/\n(?= {2}[a-z][a-z-]*:\n)/u)) {
    assert.match(job, /if: github\.ref == 'refs\/heads\/main'/u)
  }

  // Pull requests restore Swift builds and never write them.
  const appleSwift = appleWorkflow.slice(appleWorkflow.indexOf('- name: Restore Swift build cache'), appleWorkflow.indexOf('- name: Set up cached browsers'))

  assert.equal(appleSwift.match(/uses: actions\/cache\/restore@[a-f0-9]{40}/gu).length, 2)

  assert.doesNotMatch(appleWorkflow, /uses: actions\/cache(?:\/save)?@/u)

  assert.doesNotMatch(appleSwift, /github\.sha/u)

  assert.equal(keys(appleWorkflow).length, 2)

  assert.deepEqual([...new Set(keys(seed))], keys(appleWorkflow))

  for (const key of keys(appleWorkflow)) {
    assert.equal(seed.split(`key: ${key}\n`).length - 1, 2, 'each Swift cache needs one lookup and one save')
  }

  assert.equal(seed.match(/lookup-only: true/gu).length, 2)

  assert.match(seed, /DEVELOPER_DIR: \/Applications\/Xcode_26\.5\.app\/Contents\/Developer/u)

  assert.match(seed, /github\.event\.repository\.private == false\n\s+runs-on: macos-26/u)

  assert.ok(gradlePaths(seed))

  assert.equal(gradlePaths(seed), gradlePaths(ci.split('  native-android:\n')[1]))

  assert.equal(gradlePaths(seed), gradlePaths(canary.split('  compose:\n')[1]))

  const seeded = /browsers: \[([^\]]+)\]/u.exec(seed)[1].split(', ')

  for (const name of ['ci.yml', 'release-canary.yml', 'docs-performance.yml']) {
    const workflow = await readRepositoryFile(`.github/workflows/${name}`)

    for (const [, browsers] of workflow.matchAll(/^ {10}browsers: ([^\n$]+)$/gmu)) {
      assert.ok(seeded.includes(browsers), `${name}: ${browsers}`)
    }
  }

  assert.match(seed.split('  apple:\n')[1], /setup-playwright\n\s+with:\n\s+browsers: chromium\n/u)
})
