import { scriptRegexRanges } from './source-script-ranges.js'
import {
  findBalancedEnd, findImportStatements, findMarkupTagEnd,
  getMarkupStart, getTagNameEnd, parseMarkupAttributes, parseNamedImports
} from './v2-migration.js'
import { migrateLumenV4Source } from './v4-migration.js'
import type { LumenMigrationVersion, LumenVersionMigrationFinding, LumenVersionSourceMigration } from './version-migration.js'

const layoutGaps: Readonly<Record<string, string>> = { lg: 'xl', md: 'group', xl: '2xl' }

const reviewComponents = new Map([
  ['Card', 'Review padding, child margins, media clipping and footer wrapping in the rendered application.'],
  ['Container', 'Review responsive gutters; use --ui-container-gutter only when a fixed gutter is intentional.'],
  ['Prose', 'Review reading-block margins and remove verified compensating offsets.'],
  ['Typography', 'Review first/last child margins and heading spacing.'],
  ['Button', 'Review direct-child selectors for .ui-button__content and loading/disabled descendants.'],
  ['DatePicker', 'Associate labels with the focusable trigger; the native input ID now ends in -native.'],
  ['Combobox', 'Review focus assumptions; the editable input retains focus with aria-activedescendant.'],
  ['Dialog', 'Review pending-state dismissal policy and focus restoration.'],
  ['DataTable', 'Use controlled sort/onSortChange and sortMode="manual" for server-paginated React results.'],
  ['BarChart', 'Review stable unique X identities, label formatting and application-owned chart patches.'],
  ['LineChart', 'Review stable unique X identities, label formatting and application-owned chart patches.']
])

const elementNames = new Map([
  ['lumen-stack', 'Stack'],
  ['lumen-grid', 'Grid'],
  ...[...reviewComponents.keys()].map(name => [
    `lumen-${name.replaceAll(/[A-Z]/gu, (letter, offset: number) => `${offset ? '-' : ''}${letter.toLowerCase()}`)}`,
    name
  ] as const)
])

interface Tag { end: number, name: string, nameEnd: number, start: number }

interface Edit { end: number, replacement: string, start: number }

interface SourceContext extends LumenVersionSourceMigration {
  components: Map<string, string>
  edits: Edit[]
  regexRanges: ReadonlyMap<number, number>
  finding: (offset: number, kind: LumenVersionMigrationFinding['kind'], message: string) => LumenVersionMigrationFinding
}

const lineStarts = (source: string): number[] => {
  const starts = [0]

  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === '\n') starts.push(index + 1)
  }

  return starts
}

const location = (starts: number[], offset: number): { column: number, line: number } => {
  let low = 0
  let high = starts.length

  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2)

    if ((starts[middle] ?? 0) <= offset) low = middle
    else high = middle
  }

  return { column: offset - (starts[low] ?? 0) + 1, line: low + 1 }
}

const skipQuoted = (source: string, start: number): number => {
  const quote = source[start]
  let cursor = start + 1

  while (cursor < source.length) {
    if (source[cursor] === '\\') cursor += 2
    else if (source[cursor++] === quote) return cursor
  }

  return source.length
}

const skipNonMarkup = (source: string, cursor: number, script: boolean): number => {
  const comment = [['<!--', '-->'], ...(script ? [['/*', '*/'], ['//', '\n']] : [])]
    .find(([opening]) => opening !== undefined && source.startsWith(opening, cursor))

  const ending = comment?.[1]

  if (ending) {
    const end = source.indexOf(ending, cursor + 2)

    return end < 0 ? source.length : end + ending.length
  }

  if (script && ['"', '\'', '`'].includes(source[cursor] ?? '')) return skipQuoted(source, cursor)

  return cursor
}

const realImportStarts = (source: string, exclusions: ReadonlyMap<number, number>): Set<number> => {
  const offsets = new Set<number>()
  let cursor = 0

  while (cursor < source.length) {
    const next = exclusions.get(cursor) ?? skipNonMarkup(source, cursor, true)

    if (next !== cursor) {
      cursor = next

      continue
    }

    if (source.startsWith('import', cursor)) offsets.add(cursor)

    cursor += 1
  }

  return offsets
}

const collectComponents = (source: string, exclusions: ReadonlyMap<number, number>): Map<string, string> => {
  const components = new Map<string, string>()
  const offsets = realImportStarts(source, exclusions)

  for (const module of ['@santi020k/lumen-astro', '@santi020k/lumen-react']) {
    for (const statement of findImportStatements(source, module)) {
      if (!offsets.has(statement.start)) continue

      const imports = parseNamedImports(statement.clause)

      if (!imports?.complete) continue

      for (const item of imports.imports) {
        if (!item.typeOnly) components.set(item.local, item.imported)
      }
    }
  }

  return components
}

const readTag = (source: string, cursor: number): Tag | undefined => {
  if (source[cursor] !== '<' || !/[A-Za-z]/u.test(source[cursor + 1] ?? '')) return undefined

  const nameEnd = getTagNameEnd(source, cursor + 1)

  return { start: cursor, nameEnd, name: source.slice(cursor + 1, nameEnd), end: findMarkupTagEnd(source, nameEnd) }
}

