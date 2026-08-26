import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = join(repoRoot, 'tokens/lumen.tokens.json')
const checkOnly = process.argv.includes('--check')
const lumenExtension = 'com.santi020k.lumen'

const toCamelCase = value =>
  value.replaceAll(/-([a-z0-9])/g, (_, character) => character.toUpperCase())

const toPascalCase = value => {
  const camel = toCamelCase(value)

  return `${camel.slice(0, 1).toUpperCase()}${camel.slice(1)}`
}

const toNativeCamelCase = value => (/^\d/.test(value) ? `size${value}` : toCamelCase(value))
const toNativePascalCase = value => (/^\d/.test(value) ? `Size${value}` : toPascalCase(value))

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

const requiredNumber = (value, path) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`Expected a finite number at ${path}.`)
  }

  return value
}

const tokenEntries = (group, path) =>
  Object.entries(requiredRecord(group, path))
    .filter(([name]) => !name.startsWith('$'))
    .map(([name, token]) => [name, requiredRecord(token, `${path}.${name}`)])

const tokenValue = (token, path) => {
  if (!Object.hasOwn(token, '$value')) throw new TypeError(`Missing $value at ${path}.`)

  return token.$value
}

const colorEntriesAt = (group, path) =>
  tokenEntries(
    requiredRecord(group, path),
    path
  ).map(([name, token]) => {
    const tokenPath = `${path}.${name}`
    const extensions = requiredRecord(token.$extensions, `${tokenPath}.$extensions`)

    const lumen = requiredRecord(
      extensions[lumenExtension],
      `${tokenPath}.$extensions.${lumenExtension}`
    )

    return {
      css: requiredString(
        lumen.cssValue,
        `${tokenPath}.$extensions.${lumenExtension}.cssValue`
      ),
      description: requiredString(token.$description, `${tokenPath}.$description`),
      hex: requiredString(
        tokenValue(token, tokenPath),
        `${tokenPath}.$value`
      ),
      name
    }
  })

const colorEntries = (source, scheme) => colorEntriesAt(
  requiredRecord(requiredRecord(source.color, 'color')[scheme], `color.${scheme}`),
  `color.${scheme}`
)

const visualizationColorEntries = (source, scheme) => colorEntriesAt(
  requiredRecord(
    requiredRecord(
      requiredRecord(source.visualization, 'visualization').color,
      'visualization.color'
    )[scheme],
    `visualization.color.${scheme}`
  ),
  `visualization.color.${scheme}`
)

const dimensionEntries = (source, groupName) =>
  tokenEntries(source[groupName], groupName).map(([name, token]) => {
    const value = requiredRecord(
      tokenValue(token, `${groupName}.${name}`),
      `${groupName}.${name}.$value`
    )

    const unit = requiredString(value.unit, `${groupName}.${name}.$value.unit`)

    if (unit !== 'px')
      throw new TypeError(`Only px dimensions are supported at ${groupName}.${name}.`)

    return {
      name,
      value: requiredNumber(value.value, `${groupName}.${name}.$value.value`)
    }
  })

const nestedEntries = (source, parent, group) =>
  tokenEntries(
    requiredRecord(requiredRecord(source[parent], parent)[group], `${parent}.${group}`),
    `${parent}.${group}`
  )

const nestedDimensionEntries = (source, parent, group) =>
  nestedEntries(source, parent, group).map(([name, token]) => {
    const value = requiredRecord(
      tokenValue(token, `${parent}.${group}.${name}`),
      `${parent}.${group}.${name}.$value`
    )

    if (value.unit !== 'px') {
      throw new TypeError(`Only px dimensions are supported at ${parent}.${group}.${name}.`)
    }

    return {
      name,
      value: requiredNumber(value.value, `${parent}.${group}.${name}.$value.value`)
    }
  })

