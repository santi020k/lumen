import { createHash } from 'node:crypto'
import { readdir, readFile, stat } from 'node:fs/promises'
import { extname, join, relative, resolve } from 'node:path'

import { lumenComponentBehavior, type LumenComponentName, lumenStylingContracts } from '@santi020k/lumen-core'

export type LumenDiagnosticSeverity = 'advisory' | 'error'

export interface LumenDiagnosticFinding {
  file: string
  message: string
  remediation: string
  rule: string
  severity: LumenDiagnosticSeverity
}

export interface LumenDiagnosticReport {
  catalogFingerprint: string
  findings: LumenDiagnosticFinding[]
  frameworks: ('astro' | 'elements' | 'react')[]
  generatedAt: string
  healthy: boolean
  repository: string
  runtimeComponents: string[]
}

const sourceExtensions = new Set(['.astro', '.css', '.js', '.jsx', '.mjs', '.ts', '.tsx'])
const ignoredDirectories = new Set(['.git', '.next', '.turbo', 'coverage', 'dist', 'node_modules'])

const publicRootSlots: ReadonlySet<string> = new Set(
  Object.values(lumenStylingContracts).flatMap(contract => [contract.rootSlot, ...contract.parts])
)

const findSourceFiles = async (root: string): Promise<string[]> => {
  const files: string[] = []

  const visit = async (directory: string): Promise<void> => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (ignoredDirectories.has(entry.name)) continue

      const path = join(directory, entry.name)

      if (entry.isDirectory()) await visit(path)
      else if (sourceExtensions.has(extname(entry.name))) files.push(path)
    }
  }

  await visit(root)

  return files
}

const importedNames = (source: string, packageName: string): string[] => {
  const names: string[] = []
  const pattern = new RegExp(`import\\s*\\{([\\s\\S]*?)\\}\\s*from\\s*['"]${packageName}['"]`, 'g')

  for (const match of source.matchAll(pattern)) {
    for (const entry of (match[1] ?? '').split(',')) {
      const name = entry.trim().split(/\s+as\s+/u)[0]

      if (name) names.push(name)
    }
  }

  return names
}

const finding = (
  file: string,
  rule: string,
  message: string,
  remediation: string,
  severity: LumenDiagnosticSeverity = 'error'
): LumenDiagnosticFinding => ({ file, message, remediation, rule, severity })

type LumenFramework = 'astro' | 'elements' | 'react'

interface SourceEntry {
  file: string
  source: string
}

const getFrameworks = (joined: string): LumenFramework[] => [
  joined.includes('@santi020k/lumen-astro') && 'astro',
  joined.includes('@santi020k/lumen-elements') && 'elements',
  joined.includes('@santi020k/lumen-react') && 'react'
].filter((value): value is LumenFramework => Boolean(value))

