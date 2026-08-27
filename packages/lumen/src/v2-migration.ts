import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { extname, relative, resolve } from 'node:path'

const ASTRO_PACKAGE = '@santi020k/lumen-astro'
const ASTRO_RUNTIME_PACKAGE = '@santi020k/lumen-astro/runtime'
const REACT_PACKAGE = '@santi020k/lumen-react'
const REACT_NATIVE_PACKAGE = '@santi020k/lumen-react-native'
const REACT_NATIVE_DATETIME_PACKAGE = '@santi020k/lumen-react-native/datetime'

const SOURCE_EXTENSIONS = new Set([
  '.astro',
  '.htm',
  '.html',
  '.js',
  '.jsx',
  '.ts',
  '.tsx'
])

const IGNORED_DIRECTORIES = new Set([
  '.astro',
  '.git',
  '.next',
  '.output',
  'build',
  'coverage',
  'dist',
  'node_modules'
])

const VISUAL_SIZE_ALIASES = new Set(['default', 'lg', 'sm'])

export type LumenV2MigrationKind =
  | 'astro-runtime-subpath' |
  'react-native-datetime-subpath' |
  'sonner-alias-removal' |
  'visual-size-alias-removal'

export interface LumenV2MigrationFinding {
  column: number
  file: string
  kind: LumenV2MigrationKind
  line: number
  message: string
}

export interface LumenV2SourceMigration {
  changes: LumenV2MigrationFinding[]
  manualReview: LumenV2MigrationFinding[]
  source: string
}

export interface LumenV2MigrationOptions {
  apply?: boolean
  cwd?: string
}

export interface LumenV2MigrationReport {
  applied: boolean
  changedFiles: string[]
  changes: LumenV2MigrationFinding[]
  filesScanned: number
  manualReview: LumenV2MigrationFinding[]
  root: string
}

interface SourceEdit {
  end: number
  replacement: string
  start: number
}

interface ImportStatement {
  clause: string
  end: number
  module: string
  quote: '\'' | '"'
  semicolon: boolean
  start: number
}

interface NamedImport {
  imported: string
  local: string
  source: string
  typeOnly: boolean
}

interface ParsedNamedImports {
  close: number
  complete: boolean
  imports: NamedImport[]
  open: number
}

interface MarkupAttribute {
  end: number
  name: string
  nameEnd: number
  nameStart: number
  start: number
  value: string | undefined
  valueKind: 'boolean' | 'expression' | 'literal'
}

interface ParsedMarkupAttribute {
  attribute?: MarkupAttribute
  cursor: number
}

const isIdentifierCharacter = (value: string | undefined): boolean => Boolean(value && /[\w$]/u.test(value))
const isQuote = (value: string | undefined): value is '\'' | '"' | '`' => value === '\'' || value === '"' || value === '`'

const hasKeywordBoundary = (
  source: string,
  start: number,
  keyword: string
): boolean => !isIdentifierCharacter(source[start - 1]) &&
  !isIdentifierCharacter(source[start + keyword.length])

const isSafeImportClause = (clause: string): boolean => !clause.includes(';') &&
  !clause.includes('\'') &&
  !clause.includes('"') &&
  !/\bexport\b/u.test(clause)

const isImportContext = (
  source: string,
  importStart: number,
  fromStart: number,
  moduleStart: number
): boolean => {
  if (fromStart < 0 || importStart < 0) return false

  if (!hasKeywordBoundary(source, importStart, 'import')) return false

  if (!hasKeywordBoundary(source, fromStart, 'from')) return false

  const lineStart = source.lastIndexOf('\n', importStart) + 1

  if (source.slice(lineStart, importStart).trim() !== '') return false

  const clause = source.slice(importStart + 'import'.length, fromStart)

  if (!isSafeImportClause(clause)) return false

  return source.slice(fromStart + 'from'.length, moduleStart).trim() === ''
}

const getLocation = (
  source: string,
  index: number
): Pick<LumenV2MigrationFinding, 'column' | 'line'> => {
  let line = 1
  let lineStart = 0

  for (let cursor = 0; cursor < index; cursor += 1) {
    if (source[cursor] === '\n') {
      line += 1

      lineStart = cursor + 1
    }
  }

  return { column: index - lineStart + 1, line }
}

const createFinding = (
  source: string,
  file: string,
  index: number,
  kind: LumenV2MigrationKind,
  message: string
): LumenV2MigrationFinding => ({
  ...getLocation(source, index),
  file,
  kind,
  message
})

