import { readFile, writeFile } from 'node:fs/promises'

import { transform } from 'esbuild'

const outputUrl = new URL('../dist/define.js', import.meta.url)
const source = await readFile(outputUrl, 'utf8')

const result = await transform(source, {
  format: 'esm',
  minify: true,
  target: 'es2022'
})

await writeFile(outputUrl, result.code)
