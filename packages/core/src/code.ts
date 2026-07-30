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

interface LumenCodeTokenizer {
  getKind: (value: string, source: string, start: number) => LumenCodeTokenKind | undefined
  pattern: RegExp
}

const bashLikeLanguages = new Set(['bash', 'console', 'shell', 'sh', 'terminal', 'zsh'])
const jsonLikeLanguages = new Set(['json', 'json5', 'jsonc'])
const javascriptLikeLanguages = new Set(['js', 'jsx', 'javascript', 'mjs', 'ts', 'tsx', 'typescript'])
const luaLikeLanguages = new Set(['lua'])
const markdownLikeLanguages = new Set(['md', 'markdown', 'mdx'])
const markupLikeLanguages = new Set(['astro', 'html', 'markup', 'svg', 'vue', 'xml'])
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

const yamlKeywords = new Set(['false', 'no', 'null', 'off', 'on', 'true', 'yes'])

const bashTokenPattern =
  /#[^\n]*|"(?:\\.|[^"\\])*"|'[^']*'|\$\{?[A-Za-z_][\w]*\}?|--?[A-Za-z][\w-]*|\b[A-Za-z_][\w]*\b|\b\d+(?:\.\d+)?\b|[|&;<>()[\]{}=]+/g

const javascriptTokenPattern =
  /\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d[\d._]*\b|\b[A-Za-z_$][\w$]*\b|[=+\-*%<>!?:.,;()[\]{}|&/]+/g

const jsonTokenPattern =
  /\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|\b(?:false|null|true)\b|-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b|[{},:]|\[|\]/gi

const luaTokenPattern =
  /--\[\[[\s\S]*?\]\]|--[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b[A-Za-z_][\w]*\b|\b\d+(?:\.\d+)?\b|[=+\-*%<>~#.,:;()[\]{}]+/g

const markdownTokenPattern =
  /```[\s\S]*?```|`[^`\n]+`|<!--[\s\S]*?-->|^#{1,6}(?=\s)|^>\s?|^\s*(?:[-+*]|\d+\.)\s+|\*\*|__|\*|_|\[[^\]]+\]\([^)]+\)/gm

const markupTokenPattern =
  /<!--[\s\S]*?-->|---|<\/?|\/?>|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b[A-Za-z_][\w:.-]*\b|[{}=]/g

const sqlTokenPattern =
  /--[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:''|[^'])*'|\b[A-Za-z_][\w$]*\b|\b\d+(?:\.\d+)?\b|[=+\-*%<>!.,;()[\]]+/g

const yamlTokenPattern =
  /#[^\n]*|"(?:\\.|[^"\\])*"|'(?:''|[^'])*'|\b[A-Za-z_][\w.-]*(?=\s*:)|\b(?:false|no|null|off|on|true|yes)\b|\b\d+(?:\.\d+)?\b|[{},:&*!?|>@`~-]+|\[|\]/gi

