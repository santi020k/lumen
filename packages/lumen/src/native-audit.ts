import { execFile } from 'node:child_process'
import { access, readdir, readFile, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

export type NativeAuditPlatform = 'compose' | 'swift'
export type NativeAuditSeverity = 'failure' | 'suggestion' | 'warning'

type NativePreflightStatus = 'failure' | 'pass' | 'skipped' | 'warning'

export interface NativeAuditFinding {
  file: string
  message: string
  remediation: string
  rule: string
  severity: NativeAuditSeverity
}

export interface NativeResolvedVersion {
  platform: NativeAuditPlatform
  reference: string
  revision?: string
  version?: string
}

export interface NativeAuditReport {
  adoptionInventory: NativeAdoptionInventory
  androidPreflight: AndroidPreflightReport | null
  findings: NativeAuditFinding[]
  generatedAt: string
  healthy: boolean
  platforms: NativeAuditPlatform[]
  releaseVersion: string
  repository: string
  resolved: NativeResolvedVersion[]
}

interface NativeAdoptionSuggestion {
  family: string
  file: string
  line: number
  lumenComponent: string
  nativePrimitive: string
  platform: NativeAuditPlatform
}

interface NativeAdoptionInventory {
  families: { count: number, family: string }[]
  suggestions: NativeAdoptionSuggestion[]
}

interface NativePreflightCheck {
  detail: string
  id: string
  remediation?: string
  status: NativePreflightStatus
}

interface AndroidPreflightReport {
  checks: NativePreflightCheck[]
  healthy: boolean
  sdkRoot?: string
  toolchain: ComposeToolchain
}

interface ReleaseManifest {
  release: {
    compose: { artifacts: string[], version: string }
    swift: { package: string, revision: string | null, tag: string }
    version: string
  }
  schemaVersion: number
}

interface ComposeToolchain {
  androidGradlePlugin: string
  compileSdk: number
  gradle: string
  instrumentationApi: number
  jdk: number
  kotlin: string
  minSdk: number
}

interface NativeRegistry {
  adapters: {
    compose: { additionalSourceDirectories?: string[], sourceDirectory: string, toolchain: ComposeToolchain }
    swiftUI: { additionalSourceDirectories?: string[], sourceDirectory: string }
  }
  components: {
    id: string
    symbols: Partial<Record<'compose' | 'swiftUI', string>>
  }[]
}

interface SourceEntry {
  file: string
  source: string
}

const ignoredDirectories = new Set([
  '.build',
  '.git',
  '.gradle',
  '.idea',
  ['.', 'swift', 'pm'].join(''),
  'build',
  'DerivedData',
  'node_modules'
])

const nativeExtensions = new Set(['.gradle', '.json', '.kt', '.kts', '.properties', '.swift', '.toml'])
const execFileAsync = promisify(execFile)

const discoverNativeSources = async (root: string): Promise<SourceEntry[]> => {
  const files: string[] = []

  const visit = async (directory: string): Promise<void> => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (ignoredDirectories.has(entry.name)) continue

      const path = join(directory, entry.name)

      if (entry.isDirectory()) {
        await visit(path)
      } else if (nativeExtensions.has(extname(entry.name)) || entry.name === 'Package.resolved') {
        files.push(path)
      }
    }
  }

  await visit(root)

  return Promise.all(files.map(async file => ({ file, source: await readFile(file, 'utf8') })))
}

interface AdoptionRule {
  componentId: string
  family: string
  platform: NativeAuditPlatform
  primitive: string
}

