import { createHash } from 'node:crypto'
import { access, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'

import sharp from 'sharp'

import { getNativeComponentsForPlatform } from '../src/data/native-components.ts'

const docsRoot = resolve(import.meta.dirname, '..')
const repositoryRoot = resolve(docsRoot, '../..')
const publicRoot = join(docsRoot, 'public', 'native-components')
const manifestPath = join(docsRoot, 'src', 'data', 'native-component-captures.json')
const checkOnly = process.argv.includes('--check')
const compareOnly = process.argv.includes('--compare')
const chartsOnly = process.argv.includes('--charts')
const platformArgument = process.argv.find(argument => argument.startsWith('--platform='))
const sourceArgument = process.argv.find(argument => argument.startsWith('--source='))
const toleranceArgument = process.argv.find(argument => argument.startsWith('--tolerance='))
const selectedPlatform = platformArgument?.slice('--platform='.length)
const selectedSource = sourceArgument?.slice('--source='.length)
const visualTolerance = toleranceArgument ? Number(toleranceArgument.slice('--tolerance='.length)) : undefined
const knownPlatforms = ['react-native', 'apple', 'android']

const chartSlugs = new Set([
  'sparkline',
  'line-chart',
  'bar-chart',
  'pie-chart',
  'scatter-chart',
  'heatmap',
  'range-chart',
  'combo-chart'
])

if (checkOnly && compareOnly) throw new Error('Choose either --check or --compare.')

if (checkOnly && chartsOnly) throw new Error('--charts is available only when syncing or comparing.')

if (selectedPlatform && !knownPlatforms.includes(selectedPlatform)) {
  throw new Error(`Unsupported native capture platform: ${selectedPlatform}`)
}

if (selectedSource && selectedSource !== 'default') {
  throw new Error(`Unsupported native capture source: ${selectedSource}`)
}

if (visualTolerance !== undefined && (
  !Number.isFinite(visualTolerance) || visualTolerance < 0 || visualTolerance > 1
)) {
  throw new Error('--tolerance must be a number from 0 through 1.')
}

if (!compareOnly && (selectedPlatform || selectedSource)) {
  throw new Error('--platform and --source are available only with --compare.')
}

if (!compareOnly && visualTolerance !== undefined) {
  throw new Error('--tolerance is available only with --compare.')
}

const platformSources = {
  android: {
    default: join(repositoryRoot, 'apps/playground-android/build/screenshots/phone'),
    device: 'Android phone emulator',
    mappings: {
      'wearable-action': ['wear', 'action-button.png', 'Wear OS emulator'],
      'wearable-list-row': ['wear', 'list-row.png', 'Wear OS emulator'],
      'wearable-metric': ['wear', 'metric.png', 'Wear OS emulator'],
      'wearable-progress': ['wear', 'progress-ring.png', 'Wear OS emulator'],
      'wearable-status': ['wear', 'status.png', 'Wear OS emulator']
    },
    variants: {
      wear: join(repositoryRoot, 'apps/playground-android/build/screenshots/wear')
    }
  },
  apple: {
    default: join(repositoryRoot, 'apps/playground-apple/Screenshots'),
    device: 'iPhone simulator',
    mappings: {
      'shortcut-recorder': ['macos', 'shortcut-recorder.png', 'macOS'],
      'symbol-picker': ['macos', 'symbol-picker.png', 'macOS'],
      'wearable-action': ['watchos', 'wearable-action.png', 'watchOS simulator'],
      'wearable-list-row': ['watchos', 'wearable-list-row.png', 'watchOS simulator'],
      'wearable-metric': ['watchos', 'wearable-metric.png', 'watchOS simulator'],
      'wearable-progress': ['watchos', 'wearable-progress.png', 'watchOS simulator'],
      'wearable-status': ['watchos', 'wearable-status.png', 'watchOS simulator']
    },
    variants: {
      macos: join(repositoryRoot, 'apps/playground-apple/Screenshots/macOS'),
      watchos: join(repositoryRoot, 'apps/playground-apple/Screenshots/watchOS')
    }
  },
  'react-native': {
    default: join(repositoryRoot, 'test-results/react-native-components'),
    device: 'Expo web renderer',
    mappings: {},
    variants: {}
  }
}

const exists = async path => {
  try {
    await access(path)

    return true
  } catch {
    return false
  }
}

const sourceFor = (platform, slug) => {
  const configuration = platformSources[platform]
  const mapping = configuration.mappings[slug]

  if (!mapping) {
    return {
      device: configuration.device,
      path: join(configuration.default, `${slug}.png`)
    }
  }

  const [variant, filename, device] = mapping

  return { device, path: join(configuration.variants[variant], filename) }
}

const isDefaultSource = (platform, slug) => !platformSources[platform].mappings[slug]
let comparedCaptures = new Map()

const normalizedVisualDifference = async (leftPath, rightPath) => {
  const normalize = path => sharp(path)
    .resize(360, 800, { background: '#ffffff', fit: 'contain' })
    .ensureAlpha()
    .raw()
    .toBuffer()

  const [left, right] = await Promise.all([normalize(leftPath), normalize(rightPath)])
  let difference = 0

  for (let index = 0; index < left.length; index += 1) {
    difference += Math.abs(left[index] - right[index])
  }

  return difference / (left.length * 255)
}

const compareCapture = async ({ digest, platform, renderedHeight, slug, sourcePath, width }) => {
  const expected = comparedCaptures.get(`${platform}:${slug}`)

  if (!expected) throw new Error(`Missing committed native capture: ${platform}:${slug}`)

  const changed = expected.sha256 !== digest || expected.width !== width || expected.height !== renderedHeight

  if (!changed) return

  if (visualTolerance === undefined) {
    throw new Error(`Native capture changed: ${platform}:${slug}`)
  }

  const committedPath = join(docsRoot, 'public', expected.src)
  const difference = await normalizedVisualDifference(sourcePath, committedPath)

  if (difference > visualTolerance) {
    throw new Error(
      `Native capture changed beyond tolerance: ${platform}:${slug} ` +
      `(difference ${difference.toFixed(4)}, tolerance ${visualTolerance})`
    )
  }
}

let checkedCount = 0

if (checkOnly) {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))

  const expectedKeys = new Set(
    ['react-native', 'apple', 'android'].flatMap(platform => (
      getNativeComponentsForPlatform(platform).map(component => `${platform}:${component.slug}`)
    ))
  )

  const actualKeys = manifest.captures.map(capture => `${capture.platform}:${capture.slug}`)

  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.captures)) {
    throw new Error('Unsupported native component capture manifest.')
  }

  if (new Set(actualKeys).size !== actualKeys.length) {
    throw new Error('The native component capture manifest contains duplicate entries.')
  }

  if (
    actualKeys.length !== expectedKeys.size ||
    actualKeys.some(key => !expectedKeys.has(key))
  ) {
    throw new Error('The native component capture manifest does not match the documented catalog.')
  }

  const chartCaptureDigests = new Map()

  for (const capture of manifest.captures) {
    const outputPath = join(docsRoot, 'public', capture.src)
    const contents = await readFile(outputPath)
    const digest = createHash('sha256').update(contents).digest('hex')
    const metadata = await sharp(contents).metadata()

    if (digest !== capture.sha256) {
      throw new Error(`Native capture digest is stale: ${relative(repositoryRoot, outputPath)}`)
    }

    if (metadata.width !== capture.width || metadata.height !== capture.height) {
      throw new Error(`Native capture dimensions are stale: ${relative(repositoryRoot, outputPath)}`)
    }

    if (chartSlugs.has(capture.slug)) {
      const digestKey = `${capture.platform}:${digest}`
      const duplicateSlug = chartCaptureDigests.get(digestKey)

      if (duplicateSlug) {
        throw new Error(
          `Native chart captures must be visually distinct: ${capture.platform}:${duplicateSlug} ` +
          `and ${capture.platform}:${capture.slug}`
        )
      }

      chartCaptureDigests.set(digestKey, capture.slug)
    }
  }

  const publicPlatforms = await readdir(publicRoot, { withFileTypes: true })
  const expectedPaths = new Set(manifest.captures.map(capture => join(docsRoot, 'public', capture.src)))

  for (const platformDirectory of publicPlatforms.filter(entry => entry.isDirectory())) {
    const directory = join(publicRoot, platformDirectory.name)

    for (const filename of await readdir(directory)) {
      const path = join(directory, filename)

      if (!expectedPaths.has(path) && (await stat(path)).isFile()) {
        throw new Error(`Unexpected native capture: ${relative(repositoryRoot, path)}`)
      }
    }
  }

  checkedCount = manifest.captures.length
}

