import { readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'

const checkOnly = process.argv.includes('--check')
const gradlePropertiesPath = new URL('../packages/compose/gradle.properties', import.meta.url)

const consumerGradlePropertiesPath = new URL(
  '../apps/playground-android/gradle.properties',
  import.meta.url
)

const documentationPaths = [
  '../apps/docs/src/data/platforms.ts',
  '../apps/docs/src/data/platforms.test.ts',
  '../docs/ai-usage.md',
  '../docs/native-components.md',
  '../docs/playgrounds.md',
  '../packages/compose/README.md'
].map(path => new URL(path, import.meta.url))

const wearableDocumentationPaths = [
  '../apps/docs/src/data/platforms.ts',
  '../apps/docs/src/data/platforms.test.ts',
  '../docs/ai-usage.md',
  '../docs/native-components.md',
  '../packages/compose/README.md',
  '../packages/compose/wear/README.md'
].map(path => new URL(path, import.meta.url))

const gradleProperties = await readFile(gradlePropertiesPath, 'utf8')
const versionMatch = /^lumenComposeVersion=(\S+)$/mu.exec(gradleProperties)

if (!versionMatch) {
  throw new Error('packages/compose/gradle.properties must define lumenComposeVersion.')
}

const version = versionMatch[1]
const consumerGradleProperties = await readFile(consumerGradlePropertiesPath, 'utf8')
const consumerVersionPattern = /^lumenComposeVersion=.*$/mu
const expectedConsumerVersion = `lumenComposeVersion=${version}`
const coordinatePattern = /com\.santi020k:lumen-compose:[0-9A-Za-z][0-9A-Za-z._-]*/gu
const wearableCoordinatePattern = /com\.santi020k:lumen-compose-wear:[0-9A-Za-z][0-9A-Za-z._-]*/gu
const stalePaths = []

if (!consumerVersionPattern.test(consumerGradleProperties)) {
  if (checkOnly) {
    stalePaths.push(consumerGradlePropertiesPath.pathname)
  } else {
    await writeFile(
      consumerGradlePropertiesPath,
      `${consumerGradleProperties.trimEnd()}\n${expectedConsumerVersion}\n`
    )
  }
} else if (!consumerGradleProperties.includes(expectedConsumerVersion)) {
  if (checkOnly) {
    stalePaths.push(consumerGradlePropertiesPath.pathname)
  } else {
    await writeFile(
      consumerGradlePropertiesPath,
      consumerGradleProperties.replace(consumerVersionPattern, expectedConsumerVersion)
    )
  }
}

const synchronize = async (paths, pattern, coordinate) => {
  for (const path of paths) {
    const source = await readFile(path, 'utf8')
    const coordinates = source.match(pattern) ?? []

    if (coordinates.length === 0) {
      throw new Error(`${path.pathname} must include the Maven Central coordinate.`)
    }

    const updated = source.replaceAll(pattern, `${coordinate}:${version}`)

    if (updated === source) continue

    if (checkOnly) {
      stalePaths.push(path.pathname)

      continue
    }

    await writeFile(path, updated)
  }
}

await synchronize(documentationPaths, coordinatePattern, 'com.santi020k:lumen-compose')

await synchronize(
  wearableDocumentationPaths,
  wearableCoordinatePattern,
  'com.santi020k:lumen-compose-wear'
)

if (stalePaths.length > 0) {
  throw new Error(
    `Compose consumers and documentation are not synchronized with ${version}:\n${stalePaths.join('\n')}\nRun pnpm sync:compose-version.`
  )
}

console.log(
  `Compose documentation uses com.santi020k:lumen-compose:${version} and com.santi020k:lumen-compose-wear:${version}.`
)