const leadingWhitespacePattern = /^[\t ]*/
const normalizeLanguage = (language = '') => language.trim().toLowerCase()
const startsWithIdentifierPattern = /^[A-Za-z_$]/
const startsWithNumberPattern = /^\d/
const startsWithCommentPattern = /^(?:#|--|\/[/*]|<!--)/
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

const getJavascriptTokenKind = (value: string): LumenCodeTokenKind | undefined => {
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

const getJsonTokenKind = (value: string, source: string, start: number): LumenCodeTokenKind | undefined => {
  if (startsWithCommentPattern.exec(value)) return 'comment'

  if (value.startsWith('"')) {
    const trailingSource = source.slice(start + value.length)

    return /^\s*:/.exec(trailingSource) ? 'keyword' : 'string'
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

const getMarkdownTokenKind = (value: string): LumenCodeTokenKind => {
  if (value.startsWith('<!--')) return 'comment'

  if (value.startsWith('`')) return 'string'

  if (value.startsWith('[')) return 'accent'

  if (value.trimStart().startsWith('#')) return 'keyword'

  return 'symbol'
}

const getMarkupTokenKind = (value: string, source: string, start: number): LumenCodeTokenKind | undefined => {
  if (value.startsWith('<!--')) return 'comment'

  if (startsWithStringPattern.exec(value)) return 'string'

  if (value === '---') return 'comment'

  if (/^(?:<\/?|\/?>|[{}=])$/.exec(value)) return 'symbol'

  const openingTagIndex = source.lastIndexOf('<', start)
  const closingTagIndex = source.lastIndexOf('>', start)

  if (openingTagIndex < closingTagIndex) return undefined

  const beforeValue = source
    .slice(openingTagIndex + 1, start)
    .replace('/', '')
    .trim()

  return beforeValue === '' ? 'keyword' : 'type'
}

const getSqlTokenKind = (value: string): LumenCodeTokenKind | undefined => {
  if (startsWithCommentPattern.exec(value)) return 'comment'

  if (startsWithStringPattern.exec(value)) return 'string'

  if (/^\d/.exec(value)) return 'accent'

  if (sqlKeywords.has(value.toLowerCase())) return 'keyword'

  if (startsWithIdentifierPattern.exec(value)) return undefined

  return 'symbol'
}

const getYamlTokenKind = (value: string, source: string, start: number): LumenCodeTokenKind | undefined => {
  if (value.startsWith('#')) return 'comment'

  if (startsWithStringPattern.exec(value)) return 'string'

  if (startsWithNumberPattern.exec(value)) return 'accent'

  if (yamlKeywords.has(value.toLowerCase())) return 'type'

  if (startsWithIdentifierPattern.exec(value)) {
    const trailingSource = source.slice(start + value.length)

    return /^\s*:/.exec(trailingSource) ? 'keyword' : undefined
  }

  return 'symbol'
}

const getLumenCodeTokenizer = (language: string): LumenCodeTokenizer | undefined => {
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

  if (markdownLikeLanguages.has(language)) {
    return { getKind: getMarkdownTokenKind, pattern: markdownTokenPattern }
  }

  if (markupLikeLanguages.has(language)) {
    return { getKind: getMarkupTokenKind, pattern: markupTokenPattern }
  }

  if (sqlLikeLanguages.has(language)) {
    return { getKind: getSqlTokenKind, pattern: sqlTokenPattern }
  }

  if (yamlLikeLanguages.has(language)) {
    return { getKind: getYamlTokenKind, pattern: yamlTokenPattern }
  }

  return undefined
}

export const tokenizeLumenCode = (code: string, language = ''): LumenCodeToken[] => {
  const source = normalizeLumenCode(code)
  const tokens: LumenCodeToken[] = []
  const tokenizer = getLumenCodeTokenizer(normalizeLanguage(language))
  let offset = 0

  const push = (value: string, start: number, kind?: LumenCodeTokenKind) => {
    if (value) tokens.push(kind ? { kind, start, value } : { start, value })
  }

  if (!tokenizer) return source ? [{ start: 0, value: source }] : []

  for (const match of source.matchAll(tokenizer.pattern)) {
    const index = match.index
    const value = match[0]

    push(source.slice(offset, index), offset)

    push(value, index, tokenizer.getKind(value, source, index))

    offset = index + value.length
  }

  push(source.slice(offset), offset)

  return tokens
}

const escapeLumenCodeHtml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

const renderLumenCodeTokenHtml = (token: LumenCodeToken) => {
  const value = escapeLumenCodeHtml(token.value)

  if (!token.kind) return value

  return `<span class="${lumenCodeTokenClassNames[token.kind]}">${value}</span>`
}

export const renderLumenCodeHtml = (code: string, language = '') => tokenizeLumenCode(code, language).map(renderLumenCodeTokenHtml).join('')
