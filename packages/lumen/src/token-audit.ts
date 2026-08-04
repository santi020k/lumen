import { lumenSemanticColorTokenNames } from '@santi020k/lumen-core'

export interface LumenTokenAuditFinding {
  column: number
  file: string
  line: number
  token: string
  value: string
}

const declarationPattern = /--([a-z][\w-]*)\s*:\s*([^;}\n]+)/giu

const channelPattern = new RegExp([
  String.raw`^(?:var\(.+\)|-?(?:\d+(?:\.\d+)?|\.\d+)`,
  String.raw`(?:deg|grad|rad|turn)?\s+-?(?:\d+(?:\.\d+)?|\.\d+)%`,
  String.raw`\s+-?(?:\d+(?:\.\d+)?|\.\d+)%`,
  String.raw`(?:\s*\/\s*(?:\d+(?:\.\d+)?|\.\d+)%?)?)$`
].join(''), 'iu')

const semanticTokens = new Set<string>(lumenSemanticColorTokenNames)

export const auditLumenTokenCss = (source: string, file = '<input>'): LumenTokenAuditFinding[] => {
  const findings: LumenTokenAuditFinding[] = []

  for (const match of source.matchAll(declarationPattern)) {
    const token = match[1]
    const value = match[2]?.trim()

    if (!token || !value || !semanticTokens.has(token) || channelPattern.test(value)) continue

    const index = match.index
    const before = source.slice(0, index)
    const line = before.split('\n').length
    const lineStart = before.lastIndexOf('\n') + 1

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
