import { readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const repositoryRoot = resolve(import.meta.dirname, '..')
const sourcePath = join(repositoryRoot, 'registry/native-playground-catalog.json')
const nativeRegistryPath = join(repositoryRoot, 'registry/native-components.json')
const checkOnly = process.argv.includes('--check')

const outputPaths = {
  compose: join(
    repositoryRoot,
    'apps/playground-android/app/src/main/kotlin/com/santi020k/lumen/playground/compose/PlaygroundCatalog.generated.kt'
  ),
  reactNative: join(
    repositoryRoot,
    'apps/playground-react-native/src/playground-catalog.generated.ts'
  ),
  swiftUI: join(
    repositoryRoot,
    'apps/playground-apple/Sources/LumenApplePlayground/PlaygroundCatalog.generated.swift'
  )
}

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

const requiredArray = (value, path) => {
  if (!Array.isArray(value)) throw new TypeError(`Expected an array at ${path}.`)

  return value
}

const componentLabel = id => id
  .split('-')
  .map((part, index) => index === 0 ? `${part.slice(0, 1).toUpperCase()}${part.slice(1)}` : part)
  .join(' ')

const readCatalog = async () => {
  const source = requiredRecord(JSON.parse(await readFile(sourcePath, 'utf8')), 'catalog')

  const nativeRegistry = requiredRecord(
    JSON.parse(await readFile(nativeRegistryPath, 'utf8')),
    'native registry'
  )

  if (source.schemaVersion !== 1) throw new Error('Unsupported native playground catalog schema.')

  const categories = requiredArray(source.categories, 'categories').map((value, categoryIndex) => {
    const category = requiredRecord(value, `categories.${categoryIndex}`)

    return {
      componentIds: requiredArray(category.componentIds, `categories.${categoryIndex}.componentIds`)
        .map((id, componentIndex) => requiredString(
          id,
          `categories.${categoryIndex}.componentIds.${componentIndex}`
        )),
      description: requiredString(category.description, `categories.${categoryIndex}.description`),
      id: requiredString(category.id, `categories.${categoryIndex}.id`),
      label: requiredString(category.label, `categories.${categoryIndex}.label`)
    }
  })

  const categoryIds = categories.map(category => category.id)

  if (new Set(categoryIds).size !== categoryIds.length) {
    throw new Error('Native playground category ids must be unique.')
  }

  const sharedComponentIds = categories.flatMap(category => category.componentIds)

  if (new Set(sharedComponentIds).size !== sharedComponentIds.length) {
    throw new Error('Each shared native playground component must have exactly one category.')
  }

  const nativeComponents = requiredArray(nativeRegistry.components, 'native registry.components')
    .map((value, index) => requiredRecord(value, `native registry.components.${index}`))

  const expectedSharedIds = nativeComponents
    .filter(component => {
      const symbols = requiredRecord(component.symbols, `component ${String(component.id)}.symbols`)

      return ['compose', 'reactNative', 'swiftUI'].every(adapter => typeof symbols[adapter] === 'string')
        && !requiredString(component.id, 'component.id').startsWith('wearable-')
    })
    .map(component => requiredString(component.id, 'component.id'))

  const missingShared = expectedSharedIds.filter(id => !sharedComponentIds.includes(id))
  const unknownShared = sharedComponentIds.filter(id => !expectedSharedIds.includes(id))

  if (missingShared.length > 0 || unknownShared.length > 0) {
    throw new Error(
      `Shared native playground catalog mismatch. Missing: ${missingShared.join(', ') || 'none'}. `
      + `Unknown: ${unknownShared.join(', ') || 'none'}.`
    )
  }

  const platformComponents = requiredRecord(source.platformComponents, 'platformComponents')

  const platforms = Object.fromEntries(
    ['compose', 'reactNative', 'swiftUI'].map(platform => {
      const extras = requiredArray(platformComponents[platform], `platformComponents.${platform}`)
        .map((value, index) => {
          const extra = requiredRecord(value, `platformComponents.${platform}.${index}`)
          const category = requiredString(extra.category, `platformComponents.${platform}.${index}.category`)

          if (!categoryIds.includes(category)) {
            throw new Error(`Unknown category ${category} for ${platform} playground component.`)
          }

          return {
            category,
            id: requiredString(extra.id, `platformComponents.${platform}.${index}.id`),
            label: requiredString(extra.label, `platformComponents.${platform}.${index}.label`)
          }
        })

      return [platform, extras]
    })
  )

  return { categories, platforms }
}

const entriesForPlatform = (catalog, platform) => catalog.categories.map(category => ({
  ...category,
  names: [
    ...category.componentIds.map(componentLabel),
    ...catalog.platforms[platform]
      .filter(component => component.category === category.id)
      .map(component => component.label)
  ]
}))

const quotedList = (values, indentation) => values
  .map(value => `${indentation}${JSON.stringify(value)}`)
  .join(',\n')

const generateReactNative = catalog => {
  const categories = entriesForPlatform(catalog, 'reactNative')

  return `/* This file is generated by scripts/generate-native-playground-catalogs.mjs. */

export type ComponentCategory = ${categories.map(category => `'${category.id}'`).join(' | ')}

export interface ComponentCategoryDefinition {
  description: string
  label: string
  names: readonly string[]
  value: ComponentCategory
}

export const componentCategories: readonly ComponentCategoryDefinition[] = [
${categories.map(category => `  {
    description: ${JSON.stringify(category.description)},
    label: ${JSON.stringify(category.label)},
    names: [
${quotedList(category.names, '      ')}
    ],
    value: '${category.id}'
  }`).join(',\n')}
] as const

export const componentNames = componentCategories.flatMap(category => category.names)
`
}

const generateSwift = catalog => {
  const categories = entriesForPlatform(catalog, 'swiftUI')

  return `// This file is generated by scripts/generate-native-playground-catalogs.mjs.

import LumenUI

enum PlaygroundComponentCategory: String, CaseIterable, Identifiable {
    case all
${categories.map(category => `    case ${category.id}`).join('\n')}

    var id: String { rawValue }
    var title: String { rawValue.capitalized }

    func contains(_ component: String) -> Bool {
        self == .all || PlaygroundCatalog.category(for: component) == self
    }
}

enum PlaygroundCatalog {
    static let categories: [(category: PlaygroundComponentCategory, names: [String])] = [
${categories.map(category => `        (
            .${category.id},
            [
${quotedList(category.names, '                ')}
            ]
        )`).join(',\n')}
    ]

    static let componentNames = categories.flatMap(\\.names)

    static func count(in category: PlaygroundComponentCategory) -> Int {
        componentNames.filter(category.contains).count
    }

    static func category(for component: String) -> PlaygroundComponentCategory {
        categories.first { $0.names.contains(component) }?.category ?? .data
    }

    static var categoryChartSeries: [LumenChartSeries] {
        let categories = PlaygroundComponentCategory.allCases.filter { $0 != .all }
        return [
            LumenChartSeries(
                id: "components",
                label: "Components",
                data: categories.map { category in
                    LumenChartDatum(
                        id: category.rawValue,
                        x: .category(category.title),
                        y: Double(count(in: category))
                    )
                },
                tone: .brand,
                mark: .bar
            )
        ]
    }
}
`
}

const generateCompose = catalog => {
  const categories = entriesForPlatform(catalog, 'compose')

  return `// This file is generated by scripts/generate-native-playground-catalogs.mjs.

package com.santi020k.lumen.playground.compose

internal data class PlaygroundSection(
    val description: String,
    val names: Set<String>,
    val title: String
)

internal val playgroundSections = listOf(
${categories.map(category => `    PlaygroundSection(
        title = ${JSON.stringify(category.label)},
        description = ${JSON.stringify(category.description)},
        names = setOf(
${quotedList(category.names, '            ')}
        )
    )`).join(',\n')}
)
`
}

const writeOrCheck = async (path, content) => {
  if (checkOnly) {
    const existing = await readFile(path, 'utf8').catch(() => '')

    if (existing !== content) {
      throw new Error(`${path.slice(repositoryRoot.length + 1)} is stale.`)
    }

    return
  }

  await writeFile(path, content)
}

const catalog = await readCatalog()

await Promise.all([
  writeOrCheck(outputPaths.reactNative, generateReactNative(catalog)),
  writeOrCheck(outputPaths.swiftUI, generateSwift(catalog)),
  writeOrCheck(outputPaths.compose, generateCompose(catalog))
])

process.stdout.write(
  checkOnly ? 'Native playground catalogs are current.\n' : 'Generated native playground catalogs.\n'
)
