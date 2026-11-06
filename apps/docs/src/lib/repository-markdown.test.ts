import { satteri } from '@astrojs/markdown-satteri'
import { describe, expect, test } from 'vitest'

import { repositoryMarkdownLinks, resolveRepositoryLink } from './repository-markdown'

describe('repository document links', () => {
  test.each([
    ['migrating-v1-to-v2.md', '/docs/migrations/v1-to-v2'],
    ['migrating-v2-to-v3.md', '/docs/migrations/v2-to-v3'],
    ['migrating-v4-to-v5.md#review-apply-and-verify', '/docs/migrations/v4-to-v5#review-apply-and-verify'],
    ['migrating-v3-to-v4.md#content-flow-and-layout-spacing', '/docs/migrations/v3-to-v4#content-flow-and-layout-spacing'],
    ['../registry/lumen-4-contract.json', 'https://github.com/santi020k/lumen/blob/main/registry/lumen-4-contract.json'],
    ['native-patterns.md', 'https://github.com/santi020k/lumen/blob/main/docs/native-patterns.md'],
    ['#upgrade', '#upgrade'],
    ['/docs/web', '/docs/web'],
    ['https://example.com', 'https://example.com']
  ])('resolves %s to %s', (href, expected) => {
    expect(resolveRepositoryLink(href)).toBe(expected)
  })

  test('rewrites inline and reference links only in the imported repository documents', async () => {
    const renderer = await satteri({ mdastPlugins: [repositoryMarkdownLinks] }).createRenderer({
      syntaxHighlight: false
    })
    const source = '[Next](migrating-v2-to-v3.md) and [contract][v4].\n\n[v4]: ../registry/lumen-4-contract.json'
    const unrelated = await renderer.render(source, { fileURL: new URL('file:///repo/docs/ai-usage.md') })
    const migration = await renderer.render(source, { fileURL: new URL('file:///repo/docs/migrating-v3-to-v4.md') })

    const theme = await renderer.render('[Download](../apps/docs/public/examples/themes/harbor.css)', {
      fileURL: new URL('file:///repo/docs/community-web-themes.md')
    })
    expect(theme.code).toContain('href="/examples/themes/harbor.css"')

    const firstUpgrade = await renderer.render(source, { fileURL: new URL('file:///repo/docs/migrating-v1-to-v2.md') })

    const fifthUpgrade = await renderer.render('[Guide](migrating-v4-to-v5.md) and [CSS](selective-installation.md)', {
      fileURL: new URL('file:///repo/docs/migrating-v4-to-v5.md')
    })

    expect(fifthUpgrade.code).toContain('href="/docs/migrations/v4-to-v5"')
    expect(fifthUpgrade.code).toContain('href="https://github.com/santi020k/lumen/blob/main/docs/selective-installation.md"')
    expect(firstUpgrade.code).toContain('href="/docs/migrations/v2-to-v3"')
    expect(unrelated.code).toContain('href="migrating-v2-to-v3.md"')
    expect(migration.code).toContain('href="/docs/migrations/v2-to-v3"')
    expect(migration.code).toContain('href="https://github.com/santi020k/lumen/blob/main/registry/lumen-4-contract.json"')
  })
})
