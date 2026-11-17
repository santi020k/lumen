import { createHash } from 'node:crypto'
import { lstat, mkdir, readFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'

import { bundledV5ReleaseVersions, consumerPackageVersion } from './consumer-release-versions.js'
import { formatConsumerRollout, inspectLumenConsumer } from './consumer-rollout.js'
import { formatLumenConsumerUpgradeAudit, inspectConsumerSource, inspectLumenConsumerUpgrade, type LumenConsumerUpgradeAudit } from './consumer-upgrade-audit.js'
import {
  createGuardedNewFile,
  GuardedFilePreWriteError,
  type GuardedFileSnapshot,
  readGuardedRegularFile,
  writeGuardedExistingFile
} from './guarded-file.js'
import { discoverSourceFiles } from './v2-migration.js'
import { migrateLumenV4 } from './v4-migration.js'
import {
  applyLumenVersionMigrationDependencies,
  type LumenMigrationDependencyOptions
} from './version-migration-dependencies.js'
import { migrateLumenVersionSource } from './version-migration-source.js'

export { migrateLumenVersionSource } from './version-migration-source.js'

export type LumenMigrationVersion = 'v3' | 'v4' | 'v5'
export interface LumenVersionMigrationFinding {
  column: number
  file: string
  kind: 'control-size' | 'layout-gap' | 'component-review' | 'native-review' | 'embedded-mcp-sdk'
  line: number
  message: string
}
export interface LumenVersionSourceMigration {
  changes: LumenVersionMigrationFinding[]
  manualReview: LumenVersionMigrationFinding[]
  source: string
}
export interface LumenVersionMigrationOptions extends LumenMigrationDependencyOptions {
  cwd?: string
  version: LumenMigrationVersion
}
export interface LumenVersionMigrationReport extends Omit<LumenVersionSourceMigration, 'source'> {
  consumerAudit?: LumenConsumerUpgradeAudit
  applied: boolean
  changedFiles: string[]
  dependencies?: Awaited<ReturnType<typeof applyLumenVersionMigrationDependencies>>
  dependencyVersion: string
  packageVersions?: Record<string, string>
  filesScanned: number
  root: string
  version: LumenMigrationVersion
}

const extensions = new Set(['.astro', '.htm', '.html', '.js', '.jsx', '.mjs', '.ts', '.tsx', '.swift', '.kt', '.kts', '.gradle', '.css'])
const fingerprint = (source: string): string => createHash('sha256').update(source).digest('hex')

const checkLedgerLocation = async (root: string): Promise<void> => {
  for (const path of [resolve(root, '.lumen'), resolve(root, '.lumen', 'migrations-v4.json')]) {
    try {
      if ((await lstat(path)).isSymbolicLink()) throw new Error(`Migration ledger must not follow a symbolic link: ${path}`)
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') continue

      throw error
    }
  }
}

interface LedgerState {
  ledger: Record<string, string>
  snapshot?: GuardedFileSnapshot
}

const readLedger = async (path: string): Promise<LedgerState> => {
  let snapshot: GuardedFileSnapshot

  try {
    snapshot = await readGuardedRegularFile(path, path)
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return { ledger: {} }

    throw error
  }

  const value: unknown = JSON.parse(snapshot.content)

  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Invalid migration ledger: ${path}`)

  const entries = Object.entries(value)

  if (entries.some(([, hash]) => typeof hash !== 'string' || !/^[a-f0-9]{64}$/u.test(hash))) throw new Error(`Invalid migration ledger: ${path}`)

  return {
    ledger: Object.fromEntries(entries.map(([file, hash]) => [file, String(hash)])),
    snapshot
  }
}

const writeLedger = async (
  root: string,
  ledgerPath: string,
  ledgerState: LedgerState
): Promise<void> => {
  const content = `${JSON.stringify(ledgerState.ledger, undefined, 2)}\n`

  if (!ledgerState.snapshot) {
    await mkdir(resolve(root, '.lumen'), { recursive: true })

    ledgerState.snapshot = await createGuardedNewFile(ledgerPath, content, ledgerPath)

    return
  }

  ledgerState.snapshot = await writeGuardedExistingFile(
    ledgerPath,
    content,
    ledgerState.snapshot,
    ledgerPath,
    `Migration ledger changed during apply: ${ledgerPath}`
  )
}

const writeMigratedSource = async (
  absoluteFile: string,
  sourceSnapshot: GuardedFileSnapshot,
  nextSource: string,
  { report, ledgerState, ledgerPath, file }: {
    report: LumenVersionMigrationReport
    ledgerState: LedgerState
    ledgerPath: string
    file: string
  }
): Promise<void> => {
  if (report.version === 'v4') {
    // Write the intended fingerprint first so an interrupted apply cannot double-rewrite gaps.
    ledgerState.ledger[file] = fingerprint(nextSource)

    await writeLedger(report.root, ledgerPath, ledgerState)
  }

  try {
    await writeGuardedExistingFile(
      absoluteFile,
      nextSource,
      sourceSnapshot,
      file,
      `Source changed during migration: ${file}`
    )
  } catch (error) {
    if (report.version === 'v4' && error instanceof GuardedFilePreWriteError) {
      Reflect.deleteProperty(ledgerState.ledger, file)

      await writeLedger(report.root, ledgerPath, ledgerState)
    }

    throw error
  }
}

const migrateFile = async (
  absoluteFile: string,
  report: LumenVersionMigrationReport,
  ledgerState: LedgerState,
  ledgerPath: string
): Promise<void> => {
  const file = relative(report.root, absoluteFile) || absoluteFile
  const sourceSnapshot = await readGuardedRegularFile(absoluteFile, file)

  if (report.version === 'v4' && Object.hasOwn(ledgerState.ledger, file)) {
    if (ledgerState.ledger[file] !== fingerprint(sourceSnapshot.content)) report.manualReview.push({ file,
      line: 1,
      column: 1,
      kind: 'layout-gap',
      message: 'This file was already migrated to v4 and has since changed. Review new edits manually; repeating gap rewrites would change spacing twice.' })

    return
  }

  const migration = migrateLumenVersionSource(sourceSnapshot.content, file, report.version)

  report.changes.push(...migration.changes)

  report.manualReview.push(...migration.manualReview)

  if (sourceSnapshot.content === migration.source) return

  report.changedFiles.push(file)

  if (!report.applied) return

  await writeMigratedSource(absoluteFile, sourceSnapshot, migration.source, { report, ledgerState, ledgerPath, file })
}

const createReport = async (
  options: LumenVersionMigrationOptions, root: string, filesScanned: number
): Promise<LumenVersionMigrationReport> => {
  const packageVersions = options.version === 'v5' ? await bundledV5ReleaseVersions() : undefined

  const dependencyVersion = options.version === 'v5' ?
    consumerPackageVersion('@santi020k/lumen', '', packageVersions) :
    { v3: '3.0.1', v4: '4.0.0' }[options.version]

  return {
    applied: options.apply === true,
    changedFiles: [],
    changes: [],
    filesScanned,
    manualReview: [],
    root,
    version: options.version,
    dependencyVersion,
    ...(packageVersions ? { packageVersions: { ...packageVersions } } : {})
  }
}

const refreshDependencyReport = async (report: LumenVersionMigrationReport): Promise<void> => {
  if (report.dependencies && report.applied) {
    for (const repository of report.dependencies.repositories) {
      const current = await inspectLumenConsumer(repository.repository, report.dependencyVersion)

      current.warnings = current.warnings.filter(warning => !warning.startsWith('Repository has uncommitted changes'))

      current.valid = current.warnings.length === 0 && current.integration.healthy

      Object.assign(repository, current)
    }
  }
}

const optionalConsumerAudit = async (root: string, version: string): Promise<LumenConsumerUpgradeAudit | undefined> => {
  try {
    await readFile(resolve(root, 'package.json'), 'utf8')
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return undefined

    throw error
  }

  if (version.startsWith('5.')) return inspectLumenConsumerUpgrade(root, version)

  return { findings: await inspectConsumerSource(root), repository: root, targetVersion: version }
}

export const migrateLumenVersion = async (
  options: LumenVersionMigrationOptions
): Promise<LumenVersionMigrationReport> => {
  const root = resolve(options.cwd ?? process.cwd())

  if (!(await lstat(root)).isDirectory()) throw new Error('Migration --cwd must be a project directory.')

  const files = await discoverSourceFiles(root, extensions)
  const ledgerPath = resolve(root, '.lumen', 'migrations-v4.json')

  if (options.version === 'v4') await checkLedgerLocation(root)

  const ledgerState: LedgerState = options.version === 'v4' ? await readLedger(ledgerPath) : { ledger: {} }
  const report = await createReport(options, root, files.length)

  if (options.dependencies) {
    report.dependencies = await applyLumenVersionMigrationDependencies(root, report.dependencyVersion, options)

    if (report.dependencies.repositories.some(repository => repository.commands.some(command => !command.ok))) {
      report.applied = false

      return report
    }
  }

  if (options.version === 'v4') {
    const sdk = await migrateLumenV4({ cwd: root })

    report.packageVersions = sdk.packageVersions

    report.manualReview.push(...sdk.manualReview.filter(finding => finding.rule === 'embedded-mcp-sdk-v2')
      .map(({ column, file, line, message }) => ({ column, file, kind: 'embedded-mcp-sdk' as const, line, message })))
  }

  for (const absoluteFile of files) {
    await migrateFile(absoluteFile, report, ledgerState, ledgerPath)
  }

  await refreshDependencyReport(report)

  const consumerAudit = await optionalConsumerAudit(root, report.dependencyVersion)

  if (consumerAudit) report.consumerAudit = consumerAudit

  return report
}

const formatManualReview = (findings: LumenVersionMigrationFinding[]): string[] => {
  const groups = new Map<string, string[]>()

  for (const { file, line, column, message } of findings) {
    const locations = groups.get(message) ?? []

    locations.push(`  ${file}:${line}:${column}`)

    groups.set(message, locations)
  }

  return [...groups].flatMap(([message, locations]) => [`[manual review] ${message}`, ...locations])
}

export const formatLumenVersionMigration = (report: LumenVersionMigrationReport): string => [
  `Lumen ${report.version} migration ${report.applied ? 'apply' : 'dry run'}: ${report.root}`,
  `Scanned ${report.filesScanned} source files. ${report.applied ? 'Applied' : 'Would apply'} ${report.changes.length} changes in ${report.changedFiles.length} files.`,
  ...report.changes.map(item => `${item.file}:${item.line}:${item.column} [${item.kind}] ${item.message}`),
  ...formatManualReview(report.manualReview),
  ...(report.dependencies ? [formatConsumerRollout(report.dependencies)] : []),
  ...(report.consumerAudit ? [formatLumenConsumerUpgradeAudit(report.consumerAudit)] : []),
  {
    v3: 'V3 requires coordinated package versions and a native rebuild, with no web source rewrites. Review exhaustive Swift LumenIconName switches for added cases.',
    v4: 'Review product CSS, pending dialogs, chart identity, native initializers, exhaustive Swift icon switches and embedded MCP SDK v2 integrations. Source changes do not qualify the application for release.',
    v5: 'V5 performs no automatic source rewrites. Review async Astro readiness and separately installed CLI; delivery and recipes are optional adoption. The candidate contract does not establish publication availability.'
  }[report.version],
  report.version === 'v5' ?
    'Use --dependencies to inventory or upgrade npm packages to their individual bundled release-manifest versions through the existing pnpm rollout. Native Swift/Maven pins remain application-owned.' :
    `Use --dependencies to inventory or upgrade the coordinated npm family to ${report.dependencyVersion} through the existing pnpm rollout. Native Swift/Maven pins remain application-owned.`,
  ...(!report.applied && report.changes.length ? [`Run lumen migrate ${report.version} --apply to write the source changes.`] : [])
].join('\n')
