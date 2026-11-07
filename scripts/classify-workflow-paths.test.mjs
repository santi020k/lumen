import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  changedPaths,
  classifyCanaryPaths,
  classifyChangedNpmPackages,
  classifyCiPaths
} from './classify-workflow-paths.mjs'

test('Git scope includes both rename sides, deletions and unusual names from the merge base', () => {
  const directory = mkdtempSync(join(tmpdir(), 'lumen-workflow-scope-'))
  const original = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.startsWith('GIT_')))
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')))
  const git = args => execFileSync('git', args, { cwd: directory, env, encoding: 'utf8', stdio: 'pipe' })

  try {
    git(['init', '--quiet', '-b', 'main'])

    git(['config', 'user.name', 'CI fixture'])

    git(['config', 'user.email', 'ci@example.test'])

    mkdirSync(join(directory, 'packages/swift'), { recursive: true })

    writeFileSync(join(directory, 'packages/swift/moved.swift'), 'source')

    writeFileSync(join(directory, 'packages/swift/deleted.swift'), 'source')

    git(['add', '.'])

    git(['commit', '-m', 'fixture'])

    git(['branch', 'feature'])

    writeFileSync(join(directory, 'base-only'), 'unrelated base change')

    git(['add', '.'])

    git(['commit', '-m', 'base changes'])

    git(['switch', 'feature'])

    mkdirSync(join(directory, 'docs'))

    git(['mv', 'packages/swift/moved.swift', 'docs/moved.md'])

    git(['rm', 'packages/swift/deleted.swift'])

    writeFileSync(join(directory, 'docs/line\nbreak.md'), 'unusual name')

    git(['add', '.'])

    git(['commit', '-m', 'feature changes'])

    Object.assign(process.env, { GIT_DIR: '/missing/git', GIT_WORK_TREE: '/missing/tree' })

    const paths = changedPaths('main', 'HEAD', directory)

    assert.deepEqual(paths, ['docs/line\nbreak.md', 'docs/moved.md', 'packages/swift/deleted.swift', 'packages/swift/moved.swift'])

    assert.equal(classifyCiPaths(paths).apple, true)

    assert.equal(classifyCanaryPaths(paths).swift, true)

    assert.throws(() => changedPaths('missing-revision', 'HEAD', directory))
  } finally {
    for (const key of Object.keys(process.env).filter(key => key.startsWith('GIT_'))) delete process.env[key]

    Object.assign(process.env, original)

    rmSync(directory, { recursive: true, force: true })
  }
})

test('Figma plugin sources and browser regressions select browser coverage', () => {
  for (const path of ['apps/figma-plugin/src/plugin.ts', 'tests/figma/plugin.spec.ts']) {
    const classification = classifyCiPaths([path])

    assert.equal(classification.playwright, true)

    assert.equal(classification.apple, false)

    assert.equal(classification.android, false)
  }
})

test('motion source changes select browser coverage without native jobs', () => {
  const classification = classifyCiPaths(['apps/motion/src/scripts/timeline.ts'])

  assert.equal(classification.playwright, true)

  assert.equal(classification.apple, false)

  assert.equal(classification.android, false)
})

test('primitive motion regressions select CI and release browser coverage', () => {
  for (const path of ['tests/motion/playground.spec.ts', 'playwright.motion.config.ts']) {
    const ci = classifyCiPaths([path])
    const canary = classifyCanaryPaths([path])

    assert.equal(ci.playwright, true, path)

    assert.equal(canary.browser, true, path)

    assert.equal(ci.apple, false, path)

    assert.equal(ci.android, false, path)
  }
})

test('editorial consumer regressions select browser coverage', () => {
  for (const path of ['tests/editorial/editorial.spec.ts', 'tests/fixtures/editorial/index.astro.template', 'packages/lumen/scripts/prepare-editorial-consumer.mjs', 'playwright.editorial.config.ts']) {
    assert.equal(classifyCiPaths([path]).playwright, true, path)

    assert.equal(classifyCanaryPaths([path]).browser, true, path)
  }
})

test('product workflow consumer regressions select browser coverage', () => {
  for (const path of [
    'tests/product-workflows/workflows.spec.ts',
    'tests/fixtures/product-workflows/index.astro.template',
    'tests/fixtures/product-workflows/captions.vtt',
    'packages/lumen/scripts/prepare-product-workflow-consumer.mjs',
    'playwright.product-workflows.config.ts'
  ]) {
    assert.equal(classifyCiPaths([path]).playwright, true, path)

    assert.equal(classifyCanaryPaths([path]).browser, true, path)

    assert.equal(classifyCiPaths([path]).apple, false, path)

    assert.equal(classifyCiPaths([path]).android, false, path)
  }
})

