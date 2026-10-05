import { readFile, writeFile } from 'node:fs/promises'

import { transform } from 'esbuild'

for (const file of ['components.js', 'select-form.js', 'data-table.js', 'floating-panel.js', 'hooks.js', 'toast-provider.js']) {
  const outputUrl = new URL(`../dist/${file}`, import.meta.url)
  const source = await readFile(outputUrl, 'utf8')

  const result = await transform(source, {
    format: 'esm',
    minifySyntax: true,
    minifyWhitespace: true,
    target: 'es2022'
  })

  await writeFile(outputUrl, result.code)
}
