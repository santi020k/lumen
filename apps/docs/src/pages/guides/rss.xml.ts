import type { APIRoute } from 'astro'

import { publishedGuides } from '../../data/guides'

const escapeXml = (value: string): string => {
  const replacements: Record<string, string> = {
    '"': '&quot;',
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
  }

  let escaped = ''

  for (const character of value) escaped += replacements[character] ?? character

  return escaped
}

export const GET: APIRoute = ({ site }) => {
  const baseUrl = site ?? new URL('https://lumen.santi020k.com')

  const items = publishedGuides.map(guide => {
    const url = new URL(guide.href, baseUrl).toString()
    // Preserve published feed identities so a canonical link correction does not create new items.
    const guid = new URL(`${guide.href}/`, baseUrl).toString()

    return `<item>
      <title>${escapeXml(guide.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(guid)}</guid>
      <description>${escapeXml(guide.description)}</description>
      <dc:creator>${escapeXml(guide.author)}</dc:creator>
      <pubDate>${new Date(`${guide.publishedAt}T00:00:00Z`).toUTCString()}</pubDate>
    </item>`
  }).join('\n')

  const body = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Lumen UI Guides</title>
    <link>${new URL('/guides', baseUrl)}</link>
    <description>Practical guides for building accessible web and native product interfaces with Lumen UI.</description>
    <language>en</language>
    ${items}
  </channel>
</rss>`

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8'
    }
  })
}