const readSource = async () => {
  const source = JSON.parse(await readFile(sourcePath, 'utf8'))
  const light = colorEntries(source, 'light')
  const dark = colorEntries(source, 'dark')
  const chartLight = visualizationColorEntries(source, 'light')
  const chartDark = visualizationColorEntries(source, 'dark')

  if (light.map(token => token.name).join() !== dark.map(token => token.name).join()) {
    throw new Error('Light and dark color token names must match and retain the same order.')
  }

  if (chartLight.map(token => token.name).join() !== chartDark.map(token => token.name).join()) {
    throw new Error('Light and dark chart color token names must match and retain the same order.')
  }

  return {
    chartDark,
    chartLight,
    chartOpacities: nestedEntries(source, 'visualization', 'opacity').map(([name, token]) => ({
      name,
      value: requiredNumber(
        tokenValue(token, `visualization.opacity.${name}`),
        `visualization.opacity.${name}.$value`
      )
    })),
    chartStrokeWidths: nestedDimensionEntries(source, 'visualization', 'stroke-width'),
    dark,
    durations: nestedEntries(source, 'motion', 'duration').map(([name, token]) => {
      const value = requiredRecord(
        tokenValue(token, `motion.duration.${name}`),
        `motion.duration.${name}.$value`
      )

      if (value.unit !== 'ms')
        throw new TypeError(`Only ms durations are supported at motion.duration.${name}.`)

      return {
        name,
        value: requiredNumber(value.value, `motion.duration.${name}.$value.value`)
      }
    }),
    easings: nestedEntries(source, 'motion', 'easing').map(([name, token]) => {
      const value = tokenValue(token, `motion.easing.${name}`)

      if (!Array.isArray(value) || value.length !== 4) {
        throw new TypeError(`Expected four cubic Bézier values at motion.easing.${name}.$value.`)
      }

      return {
        name,
        value: value.map((item, index) =>
          requiredNumber(item, `motion.easing.${name}.$value.${index}`)
        )
      }
    }),
    elevation: tokenEntries(source.elevation, 'elevation').map(([name, token]) => ({
      name,
      value: requiredNumber(tokenValue(token, `elevation.${name}`), `elevation.${name}.$value`)
    })),
    fontFamily: nestedEntries(source, 'typography', 'font-family').map(([name, token]) => {
      const value = tokenValue(token, `typography.font-family.${name}`)

      if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
        throw new TypeError(
          `Expected a font family array at typography.font-family.${name}.$value.`
        )
      }

      return { name, value }
    }),
    fontSizes: nestedEntries(source, 'typography', 'font-size').map(([name, token]) => {
      const value = requiredRecord(
        tokenValue(token, `typography.font-size.${name}`),
        `typography.font-size.${name}.$value`
      )

      if (value.unit !== 'px')
        throw new TypeError(`Only px font sizes are supported at typography.font-size.${name}.`)

      return {
        name,
        value: requiredNumber(value.value, `typography.font-size.${name}.$value.value`)
      }
    }),
    fontWeights: nestedEntries(source, 'typography', 'font-weight').map(([name, token]) => ({
      name,
      value: requiredNumber(
        tokenValue(token, `typography.font-weight.${name}`),
        `typography.font-weight.${name}.$value`
      )
    })),
    graphicFrameSizes: nestedDimensionEntries(source, 'graphics', 'frame-size'),
    graphicIllustrationSizes: nestedDimensionEntries(source, 'graphics', 'illustration-size'),
    graphicOpacities: nestedEntries(source, 'graphics', 'opacity').map(([name, token]) => ({
      name,
      value: requiredNumber(tokenValue(token, `graphics.opacity.${name}`), `graphics.opacity.${name}.$value`)
    })),
    graphicStrokeWidths: nestedDimensionEntries(source, 'graphics', 'stroke-width'),
    light,
    radii: dimensionEntries(source, 'radius'),
    spacing: dimensionEntries(source, 'space')
  }
}

const tsProperty = value => (/^[A-Za-z_$][\w$]*$/.test(value) ? value : JSON.stringify(value))