test('rendered audit regressions select browser coverage without native jobs', () => {
  for (const path of ['tests/rendered-audit/audit.spec.ts', 'playwright.rendered-audit.config.ts']) {
    assert.equal(classifyCiPaths([path]).playwright, true, path)

    assert.equal(classifyCanaryPaths([path]).browser, true, path)

    assert.equal(classifyCiPaths([path]).apple, false, path)

    assert.equal(classifyCiPaths([path]).android, false, path)
  }
})

test('a web package change skips every native platform job', () => {
  const classification = classifyCiPaths(['packages/react/src/Button.tsx'])

  assert.equal(classification.compatibility, true)

  assert.equal(classification.playwright, true)

  assert.equal(classification['bundle-size'], true)

  assert.equal(classification['consumer-packages'], true)

  assert.equal(classification['framework-contracts'], true)

  assert.equal(classification.apple, false)

  assert.equal(classification.android, false)

  assert.equal(classification['react-native-captures'], false)

  assert.equal(classification['native-contracts'], false)
})

test('each playground selects only its owning expensive surface', () => {
  const apple = classifyCiPaths(['apps/playground-apple/Sources/App.swift'])
  const android = classifyCiPaths(['apps/playground-android/app/src/main/Main.kt'])
  const reactNative = classifyCiPaths(['apps/playground-react-native/App.tsx'])

  assert.equal(apple.apple, true)

  assert.equal(apple.android, false)

  assert.equal(android.android, true)

  assert.equal(android.apple, false)

  assert.equal(reactNative['react-native-captures'], true)

  assert.equal(reactNative.apple, false)

  assert.equal(reactNative.android, false)
})

test('Apple release automation selects its dedicated CI and canary coverage', () => {
  for (const path of [
    'scripts/check-playground-apple-release.mjs',
    'scripts/check-playground-apple-release.test.mjs',
    '.github/scripts/monitor-xcode-cloud.mjs',
    '.github/scripts/monitor-xcode-cloud.test.mjs',
    '.github/workflows/release-playground-apple.yml',
    '.github/workflows/monitor-playground-apple.yml',
    '.github/workflows/release-playground-macos.yml',
    '.github/workflows/monitor-playground-macos.yml'
  ]) {
    assert.equal(classifyCiPaths([path]).apple, true, path)

    assert.equal(classifyCanaryPaths([path]).swift, true, path)
  }
})

test('a version-only release lockfile does not fan out to platforms', () => {
  const classification = classifyCiPaths(
    ['packages/react/package.json', 'pnpm-lock.yaml'],
    { releasePullRequest: true }
  )

  assert.equal(classification.compatibility, true)

  assert.equal(classification.dependencies, false)

  assert.equal(classification.apple, false)

  assert.equal(classification.android, false)

  assert.equal(classification['react-native-captures'], false)
})

test('shared native foundations intentionally select every native adapter', () => {
  const classification = classifyCiPaths(['packages/tokens/src/index.ts'])

  assert.equal(classification.apple, true)

  assert.equal(classification.android, true)

  assert.equal(classification['react-native-captures'], true)

  assert.equal(classification['native-contracts'], true)
})

test('the Lumen 3 Swift contract selects Apple and native compatibility gates', () => {
  const classification = classifyCiPaths(['registry/lumen-3-contract.json'])

  assert.equal(classification.apple, true)

  assert.equal(classification['native-contracts'], true)
})

test('the Lumen 4 contract selects native and publication qualification gates', () => {
  const path = 'registry/lumen-4-contract.json'
  const ci = classifyCiPaths([path])
  const canary = classifyCanaryPaths([path])

  assert.equal(ci.apple, true)

  assert.equal(ci['native-contracts'], true)

  assert.equal(canary.native, true)

  assert.equal(canary.swift, true)
})

test('canaries isolate web, Swift, and Compose package changes', () => {
  const react = classifyCanaryPaths(['packages/react/src/Button.tsx'])
  const swift = classifyCanaryPaths(['packages/swift/Sources/LumenUI/Button.swift'])
  const compose = classifyCanaryPaths(['packages/compose/src/commonMain/Button.kt'])

  assert.equal(react.web, true)

  assert.equal(react.swift, false)

  assert.equal(react.compose, false)

  assert.equal(react.browser, true)

  assert.equal(react['web-contracts'], true)

  assert.equal(react.native, false)

  assert.equal(swift.web, false)

  assert.equal(swift.swift, true)

  assert.equal(swift.compose, false)

  assert.equal(compose.web, false)

  assert.equal(compose.swift, false)

  assert.equal(compose.compose, true)
})

