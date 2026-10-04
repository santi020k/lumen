import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

const require = createRequire(new URL('../packages/react/package.json', import.meta.url))
const { build } = require('esbuild')
const root = resolve(import.meta.dirname, '..')

const scenarios = {
  'react-root': "export { ImageComparison } from '@santi020k/lumen-react'",
  'react-selective': "export { ImageComparison } from '@santi020k/lumen-react/components/image-comparison'",
  'elements-root': "import { defineLumenElements } from '@santi020k/lumen-elements/define'; defineLumenElements(['VirtualList'])",
  'elements-selective': "import { defineLumenVirtualList } from '@santi020k/lumen-elements/components/virtual-list'; defineLumenVirtualList()"
}

const results = {}

for (const [name, contents] of Object.entries(scenarios)) {
  const result = await build({
    bundle: true,
    external: ['react', 'react/jsx-runtime'],
    format: 'esm',
    logLevel: 'silent',
    metafile: true,
    minify: true,
    platform: 'browser',
    stdin: { contents, resolveDir: resolve(root, `packages/${name.startsWith('react') ? 'react' : 'elements'}`) },
    treeShaking: true,
    write: false
  })

  const output = result.outputFiles[0]?.contents

  if (!output) throw new Error(`${name} produced no bundle`)

  const inputs = Object.keys(result.metafile.inputs)

  results[name] = { raw: output.length, gzip: gzipSync(output).length, modules: inputs.length }

  if (name === 'react-selective') assert.ok(!inputs.some(path => path.endsWith('/react/dist/components.js')), 'Standalone comparison must avoid the React component catalog')

  if (name === 'elements-selective') assert.ok(!inputs.some(path => path.endsWith('/elements/dist/define.js')), 'Granular registration must avoid the complete Elements catalog')
}

assert.ok(results['react-selective'].modules < results['react-root'].modules, 'Selective React imports must reduce the traversed module graph')

assert.ok(results['react-selective'].raw <= results['react-root'].raw, 'Selective React imports must not grow the equivalent consumer bundle')

assert.ok(results['elements-selective'].gzip < results['elements-root'].gzip / 2, 'Granular virtual-list registration must remove the unrelated Elements catalog')

process.stdout.write(`${JSON.stringify(results, null, 2)}\n`)
