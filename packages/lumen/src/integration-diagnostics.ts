import { createHash } from 'node:crypto'
import { readdir, readFile, stat } from 'node:fs/promises'
import { dirname, extname, join, relative, resolve, sep } from 'node:path'

import {
  lumenComponentBehavior,
  type LumenComponentName,
  lumenComponentNames,
  lumenGlobalBehaviors,
  type LumenStylingContract,
  lumenStylingContracts
} from '@santi020k/lumen-core'
import { componentCssName } from '@santi020k/lumen-core/component-delivery'
import { createSourceFile, forEachChild, type ImportDeclaration, type ImportSpecifier, isForOfStatement, isImportDeclaration, isJsxAttribute, isNamedImports, isStringLiteral, type JsxAttribute, type Node, ScriptKind, ScriptTarget, type SourceFile, type Statement, SyntaxKind } from 'typescript'

import { readComponentImports } from './component-imports.js'
import { type DeliveryVersion, getDeliveryVersion } from './delivery-version.js'
import { hasComponentCss } from './style-coverage.js'
import { findMarkupTagEnd, getMarkupStart } from './v2-migration.js'

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

const sourceExtensions = new Set(['.astro', '.html', '.htm', '.css', '.js', '.jsx', '.mjs', '.ts', '.tsx'])

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

const finding = (
  file: string,
  rule: string,
  message: string,
  remediation: string,
  severity: LumenDiagnosticSeverity = 'error'
): LumenDiagnosticFinding => ({ file, message, remediation, rule, severity })

type LumenFramework = 'astro' | 'elements' | 'react'

interface SourceEntry {
  imports: ReturnType<typeof readComponentImports>
  file: string
  source: string
}

interface ApplicationBoundary {
  dependencies: readonly string[]
  deliveryVersions: Readonly<Record<LumenFramework, DeliveryVersion>>
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

const packageNamePattern = String.raw`@santi020k\/lumen(?:-(?:astro|elements|react|core))?(?:\/[^'"]*)?`

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

const commentEnding = (source: string, index: number): string | undefined => {
  if (source.startsWith('/*', index)) return '*/'

  if (source.startsWith('<!--', index)) return '-->'

  if (source.startsWith('//', index)) return '\n'

  return undefined
}

const withoutComments = (source: string): string => {
  let result = ''
  let quote = ''

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index] ?? ''

    if (quote) {
      result += char

      if (char === '\\') {
        index += 1

        result += source[index] ?? ''
      } else if (char === quote) quote = ''

      continue
    }

    if (['\'', '"', '`'].includes(char)) {
      quote = char

      result += char

      continue
    }

    const close = commentEnding(source, index)

    if (close) {
      const end = source.indexOf(close, index + 2)
      const finish = end < 0 ? source.length : end + close.length

      result += source.slice(index, finish).replaceAll(/[^\n]/gu, ' ')

      index = finish - 1
    } else result += char
  }

  return result
}

const getPackageReferences = (input: string): string[] => {
  const source = withoutComments(input)

  return [
    ...source.matchAll(packageReferencePattern),
    ...source.matchAll(dynamicPackageReferencePattern),
    ...source.matchAll(cssPackageReferencePattern)
  ].flatMap(match => match[1] ? [match[1]] : [])
}

const packageFramework = (packageName: string): LumenFramework | undefined => {
  const framework = /^@santi020k\/lumen-(astro|elements|react)(?:\/|$)/u.exec(packageName)?.[1]

  return framework === 'astro' || framework === 'elements' || framework === 'react' ?
    framework :
    undefined
}

const getFrameworks = (sources: SourceEntry[]): LumenFramework[] => [
  ...new Set(sources.flatMap(item => getPackageReferences(item.source))
    .filter(packageName => !packageName.endsWith('.css'))
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
      deliveryVersions: {
        astro: await getDeliveryVersion(boundaryRoot, '@santi020k/lumen-astro'),
        elements: await getDeliveryVersion(boundaryRoot, '@santi020k/lumen-elements'),
        react: await getDeliveryVersion(boundaryRoot, '@santi020k/lumen-react')
      },
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

  if (item.imports.astro.rootNames.includes('UIPrimitives')) {
    findings.push(finding(
      file,
      'removed-root-export',
      'UIPrimitives is no longer exported from the @santi020k/lumen-astro package root.',
      'Import the default runtime from @santi020k/lumen-astro/runtime, or run lumen migrate-v2.'
    ))
  }

  return findings
})