test('packed React Native canary helper changes select every required remote gate', () => {
  const classification = classifyCanaryPaths([
    'scripts/prepare-packed-react-native-canary.mjs'
  ])

  assert.equal(classification.web, true)

  assert.equal(classification.native, true)

  assert.equal(classification['react-native'], true)
})

test('manual canary dispatch remains the explicit full matrix', () => {
  const classification = classifyCanaryPaths([], { manual: true })

  assert.equal(classification.web, true)

  assert.equal(classification.swift, true)

  assert.equal(classification.compose, true)

  assert.equal(classification.browser, true)

  assert.equal(classification.native, true)

  assert.equal(classification['react-native'], true)
})

test('publish dry runs target only changed packages unless shared tooling changed', () => {
  assert.deepEqual(
    classifyChangedNpmPackages(['packages/react/src/Button.tsx']),
    ['@santi020k/lumen-react']
  )

  assert.equal(classifyChangedNpmPackages(['package.json']).length, 10)

  for (const path of [
    'scripts/check-bundle-size.mjs',
    'scripts/check-bundle-size.test.mjs',
    'scripts/lib/bundle-size.mjs',
    'scripts/smoke-consumer-packages.mjs',
    'scripts/react-hook-form-legacy-consumer.mjs',
    'scripts/classify-workflow-paths.mjs'
  ]) {
    assert.equal(classifyChangedNpmPackages([path]).length, 10, path)
  }
})

test('MCP changes skip unrelated bundle, browser, and packed UI consumer gates', () => {
  const ci = classifyCiPaths(['packages/mcp/src/index.ts'])
  const canary = classifyCanaryPaths(['packages/mcp/src/index.ts'])

  assert.equal(ci.compatibility, true)

  assert.equal(ci['bundle-size'], false)

  assert.equal(ci['consumer-packages'], false)

  assert.equal(ci['framework-contracts'], false)

  assert.equal(canary.web, true)

  assert.equal(canary.browser, false)

  assert.equal(canary['consumer-packages'], false)

  assert.equal(canary['web-contracts'], false)
})

test('portable skill and plugin changes select MCP validation', () => {
  for (const path of [
    'skills/lumen-review/SKILL.md',
    'plugins/lumen-ui/plugin.json',
    'scripts/lib/plugin-contract.mjs',
    'scripts/schemas/agent-plugin.schema.json',
    'registry/lumen-4-contract.json',
    'docs/ai-usage.md'
  ]) {
    assert.equal(classifyCiPaths([path]).mcp, true, path)
  }
})

test('hosted MCP deployment changes select protocol validation without native platform jobs', () => {
  for (const path of [
    '.github/workflows/deploy-mcp.yml',
    'scripts/check-hosted-mcp.mjs',
    'scripts/check-hosted-mcp.test.mjs'
  ]) {
    const classification = classifyCiPaths([path])

    assert.equal(classification.mcp, true, path)

    assert.equal(classification.apple, false, path)

    assert.equal(classification.android, false, path)
  }
})


test('browser setup action changes select browser CI and canaries', () => {
  const paths = ['.github/actions/setup-playwright/action.yml']

  assert.equal(classifyCiPaths(paths).playwright, true)

  assert.equal(classifyCanaryPaths(paths).browser, true)

  assert.equal(classifyCanaryPaths(paths).web, true)

  assert.equal(classifyCanaryPaths(paths).compose, false)
})

test('canary scheduling changes exercise browser shards', () => {
  assert.equal(classifyCanaryPaths(['.github/workflows/release-canary.yml']).browser, true)
})

test('bundle policy helpers and regression tests select builds and size checks', () => {
  for (const path of ['scripts/lib/bundle-size.mjs', 'scripts/check-bundle-size.test.mjs']) {
    const classification = classifyCiPaths([path])

    assert.equal(classification['bundle-size'], true, path)

    assert.equal(classification.compatibility, true, path)
  }
})


test('v5 delivery and portable fixtures select browser coverage', () => {
  for (const path of [
    'tests/fixtures/portable-editorial/react-app.tsx.template',
    'tests/fixtures/delivery/dialog.astro.template',
    'scripts/measure-route-delivery.mjs',
    'scripts/check-route-runtime.mjs',
    'scripts/check-component-css-rendering.mjs'
  ]) {
    assert.equal(classifyCiPaths([path]).playwright, true, path)

    assert.equal(classifyCanaryPaths([path]).browser, true, path)
  }
})

test('v5 contract sources select contract and MCP checks', () => {
  for (const path of ['registry/lumen-5-contract.json', 'scripts/generate-v5-migration.mjs']) {
    assert.equal(classifyCiPaths([path]).mcp, true, path)

    assert.equal(classifyCanaryPaths([path]).web, true, path)
  }
})
