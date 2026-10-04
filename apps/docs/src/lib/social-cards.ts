import type { AuditedPage } from '@santi020k/og/audit'

const sections = [
  { prefix: '/guides', badge: 'Product guides' },
  { prefix: '/templates', badge: 'Templates' },
  { prefix: '/docs/apple', badge: 'SwiftUI' },
  { prefix: '/docs/android', badge: 'Android / Compose' },
  { prefix: '/docs/react-native', badge: 'React Native' },
  { prefix: '/docs/components', badge: 'Web components' },
  { prefix: '/docs/frameworks/', badge: 'Web frameworks' },
  { prefix: '/docs', badge: 'Documentation' }
]

const getBadge = (pathname: string) => {
  if (pathname === '/') return 'Lumen UI'

  return sections.find(section => pathname.startsWith(section.prefix))?.badge ?? 'Community & resources'
}

const getEyebrow = (pathname: string) => {
  if (pathname.includes('/data-visualization') || pathname.endsWith('/reporting')) return 'Charts & reporting'

  if (['/mcp', '/ai', '/migrations'].some(segment => pathname.includes(segment))) return 'AI & developer tools'

  return 'Accessible web & native UI'
}

/** Final rendered metadata is the source for both share cards and their manifest. */
export const getSocialCardMetadata = (page: AuditedPage) => {
  if (!page.title?.trim() || !page.description?.trim() || !page.canonical) {
    throw new Error(`Missing social-card metadata for ${page.route}`)
  }

  const pathname = new URL(page.canonical).pathname
  const cardTitle = page.title.replace(/\s[-–—]\sLumen (?:UI|templates)$/, '')
  const badge = getBadge(pathname)
  const eyebrow = getEyebrow(pathname)

  return {
    alt: `${cardTitle} — ${badge} social preview from Lumen UI`,
    badge,
    cardTitle,
    description: page.description,
    eyebrow,
    pathname,
    title: page.title
  }
}
