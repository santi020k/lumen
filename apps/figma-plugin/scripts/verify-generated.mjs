import { spawnSync } from 'node:child_process'
import { mkdir, readFile, symlink, writeFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { build } from 'esbuild'

const root = fileURLToPath(new URL('../', import.meta.url))
const fixture = `${root}.verification`

await mkdir(`${fixture}/src/pages`, { recursive: true })

await mkdir(`${fixture}/src/components`, { recursive: true })

try {
  await symlink(fileURLToPath(new URL('../../docs/node_modules', import.meta.url)), `${fixture}/node_modules`, 'dir')
} catch (error) {
  if (!(error instanceof Error) || !('code' in error) || error.code !== 'EEXIST') throw error
}

await build({
  absWorkingDir: root,
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: '.verification/generator.mjs',
  stdin: {
    contents: 'import { analyzeSelection } from \'./src/convert.ts\'; import { settingsFixture } from \'./src/fixtures.ts\'; export const code = analyzeSelection(settingsFixture).code;',
    resolveDir: root
  }
})

const generated = await import(pathToFileURL(`${fixture}/generator.mjs`).href)

if (typeof generated.code !== 'string') throw new Error('Missing generated Astro fixture.')

await writeFile(`${fixture}/src/components/Selection.astro`, generated.code)

await writeFile(`${fixture}/package.json`, '{"name":"lumen-figma-verification","private":true,"type":"module"}\n')

await writeFile(`${fixture}/tsconfig.json`, '{"extends":"astro/tsconfigs/strictest","include":[".astro/types.d.ts","src/**/*"],"exclude":["dist"]}\n')

await writeFile(`${fixture}/src/pages/index.astro`, `---
import Selection from '../components/Selection.astro'
import '@santi020k/lumen-astro/styles.css'
import UIPrimitives from '@santi020k/lumen-astro/runtime'
---
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Generated Lumen settings pilot</title></head><body><main><h1>Generated settings pilot</h1><Selection /></main><UIPrimitives /></body></html>
<style>body { margin: 0; color: hsl(var(--ink)); background: hsl(var(--canvas)); font-family: system-ui, sans-serif; } main { max-width: 52rem; margin: auto; padding: 1.5rem; } h1 { margin-bottom: 2rem; font-size: 1.5rem; }</style>
`)

const astroPackage = JSON.parse(await readFile(`${fixture}/node_modules/astro/package.json`, 'utf8'))
const bin = `${fixture}/node_modules/astro/${astroPackage.bin.astro}`

for (const command of ['check', 'build']) {
  const result = spawnSync(process.execPath, [bin, command, '--root', fixture], { stdio: 'inherit' })

  if (result.error) throw result.error

  if (result.status !== 0) process.exit(result.status ?? 1)
}
