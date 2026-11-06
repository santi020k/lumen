import type { SatteriProcessorOptions as MarkdownProcessorOptions } from '@astrojs/markdown-satteri'

const websiteRoutes: Readonly<Record<string, string>> = {
  '/apps/docs/public/examples/themes/harbor.css': '/examples/themes/harbor.css',
  '/docs/community-web-themes.md': '/docs/web/themes',
  '/docs/migrating-v1-to-v2.md': '/docs/migrations/v1-to-v2',
  '/docs/migrating-v2-to-v3.md': '/docs/migrations/v2-to-v3',
  '/docs/migrating-v3-to-v4.md': '/docs/migrations/v3-to-v4',
  '/docs/migrating-v4-to-v5.md': '/docs/migrations/v4-to-v5'
}

export const resolveRepositoryLink = (href: string): string => {
  if (href.startsWith('#') || href.startsWith('/') || /^[a-z][a-z\d+.-]*:/iu.test(href)) return href

  const resolved = new URL(href, 'https://repository.invalid/docs/')
  const route = websiteRoutes[resolved.pathname]

  return route ?
    `${route}${resolved.hash}` :
    `https://github.com/santi020k/lumen/blob/main${resolved.pathname}${resolved.hash}`
}

// Only the imported repository documents need repository-relative links adapted for the website.
export const repositoryMarkdownLinks: NonNullable<MarkdownProcessorOptions['mdastPlugins']>[number] = context => {
  const pathname = context.fileURL?.pathname

  if (!pathname || !Object.keys(websiteRoutes).some(path => pathname.endsWith(path))) return false

  return {
    definition(node, ctx) {
      ctx.setProperty(node, 'url', resolveRepositoryLink(node.url))
    },
    link(node, ctx) {
      ctx.setProperty(node, 'url', resolveRepositoryLink(node.url))
    },
    name: 'repository-document-links'
  }
}
