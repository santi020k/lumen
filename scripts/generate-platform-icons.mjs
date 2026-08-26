import {
  mkdir,
  readdir,
  readFile,
  rm,
  unlink,
  writeFile
} from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'

const repositoryRoot = resolve(import.meta.dirname, '..')
const catalogPath = join(repositoryRoot, 'icons/lumen.icons.json')
const noticesPath = join(repositoryRoot, 'icons/THIRD_PARTY_NOTICES.md')
const reactNativePath = join(repositoryRoot, 'packages/react-native/src/icons.generated.tsx')
const legacyReactNativePath = join(repositoryRoot, 'packages/react-native/src/icons.generated.ts')
const swiftPath = join(repositoryRoot, 'packages/swift/Sources/LumenUI/Icons.generated.swift')

const swiftAssetsPath = join(
  repositoryRoot,
  'packages/swift/Sources/LumenUI/Resources/LumenIcons.xcassets'
)

const composePath = join(
  repositoryRoot,
  'packages/compose/src/main/kotlin/com/santi020k/lumen/Icons.generated.kt'
)

const composeDrawablesPath = join(repositoryRoot, 'packages/compose/src/main/res/drawable')

const packageNoticePaths = [
  join(repositoryRoot, 'packages/react-native/THIRD_PARTY_NOTICES.md'),
  join(repositoryRoot, 'packages/swift/THIRD_PARTY_NOTICES.md'),
  join(repositoryRoot, 'packages/compose/THIRD_PARTY_NOTICES.md'),
  join(repositoryRoot, 'packages/compose/src/main/resources/META-INF/THIRD_PARTY_NOTICES.md')
]

const legacyComposeNoticePath = join(
  repositoryRoot,
  'packages/compose/src/main/resources/META-INF/LICENSE-lucide.txt'
)

const checkOnly = process.argv.includes('--check')

const requiredRecord = (value, path) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`Expected an object at ${path}.`)
  }

  return value
}

const requiredString = (value, path) => {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`Expected a non-empty string at ${path}.`)
  }

  return value
}

const validateInterfacePack = pack => {
  if (pack.name !== 'interface' || pack.source !== 'lucide' || pack.selection !== 'all') {
    throw new Error('The interface pack must include the complete Lucide catalog.')
  }
}

const validateBrandPack = pack => {
  if (
    pack.name !== 'brand' ||
    pack.source !== 'font-awesome-free-brands' ||
    pack.prefix !== 'brand' ||
    pack.selection !== 'all'
  ) {
    throw new Error('The brand pack must include the complete Font Awesome Free Brands catalog.')
  }
}

const readCatalog = async () => {
  const catalog = requiredRecord(JSON.parse(await readFile(catalogPath, 'utf8')), 'catalog')

  if (catalog.schemaVersion !== 2) throw new Error('Unsupported icon catalog schema version.')

  if (!Array.isArray(catalog.packs) || catalog.packs.length !== 2) {
    throw new Error('The icon catalog must contain the interface and brand packs.')
  }

  const interfacePack = requiredRecord(catalog.packs[0], 'packs.0')
  const brandPack = requiredRecord(catalog.packs[1], 'packs.1')

  validateInterfacePack(interfacePack)

  validateBrandPack(brandPack)

  const aliases = requiredRecord(brandPack.aliases, 'packs.1.aliases')

  return {
    brandAliases: Object.fromEntries(
      Object.entries(aliases).map(([name, target]) => [name, requiredString(target, `aliases.${name}`)])
    )
  }
}

const toCamelCase = value => value.replaceAll(/[-:]([a-z0-9])/g, (_, character) => (
  character.toUpperCase()
))

const safeCamelCase = value => {
  const camelCase = toCamelCase(value)

  return /^[0-9]/.test(camelCase) ? `icon${camelCase}` : camelCase
}

const swiftKeywords = new Set(['import', 'repeat', 'subscript'])

