import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { appendFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const sharedConfiguration = /^(package\.json|pnpm-workspace\.yaml|turbo\.json|scripts\/(?:classify-workflow-paths|release-scope)(?:\.test)?\.mjs|scripts\/(?:publish-packages|version-packages|workflow-scope\.test)\.mjs)$/u
const dependencyFiles = /^(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|apps\/[^/]+\/package\.json|packages\/[^/]+\/package\.json)$/u

const publicPackageNames = new Map([
  ['astro', '@santi020k/lumen-astro'],
  ['core', '@santi020k/lumen-core'],
  ['elements', '@santi020k/lumen-elements'],
  ['icons-brand', '@santi020k/lumen-icons-brand'],
  ['lumen', '@santi020k/lumen'],
  ['mcp', '@santi020k/lumen-mcp'],
  ['react', '@santi020k/lumen-react'],
  ['react-hook-form', '@santi020k/lumen-react-hook-form'],
  ['react-native', '@santi020k/lumen-react-native'],
  ['tokens', '@santi020k/lumen-tokens']
])

const matchesAny = (paths, patterns) => paths.some(path => patterns.some(pattern => pattern.test(path)))

export const classifyChangedNpmPackages = paths => {
  const packages = new Set()

  const requiresEveryPackage = matchesAny(paths, [
    /^package\.json$/u,
    /^pnpm-workspace\.yaml$/u,
    /^turbo\.json$/u,
    /^scripts\/(check-publish-dry-run|sync-registry|validate-registry)\.mjs$/u,
    /^\.github\/workflows\/ci\.yml$/u
  ])

  if (requiresEveryPackage) return [...publicPackageNames.values()].sort()

  for (const path of paths) {
    const match = /^packages\/([^/]+)\//u.exec(path)
    const packageName = match ? publicPackageNames.get(match[1]) : undefined

    if (packageName) packages.add(packageName)
  }

  return [...packages].sort()
}

export const classifyCiPaths = (paths, { releasePullRequest = false } = {}) => {
  const compatibility = matchesAny(paths, [
    /^apps\/(next-smoke|templates)\//u,
    /^packages\/(astro|core|elements|icons-brand|lumen|mcp|react|react-hook-form|templates|tokens)\//u,
    /^registry\//u,
    /^scripts\/(check-bundle-size|check-framework-contracts|check-publish-dry-run|smoke-consumer-packages|sync-registry|validate-registry)\.mjs$/u,
    /^eslint\.config\.js$/u,
    /^tsconfig[^/]*\.json$/u,
    /^vitest\.config\.ts$/u,
    sharedConfiguration,
    ...(releasePullRequest ? [] : [/^pnpm-lock\.yaml$/u])
  ])

  const mcp = matchesAny(paths, [
    /^packages\/(astro|core|elements|lumen|mcp|react|tokens)\//u,
    /^tokens\//u,
    /^registry\/lumen\.registry\.json$/u,
    /^llms\.txt$/u,
    /^tsconfig[^/]*\.json$/u,
    /^vitest\.config\.ts$/u,
    sharedConfiguration
  ])

  const playwright = matchesAny(paths, [
    /^apps\/(docs|templates)\//u,
    /^packages\/(astro|core|elements|icons-brand|lumen|react|react-hook-form|templates)\//u,
    /^tests\/(a11y|visual)\//u,
    /^playwright(?:\.[^/]*)?\.config\.ts$/u,
    /^\.github\/workflows\/ci\.yml$/u,
    sharedConfiguration
  ])

  const reactNativeCaptures = matchesAny(paths, [
    /^apps\/playground-react-native\//u,
    /^packages\/(core|react-native|tokens)\//u,
    /^tokens\//u,
    /^apps\/docs\/(public\/native-components\/|scripts\/sync-native-component-captures\.mjs|src\/data\/native-component-captures\.json)/u,
    /^scripts\/generate-platform-tokens\.mjs$/u,
    /^\.github\/workflows\/ci\.yml$/u,
    sharedConfiguration
  ])

  const nativeContracts = matchesAny(paths, [
    /^apps\/playground-(android|apple|react-native)\//u,
    /^packages\/(compose|core|react-native|swift|swift-widget|tokens)\//u,
    /^tokens\//u,
    /^registry\/(compose-api-classification|native-api-baseline|native-consumer-evidence|native-device-evidence|native-stability-soak|swift-api-baseline|swift-widget-api-baseline|wear-api-classification)\.json$/u,
    /^apps\/docs\/(public\/native-components\/|scripts\/sync-native-component-captures\.mjs|src\/data\/native-component-captures\.json)/u,
    /^scripts\/(check-compose-api-classification|check-native-consumer-evidence|check-native-device-evidence|check-native-stability-soak|check-wear-api-classification|check-(native|swift)-api-baseline|generate-platform-tokens)\.mjs$/u,
    /^Package\.swift$/u,
    /^\.github\/workflows\/(ci|publish-compose)\.yml$/u,
    sharedConfiguration
  ])

  const apple = matchesAny(paths, [
    /^apps\/playground-apple\//u,
    /^packages\/(swift|swift-widget|tokens)\//u,
    /^tokens\//u,
    /^registry\/(native-api-baseline|native-device-evidence|native-stability-soak|swift-api-baseline|swift-widget-api-baseline)\.json$/u,
    /^apps\/docs\/(public\/native-components\/|scripts\/sync-native-component-captures\.mjs|src\/data\/native-component-captures\.json)/u,
    /^scripts\/(check-native-device-evidence|check-native-stability-soak|check-(native|swift)-api-baseline|generate-platform-tokens)\.mjs$/u,
    /^Package\.swift$/u,
    /^\.github\/workflows\/ci\.yml$/u,
    sharedConfiguration
  ])

  const android = matchesAny(paths, [
    /^apps\/playground-android\//u,
    /^packages\/(compose|tokens)\//u,
    /^tokens\//u,
    /^registry\/(compose-api-classification|native-api-baseline|native-device-evidence|native-stability-soak|wear-api-classification)\.json$/u,
    /^apps\/docs\/(public\/native-components\/|scripts\/sync-native-component-captures\.mjs|src\/data\/native-component-captures\.json)/u,
    /^scripts\/(check-compose-api-classification|check-native-device-evidence|check-native-stability-soak|check-wear-api-classification|check-native-api-baseline|generate-platform-tokens)\.mjs$/u,
    /^\.github\/workflows\/(ci|publish-compose)\.yml$/u,
    sharedConfiguration
  ])

  const bundleSize = matchesAny(paths, [
    /^packages\/(astro|core|elements|lumen|react)\//u,
    /^scripts\/check-bundle-size\.mjs$/u,
    sharedConfiguration
  ])

  const consumerPackages = matchesAny(paths, [
    /^packages\/(astro|core|elements|icons-brand|lumen|react|react-hook-form)\//u,
    /^scripts\/smoke-consumer-packages\.mjs$/u,
    sharedConfiguration
  ])

  const frameworkContracts = matchesAny(paths, [
    /^packages\/(astro|core|elements|lumen|react)\//u,
    /^scripts\/(check-framework-contracts|generate-critical-web-css)\.mjs$/u,
    sharedConfiguration
  ])

  return {
    android,
    apple,
    'bundle-size': bundleSize,
    compatibility,
    'consumer-packages': consumerPackages,
    dependencies: !releasePullRequest && matchesAny(paths, [dependencyFiles]),
    'framework-contracts': frameworkContracts,
    mcp,
    'native-contracts': nativeContracts,
    'npm-packages': JSON.stringify(classifyChangedNpmPackages(paths)),
    playwright,
    'react-native-captures': reactNativeCaptures
  }
}

export const classifyCanaryPaths = (paths, { manual = false } = {}) => {
  if (manual) {
    return {
      browser: true,
      compose: true,
      'consumer-packages': true,
      native: true,
      'npm-packages': JSON.stringify([...publicPackageNames.values()].sort()),
      'react-native': true,
      swift: true,
      web: true,
      'web-contracts': true
    }
  }

  const web = matchesAny(paths, [
    /^packages\/(astro|core|elements|icons-brand|lumen|mcp|react|react-hook-form|react-native|templates|tokens)\//u,
    /^apps\/(docs|next-smoke|playground-react-native|templates)\//u,
    /^docs\/(native-compatibility|native-device-validation|playgrounds|web-consumer-validation)\.md$/u,
    /^registry\/(compose-api-classification|lumen-2-contract|native-api-baseline|native-consumer-evidence|native-device-evidence|native-stability-soak|release-manifest|swift-api-baseline|swift-widget-api-baseline|wear-api-classification|web-api-baseline|web-consumer-evidence)\.json$/u,
    /^scripts\/(check-approved-release-revision(?:\.test)?|check-coordinated-release-revision(?:\.test)?|check-graduated-release-revision(?:\.test)?|check-lumen-2-contract(?:\.test)?|check-maven-(pom-metadata|release-artifacts)(?:\.test)?|maven-pom-metadata|check-npm-release-provenance(?:\.test)?|check-published-package-family(?:\.test)?|check-native-consumer-evidence(?:\.test)?|check-native-device-evidence(?:\.test)?|check-native-stability-soak(?:\.test)?|check-native-stable-readiness(?:\.test)?|check-playground-eas-version(?:\.test)?|check-react-native-peer-docs(?:\.test)?|check-v2-release-workflows\.test|check-web-api-baseline(?:\.test)?|check-web-consumer-evidence(?:\.test)?|generate-release-manifest(?:\.test)?|smoke-consumer-packages|smoke-react-native-native-package|sync-coordinated-v2-versions(?:\.test)?)\.mjs$/u,
    /^\.github\/workflows\/(publish-compose|release|release-canary|verify-native-release)\.yml$/u,
    sharedConfiguration
  ])

  const swift = matchesAny(paths, [
    /^Package\.swift$/u,
    /^packages\/(swift|swift-widget|tokens)\//u,
    /^apps\/playground-apple\//u,
    /^apps\/docs\/src\/data\/platforms\.ts$/u,
    /^docs\/(ai-usage|native-components|playgrounds)\.md$/u,
    /^tokens\//u,
    /^registry\/(native-device-evidence|native-stability-soak|swift-api-baseline|swift-widget-api-baseline|release-manifest)\.json$/u,
    /^scripts\/(check-native-device-evidence|check-native-stability-soak|check-native-stable-readiness|check-swift-api-baseline|generate-platform-tokens|generate-release-manifest|smoke-react-native-native-package|smoke-swift-package-candidate|sync-coordinated-v2-versions(?:\.test)?|sync-swift-version(?:\.test)?)\.mjs$/u,
    /^\.github\/workflows\/(release-canary|verify-native-release)\.yml$/u,
    sharedConfiguration
  ])

  const compose = matchesAny(paths, [
    /^packages\/(compose|tokens)\//u,
    /^apps\/playground-android\//u,
    /^tokens\//u,
    /^registry\/(compose-api-classification|native-consumer-evidence|native-device-evidence|native-stability-soak|wear-api-classification|release-manifest)\.json$/u,
    /^scripts\/(check-approved-release-revision(?:\.test)?|check-compose-api-classification|check-coordinated-release-revision(?:\.test)?|check-graduated-release-revision(?:\.test)?|check-maven-(pom-metadata|release-artifacts)(?:\.test)?|maven-pom-metadata|check-native-consumer-evidence|check-native-device-evidence|check-native-stability-soak|check-native-stable-readiness|check-wear-api-classification|generate-platform-tokens|generate-release-manifest|smoke-react-native-native-package|sync-coordinated-v2-versions(?:\.test)?)\.mjs$/u,
    /^\.github\/workflows\/(release-canary|verify-native-release)\.yml$/u,
    sharedConfiguration
  ])

  const browser = matchesAny(paths, [
    /^apps\/(docs|templates)\//u,
    /^packages\/(astro|core|elements|icons-brand|lumen|react|react-hook-form|templates|tokens)\//u,
    /^tests\/(a11y|visual)\//u,
    /^playwright(?:\.[^/]*)?\.config\.ts$/u,
    sharedConfiguration
  ])

  const consumerPackages = matchesAny(paths, [
    /^packages\/(astro|core|elements|icons-brand|lumen|react|react-hook-form)\//u,
    /^scripts\/smoke-consumer-packages\.mjs$/u,
    sharedConfiguration
  ])

  const webContracts = matchesAny(paths, [
    /^packages\/(astro|core|elements|icons-brand|lumen|react|react-hook-form)\//u,
    /^registry\/(web-api-baseline|web-consumer-evidence)\.json$/u,
    /^scripts\/check-web-(api-baseline|consumer-evidence)(?:\.test)?\.mjs$/u,
    sharedConfiguration
  ])

  const native = matchesAny(paths, [
    /^Package\.swift$/u,
    /^apps\/playground-(android|apple|react-native)\//u,
    /^packages\/(compose|core|react-native|swift|swift-widget|tokens)\//u,
    /^tokens\//u,
    /^registry\/(compose-api-classification|native-api-baseline|native-consumer-evidence|native-device-evidence|native-stability-soak|swift-api-baseline|swift-widget-api-baseline|wear-api-classification)\.json$/u,
    sharedConfiguration
  ])

  const reactNative = matchesAny(paths, [
    /^apps\/playground-react-native\//u,
    /^packages\/(core|react-native|tokens)\//u,
    /^tokens\//u,
    sharedConfiguration
  ])

  return {
    browser,
    compose,
    'consumer-packages': consumerPackages,
    native,
    'npm-packages': JSON.stringify(classifyChangedNpmPackages(paths)),
    'react-native': reactNative,
    swift,
    web,
    'web-contracts': webContracts
  }
}

const parseArguments = (arguments_) => {
  const [workflow, ...rest] = arguments_
  const values = new Map()

  for (let index = 0; index < rest.length; index += 2) {
    values.set(rest[index], rest[index + 1])
  }

  return { values, workflow }
}

const runCli = async () => {
  const { values, workflow } = parseArguments(process.argv.slice(2))

  assert.ok(workflow === 'ci' || workflow === 'canary', 'Expected workflow to be ci or canary')

  const base = values.get('--base')
  const head = values.get('--head')
  const output = values.get('--output')

  assert.ok(output, '--output is required')

  const manual = process.env.GITHUB_EVENT_NAME === 'workflow_dispatch'
  let paths = []

  if (!manual) {
    assert.ok(base && head, '--base and --head are required for pull requests')

    paths = execFileSync('git', ['diff', '--name-only', base, head], { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)
  }

  const classification = workflow === 'ci'
    ? classifyCiPaths(paths, { releasePullRequest: process.env.IS_RELEASE_PR === 'true' })
    : classifyCanaryPaths(paths, { manual })

  await appendFile(
    output,
    `${Object.entries(classification).map(([name, value]) => `${name}=${value}`).join('\n')}\n`
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli()
}
