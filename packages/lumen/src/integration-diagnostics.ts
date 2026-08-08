import { createHash } from 'node:crypto'
import { readdir, readFile, stat } from 'node:fs/promises'
import { extname, join, relative, resolve, sep } from 'node:path'

import {
  lumenComponentBehavior,
  type LumenComponentName,
  lumenGlobalBehaviors,
  lumenStylingContracts
} from '@santi020k/lumen-core'

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

const ignoredDirectories = new Set([
  '.astro',
  '.git',
  '.next',
  '.open-next',
  '.output',
  '.turbo',
  '.vercel',
  '.vite',
  '.wrangler',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'out'
])

const publicRootSlots: ReadonlySet<string> = new Set(
  Object.values(lumenStylingContracts).flatMap(contract => [contract.rootSlot, ...contract.parts])
)

interface DiscoveredProject {
  packageRoots: string[]
  sourceFiles: string[]
}

const discoverProject = async (root: string): Promise<DiscoveredProject> => {
  const packageRoots: string[] = []
  const sourceFiles: string[] = []

  const visit = async (directory: string): Promise<void> => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (ignoredDirectories.has(entry.name)) continue

      const path = join(directory, entry.name)

      if (entry.isDirectory()) {
        await visit(path)
      } else if (entry.name === 'package.json') {
        packageRoots.push(directory)
      } else if (sourceExtensions.has(extname(entry.name))) {
        sourceFiles.push(path)
      }
    }
  }

  await visit(root)

  if (!packageRoots.includes(root)) packageRoots.push(root)

  return { packageRoots, sourceFiles }
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

interface ApplicationBoundary {
  root: string
  sources: SourceEntry[]
}

const packageNamePattern = String.raw`@santi020k\/lumen-(?:astro|elements|react)(?:\/[^'"]*)?`

const packageReferencePattern = new RegExp(
  String.raw`(?:^|\n)\s*(?:export|import)\s+(?:type\s+)?(?:[^'"\n]*?\s+from\s+)?['"]` +
  String.raw`(${packageNamePattern})['"]`,
  'g'
)

const dynamicPackageReferencePattern = new RegExp(
  String.raw`import\(\s*['"](${packageNamePattern})['"]\s*\)`,
  'g'
)

const cssPackageReferencePattern = new RegExp(
  String.raw`(?:^|\n)\s*@import\s+(?:url\(\s*)?['"](${packageNamePattern})['"]`,
  'g'
)

const layoutFilePattern = /(?:^|\/)(?:layouts?\/[^/]+|[^/]*layout[^/]*)\.astro$/iu

const getPackageReferences = (source: string): string[] => [
  ...source.matchAll(packageReferencePattern),
  ...source.matchAll(dynamicPackageReferencePattern),
  ...source.matchAll(cssPackageReferencePattern)
].flatMap(match => match[1] ? [match[1]] : [])

const packageFramework = (packageName: string): LumenFramework | undefined => {
  const framework = /^@santi020k\/lumen-(astro|elements|react)(?:\/|$)/u.exec(packageName)?.[1]

  return framework === 'astro' || framework === 'elements' || framework === 'react' ?
    framework :
    undefined
}

const getFrameworks = (sources: SourceEntry[]): LumenFramework[] => [
  ...new Set(sources.flatMap(item => getPackageReferences(item.source))
    .filter(packageName => !packageName.endsWith('/styles.css') &&
      !packageName.endsWith('/layers.css'))
    .flatMap(packageName => {
      const framework = packageFramework(packageName)

      return framework ? [framework] : []
    }))
]

const getBoundaryRoot = (file: string, packageRoots: string[], fallback: string): string => packageRoots
  .filter(packageRoot => file === packageRoot || file.startsWith(`${packageRoot}${sep}`))
  .sort((left, right) => right.length - left.length)[0] ?? fallback

const createBoundaries = (
  root: string,
  packageRoots: string[],
  sources: SourceEntry[]
): ApplicationBoundary[] => {
  const grouped = new Map<string, SourceEntry[]>()

  for (const source of sources) {
    const boundaryRoot = getBoundaryRoot(source.file, packageRoots, root)
    const entries = grouped.get(boundaryRoot) ?? []

    entries.push(source)

    grouped.set(boundaryRoot, entries)
  }

  return [...grouped].map(([boundaryRoot, boundarySources]) => ({
    root: boundaryRoot,
    sources: boundarySources
  }))
}

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

