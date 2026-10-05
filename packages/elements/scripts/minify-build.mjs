import { readFile, writeFile } from 'node:fs/promises'

import { transform } from 'esbuild'

for (const file of ['define.js', 'chart-html.js']) {
  const outputUrl = new URL(`../dist/${file}`, import.meta.url)
  const source = await readFile(outputUrl, 'utf8')

  const result = await transform(source, {
    format: 'esm',
    minify: true,
    target: 'es2022'
  })

  await writeFile(outputUrl, result.code)
}
