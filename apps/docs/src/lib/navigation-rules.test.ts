import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import type { AuditedPage } from '@santi020k/og/audit'
import { expect, test } from 'vitest'

import { auditNavigationDestinations } from '../../scripts/navigation-rules.mjs'

test('validates built navigation routes and fragments without treating examples as site navigation', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'lumen-navigation-'))
  const page = (route: string, file: string, indexable = true): AuditedPage => ({
    alternates: [], canonical: `https://lumen.santi020k.com${route.replace(/\/$/u, '')}`, file, indexable, route, schemaTypes: []
  })
  const pages = [page('/docs/', 'docs/index.html'), page('/guide/', 'guide/index.html'), page('/internal/', 'internal/index.html', false)]

  try {
    for (const folder of ['docs', 'guide', 'internal']) await mkdir(path.join(directory, folder))
    await writeFile(path.join(directory, 'guide/index.html'), '<h2 id="café">Guide</h2>')
    await writeFile(path.join(directory, 'download.txt'), 'Download')
    await writeFile(path.join(directory, 'docs-search.json'), JSON.stringify([
      { href: '/guide#caf%C3%A9' }, { href: '/guide#search-missing' }
    ]))
    await writeFile(path.join(directory, 'internal/index.html'), '<nav><a href="/ignored">Test fixture</a></nav>')
    await writeFile(path.join(directory, 'docs/index.html'), `
      <nav>
        <a href="/guide#caf%C3%A9">Encoded anchor</a>
        <a href="../guide/?q=example#caf%C3%A9">Relative link</a>
        <a href="guide#caf%C3%A9">Relative to the canonical URL without a trailing slash</a>
        <a href="/download.txt">Static file</a>
        <a href="https://example.com/remote">External</a>
        <a href="mailto:hello@example.com">Email</a>
        <a href="/missing">Missing page</a><a href="/missing">Duplicate</a>
        <a href="/guide#missing">Missing anchor</a>
        <a href="/guide#%">Malformed anchor</a>
        <a href="/%">Malformed path</a>
      </nav>
      <div data-playground-preview><nav><a href="/example">Example route</a></nav></div>
      <footer class="docs-site-footer"><a href="/footer-missing">Footer destination</a></footer>
    `)

    const issues = await auditNavigationDestinations({ directory, pages, siteUrl: new URL('https://lumen.santi020k.com') })

    expect(issues.map(issue => issue.code)).toEqual([
      'missing-navigation-route',
      'missing-navigation-fragment',
      'invalid-navigation-fragment',
      'invalid-navigation-url',
      'missing-navigation-route',
      'missing-navigation-fragment'
    ])
    expect(issues.slice(0, -1).every(issue => issue.route === '/docs/' && issue.severity === 'error')).toBe(true)
    expect(issues.at(-2)?.message).toContain('/footer-missing')
    expect(issues.at(-1)?.route).toBe('/docs-search.json')

    await writeFile(path.join(directory, 'docs-search.json'), '[{"href":7}]')
    expect(await auditNavigationDestinations({ directory, pages: [] }))
      .toEqual([expect.objectContaining({ code: 'invalid-search-index', severity: 'error' })])
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
})
