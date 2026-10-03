import { readdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { extname, join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// cspell:words swiftpm

interface MigrationRule {
  id: string
  migration: string
  packages: string[]
  signals: string[]
}

export interface LumenV4MigrationFinding {
  column: number
  file: string
  line: number
  message: string
  rule: string
}

export interface LumenV4MigrationReport {
  applied: boolean
  changedFiles: string[]
  changes: LumenV4MigrationFinding[]
  filesScanned: number
  manualReview: LumenV4MigrationFinding[]
  packageVersions: Record<string, string>
  root: string
  targetVersion: string
}

interface Token {
  end: number
  kind: 'identifier' | 'punctuation' | 'string'
  start: number
  value: string
}

const modules: Readonly<Record<string, string>> = {
  '@modelcontextprotocol/sdk/client/index.js': '@modelcontextprotocol/client',
  '@modelcontextprotocol/sdk/client/stdio.js': '@modelcontextprotocol/client/stdio',
  '@modelcontextprotocol/sdk/server/mcp.js': '@modelcontextprotocol/server',
  '@modelcontextprotocol/sdk/server/stdio.js': '@modelcontextprotocol/server/stdio'
}

const sourceExtensions = new Set(['.astro', '.html', '.htm', '.js', '.jsx', '.mjs', '.ts', '.tsx', '.swift', '.kt', '.kts'])
const ignored = new Set(['.git', '.build', '.astro', '.next', '.expo', '.turbo', '.wrangler', '.swiftpm', 'node_modules', 'dist', 'build', 'coverage', 'Pods', 'DerivedData', 'vendor'])
const identifier = (character: string): boolean => /[A-Za-z0-9_$]/u.test(character)

const stringToken = (source: string, start: number, quote: string): Token => {
  let end = start + 1

  while (end < source.length && source[end] !== quote) end += source[end] === '\\' ? 2 : 1

  end = Math.min(end + 1, source.length)

  return { end, kind: 'string', start, value: source.slice(start + 1, end - 1) }
}

const commentAt = (source: string, start: number): number | undefined => {
  if (source.startsWith('//', start)) {
    const end = source.indexOf('\n', start + 2)

    return end < 0 ? source.length : end
  }

  if (source.startsWith('/*', start)) {
    const end = source.indexOf('*/', start + 2)

    return end < 0 ? source.length : end + 2
  }

  return undefined
}

// Comments and complete string/template literals are consumed once. Never edit text examples.
const tokenAt = (source: string, start: number): Token | number => {
  const character = source[start] ?? ''

  if (/\s/u.test(character)) return start + 1

  const commentEnd = commentAt(source, start)

  if (commentEnd !== undefined) return commentEnd

  if (['"', '\'', '`'].includes(character)) return stringToken(source, start, character)

  if (identifier(character)) {
    let end = start + 1

    while (end < source.length && identifier(source[end] ?? '')) end += 1

    return { end, kind: 'identifier', start, value: source.slice(start, end) }
  }

  return { end: start + 1, kind: 'punctuation', start, value: character }
}

const tokenize = (source: string): Token[] => {
  const tokens: Token[] = []
  let cursor = 0

  while (cursor < source.length) {
    const token = tokenAt(source, cursor)

    if (typeof token === 'number') cursor = token
    else {
      tokens.push(token)

      cursor = token.end
    }
  }

  return tokens
}

const location = (source: string, index: number): { column: number, line: number } => {
  const prefix = source.slice(0, index)

  return { column: index - prefix.lastIndexOf('\n'), line: prefix.split('\n').length }
}

interface ImportState { afterFrom: boolean, inImport: boolean }

interface SourceEdit { end: number, replacement: string, start: number }

const planImport = (source: string, token: Token, state: ImportState, startsLine: boolean): SourceEdit | undefined => {
  if (token.value === 'import') {
    state.inImport = startsLine

    state.afterFrom = false

    return undefined
  }

  if (!state.inImport) return undefined

  if ([';', '(', '='].includes(token.value)) {
    state.inImport = false

    return undefined
  }

  if (token.kind === 'identifier' && token.value === 'from') {
    state.afterFrom = true

    return undefined
  }

  if (token.kind !== 'string') return undefined

  state.inImport = false

  const replacement = modules[token.value]

  if (!state.afterFrom) return undefined

  if (!replacement) return undefined

  if (source[token.start] === '`') return undefined

  return { end: token.end - 1, replacement, start: token.start + 1 }
}

interface SourcePosition { blankPrefix: boolean, column: number, cursor: number, line: number }

const advancePosition = (source: string, end: number, position: SourcePosition): void => {
  while (position.cursor < end) {
    const character = source[position.cursor] ?? ''

    if (character === '\n') {
      position.line += 1

      position.column = 1

      position.blankPrefix = true
    } else {
      position.column += 1

      if (!/\s/u.test(character)) position.blankPrefix = false
    }

    position.cursor += 1
  }
}

export const migrateLumenV4Source = (source: string, file = '<source>'): {
  changes: LumenV4MigrationFinding[]
  source: string
} => {
  const edits: SourceEdit[] = []
  const changes: LumenV4MigrationFinding[] = []
  const state: ImportState = { afterFrom: false, inImport: false }
  const position: SourcePosition = { blankPrefix: true, column: 1, cursor: 0, line: 1 }

  for (const token of tokenize(source)) {
    advancePosition(source, token.start, position)

    const edit = planImport(source, token, state, position.blankPrefix)

    if (!edit) continue

    edits.push(edit)

    changes.push({
      column: position.column,
      line: position.line,
      file,
      message: `Replace ${token.value} with ${edit.replacement}; update SDK dependencies and rebuild together.`,
      rule: 'embedded-mcp-sdk-v2'
    })
  }

  let migrated = ''
  let cursor = 0

  for (const edit of edits) {
    migrated += source.slice(cursor, edit.start) + edit.replacement

    cursor = edit.end
  }

  return { changes, source: migrated + source.slice(cursor) }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

const strings = (value: unknown): string[] => {
  if (!Array.isArray(value) || !value.every((entry: unknown) => typeof entry === 'string')) throw new Error('Invalid v4 migration string list.')

  return value
}

const loadRules = async (): Promise<{ rules: MigrationRule[], targetVersion: string }> => {
  const value: unknown = JSON.parse(await readFile(new URL('../v4-migration.json', import.meta.url), 'utf8'))

  if (!isRecord(value) || typeof value.targetVersion !== 'string' || !Array.isArray(value.changes)) throw new Error('Invalid v4 migration contract.')

  const rules = value.changes.map((entry: unknown): MigrationRule => {
    if (!isRecord(entry) || typeof entry.id !== 'string' || typeof entry.migration !== 'string') throw new Error('Invalid v4 migration rule.')

    return {
      id: entry.id,
      migration: entry.migration,
      packages: strings(entry.packages),
      signals: strings(entry.signals)
    }
  })

  return { rules, targetVersion: value.targetVersion }
}

const discover = async (directory: string): Promise<string[]> => {
  const files: string[] = []

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue

    const path = join(directory, entry.name)

    if (entry.isDirectory() && !ignored.has(entry.name)) files.push(...await discover(path))
    else if (entry.isFile() && (sourceExtensions.has(extname(path)) || entry.name === 'package.json')) files.push(path)
  }

  return files.sort()
}

const resolveInstalled = async (path: string, name: string, range: string): Promise<string> => {
  const require = createRequire(pathToFileURL(path))

  try {
    const installed: unknown = JSON.parse(await readFile(require.resolve(`${name}/package.json`), 'utf8'))

    if (isRecord(installed) && typeof installed.version === 'string') return installed.version

    throw new Error(`Invalid installed package metadata for ${name}.`)
  } catch (error: unknown) {
    if (!isRecord(error) || !['MODULE_NOT_FOUND', 'ERR_PACKAGE_PATH_NOT_EXPORTED'].includes(String(error.code))) throw error

    return `unresolved:${range}`
  }
}

const inventoryGroup = async (path: string, group: unknown): Promise<Record<string, string>> => {
  const result: Record<string, string> = {}

  if (!isRecord(group)) return result

  for (const [name, range] of Object.entries(group)) {
    if (!name.startsWith('@santi020k/lumen') && !name.startsWith('@modelcontextprotocol/')) continue

    if (typeof range !== 'string') throw new Error(`Invalid dependency version for ${name}.`)

    result[name] = await resolveInstalled(path, name, range)
  }

  return result
}

const inventory = async (path: string): Promise<Record<string, string>> => {
  const value: unknown = JSON.parse(await readFile(path, 'utf8'))

  if (!isRecord(value)) throw new Error(`Invalid package manifest: ${path}`)

  const result: Record<string, string> = {}

  for (const group of [value.dependencies, value.devDependencies, value.peerDependencies]) {
    for (const [name, version] of Object.entries(await inventoryGroup(path, group))) result[name] = version
  }

  return result
}

const reviewSource = (source: string, file: string, rules: MigrationRule[]): LumenV4MigrationFinding[] => {
  const usesLumen = source.includes('lumen') || source.includes('LumenUI') || source.includes('Lumen')

  return rules.flatMap(rule => {
    if (!usesLumen && rule.id !== 'embedded-mcp-sdk-v2') return []

    const signal = rule.signals.find(value => source.includes(value))

    if (!signal) return []

    return [{ ...location(source, source.indexOf(signal)), file, message: rule.migration, rule: rule.id }]
  })
}

const migrateFile = async (path: string, rules: MigrationRule[], report: LumenV4MigrationReport): Promise<void> => {
  report.filesScanned += 1

  const file = relative(report.root, path)
  const source = await readFile(path, 'utf8')
  const webCode = ['.ts', '.js', '.mjs'].includes(extname(path))
  const migration = webCode ? migrateLumenV4Source(source, file) : { changes: [], source }

  report.changes.push(...migration.changes)

  report.manualReview.push(...reviewSource(source, file, rules))

  if (migration.source === source) return

  report.changedFiles.push(file)

  if (!report.applied) return

  if (await readFile(path, 'utf8') !== source) throw new Error(`Source changed during migration: ${file}`)

  await writeFile(path, migration.source, 'utf8')
}

export const migrateLumenV4 = async (
  options: { apply?: boolean | undefined, cwd?: string | undefined } = {}
): Promise<LumenV4MigrationReport> => {
  const root = resolve(options.cwd ?? process.cwd())
  const { rules, targetVersion } = await loadRules()

  const report: LumenV4MigrationReport = {
    applied: options.apply === true,
    changedFiles: [],
    changes: [],
    filesScanned: 0,
    manualReview: [],
    packageVersions: {},
    root,
    targetVersion
  }

  for (const path of await discover(root)) {
    if (path.endsWith('/package.json')) {
      for (const [name, version] of Object.entries(await inventory(path))) {
        report.packageVersions[`${relative(root, path)}:${name}`] = version
      }
    } else await migrateFile(path, rules, report)
  }

  return report
}

export const formatLumenV4Migration = (report: LumenV4MigrationReport): string => [
  `Lumen ${report.targetVersion} migration ${report.applied ? 'applied' : 'preview'}: ${report.filesScanned} source files`,
  ...report.changes.map(change => `${change.file}:${change.line}:${change.column} [edit] ${change.message}`),
  ...report.manualReview.map(change => `${change.file}:${change.line}:${change.column} [review] ${change.message}`),
  'Manual findings are review triggers, not proof of a defect. Verify dependency versions and consumer behavior before removing workarounds.'
].join('\n')
