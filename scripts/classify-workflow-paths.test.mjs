import assert from 'node:assert/strict'
import test from 'node:test'

import {
  classifyCanaryPaths,
  classifyChangedNpmPackages,
  classifyCiPaths
} from './classify-workflow-paths.mjs'

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
