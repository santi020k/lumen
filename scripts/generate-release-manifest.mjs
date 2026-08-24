import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const outputPaths = [
  join(repositoryRoot, 'registry', 'release-manifest.json'),
  join(repositoryRoot, 'packages', 'lumen', 'release-manifest.json')
]

const check = process.argv.includes('--check')
const readJson = async path => JSON.parse(await readFile(path, 'utf8'))
const packageDirectories = await readdir(join(repositoryRoot, 'packages'), { withFileTypes: true })
const packages = {}

for (const entry of packageDirectories.sort((left, right) => left.name.localeCompare(right.name))) {
  if (!entry.isDirectory()) continue

  const manifestPath = join(repositoryRoot, 'packages', entry.name, 'package.json')
  let manifest

  try {
    manifest = await readJson(manifestPath)
  } catch (error) {
    if (error?.code === 'ENOENT') continue

    throw error
  }

  if (manifest.private || !manifest.name || !manifest.version) continue

  packages[manifest.name] = {
    peerDependencies: manifest.peerDependencies ?? {},
    version: manifest.version
  }
}

const umbrellaVersion = packages['@santi020k/lumen']?.version

if (!umbrellaVersion) throw new Error('Unable to resolve the @santi020k/lumen release version.')

const gradleProperties = await readFile(join(repositoryRoot, 'packages', 'compose', 'gradle.properties'), 'utf8')
const composeVersion = /^lumenComposeVersion=(.+)$/m.exec(gradleProperties)?.[1]

if (!composeVersion) throw new Error('Unable to resolve lumenComposeVersion from Gradle properties.')

const manifest = {
  schemaVersion: 1,
  release: {
    compose: {
      artifacts: [
        'com.santi020k:lumen-compose',
        'com.santi020k:lumen-compose-wear'
      ],
      version: composeVersion
    },
    npm: {
      packages
    },
    swift: {
      package: 'https://github.com/santi020k/lumen.git',
      revision: null,
      tag: `v${umbrellaVersion}`
    },
    version: umbrellaVersion
  },
  migration: {
    codemod: null,
    css: {
      astro: '@santi020k/lumen-astro/styles.css',
      elements: '@santi020k/lumen-elements/styles.css',
      react: '@santi020k/lumen-react/styles.css'
    },
    deprecatedExports: [],
    removedExports: [],
    runtime: {
      astro: 'Mount UIPrimitives once when an imported component declares the ui-primitives runtime.',
      elements: 'Call defineLumenElements once before rendering lumen-* elements.',
      react: 'Use the public React behavior hooks for behavior-heavy primitives.'
    }
  }
}

const desired = `${JSON.stringify(manifest, undefined, 2)}\n`

if (check) {
  for (const outputPath of outputPaths) {
    const current = await readFile(outputPath, 'utf8').catch(() => '')

    if (current !== desired) {
      throw new Error(`${relative(repositoryRoot, outputPath)} is stale. Run pnpm run generate:release-manifest.`)
    }
  }
} else {
  await Promise.all(outputPaths.map(outputPath => writeFile(outputPath, desired)))
}
