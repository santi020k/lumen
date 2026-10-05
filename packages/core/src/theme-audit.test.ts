// @vitest-environment jsdom

import { describe, expect, test } from 'vitest'

import { lumenSemanticColorTokenNames } from './theme.js'
import { auditLumenTheme, inspectLumenTheme } from './theme-audit.js'

const readable = Object.fromEntries(lumenSemanticColorTokenNames.map(token => [token, token.startsWith('ink') || ['brand-solid', 'danger'].includes(token) ? '0 0% 0%' : '0 0% 100%']))

describe('consumer semantic theme audit', () => {
  test('requires every semantic mapping instead of silently filling a palette', () => {
    expect(auditLumenTheme(readable).healthy).toBe(true)
    expect(auditLumenTheme({}).findings).toHaveLength(lumenSemanticColorTokenNames.length)
    expect(auditLumenTheme({ ...readable, 'on-brand': '' }).findings).toEqual([expect.objectContaining({ rule: 'missing-token', tokens: ['on-brand'] })])
  })

  test('checks text and action foreground/background pairs', () => {
    const result = auditLumenTheme({ ...readable, 'on-brand': '0 0% 0%', 'ink-soft': '0 0% 90%' })

    expect(result.healthy).toBe(false)
    expect(result.findings.map(item => item.tokens)).toEqual([['ink-soft', 'surface'], ['on-brand', 'brand-solid']])
  })

  test.each(['var(--brand)', '#fff', 'hsl(0 0% 0%)', '0 0% 0% / .5', '0 101% 0%', '0 0% -1%'])('does not manufacture a contrast pass for %s', value => {
    expect(auditLumenTheme({ ...readable, ink: value }).findings).toEqual([expect.objectContaining({ rule: 'unresolved-color' })])
  })

  test('inspects separate light, dark and nested resolved scopes', () => {
    const scope = document.createElement('div')

    document.body.append(scope)

    for (const [token, value] of Object.entries(readable)) scope.style.setProperty(`--${token}`, value)

    expect(inspectLumenTheme(scope).healthy).toBe(true)

    scope.style.setProperty('--ink', '0 0% 100%')

    expect(inspectLumenTheme(scope).findings.some(item => item.rule === 'text-contrast')).toBe(true)

    scope.remove()
  })
})
