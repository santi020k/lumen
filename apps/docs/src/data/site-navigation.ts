export interface SiteNavigationItem {
  href: string
  label: string
  matches: readonly string[]
}

export const siteNavigationItems: readonly SiteNavigationItem[] = [
  {
    href: '/docs',
    label: 'Docs',
    matches: ['/docs', '/changelog']
  },
  {
    href: '/guides',
    label: 'Guides',
    matches: ['/guides']
  },
  {
    href: '/templates',
    label: 'Templates',
    matches: ['/templates']
  },
  {
    href: '/community',
    label: 'Community',
    matches: ['/community', '/teams']
  }
]

const matchesRoute = (pathname: string, prefix: string): boolean => (
  pathname === prefix || pathname.startsWith(`${prefix}/`)
)

export const getActiveSiteNavigationIndex = (pathname: string): number => (
  siteNavigationItems.findIndex(item => item.matches.some(prefix => matchesRoute(pathname, prefix)))
)
