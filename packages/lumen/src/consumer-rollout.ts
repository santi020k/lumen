import { execFile } from 'node:child_process'
import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { promisify } from 'node:util'

import { satisfies } from 'semver'

/* eslint-disable complexity -- Consumer inventory, semver checks, mutation, and verification intentionally evaluate full repository contracts. */

const execFileAsync = promisify(execFile)
const lumenPackagePattern = /^@santi020k\/lumen(?:-(?:astro|core|elements|mcp|react))?$/

const dependencyFields = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies'
] as const

export type LumenFramework = 'astro' | 'elements' | 'react'

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
  nodeEngine: string | undefined
  nodeEngineSatisfied: boolean | undefined
  packageManager: string | undefined
  references: ConsumerReference[]
  repository: string
  resolvedVersions: Record<string, string[]>
  targetVersion?: string
  valid: boolean
  warnings: string[]
}

export interface ConsumerRolloutOptions {
  allowDirty?: boolean
  apply?: boolean
  exclude?: string[]
  report?: string
  repositories: string[]
  targetVersion?: string
  verify?: boolean
}

export interface ConsumerRolloutReport {
  generatedAt: string
  mode: 'apply' | 'inventory'
  repositories: (ConsumerInventory & {
    commands: { command: string; ok: boolean; output: string }[]
  })[]
  targetVersion?: string
}

export const consumerRolloutSucceeded = (report: ConsumerRolloutReport): boolean =>
  report.repositories.every(repository =>
    repository.valid && repository.commands.every(command => command.ok)
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

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await stat(path)

    return true
  } catch {
    return false
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
        results.push(path)
      }
    }
  }

  await visit(root)

  return results
}

const readManifest = async (path: string): Promise<PackageManifest> =>
  JSON.parse(await readFile(path, 'utf8')) as PackageManifest

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
): ConsumerReference[] => dependencyFields.flatMap(field =>
  Object.entries(manifest[field] ?? {})
    .filter(([packageName]) => isLumenPackage(packageName))
    .map(([packageName, version]) => ({
      file: relative(root, file),
      packageName,
      source: 'manifest' as const,
      version
    }))
)

