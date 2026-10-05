import { readFile, writeFile } from 'node:fs/promises'

import { transform } from 'esbuild'

for (const file of ['define.js', 'chart-html.js', 'consumer-behaviors.js']) {
  const outputUrl = new URL(`../dist/${file}`, import.meta.url)
  const source = await readFile(outputUrl, 'utf8')

  const options = {
    charset: 'utf8',
    format: 'esm',
    minify: true,
    treeShaking: true,
    target: 'es2022'
  }

  const compact = await transform(source, options)
  // Compact generated aliases again within the existing registration budget.
  const result = await transform(compact.code, options)

  await writeFile(outputUrl, result.code)
}
