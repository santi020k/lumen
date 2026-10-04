import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { build } from 'esbuild'

const root = fileURLToPath(new URL('../', import.meta.url))

await mkdir(`${root}dist`, { recursive: true })

await build({
  absWorkingDir: root,
  bundle: true,
  entryPoints: ['src/plugin.ts'],
  format: 'iife',
  outfile: 'dist/code.js',
  target: 'es2020'
})

const ui = await build({
  absWorkingDir: root,
  bundle: true,
  define: { 'process.env.NODE_ENV': '"production"' },
  entryPoints: ['src/ui.tsx'],
  format: 'iife',
  jsx: 'automatic',
  minify: true,
  outfile: 'ui.js',
  target: 'es2020',
  write: false
})

const script = ui.outputFiles.find(file => file.path.endsWith('.js'))?.text
const styles = ui.outputFiles.find(file => file.path.endsWith('.css'))?.text

if (!script || !styles) throw new Error('The plugin UI build did not produce JavaScript and CSS.')

const html = `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Lumen for Figma · Beta</title><style>${styles.replaceAll('</style', '<\\/style')}</style></head><body><div id="root"></div><script>${script.replaceAll('</script', '<\\/script')}</script></body></html>`

await writeFile(`${root}dist/ui.html`, html)

await writeFile(`${root}dist/manifest.json`, await readFile(`${root}manifest.json`))

console.log('Built Lumen for Figma beta: import apps/figma-plugin/dist/manifest.json in Figma desktop.')
