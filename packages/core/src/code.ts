export type LumenCodeTokenKind =
  'accent' | 'comment' | 'keyword' | 'string' | 'symbol' | 'type'

export interface LumenCodeToken {
  kind?: LumenCodeTokenKind
  start: number
  value: string
}

export const lumenCodeTokenClassNames = {
  accent: 'ui-code__token--accent',
  comment: 'ui-code__token--comment',
  keyword: 'ui-code__token--keyword',
  string: 'ui-code__token--string',
  symbol: 'ui-code__token--symbol',
  type: 'ui-code__token--type'
} as const satisfies Record<LumenCodeTokenKind, string>

interface LumenCodeTokenizer {
  getKind: (
    value: string,
    source: string,
    start: number
  ) => LumenCodeTokenKind | undefined
  pattern: RegExp
}

const bashLikeLanguages = new Set([
  'bash',
  'console',
  'shell',
  'sh',
  'terminal',
  'zsh'
])

const jsonLikeLanguages = new Set(['json', 'json5', 'jsonc'])

const javascriptLikeLanguages = new Set([
  'js',
  'jsx',
  'javascript',
  'mjs',
  'ts',
  'tsx',
  'typescript'
])

const luaLikeLanguages = new Set(['lua'])
const markdownLikeLanguages = new Set(['md', 'markdown', 'mdx'])

const markupLikeLanguages = new Set([
  'astro',
  'html',
  'markup',
  'svg',
  'vue',
  'xml'
])

const sqlLikeLanguages = new Set(['sql'])
const yamlLikeLanguages = new Set(['yaml', 'yml'])

const javascriptKeywords = new Set([
  'as',
  'async',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'default',
  'else',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'from',
  'function',
  'if',
  'import',
  'in',
  'interface',
  'let',
  'new',
  'null',
  'of',
  'return',
  'throw',
  'true',
  'try',
  'type',
  'undefined',
  'var',
  'while'
])

const javascriptTypes = new Set([
  'Array',
  'Boolean',
  'Date',
  'Map',
  'Number',
  'Promise',
  'Record',
  'Set',
  'String',
  'boolean',
  'number',
  'string',
  'unknown',
  'void'
])

const bashKeywords = new Set([
  'case',
  'do',
  'done',
  'elif',
  'else',
  'esac', // cspell:ignore esac
  'export',
  'fi',
  'for',
  'function',
  'if',
  'in',
  'local',
  'readonly',
  'set',
  'then',
  'unset',
  'while'
])

const jsonKeywords = new Set(['false', 'null', 'true'])

const luaKeywords = new Set([
  'and',
  'break',
  'do',
  'else',
  'elseif',
  'end',
  'false',
  'for',
  'function',
  'goto',
  'if',
  'in',
  'local',
  'nil',
  'not',
  'or',
  'repeat',
  'return',
  'then',
  'true',
  'until',
  'while'
])

const sqlKeywords = new Set([
  'alter',
  'and',
  'as',
  'asc',
  'by',
  'create',
  'delete',
  'desc',
  'distinct',
  'drop',
  'from',
  'group',
  'having',
  'insert',
  'into',
  'join',
  'limit',
  'not',
  'null',
  'on',
  'or',
  'order',
  'select',
  'set',
  'table',
  'union',
  'update',
  'values',
  'where'
])

const yamlKeywords = new Set([
  'false',
  'no',
  'null',
  'off',
  'on',
  'true',
  'yes'
])

const bashTokenPattern = new RegExp([
  String.raw`#[^\n]*|"|'[^']*'|\$\{?[A-Za-z_][\w]*\}?|`,
  String.raw`--?[A-Za-z][\w-]*|\b[A-Za-z_][\w]*\b|\b\d+(?:\.\d+)?\b|[|&;<>()[\]{}=]+`
].join(''), 'g')

const javascriptTokenPattern = new RegExp([
  String.raw`\/\/[^\n]*|\/\*[\s\S]*?\*\/|"|'|` + '`|',
  String.raw`\b\d[\d._]*\b|\b[A-Za-z_$][\w$]*\b|[=+\-*%<>!?:.,;()[\]{}|&/]+`
].join(''), 'g')

