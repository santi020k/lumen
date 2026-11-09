import { strToU8, zipSync } from 'fflate'

// Explicit source patterns keep credentials, dependencies, caches, and builds out of the download.
const sources = import.meta.glob<string>([
  '../../../../examples/astro-starter/src/**/*.{astro,ts,css,svg}',
  '../../../../examples/astro-starter/{package.json,pnpm-lock.yaml,pnpm-workspace.yaml,astro.config.mjs,tsconfig.json,README.md,LICENSE,.gitignore}'
], { eager: true, import: 'default', query: '?raw' })

export const buildAstroStarterArchive = (): Uint8Array => {
  const prefix = '../../../../examples/astro-starter/'

  const entries = Object.entries(sources).sort(([left], [right]) => left.localeCompare(right))
    .map(([path, content]): [string, Uint8Array] => [`lumen-astro-starter/${path.slice(prefix.length)}`, strToU8(content)])

  return zipSync(Object.fromEntries(entries), { level: 6, mtime: new Date(2026, 0, 1) })
}