const swiftIdentifier = value => {
  const identifier = safeCamelCase(value)

  return swiftKeywords.has(identifier) ? `\`${identifier}\`` : identifier
}

const toPascalCase = value => {
  const camelCase = safeCamelCase(value)

  return `${camelCase.slice(0, 1).toUpperCase()}${camelCase.slice(1)}`
}

const toResourceName = value => value.replaceAll(/[-:]/g, '_')

const xmlEscape = value => value
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')

const svgAttributeName = value => value.replaceAll(/[A-Z]/g, character => (
  `-${character.toLowerCase()}`
))

const svgAttribution = source => source === 'font-awesome-free-brands' ?
  '<!-- Font Awesome Free Brands: CC BY 4.0; converted by Lumen. -->' :
  '<!-- Lucide Icons: ISC License; converted by Lumen. -->'

const renderSvgNode = ([tagName, rawAttributes]) => {
  const attributes = Object.entries(rawAttributes)
    .filter(([name]) => name !== 'key')
    .map(([name, value]) => `${svgAttributeName(name)}="${xmlEscape(String(value))}"`)
    .join(' ')

  return `  <${tagName}${attributes ? ` ${attributes}` : ''} />`
}

const iconViewport = icon => {
  const dimension = Math.max(icon.width, icon.height)

  return {
    dimension,
    minX: (icon.width - dimension) / 2,
    minY: (icon.height - dimension) / 2,
    translateX: (dimension - icon.width) / 2,
    translateY: (dimension - icon.height) / 2
  }
}

const renderSvg = icon => {
  const viewport = iconViewport(icon)
  const fill = icon.style === 'fill' ? '#000000' : 'none'
  const stroke = icon.style === 'stroke' ? '#000000' : 'none'

  return `<?xml version="1.0" encoding="UTF-8"?>
${svgAttribution(icon.source)}
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="${viewport.minX} ${viewport.minY} ${viewport.dimension} ${viewport.dimension}" color="#000000" fill="${fill}" stroke="${stroke}" stroke-width="${icon.style === 'stroke' ? '2' : '0'}" stroke-linecap="round" stroke-linejoin="round">
${icon.node.map(renderSvgNode).join('\n')}
</svg>
`
}

const number = value => Number.parseFloat(value)
const pointList = value => value.trim().split(/[\s,]+/).map(number)
const coordinate = value => String(value)

const renderOvalPath = (attributes, radiusXName, radiusYName) => {
  const centerX = number(attributes.cx)
  const centerY = number(attributes.cy)
  const radiusX = number(attributes[radiusXName])
  const radiusY = number(attributes[radiusYName])

  return `M${coordinate(centerX - radiusX)} ${coordinate(centerY)}`
    + `a${radiusX} ${radiusY} 0 1 0 ${radiusX * 2} 0`
    + `a${radiusX} ${radiusY} 0 1 0 ${radiusX * -2} 0`
}

const renderPointPath = (attributes, closed) => {
  const points = pointList(attributes.points)

  if (points.length < 4 || points.length % 2 !== 0) {
    throw new Error('Invalid vector point list.')
  }

  const path = [`M${points[0]} ${points[1]}`]

  for (let index = 2; index < points.length; index += 2) {
    path.push(`L${points[index]} ${points[index + 1]}`)
  }

  if (closed) path.push('Z')

  return path.join('')
}