const tsObject = (entries, value, indentation = '  ') =>
  entries
    .map(entry => `${indentation}${tsProperty(toCamelCase(entry.name))}: ${value(entry)}`)
    .join(',\n')

const generateTypeScript =
  tokens => `/* This file is generated by scripts/generate-platform-tokens.mjs. */

export const lumenColorTokens = {
  light: {
${tsObject(tokens.light, token => JSON.stringify(token.hex), '    ')}
  },
  dark: {
${tsObject(tokens.dark, token => JSON.stringify(token.hex), '    ')}
  }
} as const

export const lumenCssColorTokens = {
  light: {
${tsObject(tokens.light, token => JSON.stringify(token.css), '    ')}
  },
  dark: {
${tsObject(tokens.dark, token => JSON.stringify(token.css), '    ')}
  }
} as const

export const lumenChartColorTokens = {
  light: {
${tsObject(tokens.chartLight, token => JSON.stringify(token.hex), '    ')}
  },
  dark: {
${tsObject(tokens.chartDark, token => JSON.stringify(token.hex), '    ')}
  }
} as const

export const lumenChartCssColorTokens = {
  light: {
${tsObject(tokens.chartLight, token => JSON.stringify(token.css), '    ')}
  },
  dark: {
${tsObject(tokens.chartDark, token => JSON.stringify(token.css), '    ')}
  }
} as const

export const lumenChartStrokeWidths = {
${tsObject(tokens.chartStrokeWidths, token => String(token.value))}
} as const

export const lumenChartOpacities = {
${tsObject(tokens.chartOpacities, token => String(token.value))}
} as const

export const lumenSpacing = {
${tsObject(tokens.spacing, token => String(token.value))}
} as const

export const lumenRadii = {
${tsObject(tokens.radii, token => String(token.value))}
} as const

export const lumenFontFamilies = {
${tsObject(tokens.fontFamily, token => JSON.stringify(token.value))}
} as const

export const lumenFontSizes = {
${tsObject(tokens.fontSizes, token => String(token.value))}
} as const

export const lumenFontWeights = {
${tsObject(tokens.fontWeights, token => String(token.value))}
} as const

export const lumenDurations = {
${tsObject(tokens.durations, token => String(token.value))}
} as const

export const lumenEasings = {
${tsObject(tokens.easings, token => JSON.stringify(token.value))}
} as const

export const lumenElevation = {
${tsObject(tokens.elevation, token => String(token.value))}
} as const

export const lumenGraphicFrameSizes = {
${tsObject(tokens.graphicFrameSizes, token => String(token.value))}
} as const

export const lumenIllustrationSizes = {
${tsObject(tokens.graphicIllustrationSizes, token => String(token.value))}
} as const

export const lumenGraphicStrokeWidths = {
${tsObject(tokens.graphicStrokeWidths, token => String(token.value))}
} as const

export const lumenGraphicOpacities = {
${tsObject(tokens.graphicOpacities, token => String(token.value))}
} as const

export type LumenColorScheme = keyof typeof lumenColorTokens
export type LumenChartColor = keyof typeof lumenChartColorTokens.light
export type LumenSemanticColor = keyof typeof lumenColorTokens.light
`

const swiftColorArguments = hex => {
  const value = hex.slice(1)
  const parts = [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)]
  const labels = ['red', 'green', 'blue']

  return parts
    .map((part, index) => `${labels[index]}: ${(Number.parseInt(part, 16) / 255).toFixed(6)}`)
    .join(', ')
}

const swiftBezierArguments = values =>
  [`x1: ${values[0]}`, `y1: ${values[1]}`, `x2: ${values[2]}`, `y2: ${values[3]}`].join(', ')

