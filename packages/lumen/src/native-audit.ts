import { readdir, readFile, stat } from 'node:fs/promises'
import { extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export type NativeAuditPlatform = 'compose' | 'swift'
export type NativeAuditSeverity = 'suggestion' | 'warning'

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
  findings: NativeAuditFinding[]
  generatedAt: string
  platforms: NativeAuditPlatform[]
  releaseVersion: string
  repository: string
  resolved: NativeResolvedVersion[]
}

interface ReleaseManifest {
  release: {
    compose: { artifacts: string[], version: string }
    swift: { package: string, revision: string | null, tag: string }
    version: string
  }
  schemaVersion: number
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

const nativeExtensions = new Set(['.gradle', '.json', '.kts', '.swift', '.toml'])

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

export const inspectNativeAdoption = async (
  repository: string,
  manifestPath = fileURLToPath(new URL('../release-manifest.json', import.meta.url))
): Promise<NativeAuditReport> => {
  const root = resolve(repository)

  if (!(await stat(root)).isDirectory()) throw new Error(`Not a directory: ${root}`)

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as ReleaseManifest
  const sources = await discoverNativeSources(root)
  const swiftSources = sources.filter(entry => entry.file.endsWith('.swift'))
  const composeSources = sources.filter(entry => ['.gradle', '.kts', '.toml'].includes(extname(entry.file)))
  const usesSwift = usesSwiftPackage(sources, swiftSources)
  const usesCompose = usesComposePackage(composeSources)

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
    findings: unique(findings, item => `${item.file}:${item.rule}:${item.message}`),
    generatedAt: new Date().toISOString(),
    platforms: [usesSwift && 'swift', usesCompose && 'compose'].filter(Boolean) as NativeAuditPlatform[],
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
    ))
  ].join('\n')
}