const hasOnlyRuntimeBypassedComponents = (
  source: string,
  componentName: string,
  bypassAttribute: string
): boolean => {
  const tagPattern = new RegExp(`<${componentName}(?=\\s|/|>)([^>]*)>`, 'g')
  const tags = [...source.matchAll(tagPattern)]

  const falsePattern = new RegExp(
    String.raw`\b${bypassAttribute}\s*=\s*(?:\{false\}|["']false["'])`,
    'u'
  )

  const truePattern = new RegExp(
    String.raw`\b${bypassAttribute}(?:\s|/|$)|` +
    String.raw`\b${bypassAttribute}\s*=\s*(?:\{true\}|["']true["'])`,
    'u'
  )

  return tags.length > 0 && tags.every(match => {
    const attributes = match[1] ?? ''

    if (falsePattern.test(attributes)) return false

    return truePattern.test(attributes)
  })
}

const componentNeedsAstroRuntime = (
  name: string,
  importingSources: SourceEntry[]
): boolean => {
  if (!(name in lumenComponentBehavior)) return false

  const behavior = lumenComponentBehavior[name as LumenComponentName]

  if (behavior.astro !== 'ui-primitives') return false

  if ('astroRuntimeBypass' in behavior && importingSources.length > 0 &&
    importingSources.every(item => hasOnlyRuntimeBypassedComponents(
      item.source,
      name,
      behavior.astroRuntimeBypass
    ))) return false

  return true
}

const getRuntimeImports = (sources: SourceEntry[]): { file: string, name: string }[] => {
  const imports = sources.flatMap(item => importedNames(item.source, '@santi020k/lumen-astro')
    .map(name => ({ file: item.file, name })))

  return imports.filter(item => componentNeedsAstroRuntime(
    item.name,
    sources.filter(source => importedNames(source.source, '@santi020k/lumen-astro').includes(item.name))
  ))
}

const getGlobalRuntimeBehaviors = (sources: SourceEntry[]): string[] => lumenGlobalBehaviors
  .filter(behavior => sources.some(item => {
    if (behavior.name === 'form-validation') return item.source.includes('data-ui-form')

    return behavior.authoredBy.split(',').some(eventName => item.source.includes(eventName.trim()))
  }))
  .map(behavior => behavior.name)

const collectRuntimeFindings = (
  repositoryRoot: string,
  boundary: ApplicationBoundary
): { findings: LumenDiagnosticFinding[], runtimeComponents: string[] } => {
  const runtimeImports = getRuntimeImports(boundary.sources)

  const runtimeComponents = [
    ...new Set([
      ...runtimeImports.map(item => item.name),
      ...getGlobalRuntimeBehaviors(boundary.sources)
    ])
  ]

  const mountSources = boundary.sources.filter(item => /<UIPrimitives(?:\s|\/|>)/u.test(item.source))
  const findings: LumenDiagnosticFinding[] = []

  if (runtimeComponents.length > 0 && mountSources.length === 0) {
    const firstRuntimeImport = runtimeImports[0]

    findings.push(finding(
      firstRuntimeImport ? relative(repositoryRoot, firstRuntimeImport.file) : relative(repositoryRoot, boundary.root),
      'astro-runtime-missing',
      `Interactive Astro usage requires UIPrimitives: ${runtimeComponents.join(', ')}.`,
      'Mount <UIPrimitives /> once in the application root, or use a documented controlled prop when application code owns the behavior.'
    ))
  }

  for (const mount of mountSources) {
    const mountCount = [...mount.source.matchAll(/<UIPrimitives(?:\s|\/|>)/g)].length

    if (mountCount > 1) {
      findings.push(finding(
        relative(repositoryRoot, mount.file), 'astro-runtime-duplicate', 'UIPrimitives is mounted more than once in this file.', 'Keep one mount in the application root layout.'
      ))
    }
  }

  const layoutMounts = mountSources.filter(item => layoutFilePattern.test(item.file))

  if (layoutMounts.length > 0) {
    for (const mount of mountSources.filter(item => !layoutMounts.includes(item))) {
      findings.push(finding(
        relative(repositoryRoot, mount.file), 'astro-runtime-duplicate', 'UIPrimitives is mounted in both a layout and a route within this application boundary.', 'Keep the layout mount and remove the route-level mount.'
      ))
    }
  }

  return { findings, runtimeComponents }
}

const styleImportByFramework = {
  astro: '@santi020k/lumen-astro/styles.css',
  elements: '@santi020k/lumen-elements/styles.css',
  react: '@santi020k/lumen-react/styles.css'
} as const

const countOccurrences = (source: string, value: string): number => source.split(value).length - 1

