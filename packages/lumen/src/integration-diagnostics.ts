import { createHash } from 'node:crypto'
import { readdir, readFile, stat } from 'node:fs/promises'
import { extname, join, relative, resolve, sep } from 'node:path'

import {
  lumenComponentBehavior,
  type LumenComponentName,
  lumenComponentNames,
  lumenGlobalBehaviors,
  type LumenStylingContract,
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

const stylingContracts: Partial<Readonly<Record<LumenComponentName, LumenStylingContract>>> =
  lumenStylingContracts

const publicRootSlots: ReadonlySet<string> = new Set(
  Object.values(stylingContracts).flatMap(contract => [contract.rootSlot, ...contract.parts])
)

const componentClassName = (name: LumenComponentName): string => name
  .replace(/([a-z\d])([A-Z])/gu, '$1-$2')
  .toLowerCase()

const componentByClassName: ReadonlyMap<string, LumenComponentName> = new Map(
  lumenComponentNames.map((name): readonly [string, LumenComponentName] => [
    componentClassName(name),
    name
  ])
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
  dependencies: readonly string[]
  kind: 'application' | 'library' | 'workspace'
  packageName?: string
  root: string
  sources: SourceEntry[]
}

interface PackageManifest {
  dependencies?: Readonly<Record<string, string>>
  devDependencies?: Readonly<Record<string, string>>
  lumen?: {
    integrationBoundary?: 'application' | 'library' | 'workspace'
  }
  name?: string
  peerDependencies?: Readonly<Record<string, string>>
  private?: boolean
  scripts?: Readonly<Record<string, string>>
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

const readPackageManifest = async (root: string): Promise<PackageManifest | undefined> => {
  try {
    return JSON.parse(await readFile(join(root, 'package.json'), 'utf8')) as PackageManifest
  } catch {
    return undefined
  }
}

const isPublishablePackageBoundary = (
  repositoryPath: readonly string[],
  manifest: PackageManifest | undefined
): boolean => repositoryPath.includes('packages') && manifest?.private !== true

const hasApplicationSource = (
  boundaryRoot: string,
  sources: readonly SourceEntry[]
): boolean => sources.some(item => /(?:^|\/)(?:app|pages|routes|layouts?)(?:\/|$)/iu.test(
  relative(boundaryRoot, item.file)
))

const hasApplicationScript = (manifest: PackageManifest | undefined): boolean => {
  if (manifest?.private !== true) return false

  return Boolean(manifest.scripts?.dev ?? manifest.scripts?.start)
}

const isWorkspaceBoundary = (
  repositoryRoot: string,
  boundaryRoot: string,
  packageRootCount: number
): boolean => boundaryRoot === repositoryRoot && packageRootCount > 1

const getFallbackBoundaryKind = (
  manifest: PackageManifest | undefined
): ApplicationBoundary['kind'] => manifest?.private === false ? 'library' : 'application'

const classifyBoundary = (
  repositoryRoot: string,
  boundaryRoot: string,
  manifest: PackageManifest | undefined,
  sources: readonly SourceEntry[],
  packageRootCount: number
): ApplicationBoundary['kind'] => {
  const declaredKind = manifest?.lumen?.integrationBoundary

  if (declaredKind) return declaredKind

  const repositoryPath = relative(repositoryRoot, boundaryRoot).split(sep)

  if (repositoryPath.includes('apps')) return 'application'

  if (isPublishablePackageBoundary(repositoryPath, manifest)) return 'library'

  if (hasApplicationSource(boundaryRoot, sources)) return 'application'

  if (hasApplicationScript(manifest)) return 'application'

  if (isWorkspaceBoundary(repositoryRoot, boundaryRoot, packageRootCount)) return 'workspace'

  return getFallbackBoundaryKind(manifest)
}

const createBoundaries = async (
  root: string,
  packageRoots: string[],
  sources: SourceEntry[]
): Promise<ApplicationBoundary[]> => {
  const grouped = new Map<string, SourceEntry[]>()

  for (const source of sources) {
    const boundaryRoot = getBoundaryRoot(source.file, packageRoots, root)
    const entries = grouped.get(boundaryRoot) ?? []

    entries.push(source)

    grouped.set(boundaryRoot, entries)
  }

  return Promise.all([...grouped].map(async ([boundaryRoot, boundarySources]) => {
    const manifest = await readPackageManifest(boundaryRoot)

    const dependencies = [
      ...Object.keys(manifest?.dependencies ?? {}),
      ...Object.keys(manifest?.devDependencies ?? {}),
      ...Object.keys(manifest?.peerDependencies ?? {})
    ]

    return {
      dependencies,
      kind: classifyBoundary(root, boundaryRoot, manifest, boundarySources, packageRoots.length),
      ...(manifest?.name ? { packageName: manifest.name } : {}),
      root: boundaryRoot,
      sources: boundarySources
    }
  }))
}

const getApplicationSources = (
  application: ApplicationBoundary,
  boundaries: readonly ApplicationBoundary[]
): SourceEntry[] => {
  const byName = new Map(boundaries.flatMap(boundary => boundary.packageName ?
    [[boundary.packageName, boundary] as const] :
    []))

  const sources = [...application.sources]
  const visited = new Set<string>()

  const includeDependencies = (boundary: ApplicationBoundary): void => {
    for (const dependencyName of boundary.dependencies) {
      if (visited.has(dependencyName)) continue

      visited.add(dependencyName)

      const dependency = byName.get(dependencyName)

      if (dependency?.kind !== 'library') continue

      sources.push(...dependency.sources)

      includeDependencies(dependency)
    }
  }

  includeDependencies(application)

  return sources
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

  if (importedNames(item.source, '@santi020k/lumen-astro').includes('UIPrimitives')) {
    findings.push(finding(
      file,
      'removed-root-export',
      'UIPrimitives is no longer exported from the @santi020k/lumen-astro package root.',
      'Import the default runtime from @santi020k/lumen-astro/runtime, or run lumen migrate-v2.'
    ))
  }

  return findings
})

const hasImportedPrimitive = (sources: SourceEntry[], names: readonly string[]): boolean => [
  '@santi020k/lumen-astro',
  '@santi020k/lumen-react'
].some(packageName => sources.some(item => (
  importedNames(item.source, packageName).some(name => names.includes(name))
)))

interface DuplicatedBehaviorRule {
  detects: (source: string, sourceLower: string) => boolean
  imports: readonly string[]
  message: string
  remediation: string
  rule: string
}

const duplicatedBehaviorRules: readonly DuplicatedBehaviorRule[] = [
  {
    detects: (_source, sourceLower) => sourceLower.includes('<details') &&
      (sourceLower.includes('dropdown') || sourceLower.includes('menu')),
    imports: ['Collapsible', 'DropdownMenu'],
    message: 'A details-based dropdown or menu may duplicate Lumen disclosure or menu behavior.',
    remediation: 'Review DropdownMenu or Collapsible before maintaining a separate controller; keep the custom composition when its semantics differ.',
    rule: 'hand-built-dropdown'
  },
  {
    detects: (source, sourceLower) => source.includes('localStorage') &&
      sourceLower.includes('theme') &&
      (source.includes('classList') || sourceLower.includes('data-theme') || source.includes('dataset')),
    imports: ['ThemeToggle'],
    message: 'Custom theme persistence may duplicate ThemeToggle behavior.',
    remediation: 'Review ThemeToggle before maintaining separate storage and document-theme synchronization.',
    rule: 'hand-built-theme-persistence'
  },
  {
    detects: (source, sourceLower) => [
      'role="dialog"',
      'role=\'dialog\'',
      'aria-modal'
    ].some(value => sourceLower.includes(value)) &&
    source.includes('Tab') &&
    source.includes('focus') &&
    (source.includes('keydown') || source.includes('onKeyDown')),
    imports: ['Dialog'],
    message: 'Custom dialog keyboard and focus management may duplicate Lumen Dialog behavior.',
    remediation: 'Review Dialog before maintaining a separate focus trap; keep product-specific dialog content application-owned.',
    rule: 'hand-built-dialog-focus'
  },
  {
    detects: (source, sourceLower) => [
      'role="menu"',
      'role=\'menu\''
    ].some(value => sourceLower.includes(value)) &&
    ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp'].some(key => source.includes(key)),
    imports: ['DropdownMenu', 'Menubar', 'NavigationMenu'],
    message: 'A raw menu with arrow-key handling may duplicate Lumen menu behavior.',
    remediation: 'Review DropdownMenu, Menubar, or NavigationMenu before maintaining a separate keyboard controller.',
    rule: 'hand-built-menu-keyboard'
  },
  {
    detects: (source, sourceLower) => (
      source.includes('scrollY') || sourceLower.includes('scrolltop')
    ) && (
      sourceLower.includes('scrollheight') || sourceLower.includes('scrollprogress')
    ) && (
      source.includes('addEventListener(\'scroll\'') || source.includes('addEventListener("scroll"') ||
      sourceLower.includes('onscroll')
    ),
    imports: ['ScrollProgress'],
    message: 'Custom document scroll progress may duplicate Lumen ScrollProgress behavior.',
    remediation: 'Review ScrollProgress before maintaining viewport measurement and progress synchronization.',
    rule: 'hand-built-scroll-progress'
  },
  {
    detects: (_source, sourceLower) => (
      sourceLower.includes('href="#main') || sourceLower.includes('href=\'#main')
    ) && sourceLower.includes('skip'),
    imports: ['SkipLink'],
    message: 'A custom skip-to-content link may duplicate Lumen SkipLink behavior.',
    remediation: 'Review SkipLink for its stable slot and fixed-position accessibility contract.',
    rule: 'hand-built-skip-link'
  },
  {
    detects: (source, sourceLower) => (
      source.includes('@radix-ui/react-slot') || sourceLower.includes('<slot')
    ) && sourceLower.includes('aschild'),
    imports: ['Button'],
    message: 'A Radix Slot or asChild branch may duplicate Lumen Button composition.',
    remediation: 'Review Button asChild before retaining a separate polymorphic action wrapper.',
    rule: 'hand-built-polymorphic-button'
  },
  {
    detects: (source, sourceLower) => sourceLower.includes('<input') &&
      /\bsize\s*=\s*\{(?:size|props\.size)\}/u.test(source) &&
      !source.includes('visualSize'),
    imports: ['Input'],
    message: 'A native input size passthrough may confuse HTML character width with Lumen visual sizing.',
    remediation: 'Review Input visualSize and keep the native size attribute only when character width is intentional.',
    rule: 'native-input-size-fallback'
  },
  {
    detects: (source, sourceLower) => sourceLower.includes('card') &&
      sourceLower.includes('card-header') &&
      sourceLower.includes('card-content') &&
      !source.includes('CardHeader'),
    imports: ['Card'],
    message: 'A hand-built card section hierarchy may duplicate Lumen Card compound parts.',
    remediation: 'Review CardHeader, CardContent, and CardFooter while keeping domain-specific card content application-owned.',
    rule: 'hand-built-card-structure'
  }
]

const collectDuplicatedBehaviorFindings = (
  root: string,
  sources: SourceEntry[]
): LumenDiagnosticFinding[] => sources.flatMap(item => {
  const file = relative(root, item.file)
  const source = item.source
  const sourceLower = source.toLowerCase()

  return duplicatedBehaviorRules.flatMap(rule => (
    rule.detects(source, sourceLower) && !hasImportedPrimitive(sources, rule.imports) ?
      [finding(file, rule.rule, rule.message, rule.remediation, 'advisory')] :
      []
  ))
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

interface InternalSelectorContract {
  component?: LumenComponentName
  slot?: string
}

const getInternalSelectorContract = (selector: string): InternalSelectorContract => {
  const [componentClass = ''] = selector.split(/--|__/u, 1)
  const component = componentByClassName.get(componentClass)

  if (!component) return {}

  const contract = stylingContracts[component]

  if (!contract) return { component }

  if (selector.includes('__')) {
    const partName = selector.split('__', 2)[1]?.replaceAll('_', '-') ?? ''
    const slot = `${contract.rootSlot}-${partName}`

    return contract.parts.includes(slot) ? { component, slot } : { component }
  }

  return { component, slot: contract.rootSlot }
}

const consumerClassGuidance = (frameworks: readonly LumenFramework[]): string => {
  const detectedFrameworks = new Set(frameworks)

  const adapters = [
    detectedFrameworks.has('astro') && 'the public class prop in Astro',
    detectedFrameworks.has('react') && 'the public className prop in React',
    detectedFrameworks.has('elements') && 'a class attribute on the Elements host'
  ].filter((value): value is string => Boolean(value))

  if (adapters.length === 0) {
    return 'Pass a consumer-owned class through the adapter\'s public class API.'
  }

  return `Pass a consumer-owned class through ${adapters.join(', ')}.`
}

const internalSelectorFinding = (
  file: string,
  selector: string,
  frameworks: readonly LumenFramework[]
): LumenDiagnosticFinding => {
  const contract = getInternalSelectorContract(selector)

  const componentContext = contract.component ?
    ` It most likely targets the ${contract.component} component.` :
    ''

  const stableSlotGuidance = contract.slot ?
    ` For a library-owned hook, use [data-slot="${contract.slot}"].` :
    ''

  return finding(
    file,
    'internal-selector',
    `Selector .ui-${selector} is not a documented stable hook.${componentContext}`,
    `${consumerClassGuidance(frameworks)} Prefer semantic tokens and documented custom properties.${stableSlotGuidance}`,
    'advisory'
  )
}

const collectCssFindings = (
  root: string,
  boundaries: ApplicationBoundary[]
): LumenDiagnosticFinding[] => boundaries.flatMap(boundary => {
  const frameworks = getFrameworks(boundary.sources)

  return boundary.sources.filter(item => item.file.endsWith('.css')).flatMap(item => {
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

    for (const match of item.source.matchAll(/\.ui-([a-z0-9_-]+)/g)) {
      const selector = match[1] ?? ''

      if (!publicRootSlots.has(selector)) {
        findings.push(internalSelectorFinding(relative(root, item.file), selector, frameworks))
      }
    }

    return findings
  })
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

  const repeatedInFile = references.flatMap(item => countOccurrences(item.source, styleImport) > 1 ?
    [finding(
      relative(repositoryRoot, item.file), 'framework-style-duplicate', `The ${framework} stylesheet is loaded more than once in this file.`, 'Keep one stylesheet import in the application root.'
    )] :
    [])

  const orderedReferences = [...references].sort((left, right) => {
    const layoutDifference = Number(layoutFilePattern.test(right.file)) - Number(layoutFilePattern.test(left.file))

    return layoutDifference || left.file.localeCompare(right.file)
  })

  const repeatedAcrossBoundary = orderedReferences.slice(1).map(item => finding(
    relative(repositoryRoot, item.file),
    'framework-style-duplicate',
    `The ${framework} stylesheet is loaded from multiple files in this application boundary.`,
    'Keep one stylesheet import in the application root.'
  ))

  return [...repeatedInFile, ...repeatedAcrossBoundary]
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

const collectSharedLibraryStyleFindings = (
  repositoryRoot: string,
  boundary: ApplicationBoundary
): LumenDiagnosticFinding[] => Object.entries(styleImportByFramework)
  .flatMap(([framework, styleImport]) => boundary.sources
    .filter(item => item.source.includes(styleImport))
    .map(item => finding(
      relative(repositoryRoot, item.file),
      'shared-library-adapter-style',
      `A shared library loads the ${framework} adapter stylesheet, which can duplicate application-owned setup.`,
      'Remove the adapter stylesheet from the shared package and load it once in each consuming application root.',
      'advisory'
    )))

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

  const boundaries = await createBoundaries(root, discovered.packageRoots, sources)
  const applicationBoundaries = boundaries.filter(boundary => boundary.kind === 'application')

  const frameworks = [...new Set(applicationBoundaries.flatMap(boundary => getFrameworks(
    getApplicationSources(boundary, boundaries)
  )))]

  const runtimeComponents = new Set<string>()

  const findings = [
    ...collectCompatibilityFindings(root, sources),
    ...collectCssFindings(root, boundaries)
  ]

  for (const boundary of boundaries.filter(item => item.kind === 'library')) {
    findings.push(...collectSharedLibraryStyleFindings(root, boundary))
  }

  for (const boundary of applicationBoundaries) {
    const effectiveBoundary = {
      ...boundary,
      sources: getApplicationSources(boundary, boundaries)
    }

    const boundaryFrameworks = getFrameworks(effectiveBoundary.sources)
    const runtime = collectRuntimeFindings(root, effectiveBoundary)

    runtime.runtimeComponents.forEach(component => runtimeComponents.add(component))

    findings.push(
      ...collectDuplicatedBehaviorFindings(root, effectiveBoundary.sources),
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
    return `${styles}\n\n---\nimport UIPrimitives from '@santi020k/lumen-astro/runtime'\n---\n\n<UIPrimitives />`
  }

  if (framework === 'elements') {
    return `${styles}\n\n` +
      'import { defineLumenElements } from \'@santi020k/lumen-elements/define\'\n\n' +
      'defineLumenElements()'
  }

  return styles
}