const adoptionRules: AdoptionRule[] = [
  { componentId: 'text', family: 'content', platform: 'swift', primitive: 'Text' },
  { componentId: 'button', family: 'actions', platform: 'swift', primitive: 'Button' },
  { componentId: 'text-field', family: 'forms', platform: 'swift', primitive: 'TextField' },
  { componentId: 'toggle', family: 'forms', platform: 'swift', primitive: 'Toggle' },
  { componentId: 'date-field', family: 'forms', platform: 'swift', primitive: 'DatePicker' },
  { componentId: 'spinner', family: 'feedback', platform: 'swift', primitive: 'ProgressView' },
  { componentId: 'text', family: 'content', platform: 'compose', primitive: 'Text' },
  { componentId: 'button', family: 'actions', platform: 'compose', primitive: 'Button' },
  { componentId: 'text-field', family: 'forms', platform: 'compose', primitive: 'TextField' },
  { componentId: 'text-field', family: 'forms', platform: 'compose', primitive: 'OutlinedTextField' },
  { componentId: 'toggle', family: 'forms', platform: 'compose', primitive: 'Switch' },
  { componentId: 'checkbox', family: 'forms', platform: 'compose', primitive: 'Checkbox' },
  { componentId: 'radio-group', family: 'forms', platform: 'compose', primitive: 'RadioButton' },
  { componentId: 'date-field', family: 'forms', platform: 'compose', primitive: 'DatePicker' },
  { componentId: 'card', family: 'content', platform: 'compose', primitive: 'Card' },
  { componentId: 'divider', family: 'content', platform: 'compose', primitive: 'HorizontalDivider' },
  { componentId: 'spinner', family: 'feedback', platform: 'compose', primitive: 'CircularProgressIndicator' }
]

const resolveSourcePlatform = (file: string): NativeAuditPlatform | null => {
  if (file.endsWith('.swift')) return 'swift'

  if (file.endsWith('.kt') || file.endsWith('.kts')) return 'compose'

  return null
}

const inspectAdoptionInventory = (
  root: string,
  sources: SourceEntry[],
  registry: NativeRegistry
): NativeAdoptionInventory => {
  const symbols = new Map(registry.components.map(component => [component.id, component.symbols]))
  const suggestions: NativeAdoptionSuggestion[] = []

  const implementationDirectories = [
    registry.adapters.compose.sourceDirectory,
    ...(registry.adapters.compose.additionalSourceDirectories ?? []),
    registry.adapters.swiftUI.sourceDirectory,
    ...(registry.adapters.swiftUI.additionalSourceDirectories ?? [])
  ]

  for (const entry of sources) {
    const repositoryPath = relative(root, entry.file)
    const platform = resolveSourcePlatform(entry.file)

    if (
      !platform ||
      /(?:^|\/)(?:test|tests|androidTest)(?:\/|$)/iu.test(entry.file) ||
      implementationDirectories.some(directory => repositoryPath === directory || repositoryPath.startsWith(`${directory}/`))
    ) continue

    const lines = entry.source.split(/\r?\n/u)

    lines.forEach((line, index) => {
      const code = line.split('//', 1)[0] ?? ''

      for (const rule of adoptionRules) {
        if (rule.platform !== platform) continue

        const lumenComponent = symbols.get(rule.componentId)?.[platform === 'swift' ? 'swiftUI' : 'compose']

        if (!lumenComponent || !new RegExp(`\\b${rule.primitive}\\s*\\(`, 'u').test(code)) continue

        suggestions.push({
          family: rule.family,
          file: repositoryPath,
          line: index + 1,
          lumenComponent,
          nativePrimitive: rule.primitive,
          platform
        })
      }
    })
  }

  const familyCounts = suggestions.reduce((counts, suggestion) => {
    counts.set(suggestion.family, (counts.get(suggestion.family) ?? 0) + 1)

    return counts
  }, new Map<string, number>())

  const families = [...familyCounts]
    .map(([family, count]) => ({ count, family }))
    .sort((first, second) => first.family.localeCompare(second.family))

  return { families, suggestions }
}

const pathExists = async (path: string): Promise<boolean> => access(path).then(() => true).catch(() => false)