const renderRectanglePath = attributes => {
  const x = number(attributes.x ?? '0')
  const y = number(attributes.y ?? '0')
  const width = number(attributes.width)
  const height = number(attributes.height)
  const radiusX = number(attributes.rx ?? attributes.ry ?? '0')
  const radiusY = number(attributes.ry ?? attributes.rx ?? '0')

  if (radiusX === 0 && radiusY === 0) {
    return `M${x} ${y}h${width}v${height}h${-width}Z`
  }

  return `M${x + radiusX} ${y}h${width - radiusX * 2}`
    + `a${radiusX} ${radiusY} 0 0 1 ${radiusX} ${radiusY}`
    + `v${height - radiusY * 2}`
    + `a${radiusX} ${radiusY} 0 0 1 ${-radiusX} ${radiusY}`
    + `h${-(width - radiusX * 2)}`
    + `a${radiusX} ${radiusY} 0 0 1 ${-radiusX} ${-radiusY}`
    + `v${-(height - radiusY * 2)}`
    + `a${radiusX} ${radiusY} 0 0 1 ${radiusX} ${-radiusY}Z`
}

const vectorPathRenderers = {
  circle: attributes => renderOvalPath(attributes, 'r', 'r'),
  ellipse: attributes => renderOvalPath(attributes, 'rx', 'ry'),
  line: attributes => `M${attributes.x1} ${attributes.y1}L${attributes.x2} ${attributes.y2}`,
  path: attributes => requiredString(attributes.d, 'icon.path.d'),
  polygon: attributes => renderPointPath(attributes, true),
  polyline: attributes => renderPointPath(attributes, false),
  rect: renderRectanglePath
}

const vectorPathData = ([tagName, attributes]) => {
  const renderer = vectorPathRenderers[tagName]

  if (!renderer) throw new Error(`Unsupported icon SVG node: ${tagName}.`)

  return renderer(attributes)
}

const renderVectorPath = (icon, node) => {
  const [, attributes] = node

  const fillColor = icon.style === 'fill' || attributes.fill === 'currentColor' ?
    '#FF000000' :
    '@android:color/transparent'

  if (icon.style === 'fill') {
    return `        <path
            android:fillColor="${fillColor}"
            android:pathData="${xmlEscape(vectorPathData(node))}" />`
  }

  return `        <path
            android:fillColor="${fillColor}"
            android:pathData="${xmlEscape(vectorPathData(node))}"
            android:strokeColor="#FF000000"
            android:strokeLineCap="round"
            android:strokeLineJoin="round"
            android:strokeWidth="2" />`
}

const renderVectorDrawable = icon => {
  const viewport = iconViewport(icon)
  const paths = icon.node.map(node => renderVectorPath(icon, node)).join('\n')

  const preservesComplexBrandPath = icon.style === 'fill' && icon.node.some(([, attributes]) => (
    typeof attributes.d === 'string' && attributes.d.length > 3_000
  ))

  const translatedPaths = viewport.translateX === 0 && viewport.translateY === 0 ?
    paths :
    `    <group
        android:translateX="${viewport.translateX}"
        android:translateY="${viewport.translateY}">
${paths}
    </group>`

  return `<?xml version="1.0" encoding="utf-8"?>
${svgAttribution(icon.source)}
<vector xmlns:android="http://schemas.android.com/apk/res/android"${preservesComplexBrandPath ? '\n    xmlns:tools="http://schemas.android.com/tools"' : ''}
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="${viewport.dimension}"
    android:viewportHeight="${viewport.dimension}"${preservesComplexBrandPath ? '\n    tools:ignore="VectorPath"' : ''}>
${translatedPaths}
</vector>
`
}

const reactNativeElement = value => `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`

const reactNativeAttribute = value => value.replaceAll(/-([a-z])/g, (_, character) => (
  character.toUpperCase()
))

const renderReactNativeNode = ([tagName, rawAttributes]) => {
  const attributes = Object.entries(rawAttributes)
    .filter(([name]) => name !== 'key')
    .map(([name, value]) => {
      const attributeName = reactNativeAttribute(name)

      return value === 'currentColor' ?
        `${attributeName}={color}` :
        `${attributeName}=${JSON.stringify(String(value))}`
    })
    .join(' ')

  return `      <${reactNativeElement(tagName)}${attributes ? ` ${attributes}` : ''} />`
}

