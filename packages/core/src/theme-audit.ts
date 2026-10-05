import { getContrastRatio, lumenSemanticColorTokenNames, type LumenThemeTokens } from './theme.js'

export interface LumenThemeAuditFinding {
  rule: 'missing-token' | 'unresolved-color' | 'text-contrast'
  tokens: readonly string[]
  message: string
  ratio?: number
}

export interface LumenThemeAudit {
  findings: LumenThemeAuditFinding[]
  healthy: boolean
}

const pairs = [
  ['ink', 'canvas'],
  ['ink', 'surface'],
  ['ink', 'surface-muted'],
  ['ink-soft', 'surface'],
  ['ink-muted', 'surface'],
  ['on-brand', 'brand-solid'],
  ['on-danger', 'danger']
] as const

const opaqueChannels = (value: string): boolean => {
  const parts = value.trim().split(/\s+/u)

  if (parts.length !== 3) return false

  const [hue = '', saturation = '', lightness = ''] = parts
  const numeric = (part: string) => /^-?\d+(?:\.\d+)?$/u.test(part)
  const percent = (part: string) => part.endsWith('%') && numeric(part.slice(0, -1)) && Number(part.slice(0, -1)) >= 0 && Number(part.slice(0, -1)) <= 100

  return numeric(hue) && Number.isFinite(Number(hue)) && percent(saturation) && percent(lightness)
}

const contrastFindings = (
  tokens: Readonly<LumenThemeTokens>, readable: ReadonlySet<string>
): LumenThemeAuditFinding[] => {
  const findings: LumenThemeAuditFinding[] = []

  for (const [foreground, background] of pairs) {
    const ink = tokens[foreground]
    const surface = tokens[background]

    if (!ink || !surface || !readable.has(foreground) || !readable.has(background)) continue

    const ratio = getContrastRatio(ink, surface)

    if (ratio < 4.5) findings.push({ rule: 'text-contrast', tokens: [foreground, background], ratio, message: `--${foreground} on --${background} has ${ratio}:1 contrast; normal text requires 4.5:1.` })
  }

  return findings
}

/** No default palette is injected: a missing or unresolved mapping cannot pass contrast. */
export const auditLumenTheme = (tokens: Readonly<LumenThemeTokens>): LumenThemeAudit => {
  const findings: LumenThemeAuditFinding[] = []
  const readable = new Set<string>()

  for (const token of lumenSemanticColorTokenNames) {
    const value = tokens[token]?.trim()

    if (!value) findings.push({ rule: 'missing-token', tokens: [token], message: `Missing semantic mapping --${token}.` })
    else if (!opaqueChannels(value)) findings.push({ rule: 'unresolved-color', tokens: [token], message: `--${token} needs resolved opaque HSL channels for this contrast check.` })
    else readable.add(token)
  }

  findings.push(...contrastFindings(tokens, readable))

  return { findings, healthy: findings.length === 0 }
}

/** Run once per representative light, dark and nested scope after its theme is applied. */
export const inspectLumenTheme = (scope: Element): LumenThemeAudit => {
  const view = scope.ownerDocument.defaultView

  if (!view) throw new Error('Theme inspection requires a document with a window.')

  const style = view.getComputedStyle(scope)
  const tokens = Object.fromEntries(lumenSemanticColorTokenNames.map(token => [token, style.getPropertyValue(`--${token}`).trim()]))

  return auditLumenTheme(tokens)
}
