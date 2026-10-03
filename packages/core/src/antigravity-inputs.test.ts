import { expect, test } from 'vitest'

import { tokenizeLumenCode } from './code.js'
import { registerLumenIconPack, renderLumenIconSvg, resolveLumenIconName } from './icons.js'

test.each(['constructor', 'toString', '__proto__'])('rejects inherited icon names: %s', name => {
  expect(resolveLumenIconName(name)).toBeUndefined()
  expect(renderLumenIconSvg(name)).toBe('')
})

test('keeps tag-free HTML prose without syntax colors', () => {
  expect(tokenizeLumenCode('Hello World', 'html').every(token => token.kind === undefined)).toBe(true)
  expect(tokenizeLumenCode('Hello World', 'html').map(token => token.value).join('')).toBe('Hello World')
})

test('rejects inherited names in registered icon packs', () => {
  registerLumenIconPack('audit-pack', {})
  expect(resolveLumenIconName('audit-pack:constructor')).toBeUndefined()
  expect(renderLumenIconSvg('audit-pack:constructor')).toBe('')
})