const hasImportedPrimitive = (sources: SourceEntry[], names: readonly string[]): boolean => sources.some(item => (
  names.some(name => item.imports.astro.rootNames.includes(name) || item.imports.react.rootNames.includes(name))
))

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
    ...item.imports.astro.rootNames,
    ...item.imports.react.rootNames
  ]))]
    .filter((name): name is LumenComponentName => Object.hasOwn(lumenComponentBehavior, name))
    .sort()

  const contracts = names.map(name => [name, lumenComponentBehavior[name]])

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
  const importingSources = new Map<string, SourceEntry[]>()

  for (const item of sources) {
    for (const name of item.imports.astro.components) {
      const entries = importingSources.get(name)

      if (entries) entries.push(item)
      else importingSources.set(name, [item])
    }
  }

  const required = new Set([...importingSources]
    .filter(([name, entries]) => componentNeedsAstroRuntime(name, entries))
    .map(([name]) => name))

  return sources.flatMap(item => item.imports.astro.components.filter(name => required.has(name))
    .map(name => ({ file: item.file, name })))
}

const getGlobalRuntimeBehaviors = (sources: SourceEntry[]): string[] => lumenGlobalBehaviors
  .filter(behavior => sources.some(item => {
    if (behavior.name === 'form-validation') return item.source.includes('data-ui-form')

    return behavior.authoredBy.split(',').some(eventName => item.source.includes(eventName.trim()))
  }))
  .map(behavior => behavior.name)

const isRuntimeImport = (statement: Statement): statement is ImportDeclaration => (
  isImportDeclaration(statement) && isStringLiteral(statement.moduleSpecifier) &&
  statement.moduleSpecifier.text === '@santi020k/lumen-astro/runtime'
)

const getDefaultRuntimeName = (binding: ImportSpecifier): string[] => !binding.isTypeOnly && (binding.propertyName?.text ?? binding.name.text) === 'default' ? [binding.name.text] : []

const getImportRuntimeNames = (statement: ImportDeclaration): string[] => {
  const clause = statement.importClause

  if (!clause || clause.phaseModifier === SyntaxKind.TypeKeyword) return []

  const names = clause.name ? [clause.name.text] : []
  const bindings = clause.namedBindings

  if (!bindings || !isNamedImports(bindings)) return names

  return [...names, ...bindings.elements.flatMap(getDefaultRuntimeName)]
}

const getRuntimeBindingNames = ({ file, source }: SourceEntry): Set<string> => {
  if (!source.includes('@santi020k/lumen-astro/runtime')) return new Set(['UIPrimitives'])

  try {
    const parsed = createSourceFile(file, source, ScriptTarget.Latest, false, ScriptKind.TS)
    const imports = parsed.statements.filter(isRuntimeImport)

    // Preserve canonical-name detection for legacy imports and wrapper components.
    return imports.length > 0 ? new Set(imports.flatMap(getImportRuntimeNames)) : new Set(['UIPrimitives'])
  } catch (error: unknown) {
    if (!(error instanceof RangeError)) throw error

    return new Set()
  }
}

const runtimeTagDelimiter = /[\s/>]/u

const getMarkupNameEnd = (source: string, start: number): number => {
  let end = start + 1

  while (end < source.length && source[end] !== '<' && !runtimeTagDelimiter.test(source[end] ?? '')) end += 1

  return end
}

const skipRuntimeQuotedText = (source: string, start: number): number => {
  let end = start + 1

  while (end < source.length) {
    if (source[end] === '\\') end += 2
    else if (source[end] === source[start]) return end + 1
    else end += 1
  }

  return source.length
}

const runtimeRegexPrefixes = new Set(['{', '(', '[', '=', ':', ',', ';', '!', '?', '&', '|', '+', '*', '%', '~', '^', '<', '>', '-'])
const runtimeRegexKeywords = new Set(['return', 'throw', 'case', 'yield', 'typeof', 'void', 'delete', 'instanceof', 'in', 'new', 'await', 'else', 'do'])

