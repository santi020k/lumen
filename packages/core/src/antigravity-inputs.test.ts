import { expect, test } from 'vitest'

import { tokenizeLumenCode } from './code.js'
import { registerLumenIconPack, renderLumenIconSvg, resolveLumenIconName } from './icons.js'
import { parseThemeCss } from './theme.js'

test.each(['constructor', 'toString', '__proto__'])('rejects inherited icon names: %s', name => {
  expect(resolveLumenIconName(name)).toBeUndefined()
  expect(renderLumenIconSvg(name)).toBe('')
})

test('keeps tag-free HTML prose without syntax colors', () => {
  expect(tokenizeLumenCode('Hello World', 'html').every(token => token.kind === undefined)).toBe(true)
  expect(tokenizeLumenCode('Hello World', 'html').map(token => token.value).join('')).toBe('Hello World')
})

test('preserves markup attribute classification after > inside quoted attribute values', () => {
  const tokens = tokenizeLumenCode('<div title="a > b" data-expr=\'x > y\' class="hero">Hello</div>', 'html')

  expect(tokens.find(token => token.value === 'div')?.kind).toBe('keyword')
  expect(tokens.find(token => token.value === 'title')?.kind).toBe('type')
  expect(tokens.find(token => token.value === 'data-expr')?.kind).toBe('type')
  expect(tokens.find(token => token.value === 'class')?.kind).toBe('type')
  expect(tokens.find(token => token.value === 'Hello')?.kind).toBeUndefined()
})

test('tokenizes adversarial long YAML, Markdown, and Markup inputs in linear time', () => {
  const start = performance.now()
  const yamlSource = 'a.'.repeat(25_000)
  const escapedQuotes = '\\"'.repeat(20_000)
  const markdownBrackets = '[a'.repeat(25_000)
  const markdownLinks = '[a](b'.repeat(25_000)
  const markupAttributes = `<div ${'a '.repeat(25_000)}>`

  expect(tokenizeLumenCode(yamlSource, 'yaml').map(token => token.value).join('')).toBe(yamlSource)
  expect(tokenizeLumenCode(escapedQuotes, 'yaml').map(token => token.value).join('')).toBe(escapedQuotes)
  expect(tokenizeLumenCode(escapedQuotes, 'html').map(token => token.value).join('')).toBe(escapedQuotes)
  expect(tokenizeLumenCode(markdownBrackets, 'markdown').map(token => token.value).join('')).toBe(markdownBrackets)
  expect(tokenizeLumenCode(markdownLinks, 'markdown').map(token => token.value).join('')).toBe(markdownLinks)
  expect(tokenizeLumenCode(markupAttributes, 'html').at(-1)?.kind).toBe('symbol')
  expect(performance.now() - start).toBeLessThan(1_000)
})

test('preserves EOF inline code, unmatched delimiters, Unicode whitespace, and contiguous token offsets', () => {
  const eofMarkdown = '## Install\nUse `pnpm add`'
  const eofMarkdownTokens = tokenizeLumenCode(eofMarkdown, 'markdown')

  expect(eofMarkdownTokens.find(token => token.value === '`pnpm add`')?.kind).toBe('string')
  expect(eofMarkdownTokens.map(token => token.value).join('')).toBe(eofMarkdown)

  const unmatchedSamples = [
    ['```unclosed fence\n`inline`\n<!-- unclosed comment', 'markdown'],
    ['<!-- unclosed comment <div>ok</div>', 'html'],
    ['"unclosed \\"quote\\" and more', 'yaml']
  ] as const

  for (const [sample, language] of unmatchedSamples) {
    const tokens = tokenizeLumenCode(sample, language)
    let expectedStart = 0

    for (const token of tokens) {
      expect(token.start).toBe(expectedStart)
      expectedStart += token.value.length
    }

    expect(tokens.map(token => token.value).join('')).toBe(sample)
  }

  const nbspJsonTokens = tokenizeLumenCode('{"enabled"\u00A0: true}', 'json5')
  const nbspYamlTokens = tokenizeLumenCode('name\u00A0: Astro', 'yaml')
  const nbspMarkdownTokens = tokenizeLumenCode('##\u00A0Heading\n-\u00A0Item', 'markdown')

  expect(nbspJsonTokens.find(token => token.value === '"enabled"')?.kind).toBe('keyword')
  expect(nbspYamlTokens.find(token => token.value === 'name')?.kind).toBe('keyword')
  expect(nbspMarkdownTokens.find(token => token.value === '##')?.kind).toBe('keyword')
  expect(nbspMarkdownTokens.find(token => token.value === '-\u00A0')?.kind).toBe('symbol')
})

test('parses exact theme custom properties linearly across Unicode, escaped, and unterminated inputs', () => {
  const start = performance.now()

  expect(parseThemeCss(`--brand: ${' '.repeat(100_000)}`)).toEqual({})
  expect(parseThemeCss(`${'--brand: 10\n'.repeat(25_000)}--accent: 168 76% 36%;`)).toEqual({
    brand: `${'10\n--brand: '.repeat(24_999)}10\n--accent: 168 76% 36%`
  })
  expect(performance.now() - start).toBeLessThan(500)

  expect(parseThemeCss([
    ':root {',
    '  --custom--brand: 0 100% 50%;',
    '  --café--brand: 0 100% 50%;',
    '  --foo\\--brand: 0 100% 50%;',
    '  --\\62 rand: 0 100% 50%;',
    '  ---brand: 0 100% 50%;',
    '  --brand: 221 83% 53%;',
    '  --brand: 120 50% 40%;',
    '}'
  ].join('\n'))).toEqual({
    brand: '221 83% 53%'
  })

  expect(parseThemeCss(':root { --brand:   ; --brand: 221 83% 53%; }')).toEqual({
    brand: ''
  })
})

test('rejects inherited names in registered icon packs', () => {
  registerLumenIconPack('audit-pack', {})
  expect(resolveLumenIconName('audit-pack:constructor')).toBeUndefined()
  expect(renderLumenIconSvg('audit-pack:constructor')).toBe('')
})
