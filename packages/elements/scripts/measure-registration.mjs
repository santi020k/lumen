import { gzipSync } from 'node:zlib'

import { build } from 'esbuild'

const scenarios = {
  all: `import { defineLumenElements } from './dist/define.js'
defineLumenElements()
`,
  selected: `import { defineLumenElements } from './dist/define.js'
defineLumenElements(['Card', 'Input', 'Button'])
`
}

const results = {}

for (const [name, contents] of Object.entries(scenarios)) {
  const result = await build({
    bundle: true,
    format: 'esm',
    minify: true,
    platform: 'browser',
    stdin: {
      contents,
      resolveDir: process.cwd()
    },
    treeShaking: true,
    write: false
  })

  const output = result.outputFiles[0]?.contents

  if (!output) throw new Error(`Elements ${name} registration bundle produced no output.`)

  results[name] = {
    bytes: output.length,
    gzipBytes: gzipSync(output).length
  }
}

process.stdout.write(`${JSON.stringify({ scenarios: results }, undefined, 2)}\n`)
