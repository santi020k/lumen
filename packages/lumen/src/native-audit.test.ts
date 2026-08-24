import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, test } from 'vitest'

import { inspectNativeAdoption } from './native-audit.js'

const releaseManifest = {
  release: {
    compose: { artifacts: ['com.santi020k:lumen-compose'], version: '0.3.0' },
    swift: { package: 'https://github.com/santi020k/lumen.git', revision: null, tag: 'v1.3.0' },
    version: '1.3.0'
  },
  schemaVersion: 1
}

describe('native adoption audit', () => {
  test('reports resolved native versions and missing product-theme placement', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-native-audit-'))
    const manifestPath = join(root, 'release-manifest.json')

    try {
      await mkdir(join(root, 'App'), { recursive: true })
      await writeFile(manifestPath, `${JSON.stringify(releaseManifest)}\n`)
      await writeFile(join(root, 'Package.swift'), 'let package = Package(name: "App", dependencies: [.package(url: "https://github.com/santi020k/lumen.git", exact: "1.3.0")])\n')
      await writeFile(join(root, 'Package.resolved'), `${JSON.stringify({
        pins: [{ identity: 'lumen', location: 'https://github.com/santi020k/lumen.git', state: { revision: 'abc123', version: '1.3.0' } }],
        version: 3
      })}\n`)
      await writeFile(join(root, 'App', 'ContentView.swift'), 'import LumenUI\nstruct ContentView {}\n')

      const report = await inspectNativeAdoption(root, manifestPath)

      expect(report.platforms).toEqual(['swift'])
      expect(report.resolved).toContainEqual(expect.objectContaining({
        platform: 'swift',
        revision: 'abc123',
        version: '1.3.0'
      }))
      expect(report.findings).toContainEqual(expect.objectContaining({ rule: 'swift-theme-missing' }))
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })

  test('detects stale Compose releases without treating product controls as errors', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-compose-audit-'))
    const manifestPath = join(root, 'release-manifest.json')

    try {
      await mkdir(join(root, 'app'), { recursive: true })
      await writeFile(manifestPath, `${JSON.stringify(releaseManifest)}\n`)
      await writeFile(join(root, 'app', 'build.gradle.kts'), `
dependencies { implementation("com.santi020k:lumen-compose:0.2.0") }
fun App() { LumenTheme(materialColorScheme = productColors) {} }
`)

      const report = await inspectNativeAdoption(root, manifestPath)

      expect(report.platforms).toEqual(['compose'])
      expect(report.findings).toContainEqual(expect.objectContaining({
        rule: 'compose-release-mismatch',
        severity: 'warning'
      }))
      expect(report.findings).not.toContainEqual(expect.objectContaining({ rule: 'compose-theme-missing' }))
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })

  test('resolves Compose versions from a Gradle version catalog', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-compose-catalog-audit-'))
    const manifestPath = join(root, 'release-manifest.json')

    try {
      await mkdir(join(root, 'gradle'), { recursive: true })
      await writeFile(manifestPath, `${JSON.stringify(releaseManifest)}\n`)
      await writeFile(join(root, 'gradle', 'libs.versions.toml'), `
[versions]
lumen = "0.3.0"

[libraries]
lumen-compose = { module = "com.santi020k:lumen-compose", version.ref = "lumen" }
`)
      await writeFile(join(root, 'build.gradle.kts'), `
dependencies { implementation(libs.lumen.compose) }
fun App() { com.santi020k.lumen.LumenTheme {} }
`)

      const report = await inspectNativeAdoption(root, manifestPath)

      expect(report.resolved).toContainEqual({
        platform: 'compose',
        reference: 'com.santi020k:lumen-compose',
        version: '0.3.0'
      })
      expect(report.findings).not.toContainEqual(expect.objectContaining({
        rule: 'compose-resolution-missing'
      }))
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })
})