const collectCompatibilityFindings = (
  root: string,
  sources: SourceEntry[]
): LumenDiagnosticFinding[] => sources.flatMap(item => {
  const file = relative(root, item.file)
  const findings: LumenDiagnosticFinding[] = []

  if (/surface\s*=\s*["']glass["']/u.test(item.source)) {
    findings.push(finding(
      file, 'deprecated-surface-glass', 'The surface="glass" compatibility alias is deprecated.', 'Replace it with the glass prop or attribute.', 'advisory'
    ))
  }

  if (item.source.includes('ui:datatable-selection-change')) {
    findings.push(finding(
      file, 'deprecated-datatable-event', 'The ui:datatable-selection-change event alias is deprecated.', 'Rename it to ui:data-table-selection-change.', 'advisory'
    ))
  }

  return findings
})

const getCatalogFingerprint = (sources: SourceEntry[]): string => {
  const names = [...new Set(sources.flatMap(item => [
    ...importedNames(item.source, '@santi020k/lumen-astro'),
    ...importedNames(item.source, '@santi020k/lumen-react')
  ]))]
    .filter(name => name in lumenComponentBehavior)
    .sort()

  const contracts = names.map(name => [name, lumenComponentBehavior[name as LumenComponentName]])

  return createHash('sha256').update(JSON.stringify(contracts)).digest('hex')
}

const collectRuntimeFindings = (
  root: string,
  sources: SourceEntry[],
  runtimeComponents: string[]
): LumenDiagnosticFinding[] => {
  const imports = sources.flatMap(item => importedNames(item.source, '@santi020k/lumen-astro').map(name => ({ file: item.file, name })))
  const mounts = sources.filter(item => /<UIPrimitives(?:\s|\/|>)/u.test(item.source))
  const findings: LumenDiagnosticFinding[] = []

  if (runtimeComponents.length > 0 && mounts.length === 0) {
    findings.push(finding(
      imports[0] ? relative(root, imports[0].file) : 'package.json', 'astro-runtime-missing', `Interactive Astro imports require UIPrimitives: ${runtimeComponents.join(', ')}.`, 'Mount <UIPrimitives /> once in the root layout.'
    ))
  }

  for (const mount of mounts.slice(1)) {
    findings.push(finding(
      relative(root, mount.file), 'astro-runtime-duplicate', 'UIPrimitives is mounted more than once.', 'Keep one mount in the application root layout.'
    ))
  }

  return findings
}

const collectCssFindings = (root: string, sources: SourceEntry[]): LumenDiagnosticFinding[] => sources.filter(item => item.file.endsWith('.css')).flatMap(item => {
  const layerIndex = item.source.indexOf('/layers.css')
  const tailwindIndex = item.source.indexOf('tailwindcss')
  const styleIndex = item.source.indexOf('/styles.css')
  const findings: LumenDiagnosticFinding[] = []

  if (
    tailwindIndex >= 0 &&
    (layerIndex < 0 || styleIndex < 0 || !(layerIndex < tailwindIndex && tailwindIndex < styleIndex))
  ) {
    findings.push(finding(
      relative(root, item.file), 'tailwind-layer-order', 'Tailwind and Lumen imports do not use the verified cascade order.', 'Import Lumen layers.css, then tailwindcss, then the matching Lumen styles.css.'
    ))
  }

  for (const match of item.source.matchAll(/\.ui-([a-z0-9-]+)/g)) {
    const selector = match[1] ?? ''

    if (!publicRootSlots.has(selector)) {
      findings.push(finding(
        relative(root, item.file), 'internal-selector', `Selector .ui-${selector} is not a documented stable root hook.`, 'Prefer component props, semantic tokens, documented custom properties, or [data-slot].', 'advisory'
      ))
    }
  }

  return findings
})

const styleImportByFramework = {
  astro: '@santi020k/lumen-astro/styles.css',
  elements: '@santi020k/lumen-elements/styles.css',
  react: '@santi020k/lumen-react/styles.css'
} as const

const collectFrameworkStyleFindings = (
  root: string,
  sources: SourceEntry[],
  frameworks: LumenFramework[]
): LumenDiagnosticFinding[] => frameworks.flatMap(framework => {
  const references = sources.filter(item => item.source.includes(styleImportByFramework[framework]))

  if (references.length === 0) {
    return [finding(
      'styles', 'framework-style-missing', `No ${styleImportByFramework[framework]} import was found.`, 'Load the matching adapter stylesheet once in the application root.'
    )]
  }

  return references.slice(1).map(item => finding(
    relative(root, item.file), 'framework-style-duplicate', `The ${framework} stylesheet is loaded more than once.`, 'Keep one stylesheet import in the application root.'
  ))
})

const collectAdapterMismatchFindings = (
  joined: string,
  frameworks: LumenFramework[]
): LumenDiagnosticFinding[] => {
  const adapters = [...joined.matchAll(/@santi020k\/lumen-(astro|elements|react)\/styles\.css/g)]
    .map(match => match[1])
    .filter((adapter): adapter is LumenFramework => adapter === 'astro' || adapter === 'elements' || adapter === 'react')

  return [...new Set(adapters)]
    .filter(adapter => !frameworks.includes(adapter))
    .map(adapter => finding(
      'styles', 'adapter-style-mismatch', `The ${adapter} stylesheet is loaded without matching ${adapter} imports.`, 'Load the stylesheet from the adapter used by this application boundary.'
    ))
}

export const inspectLumenIntegration = async (repository: string): Promise<LumenDiagnosticReport> => {
  const root = resolve(repository)

  if (!(await stat(root)).isDirectory()) throw new Error(`Not a directory: ${root}`)

  const files = await findSourceFiles(root)
  const sources = await Promise.all(files.map(async file => ({ file, source: await readFile(file, 'utf8') })))
  const joined = sources.map(item => item.source).join('\n')
  const frameworks = getFrameworks(joined)
  const astroNames = sources.flatMap(item => importedNames(item.source, '@santi020k/lumen-astro'))

  const runtimeComponents = [...new Set(astroNames.filter(name => name in lumenComponentBehavior &&
    lumenComponentBehavior[name as LumenComponentName].astro === 'ui-primitives'))]

  const findings = [
    ...collectCompatibilityFindings(root, sources),
    ...collectRuntimeFindings(root, sources, runtimeComponents),
    ...collectCssFindings(root, sources),
    ...collectFrameworkStyleFindings(root, sources, frameworks),
    ...collectAdapterMismatchFindings(joined, frameworks)
  ]

  return {
    catalogFingerprint: getCatalogFingerprint(sources),
    findings,
    frameworks,
    generatedAt: new Date().toISOString(),
    healthy: findings.every(item => item.severity !== 'error'),
    repository: root,
    runtimeComponents
  }
}

export const formatLumenDiagnostics = (report: LumenDiagnosticReport): string => {
  const heading = report.healthy ? 'Lumen integration is healthy.' : 'Lumen integration has blocking findings.'

  if (report.findings.length === 0) return heading

  return [
    heading,
    ...report.findings.map(
      item => `[${item.severity}] ${item.file} ${item.rule}: ${item.message} ${item.remediation}`
    )
  ].join('\n')
}

export const createLumenSetup = (framework: 'astro' | 'elements' | 'react', tailwind = false): string => {
  const setupByFramework = {
    astro: {
      styles: '@import "@santi020k/lumen-astro/styles.css";',
      tailwind:
        '@import "@santi020k/lumen-astro/layers.css";\n' +
        '@import "tailwindcss";\n' +
        '@import "@santi020k/lumen-astro/styles.css";'
    },
    elements: {
      styles: '@import "@santi020k/lumen-elements/styles.css";',
      tailwind:
        '@import "@santi020k/lumen-elements/layers.css";\n' +
        '@import "tailwindcss";\n' +
        '@import "@santi020k/lumen-elements/styles.css";'
    },
    react: {
      styles: '@import "@santi020k/lumen-react/styles.css";',
      tailwind:
        '@import "@santi020k/lumen-react/layers.css";\n' +
        '@import "tailwindcss";\n' +
        '@import "@santi020k/lumen-react/styles.css";'
    }
  } as const

  const styles = tailwind ? setupByFramework[framework].tailwind : setupByFramework[framework].styles

  if (framework === 'astro') {
    return `${styles}\n\n---\nimport { UIPrimitives } from '@santi020k/lumen-astro'\n---\n\n<UIPrimitives />`
  }

  if (framework === 'elements') {
    return `${styles}\n\n` +
      'import { defineLumenElements } from \'@santi020k/lumen-elements/define\'\n\n' +
      'defineLumenElements()'
  }

  return styles
}
