import { satteri } from '@astrojs/markdown-satteri'
import { describe, expect, test } from 'vitest'

import { migrationMarkdownLinks, resolveMigrationLink } from './migration-markdown'

describe('migration document links', () => {
  test.each([
    ['migrating-v1-to-v2.md', '/docs/migrations/v1-to-v2'],
    ['migrating-v2-to-v3.md', '/docs/migrations/v2-to-v3'],
    ['migrating-v3-to-v4.md#content-flow-and-layout-spacing', '/docs/migrations/v3-to-v4#content-flow-and-layout-spacing'],
    ['../registry/lumen-4-contract.json', 'https://github.com/santi020k/lumen/blob/main/registry/lumen-4-contract.json'],
    ['native-patterns.md', 'https://github.com/santi020k/lumen/blob/main/docs/native-patterns.md'],
    ['#upgrade', '#upgrade'],
    ['/docs/web', '/docs/web'],
    ['https://example.com', 'https://example.com']
  ])('resolves %s to %s', (href, expected) => {
    expect(resolveMigrationLink(href)).toBe(expected)
  })

  test('rewrites inline and reference links only in the imported migration documents', async () => {
    const renderer = await satteri({ mdastPlugins: [migrationMarkdownLinks] }).createRenderer({
      syntaxHighlight: false
    })
    const source = '[Next](migrating-v2-to-v3.md) and [contract][v4].\n\n[v4]: ../registry/lumen-4-contract.json'
    const unrelated = await renderer.render(source, { fileURL: new URL('file:///repo/docs/ai-usage.md') })
    const migration = await renderer.render(source, { fileURL: new URL('file:///repo/docs/migrating-v3-to-v4.md') })

    const firstUpgrade = await renderer.render(source, { fileURL: new URL('file:///repo/docs/migrating-v1-to-v2.md') })

    expect(firstUpgrade.code).toContain('href="/docs/migrations/v2-to-v3"')
    expect(unrelated.code).toContain('href="migrating-v2-to-v3.md"')
    expect(migration.code).toContain('href="/docs/migrations/v2-to-v3"')
    expect(migration.code).toContain('href="https://github.com/santi020k/lumen/blob/main/registry/lumen-4-contract.json"')
  })
})
