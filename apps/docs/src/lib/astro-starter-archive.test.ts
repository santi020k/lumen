import { strFromU8, unzipSync } from 'fflate'
import { expect, test } from 'vitest'

import { buildAstroStarterArchive } from './astro-starter-archive'

test('ships a standalone source project with all four routes and reproducible dependencies', () => {
  const archive = unzipSync(buildAstroStarterArchive())
  const prefix = 'lumen-astro-starter/'

  for (const file of ['LICENSE',
    'README.md',
    'package.json',
    'pnpm-lock.yaml',
    'astro.config.mjs',
    'src/Starter.astro',
    'src/pages/index.astro',
    'src/pages/ecommerce.astro',
    'src/pages/dashboard.astro',
    'src/pages/portfolio.astro']) {
    expect(archive[`${prefix}${file}`]?.length).toBeGreaterThan(0)
  }

  const manifest = archive[`${prefix}package.json`]
  expect(manifest).toBeDefined()
  if (!manifest) throw new Error('The starter manifest is missing from its download.')
  expect(strFromU8(manifest)).not.toContain('workspace:')
  expect(Object.keys(archive).every(path => path.startsWith(prefix))).toBe(true)
  expect(Object.keys(archive).some(path => /(?:node_modules|\.env|\/dist\/|\.astro\/)/u.test(path))).toBe(false)
  expect(buildAstroStarterArchive()).toEqual(buildAstroStarterArchive())
})
