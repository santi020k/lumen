import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { gzipSync } from 'node:zlib'

import { chromium } from '@playwright/test'
import { build, preview } from 'vite'

const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8')

const example = (heading, language) => {
  const section = readme.split('### ' + heading + '\n')[1]
  const snippet = section?.split('```' + language + '\n')[1]?.split('\n```')[0]

  assert.ok(snippet?.includes('Subscribe'), 'Missing README quick start: ' + heading)

  return snippet
}

const names = ['Button', 'Card', 'Input', 'Label']
const reactCatalog = "import { Button, Card, Input, Label } from '@santi020k/lumen-react'"
const elementsCatalog = "import { defineLumenElements } from '@santi020k/lumen-elements/define'"

const writeFixture = async (root, adapter, catalog) => {
  if (adapter === 'elements') {
    let html = example('Web Components', 'html')

    if (catalog) {
      html = html.split('\n').filter(line => !line.includes('import { defineLumen')).join('\n')

      html = html.replace('  defineLumenButton()', elementsCatalog + "\ndefineLumenElements(['Button', 'Card', 'Input', 'Label'])")

      html = html.split('\n').filter(line => !names.some(name => line.trim() === 'defineLumen' + name + '()')).join('\n')
    }

    await writeFile(join(root, 'index.html'), html)

    return
  }

  let source = example('React', 'tsx')

  source = "import '@santi020k/lumen-react/styles/components/field.css'\n" +
    "import '@santi020k/lumen-react/styles/components/field-error.css'\n" +
    "import '@santi020k/lumen-react/styles/components/checkbox.css'\n" +
    (catalog ? "import { Field, FieldError, Checkbox } from '@santi020k/lumen-react'\n" :
      "import { Field, FieldError } from '@santi020k/lumen-react/components/field'\nimport { Checkbox } from '@santi020k/lumen-react/components/checkbox'\n") + source

  source = source.replace('<Button>Subscribe</Button>', '<Field controlId="consent" describedBy="consent-error"><Label htmlFor="consent">Accept updates</Label><Checkbox id="consent" name="consent" /><FieldError id="consent-error" /></Field><Button>Subscribe</Button>')

  if (catalog) {
    source = reactCatalog + '\n' + source.split('\n').filter(line => !line.includes(" } from '@santi020k/lumen-react/components/")).join('\n')
  }

  await writeFile(join(root, 'index.html'), '<div id="app"></div><script type="module" src="/main.jsx"></script>')

  await writeFile(join(root, 'main.jsx'), "import React from 'react'\nimport {createRoot} from 'react-dom/client'\n" +
    source + "\ncreateRoot(document.getElementById('app')).render(<SubscribeForm />)")
}

const measure = async (browser, directory, adapter, catalog) => {
  const root = join(directory, adapter + (catalog ? '-catalog' : '-selective'))

  await mkdir(root)

  await writeFixture(root, adapter, catalog)

  const modules = new Set()
  const config = { root, configFile: false, logLevel: 'error' }
  const configFile = join(root, 'vite.config.mjs')

  await writeFile(configFile, "import { lumenBuildReport } from '@santi020k/lumen/vite/build-report'\n" +
    'export default { plugins: [lumenBuildReport()] }\n')

  await build({ ...config, configFile, plugins: [{
    name: 'measure-subscribe-modules',
    generateBundle() {
      for (const id of this.getModuleIds()) modules.add(id)
    }
  }] })

  const catalogPath = adapter === 'react' ? 'lumen-react/dist/index.js' : 'lumen-elements/dist/define.js'

  assert.equal([...modules].some(id => id.endsWith(catalogPath)), catalog, 'Unexpected catalog traversal: ' + root)

  const server = await preview({ ...config, preview: { host: '127.0.0.1', port: 0 } })
  const page = await browser.newPage()

  try {
    const bodies = []
    const errors = []

    page.on('pageerror', error => errors.push(error.message))

    page.on('response', response => {
      if (['script', 'stylesheet'].includes(response.request().resourceType())) bodies.push(response.body())
    })

    await page.goto(server.resolvedUrls.local[0], { waitUntil: 'networkidle' })

    await page.getByRole('button', { name: 'Subscribe' }).waitFor()

    await page.locator('input[type=email]').fill('reader@example.com')

    assert.deepEqual(errors, [])

    if (!catalog) {
      const cli = join(directory, 'node_modules/@santi020k/lumen/bin/lumen.mjs')
      const report = join(root, '.cache/lumen/build-report.json')

      const { stdout } = await promisify(execFile)(process.execPath, [cli, 'audit-rendered',
        server.resolvedUrls.local[0], '--build-report', report, '--viewport', '1280x900', '--json'])

      const audited = JSON.parse(stdout).routes[0]

      assert.equal(audited.assetAudit.scope, 'build-report')

      assert.deepEqual(audited.assetAudit.unexpectedLumenAssets, [])

      assert.ok(audited.assets.some(asset => asset.importChains?.some(chain => chain[0] === './index.html' &&
        chain.at(-1)?.startsWith('@santi020k/lumen-' + adapter + '/'))), 'Missing browser-to-build attribution')
    }

    const assets = await Promise.all(bodies)

    assert.ok(assets.length)

    return { adapter, imports: catalog ? 'catalog' : 'selective', modules: modules.size, requestedAssets: assets.length,
      rawBytes: assets.reduce((sum, asset) => sum + asset.length, 0),
      gzipBytes: assets.reduce((sum, asset) => sum + gzipSync(asset, { level: 9 }).length, 0) }
  } finally {
    await page.close()

    await server.close()
  }
}

export const measureSubscribeForm = async directory => {
  const browser = await chromium.launch()

  try {
    for (const adapter of ['react', 'elements']) {
      const catalog = await measure(browser, directory, adapter, true)
      const selective = await measure(browser, directory, adapter, false)

      assert.ok(selective.modules < catalog.modules, adapter + ' selective imports must traverse fewer modules')

      const gzipBudget = adapter === 'react' ? 75000 : 20000

      assert.ok(selective.modules <= 45, 'Selective subscribe form exceeded its module budget')

      assert.ok(selective.gzipBytes <= gzipBudget, 'Selective subscribe form exceeded its requested-byte budget')

      process.stdout.write(JSON.stringify([catalog, selective], null, 2) + '\n')
    }
  } finally {
    await browser.close()
  }
}