const generatedHeader = `/* This file is generated by scripts/generate-platform-icons.mjs.
 * Lucide artwork: ISC; Font Awesome brand artwork: CC BY 4.0.
 * See THIRD_PARTY_NOTICES.md for attribution and license terms.
 */`

const generateReactNative = icons => {
  const elementImports = [...new Set(icons.flatMap(icon => (
    icon.node.map(([tagName]) => reactNativeElement(tagName))
  )))].sort().join(',\n  ')

  const components = icons.map(icon => {
    const componentName = `Lumen${toPascalCase(icon.publicName)}IconGraphic`
    const viewport = iconViewport(icon)

  return `const ${componentName} = ({
  color = 'currentColor',
  size = 24,
  strokeWidth = 2
}: LumenIconGraphicProps): ReactElement => (
  <Svg
    fill={${icon.style === 'fill' ? 'color' : "'none'"}}
    focusable={false}
    height={size}
    stroke={${icon.style === 'stroke' ? 'color' : "'none'"}}
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={${icon.style === 'stroke' ? 'strokeWidth' : '0'}}
    viewBox="${viewport.minX} ${viewport.minY} ${viewport.dimension} ${viewport.dimension}"
    width={size}
  >
${icon.node.map(renderReactNativeNode).join('\n')}
  </Svg>
)`
  }).join('\n\n')

  const entries = icons.map(icon => (
    `  '${icon.publicName}': Lumen${toPascalCase(icon.publicName)}IconGraphic`
  )).join(',\n')

  return `${generatedHeader}

import type { ReactElement } from 'react'
import {
  ${elementImports},
  Svg
} from 'react-native-svg'

import type {
  LumenIconGraphic,
  LumenIconGraphicProps
} from './primitives.js'

${components}

export const lumenIcons = {
${entries}
} as const satisfies Readonly<Record<string, LumenIconGraphic>>

export type LumenIconName = keyof typeof lumenIcons

export const lumenIconNames = Object.freeze(
  Object.keys(lumenIcons) as LumenIconName[]
)

export const getLumenIconGraphic = (name: LumenIconName): LumenIconGraphic => lumenIcons[name]
`
}

const generateSwift = icons => {
  const cases = icons.map(icon => (
    `    case ${swiftIdentifier(icon.publicName)} = "${icon.publicName}"`
  )).join('\n')

  return `${generatedHeader}

public enum LumenIconName: String, CaseIterable, Sendable {
${cases}

    var assetName: String {
        "lumen-\\(rawValue.replacingOccurrences(of: ":", with: "-"))-glyph"
    }
}
`
}

const javaStringHash = value => {
  let hash = 0

  for (const character of value) hash = Math.imul(31, hash) + character.codePointAt(0) | 0

  return hash & 0x7fff_ffff
}

const composeLookupChunkCount = 16

