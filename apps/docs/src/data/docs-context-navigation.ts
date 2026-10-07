import type { DocsPlatformId } from './platforms'

export interface DocsContextLink {
  href: string
  label: string
  match?: 'exact' | 'prefix'
}

export const sharedDocumentationLinks = [
  { href: '/docs', label: 'Project overview' },
  { href: '/docs/foundations', label: 'Shared foundations' },
  { href: '/docs/packages', label: 'Packages' },
  { href: '/docs/figma', label: 'Figma' },
  { href: '/docs/ai-skill', label: 'AI skill' },
  { href: '/docs/mcp', label: 'MCP server' },
  { href: '/docs/migrations', label: 'Migration guides' },
  { href: '/changelog', label: 'Changelog' }
] as const

const sharedNativeLinks = (platform: 'android' | 'apple' | 'react-native'): DocsContextLink[] => {
  const href = `/docs/${platform}`

  return [
    { href, label: 'Overview', match: 'exact' },
    { href: `${href}/installation`, label: 'Install' },
    { href: `${href}/components`, label: 'Components', match: 'prefix' },
    ...(platform === 'react-native' ? [{ href: `${href}/hooks`, label: 'Hooks', match: 'prefix' as const }] : []),
    { href: `${href}/theming`, label: 'Theme' },
    { href: `${href}/playground`, label: 'Playground', match: 'prefix' },
    { href: `${href}/ai`, label: 'AI usage' },
    { href: `${href}#principles`, label: 'Principles' }
  ]
}

const contextLinks: Record<DocsPlatformId | 'all', DocsContextLink[]> = {
  all: [
    { href: '/docs', label: 'Project overview', match: 'exact' },
    { href: '/docs/foundations', label: 'Foundations', match: 'prefix' },
    { href: '/docs/packages', label: 'Packages', match: 'prefix' },
    { href: '/docs/figma', label: 'Figma', match: 'prefix' },
    { href: '/docs/ai-skill', label: 'AI skill', match: 'prefix' },
    { href: '/docs/mcp', label: 'MCP server', match: 'prefix' },
    { href: '/docs/migrations', label: 'Migration guides', match: 'prefix' },
    { href: '/changelog', label: 'Changelog', match: 'prefix' }
  ],
  android: sharedNativeLinks('android'),
  apple: sharedNativeLinks('apple'),
  foundations: [
    { href: '/docs/foundations', label: 'Overview', match: 'exact' },
    { href: '/docs/foundations#tokens-in-use', label: 'Color roles' },
    { href: '/docs/foundations#composition-in-use', label: 'Composition' },
    { href: '/docs/foundations#foundation-scales', label: 'Space and surfaces' },
    { href: '/docs/foundations#foundation-motion', label: 'Motion' },
    { href: '/docs/foundations#installation', label: 'Use the tokens' },
    { href: '/docs/foundations#components', label: 'Coverage' },
    { href: '/docs/foundations#principles', label: 'Principles' }
  ],
  'react-native': sharedNativeLinks('react-native'),
  web: [
    { href: '/docs/web', label: 'Overview', match: 'exact' },
    { href: '/docs/components', label: 'Components', match: 'prefix' },
    { href: '/docs/web/playground', label: 'Playground', match: 'prefix' },
    { href: '/docs/web/data-visualization', label: 'Data visualization', match: 'prefix' },
    { href: '/docs/frameworks/astro', label: 'Astro', match: 'prefix' },
    { href: '/docs/frameworks/react', label: 'React', match: 'prefix' },
    { href: '/docs/frameworks/elements', label: 'Elements', match: 'prefix' },
    { href: '/docs/forms', label: 'Forms', match: 'prefix' },
    { href: '/docs/web/consumer-workflows', label: 'Consumer workflows' },
    { href: '/docs/icons', label: 'Icons', match: 'prefix' },
    { href: '/docs/web/world-map', label: 'WorldMap guides', match: 'prefix' }
  ]
}

export const getDocsContextLinks = (platform: DocsPlatformId | undefined): DocsContextLink[] => (
  contextLinks[platform ?? 'all']
)

const normalizeHash = (hash: string): string => {
  const value = hash.startsWith('#') ? hash.slice(1) : hash

  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export const isDocsContextLinkCurrent = (link: DocsContextLink, pathname: string, hash = ''): boolean => {
  const [hrefPath = '', hrefHash] = link.href.split('#')
  const normalizedPath = pathname.replace(/\/$/, '') || '/'
  const normalizedHref = hrefPath.replace(/\/$/, '') || '/'

  if (hrefHash !== undefined) {
    return normalizedPath === normalizedHref && normalizeHash(hash) === normalizeHash(hrefHash)
  }

  return link.match === 'prefix' ?
    normalizedPath === normalizedHref || normalizedPath.startsWith(`${normalizedHref}/`) :
    normalizedPath === normalizedHref
}

export const getCurrentDocsContextLink = (
  links: DocsContextLink[], pathname: string, hash = ''
): DocsContextLink | undefined => (
  links.find(link => link.href.includes('#') && isDocsContextLinkCurrent(link, pathname, hash)) ??
  links.find(link => !link.href.includes('#') && isDocsContextLinkCurrent(link, pathname))
)
