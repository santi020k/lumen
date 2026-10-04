import { createHash } from 'node:crypto'
import { lstat, mkdir, readFile, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'

import { formatConsumerRollout, inspectLumenConsumer } from './consumer-rollout.js'
import { discoverSourceFiles } from './v2-migration.js'
import { migrateLumenV4 } from './v4-migration.js'
import {
  applyLumenVersionMigrationDependencies,
  type LumenMigrationDependencyOptions
} from './version-migration-dependencies.js'
import { migrateLumenVersionSource } from './version-migration-source.js'

export { migrateLumenVersionSource } from './version-migration-source.js'

export type LumenMigrationVersion = 'v3' | 'v4'
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

const readLedger = async (path: string): Promise<Record<string, string>> => {
  let source: string

  try {
    source = await readFile(path, 'utf8')
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return {}

    throw error
  }

  const value: unknown = JSON.parse(source)

  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Invalid migration ledger: ${path}`)

  const entries = Object.entries(value)

  if (entries.some(([, hash]) => typeof hash !== 'string' || !/^[a-f0-9]{64}$/u.test(hash))) throw new Error(`Invalid migration ledger: ${path}`)

  return Object.fromEntries(entries.map(([file, hash]) => [file, String(hash)]))
}

const migrateFile = async (
  absoluteFile: string,
  report: LumenVersionMigrationReport,
  ledger: Record<string, string>,
  ledgerPath: string
): Promise<void> => {
  const file = relative(report.root, absoluteFile) || absoluteFile
  const source = await readFile(absoluteFile, 'utf8')

  if (report.version === 'v4' && Object.hasOwn(ledger, file)) {
    if (ledger[file] !== fingerprint(source)) report.manualReview.push({ file,
      line: 1,
      column: 1,
      kind: 'layout-gap',
      message: 'This file was already migrated to v4 and has since changed. Review new edits manually; repeating gap rewrites would change spacing twice.' })

    return
  }

  const migration = migrateLumenVersionSource(source, file, report.version)

  report.changes.push(...migration.changes)

  report.manualReview.push(...migration.manualReview)

  if (source === migration.source) return

  report.changedFiles.push(file)

  if (!report.applied) return

  // Write the intended fingerprint first so an interrupted apply cannot double-rewrite gaps.
  await mkdir(resolve(report.root, '.lumen'), { recursive: true })

  ledger[file] = fingerprint(migration.source)

  await writeFile(ledgerPath, `${JSON.stringify(ledger, undefined, 2)}\n`, 'utf8')

  await writeFile(absoluteFile, migration.source, 'utf8')
}

const createReport = (
  options: LumenVersionMigrationOptions, root: string, filesScanned: number
): LumenVersionMigrationReport => ({
  applied: options.apply === true,
  changedFiles: [],
  changes: [],
  filesScanned,
  manualReview: [],
  root,
  version: options.version,
  dependencyVersion: options.version === 'v3' ? '3.0.1' : '4.0.0'
})

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

export const migrateLumenVersion = async (
  options: LumenVersionMigrationOptions
): Promise<LumenVersionMigrationReport> => {
  const root = resolve(options.cwd ?? process.cwd())

  if (!(await lstat(root)).isDirectory()) throw new Error('Migration --cwd must be a project directory.')

  const files = await discoverSourceFiles(root, extensions)
  const ledgerPath = resolve(root, '.lumen', 'migrations-v4.json')

  await checkLedgerLocation(root)

  const ledger = options.version === 'v4' ? await readLedger(ledgerPath) : {}
  const report = createReport(options, root, files.length)

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
    await migrateFile(absoluteFile, report, ledger, ledgerPath)
  }

  await refreshDependencyReport(report)

  return report
}

export const formatLumenVersionMigration = (report: LumenVersionMigrationReport): string => [
  `Lumen ${report.version} migration ${report.applied ? 'apply' : 'dry run'}: ${report.root}`,
  `Scanned ${report.filesScanned} source files. ${report.applied ? 'Applied' : 'Would apply'} ${report.changes.length} changes in ${report.changedFiles.length} files.`,
  ...report.changes.map(item => `${item.file}:${item.line}:${item.column} [${item.kind}] ${item.message}`),
  ...report.manualReview.map(item => `${item.file}:${item.line}:${item.column} [manual review] ${item.message}`),
  ...(report.dependencies ? [formatConsumerRollout(report.dependencies)] : []),
  report.version === 'v3' ?
    'V3 requires coordinated package versions and a native rebuild, with no web source rewrites. Review exhaustive Swift LumenIconName switches for added cases.' :
    'Review product CSS, pending dialogs, chart identity, native initializers, exhaustive Swift icon switches and embedded MCP SDK v2 integrations. Source changes do not qualify the application for release.',
  `Use --dependencies to inventory or upgrade the coordinated npm family to ${report.dependencyVersion} through the existing pnpm rollout. Native Swift/Maven pins remain application-owned.`,
  ...(!report.applied && report.changes.length ? [`Run lumen migrate ${report.version} --apply to write the source changes.`] : [])
].join('\n')
