import type { SatteriProcessorOptions as MarkdownProcessorOptions } from '@astrojs/markdown-satteri'

const migrationRoutes: Readonly<Record<string, string>> = {
  '/docs/migrating-v1-to-v2.md': '/docs/migrations/v1-to-v2',
  '/docs/migrating-v2-to-v3.md': '/docs/migrations/v2-to-v3',
  '/docs/migrating-v3-to-v4.md': '/docs/migrations/v3-to-v4'
}

export const resolveMigrationLink = (href: string): string => {
  if (href.startsWith('#') || href.startsWith('/') || /^[a-z][a-z\d+.-]*:/iu.test(href)) return href

  const resolved = new URL(href, 'https://repository.invalid/docs/')
  const route = migrationRoutes[resolved.pathname]

  return route ?
    `${route}${resolved.hash}` :
    `https://github.com/santi020k/lumen/blob/main${resolved.pathname}${resolved.hash}`
}

// Only the imported migration documents need repository-relative links adapted for the website.
export const migrationMarkdownLinks: NonNullable<MarkdownProcessorOptions['mdastPlugins']>[number] = context => {
  if (!context.fileURL || !/\/docs\/migrating-v[123]-to-v[234]\.md$/u.test(context.fileURL.pathname)) return false

  return {
    definition(node, ctx) {
      ctx.setProperty(node, 'url', resolveMigrationLink(node.url))
    },
    link(node, ctx) {
      ctx.setProperty(node, 'url', resolveMigrationLink(node.url))
    },
    name: 'migration-document-links'
  }
}
