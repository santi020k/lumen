import { expect, test } from 'vitest'

import { migrateLumenVersionSource } from './version-migration.js'

test('migrates literal visual sizes in aliased imports and custom elements while preserving native size', () => {
  const source = `import { Select as Choice, PhoneInput, Segmented, Input, Button } from '@santi020k/lumen-react'
<Choice size="md" /><PhoneInput size={'lg'} /><Segmented size="sm" />
<Choice size={8} /><Input size={20} /><Button size="sm" />`
  const result = migrateLumenVersionSource(source, 'Screen.tsx', 'v4')

  expect(result.source).toContain('<Choice visualSize="default" />')
  expect(result.source).toContain('<PhoneInput visualSize={\'lg\'} />')
  expect(result.source).toContain('<Segmented visualSize="sm" />')
  expect(result.source).toContain('<Choice size={8} /><Input size={20} /><Button size="sm" />')
  expect(result.changes.filter(change => change.kind === 'control-size')).toHaveLength(3)
  const elements = '<lumen-select size=lg></lumen-select><lumen-phone-input size="sm"></lumen-phone-input><lumen-segmented size="default"></lumen-segmented><lumen-select size="8"></lumen-select>'

  expect(migrateLumenVersionSource(elements, 'Screen.html', 'v4').source).toBe(elements
    .replace('size=lg', 'visual-size=lg')
    .replace('size="sm"', 'visual-size="sm"')
    .replace('size="default"', 'visual-size="default"'))
})

test('preserves ambiguous sizes, examples, unrelated components, and v3 migrations', () => {
  const source = `---
import { Select, PhoneInput } from '@santi020k/lumen-astro'
const example = '<Select size="lg" />'
---
<!-- <PhoneInput size="sm" /> -->
<Select size={density} /><Select size="lg" {...props} /><Select size="sm" visualSize="lg" />
<PhoneInput {...props} /><Other size="sm" />`
  const result = migrateLumenVersionSource(source, 'Screen.astro', 'v4')

  expect(result.source).toBe(source)
  expect(result.manualReview.filter(change => change.kind === 'control-size')).toHaveLength(4)
  expect(migrateLumenVersionSource(source, 'Screen.astro', 'v3').source).toBe(source)
})

test('visual-size rewrites are idempotent, compose with spacing, and preserve unsupported SDK files', () => {
  const source = `import { Select, Stack } from '@santi020k/lumen-react'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
<Stack gap="md"><Select size="sm" /></Stack>`
  const result = migrateLumenVersionSource(source, 'Screen.tsx', 'v4')

  expect(result.source).toContain('<Stack gap="group"><Select visualSize="sm" /></Stack>')
  expect(result.source).toContain('from \'@modelcontextprotocol/sdk/server/mcp.js\'')
  const sizes = migrateLumenVersionSource(result.source, 'Screen.tsx', 'v4')

  expect(sizes.source).toBe(result.source)
})
