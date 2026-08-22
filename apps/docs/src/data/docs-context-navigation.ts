import type { DocsPlatformId } from './platforms'

export interface DocsContextLink {
  href: string
  label: string
  match?: 'exact' | 'prefix'
}

const sharedNativeLinks = (platform: 'android' | 'apple' | 'react-native'): DocsContextLink[] => {
  const href = `/docs/${platform}`

  return [
    { href, label: 'Overview', match: 'exact' },
    { href: `${href}#installation`, label: 'Install' },
    { href: `${href}/components`, label: 'Components', match: 'prefix' },
    { href: `${href}#theme`, label: 'Theme' },
    { href: `${href}/playground`, label: 'Playground', match: 'prefix' },
    { href: `${href}#ai-usage`, label: 'AI usage' },
    { href: `${href}#principles`, label: 'Principles' }
  ]
}

const contextLinks: Record<DocsPlatformId | 'all', DocsContextLink[]> = {
  all: [
    { href: '/docs', label: 'Overview', match: 'exact' },
    { href: '/docs/figma', label: 'Figma', match: 'prefix' },
    { href: '/docs/ai-skill', label: 'AI skill', match: 'prefix' },
    { href: '/docs/mcp', label: 'MCP server', match: 'prefix' },
    { href: '/changelog', label: 'Changelog', match: 'prefix' }
  ],
  android: sharedNativeLinks('android'),
  apple: sharedNativeLinks('apple'),
  foundations: [
    { href: '/docs/foundations', label: 'Overview', match: 'exact' },
    { href: '/docs/foundations#installation', label: 'Use the tokens' },
    { href: '/docs/foundations#components', label: 'Coverage' },
    { href: '/docs/foundations#principles', label: 'Principles' }
  ],
  'react-native': sharedNativeLinks('react-native'),
  web: [
    { href: '/docs/web', label: 'Overview', match: 'exact' },
    { href: '/docs/components', label: 'Components', match: 'prefix' },
    { href: '/docs/web/playground', label: 'Playground', match: 'prefix' },
    { href: '/docs/frameworks/astro', label: 'Astro', match: 'prefix' },
    { href: '/docs/frameworks/react', label: 'React', match: 'prefix' },
    { href: '/docs/frameworks/elements', label: 'Elements', match: 'prefix' },
    { href: '/docs/forms', label: 'Forms', match: 'prefix' },
    { href: '/docs/icons', label: 'Icons', match: 'prefix' }
  ]
}

export const getDocsContextLinks = (platform: DocsPlatformId | undefined): DocsContextLink[] => (
  contextLinks[platform ?? 'all']
)

export const isDocsContextLinkCurrent = (link: DocsContextLink, pathname: string): boolean => {
  if (link.href.includes('#')) return false

  const normalizedPath = pathname.replace(/\/$/, '') || '/'
  const normalizedHref = link.href.replace(/\/$/, '') || '/'

  return link.match === 'prefix' ?
    normalizedPath === normalizedHref || normalizedPath.startsWith(`${normalizedHref}/`) :
    normalizedPath === normalizedHref
}
