// @vitest-environment jsdom
import { expect, test } from 'vitest'

import { createCatalogSvg, parseIconEntries } from '../lib/icon-catalog'

import { brandEntries, iconEntries } from './icon-catalogs'

const catalogs = { brand: brandEntries, interface: iconEntries }

for (const [name, entries] of Object.entries(catalogs)) {
  test(`validates the complete ${name} catalog`, () => {
    expect(parseIconEntries(entries)).toHaveLength(entries.length)
  })

  // Keep every SVG in scope as the catalogs grow, with a bounded workload per case.
  const batchSize = 48

  for (let start = 0; start < entries.length; start += batchSize) {
    const batch = entries.slice(start, start + batchSize)

    test(`renders ${name} SVG geometry for entries ${start + 1}–${start + batch.length}`, () => {
      for (const entry of batch) expect(createCatalogSvg(entry.svg).localName).toBe('svg')
    })
  }
}
