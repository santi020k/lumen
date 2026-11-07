import { execFile } from 'node:child_process'
import { lstat, readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { promisify } from 'node:util'

import { gt, minVersion, satisfies, valid, validRange } from 'semver'

import { type ConsumerRelease, loadConsumerRelease } from './consumer-release.js'
import { consumerPackageVersion, consumerReleaseVersions } from './consumer-release-versions.js'
import { inspectLumenIntegration, type LumenDiagnosticReport } from './integration-diagnostics.js'

/* eslint-disable complexity -- Consumer inventory, semver checks, mutation, and verification intentionally evaluate full repository contracts. */

const execFileAsync = promisify(execFile)

const lumenPackageSuffixPattern =
  '(?:astro|core|elements|icons-brand|mcp|react(?:-hook-form|-native)?|tokens)'

const lumenPackageNamePattern = `@santi020k/lumen(?:-${lumenPackageSuffixPattern})?`
const lumenPackagePattern = new RegExp(`^${lumenPackageNamePattern}$`)

const lumenYamlKeyPattern = new RegExp(
  `^[\\t ]*['"]?(${lumenPackageNamePattern})['"]?[\\t ]*:[\\t ]*`,
  'u'
)

const readCatalogRange = (line: string) => {
  const key = lumenYamlKeyPattern.exec(line)
  const packageName = key?.[1]

  if (!key || !packageName) return undefined

  const scalar = line.slice(key[0].length)
  const quote = scalar[0]
  const quoted = quote === '\'' || quote === '"'
  const start = quoted ? 1 : 0
  const end = quoted ? scalar.indexOf(quote, start) : scalar.search(/[\r\n#]/u)

  if (quoted && end === -1) return undefined

  const version = scalar.slice(start, end === -1 ? undefined : end).trimEnd()

  return version ? { packageName, version, offset: key[0].length + start } : undefined
}

const lumenLockReferencePattern = new RegExp(
  `^  ['"]?(${lumenPackageNamePattern})@(\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z.-]+)?)['"]?:`,
  'u'
)

const yamlSection = (source: string, names: string[]): string[] => {
  let selected = false

  return source.split(/(?<=\n)/u).filter(line => {
    if (/^[^\s#]/u.test(line)) selected = names.some(name => line.startsWith(`${name}:`))

    return selected
  })
}

const dependencyFields = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'] as const

export type LumenFramework = 'astro' | 'elements' | 'react' | 'react-native'

export interface ConsumerReference {
  file: string
  packageName: string
  source: 'catalog' | 'manifest' | 'lockfile'
  version: string
}

export interface ConsumerInventory {
  branch: string | undefined
  currentCommit: string | undefined
  dirty: boolean
  frameworks: LumenFramework[]
  integration: LumenDiagnosticReport
  nodeEngine: string | undefined
  nodeEngineSatisfied: boolean | undefined
  packageManager: string | undefined
  references: ConsumerReference[]
  repository: string
  resolvedVersions: Record<string, string[]>
  targetVersion?: string
  packageTargets?: Record<string, string>
  valid: boolean
  warnings: string[]
}

export interface ConsumerRolloutOptions {
  allowDirty?: boolean
  apply?: boolean
  exclude?: string[]
  manifestPath?: string
  report?: string
  repositories: string[]
  targetVersion?: string
  verify?: boolean
}

export interface ConsumerRolloutReport {
  generatedAt: string
  mode: 'apply' | 'inventory'
  nativeTargets?: { composeVersion: string, swiftTag: string }
  repositories: (ConsumerInventory & {
    commands: { command: string, ok: boolean, output: string }[]
  })[]
  targetVersion?: string
}

export interface ConsumerRolloutTargets {
  repositories: string[]
  targetVersion?: string
}

export const consumerRolloutSucceeded = (report: ConsumerRolloutReport): boolean => report.repositories.every(
  repository => repository.valid && repository.commands.every(command => command.ok)
)

interface PackageManifest {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  engines?: { node?: string }
  name?: string
  optionalDependencies?: Record<string, string>
  packageManager?: string
  peerDependencies?: Record<string, string>
  scripts?: Record<string, string>
}

const isLumenPackage = (name: string): boolean => lumenPackagePattern.test(name)

export const resolveConsumerRolloutTargets = (
  values: string[],
  currentDirectory = process.cwd()
): ConsumerRolloutTargets => {
  const [firstValue, ...remainingValues] = values
  const targetVersion = firstValue && valid(firstValue) ? firstValue : undefined
  const repositories = targetVersion ? remainingValues : values

  return {
    repositories: repositories.length ? repositories : [currentDirectory],
    ...(targetVersion ? { targetVersion } : {})
  }
}

const regularFileExists = async (path: string): Promise<boolean> => {
  try {
    if (!(await lstat(path)).isFile()) {
      throw new Error(`Consumer migration requires a regular file: ${path}`)
    }

    return true
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false

    throw error
  }
}

const findPackageManifests = async (root: string): Promise<string[]> => {
  const results: string[] = []

  const visit = async (directory: string): Promise<void> => {
    const entries = await readdir(directory, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name.startsWith('.turbo')) continue

      const path = join(directory, entry.name)

      if (entry.isDirectory()) {
        await visit(path)
      } else if (entry.name === 'package.json') {
        if (!entry.isFile()) throw new Error(`Consumer migration requires a regular file: ${path}`)

        results.push(path)
      }
    }
  }

  await visit(root)

  return results
}

const readManifest = async (path: string): Promise<PackageManifest> => JSON.parse(await readFile(path, 'utf8')) as PackageManifest

const readGitValue = async (root: string, args: string[]): Promise<string | undefined> => {
  try {
    const { stdout } = await execFileAsync('git', ['-C', root, ...args])

    return stdout.trim() || undefined
  } catch {
    return undefined
  }
}

export const satisfiesNodeEngine = (
  engine: string | undefined,
  currentVersion = process.versions.node
): boolean | undefined => {
  if (!engine) return undefined

  return satisfies(currentVersion, engine)
}

const collectManifestReferences = (
  manifest: PackageManifest,
  file: string,
  root: string
): ConsumerReference[] => dependencyFields.flatMap(field => Object.entries(manifest[field] ?? {})
  .filter(([packageName]) => isLumenPackage(packageName))
  .map(([packageName, version]) => ({
    file: relative(root, file),
    packageName,
    source: 'manifest' as const,
    version
  })))

const collectYamlReferences = (source: string, file: string): ConsumerReference[] => {
  const references: ConsumerReference[] = []

  for (const line of yamlSection(source, ['catalog', 'catalogs'])) {
    const range = readCatalogRange(line)

    if (range) {
      references.push({ file, packageName: range.packageName, source: 'catalog', version: range.version })
    }
  }

  return references
}

const collectLockReferences = (source: string): ConsumerReference[] => {
  const references: ConsumerReference[] = []

  for (const line of yamlSection(source, ['packages'])) {
    const match = lumenLockReferencePattern.exec(line)

    if (match?.[1] && match[2]) {
      references.push({
        file: 'pnpm-lock.yaml',
        packageName: match[1],
        source: 'lockfile',
        version: match[2]
      })
    }
  }

  return references
}

const getResolvedVersions = (references: ConsumerReference[]): Record<string, string[]> => {
  const graph: Record<string, Set<string>> = {}

  for (const reference of references.filter(item => item.source === 'lockfile')) {
    graph[reference.packageName] ??= new Set()

    graph[reference.packageName]?.add(reference.version)
  }

  return Object.fromEntries(Object.entries(graph).map(([name, versions]) => [name, [...versions].sort()]))
}

const packageTargetsFor = async (targetVersion?: string, historical?: ConsumerRelease) => {
  if (historical) return Object.fromEntries(historical.npmVersions)

  return targetVersion ? consumerReleaseVersions(targetVersion) : undefined
}

export const inspectLumenConsumer = async (
  repository: string,
  targetVersion?: string,
  release?: ConsumerRelease
): Promise<ConsumerInventory> => {
  const packageVersions = await packageTargetsFor(targetVersion, release)
  const root = resolve(repository)
  const rootManifestPath = join(root, 'package.json')

  if (!(await regularFileExists(rootManifestPath))) {
    throw new Error(`No package.json found at consumer root: ${root}`)
  }

  const manifestPaths = await findPackageManifests(root)

  const manifests = await Promise.all(
    manifestPaths.map(async file => ({
      file,
      manifest: await readManifest(file)
    }))
  )

  const rootManifest = await readManifest(rootManifestPath)
  const references = manifests.flatMap(({ file, manifest }) => collectManifestReferences(manifest, file, root))
  const workspacePath = join(root, 'pnpm-workspace.yaml')
  const lockPath = join(root, 'pnpm-lock.yaml')

  if (await regularFileExists(workspacePath)) {
    references.push(...collectYamlReferences(await readFile(workspacePath, 'utf8'), 'pnpm-workspace.yaml'))
  }

  if (await regularFileExists(lockPath)) {
    references.push(...collectLockReferences(await readFile(lockPath, 'utf8')))
  }

  const resolvedVersions = getResolvedVersions(references)

  const frameworks = [
    references.some(item => item.packageName === '@santi020k/lumen-astro') && 'astro',
    references.some(item => item.packageName === '@santi020k/lumen-elements') && 'elements',
    references.some(item => item.packageName === '@santi020k/lumen-react') && 'react',
    references.some(item => item.packageName === '@santi020k/lumen-react-native') && 'react-native'
  ].filter(Boolean) as LumenFramework[]

  const warnings: string[] = []
  const integration = await inspectLumenIntegration(root)
  const nodeEngineSatisfied = satisfiesNodeEngine(rootManifest.engines?.node)
  const status = await readGitValue(root, ['status', '--porcelain'])
  const dirty = Boolean(status)

  if (!/^pnpm@\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(rootManifest.packageManager ?? '')) {
    warnings.push('Missing an exact pnpm packageManager declaration.')
  }

  if (nodeEngineSatisfied === false) {
    warnings.push(
      `Current Node ${process.versions.node} does not satisfy ${rootManifest.engines?.node ?? 'the declared engine'}.`
    )
  }

  if (dirty) {
    warnings.push('Repository has uncommitted changes; create an intentional baseline or use --allow-dirty.')
  }

  const packageTargets = new Map<string, string>()

  if (targetVersion) {
    for (const { packageName } of references) {
      packageTargets.set(packageName, consumerPackageVersion(packageName, targetVersion, packageVersions))
    }

    for (const { file, packageName, source, version } of references) {
      if (source === 'lockfile' || /^(?:catalog:|workspace:)/u.test(version)) continue

      const target = packageTargets.get(packageName) ?? targetVersion

      if (packageVersions ? !satisfies(target, version) : version.replace(/^[~^]/u, '') !== target) {
        warnings.push(`${packageName} declares ${version} in ${file} instead of ${target}.`)
      }

      if (release && validRange(version) && !resolvedVersions[packageName]?.length) {
        warnings.push(`${packageName} has no verified resolution in pnpm-lock.yaml; expected ${target}.`)
      }
    }

    const umbrella = '@santi020k/lumen'
    const umbrellaTarget = release?.npmVersions.get(umbrella)

    if (umbrellaTarget && frameworks.some(name => name !== 'react-native') && !resolvedVersions[umbrella]?.length) {
      packageTargets.set(umbrella, umbrellaTarget)

      warnings.push(`${umbrella} has no verified resolution in pnpm-lock.yaml; expected ${umbrellaTarget}.`)
    }

    for (const [packageName, versions] of Object.entries(resolvedVersions)) {
      const target = packageTargets.get(packageName) ?? targetVersion

      if (versions.some(version => version !== target)) {
        warnings.push(`${packageName} resolves ${versions.join(', ')} instead of only ${target}.`)
      }
    }
  }

  return {
    branch: await readGitValue(root, ['branch', '--show-current']),
    currentCommit: await readGitValue(root, ['rev-parse', 'HEAD']),
    dirty,
    frameworks,
    integration,
    nodeEngine: rootManifest.engines?.node,
    nodeEngineSatisfied,
    packageManager: rootManifest.packageManager,
    references,
    repository: root,
    resolvedVersions,
    ...(targetVersion ? { targetVersion } : {}),
    ...(packageVersions ? { packageTargets: Object.fromEntries(packageTargets) } : {}),
    valid: warnings.length === 0 && integration.healthy,
    warnings: [...new Set(warnings)]
  }
}

const replaceRange = (range: string, targetVersion: string): string => {
  if (range.startsWith('catalog:') || range.startsWith('workspace:') || range.startsWith('file:')) return range

  const prefix = range.startsWith('^') || range.startsWith('~') ? (range.at(0) ?? '') : ''

  return `${prefix}${targetVersion}`
}

export const updateLumenManifestSource = (
  source: string, targetVersion: string, packageVersions?: Readonly<Record<string, string>>, preserveCompatible = false
): string => {
  const manifest = JSON.parse(source) as PackageManifest
  let changed = false

  for (const field of dependencyFields) {
    const dependencies = manifest[field]

    for (const [name, range] of Object.entries(dependencies ?? {})) {
      if (isLumenPackage(name) && dependencies) {
        const target = consumerPackageVersion(name, targetVersion, packageVersions)

        if (preserveCompatible && (!validRange(range) || satisfies(target, range))) continue

        const updated = replaceRange(range, target)

        if (range !== updated) {
          dependencies[name] = updated

          changed = true
        }
      }
    }
  }

  return changed ? `${JSON.stringify(manifest, undefined, 2)}\n` : source
}

const lumenWorkspaceVersionPattern = new RegExp([
  String.raw`^(\s*['"]?@santi020k\/lumen`,
  String.raw`(?:-(?:astro|core|elements|mcp|react))?['"]?\s*:\s*['"]?)`,
  String.raw`([~^]?)(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)(['"]?\s*(?:#.*)?)$`
].join(''), 'gm')

export const updateLumenWorkspaceSource = (
  source: string, targetVersion: string, packageVersions?: Readonly<Record<string, string>>, preserveCompatible = false
): string => {
  if (packageVersions) {
    let inCatalog = false

    return source.split(/(?<=\n)/u).map(line => {
      if (/^[^\s#]/u.test(line)) inCatalog = /^(?:catalog|catalogs):/u.test(line)

      if (!inCatalog) return line

      const range = readCatalogRange(line)
      const target = range && packageVersions[range.packageName]

      if (!range || !target || !validRange(range.version)) return line

      if (preserveCompatible && satisfies(target, range.version)) return line

      return line.slice(0, range.offset) + replaceRange(range.version, target) +
        line.slice(range.offset + range.version.length)
    }).join('')
  }

  return source.replaceAll(lumenWorkspaceVersionPattern, (
    _match: string, before: string, prefix: string, _version: string, after: string
  ) => `${before}${prefix}${targetVersion}${after}`)
}

const getVerificationScripts = (manifest: PackageManifest, frameworks: LumenFramework[]): string[] => {
  const scripts = manifest.scripts ?? {}
  const shouldTypecheck = frameworks.some(framework => ['elements', 'react', 'react-native'].includes(framework))

  const preferred = [
    frameworks.includes('astro') && 'check',
    shouldTypecheck && 'typecheck',
    'build',
    scripts['test:browser'] && 'test:browser',
    scripts['test:e2e'] && 'test:e2e'
  ].filter((script): script is string => Boolean(script && scripts[script]))

  return [...new Set(preferred)]
}

const runCommand = async (
  root: string,
  executable: string,
  args: string[]
): Promise<{ command: string, ok: boolean, output: string }> => {
  const command = [executable, ...args].join(' ')

  try {
    const { stderr, stdout } = await execFileAsync(executable, args, {
      cwd: root,
      maxBuffer: 10 * 1024 * 1024
    })

    return { command, ok: true, output: `${stdout}${stderr}`.trim() }
  } catch (error) {
    const detail = error as { stderr?: string, stdout?: string, message?: string }

    return {
      command,
      ok: false,
      output: `${detail.stdout ?? ''}${detail.stderr ?? ''}`.trim() || detail.message || 'Command failed.'
    }
  }
}

const parseFlowSequence = (source: string): string[] | undefined => {
  const match = /^\[([^\]#]*)\][ \t]*(?:#.*)?$/.exec(source.trim())

  if (!match || /[\\{}&*!#]|''/u.test(match[1] ?? '')) return undefined

  const values: string[] = []
  let current = ''
  let quote: '"' | '\'' | undefined

  for (const character of match[1] ?? '') {
    if (quote) {
      current += character

      if (character === quote) quote = undefined
    } else if (character === '"' || character === '\'') {
      current += character

      quote = character
    } else if (character === ',') {
      values.push(current)

      current = ''
    } else {
      current += character
    }
  }

  if (current.trim()) values.push(current)

  return values
    .map(value => {
      const trimmed = value.trim()

      if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith('\'') && trimmed.endsWith('\''))) {
        return trimmed.slice(1, -1)
      }

      return trimmed
    })
    .filter(Boolean)
}

// Read only the top-level exclusion list. Other pnpm settings can also contain package lists.
const releaseAgeSection = (source: string) => {
  const newline = source.includes('\r\n') ? '\r\n' : '\n'
  const lines = source.split(newline)
  const firstKey = lines.find(line => /^ *[^#\s-][^:]*:/u.test(line))
  const rootIndent = firstKey?.match(/^ */u)?.[0] ?? ''

  const start = lines.findIndex(line => (
    line.startsWith(rootIndent) && /^minimumReleaseAgeExclude *:/u.test(line.slice(rootIndent.length))
  ))

  if (start < 0) return undefined

  const declaration = lines[start] ?? ''
  const value = declaration.slice(declaration.indexOf(':') + 1).trim()
  const inlineValues = parseFlowSequence(value)
  const block = !value || value.startsWith('#')

  if (!block && !inlineValues) return undefined

  let end = start + 1
  let itemIndent: string | undefined

  while (block && end < lines.length) {
    const line = lines[end] ?? ''
    const trimmed = line.trim()

    if (trimmed && !trimmed.startsWith('#')) {
      const item = /^( *)-\s+/u.exec(line)

      if (!item || (item[1]?.length ?? 0) < rootIndent.length) break

      itemIndent ??= item[1]
    }

    end++
  }

  return { end, indent: itemIndent ?? rootIndent + '  ', inlineValues, lines, newline, start }
}

export const addReleaseAgeTarget = (source: string, packages: string[], version: string): string => {
  const section = releaseAgeSection(source)

  if (!section) return source

  const { end, indent, inlineValues, lines, newline, start } = section
  const existing = new Set(inlineValues ?? [])

  for (const line of lines.slice(start + 1, end)) {
    const match = /^\s*-\s*['"]?([^'"\s#]+)['"]?\s*(?:#.*)?$/u.exec(line)

    if (match?.[1]) existing.add(match[1])
  }

  const additions = [...new Set(packages.map(name => `${name}@${version}`))]
    .filter(value => !existing.has(value))
    .map(value => `${indent}- ${JSON.stringify(value)}`)

  if (!additions.length) return source

  if (inlineValues) {
    const declaration = lines[start] ?? ''

    lines[start] = declaration.slice(0, declaration.indexOf(':') + 1) + declaration.slice(declaration.indexOf(']') + 1)

    additions.unshift(...inlineValues.map(value => `${indent}- ${JSON.stringify(value)}`))
  }

  lines.splice(start + 1, 0, ...additions)

  return lines.join(newline)
}

const removeObsoleteReleaseAgeEntries = (
  source: string, targetVersion: string, packageVersions?: Readonly<Record<string, string>>
): string => {
  const section = releaseAgeSection(source)

  if (!section) return source

  const { end, lines, newline, start } = section
  const pattern = packageVersions ? lumenPackageNamePattern : '@santi020k/lumen(?:-(?:astro|core|elements|mcp|react))?'
  const entry = new RegExp(`^\\s*-\\s*['"]?(${pattern})@([^'"\\s]+)['"]?\\s*$`, 'u')

  const isCurrent = (line: string): boolean => {
    const match = entry.exec(line)
    const name = match?.[1]

    if (!name) return true

    const expected = packageVersions ? packageVersions[name] : targetVersion

    return !expected || match[2] === expected
  }

  if (section.inlineValues) {
    const kept = section.inlineValues.filter(value => isCurrent('- ' + JSON.stringify(value)))

    if (kept.length === section.inlineValues.length) return source

    const declaration = lines[start] ?? ''
    const values = kept.map(value => JSON.stringify(value)).join(', ')

    lines[start] = declaration.slice(0, declaration.indexOf('[') + 1) + values + declaration.slice(declaration.indexOf(']'))

    return lines.join(newline)
  }

  const retained = lines.slice(start + 1, end).filter(isCurrent)

  return [...lines.slice(0, start + 1), ...retained, ...lines.slice(end)].join(newline)
}

const upgradeConsumer = async (
  inventory: ConsumerInventory,
  targetVersion: string,
  allowDirty: boolean,
  verify: boolean,
  release?: ConsumerRelease
): Promise<{ command: string, ok: boolean, output: string }[]> => {
  if (inventory.dirty && !allowDirty) {
    throw new Error(`${inventory.repository} is dirty. Commit a baseline or pass --allow-dirty.`)
  }

  if (!/^pnpm@\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(inventory.packageManager ?? '')) {
    throw new Error(`${inventory.repository} must declare an exact pnpm packageManager version.`)
  }

  if (inventory.nodeEngineSatisfied === false) {
    throw new Error(
      `${inventory.repository} must be upgraded under Node ${inventory.nodeEngine ?? 'matching its engine declaration'}.`
    )
  }

  const packageVersions = await packageTargetsFor(targetVersion, release)

  for (const { packageName, version } of inventory.references) {
    const target = consumerPackageVersion(packageName, targetVersion, packageVersions)
    const minimum = validRange(version) ? minVersion(version) : null

    if (minimum && gt(minimum, target)) {
      throw new Error(`Rollout would downgrade ${packageName} from ${version} to ${target}; select a newer release.`)
    }
  }

  const packageNames = [...new Set(inventory.references
    .filter(item => !release || validRange(item.version))
    .map(item => item.packageName))]

  if (packageNames.length === 0) return []

  const manifestPaths = await findPackageManifests(inventory.repository)
  const desiredDeclarations = new Map<string, string>()

  for (const path of manifestPaths) {
    const source = await readFile(path, 'utf8')
    const updated = updateLumenManifestSource(source, targetVersion, packageVersions, Boolean(release))

    desiredDeclarations.set(path, updated)

    if (updated !== source) await writeFile(path, updated)
  }

  const workspacePath = join(inventory.repository, 'pnpm-workspace.yaml')

  if (await regularFileExists(workspacePath)) {
    const source = await readFile(workspacePath, 'utf8')
    const packages = [...new Set(inventory.references.map(item => item.packageName))]
    let updated = updateLumenWorkspaceSource(source, targetVersion, packageVersions, Boolean(release))

    if (!release) {
      for (const name of packages) {
        updated = addReleaseAgeTarget(updated, [name], consumerPackageVersion(name, targetVersion, packageVersions))
      }
    }

    desiredDeclarations.set(workspacePath, updated)

    if (updated !== source) await writeFile(workspacePath, updated)
  }

  const directPackages = new Set(inventory.references
    .filter(item => item.source !== 'lockfile')
    .map(item => item.packageName))

  const updates = packageNames.map(name => !release || directPackages.has(name) ?
    `${name}@${consumerPackageVersion(name, targetVersion, packageVersions)}` :
    name)

  const commands = [await runCommand(inventory.repository, 'corepack', ['pnpm', 'update', '--recursive', ...updates])]

  // pnpm update may rewrite declared ranges or catalog references.
  for (const [path, source] of desiredDeclarations) {
    if (!(await regularFileExists(path)) || await readFile(path, 'utf8') !== source) await writeFile(path, source)
  }

  if (!commands[0]?.ok) return commands

  commands.push(await runCommand(inventory.repository, 'corepack', ['pnpm', 'install']))

  if (!commands.at(-1)?.ok) return commands

  if (!release && await regularFileExists(workspacePath)) {
    const source = await readFile(workspacePath, 'utf8')
    const updated = removeObsoleteReleaseAgeEntries(source, targetVersion, packageVersions)

    if (updated !== source) {
      await writeFile(workspacePath, updated)

      commands.push(await runCommand(inventory.repository, 'corepack', ['pnpm', 'install']))
    }
  }

  if (release) commands.push(await runCommand(inventory.repository, 'corepack', ['pnpm', 'install', '--frozen-lockfile']))

  if (verify && commands.every(command => command.ok)) {
    const manifest = await readManifest(join(inventory.repository, 'package.json'))

    for (const script of getVerificationScripts(manifest, inventory.frameworks)) {
      const result = await runCommand(inventory.repository, 'corepack', ['pnpm', 'run', script])

      commands.push(result)

      if (!result.ok) break
    }
  }

  return commands
}

export const runConsumerRollout = async (options: ConsumerRolloutOptions): Promise<ConsumerRolloutReport> => {
  if (options.apply && !options.targetVersion) {
    throw new Error('A target version is required when applying a consumer rollout.')
  }

  if (options.manifestPath && !options.targetVersion) {
    throw new Error('A target version is required with --manifest.')
  }

  const release = options.targetVersion ?
    await loadConsumerRelease(options.targetVersion, options.manifestPath) :
    undefined

  const excluded = new Set((options.exclude ?? []).map(path => resolve(path)))
  const repositories = options.repositories.map(path => resolve(path)).filter(path => !excluded.has(path))

  const report: ConsumerRolloutReport = {
    generatedAt: new Date().toISOString(),
    mode: options.apply ? 'apply' : 'inventory',
    ...(release ? { nativeTargets: { composeVersion: release.composeVersion, swiftTag: release.swiftTag } } : {}),
    repositories: [],
    ...(options.targetVersion ? { targetVersion: options.targetVersion } : {})
  }

  for (const repository of repositories) {
    const before = await inspectLumenConsumer(repository, options.targetVersion, release)

    const commands = options.apply ?
      await upgradeConsumer(before, options.targetVersion ?? '', options.allowDirty ?? false, options.verify ?? true, release) :
      []

    const after = options.apply ? await inspectLumenConsumer(repository, options.targetVersion, release) : before

    if (options.apply) {
      after.warnings = after.warnings.filter(warning => !warning.startsWith('Repository has uncommitted changes'))

      after.valid = after.warnings.length === 0 && after.integration.healthy
    }

    report.repositories.push({ ...after, commands })

    if (commands.some(command => !command.ok)) break
  }

  if (options.report) {
    await writeFile(resolve(options.report), `${JSON.stringify(report, undefined, 2)}\n`)
  }

  return report
}

export const formatConsumerRollout = (report: ConsumerRolloutReport): string => {
  const lines = [
    `Lumen consumer ${report.mode} (${report.repositories.length} repositories)`,
    ...(report.targetVersion ? [`Target: ${report.targetVersion}`] : []),
    ...(report.nativeTargets ? [`Native targets: Swift ${report.nativeTargets.swiftTag}, Compose ${report.nativeTargets.composeVersion} (see lumen doctor-native for consumer pins)`] : [])
  ]

  for (const repository of report.repositories) {
    lines.push(
      '', repository.repository, `  package manager: ${repository.packageManager ?? 'missing'}`, `  node engine: ${repository.nodeEngine ?? 'unspecified'}`, `  frameworks: ${repository.frameworks.join(', ') || 'none'}`, `  resolved graph: ${JSON.stringify(repository.resolvedVersions)}`, `  status: ${repository.valid && repository.commands.every(command => command.ok) ? 'ok' : 'attention required'}`
    )

    if (repository.packageTargets) lines.push(`  package targets: ${JSON.stringify(repository.packageTargets)}`)

    lines.push(...repository.warnings.map(warning => `  warning: ${warning}`))

    lines.push(
      ...repository.integration.findings.map(item => `  ${item.severity}: ${item.file} ${item.rule}: ${item.message}`)
    )

    lines.push(...repository.commands.map(command => `  ${command.ok ? 'pass' : 'fail'}: ${command.command}`))
  }

  return lines.join('\n')
}