const collectYamlReferences = (source: string, file: string): ConsumerReference[] => {
  const references: ConsumerReference[] = []

  for (const line of source.split(/\r?\n/)) {
    const match = /^\s*['"]?(@santi020k\/lumen(?:-(?:astro|core|elements|mcp|react))?)['"]?\s*:\s*['"]?([^'"\s#]+)['"]?/.exec(line)

    if (match?.[1] && match[2]) {
      references.push({ file, packageName: match[1], source: 'catalog', version: match[2] })
    }
  }

  return references
}

const collectLockReferences = (source: string): ConsumerReference[] => {
  const references: ConsumerReference[] = []
  const pattern = /@santi020k\/(lumen(?:-(?:astro|core|elements|mcp|react))?)@(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/g

  for (const match of source.matchAll(pattern)) {
    if (match[1] && match[2]) {
      references.push({
        file: 'pnpm-lock.yaml',
        packageName: `@santi020k/${match[1]}`,
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

  return Object.fromEntries(
    Object.entries(graph).map(([name, versions]) => [name, [...versions].sort()])
  )
}

export const inspectLumenConsumer = async (
  repository: string,
  targetVersion?: string
): Promise<ConsumerInventory> => {
  const root = resolve(repository)
  const rootManifestPath = join(root, 'package.json')

  if (!await pathExists(rootManifestPath)) {
    throw new Error(`No package.json found at consumer root: ${root}`)
  }

  const manifestPaths = await findPackageManifests(root)

  const manifests = await Promise.all(manifestPaths.map(async file => ({
    file,
    manifest: await readManifest(file)
  })))

  const rootManifest = await readManifest(rootManifestPath)

  const references = manifests.flatMap(({ file, manifest }) =>
    collectManifestReferences(manifest, file, root)
  )

  const workspacePath = join(root, 'pnpm-workspace.yaml')
  const lockPath = join(root, 'pnpm-lock.yaml')

  if (await pathExists(workspacePath)) {
    references.push(...collectYamlReferences(
      await readFile(workspacePath, 'utf8'),
      'pnpm-workspace.yaml'
    ))
  }

  if (await pathExists(lockPath)) {
    references.push(...collectLockReferences(await readFile(lockPath, 'utf8')))
  }

  const resolvedVersions = getResolvedVersions(references)

  const frameworks = ([
    references.some(item => item.packageName === '@santi020k/lumen-astro') && 'astro',
    references.some(item => item.packageName === '@santi020k/lumen-elements') && 'elements',
    references.some(item => item.packageName === '@santi020k/lumen-react') && 'react'
  ].filter(Boolean)) as LumenFramework[]

  const warnings: string[] = []
  const nodeEngineSatisfied = satisfiesNodeEngine(rootManifest.engines?.node)
  const status = await readGitValue(root, ['status', '--porcelain'])
  const dirty = Boolean(status)

  if (!/^pnpm@\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(rootManifest.packageManager ?? '')) {
    warnings.push('Missing an exact pnpm packageManager declaration.')
  }

  if (nodeEngineSatisfied === false) {
    warnings.push(`Current Node ${process.versions.node} does not satisfy ${rootManifest.engines?.node ?? 'the declared engine'}.`)
  }

  if (dirty) {
    warnings.push('Repository has uncommitted changes; create an intentional baseline or use --allow-dirty.')
  }

  if (targetVersion) {
    for (const reference of references.filter(item => item.source !== 'lockfile')) {
      const declaredVersion = reference.version.replace(/^[~^]/, '')

      if (
        reference.version !== 'catalog:' &&
        !reference.version.startsWith('workspace:') &&
        declaredVersion !== targetVersion
      ) {
        warnings.push(
          `${reference.packageName} declares ${reference.version} in ${reference.file} instead of ${targetVersion}.`
        )
      }
    }

    for (const [packageName, versions] of Object.entries(resolvedVersions)) {
      if (versions.some(version => version !== targetVersion)) {
        warnings.push(`${packageName} resolves ${versions.join(', ')} instead of only ${targetVersion}.`)
      }
    }
  }

  return {
    branch: await readGitValue(root, ['branch', '--show-current']),
    currentCommit: await readGitValue(root, ['rev-parse', 'HEAD']),
    dirty,
    frameworks,
    nodeEngine: rootManifest.engines?.node,
    nodeEngineSatisfied,
    packageManager: rootManifest.packageManager,
    references,
    repository: root,
    resolvedVersions,
    ...(targetVersion ? { targetVersion } : {}),
    valid: warnings.length === 0,
    warnings
  }
}

const replaceRange = (range: string, targetVersion: string): string => {
  if (range === 'catalog:' || range.startsWith('workspace:') || range.startsWith('file:')) return range

  const prefix = range.startsWith('^') || range.startsWith('~') ? (range.at(0) ?? '') : ''

  return `${prefix}${targetVersion}`
}

export const updateLumenManifestSource = (
  source: string,
  targetVersion: string
): string => {
  const manifest = JSON.parse(source) as PackageManifest

  for (const field of dependencyFields) {
    const dependencies = manifest[field]

    for (const [name, range] of Object.entries(dependencies ?? {})) {
      if (isLumenPackage(name) && dependencies) dependencies[name] = replaceRange(range, targetVersion)
    }
  }

  return `${JSON.stringify(manifest, undefined, 2)}\n`
}

export const updateLumenWorkspaceSource = (
  source: string,
  targetVersion: string
): string => source.replaceAll(
  /^(\s*['"]?@santi020k\/lumen(?:-(?:astro|core|elements|mcp|react))?['"]?\s*:\s*['"]?)([~^]?)(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)(['"]?\s*(?:#.*)?)$/gm,
  (_match, before: string, prefix: string, _version: string, after: string) =>
    `${before}${prefix}${targetVersion}${after}`
)

const getVerificationScripts = (
  manifest: PackageManifest,
  frameworks: LumenFramework[]
): string[] => {
  const scripts = manifest.scripts ?? {}

  const preferred = [
    frameworks.includes('astro') && 'check',
    (frameworks.includes('react') || frameworks.includes('elements')) && 'typecheck',
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
): Promise<{ command: string; ok: boolean; output: string }> => {
  const command = [executable, ...args].join(' ')

  try {
    const { stderr, stdout } = await execFileAsync(executable, args, {
      cwd: root,
      maxBuffer: 10 * 1024 * 1024
    })

    return { command, ok: true, output: `${stdout}${stderr}`.trim() }
  } catch (error) {
    const detail = error as { stderr?: string; stdout?: string; message?: string }

    return {
      command,
      ok: false,
      output: `${detail.stdout ?? ''}${detail.stderr ?? ''}`.trim() || detail.message || 'Command failed.'
    }
  }
}

const parseFlowSequence = (source: string): string[] | undefined => {
  const match = /^\[([\s\S]*)\]\s*(?:#.*)?$/.exec(source.trim())

  if (!match) return undefined

  const values: string[] = []
  let current = ''
  let quote: '"' | "'" | undefined

  for (const character of match[1] ?? '') {
    if (quote) {
      current += character

      if (character === quote) quote = undefined
    } else if (character === '"' || character === "'") {
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

  return values.map(value => {
    const trimmed = value.trim()

    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1)
    }

    return trimmed
  }).filter(Boolean)
}

export const addReleaseAgeTarget = (source: string, packages: string[], version: string): string => {
  if (!/^\s*minimumReleaseAgeExclude\s*:/m.test(source)) return source

  const lines = source.split(/\r?\n/)
  const index = lines.findIndex(line => /^\s*minimumReleaseAgeExclude\s*:/.test(line))
  const declaration = lines[index] ?? ''
  const rootIndent = /^\s*/.exec(declaration)?.[0] ?? ''
  const indent = `${rootIndent}  `
  const declarationValue = declaration.slice(declaration.indexOf(':') + 1)
  const inlineValues = parseFlowSequence(declarationValue)

  if (declarationValue.trim() && !inlineValues) return source

  const existing = new Set([
    ...(inlineValues ?? []),
    ...lines.flatMap(line => {
      const value = /^\s*-\s*['"]?([^'"]+)['"]?\s*$/.exec(line)?.[1]

      return value ? [value] : []
    })
  ])

  const additions = packages
    .map(packageName => `${packageName}@${version}`)
    .filter(value => !existing.has(value))
    .map(value => `${indent}- "${value}"`)

  if (declaration.slice(declaration.indexOf(':') + 1).trim()) {
    lines[index] = `${rootIndent}minimumReleaseAgeExclude:`

    additions.unshift(...(inlineValues ?? []).map(value => `${indent}- "${value}"`))
  }

  lines.splice(index + 1, 0, ...additions)

  return lines.join('\n')
}

const removeObsoleteReleaseAgeEntries = (source: string, targetVersion: string): string =>
  source.split(/\r?\n/)
    .filter(line => {
      const match = /^\s*-\s*['"]?(@santi020k\/lumen(?:-(?:astro|core|elements|mcp|react))?)@([^'"]+)['"]?\s*$/.exec(line)

      return !match || match[2] === targetVersion
    })
    .join('\n')

const upgradeConsumer = async (
  inventory: ConsumerInventory,
  targetVersion: string,
  allowDirty: boolean,
  verify: boolean
): Promise<{ command: string; ok: boolean; output: string }[]> => {
  if (inventory.dirty && !allowDirty) {
    throw new Error(`${inventory.repository} is dirty. Commit a baseline or pass --allow-dirty.`)
  }

  if (!/^pnpm@\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(inventory.packageManager ?? '')) {
    throw new Error(`${inventory.repository} must declare an exact pnpm packageManager version.`)
  }

  if (inventory.nodeEngineSatisfied === false) {
    throw new Error(`${inventory.repository} must be upgraded under Node ${inventory.nodeEngine ?? 'matching its engine declaration'}.`)
  }

  const manifestPaths = await findPackageManifests(inventory.repository)
  const desiredManifests = new Map<string, string>()

  for (const path of manifestPaths) {
    const source = await readFile(path, 'utf8')
    const updated = updateLumenManifestSource(source, targetVersion)

    desiredManifests.set(path, updated)

    if (updated !== source) await writeFile(path, updated)
  }

  const workspacePath = join(inventory.repository, 'pnpm-workspace.yaml')

  if (await pathExists(workspacePath)) {
    const source = await readFile(workspacePath, 'utf8')
    const packages = [...new Set(inventory.references.map(item => item.packageName))]

    const updated = addReleaseAgeTarget(
      updateLumenWorkspaceSource(source, targetVersion),
      packages,
      targetVersion
    )

    if (updated !== source) await writeFile(workspacePath, updated)
  }

  const packageNames = [...new Set(inventory.references.map(item => item.packageName))]

  const commands = [await runCommand(inventory.repository, 'corepack', [
    'pnpm',
    'update',
    '--recursive',
    ...packageNames.map(packageName => `${packageName}@${targetVersion}`)
  ])]

  if (!commands[0]?.ok) return commands

  for (const [path, source] of desiredManifests) {
    await writeFile(path, source)
  }

  commands.push(await runCommand(inventory.repository, 'corepack', ['pnpm', 'install']))

  if (!commands.at(-1)?.ok) return commands

  if (await pathExists(workspacePath)) {
    const source = await readFile(workspacePath, 'utf8')
    const updated = removeObsoleteReleaseAgeEntries(source, targetVersion)

    if (updated !== source) {
      await writeFile(workspacePath, updated)

      commands.push(await runCommand(inventory.repository, 'corepack', ['pnpm', 'install']))
    }
  }

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

export const runConsumerRollout = async (
  options: ConsumerRolloutOptions
): Promise<ConsumerRolloutReport> => {
  if (options.apply && !options.targetVersion) {
    throw new Error('A target version is required when applying a consumer rollout.')
  }

  const excluded = new Set((options.exclude ?? []).map(path => resolve(path)))

  const repositories = options.repositories.map(path => resolve(path))
    .filter(path => !excluded.has(path))

  const report: ConsumerRolloutReport = {
    generatedAt: new Date().toISOString(),
    mode: options.apply ? 'apply' : 'inventory',
    repositories: [],
    ...(options.targetVersion ? { targetVersion: options.targetVersion } : {})
  }

  for (const repository of repositories) {
    const before = await inspectLumenConsumer(repository, options.targetVersion)

    const commands = options.apply
      ? await upgradeConsumer(
        before,
        options.targetVersion ?? '',
        options.allowDirty ?? false,
        options.verify ?? true
      )
      : []

    const after = options.apply
      ? await inspectLumenConsumer(repository, options.targetVersion)
      : before

    if (options.apply) {
      after.warnings = after.warnings.filter(warning =>
        !warning.startsWith('Repository has uncommitted changes')
      )

      after.valid = after.warnings.length === 0
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
    ...(report.targetVersion ? [`Target: ${report.targetVersion}`] : [])
  ]

  for (const repository of report.repositories) {
    lines.push(
      '',
      repository.repository,
      `  package manager: ${repository.packageManager ?? 'missing'}`,
      `  node engine: ${repository.nodeEngine ?? 'unspecified'}`,
      `  frameworks: ${repository.frameworks.join(', ') || 'none'}`,
      `  resolved graph: ${JSON.stringify(repository.resolvedVersions)}`,
      `  status: ${repository.valid && repository.commands.every(command => command.ok) ? 'ok' : 'attention required'}`
    )

    lines.push(...repository.warnings.map(warning => `  warning: ${warning}`))

    lines.push(...repository.commands.map(command =>
      `  ${command.ok ? 'pass' : 'fail'}: ${command.command}`
    ))
  }

  return lines.join('\n')
}