const findImportStatements = (
  source: string,
  module: string
): ImportStatement[] => {
  const statements: ImportStatement[] = []

  for (const quote of ['\'', '"'] as const) {
    const needle = `${quote}${module}${quote}`
    let moduleStart = source.indexOf(needle)

    while (moduleStart >= 0) {
      const fromStart = source.lastIndexOf('from', moduleStart)

      const importStart =
        fromStart >= 0 ? source.lastIndexOf('import', fromStart) : -1

      if (isImportContext(source, importStart, fromStart, moduleStart)) {
        const afterModule = moduleStart + needle.length
        const semicolon = source[afterModule] === ';'

        statements.push({
          clause: source.slice(importStart + 'import'.length, fromStart).trim(),
          end: afterModule + (semicolon ? 1 : 0),
          module,
          quote,
          semicolon,
          start: importStart
        })
      }

      moduleStart = source.indexOf(needle, moduleStart + needle.length)
    }
  }

  return statements.sort((left, right) => left.start - right.start)
}

const parseNamedImports = (clause: string): ParsedNamedImports | undefined => {
  const open = clause.indexOf('{')
  const close = clause.lastIndexOf('}')

  if (open < 0 || close <= open) return undefined

  const sources = clause
    .slice(open + 1, close)
    .split(',')
    .map(source => source.trim())
    .filter(Boolean)

  const imports = sources.flatMap(source => {
    const match =
      /^(type\s+)?([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/u.exec(
        source
      )

    return match?.[2] ?
      [
        {
          imported: match[2],
          local: match[3] ?? match[2],
          source,
          typeOnly: Boolean(match[1])
        }
      ] :
      []
  })

  return { close, complete: imports.length === sources.length, imports, open }
}

const getDefaultImport = (clause: string): string | undefined => {
  const beforeNamed = clause.split('{', 1)[0]?.trim().replace(/,$/u, '').trim()

  return beforeNamed && /^[A-Za-z_$][\w$]*$/u.test(beforeNamed) ?
    beforeNamed :
    undefined
}

const formatImport = (clause: string, statement: ImportStatement): string => `import ${clause} from ${statement.quote}${statement.module}${statement.quote}${statement.semicolon ? ';' : ''}`

const applyEdits = (source: string, edits: SourceEdit[]): string => edits
  .sort((left, right) => right.start - left.start)
  .reduce(
    (result, edit) => `${result.slice(0, edit.start)}${edit.replacement}${result.slice(edit.end)}`,
    source
  )

const findBalancedEnd = (
  source: string,
  start: number,
  opening: string,
  closing: string
): number => {
  let depth = 0
  let quote: '\'' | '"' | '`' | undefined

  for (let index = start; index < source.length; index += 1) {
    const character = source[index]

    if (quote) {
      if (character === '\\') {
        index += 1
      } else if (character === quote) {
        quote = undefined
      }

      continue
    }

    if (isQuote(character)) {
      quote = character
    } else if (character === opening) {
      depth += 1
    } else if (character === closing) {
      depth -= 1

      if (depth === 0) return index + 1
    }
  }

  return source.length
}

const skipWhitespace = (source: string, start: number, end: number): number => {
  let cursor = start

  while (cursor < end && /\s/u.test(source[cursor] ?? '')) cursor += 1

  return cursor
}

const findQuotedEnd = (
  source: string,
  start: number,
  end: number,
  quote: '\'' | '"'
): number => {
  let cursor = start

  while (cursor < end && source[cursor] !== quote)
    cursor += source[cursor] === '\\' ? 2 : 1

  return cursor
}

const createAttribute = (
  start: number,
  nameEnd: number,
  name: string,
  end: number,
  value: string | undefined,
  valueKind: MarkupAttribute['valueKind']
): MarkupAttribute => ({
  end,
  name,
  nameEnd,
  nameStart: start,
  start,
  value,
  valueKind
})

const parseMarkupAttributeValue = (
  source: string,
  attributeStart: number,
  nameEnd: number,
  name: string,
  valueStart: number,
  end: number
): ParsedMarkupAttribute => {
  const character = source[valueStart]

  if (character === '\'' || character === '"') {
    const contentStart = valueStart + 1
    const contentEnd = findQuotedEnd(source, contentStart, end, character)
    const cursor = Math.min(contentEnd + 1, end)

    return {
      attribute: createAttribute(
        attributeStart,
        nameEnd,
        name,
        cursor,
        source.slice(contentStart, contentEnd),
        'literal'
      ),
      cursor
    }
  }

  if (character === '{') {
    const cursor = findBalancedEnd(source, valueStart, '{', '}')

    return {
      attribute: createAttribute(
        attributeStart,
        nameEnd,
        name,
        cursor,
        source.slice(valueStart + 1, cursor - 1).trim(),
        'expression'
      ),
      cursor
    }
  }

  let cursor = valueStart

  while (cursor < end && /[^\s>]/u.test(source[cursor] ?? '')) cursor += 1

  return {
    attribute: createAttribute(
      attributeStart,
      nameEnd,
      name,
      cursor,
      source.slice(valueStart, cursor),
      'literal'
    ),
    cursor
  }
}

const parseMarkupAttribute = (
  source: string,
  start: number,
  end: number
): ParsedMarkupAttribute => {
  if (source[start] === '{') {
    const cursor = findBalancedEnd(source, start, '{', '}')
    const expression = source.slice(start + 1, cursor - 1).trim()

    return expression === 'size' ?
      {
        attribute: createAttribute(
          start,
          start + 1,
          'size',
          cursor,
          expression,
          'expression'
        ),
        cursor
      } :
      { cursor }
  }

  let nameEnd = start

  while (nameEnd < end && /[^\s=/>]/u.test(source[nameEnd] ?? '')) nameEnd += 1

  const name = source.slice(start, nameEnd)
  const equalsStart = skipWhitespace(source, nameEnd, end)

  if (source[equalsStart] !== '=') {
    return {
      attribute: createAttribute(
        start,
        nameEnd,
        name,
        equalsStart,
        undefined,
        'boolean'
      ),
      cursor: equalsStart
    }
  }

  const valueStart = skipWhitespace(source, equalsStart + 1, end)

  return parseMarkupAttributeValue(
    source,
    start,
    nameEnd,
    name,
    valueStart,
    end
  )
}

const parseMarkupAttributes = (
  source: string,
  start: number,
  end: number
): MarkupAttribute[] => {
  const attributes: MarkupAttribute[] = []
  let cursor = start

  while (cursor < end) {
    cursor = skipWhitespace(source, cursor, end)

    if (cursor >= end || source[cursor] === '/' || source[cursor] === '>')
      break

    const parsed = parseMarkupAttribute(source, cursor, end)

    if (parsed.attribute) attributes.push(parsed.attribute)

    cursor = parsed.cursor
  }

  return attributes
}

const isMarkupQuoteStart = (
  character: string | undefined,
  braceDepth: number
): character is '\'' | '"' | '`' => isQuote(character) && (character !== '`' || braceDepth > 0)

const advanceQuotedSource = (
  character: string | undefined,
  quote: '\'' | '"' | '`'
): { close: boolean, skip: boolean } => ({
  close: character === quote,
  skip: character === '\\'
})

const findMarkupTagEnd = (source: string, start: number): number => {
  let braceDepth = 0
  let quote: '\'' | '"' | '`' | undefined

  for (let index = start; index < source.length; index += 1) {
    const character = source[index]

    if (quote) {
      const quoted = advanceQuotedSource(character, quote)

      if (quoted.skip) index += 1

      if (quoted.close) quote = undefined

      continue
    }

    if (isMarkupQuoteStart(character, braceDepth)) quote = character
    else if (character === '{') braceDepth += 1
    else if (character === '}') braceDepth = Math.max(0, braceDepth - 1)
    else if (character === '>' && braceDepth === 0) return index
  }

  return source.length
}

const collectAstroComponentNames = (
  source: string
): Map<string, 'Input' | 'NativeSelect'> => {
  const componentNames = new Map<string, 'Input' | 'NativeSelect'>()

  for (const statement of findImportStatements(source, ASTRO_PACKAGE)) {
    const named = parseNamedImports(statement.clause)

    for (const imported of named?.imports ?? []) {
      if (
        imported.imported === 'Input' ||
        imported.imported === 'NativeSelect'
      ) {
        componentNames.set(imported.local, imported.imported)
      }
    }
  }

  return componentNames
}

const createRuntimeReplacement = (
  statement: ImportStatement,
  named: ParsedNamedImports,
  runtimeSpecifier: NamedImport,
  runtimeAlreadyImported: boolean
): string => {
  const remaining = named.imports.filter(
    item => item.imported !== 'UIPrimitives'
  )

  const prefix = statement.clause
    .slice(0, named.open)
    .trim()
    .replace(/,$/u, '')
    .trim()

  const suffix = statement.clause.slice(named.close + 1).trim()
  const separator = prefix && remaining.length ? ', ' : ' '

  const remainingClause = [
    prefix,
    remaining.length ?
      `{ ${remaining.map(item => item.source).join(', ')} }` :
      '',
    suffix
  ]
    .filter(Boolean)
    .join(separator)

  const runtimeStatement = runtimeAlreadyImported ?
    '' :
    `import ${runtimeSpecifier.local} from ${statement.quote}${ASTRO_RUNTIME_PACKAGE}${statement.quote}${statement.semicolon ? ';' : ''}`

  const rootStatement = remainingClause ?
    formatImport(remainingClause, statement) :
    ''

  return [rootStatement, runtimeStatement].filter(Boolean).join('\n')
}

const createRuntimeReview = (
  source: string,
  file: string,
  statement: ImportStatement,
  message: string
): LumenV2MigrationFinding => createFinding(
  source,
  file,
  statement.start,
  'astro-runtime-subpath',
  message
)

const migrateRuntimeImports = (
  source: string,
  file: string
): Pick<LumenV2SourceMigration, 'changes' | 'manualReview' | 'source'> => {
  const changes: LumenV2MigrationFinding[] = []
  const manualReview: LumenV2MigrationFinding[] = []
  const edits: SourceEdit[] = []
  const runtimeImports = findImportStatements(source, ASTRO_RUNTIME_PACKAGE)

  let runtimeLocal = runtimeImports
    .map(statement => getDefaultImport(statement.clause))
    .find(Boolean)

  for (const statement of findImportStatements(source, ASTRO_PACKAGE)) {
    const named = parseNamedImports(statement.clause)

    if (!named) {
      if (statement.clause.includes('UIPrimitives')) {
        manualReview.push(
          createRuntimeReview(
            source,
            file,
            statement,
            'UIPrimitives is part of an import that cannot be rewritten safely.'
          )
        )
      }

      continue
    }

    const runtimeSpecifier = named.imports.find(
      item => item.imported === 'UIPrimitives'
    )

    if (!runtimeSpecifier) {
      if (
        statement.clause
          .slice(named.open + 1, named.close)
          .includes('UIPrimitives')
      ) {
        manualReview.push(
          createRuntimeReview(
            source,
            file,
            statement,
            'UIPrimitives is part of an import that cannot be rewritten safely.'
          )
        )
      }

      continue
    }

    if (!named.complete || runtimeSpecifier.typeOnly) {
      manualReview.push(
        createRuntimeReview(
          source,
          file,
          statement,
          'UIPrimitives is part of an import that cannot be rewritten safely.'
        )
      )

      continue
    }

    if (runtimeLocal && runtimeLocal !== runtimeSpecifier.local) {
      manualReview.push(
        createRuntimeReview(
          source,
          file,
          statement,
          `UIPrimitives uses the local name ${runtimeSpecifier.local}, but the runtime subpath is already imported as ${runtimeLocal}.`
        )
      )

      continue
    }

    const replacement = createRuntimeReplacement(
      statement,
      named,
      runtimeSpecifier,
      Boolean(runtimeLocal)
    )

    edits.push({ end: statement.end, replacement, start: statement.start })

    changes.push(
      createFinding(
        source,
        file,
        statement.start,
        'astro-runtime-subpath',
        `Move ${runtimeSpecifier.local} to the @santi020k/lumen-astro/runtime default import.`
      )
    )

    runtimeLocal = runtimeSpecifier.local
  }

  return { changes, manualReview, source: applyEdits(source, edits) }
}

const getTagNameEnd = (source: string, start: number): number => {
  let end = start

  while (/[\w:.-]/u.test(source[end] ?? '')) end += 1

  return end
}

const getVisualSizeAttributeName = (
  tagName: string,
  astroComponents: Map<string, 'Input' | 'NativeSelect'>
): 'visual-size' | 'visualSize' | undefined => {
  if (astroComponents.has(tagName)) return 'visualSize'

  if (tagName === 'lumen-input' || tagName === 'lumen-native-select')
    return 'visual-size'

  return undefined
}

const inspectVisualSize = (
  source: string,
  file: string,
  tagName: string,
  replacementName: 'visual-size' | 'visualSize',
  attributes: MarkupAttribute[]
): {
  change?: LumenV2MigrationFinding
  edit?: SourceEdit
  review?: LumenV2MigrationFinding
} => {
  const size = attributes.find(attribute => attribute.name === 'size')

  if (!size) return {}

  const existingReplacement = attributes.some(
    attribute => attribute.name === replacementName
  )

  const literalAlias =
    size.valueKind === 'literal' &&
    size.value !== undefined &&
    VISUAL_SIZE_ALIASES.has(size.value)

  const numericValue = size.value !== undefined && /^\d+$/u.test(size.value)

  if (literalAlias && !existingReplacement) {
    return {
      change: createFinding(
        source,
        file,
        size.nameStart,
        'visual-size-alias-removal',
        `Rename ${tagName} size=${JSON.stringify(size.value)} to ${replacementName}.`
      ),
      edit: {
        end: size.nameEnd,
        replacement: replacementName,
        start: size.nameStart
      }
    }
  }

  if (numericValue) return {}

  const message = existingReplacement ?
    `${tagName} declares both size and ${replacementName}; choose the intended native and visual sizes manually.` :
    `${tagName} has a non-numeric, non-migratable size value; review it manually.`

  return {
    review: createFinding(
      source,
      file,
      size.start,
      'visual-size-alias-removal',
      message
    )
  }
}

const getMarkupStart = (source: string, file: string): number => {
  if (!file.endsWith('.astro')) return 0

  const opening = /^(?:\uFEFF)?\s*---\s*(?:\r?\n|$)/u.exec(source)

  if (!opening) return 0

  const closing = source.indexOf('\n---', opening[0].length)

  return closing < 0 ? source.length : closing + '\n---'.length
}

const appendVisualInspection = (
  inspection: ReturnType<typeof inspectVisualSize>,
  edits: SourceEdit[],
  changes: LumenV2MigrationFinding[],
  manualReview: LumenV2MigrationFinding[]
): void => {
  if (inspection.edit) edits.push(inspection.edit)

  if (inspection.change) changes.push(inspection.change)

  if (inspection.review) manualReview.push(inspection.review)
}

const migrateVisualSizes = (
  source: string,
  file: string,
  astroComponents: Map<string, 'Input' | 'NativeSelect'>
): Pick<LumenV2SourceMigration, 'changes' | 'manualReview' | 'source'> => {
  const changes: LumenV2MigrationFinding[] = []
  const manualReview: LumenV2MigrationFinding[] = []
  const edits: SourceEdit[] = []
  let cursor = getMarkupStart(source, file)

  while (cursor < source.length) {
    const tagStart = source.indexOf('<', cursor)

    if (tagStart < 0) break

    const nameStart = tagStart + 1

    if (source.startsWith('!--', nameStart)) {
      const commentEnd = source.indexOf('-->', nameStart + 3)

      cursor = commentEnd < 0 ? source.length : commentEnd + 3

      continue
    }

    if (source[nameStart] === '/') {
      cursor = nameStart + 1

      continue
    }

    const nameEnd = getTagNameEnd(source, nameStart)
    const tagName = source.slice(nameStart, nameEnd)

    const replacementName = getVisualSizeAttributeName(
      tagName,
      astroComponents
    )

    if (!replacementName) {
      cursor = nameEnd || nameStart

      continue
    }

    const tagEnd = findMarkupTagEnd(source, nameEnd)
    const attributes = parseMarkupAttributes(source, nameEnd, tagEnd)

    const inspection = inspectVisualSize(
      source,
      file,
      tagName,
      replacementName,
      attributes
    )

    appendVisualInspection(inspection, edits, changes, manualReview)

    cursor = Math.min(tagEnd + 1, source.length)
  }

  return { changes, manualReview, source: applyEdits(source, edits) }
}

const formatNamedImport = (item: NamedImport, imported: string): string => {
  const prefix = item.typeOnly ? 'type ' : ''
  const alias = item.local === imported ? '' : ` as ${item.local}`

  return `${prefix}${imported}${alias}`
}

const getSonnerReplacement = (imported: string): string | undefined => {
  if (imported === 'Sonner') return 'ToastViewport'

  if (imported === 'SonnerProps') return 'ToastViewportProps'

  return undefined
}

const createNamedImportReplacement = (
  statement: ImportStatement,
  named: ParsedNamedImports
): string => {
  const prefix = statement.clause
    .slice(0, named.open)
    .trim()
    .replace(/,$/u, '')
    .trim()

  const suffix = statement.clause.slice(named.close + 1).trim()

  const imports = named.imports
    .map(item => formatNamedImport(
      item,
      getSonnerReplacement(item.imported) ?? item.imported
    ))
    .sort((left, right) => left.localeCompare(right))

  const separator = prefix && imports.length ? ', ' : ' '

  const clause = [prefix, `{ ${imports.join(', ')} }`, suffix]
    .filter(Boolean)
    .join(separator)

  return formatImport(clause, statement)
}

const migrateSonnerImports = (
  source: string,
  file: string
): Pick<LumenV2SourceMigration, 'changes' | 'manualReview' | 'source'> => {
  const changes: LumenV2MigrationFinding[] = []
  const manualReview: LumenV2MigrationFinding[] = []
  const edits: SourceEdit[] = []

  for (const packageName of [ASTRO_PACKAGE, REACT_PACKAGE]) {
    for (const statement of findImportStatements(source, packageName)) {
      const named = parseNamedImports(statement.clause)
      const mentionsSonner = statement.clause.includes('Sonner')

      if (!mentionsSonner) continue

      const replacements =
        named?.imports.flatMap(item => {
          const replacement = getSonnerReplacement(item.imported)

          return replacement ? [{ item, replacement }] : []
        }) ?? []

      if (!named?.complete) {
        manualReview.push(
          createFinding(
            source,
            file,
            statement.start,
            'sonner-alias-removal',
            'Sonner is part of an import that cannot be rewritten safely.'
          )
        )

        continue
      }

      if (replacements.length === 0) continue

      edits.push({
        end: statement.end,
        replacement: createNamedImportReplacement(statement, named),
        start: statement.start
      })

      for (const { item, replacement } of replacements) {
        changes.push(
          createFinding(
            source,
            file,
            statement.start,
            'sonner-alias-removal',
            `Replace ${item.imported} with ${replacement} while preserving the local name ${item.local}.`
          )
        )
      }
    }
  }

  return { changes, manualReview, source: applyEdits(source, edits) }
}

const REACT_NATIVE_DATETIME_EXPORTS = new Set([
  'LumenDateField',
  'LumenDateFieldProps',
  'LumenDateRangeField',
  'LumenDateRangeFieldProps',
  'LumenDateRangeValue'
])

const createReactNativeDatetimeReview = (
  source: string,
  file: string,
  statement: ImportStatement,
  message: string
): LumenV2MigrationFinding => createFinding(
  source,
  file,
  statement.start,
  'react-native-datetime-subpath',
  message
)

type ReactNativeDatetimeImportPlan =
  | { kind: 'irrelevant' } |
  { kind: 'unsafe' } |
  {
    datetimeImports: NamedImport[]
    kind: 'migrate'
    remaining: NamedImport[]
    typePrefix: string
  }

const isSafeReactNativeDatetimeClause = (
  named: ParsedNamedImports | undefined,
  prefix: string,
  suffix: string
): named is ParsedNamedImports => Boolean(
  named?.complete && (prefix === '' || prefix === 'type') && suffix === ''
)

const planReactNativeDatetimeImport = (
  statement: ImportStatement
): ReactNativeDatetimeImportPlan => {
  const mentionsDatetime = [...REACT_NATIVE_DATETIME_EXPORTS].some(
    exportName => statement.clause.includes(exportName)
  )

  if (!mentionsDatetime) return { kind: 'irrelevant' }

  const named = parseNamedImports(statement.clause)

  const prefix = named ?
    statement.clause.slice(0, named.open).trim().replace(/,$/u, '').trim() :
    ''

  const suffix = named ? statement.clause.slice(named.close + 1).trim() : ''

  if (!isSafeReactNativeDatetimeClause(named, prefix, suffix))
    return { kind: 'unsafe' }

  const datetimeImports = named.imports.filter(item => REACT_NATIVE_DATETIME_EXPORTS.has(item.imported))

  if (datetimeImports.length === 0) return { kind: 'irrelevant' }

  return {
    datetimeImports,
    kind: 'migrate',
    remaining: named.imports.filter(
      item => !REACT_NATIVE_DATETIME_EXPORTS.has(item.imported)
    ),
    typePrefix: prefix === 'type' ? 'type ' : ''
  }
}

const migrateReactNativeDatetimeStatement = (
  source: string,
  file: string,
  statement: ImportStatement,
  datetimeSubpathImported: boolean
): {
  changes: LumenV2MigrationFinding[]
  edit?: SourceEdit
  review?: LumenV2MigrationFinding
} => {
  const plan = planReactNativeDatetimeImport(statement)

  if (plan.kind === 'irrelevant') return { changes: [] }

  if (plan.kind === 'unsafe') {
    return {
      changes: [],
      review: createReactNativeDatetimeReview(
        source,
        file,
        statement,
        'React Native datetime exports are part of an import that cannot be rewritten safely.'
      )
    }
  }

  if (datetimeSubpathImported) {
    return {
      changes: [],
      review: createReactNativeDatetimeReview(
        source,
        file,
        statement,
        'The datetime subpath is already imported; merge the remaining root datetime exports manually.'
      )
    }
  }

  const rootStatement =
    plan.remaining.length > 0 ?
      `import ${plan.typePrefix}{ ${plan.remaining.map(item => item.source).join(', ')} } from ${statement.quote}${REACT_NATIVE_PACKAGE}${statement.quote}${statement.semicolon ? ';' : ''}` :
      ''

  const datetimeStatement = `import ${plan.typePrefix}{ ${plan.datetimeImports.map(item => item.source).join(', ')} } from ${statement.quote}${REACT_NATIVE_DATETIME_PACKAGE}${statement.quote}${statement.semicolon ? ';' : ''}`

  return {
    changes: plan.datetimeImports.map(item => createFinding(
      source,
      file,
      statement.start,
      'react-native-datetime-subpath',
      `Move ${item.imported} to ${REACT_NATIVE_DATETIME_PACKAGE} while preserving the local name ${item.local}.`
    )),
    edit: {
      end: statement.end,
      replacement: [rootStatement, datetimeStatement]
        .filter(Boolean)
        .join('\n'),
      start: statement.start
    }
  }
}

const migrateReactNativeDatetimeImports = (
  source: string,
  file: string
): Pick<LumenV2SourceMigration, 'changes' | 'manualReview' | 'source'> => {
  const changes: LumenV2MigrationFinding[] = []
  const manualReview: LumenV2MigrationFinding[] = []
  const edits: SourceEdit[] = []

  const existingDatetimeImports = findImportStatements(
    source,
    REACT_NATIVE_DATETIME_PACKAGE
  )

  for (const statement of findImportStatements(source, REACT_NATIVE_PACKAGE)) {
    const result = migrateReactNativeDatetimeStatement(
      source,
      file,
      statement,
      existingDatetimeImports.length > 0
    )

    changes.push(...result.changes)

    if (result.edit) edits.push(result.edit)

    if (result.review) manualReview.push(result.review)
  }

  return { changes, manualReview, source: applyEdits(source, edits) }
}

const getRawElementEnd = (
  source: string,
  tagName: string,
  start: number
): number => {
  if (tagName !== 'script' && tagName !== 'style') return start

  const closing = source.toLowerCase().indexOf(`</${tagName}`, start)

  return closing < 0 ? source.length : closing
}

const migrateSonnerElements = (
  source: string,
  file: string
): Pick<LumenV2SourceMigration, 'changes' | 'manualReview' | 'source'> => {
  const changes: LumenV2MigrationFinding[] = []
  const edits: SourceEdit[] = []
  let cursor = getMarkupStart(source, file)

  while (cursor < source.length) {
    const tagStart = source.indexOf('<', cursor)

    if (tagStart < 0) break

    const closing = source[tagStart + 1] === '/'
    const nameStart = tagStart + (closing ? 2 : 1)

    if (source.startsWith('!--', tagStart + 1)) {
      const commentEnd = source.indexOf('-->', tagStart + 4)

      cursor = commentEnd < 0 ? source.length : commentEnd + 3

      continue
    }

    const nameEnd = getTagNameEnd(source, nameStart)
    const tagName = source.slice(nameStart, nameEnd)

    const rawElementEnd = closing ?
      nameEnd :
      getRawElementEnd(source, tagName.toLowerCase(), nameEnd)

    if (rawElementEnd !== nameEnd) {
      cursor = rawElementEnd

      continue
    }

    if (tagName === 'lumen-sonner') {
      edits.push({
        end: nameEnd,
        replacement: 'lumen-toast-viewport',
        start: nameStart
      })

      changes.push(
        createFinding(
          source,
          file,
          nameStart,
          'sonner-alias-removal',
          'Rename lumen-sonner to lumen-toast-viewport.'
        )
      )
    }

    cursor = nameEnd || nameStart
  }

  return { changes, manualReview: [], source: applyEdits(source, edits) }
}

export const migrateLumenV2Source = (
  source: string,
  file = '<source>'
): LumenV2SourceMigration => {
  const astro = file.endsWith('.astro')
  const markup = astro || file.endsWith('.htm') || file.endsWith('.html')

  const astroComponents = astro ?
    collectAstroComponentNames(source) :
    new Map<string, 'Input' | 'NativeSelect'>()

  const runtime = astro ?
    migrateRuntimeImports(source, file) :
    { changes: [], manualReview: [], source }

  const sonnerImports = migrateSonnerImports(runtime.source, file)

  const reactNativeDatetime = migrateReactNativeDatetimeImports(
    sonnerImports.source,
    file
  )

  if (!markup) {
    return {
      changes: [
        ...runtime.changes,
        ...sonnerImports.changes,
        ...reactNativeDatetime.changes
      ],
      manualReview: [
        ...runtime.manualReview,
        ...sonnerImports.manualReview,
        ...reactNativeDatetime.manualReview
      ],
      source: reactNativeDatetime.source
    }
  }

  const visualSizes = migrateVisualSizes(
    reactNativeDatetime.source,
    file,
    astroComponents
  )

  const sonnerElements = migrateSonnerElements(visualSizes.source, file)

  return {
    changes: [
      ...runtime.changes,
      ...sonnerImports.changes,
      ...reactNativeDatetime.changes,
      ...visualSizes.changes,
      ...sonnerElements.changes
    ],
    manualReview: [
      ...runtime.manualReview,
      ...sonnerImports.manualReview,
      ...reactNativeDatetime.manualReview,
      ...visualSizes.manualReview,
      ...sonnerElements.manualReview
    ],
    source: sonnerElements.source
  }
}

const discoverSourceFiles = async (path: string): Promise<string[]> => {
  const details = await stat(path)

  if (details.isFile())
    return SOURCE_EXTENSIONS.has(extname(path)) ? [path] : []

  const entries = await readdir(path, { withFileTypes: true })

  const nested = await Promise.all(
    entries
      .filter(
        entry => !entry.isDirectory() || !IGNORED_DIRECTORIES.has(entry.name)
      )
      .map(entry => discoverSourceFiles(resolve(path, entry.name)))
  )

  return nested.flat().sort()
}

export const migrateLumenV2 = async (
  options: LumenV2MigrationOptions = {}
): Promise<LumenV2MigrationReport> => {
  const root = resolve(options.cwd ?? process.cwd())
  const files = await discoverSourceFiles(root)
  const changedFiles: string[] = []
  const changes: LumenV2MigrationFinding[] = []
  const manualReview: LumenV2MigrationFinding[] = []

  for (const absoluteFile of files) {
    const file = relative(root, absoluteFile) || absoluteFile
    const source = await readFile(absoluteFile, 'utf8')
    const migration = migrateLumenV2Source(source, file)

    changes.push(...migration.changes)

    manualReview.push(...migration.manualReview)

    if (migration.source !== source) {
      changedFiles.push(file)

      if (options.apply)
        await writeFile(absoluteFile, migration.source, 'utf8')
    }
  }

  return {
    applied: options.apply === true,
    changedFiles,
    changes,
    filesScanned: files.length,
    manualReview,
    root
  }
}

export const formatLumenV2Migration = (
  report: LumenV2MigrationReport
): string => {
  const action = report.applied ? 'Applied' : 'Would apply'

  const lines = [
    `Lumen v2 migration ${report.applied ? 'apply' : 'dry run'}: ${report.root}`,
    `Scanned ${report.filesScanned} source file${report.filesScanned === 1 ? '' : 's'}.`,
    `${action} ${report.changes.length} change${report.changes.length === 1 ? '' : 's'} in ${report.changedFiles.length} file${report.changedFiles.length === 1 ? '' : 's'}.`,
    ...report.changes.map(
      finding => `- ${finding.file}:${finding.line}:${finding.column} [${finding.kind}] ${finding.message}`
    )
  ]

  if (report.manualReview.length) {
    lines.push(
      '',
      `Manual review required for ${report.manualReview.length} finding${report.manualReview.length === 1 ? '' : 's'}:`,
      ...report.manualReview.map(
        finding => `- ${finding.file}:${finding.line}:${finding.column} [${finding.kind}] ${finding.message}`
      )
    )
  }

  if (!report.applied && report.changes.length)
    lines.push('', 'Run lumen migrate v2 --apply to write these changes.')

  return lines.join('\n')
}