const literalValue = (attribute: ReturnType<typeof parseMarkupAttributes>[number]): string | undefined => {
  if (attribute.valueKind === 'literal') return attribute.value

  const expression = attribute.value

  if (expression && /^(['"])[a-z0-9-]+\1$/u.test(expression)) return expression.slice(1, -1)

  return undefined
}

const inspectGap = (context: SourceContext, tag: Tag): void => {
  const attributes = parseMarkupAttributes(context.source, tag.nameEnd, tag.end)
  const gaps = attributes.filter(attribute => attribute.name === 'gap')
  const gap = gaps[0]

  if (!gap) return

  const value = literalValue(gap)
  const ambiguous = gaps.length > 1 || context.source.slice(tag.nameEnd, tag.end).includes('...')

  if (!value || ambiguous) {
    context.manualReview.push(context.finding(gap.start, 'layout-gap', `${tag.name}: review dynamic, duplicated or spread gap values; v3 md/lg/xl map to group/xl/2xl.`))

    return
  }

  const replacement = Object.hasOwn(layoutGaps, value) ? layoutGaps[value] : undefined

  if (!replacement) return

  const offset = context.source.slice(gap.start, gap.end).lastIndexOf(value)

  context.edits.push({ start: gap.start + offset, end: gap.start + offset + value.length, replacement })

  context.changes.push(context.finding(gap.start, 'layout-gap', `${tag.name}: preserve v3 gap ${value} with ${replacement}.`))
}

const inspectTag = (context: SourceContext, tag: Tag): void => {
  const component = context.components.get(tag.name) ?? elementNames.get(tag.name)

  if (!component) return

  const message = reviewComponents.get(component)

  if (message) context.manualReview.push(context.finding(tag.start, 'component-review', `${tag.name}: ${message}`))

  if (component === 'Stack' || component === 'Grid') inspectGap(context, tag)
}

const markupSkipper = (
  source: string, exclusions: ReadonlyMap<number, number>, script: boolean
): ((cursor: number) => number) => {
  if (!script) return cursor => skipNonMarkup(source, cursor, false)

  return cursor => exclusions.get(cursor) ?? skipNonMarkup(source, cursor, true)
}

const scanMarkup = (context: SourceContext, file: string): void => {
  const script = !['.astro', '.html', '.htm'].some(extension => file.endsWith(extension))
  const source = context.source
  const skip = markupSkipper(source, context.regexRanges, script)
  let cursor = getMarkupStart(source, file)

  while (cursor < source.length) {
    const next = skip(cursor)

    if (next !== cursor) {
      cursor = next

      continue
    }

    if (!script && source[cursor] === '{') {
      cursor = findBalancedEnd(source, cursor, '{', '}')

      continue
    }

    const tag = readTag(source, cursor)

    if (!tag) {
      cursor += 1

      continue
    }

    cursor = tag.end + 1

    if (!script && ['script', 'style'].includes(tag.name)) {
      const end = source.indexOf(`</${tag.name}`, cursor)

      cursor = end < 0 ? source.length : end
    } else if (tag.end < source.length) inspectTag(context, tag)
  }
}

const generalFindings = (
  source: string, file: string, version: LumenMigrationVersion
): LumenVersionMigrationFinding[] => {
  if (['.swift', '.kt', '.kts'].some(extension => file.endsWith(extension)) && source.includes('Lumen')) {
    return [{ file,
      line: 1,
      column: 1,
      kind: 'native-review',
      message: version === 'v3' ?
        'Update coordinated native package pins and rebuild. Review exhaustive Swift LumenIconName switches for added cases; no web component rewrites are required.' :
        'Update coordinated native package pins and rebuild. Review sheet/control initializer signatures and exhaustive Swift LumenIconName switches.' }]
  }

  if (version === 'v4' && file.endsWith('.css') && source.includes('.ui-')) {
    return [{ file, line: 1, column: 1, kind: 'component-review', message: 'Review internal selectors, child margins, media clipping, fixed gutters and chart patches against the v4 migration guide; CSS is not rewritten automatically.' }]
  }

  return []
}

const applyEdits = (source: string, edits: Edit[]): string => {
  const pieces: string[] = []
  let end = 0

  for (const edit of edits) {
    pieces.push(source.slice(end, edit.start), edit.replacement)

    end = edit.end
  }

  pieces.push(source.slice(end))

  return pieces.join('')
}

const applySdkMigration = (migration: LumenVersionSourceMigration, file: string): LumenVersionSourceMigration => {
  if (!['.ts', '.js', '.mjs'].some(extension => file.endsWith(extension))) return migration

  const sdk = migrateLumenV4Source(migration.source, file)

  return {
    ...migration,
    changes: [...migration.changes, ...sdk.changes.map(({ column, file: sourceFile, line, message }) => ({
      column, file: sourceFile, kind: 'embedded-mcp-sdk' as const, line, message
    }))],
    source: sdk.source
  }
}

/** Assumes v3 input for v4. Filesystem apply uses a ledger to prevent repeated spacing rewrites. */
export const migrateLumenVersionSource = (
  source: string,
  file: string,
  version: LumenMigrationVersion
): LumenVersionSourceMigration => {
  const manualReview = generalFindings(source, file, version)

  if (version === 'v3' || file.endsWith('.css')) return { changes: [], manualReview, source }

  const regexRanges = scriptRegexRanges(source, file)

  if (!regexRanges) {
    manualReview.push({ file, line: 1, column: 1, kind: 'component-review', message: 'The source exceeds the syntax parser nesting limit; review this file manually.' })

    return { changes: [], manualReview, source }
  }

  const starts = lineStarts(source)

  const context: SourceContext = {
    source,
    manualReview,
    changes: [],
    edits: [],
    regexRanges,
    components: collectComponents(source, regexRanges),
    finding: (offset, kind, message) => ({ ...location(starts, offset), file, kind, message })
  }

  scanMarkup(context, file)

  return applySdkMigration({ changes: context.changes, manualReview, source: applyEdits(source, context.edits) }, file)
}