const existingManifest = chartsOnly && !compareOnly ?
  JSON.parse(await readFile(manifestPath, 'utf8')) :
  undefined

const captureEntries = existingManifest?.captures.filter(capture => !chartSlugs.has(capture.slug)) ?? []
const missing = []
const comparedManifest = compareOnly ? JSON.parse(await readFile(manifestPath, 'utf8')) : undefined

comparedCaptures = new Map(
  comparedManifest?.captures.map(capture => [`${capture.platform}:${capture.slug}`, capture]) ?? []
)

let comparedCount = 0

if (!checkOnly) for (const platform of knownPlatforms) {
  if (selectedPlatform && platform !== selectedPlatform) continue

  for (const component of getNativeComponentsForPlatform(platform)) {
    if (chartsOnly && !chartSlugs.has(component.slug)) continue

    if (selectedSource === 'default' && !isDefaultSource(platform, component.slug)) continue

    const source = sourceFor(platform, component.slug)
    const outputPath = join(publicRoot, platform, `${component.slug}.webp`)

    if (!(await exists(source.path))) {
      missing.push(relative(repositoryRoot, source.path))

      continue
    }

    const image = sharp(source.path)
    const metadata = await image.metadata()
    const width = Math.min(metadata.width ?? 1080, 900)

    const rendered = await image
      .resize({ width, withoutEnlargement: true })
      .webp({ effort: 5, quality: 82 })
      .toBuffer()

    const digest = createHash('sha256').update(rendered).digest('hex')

    const renderedHeight = metadata.height && metadata.width ?
      Math.round(metadata.height * (width / metadata.width)) :
      undefined

    if (compareOnly) {
      await compareCapture({
        digest,
        platform,
        renderedHeight,
        slug: component.slug,
        sourcePath: source.path,
        width
      })

      comparedCount += 1

      continue
    }

    captureEntries.push({
      alt: `${component.name} rendered in the ${source.device} Lumen playground`,
      device: source.device,
      height: renderedHeight,
      platform,
      sha256: digest,
      slug: component.slug,
      src: `/native-components/${platform}/${component.slug}.webp`,
      width
    })

    await mkdir(dirname(outputPath), { recursive: true })

    await writeFile(outputPath, rendered)
  }
}

