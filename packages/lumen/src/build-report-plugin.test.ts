import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { build } from 'vite'
import { expect, test } from 'vitest'

import { loadBuildReport } from './build-report.js'
import { lumenBuildReport } from './build-report-plugin.js'
import { parseRenderedAuditArguments } from './rendered-audit-options.js'

test('attributes emitted CSS to the full Lumen stylesheet through its application importer', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lumen-css-report-'))
  try {
    const dependency = join(root, 'node_modules/@santi020k/lumen-react')
    await mkdir(dependency, { recursive: true })
    await writeFile(join(dependency, 'package.json'), JSON.stringify({ name: '@santi020k/lumen-react', exports: { './styles.css': './styles.css' } }))
    await writeFile(join(dependency, 'styles.css'), '.ui-button { color: red }')
    await writeFile(join(root, 'index.html'), '<script type="module" src="/entry.js"></script>')
    await writeFile(join(root, 'entry.js'), 'import \'@santi020k/lumen-react/styles.css\'')
    await build({ root, configFile: false, logLevel: 'silent', plugins: [lumenBuildReport()] })
    const options = parseRenderedAuditArguments(['http://localhost:4321/', '--build-report', '.cache/lumen/build-report.json'], root)
    const report = await loadBuildReport(options)
    const css = [...(report?.entries() ?? [])].find(([path]) => path.endsWith('.css'))
    expect(css).toBeDefined()
    expect(css?.[1]).toContainEqual(['./index.html', './entry.js', '@santi020k/lumen-react/styles.css'])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