const jsonTokenPattern = new RegExp([
  String.raw`\/\/[^\n]*|\/\*[\s\S]*?\*\/|"|`,
  String.raw`\b(?:false|null|true)\b|-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b|[{},:]|\[|\]`
].join(''), 'gi')

const luaTokenPattern = new RegExp([
  String.raw`--\[\[[\s\S]*?\]\]|--[^\n]*|"|'|`,
  String.raw`\b[A-Za-z_][\w]*\b|\b\d+(?:\.\d+)?\b|[=+\-*%<>~#.,:;()[\]{}]+`
].join(''), 'g')

const markupTokenPattern = new RegExp([
  String.raw`<!--|---|<\/?|\/?>|"|'|`,
  String.raw`\b[A-Za-z_][\w:.-]*\b|[{}=]`
].join(''), 'g')

const sqlTokenPattern = new RegExp([
  String.raw`--[^\n]*|\/\*[\s\S]*?\*\/|"|'(?:''|[^'])*'|`,
  String.raw`\b[A-Za-z_][\w$]*\b|\b\d+(?:\.\d+)?\b|[=+\-*%<>!.,;()[\]]+`
].join(''), 'g')

const yamlTokenPattern = new RegExp([
  String.raw`#[^\n]*|"|'(?:''|[^'])*'|\b[A-Za-z_][\w.-]*|`,
  String.raw`\b(?:false|no|null|off|on|true|yes)\b|\b\d+(?:\.\d+)?\b|`,
  '[{},:&*!?|>@`~-]+|\\[|\\]'
].join(''), 'gi')

