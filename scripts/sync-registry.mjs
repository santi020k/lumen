import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const manifestUrl = new URL('../registry/lumen.registry.json', import.meta.url)
const outputUrl = new URL('../packages/lumen/src/registry-data.ts', import.meta.url)
const checkOnly = process.argv.includes('--check')
const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'))

delete manifest.$schema

const generated = [
  '// Generated from registry/lumen.registry.json by `pnpm run sync:registry`. Do not edit directly.',
  "import type { LumenRegistry } from './registry-types.js'",
  '',
  `export const lumenRegistry = ${JSON.stringify(manifest, null, 2)} as const satisfies LumenRegistry`,
  ''
].join('\n')

const current = await readFile(outputUrl, 'utf8').catch(() => {})

if (checkOnly) {
  if (current !== generated) {
    throw new Error(
      `${fileURLToPath(outputUrl)} is out of sync with registry/lumen.registry.json.\n` +
      'Run `pnpm run sync:registry` and commit the result.\n'
    )
  }

  process.stdout.write('Registry data is in sync with registry/lumen.registry.json\n')
} else if (current === generated) {
  process.stdout.write('Registry data already in sync\n')
} else {
  await writeFile(outputUrl, generated, 'utf8')

  process.stdout.write(`Wrote ${fileURLToPath(outputUrl)}\n`)
}
