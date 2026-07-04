export type LumenCodeTokenKind = 'accent' | 'comment' | 'keyword' | 'string' | 'symbol' | 'type'

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

const jsLikeLanguages = new Set([
  'js',
  'jsx',
  'javascript',
  'mjs',
  'ts',
  'tsx',
  'typescript'
])

const jsKeywords = new Set([
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

const jsTypes = new Set([
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

const jsTokenPattern = /\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d[\d._]*\b|\b[A-Za-z_$][\w$]*\b|[=+\-*%<>!?:.,;()[\]{}|&/]+/g
const leadingWhitespacePattern = /^[\t ]*/

const normalizeLanguage = (language = '') => language.trim().toLowerCase()
const startsWithIdentifierPattern = /^[A-Za-z_$]/
const startsWithNumberPattern = /^\d/
const startsWithCommentPattern = /^\/[/*]/
const startsWithStringPattern = /^["'`]/

export const normalizeLumenCode = (code: string) => {
  const lines = code.replaceAll(/\r\n?/g, '\n').split('\n')

  while (lines[0]?.trim() === '') lines.shift()
  while (lines.at(-1)?.trim() === '') lines.pop()

  const indentation = lines
    .filter(line => line.trim() !== '')
    .map(line => leadingWhitespacePattern.exec(line)?.[0].length ?? 0)

  const trimBy = indentation.length > 0 ? Math.min(...indentation) : 0

  return lines.map(line => line.slice(trimBy)).join('\n')
}

const getTokenKind = (value: string): LumenCodeTokenKind | undefined => {
  if (startsWithCommentPattern.exec(value)) return 'comment'
  if (startsWithStringPattern.exec(value)) return 'string'
  if (startsWithNumberPattern.exec(value)) return 'accent'

  if (startsWithIdentifierPattern.exec(value)) {
    if (jsKeywords.has(value)) return 'keyword'
    if (jsTypes.has(value)) return 'type'

    return undefined
  }

  return 'symbol'
}

export const tokenizeLumenCode = (code: string, language = ''): LumenCodeToken[] => {
  const source = normalizeLumenCode(code)
  const tokens: LumenCodeToken[] = []
  const shouldTokenizeJs = jsLikeLanguages.has(normalizeLanguage(language))
  let offset = 0

  const push = (value: string, start: number, kind?: LumenCodeTokenKind) => {
    if (value) tokens.push(kind ? { kind, start, value } : { start, value })
  }

  if (!shouldTokenizeJs) return source ? [{ start: 0, value: source }] : []

  for (const match of source.matchAll(jsTokenPattern)) {
    const index = match.index ?? offset
    const value = match[0] ?? ''

    push(source.slice(offset, index), offset)
    push(value, index, getTokenKind(value))

    offset = index + value.length
  }

  push(source.slice(offset), offset)

  return tokens
}

const escapeLumenCodeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

const renderLumenCodeTokenHtml = (token: LumenCodeToken) => {
  const value = escapeLumenCodeHtml(token.value)

  if (!token.kind) return value

  return `<span class="${lumenCodeTokenClassNames[token.kind]}">${value}</span>`
}

export const renderLumenCodeHtml = (code: string, language = '') =>
  tokenizeLumenCode(code, language).map(renderLumenCodeTokenHtml).join('')