const leadingWhitespacePattern = /^[\t ]*/
const normalizeLanguage = (language = '') => language.trim().toLowerCase()
const startsWithIdentifierPattern = /^[A-Za-z_$]/
const startsWithNumberPattern = /^\d/
const startsWithCommentPattern = /^(?:#|--|\/[/*]|<!--)/
const startsWithStringPattern = /^["'`]/

const trimBlankEdgeLines = (lines: string[]): string[] => {
  let start = 0
  let end = lines.length

  while (start < end && lines[start]?.trim() === '') start += 1

  while (end > start && lines[end - 1]?.trim() === '') end -= 1

  return lines.slice(start, end)
}

const getMinimumIndent = (lines: readonly string[]): number => {
  let minimum = Number.POSITIVE_INFINITY

  for (const line of lines) {
    if (line.trim() === '') continue

    const indent = leadingWhitespacePattern.exec(line)?.[0].length ?? 0

    if (indent < minimum) minimum = indent
  }

  return Number.isFinite(minimum) ? minimum : 0
}

export const normalizeLumenCode = (code: string) => {
  const lines = trimBlankEdgeLines(code.replaceAll(/\r\n?/g, '\n').split('\n'))
  const trimBy = getMinimumIndent(lines)

  return lines.map(line => line.slice(trimBy)).join('\n')
}

const getJavascriptTokenKind = (
  value: string
): LumenCodeTokenKind | undefined => {
  if (startsWithCommentPattern.exec(value)) return 'comment'

  if (startsWithStringPattern.exec(value)) return 'string'

  if (startsWithNumberPattern.exec(value)) return 'accent'

  if (startsWithIdentifierPattern.exec(value)) {
    if (javascriptKeywords.has(value)) return 'keyword'

    if (javascriptTypes.has(value)) return 'type'

    return undefined
  }

  return 'symbol'
}

const getBashTokenKind = (value: string): LumenCodeTokenKind | undefined => {
  if (value.startsWith('#')) return 'comment'

  if (startsWithStringPattern.exec(value)) return 'string'

  if (value.startsWith('$')) return 'accent'

  if (value.startsWith('-')) return 'type'

  if (startsWithNumberPattern.exec(value)) return 'accent'

  if (bashKeywords.has(value)) return 'keyword'

  if (startsWithIdentifierPattern.exec(value)) return undefined

  return 'symbol'
}

type MonotonicFinder = (minIndex: number) => number

interface MarkdownMatch {
  end: number
  kind: LumenCodeTokenKind
}

const unicodeWhitespaceCodes = new Set([
  0x00A0,
  0x1680,
  0x2000,
  0x2001,
  0x2002,
  0x2003,
  0x2004,
  0x2005,
  0x2006,
  0x2007,
  0x2008,
  0x2009,
  0x200A,
  0x2028,
  0x2029,
  0x202F,
  0x205F,
  0x3000,
  0xFEFF
])

const isLineTerminator = (code: number): boolean => (
  code === 10 || code === 13 || code === 0x2028 || code === 0x2029
)

const isCodeWhitespace = (code: number): boolean => (
  code === 32 || (code >= 9 && code <= 13) || unicodeWhitespaceCodes.has(code)
)

const isFollowedByColon = (source: string, start: number): boolean => {
  let index = start

  while (index < source.length && isCodeWhitespace(source.charCodeAt(index))) {
    index += 1
  }

  return source.charCodeAt(index) === 58
}

const createMonotonicFinder = (
  source: string,
  needle: string
): MonotonicFinder => {
  let cachedIndex = -1

  return (minIndex: number): number => {
    if (cachedIndex === -2) return -1

    if (cachedIndex < minIndex) {
      const found = source.indexOf(needle, minIndex)

      cachedIndex = found === -1 ? -2 : found
    }

    return cachedIndex === -2 ? -1 : cachedIndex
  }
}

const createBackslashQuoteMatcher = (source: string) => {
  const failUntilByQuote = new Map<number, number>()

  return (index: number, quoteCode: number): string | undefined => {
    if (index < (failUntilByQuote.get(quoteCode) ?? -1)) return undefined

    let cursor = index + 1

    while (cursor < source.length) {
      const code = source.charCodeAt(cursor)

      if (code === quoteCode) return source.slice(index, cursor + 1)

      if (code === 92) {
        const nextCode = source.charCodeAt(cursor + 1)

        if (Number.isNaN(nextCode) || isLineTerminator(nextCode)) break

        cursor += 2

        continue
      }

      cursor += 1
    }

    failUntilByQuote.set(quoteCode, cursor)

    return undefined
  }
}

const getJsonTokenKind = (
  value: string,
  source: string,
  start: number
): LumenCodeTokenKind | undefined => {
  if (startsWithCommentPattern.exec(value)) return 'comment'

  if (value.startsWith('"')) {
    return isFollowedByColon(source, start + value.length) ? 'keyword' : 'string'
  }

  if (jsonKeywords.has(value.toLowerCase())) return 'type'

  if (/^-?\d/.exec(value)) return 'accent'

  return 'symbol'
}

const getLuaTokenKind = (value: string): LumenCodeTokenKind | undefined => {
  if (value.startsWith('--')) return 'comment'

  if (startsWithStringPattern.exec(value)) return 'string'

  if (startsWithNumberPattern.exec(value)) return 'accent'

  if (luaKeywords.has(value)) return 'keyword'

  if (startsWithIdentifierPattern.exec(value)) return undefined

  return 'symbol'
}

const matchMarkdownHeading = (
  source: string,
  index: number
): MarkdownMatch | undefined => {
  if (source.charCodeAt(index) !== 35) return undefined

  let end = index + 1

  while (end < source.length && end - index < 7 && source.charCodeAt(end) === 35) {
    end += 1
  }

  const count = end - index

  if (count > 6 || !isCodeWhitespace(source.charCodeAt(end))) return undefined

  return { end, kind: 'keyword' }
}

const matchMarkdownBlockquote = (
  source: string,
  index: number
): MarkdownMatch | undefined => {
  if (source.charCodeAt(index) !== 62) return undefined

  const end = isCodeWhitespace(source.charCodeAt(index + 1)) ? index + 2 : index + 1

  return { end, kind: 'symbol' }
}

const readDigitsEnd = (source: string, start: number): number => {
  let cursor = start

  while (cursor < source.length) {
    const code = source.charCodeAt(cursor)

    if (code < 48 || code > 57) break

    cursor += 1
  }

  return cursor
}

const readWhitespaceEnd = (source: string, start: number): number => {
  let cursor = start

  while (cursor < source.length && isCodeWhitespace(source.charCodeAt(cursor))) {
    cursor += 1
  }

  return cursor
}

const readMarkdownListMarkerEnd = (
  source: string,
  markerStart: number
): number => {
  const code = source.charCodeAt(markerStart)

  if (code === 45 || code === 43 || code === 42) return markerStart + 1

  const digitsEnd = readDigitsEnd(source, markerStart)

  if (digitsEnd > markerStart && source.charCodeAt(digitsEnd) === 46) {
    return digitsEnd + 1
  }

  return -1
}

const createMarkdownLineStartMatcher = (source: string) => {
  let listFailUntil = -1

  return (index: number): MarkdownMatch | undefined => {
    const heading = matchMarkdownHeading(source, index)

    if (heading) return heading

    const blockquote = matchMarkdownBlockquote(source, index)

    if (blockquote) return blockquote

    if (index < listFailUntil) return undefined

    const markerStart = readWhitespaceEnd(source, index)
    const markerEnd = readMarkdownListMarkerEnd(source, markerStart)
    const trailingEnd = markerEnd === -1 ? -1 : readWhitespaceEnd(source, markerEnd)

    if (trailingEnd > markerEnd) {
      return { end: trailingEnd, kind: 'symbol' }
    }

    listFailUntil = markerStart + 1

    return undefined
  }
}

const matchMarkdownCodeSpan = (
  source: string,
  index: number,
  findFence: MonotonicFinder,
  findBacktick: MonotonicFinder,
  findNewline: MonotonicFinder
): MarkdownMatch | undefined => {
  if (source.charCodeAt(index) !== 96) return undefined

  if (source.startsWith('```', index)) {
    const fenceEnd = findFence(index + 3)

    if (fenceEnd !== -1) return { end: fenceEnd + 3, kind: 'string' }
  }

  const nextCode = source.charCodeAt(index + 1)

  if (nextCode === 96 || nextCode === 10 || Number.isNaN(nextCode)) return undefined

  const closeTick = findBacktick(index + 1)
  const newline = findNewline(index + 1)

  if (closeTick > index + 1 && (newline === -1 || closeTick < newline)) {
    return { end: closeTick + 1, kind: 'string' }
  }

  return undefined
}

const matchMarkdownComment = (
  source: string,
  index: number,
  findCommentEnd: MonotonicFinder
): MarkdownMatch | undefined => {
  if (!source.startsWith('<!--', index)) return undefined

  const closeComment = findCommentEnd(index + 4)

  return closeComment === -1 ? undefined : { end: closeComment + 3, kind: 'comment' }
}

const matchMarkdownEmphasis = (
  source: string,
  index: number
): MarkdownMatch | undefined => {
  const code = source.charCodeAt(index)

  if (code !== 42 && code !== 95) return undefined

  const end = source.charCodeAt(index + 1) === code ? index + 2 : index + 1

  return { end, kind: 'symbol' }
}

const matchMarkdownLink = (
  source: string,
  index: number,
  findCloseBracket: MonotonicFinder,
  findCloseParen: MonotonicFinder
): MarkdownMatch | undefined => {
  if (source.charCodeAt(index) !== 91) return undefined

  const closeBracket = findCloseBracket(index + 1)

  if (closeBracket <= index + 1 || source.charCodeAt(closeBracket + 1) !== 40) {
    return undefined
  }

  const closeParen = findCloseParen(closeBracket + 2)

  return closeParen > closeBracket + 2 ?
    { end: closeParen + 1, kind: 'accent' } :
    undefined
}

const tokenizeMarkdownSource = (
  source: string,
  push: (value: string, start: number, kind?: LumenCodeTokenKind) => void
): void => {
  const matchLineStart = createMarkdownLineStartMatcher(source)
  const findFence = createMonotonicFinder(source, '```')
  const findBacktick = createMonotonicFinder(source, '`')
  const findNewline = createMonotonicFinder(source, '\n')
  const findCommentEnd = createMonotonicFinder(source, '-->')
  const findCloseBracket = createMonotonicFinder(source, ']')
  const findCloseParen = createMonotonicFinder(source, ')')
  let offset = 0
  let index = 0

  while (index < source.length) {
    const isLineStart = index === 0 || isLineTerminator(source.charCodeAt(index - 1))

    const match =
      matchMarkdownCodeSpan(source, index, findFence, findBacktick, findNewline) ??
      matchMarkdownComment(source, index, findCommentEnd) ??
      (isLineStart ? matchLineStart(index) : undefined) ??
      matchMarkdownEmphasis(source, index) ??
      matchMarkdownLink(source, index, findCloseBracket, findCloseParen)

    if (!match) {
      index += 1

      continue
    }

    push(source.slice(offset, index), offset)

    push(source.slice(index, match.end), index, match.kind)

    offset = match.end

    index = match.end
  }

  push(source.slice(offset), offset)
}

const hasNonSlashNonWhitespace = (
  source: string,
  start: number,
  end: number
): boolean => {
  for (let index = start; index < end; index += 1) {
    const code = source.charCodeAt(index)

    if (code !== 47 && !isCodeWhitespace(code)) return true
  }

  return false
}

const getStaticMarkupTokenKind = (
  value: string
): LumenCodeTokenKind | undefined => {
  if (value.startsWith('<!--') || value === '---') return 'comment'

  if (startsWithStringPattern.exec(value)) return 'string'

  if (/^(?:<\/?|\/?>|[{}=])$/.exec(value)) return 'symbol'

  return undefined
}

const isOpeningMarkupTagSymbol = (value: string): boolean => (
  value === '<' || value === '</'
)

const isClosingMarkupTagSymbol = (value: string): boolean => (
  value === '>' || value === '/>'
)

const createMarkupTokenClassifier = (source: string) => {
  let inTag = false
  let hasTagName = false
  let scanIndex = 0

  return (value: string, start: number): LumenCodeTokenKind | undefined => {
    if (inTag && !hasTagName && hasNonSlashNonWhitespace(source, scanIndex, start)) {
      hasTagName = true
    }

    scanIndex = start + value.length

    if (isOpeningMarkupTagSymbol(value)) {
      inTag = true

      hasTagName = false

      return 'symbol'
    }

    if (isClosingMarkupTagSymbol(value)) {
      inTag = false

      hasTagName = false

      return 'symbol'
    }

    const staticKind = getStaticMarkupTokenKind(value)

    if (staticKind) {
      if (inTag) hasTagName = true

      return staticKind
    }

    if (!inTag) return undefined

    const kind: LumenCodeTokenKind = hasTagName ? 'type' : 'keyword'

    hasTagName = true

    return kind
  }
}

const resolveMarkupTokenValue = (
  rawValue: string,
  index: number,
  source: string,
  findCommentEnd: MonotonicFinder,
  matchBackslashQuote: (index: number, quoteCode: number) => string | undefined
): string | undefined => {
  if (rawValue === '<!--') {
    const closeComment = findCommentEnd(index + 4)

    return closeComment === -1 ? undefined : source.slice(index, closeComment + 3)
  }

  if (rawValue === '"' || rawValue === '\'') {
    return matchBackslashQuote(index, rawValue.charCodeAt(0))
  }

  return rawValue
}

const tokenizeMarkupSource = (
  source: string,
  push: (value: string, start: number, kind?: LumenCodeTokenKind) => void
): void => {
  const classify = createMarkupTokenClassifier(source)
  const findCommentEnd = createMonotonicFinder(source, '-->')
  const matchBackslashQuote = createBackslashQuoteMatcher(source)
  const pattern = new RegExp(markupTokenPattern.source, markupTokenPattern.flags)
  let offset = 0
  let match = pattern.exec(source)

  while (match !== null) {
    const index = match.index

    const value = resolveMarkupTokenValue(
      match[0], index, source, findCommentEnd, matchBackslashQuote
    )

    if (value === undefined) {
      match = pattern.exec(source)

      continue
    }

    pattern.lastIndex = index + value.length

    push(source.slice(offset, index), offset)

    push(value, index, classify(value, index))

    offset = index + value.length

    match = pattern.exec(source)
  }

  push(source.slice(offset), offset)
}

const getSqlTokenKind = (value: string): LumenCodeTokenKind | undefined => {
  if (startsWithCommentPattern.exec(value)) return 'comment'

  if (startsWithStringPattern.exec(value)) return 'string'

  if (/^\d/.exec(value)) return 'accent'

  if (sqlKeywords.has(value.toLowerCase())) return 'keyword'

  if (startsWithIdentifierPattern.exec(value)) return undefined

  return 'symbol'
}

const getYamlTokenKind = (
  value: string,
  source: string,
  start: number
): LumenCodeTokenKind | undefined => {
  if (value.startsWith('#')) return 'comment'

  if (startsWithStringPattern.exec(value)) return 'string'

  if (startsWithNumberPattern.exec(value)) return 'accent'

  if (yamlKeywords.has(value.toLowerCase())) return 'type'

  if (startsWithIdentifierPattern.exec(value)) {
    return isFollowedByColon(source, start + value.length) ? 'keyword' : undefined
  }

  return 'symbol'
}

const getLumenCodeTokenizer = (
  language: string
): LumenCodeTokenizer | undefined => {
  if (javascriptLikeLanguages.has(language)) {
    return { getKind: getJavascriptTokenKind, pattern: javascriptTokenPattern }
  }

  if (bashLikeLanguages.has(language)) {
    return { getKind: getBashTokenKind, pattern: bashTokenPattern }
  }

  if (jsonLikeLanguages.has(language)) {
    return { getKind: getJsonTokenKind, pattern: jsonTokenPattern }
  }

  if (luaLikeLanguages.has(language)) {
    return { getKind: getLuaTokenKind, pattern: luaTokenPattern }
  }

  if (sqlLikeLanguages.has(language)) {
    return { getKind: getSqlTokenKind, pattern: sqlTokenPattern }
  }

  if (yamlLikeLanguages.has(language)) {
    return { getKind: getYamlTokenKind, pattern: yamlTokenPattern }
  }

  return undefined
}

const resolveTokenizerMatch = (
  rawValue: string,
  index: number,
  language: string,
  matchBackslashQuote: (index: number, quoteCode: number) => string | undefined
): string | undefined => {
  if (rawValue === '"' || rawValue === '\'') {
    return matchBackslashQuote(index, rawValue.charCodeAt(0))
  }

  if (rawValue === '`' && javascriptLikeLanguages.has(language)) {
    return matchBackslashQuote(index, 96)
  }

  return rawValue
}

export const tokenizeLumenCode = (
  code: string,
  language = ''
): LumenCodeToken[] => {
  const source = normalizeLumenCode(code)
  const tokens: LumenCodeToken[] = []
  const normalizedLanguage = normalizeLanguage(language)
  let offset = 0

  const push = (value: string, start: number, kind?: LumenCodeTokenKind) => {
    if (value) tokens.push(kind ? { kind, start, value } : { start, value })
  }

  if (markdownLikeLanguages.has(normalizedLanguage)) {
    tokenizeMarkdownSource(source, push)

    return tokens
  }

  if (markupLikeLanguages.has(normalizedLanguage)) {
    tokenizeMarkupSource(source, push)

    return tokens
  }

  const tokenizer = getLumenCodeTokenizer(normalizedLanguage)

  if (!tokenizer) return source ? [{ start: 0, value: source }] : []

  const matchBackslashQuote = createBackslashQuoteMatcher(source)
  const pattern = new RegExp(tokenizer.pattern.source, tokenizer.pattern.flags)
  let match = pattern.exec(source)

  while (match !== null) {
    const index = match.index

    const value = resolveTokenizerMatch(
      match[0], index, normalizedLanguage, matchBackslashQuote
    )

    if (value === undefined) {
      match = pattern.exec(source)

      continue
    }

    pattern.lastIndex = index + value.length

    push(source.slice(offset, index), offset)

    push(value, index, tokenizer.getKind(value, source, index))

    offset = index + value.length

    match = pattern.exec(source)
  }

  push(source.slice(offset), offset)

  return tokens
}

const escapeLumenCodeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')

const renderLumenCodeTokenHtml = (token: LumenCodeToken) => {
  const value = escapeLumenCodeHtml(token.value)

  if (!token.kind) return value

  return `<span class="${lumenCodeTokenClassNames[token.kind]}">${value}</span>`
}

export const renderLumenCodeHtml = (code: string, language = '') => tokenizeLumenCode(code, language).map(renderLumenCodeTokenHtml).join('')