const getForOfRegexStarts = (source: string): Set<number> => {
  const starts = new Set<number>()

  try {
    const parsed = createSourceFile('runtime.tsx', source, ScriptTarget.Latest, true, ScriptKind.TSX)
    const pending: Node[] = [parsed]

    while (pending.length > 0) {
      const node = pending.pop()

      if (!node) continue

      if (isForOfStatement(node)) starts.add(node.expression.getStart(parsed))

      forEachChild(node, child => {
        pending.push(child)
      })
    }
  } catch (error: unknown) {
    if (!(error instanceof RangeError)) throw error
  }

  return starts
}

const runtimeCodePointStart = (source: string, index: number): number => {
  const current = source.charCodeAt(index)
  const previous = source.charCodeAt(index - 1)

  return current >= 0xdc00 && current <= 0xdfff && previous >= 0xd800 && previous <= 0xdbff ? index - 1 : index
}

const previousRuntimeCharacter = (source: string, start: number, pattern: RegExp): number => {
  let previous = start

  while (previous >= 0) {
    const pointStart = runtimeCodePointStart(source, previous)

    if (!pattern.test(source.slice(pointStart, previous + 1))) break

    previous = pointStart - 1
  }

  return previous
}

const isRuntimeRegexStart = (source: string, start: number, forOfStarts: ReadonlySet<number>): boolean => {
  if (forOfStarts.has(start)) return true

  const previous = previousRuntimeCharacter(source, start - 1, /\s/u)

  if (previous < 0 || runtimeRegexPrefixes.has(source[previous] ?? '')) return true

  const wordEnd = previous + 1
  const wordStart = previousRuntimeCharacter(source, previous, /[$\u200c\u200d\p{ID_Continue}]/u) + 1
  const keyword = source.slice(wordStart, wordEnd)

  if (!runtimeRegexKeywords.has(keyword)) return false

  return source[previousRuntimeCharacter(source, wordStart - 1, /\s/u)] !== '.'
}

const skipRuntimeRegex = (source: string, start: number): number => {
  let cursor = start + 1
  let inClass = false

  while (cursor < source.length) {
    const character = source[cursor]

    if (character === '\\') cursor += 2
    else {
      if (character === '[') inClass = true
      else if (character === ']') inClass = false
      else if (character === '/' && !inClass) return cursor + 1

      cursor += 1
    }
  }

  return source.length
}

