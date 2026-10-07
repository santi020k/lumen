import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import type { AuditedPage } from '@santi020k/og/audit'
import { expect, test } from 'vitest'

import { auditSocialCardMetadata, decodeMetadataText } from '../../scripts/seo-rules.mjs'

test('decodes HTML entities exactly once for readable social images', () => {
  expect(decodeMetadataText('Charts &amp; reporting &#8212; UI')).toBe('Charts & reporting — UI')
  expect(decodeMetadataText('&lt;Button&gt; &amp;amp;')).toBe('<Button> &amp;')
})

test('rejects missing cards and title/description drift while skipping noindex pages', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'lumen-seo-'))
  const page: AuditedPage = {
    alternates: [],
    canonical: 'https://lumen.santi020k.com/docs',
    description: 'Charts &amp; reporting',
    file: 'docs/index.html',
    indexable: true,
    route: '/docs/',
    schemaTypes: ['WebPage'],
    title: 'Docs &amp; guides'
  }

  try {
    await mkdir(path.join(directory, 'og'))
    await writeFile(path.join(directory, 'og/manifest.json'), JSON.stringify({ routes: {
      '/docs': { description: 'Charts & reporting', title: 'Docs & guides' }
    } }))

    expect(await auditSocialCardMetadata({ directory, pages: [page] })).toEqual([])
    expect(await auditSocialCardMetadata({ directory, pages: [{ ...page, description: 'Changed', title: 'Changed' }] }))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ code: 'social-title-drift', severity: 'error' }),
        expect.objectContaining({ code: 'social-description-drift', severity: 'error' })
      ]))
    expect(await auditSocialCardMetadata({ directory, pages: [{ ...page, canonical: 'https://lumen.santi020k.com/new' }] }))
      .toEqual([expect.objectContaining({ code: 'missing-social-card' })])
    expect(await auditSocialCardMetadata({ directory, pages: [{ ...page, indexable: false }] })).toEqual([])
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
})
