import assert from 'node:assert/strict'
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

import { build } from 'vite'

const root = resolve(import.meta.dirname, '..')
const fixture = await mkdtemp(join(root, 'packages/react/.client-icon-benchmark-'))
const results = {}

try {
  for (const variant of ['named', 'static']) {
    await writeFile(join(fixture, 'index.html'), '<div id="root"></div><script type="module" src="/entry.tsx"></script>')

    const iconImport = variant === 'named'
      ? "import { Icon } from '@santi020k/lumen-react'"
      : "import { Icon, Search } from '@santi020k/lumen-react/icons'"

    const iconProps = variant === 'named' ? 'name="search"' : 'icon={Search}'

    await writeFile(join(fixture, 'entry.tsx'), `import React from 'react'
import { createRoot } from 'react-dom/client'
import { Button, Card, Input, Table } from '@santi020k/lumen-react'
${iconImport}
const root = document.getElementById('root')
if (root) createRoot(root).render(<Card><Input aria-label="Search" /><Button><Icon ${iconProps} /> Search</Button><Table><table><tbody><tr><td>Record</td></tr></tbody></table></Table></Card>)
`)

    const outDir = join(fixture, variant)

    await build({ root: fixture, configFile: false, logLevel: 'error', build: { outDir, emptyOutDir: true } })

    const assets = await readdir(join(outDir, 'assets'))
    const js = await Promise.all(assets.filter(name => name.endsWith('.js')).map(name => readFile(join(outDir, 'assets', name))))

    results[variant] = { raw: js.reduce((sum, bytes) => sum + bytes.length, 0), gzip: js.reduce((sum, bytes) => sum + gzipSync(bytes).length, 0) }
  }

  assert.ok(results.static.raw < results.named.raw * 0.6, 'Static icons must remove the full registry from the representative browser bundle')

  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`)
} finally {
  await rm(fixture, { recursive: true, force: true })
}