const collectCssFindings = (root: string, sources: SourceEntry[]): LumenDiagnosticFinding[] => sources
  .filter(item => item.file.endsWith('.css'))
  .flatMap(item => {
    const layerIndex = item.source.search(/^\s*@import\s+(?:url\(\s*)?["'][^"']*\/layers\.css["']/mu)
    const tailwindIndex = item.source.search(/^\s*@import\s+(?:url\(\s*)?["']tailwindcss["']/mu)
    const styleIndex = item.source.search(/^\s*@import\s+(?:url\(\s*)?["'][^"']*\/styles\.css["']/mu)
    const findings: LumenDiagnosticFinding[] = []

    if (
      tailwindIndex >= 0 &&
      styleIndex >= 0 &&
      (layerIndex < 0 || !(layerIndex < tailwindIndex && tailwindIndex < styleIndex))
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

const collectFrameworkStyleFindings = (
  repositoryRoot: string,
  boundary: ApplicationBoundary,
  frameworks: LumenFramework[]
): LumenDiagnosticFinding[] => frameworks.flatMap(framework => {
  const styleImport = styleImportByFramework[framework]
  const references = boundary.sources.filter(item => item.source.includes(styleImport))

  if (references.length === 0) {
    return [finding(
      relative(repositoryRoot, boundary.root) || '.',
      'framework-style-missing',
      `No ${styleImport} import was found in this application boundary.`,
      'Load the matching adapter stylesheet once in the application root.'
    )]
  }

  return references.flatMap(item => countOccurrences(item.source, styleImport) > 1 ?
    [finding(
      relative(repositoryRoot, item.file), 'framework-style-duplicate', `The ${framework} stylesheet is loaded more than once in this file.`, 'Keep one stylesheet import in the application root.'
    )] :
    [])
})

const collectAdapterMismatchFindings = (
  repositoryRoot: string,
  boundary: ApplicationBoundary,
  frameworks: LumenFramework[]
): LumenDiagnosticFinding[] => {
  const adapters = (Object.entries(styleImportByFramework) as [LumenFramework, string][])
    .flatMap(([framework, styleImport]) => boundary.sources.some(item => item.source.includes(styleImport)) ?
      [framework] :
      [])

  return [...new Set(adapters)]
    .filter(adapter => !frameworks.includes(adapter))
    .map(adapter => finding(
      relative(repositoryRoot, boundary.root) || '.',
      'adapter-style-mismatch',
      `The ${adapter} stylesheet is loaded without matching ${adapter} imports in this application boundary.`,
      'Load the stylesheet from the adapter used by this application boundary.'
    ))
}

const uniqueFindings = (findings: LumenDiagnosticFinding[]): LumenDiagnosticFinding[] => [
  ...new Map(findings.map(item => [
    `${item.file}\u0000${item.rule}\u0000${item.message}`,
    item
  ])).values()
]

export const inspectLumenIntegration = async (repository: string): Promise<LumenDiagnosticReport> => {
  const root = resolve(repository)

  if (!(await stat(root)).isDirectory()) throw new Error(`Not a directory: ${root}`)

  const discovered = await discoverProject(root)

  const sources = await Promise.all(discovered.sourceFiles.map(async file => ({
    file,
    source: await readFile(file, 'utf8')
  })))

  const boundaries = createBoundaries(root, discovered.packageRoots, sources)
  const frameworks = [...new Set(boundaries.flatMap(boundary => getFrameworks(boundary.sources)))]
  const runtimeComponents = new Set<string>()

  const findings = [
    ...collectCompatibilityFindings(root, sources),
    ...collectCssFindings(root, sources)
  ]

  for (const boundary of boundaries) {
    const boundaryFrameworks = getFrameworks(boundary.sources)
    const runtime = collectRuntimeFindings(root, boundary)

    runtime.runtimeComponents.forEach(component => runtimeComponents.add(component))

    findings.push(
      ...runtime.findings,
      ...collectFrameworkStyleFindings(root, boundary, boundaryFrameworks),
      ...collectAdapterMismatchFindings(root, boundary, boundaryFrameworks)
    )
  }

  const deduplicatedFindings = uniqueFindings(findings)

  return {
    catalogFingerprint: getCatalogFingerprint(sources),
    findings: deduplicatedFindings,
    frameworks,
    generatedAt: new Date().toISOString(),
    healthy: deduplicatedFindings.every(item => item.severity !== 'error'),
    repository: root,
    runtimeComponents: [...runtimeComponents]
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
