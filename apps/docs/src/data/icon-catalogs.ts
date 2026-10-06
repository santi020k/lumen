import { createHash } from 'node:crypto'

import { lumenIcons, renderLumenIconSvg } from '@santi020k/lumen-core'
import { lumenBrandIconNames, registerLumenBrandIcons } from '@santi020k/lumen-icons-brand'

import type { IconEntry } from '../lib/icon-catalog'

const byName = new Map<string, { name: string, terms: Set<string> }>()

for (const [key, icon] of Object.entries(lumenIcons)) {
  const name = icon.name ?? key
  const existing = byName.get(name)

  if (existing) existing.terms.add(key)
  else byName.set(name, { name, terms: new Set([name, key]) })
}

export const iconEntries: IconEntry[] = [...byName.values()]
  .sort((a, b) => a.name.localeCompare(b.name))
  .map(({ name, terms }) => ({ name, svg: renderLumenIconSvg(name), terms: [...terms].join(' ') }))

registerLumenBrandIcons()

export const brandEntries: IconEntry[] = lumenBrandIconNames.map(name => ({
  name: `brand:${name}`,
  svg: renderLumenIconSvg(`brand:${name}`),
  terms: `${name} brand:${name}`
}))

const catalog = (entries: IconEntry[]) => {
  const json = JSON.stringify(entries)
  const hash = createHash('sha256').update(json).digest('hex').slice(0, 16)

  return { entries, hash, json, url: `/icon-catalogs/${hash}.json` }
}

export const interfaceCatalog = catalog(iconEntries)
export const brandCatalog = catalog(brandEntries)