const parseJavaMajor = (value: string): number | undefined => {
  const match = /(?:JAVA_VERSION=|version\s+)["']?(?:1\.)?([0-9]+)/u.exec(value)

  return match?.[1] ? Number.parseInt(match[1], 10) : undefined
}

const readJavaMajor = async (environment: NodeJS.ProcessEnv): Promise<{ home?: string, major?: number }> => {
  const javaHome = environment.JAVA_HOME

  if (javaHome) {
    const release = await readFile(join(javaHome, 'release'), 'utf8').catch(() => '')
    const major = parseJavaMajor(release)

    if (major) return { home: javaHome, major }
  }

  try {
    const result = await execFileAsync('java', ['-version'], { env: environment })
    const major = parseJavaMajor(`${result.stdout}\n${result.stderr}`)

    return { ...(javaHome ? { home: javaHome } : {}), ...(major ? { major } : {}) }
  } catch {
    return javaHome ? { home: javaHome } : {}
  }
}

const resolveAndroidSdkRoot = async (root: string, environment: NodeJS.ProcessEnv): Promise<string | undefined> => {
  const localProperties = await readFile(join(root, 'local.properties'), 'utf8').catch(() => '')
  const localSdk = /^sdk\.dir=(.+)$/mu.exec(localProperties)?.[1]?.replaceAll('\\\\', '\\')

  const candidates = [
    environment.ANDROID_SDK_ROOT,
    environment.ANDROID_HOME,
    localSdk,
    join(homedir(), 'Library', 'Android', 'sdk'),
    join(homedir(), 'Android', 'Sdk')
  ].filter((value): value is string => Boolean(value))

  for (const candidate of candidates) {
    if (await pathExists(candidate)) return resolve(candidate)
  }

  return undefined
}

const findDeclaredNdkVersion = (sources: SourceEntry[]): string | undefined => {
  for (const source of sources) {
    const version = /(?<![A-Za-z\d_])ndkVersion\s*=\s*["']([^"']+)["']/u.exec(source.source)?.[1]

    if (version) return version
  }

  return undefined
}

const createJavaCheck = (
  java: { home?: string, major?: number },
  toolchain: ComposeToolchain
): NativePreflightCheck => {
  if (!java.major) {
    return {
      detail: 'No readable Java runtime was found through JAVA_HOME or PATH.',
      id: 'jdk',
      remediation: `Install JDK ${toolchain.jdk} and set JAVA_HOME for Gradle.`,
      status: 'failure'
    }
  }

  if (java.major < toolchain.jdk) {
    return {
      detail: `JDK ${java.major} is active; Lumen documents JDK ${toolchain.jdk}.`,
      id: 'jdk',
      remediation: `Run Gradle with JDK ${toolchain.jdk} or newer.`,
      status: 'failure'
    }
  }

  return {
    detail: `JDK ${java.major} is available${java.home ? ` at ${java.home}` : ''}.`,
    id: 'jdk',
    status: 'pass'
  }
}

const inspectSdkChecks = async (
  sdkRoot: string | undefined,
  toolchain: ComposeToolchain
): Promise<NativePreflightCheck[]> => {
  if (!sdkRoot) {
    return [{
      detail: 'No Android SDK directory was found through local.properties, ANDROID_SDK_ROOT, ANDROID_HOME, or platform defaults.',
      id: 'android-sdk',
      remediation: 'Install the Android SDK and configure sdk.dir or ANDROID_SDK_ROOT.',
      status: 'failure'
    }]
  }

  const installedPlatforms = await readdir(join(sdkRoot, 'platforms')).catch(() => [])

  const hasPlatform = (api: number): boolean => installedPlatforms.some(name => (
    name === `android-${api}` || name.startsWith(`android-${api}.`)
  ))

  const requiredPackages: { available: boolean, id: string, path: string, status: NativePreflightStatus }[] = [
    {
      available: hasPlatform(toolchain.compileSdk),
      id: 'compile-sdk',
      path: join(sdkRoot, 'platforms', `android-${toolchain.compileSdk}`),
      status: 'failure'
    },
    {
      available: hasPlatform(toolchain.instrumentationApi),
      id: 'instrumentation-sdk',
      path: join(sdkRoot, 'platforms', `android-${toolchain.instrumentationApi}`),
      status: 'warning'
    },
    {
      available: await pathExists(join(sdkRoot, 'platform-tools')),
      id: 'platform-tools',
      path: join(sdkRoot, 'platform-tools'),
      status: 'warning'
    },
    {
      available: await pathExists(join(sdkRoot, 'build-tools')),
      id: 'build-tools',
      path: join(sdkRoot, 'build-tools'),
      status: 'warning'
    }
  ]

  const packageChecks = requiredPackages.map<NativePreflightCheck>(required => required.available ?
    { detail: `${required.id} is installed.`, id: required.id, status: 'pass' } :
    {
      detail: `${required.id} is missing from the Android SDK.`,
      id: required.id,
      remediation: `Install the repository-compatible Android package at ${required.path}.`,
      status: required.status
    })

  return [
    { detail: `Android SDK is available at ${sdkRoot}.`, id: 'android-sdk', status: 'pass' },
    ...packageChecks
  ]
}

const inspectNdkCheck = async (
  sdkRoot: string | undefined,
  sources: SourceEntry[]
): Promise<NativePreflightCheck> => {
  const ndkVersion = findDeclaredNdkVersion(sources)

  const needsNdk = Boolean(ndkVersion) || sources.some(source => (
    /\b(?:externalNativeBuild|cmake)\b/u.test(source.source)
  ))

  if (!needsNdk) {
    return { detail: 'No NDK-backed build configuration was detected.', id: 'ndk', status: 'skipped' }
  }

  if (!sdkRoot) {
    return { detail: 'The NDK cannot be checked until the Android SDK is configured.', id: 'ndk', status: 'failure' }
  }

  const ndkPath = ndkVersion ? join(sdkRoot, 'ndk', ndkVersion) : join(sdkRoot, 'ndk')

  if (await pathExists(ndkPath)) {
    return {
      detail: `The required Android NDK${ndkVersion ? ` ${ndkVersion}` : ''} is installed.`,
      id: 'ndk',
      status: 'pass'
    }
  }

  return {
    detail: `The project requires an Android NDK${ndkVersion ? ` (${ndkVersion})` : ''}, but it is not installed.`,
    id: 'ndk',
    remediation: `Install the required side-by-side NDK at ${ndkPath}.`,
    status: 'failure'
  }
}

const inspectAndroidPreflight = async (
  root: string,
  sources: SourceEntry[],
  toolchain: ComposeToolchain,
  environment: NodeJS.ProcessEnv = process.env
): Promise<AndroidPreflightReport> => {
  const sdkRoot = await resolveAndroidSdkRoot(root, environment)
  const java = await readJavaMajor(environment)

  const checks = [
    createJavaCheck(java, toolchain),
    ...await inspectSdkChecks(sdkRoot, toolchain),
    await inspectNdkCheck(sdkRoot, sources)
  ]

  return {
    checks,
    healthy: !checks.some(check => check.status === 'failure'),
    ...(sdkRoot ? { sdkRoot } : {}),
    toolchain
  }
}

const parseSwiftResolution = (entry: SourceEntry): NativeResolvedVersion[] => {
  if (!entry.file.endsWith('Package.resolved')) return []

  try {
    const value = JSON.parse(entry.source) as {
      object?: { pins?: unknown[] }
      pins?: unknown[]
    }

    const pins = value.pins ?? value.object?.pins ?? []

    return pins.flatMap(pinValue => {
      const pin = pinValue as {
        identity?: string
        location?: string
        package?: string
        repositoryURL?: string
        state?: { revision?: string, version?: string }
      }

      const reference = pin.location ?? pin.repositoryURL ?? pin.identity ?? pin.package ?? ''

      if (!reference.toLowerCase().includes('lumen')) return []

      return [{
        platform: 'swift' as const,
        reference,
        ...(pin.state?.revision ? { revision: pin.state.revision } : {}),
        ...(pin.state?.version ? { version: pin.state.version } : {})
      }]
    })
  } catch {
    return []
  }
}

const composeCoordinatePattern = /com\.santi020k:lumen-compose(?:-wear)?[:"]([0-9A-Za-z][0-9A-Za-z._-]*)/g

const parseComposeCatalog = (entry: SourceEntry): NativeResolvedVersion[] => {
  if (!entry.file.endsWith('.toml')) return []

  const versions = new Map<string, string>()
  const lines = entry.source.split(/\r?\n/u)

  for (const line of lines) {
    const match = /^\s*([A-Za-z0-9_.-]+)\s*=\s*"([^"]+)"\s*$/u.exec(line)

    if (match?.[1] && match[2]) versions.set(match[1], match[2])
  }

  return lines.flatMap(line => {
    const module = /module\s*=\s*"(com\.santi020k:lumen-compose(?:-wear)?)"/u.exec(line)?.[1]

    if (!module) return []

    const directVersion = /version\s*=\s*"([^"]+)"/u.exec(line)?.[1]
    const versionReference = /version\.ref\s*=\s*"([^"]+)"/u.exec(line)?.[1]
    const version = directVersion ?? (versionReference ? versions.get(versionReference) : undefined)

    return version ? [{ platform: 'compose' as const, reference: module, version }] : []
  })
}