const skipRuntimeExpressionTrivia = (
  source: string, start: number, depth: number, forOfStarts: ReadonlySet<number>
): number => {
  if (depth === 0) return start

  if (/['"`]/u.test(source[start] ?? '')) return skipRuntimeQuotedText(source, start)

  if (source.startsWith('/*', start)) {
    const end = source.indexOf('*/', start + 2)

    return end < 0 ? source.length : end + 2
  }

  if (source.startsWith('//', start)) {
    const end = source.indexOf('\n', start + 2)

    return end < 0 ? source.length : end + 1
  }

  if (source[start] === '/' && isRuntimeRegexStart(source, start, forOfStarts)) return skipRuntimeRegex(source, start)

  return start
}

const skipRuntimeRawText = (lowerSource: string, name: string, start: number): number => {
  if (name !== 'script' && name !== 'style') return start

  let closing = lowerSource.indexOf(`</${name}`, start)

  while (closing >= 0 && !runtimeTagDelimiter.test(lowerSource[closing + name.length + 2] ?? '')) {
    closing = lowerSource.indexOf(`</${name}`, closing + name.length + 2)
  }

  return closing < 0 ? lowerSource.length : closing
}

const getRuntimeExpressionDepth = (character: string | undefined, depth: number): number => {
  if (character === '{') return depth + 1

  return character === '}' ? Math.max(0, depth - 1) : depth
}

const skipRuntimeMarkupTrivia = (source: string, start: number): number => {
  if (source.startsWith('<!--', start)) {
    const end = source.indexOf('-->', start + 4)

    return end < 0 ? source.length : end + 3
  }

  return /[A-Za-z_$/]/u.test(source[start + 1] ?? '') ? start : start + 1
}

const countRuntimeMounts = (entry: SourceEntry): number => {
  const names = getRuntimeBindingNames(entry)
  let count = 0
  let depth = 0
  let start = getMarkupStart(entry.source, entry.file)
  const forOfStarts = new Set([...getForOfRegexStarts(entry.source.slice(start))].map(position => position + start))
  const lowerSource = entry.source.replace(/[A-Z]/gu, character => character.toLowerCase())

  while (start < entry.source.length) {
    const skipped = skipRuntimeExpressionTrivia(entry.source, start, depth, forOfStarts)

    if (skipped !== start) {
      start = skipped

      continue
    }

    const character = entry.source[start]

    depth = getRuntimeExpressionDepth(character, depth)

    if (character !== '<') {
      start += 1

      continue
    }

    const markupStart = skipRuntimeMarkupTrivia(entry.source, start)

    if (markupStart !== start) {
      start = markupStart

      continue
    }

    const end = getMarkupNameEnd(entry.source, start)
    const name = entry.source.slice(start + 1, end)
    const tagEnd = findMarkupTagEnd(entry.source, end, true)

    if (tagEnd < 0) {
      start += 1

      continue
    }

    if (names.has(name) && runtimeTagDelimiter.test(entry.source[end] ?? '')) count += 1

    start = skipRuntimeRawText(lowerSource, name, tagEnd + 1)
  }

  return count
}

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

  const mountSources = boundary.sources
    .map(item => ({ ...item, mountCount: countRuntimeMounts(item) }))
    .filter(item => item.mountCount > 0)

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
    if (mount.mountCount > 1) {
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

const criticalStyleImport = (framework: LumenFramework): string => `@santi020k/lumen-${framework}/styles/critical.css`

// Keep this coverage in sync with scripts/generate-critical-web-css.mjs.
const criticalStyleComponents = new Set<string>([
  'Alert',
  'Badge',
  'Button',
  'Calendar',
  'Card',
  'Checkbox',
  'Combobox',
  'DataTable',
  'DatePicker',
  'DatePickerField',
  'Dialog',
  'Field',
  'Input',
  'Label',
  'Progress',
  'Select',
  'Skeleton',
  'Spinner',
  'Table',
  'Tabs',
  'Textarea',
  'Toast',
  'Tooltip'
])

const localStylesheetImport = /(?:^|[;\n])\s*(?:import\s+|@import\s+(?:url\(\s*)?)['"](\.{1,2}\/[^'"\r\n]+\.css)['"]/gu

const connectedStyleSources = (sources: SourceEntry[]): SourceEntry[] => {
  const byPath = new Map(sources.map(item => [item.file, item]))
  const visited = new Set(sources.filter(item => !item.file.endsWith('.css')))
  const queue = [...visited]

  for (const item of queue) {
    for (const match of item.source.matchAll(localStylesheetImport)) {
      const stylesheet = byPath.get(resolve(dirname(item.file), match[1] ?? ''))

      if (!stylesheet || visited.has(stylesheet)) continue

      visited.add(stylesheet)

      queue.push(stylesheet)
    }
  }

  return queue
}

const missingCriticalComponents = (sources: SourceEntry[], framework: LumenFramework): string[] => {
  const names = framework === 'elements' ?
    sources.flatMap(item => [...item.source.matchAll(/<lumen-([a-z][a-z0-9-]*)[\s/>]/gu)]
      .map(match => componentByClassName.get(match[1] ?? ''))) :
    sources.flatMap(item => item.imports[framework].components)

  return [...new Set(names)].filter((name): name is string => Boolean(
    name && Object.hasOwn(lumenComponentBehavior, name) && !criticalStyleComponents.has(name)
  )).sort()
}

const collectCriticalStyleFindings = (
  repositoryRoot: string,
  boundary: ApplicationBoundary,
  effectiveSources: SourceEntry[],
  framework: LumenFramework
): LumenDiagnosticFinding[] | undefined => {
  const styleImport = criticalStyleImport(framework)

  const entry = connectedStyleSources(boundary.sources)
    .find(item => getPackageReferences(item.source).includes(styleImport))

  if (!entry) return undefined

  const missing = missingCriticalComponents(effectiveSources, framework)

  return missing.length ?
    [finding(
      relative(repositoryRoot, entry.file),
      'framework-critical-style-coverage',
      `The ${framework} critical stylesheet does not cover these detected components: ${missing.join(', ')}.`,
      `Replace ${styleImport} with ${styleImportByFramework[framework]} in the application stylesheet.`
    )] :
    []
}

const countOccurrences = (source: string, value: string): number => source.split(value).length - 1

interface InternalSelectorContract {
  component?: LumenComponentName
  slot?: string
}

const getInternalSelectorContract = (selector: string): InternalSelectorContract => {
  const part = selector.replaceAll('__', '-')
  const owner = lumenComponentNames.find(name => stylingContracts[name]?.parts.includes(part))

  if (owner) return { component: owner, slot: part }

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

    const styleIndexes = getPackageReferences(item.source)
      .filter(path => path.includes('/styles/') || path.endsWith('/styles.css'))
      .map(path => item.source.indexOf(path))

    const styleIndex = styleIndexes.reduce((earliest, index) => earliest < 0 ? index : Math.min(earliest, index), -1)
    const findings: LumenDiagnosticFinding[] = []

    if (
      tailwindIndex >= 0 &&
      styleIndex >= 0 &&
      (layerIndex < 0 || !(layerIndex < tailwindIndex && tailwindIndex < styleIndex))
    ) {
      findings.push(finding(
        relative(root, item.file), 'tailwind-layer-order', 'Tailwind and Lumen imports do not use the verified cascade order.', 'Import Lumen layers.css, then tailwindcss, then the matching Lumen foundation/component CSS or full styles.css.'
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

const namedAppearance = (name: string, value: string): string | undefined => {
  if (name === 'data-lumen-preset' && ['paper', 'field', 'studio', 'glass'].includes(value)) return value

  if (name === 'data-theme' && value.startsWith('santi020k-')) return 'santi020k'

  if (name === 'theme' && value === 'santi020k') return 'santi020k'

  return undefined
}

const attributeAppearance = (attribute: JsxAttribute, parsed: SourceFile): string | undefined => {
  const name = attribute.name.getText(parsed)

  if (name === 'glass') return attribute.initializer?.getText(parsed).replaceAll(/\s/gu, '') === '{false}' ? undefined : 'glass'

  if (!attribute.initializer || !isStringLiteral(attribute.initializer)) return undefined

  return namedAppearance(name, attribute.initializer.text)
}

const withoutHtmlComments = (source: string): string => {
  let result = ''
  let cursor = 0

  while (cursor < source.length) {
    const start = source.indexOf('<!--', cursor)

    if (start < 0) return result + source.slice(cursor)

    const end = source.indexOf('-->', start + 4)
    const finish = end < 0 ? source.length : end + 3

    result += source.slice(cursor, start) + source.slice(start, finish).replaceAll(/[^\n]/gu, ' ')

    cursor = finish
  }

  return result
}

const appearanceSignals = (entry: SourceEntry): string[] => {
  if (!['.astro', '.tsx', '.jsx', '.js', '.html', '.htm'].includes(extname(entry.file))) return []

  let parsed: SourceFile

  try {
    const markup = entry.source.slice(getMarkupStart(entry.source, entry.file))
    const source = ['.astro', '.html', '.htm'].includes(extname(entry.file)) ? withoutHtmlComments(markup) : markup

    parsed = createSourceFile('appearance.tsx', source, ScriptTarget.Latest, false, ScriptKind.TSX)
  } catch (error: unknown) {
    if (!(error instanceof RangeError)) throw error

    return []
  }

  const found = new Set<string>()
  const pending: Node[] = [parsed]

  while (pending.length > 0) {
    const node = pending.pop()

    if (!node) continue

    if (isJsxAttribute(node)) {
      const appearance = attributeAppearance(node, parsed)

      if (appearance) found.add(appearance)
    }

    node.forEachChild(child => {
      pending.push(child)
    })
  }

  return [...found]
}

const collectSelectiveStyleFindings = (
  root: string, boundary: ApplicationBoundary, framework: LumenFramework
): LumenDiagnosticFinding[] => {
  const adapter = `@santi020k/lumen-${framework}`
  const components = [...new Set(boundary.sources.flatMap(item => item.imports[framework].components))]
  const references = new Set(boundary.sources.flatMap(item => getPackageReferences(item.source)))

  const foundation = [adapter, '@santi020k/lumen', '@santi020k/lumen-core']
    .some(packageName => references.has(`${packageName}/styles/foundation.css`))

  const appearances = [...new Set(boundary.sources.flatMap(appearanceSignals))]

  const appearancePaths = appearances.map(name => `styles/${name === 'glass' ? 'effects' : 'themes'}/${name}.css`)
    .filter(path => ![adapter, '@santi020k/lumen', '@santi020k/lumen-core'].some(pkg => references.has(`${pkg}/${path}`)))
    .map(path => `${adapter}/${path}`)

  const automatic = framework === 'astro' && components.length > 0

  const required = [
    ...appearancePaths,
    ...(!automatic && !foundation ? [`${adapter}/styles/foundation.css`] : []),
    ...components.filter(name => !automatic && !hasComponentCss(name, references, framework))
      .map(name => `${adapter}/styles/components/${componentCssName(name)}.css`)
  ]

  return required.map(path => finding(
    relative(root, boundary.root) || '.',
    'framework-style-missing',
    `The v5 selective setup is missing ${path}.`,
    framework === 'astro' ?
      'Framework components import CSS automatically. For manual markup, import the foundation and matching component CSS.' :
      'Import the foundation and required component CSS, use an installed lumen add wrapper, or choose full styles.css.'
  ))
}

const collectFrameworkStyleFindings = (
  repositoryRoot: string,
  boundary: ApplicationBoundary,
  frameworks: LumenFramework[],
  selectiveSources: SourceEntry[] = boundary.sources
): LumenDiagnosticFinding[] => frameworks.flatMap(framework => {
  const styleImport = styleImportByFramework[framework]
  const references = boundary.sources.filter(item => getPackageReferences(item.source).includes(styleImport))

  if (references.length === 0 && boundary.deliveryVersions[framework] === 'v5') {
    return collectSelectiveStyleFindings(repositoryRoot, { ...boundary, sources: selectiveSources }, framework)
  }

  if (references.length === 0) {
    const critical = collectCriticalStyleFindings(repositoryRoot, boundary, selectiveSources, framework)

    if (critical) return critical

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
    .flatMap(([framework, styleImport]) => boundary.sources.some(item => getPackageReferences(item.source).some(path => path.startsWith(styleImport.slice(0, -'styles.css'.length)) && path.endsWith('.css'))) ?
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

  const sources = await Promise.all(discovered.sourceFiles.map(async file => {
    const source = await readFile(file, 'utf8')

    return { file, imports: readComponentImports(source, file), source }
  }))

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
      ...collectFrameworkStyleFindings(root, boundary, boundaryFrameworks, effectiveBoundary.sources),
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
  const adapter = `@santi020k/lumen-${framework}`
  const foundation = `@import "${adapter}/styles/foundation.css";`

  const styles = tailwind ?
    [
      '@import "' + adapter + '/layers.css";',
      '@import "tailwindcss";',
      foundation,
      '@import "' + adapter + '/tailwind.css";'
    ].join('\n') :
    foundation

  if (framework === 'astro') {
    const tailwindGuidance = tailwind ? `/* Global stylesheet, before importing the layout: */\n${styles}\n\n` : ''

    return `${tailwindGuidance}---
// Lumen v5 components import their foundation and component CSS automatically.
// Static components need no runtime. Mount once for interactive components.
import UIPrimitives from '@santi020k/lumen-astro/runtime'
---

<UIPrimitives />
<slot />

<!-- For manually authored Lumen markup outside components, explicitly import foundation and its component CSS. -->`
  }

  return `${styles}

/* Lumen v5: component wrappers installed by lumen add include their component CSS.
   Elements wrappers register only their selected constructor.
   If importing primitives directly, also import each required styles/components/<name>.css.
   Full styles.css remains an explicit convenience alternative. */`
}
