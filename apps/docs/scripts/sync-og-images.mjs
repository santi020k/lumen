import { cp, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const destination = path.resolve(root, process.env.LUMEN_DOCS_OUT_DIR ?? 'dist', 'og')
const source = path.join(root, 'public/og')

if (destination === source) throw new Error('The docs output directory must differ from public assets.')

// Astro has already copied public assets. Replace that copy with the freshly generated cards.
await rm(destination, { force: true, recursive: true })

await cp(source, destination, { recursive: true })
