import { lumenSemanticColorTokenNames } from '@santi020k/lumen-core'

export interface LumenTokenAuditFinding {
  column: number
  file: string
  line: number
  token: string
  value: string
}

interface LumenTokenDeclaration {
  index: number
  token: string
  value: string
}

interface LumenTokenDeclarationScan {
  cursor: number
  declaration?: LumenTokenDeclaration
}

const channelPattern = new RegExp([
  String.raw`^(?:var\(.+\)|-?(?:\d+(?:\.\d+)?|\.\d+)`,
  String.raw`(?:deg|grad|rad|turn)?\s+-?(?:\d+(?:\.\d+)?|\.\d+)%`,
  String.raw`\s+-?(?:\d+(?:\.\d+)?|\.\d+)%`,
  String.raw`(?:\s*\/\s*(?:\d+(?:\.\d+)?|\.\d+)%?)?)$`
].join(''), 'iu')

const semanticTokens = new Set<string>(lumenSemanticColorTokenNames)
const isAsciiLetter = (character: string | undefined): boolean => character !== undefined && /[a-z]/iu.test(character)
const isTokenCharacter = (character: string | undefined): boolean => character !== undefined && /[\w-]/u.test(character)
const isWhitespace = (character: string | undefined): boolean => character !== undefined && /\s/u.test(character)

const scanTokenDeclaration = (source: string, index: number): LumenTokenDeclarationScan => {
  let tokenEnd = index + 2

  if (!isAsciiLetter(source[tokenEnd])) return { cursor: index + 1 }

  tokenEnd += 1

  while (isTokenCharacter(source[tokenEnd])) tokenEnd += 1

  const token = source.slice(index + 2, tokenEnd)
  let colon = tokenEnd

  while (isWhitespace(source[colon])) colon += 1

  if (source[colon] !== ':') return { cursor: colon }

  const valueStart = colon + 1
  let valueEnd = valueStart

  while (
    valueEnd < source.length &&
    source[valueEnd] !== ';' &&
    source[valueEnd] !== '}' &&
    source[valueEnd] !== '\n'
  ) {
    valueEnd += 1
  }

  return {
    cursor: valueEnd,
    declaration: {
      index,
      token,
      value: source.slice(valueStart, valueEnd).trim()
    }
  }
}

const findTokenDeclarations = (source: string): LumenTokenDeclaration[] => {
  const declarations: LumenTokenDeclaration[] = []
  let cursor = 0

  while (cursor < source.length) {
    const index = source.indexOf('--', cursor)

    if (index === -1) break

    const scan = scanTokenDeclaration(source, index)

    cursor = scan.cursor

    if (scan.declaration) declarations.push(scan.declaration)
  }

  return declarations
}

export const auditLumenTokenCss = (source: string, file = '<input>'): LumenTokenAuditFinding[] => {
  const findings: LumenTokenAuditFinding[] = []
  let line = 1
  let lineCursor = 0
  let lineStart = 0

  for (const { index, token, value } of findTokenDeclarations(source)) {
    if (!token || !value || !semanticTokens.has(token) || channelPattern.test(value)) continue

    let newline = source.indexOf('\n', lineCursor)

    while (newline !== -1 && newline < index) {
      line += 1

      lineStart = newline + 1

      lineCursor = lineStart

      newline = source.indexOf('\n', lineCursor)
    }

    findings.push({
      column: index - lineStart + 1,
      file,
      line,
      token,
      value
    })
  }

  return findings
}