const generateSwift = tokens => `// This file is generated by scripts/generate-platform-tokens.mjs.
import SwiftUI

public struct LumenColorPalette: Sendable {
${tokens.light.map(token => `    public let ${toCamelCase(token.name)}: Color`).join('\n')}

    public init(
${tokens.light
  .map(token => `        ${toCamelCase(token.name)}: Color,`)
  .join('\n')
  .replace(/,$/, '')}
    ) {
${tokens.light.map(token => `        self.${toCamelCase(token.name)} = ${toCamelCase(token.name)}`).join('\n')}
    }
}

public enum LumenColors {
    public static let light = LumenColorPalette(
${tokens.light
  .map(token => `        ${toCamelCase(token.name)}: Color(${swiftColorArguments(token.hex)}),`)
  .join('\n')
  .replace(/,$/, '')}
    )

    public static let dark = LumenColorPalette(
${tokens.dark
  .map(token => `        ${toCamelCase(token.name)}: Color(${swiftColorArguments(token.hex)}),`)
  .join('\n')
  .replace(/,$/, '')}
    )
}

public struct LumenChartColorPalette: Sendable {
${tokens.chartLight.map(token => `    public let ${toCamelCase(token.name)}: Color`).join('\n')}

    public init(
${tokens.chartLight
  .map(token => `        ${toCamelCase(token.name)}: Color,`)
  .join('\n')
  .replace(/,$/, '')}
    ) {
${tokens.chartLight.map(token => `        self.${toCamelCase(token.name)} = ${toCamelCase(token.name)}`).join('\n')}
    }
}

public enum LumenChartColors {
    public static let light = LumenChartColorPalette(
${tokens.chartLight
  .map(token => `        ${toCamelCase(token.name)}: Color(${swiftColorArguments(token.hex)}),`)
  .join('\n')
  .replace(/,$/, '')}
    )

    public static let dark = LumenChartColorPalette(
${tokens.chartDark
  .map(token => `        ${toCamelCase(token.name)}: Color(${swiftColorArguments(token.hex)}),`)
  .join('\n')
  .replace(/,$/, '')}
    )
}

public enum LumenChartMetrics {
${tokens.chartStrokeWidths.map(token => `    public static let ${toCamelCase(token.name)}StrokeWidth: CGFloat = ${token.value}`).join('\n')}
${tokens.chartOpacities.map(token => `    public static let ${toCamelCase(token.name)}Opacity: Double = ${token.value}`).join('\n')}
}

public enum LumenSpacing {
${tokens.spacing.map(token => `    public static let ${toNativeCamelCase(token.name)}: CGFloat = ${token.value}`).join('\n')}
}

public enum LumenRadius {
${tokens.radii.map(token => `    public static let ${toCamelCase(token.name)}: CGFloat = ${token.value}`).join('\n')}
}

public enum LumenTypography {
${tokens.fontSizes.map(token => `    public static let ${toNativeCamelCase(token.name)}Size: CGFloat = ${token.value}`).join('\n')}
${tokens.fontWeights.map(token => `    public static let ${toCamelCase(token.name)}Weight: Font.Weight = .${token.name === 'semibold' ? 'semibold' : token.name}`).join('\n')}
}

public struct LumenCubicBezier: Equatable, Sendable {
    public let x1: Double
    public let y1: Double
    public let x2: Double
    public let y2: Double

    public init(x1: Double, y1: Double, x2: Double, y2: Double) {
        self.x1 = x1
        self.y1 = y1
        self.x2 = x2
        self.y2 = y2
    }
}

public enum LumenMotion {
${tokens.durations.map(token => `    public static let ${toCamelCase(token.name)}Duration: Double = ${(token.value / 1000).toFixed(2)}`).join('\n')}
${tokens.easings.map(token => `    public static let ${toCamelCase(token.name)}Easing = LumenCubicBezier(${swiftBezierArguments(token.value)})`).join('\n')}
}

public enum LumenElevation {
${tokens.elevation.map(token => `    public static let ${toCamelCase(token.name)}: CGFloat = ${token.value}`).join('\n')}
}

public enum LumenGraphics {
${tokens.graphicFrameSizes.map(token => `    public static let ${toCamelCase(token.name)}FrameSize: CGFloat = ${token.value}`).join('\n')}
${tokens.graphicIllustrationSizes.map(token => `    public static let ${toCamelCase(token.name)}IllustrationSize: CGFloat = ${token.value}`).join('\n')}
${tokens.graphicStrokeWidths.map(token => `    public static let ${toCamelCase(token.name)}StrokeWidth: CGFloat = ${token.value}`).join('\n')}
${tokens.graphicOpacities.map(token => `    public static let ${toCamelCase(token.name)}Opacity: Double = ${token.value}`).join('\n')}
}
`

