import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { JSDOM } from 'jsdom'

export const decodeMetadataText = value => JSDOM.fragment(value).textContent ?? ''

/** Catch drift that basic image-existence and sitemap audits cannot detect. */
export const auditSocialCardMetadata = async ({ directory, pages }) => {
  const manifest = JSON.parse(await readFile(path.join(directory, 'og/manifest.json'), 'utf8'))

  return pages.filter(page => page.indexable && !page.redirect).flatMap(page => {
    const issue = (code, message) => ({ code, file: page.file, message, route: page.route, severity: 'error' })

    if (!page.canonical) return [issue('missing-canonical', 'Public page needs a canonical URL.')]

    const pathname = new URL(page.canonical).pathname
    const card = manifest.routes[pathname]

    if (!card) return [issue('missing-social-card', 'Public page has no generated social card.')]

    const issues = []

    if (card.title !== decodeMetadataText(page.title ?? '')) issues.push(issue('social-title-drift', 'Social card title differs from the final page title.'))

    if (card.description !== decodeMetadataText(page.description ?? '')) issues.push(issue('social-description-drift', 'Social card description differs from the final page description.'))

    if (!page.schemaTypes.includes('WebPage') && !page.schemaTypes.includes('TechArticle')) {
      issues.push(issue('missing-page-schema', 'Public page needs WebPage or TechArticle structured data.'))
    }

    return issues
  })
}