const generateCompose = icons => {
  const entries = icons.map(icon => {
    const propertyName = toPascalCase(icon.publicName)

    return `        val ${propertyName}: LumenIconName get() = LumenIconName("${icon.publicName}")`
  }).join('\n')

  const entryChunks = []

  for (let index = 0; index < icons.length; index += 180) {
    const chunk = icons.slice(index, index + 180)

    entryChunks.push(chunk.map(icon => (
      `            LumenIconName("${icon.publicName}")`
    )).join(',\n'))
  }

  const entryFunctions = entryChunks.map((entriesChunk, index) => (
    `        private fun entries${index}(): List<LumenIconName> = listOf(\n${entriesChunk}\n        )`
  )).join('\n\n')

  const entryAssembly = entryChunks.map((_, index) => `            addAll(entries${index}())`).join('\n')
  const lookupChunks = Array.from({ length: composeLookupChunkCount }, () => [])

  for (const icon of icons) {
    lookupChunks[javaStringHash(icon.publicName) % composeLookupChunkCount].push(icon)
  }

  const lookupFunctions = lookupChunks.map((chunk, index) => {
    const branches = chunk.map(icon => (
      `        "${icon.publicName}" -> R.drawable.lumen_icon_${toResourceName(icon.publicName)}`
    )).join('\n')

    return `private fun lumenIconResourceId${index}(name: String): Int = when (name) {\n${branches}\n    else -> error("Unknown Lumen icon: $name")\n}`
  }).join('\n\n')

  const lookupDispatch = lookupChunks.map((_, index) => (
    `    ${index} -> lumenIconResourceId${index}(name)`
  )).join('\n')

  return `${generatedHeader}
package com.santi020k.lumen

@JvmInline
value class LumenIconName private constructor(val rawValue: String) {
    companion object {
${entries}

        private val allEntries: List<LumenIconName> by lazy {
            buildList {
${entryAssembly}
            }
        }

        val entries: List<LumenIconName> get() = allEntries

${entryFunctions}
    }

    internal val resourceId: Int get() = lumenIconResourceId(rawValue)
}

private fun lumenIconResourceId(name: String): Int = when (
    (name.hashCode() and Int.MAX_VALUE) % ${composeLookupChunkCount}
) {
${lookupDispatch}
    else -> error("Unknown Lumen icon: $name")
}

${lookupFunctions}
`
}

const swiftAssetContents = iconName => `${JSON.stringify({
  images: [
    {
      filename: `${iconName}.svg`,
      idiom: 'universal'
    }
  ],
  info: {
    author: 'xcode',
    version: 1
  },
  properties: {
    'preserves-vector-representation': true,
    'template-rendering-intent': 'template'
  }
}, null, 2)}
`

const assetCatalogContents = `${JSON.stringify({
  info: {
    author: 'xcode',
    version: 1
  }
}, null, 2)}
`

const createBrandIcons = (fab, aliases) => {
  const brands = new Map()

  for (const icon of Object.values(fab)) {
    if (!brands.has(icon.iconName)) brands.set(icon.iconName, icon)
  }

  for (const [alias, target] of Object.entries(aliases)) {
    const targetIcon = brands.get(target)

    if (!targetIcon) throw new Error(`Unknown Font Awesome brand alias target: ${target}.`)

    brands.set(alias, targetIcon)
  }

  return [...brands].map(([name, icon]) => ({
    height: icon.icon[1],
    node: [['path', { d: icon.icon[4] }]],
    publicName: `brand:${name}`,
    source: 'font-awesome-free-brands',
    style: 'fill',
    width: icon.icon[0]
  }))
}

const validateIcons = icons => {
  const names = new Set()
  const swiftNames = new Set()
  const composeNames = new Set()

  for (const icon of icons) {
    if (!/^(?:brand:)?[a-z0-9]+(?:-[a-z0-9]+)*$/.test(icon.publicName)) {
      throw new Error(`Invalid cross-platform icon name: ${icon.publicName}.`)
    }

    if (names.has(icon.publicName)) throw new Error(`Duplicate icon name: ${icon.publicName}.`)

    const swiftName = safeCamelCase(icon.publicName)
    const composeName = toPascalCase(icon.publicName)

    if (swiftNames.has(swiftName)) throw new Error(`Duplicate Swift icon name: ${swiftName}.`)

    if (composeNames.has(composeName)) throw new Error(`Duplicate Compose icon name: ${composeName}.`)

    names.add(icon.publicName)

    swiftNames.add(swiftName)

    composeNames.add(composeName)
  }
}

const loadIcons = async catalog => {
  const [{ icons: lucideIcons }, { fab }] = await Promise.all([
    import('@lucide/icons'),
    import('@fortawesome/free-brands-svg-icons')
  ])

  const icons = Object.values(lucideIcons).map(icon => ({
    height: 'size' in icon ? icon.size : icon.height,
    node: icon.node,
    publicName: icon.name,
    source: 'lucide',
    style: 'stroke',
    width: 'size' in icon ? icon.size : icon.width
  }))

  icons.push(...createBrandIcons(fab, catalog.brandAliases))

  icons.sort((a, b) => a.publicName.localeCompare(b.publicName))

  validateIcons(icons)

  return icons
}