if (!checkOnly && missing.length > 0) {
  throw new Error(`Native component capture coverage is incomplete:\n${missing.map(path => `- ${path}`).join('\n')}`)
}

captureEntries.sort((left, right) => (
  left.platform.localeCompare(right.platform) || left.slug.localeCompare(right.slug)
))

const manifest = `${JSON.stringify({ schemaVersion: 1, captures: captureEntries }, undefined, 2)}\n`

if (!checkOnly && !compareOnly) {
  await mkdir(dirname(manifestPath), { recursive: true })

  await writeFile(manifestPath, manifest)

  for (const platform of ['react-native', 'apple', 'android']) {
    const directory = join(publicRoot, platform)

    const expected = new Set(
      captureEntries
        .filter(capture => capture.platform === platform)
        .map(capture => `${capture.slug}.webp`)
    )

    if (!(await exists(directory))) continue

    for (const filename of await readdir(directory)) {
      if (!expected.has(filename)) await rm(join(directory, filename))
    }
  }
}

let action = 'Synced'
let finalCount = captureEntries.length

if (checkOnly) {
  action = 'Checked'

  finalCount = checkedCount
} else if (compareOnly) {
  action = 'Compared'

  finalCount = comparedCount
}

process.stdout.write(`${action} ${finalCount} native component captures.\n`)
