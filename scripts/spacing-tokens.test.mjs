import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { generateSpacingCss, parseSpacingTokens } from './lib/spacing-tokens.mjs'

const source = JSON.parse(await readFile(new URL('../tokens/lumen.tokens.json', import.meta.url), 'utf8'))

test('layout roles resolve to canonical dimensions and scalable CSS', () => {
  const tokens = parseSpacingTokens(JSON.stringify(source))

  assert.equal(tokens.spacing[tokens.spacingRoles.related], 8)

  assert.equal(tokens.spacing[tokens.spacingRoles.group], 16)

  assert.equal(tokens.spacing[tokens.spacingRoles.section], 32)

  assert.equal(tokens.spacing[tokens.spacingRoles.inset], 24)

  assert.match(generateSpacingCss(tokens), /--ui-space-md: 0\.75rem;/u)

  assert.match(generateSpacingCss(tokens), /--ui-space-related: var\(--ui-space-sm\);/u)
})

test('rejects missing roles, unknown aliases and invalid dimensions', () => {
  const missing = structuredClone(source)

  delete missing.layout.related

  assert.throws(() => parseSpacingTokens(JSON.stringify(missing)), /Missing layout spacing role/u)

  for (const reference of ['{space.missing}', '{radius.sm}', '{space.sm}trailing']) {
    const invalid = structuredClone(source)

    invalid.layout.related.$value = reference

    assert.throws(() => parseSpacingTokens(JSON.stringify(invalid)), /spacing (token|reference)/u)
  }

  for (const value of [{ unit: 'em', value: 8 }, { unit: 'px', value: -1 }, { unit: 'px', value: '8' }]) {
    const invalid = structuredClone(source)

    invalid.space.sm.$value = value

    assert.throws(() => parseSpacingTokens(JSON.stringify(invalid)), /Invalid spacing dimension/u)
  }
})