const expectedFiles = async (catalog, notices) => {
  const icons = await loadIcons(catalog)

  const files = new Map([
    [reactNativePath, generateReactNative(icons)],
    [swiftPath, generateSwift(icons)],
    [composePath, generateCompose(icons)],
    [join(swiftAssetsPath, 'Contents.json'), assetCatalogContents],
    ...packageNoticePaths.map(path => [path, notices])
  ])

  for (const icon of icons) {
    const assetSlug = icon.publicName.replace(':', '-')
    const swiftName = `lumen-${assetSlug}-glyph`
    const imageSetPath = join(swiftAssetsPath, `${swiftName}.imageset`)
    const drawableName = `lumen_icon_${toResourceName(icon.publicName)}.xml`

    files.set(join(imageSetPath, 'Contents.json'), swiftAssetContents(swiftName))

    files.set(join(imageSetPath, `${swiftName}.svg`), renderSvg(icon))

    files.set(join(composeDrawablesPath, drawableName), renderVectorDrawable(icon))
  }

  return { files, icons }
}

const listFiles = async directory => {
  let entries

  try {
    entries = await readdir(directory, { withFileTypes: true })
  } catch (error) {
    if (error?.code === 'ENOENT') return []

    throw error
  }

  const files = await Promise.all(entries.map(async entry => {
    const path = join(directory, entry.name)

    return entry.isDirectory() ? listFiles(path) : [path]
  }))

  return files.flat()
}

const readExisting = async path => {
  try {
    return await readFile(path, 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined

    throw error
  }
}

const checkGeneratedFiles = async files => {
  const mismatches = []

  for (const path of [legacyReactNativePath, legacyComposeNoticePath]) {
    if (await readExisting(path) !== undefined) mismatches.push(relative(repositoryRoot, path))
  }

  for (const [path, expected] of files) {
    if (await readExisting(path) !== expected) mismatches.push(relative(repositoryRoot, path))
  }

  const generatedFiles = [
    ...(await listFiles(swiftAssetsPath)),
    ...(await listFiles(composeDrawablesPath)).filter(path => /lumen_icon_[^/]+\.xml$/.test(path))
  ]

  for (const path of generatedFiles) {
    if (!files.has(path)) mismatches.push(relative(repositoryRoot, path))
  }

  if (mismatches.length > 0) {
    throw new Error(
      `Generated platform icons are stale:\n${[...new Set(mismatches)].sort().join('\n')}`
    )
  }
}

const writeGeneratedFiles = async files => {
  await rm(legacyReactNativePath, { force: true })

  await rm(legacyComposeNoticePath, { force: true })

  await rm(swiftAssetsPath, { force: true, recursive: true })

  for (const path of await listFiles(composeDrawablesPath)) {
    if (/lumen_icon_[^/]+\.xml$/.test(path)) await unlink(path)
  }

  for (const [path, contents] of files) {
    await mkdir(dirname(path), { recursive: true })

    await writeFile(path, contents)
  }
}

const catalog = await readCatalog()
const notices = await readFile(noticesPath, 'utf8')
const { files, icons } = await expectedFiles(catalog, notices)
const interfaceCount = icons.filter(icon => icon.source === 'lucide').length
const brandCount = icons.length - interfaceCount

if (checkOnly) {
  await checkGeneratedFiles(files)

  process.stdout.write(`Checked ${interfaceCount} interface and ${brandCount} brand icons.\n`)
} else {
  await writeGeneratedFiles(files)

  process.stdout.write(`Generated ${interfaceCount} interface and ${brandCount} brand icons.\n`)
}
