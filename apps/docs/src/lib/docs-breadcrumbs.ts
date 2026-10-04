import { getDocsContextLinks, sharedDocumentationLinks } from '../data/docs-context-navigation'
import { getDocsPlatform, getPlatformGuide } from '../data/platforms'

export interface DocsBreadcrumb {
  href: string
  label: string
}

/** Use real navigation destinations as ancestors instead of guessing routes from URL segments. */
export const getDocsBreadcrumbs = (
  pathname: string,
  title: string,
  explicit?: DocsBreadcrumb[]
): DocsBreadcrumb[] => {
  if (explicit !== undefined) return explicit

  const path = pathname.replace(/\/$/, '') || '/'
  const platform = getDocsPlatform(path)

  const breadcrumbs = new Map<string, DocsBreadcrumb>([
    ['/docs', { href: '/docs', label: 'Documentation' }]
  ])

  if (platform) {
    const guide = getPlatformGuide(platform)

    breadcrumbs.set(guide.href, { href: guide.href, label: guide.label })
  }

  const ancestors = [...sharedDocumentationLinks, ...getDocsContextLinks(platform)]
    .filter(link => !link.href.includes('#') && (path === link.href || path.startsWith(`${link.href}/`)))
    .sort((left, right) => left.href.length - right.href.length)

  for (const ancestor of ancestors) {
    if (!breadcrumbs.has(ancestor.href)) {
      breadcrumbs.set(ancestor.href, { href: ancestor.href, label: ancestor.label })
    }
  }

  if (!breadcrumbs.has(path)) {
    const label = title.replace(/\s[-–—]\sLumen UI$/, '').trim()

    breadcrumbs.set(path, { href: path, label: label || 'Lumen documentation' })
  }

  return Array.from(breadcrumbs.values())
}