const kotlinColor = hex => `Color(0xFF${hex.slice(1)})`
const kotlinFloat = value => (Number.isInteger(value) ? `${value}f` : `${value}f`)

const generateKotlin = tokens => `// This file is generated by scripts/generate-platform-tokens.mjs.
package com.santi020k.lumen

import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Immutable
data class LumenColorPalette(
${tokens.light
  .map(token => `    val ${toCamelCase(token.name)}: Color,`)
  .join('\n')
  .replace(/,$/, '')}
)

object LumenColors {
    val Light = LumenColorPalette(
${tokens.light
  .map(token => `        ${toCamelCase(token.name)} = ${kotlinColor(token.hex)},`)
  .join('\n')
  .replace(/,$/, '')}
    )

    val Dark = LumenColorPalette(
${tokens.dark
  .map(token => `        ${toCamelCase(token.name)} = ${kotlinColor(token.hex)},`)
  .join('\n')
  .replace(/,$/, '')}
    )
}

@Immutable
data class LumenChartColorPalette(
${tokens.chartLight
  .map(token => `    val ${toCamelCase(token.name)}: Color,`)
  .join('\n')
  .replace(/,$/, '')}
)

object LumenChartColors {
    val Light = LumenChartColorPalette(
${tokens.chartLight
  .map(token => `        ${toCamelCase(token.name)} = ${kotlinColor(token.hex)},`)
  .join('\n')
  .replace(/,$/, '')}
    )

    val Dark = LumenChartColorPalette(
${tokens.chartDark
  .map(token => `        ${toCamelCase(token.name)} = ${kotlinColor(token.hex)},`)
  .join('\n')
  .replace(/,$/, '')}
    )
}

object LumenChartMetrics {
${tokens.chartStrokeWidths.map(token => `    val ${toPascalCase(token.name)}StrokeWidth = ${kotlinFloat(token.value)}.dp`).join('\n')}
${tokens.chartOpacities.map(token => `    const val ${toPascalCase(token.name)}Opacity = ${kotlinFloat(token.value)}`).join('\n')}
}

object LumenSpacing {
${tokens.spacing.map(token => `    val ${toNativePascalCase(token.name)} = ${kotlinFloat(token.value)}.dp`).join('\n')}
}

object LumenRadius {
${tokens.radii.map(token => `    val ${toPascalCase(token.name)} = ${kotlinFloat(token.value)}.dp`).join('\n')}
}

object LumenTypography {
${tokens.fontSizes.map(token => `    val ${toNativePascalCase(token.name)}Size = ${kotlinFloat(token.value)}.sp`).join('\n')}
${tokens.fontWeights.map(token => `    const val ${toPascalCase(token.name)}Weight = ${token.value}`).join('\n')}
}

@Immutable
data class LumenCubicBezier(
    val x1: Float,
    val y1: Float,
    val x2: Float,
    val y2: Float
)

object LumenMotion {
${tokens.durations.map(token => `    const val ${toPascalCase(token.name)}DurationMillis = ${token.value}`).join('\n')}
${tokens.easings.map(token => `    val ${toPascalCase(token.name)}Easing = LumenCubicBezier(${token.value.map(kotlinFloat).join(', ')})`).join('\n')}
}

object LumenElevation {
${tokens.elevation.map(token => `    val ${toPascalCase(token.name)} = ${kotlinFloat(token.value)}.dp`).join('\n')}
}

object LumenGraphics {
${tokens.graphicFrameSizes.map(token => `    val ${toPascalCase(token.name)}FrameSize = ${kotlinFloat(token.value)}.dp`).join('\n')}
${tokens.graphicIllustrationSizes.map(token => `    val ${toPascalCase(token.name)}IllustrationSize = ${kotlinFloat(token.value)}.dp`).join('\n')}
${tokens.graphicStrokeWidths.map(token => `    val ${toPascalCase(token.name)}StrokeWidth = ${kotlinFloat(token.value)}.dp`).join('\n')}
${tokens.graphicOpacities.map(token => `    const val ${toPascalCase(token.name)}Opacity = ${kotlinFloat(token.value)}`).join('\n')}
}
`

