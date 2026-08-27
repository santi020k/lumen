import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'

const releaseManifestPath = new URL('../registry/release-manifest.json', import.meta.url)

const documentationSections = [
  {
    end: 'After Xcode resolves',
    path: new URL('../packages/swift/README.md', import.meta.url),
    start: 'In Xcode, choose'
  },
  {
    end: '### Jetpack Compose',
    path: new URL('../docs/native-components.md', import.meta.url),
    start: 'In Xcode, choose'
  },
  {
    end: '### Run on an iOS simulator',
    path: new URL('../docs/playgrounds.md', import.meta.url),
    start: '### Install LumenUI'
  },
  {
    end: '| Android / Compose',
    path: new URL('../docs/ai-usage.md', import.meta.url),
    start: '| Apple / SwiftUI'
  },
  {
    end: '  },\n  {\n    codeExamples: [\n      {\n        code: `// app/build.gradle.kts',
    path: new URL('../apps/docs/src/data/platforms.ts', import.meta.url),
    start: '        code: `# Xcode → File → Add Package Dependencies…'
  }
]

const semanticVersionPattern = /(?<tag>v)?\d+\.\d+\.\d+(?:-[0-9A-Za-z]+(?:\.[0-9A-Za-z]+)*)?/gu

export const synchronizeSwiftVersionSection = ({ end, source, start, version }) => {
  const startIndex = source.indexOf(start)

  assert.notEqual(startIndex, -1, `Swift version section is missing its start marker: ${start}`)

  const endIndex = source.indexOf(end, startIndex + start.length)

  assert.notEqual(endIndex, -1, `Swift version section is missing its end marker: ${end}`)

  const section = source.slice(startIndex, endIndex)
  const versions = section.match(semanticVersionPattern) ?? []

  assert.ok(versions.length > 0, `Swift version section starting with ${start} has no version`)

  const synchronized = section.replaceAll(
    semanticVersionPattern,
    (...arguments_) => `${arguments_.at(-1).tag === 'v' ? 'v' : ''}${version}`
  )

  return `${source.slice(0, startIndex)}${synchronized}${source.slice(endIndex)}`
}

const run = async () => {
  const checkOnly = process.argv.includes('--check')
  const releaseManifest = JSON.parse(await readFile(releaseManifestPath, 'utf8'))
  const releaseVersion = releaseManifest.release?.version
  const swiftTag = releaseManifest.release?.swift?.tag

  assert.equal(typeof releaseVersion, 'string', 'Release manifest must include release.version.')

  assert.equal(swiftTag, `v${releaseVersion}`, 'Release manifest Swift tag must match release.version.')

  const stalePaths = []

  for (const documentation of documentationSections) {
    const source = await readFile(documentation.path, 'utf8')

    const synchronized = synchronizeSwiftVersionSection({
      end: documentation.end,
      source,
      start: documentation.start,
      version: releaseVersion
    })

    if (synchronized === source) continue

    if (checkOnly) {
      stalePaths.push(documentation.path.pathname)
    } else {
      await writeFile(documentation.path, synchronized)
    }
  }

  if (stalePaths.length > 0) {
    throw new Error(
      `Swift documentation is not synchronized with ${releaseVersion}:\n${stalePaths.join('\n')}\nRun pnpm sync:swift-version.`
    )
  }

  console.log(`Swift installation documentation uses ${swiftTag}.`)
}

if (process.argv[1] === new URL(import.meta.url).pathname) await run()