const parseComposeResolution = (entry: SourceEntry): NativeResolvedVersion[] => {
  const resolutions: NativeResolvedVersion[] = parseComposeCatalog(entry)

  for (const match of entry.source.matchAll(composeCoordinatePattern)) {
    const version = match[1]

    if (version) resolutions.push({ platform: 'compose', reference: match[0], version })
  }

  return resolutions
}

const addThemeFindings = (
  root: string,
  sources: SourceEntry[],
  platform: NativeAuditPlatform,
  usesLumen: boolean
): NativeAuditFinding[] => {
  if (!usesLumen) return []

  const pattern = platform === 'swift' ? /\.lumenTheme\s*\(/g : /\bLumenTheme\s*\(/g

  const providers = sources.flatMap(entry => {
    const count = [...entry.source.matchAll(pattern)].length

    return count ? [{ count, file: entry.file }] : []
  })

  if (providers.length === 0) {
    return [{
      file: '.',
      message: `No ${platform === 'swift' ? '.lumenTheme(...) modifier' : 'LumenTheme(...) provider'} was found.`,
      remediation: platform === 'swift' ?
        'Place the product theme at each application scene and preview that renders Lumen components.' :
        'Place LumenTheme at the application root and pass the existing Material color scheme, typography, and shapes.',
      rule: `${platform}-theme-missing`,
      severity: 'warning'
    }]
  }

  return providers.flatMap(provider => provider.count > 1 ?
    [{
      file: relative(root, provider.file),
      message: `This file mounts ${provider.count} ${platform} theme providers.`,
      remediation: 'Confirm the providers belong to independent scenes or previews; remove accidental nesting around the same surface.',
      rule: `${platform}-theme-repeated`,
      severity: 'suggestion' as const
    }] :
    [])
}

const unique = <Value>(values: Value[], key: (value: Value) => string): Value[] => [
  ...new Map(values.map(value => [key(value), value])).values()
]

const usesSwiftPackage = (sources: SourceEntry[], swiftSources: SourceEntry[]): boolean => (
  sources.some(entry => entry.file.endsWith('Package.swift') && entry.source.includes('LumenUI')) ||
  swiftSources.some(entry => entry.source.includes('import LumenUI'))
)

const usesComposePackage = (sources: SourceEntry[]): boolean => sources.some(entry => (
  entry.source.includes('com.santi020k.lumen') || entry.source.includes('com.santi020k:lumen-compose')
))

const collectResolutionFindings = (
  manifest: ReleaseManifest,
  resolved: NativeResolvedVersion[],
  usesSwift: boolean,
  usesCompose: boolean
): NativeAuditFinding[] => {
  const findings: NativeAuditFinding[] = []

  if (usesSwift && !resolved.some(item => item.platform === 'swift')) {
    findings.push({
      file: 'Package.resolved',
      message: 'LumenUI is used but no resolved Swift package pin was found.',
      remediation: 'Resolve package dependencies and commit Package.resolved with the intended release tag and revision.',
      rule: 'swift-resolution-missing',
      severity: 'warning'
    })
  }

  if (usesCompose && !resolved.some(item => item.platform === 'compose')) {
    findings.push({
      file: '.',
      message: 'Compose source uses Lumen but no Maven coordinate with an explicit version was found.',
      remediation: `Declare com.santi020k:lumen-compose:${manifest.release.compose.version} directly or through a version catalog.`,
      rule: 'compose-resolution-missing',
      severity: 'warning'
    })
  }

  for (const item of resolved) {
    const expected = item.platform === 'compose' ?
      manifest.release.compose.version :
      manifest.release.swift.tag.replace(/^v/u, '')

    if (item.version && item.version !== expected) {
      findings.push({
        file: '.',
        message: `${item.reference} resolves ${item.version}; the release manifest expects ${expected}.`,
        remediation: 'Align the native adapter with the cross-platform release manifest, then refresh the resolver lock file.',
        rule: `${item.platform}-release-mismatch`,
        severity: 'warning'
      })
    }
  }

  return findings
}

const detectedPlatforms = (usesSwift: boolean, usesCompose: boolean): NativeAuditPlatform[] => {
  const platforms: NativeAuditPlatform[] = []

  if (usesSwift) platforms.push('swift')

  if (usesCompose) platforms.push('compose')

  return platforms
}

const nativeAuditIsHealthy = (
  findings: NativeAuditFinding[],
  androidPreflight: AndroidPreflightReport | null
): boolean => {
  if (findings.some(finding => finding.severity === 'failure')) return false

  return androidPreflight?.healthy ?? true
}

export const inspectNativeAdoption = async (
  repository: string,
  manifestPath = fileURLToPath(new URL('../release-manifest.json', import.meta.url)),
  registryPath = fileURLToPath(new URL('../native-components.json', import.meta.url)),
  environment: NodeJS.ProcessEnv = process.env
): Promise<NativeAuditReport> => {
  const root = resolve(repository)

  if (!(await stat(root)).isDirectory()) throw new Error(`Not a directory: ${root}`)

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as ReleaseManifest
  const registry = JSON.parse(await readFile(registryPath, 'utf8')) as NativeRegistry
  const sources = await discoverNativeSources(root)
  const swiftSources = sources.filter(entry => entry.file.endsWith('.swift'))
  const composeSources = sources.filter(entry => ['.gradle', '.kt', '.kts', '.toml'].includes(extname(entry.file)))
  const usesSwift = usesSwiftPackage(sources, swiftSources)
  const usesCompose = usesComposePackage(composeSources)
  const adoptionInventory = inspectAdoptionInventory(root, sources, registry)
  let androidPreflight: AndroidPreflightReport | null = null

  if (usesCompose) {
    androidPreflight = await inspectAndroidPreflight(
      root,
      sources,
      registry.adapters.compose.toolchain,
      environment
    )
  }

  const resolved = unique([
    ...sources.flatMap(parseSwiftResolution),
    ...composeSources.flatMap(parseComposeResolution)
  ], value => `${value.platform}:${value.reference}:${value.version ?? ''}:${value.revision ?? ''}`)

  const findings = [
    ...addThemeFindings(root, swiftSources, 'swift', usesSwift),
    ...addThemeFindings(root, composeSources, 'compose', usesCompose),
    ...collectResolutionFindings(manifest, resolved, usesSwift, usesCompose)
  ]

  return {
    adoptionInventory,
    androidPreflight,
    findings: unique(findings, item => `${item.file}:${item.rule}:${item.message}`),
    generatedAt: new Date().toISOString(),
    healthy: nativeAuditIsHealthy(findings, androidPreflight),
    platforms: detectedPlatforms(usesSwift, usesCompose),
    releaseVersion: manifest.release.version,
    repository: root,
    resolved
  }
}

export const formatNativeAdoptionAudit = (report: NativeAuditReport): string => {
  const heading = report.findings.length === 0 ?
    'Native Lumen adoption matches the release manifest.' :
    `Native Lumen adoption has ${report.findings.length} finding${report.findings.length === 1 ? '' : 's'}.`

  return [
    heading,
    ...report.resolved.map(item => [
      `[resolved] ${item.platform} ${item.reference}`,
      item.version ? `version=${item.version}` : undefined,
      item.revision ? `revision=${item.revision}` : undefined
    ].filter(Boolean).join(' ')),
    ...report.findings.map(item => (
      `[${item.severity}] ${item.file} ${item.rule}: ${item.message} ${item.remediation}`
    )),
    ...(report.adoptionInventory.suggestions.length === 0 ?
      ['[inventory] No likely direct native primitives with public Lumen equivalents were found.'] :
      [
        `[inventory] ${report.adoptionInventory.suggestions.length} non-authoritative adoption suggestion${report.adoptionInventory.suggestions.length === 1 ? '' : 's'} across ${report.adoptionInventory.families.length} families.`,
        ...report.adoptionInventory.families.map(family => `  ${family.family}: ${family.count}`),
        ...report.adoptionInventory.suggestions.map(suggestion => (
          `[suggestion] ${suggestion.file}:${suggestion.line} ${suggestion.nativePrimitive} may map to ${suggestion.lumenComponent}; verify product ownership and behavior before adopting.`
        ))
      ]),
    ...(report.androidPreflight ?
      [
        `[android-preflight] ${report.androidPreflight.healthy ? 'ready' : 'blocked'} for the documented JDK ${report.androidPreflight.toolchain.jdk}, compile SDK ${report.androidPreflight.toolchain.compileSdk}, Gradle ${report.androidPreflight.toolchain.gradle}, AGP ${report.androidPreflight.toolchain.androidGradlePlugin}, and Kotlin ${report.androidPreflight.toolchain.kotlin} toolchain.`,
        ...report.androidPreflight.checks.map(check => (
          `[${check.status}] ${check.id}: ${check.detail}${check.remediation ? ` ${check.remediation}` : ''}`
        ))
      ] :
      [])
  ].join('\n')
}