const assertStylesMatch = async tokens => {
  const styles = await readFile(join(repoRoot, 'packages/lumen/styles.css'), 'utf8')

  const blocks = [
    ['light', ':root[data-theme="light"] {', tokens.light],
    ['dark', ':root[data-theme="lumen-dark"] {', tokens.dark]
  ]

  for (const [scheme, marker, colors] of blocks) {
    const markerIndex = styles.indexOf(marker)

    if (markerIndex === -1)
      throw new Error(`Missing ${scheme} theme block in packages/lumen/styles.css.`)

    const blockEnd = styles.indexOf('\n}', markerIndex)

    if (blockEnd === -1)
      throw new Error(`Unterminated ${scheme} theme block in packages/lumen/styles.css.`)

    const block = styles.slice(markerIndex, blockEnd)

    for (const color of colors) {
      if (!block.includes(`--${color.name}: ${color.css};`)) {
        throw new Error(`CSS token --${color.name} does not match the canonical ${scheme} value.`)
      }
    }

    const chartColors = scheme === 'light' ? tokens.chartLight : tokens.chartDark

    for (const color of chartColors) {
      if (!block.includes(`--chart-${color.name}: ${color.css};`)) {
        throw new Error(
          `CSS token --chart-${color.name} does not match the canonical ${scheme} value.`
        )
      }
    }
  }
}

const writeGeneratedFile = async (path, content) => {
  const output = content.endsWith('\n') ? content : `${content}\n`

  if (checkOnly) {
    const current = await readFile(path, 'utf8').catch(() => '')

    if (current !== output) throw new Error(`${path.slice(repoRoot.length + 1)} is stale.`)

    return
  }

  await mkdir(dirname(path), { recursive: true })

  const temporaryPath = `${path}.${process.pid}.tmp`

  try {
    await writeFile(temporaryPath, output, 'utf8')

    await rename(temporaryPath, path)
  } finally {
    await unlink(temporaryPath).catch(() => {})
  }
}

const main = async () => {
  const tokens = await readSource()
  const canonicalSource = await readFile(sourcePath, 'utf8')

  const outputs = [
    ['packages/tokens/lumen.tokens.json', canonicalSource],
    ['packages/core/src/foundations.generated.ts', generateTypeScript(tokens)],
    ['packages/react-native/src/tokens.generated.ts', generateTypeScript(tokens)],
    ['packages/swift/Sources/LumenUI/Tokens.generated.swift', generateSwift(tokens)],
    [
      'packages/compose/src/main/kotlin/com/santi020k/lumen/Tokens.generated.kt',
      generateKotlin(tokens)
    ]
  ]

  await Promise.all(
    outputs.map(([path, content]) => writeGeneratedFile(join(repoRoot, path), content))
  )

  await assertStylesMatch(tokens)

  process.stdout.write(
    `lumen-platform-tokens: ${checkOnly ? 'verified' : 'generated'} ${outputs.length} outputs\n`
  )
}

await main()
