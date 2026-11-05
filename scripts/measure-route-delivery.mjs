import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, readdir, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

import { chromium } from '@playwright/test'

import { captureStyleMatrix, compareStyleMatrix } from './check-component-css-rendering.mjs'
import { checkColdInteractions, checkDialogViewport, checkDynamicToast, checkFailedChunkRecovery, checkNavigation } from './check-route-runtime.mjs'

const repo = fileURLToPath(new URL('../', import.meta.url))
const astroDirectory = await realpath(resolve(process.env.LUMEN_DELIVERY_ASTRO_DIR ?? join(repo, 'packages/astro')))
const label = process.env.LUMEN_DELIVERY_LABEL ?? 'candidate'
const selectiveStyles = process.env.LUMEN_DELIVERY_CSS !== 'full'

assert.match(label, /^[a-z\d.-]+$/i, 'Delivery label must be a simple filename.')

const directory = join(repo, '.cache/route-delivery', label)
const fixtures = join(repo, 'tests/fixtures/delivery')
const routes = ['static', 'static-runtime', 'dialog', 'code', 'forms', 'calendar']
const navigationRoutes = ['navigation-dialog', 'navigation-calendar']
const check = process.argv.includes('--check')
const render = process.argv.includes('--render')
const renderingRoutes = [...routes, 'composition', 'composition-reversed']

await rm(directory, { recursive: true, force: true })

await mkdir(join(directory, 'src/pages'), { recursive: true })

await writeFile(join(directory, 'package.json'), '{"type":"module","private":true}\n')

await symlink(join(repo, 'apps/docs/node_modules'), join(directory, 'node_modules'), 'dir')

// Capture the actual emitted client graph so requested assets can be traced to owning modules.
await writeFile(join(directory, 'astro.config.mjs'), `export default {
  output: 'static', build: { inlineStylesheets: 'never' }, devToolbar: { enabled: false }, vite: { plugins: [{
    name: 'lumen-delivery-graph',
    generateBundle(options, bundle) {
      const chunks = Object.values(bundle).filter(item => item.type === 'chunk')
      const graph = Object.fromEntries(chunks.map(item => [item.fileName, Object.keys(item.modules)]))
      this.emitFile({ type: 'asset', fileName: 'delivery-modules.json', source: JSON.stringify(graph) })
    }
  }] }
}\n`)

const resolveImports = source => source
  .replaceAll(/@santi020k\/lumen-astro\/components\/([A-Za-z\d]+)/g, (_, name) => `${astroDirectory}/components/${name}.astro`)
  .replaceAll('@santi020k/lumen-astro/runtime', `${astroDirectory}/runtime/UIPrimitives.astro`)

for (const route of [...(render ? renderingRoutes : routes), ...navigationRoutes]) {
  const navigation = navigationRoutes.includes(route)
  const fixture = route === 'static-runtime' ? 'static' : route.replace('navigation-', '')
  let source = await readFile(join(fixtures, `${fixture}.astro.template`), 'utf8')

  if (route === 'static-runtime') {
    source = source.replace('---\n', "---\nimport UIPrimitives from '@santi020k/lumen-astro/runtime'\n") + '\n<UIPrimitives />\n'
  }

  if (navigation) {
    source = source.replace('---\n', "---\nimport { ClientRouter } from 'astro:transitions'\nimport Link from '@santi020k/lumen-astro/components/Link'\n")

    const next = route === 'navigation-dialog' ? 'navigation-calendar' : 'navigation-dialog'

    source += `<Link href="/${next}/">Next fixture</Link>`
  }

  if (!selectiveStyles) source = source.replace('---\n', `---\nimport '${astroDirectory}/styles/lumen.css'\n`)

  const boundary = source.indexOf('\n---', 4)
  const frontmatter = source.slice(0, boundary + 4)
  const body = source.slice(boundary + 4)

  const page = `${frontmatter}\n<!doctype html><html lang="en" data-theme="lumen-light"><head>
    <meta charset="utf-8" /><meta name="viewport" content="width=device-width" /><title>${route} delivery</title>
    ${navigation ? '<ClientRouter />' : ''}</head><body><main>${body}</main></body></html>`

  await writeFile(join(directory, 'src/pages', `${route}.astro`), resolveImports(page))
}

execFileSync(process.execPath, [join(repo, 'apps/docs/node_modules/astro/bin/astro.mjs'), 'build', '--root', directory], {
  cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']
})

const dist = join(directory, 'dist')
const graph = JSON.parse(await readFile(join(dist, 'delivery-modules.json'), 'utf8'))
const files = new Map()

for (const file of await readdir(dist, { recursive: true, withFileTypes: true })) {
  if (!file.isFile()) continue

  const absolute = join(file.parentPath, file.name)

  files.set(absolute.slice(dist.length), await readFile(absolute))
}

const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1')
  const pathname = url.pathname
  const path = extname(pathname) ? pathname : `${pathname.replace(/\/$/, '')}/index.html`
  let content = files.get(path)

  if (!content) { response.writeHead(404);

 response.end();

 return }

  // Apply rendering scenarios before the first paint, avoiding inherited transition races.
  if (path.endsWith('.html') && url.searchParams.has('theme')) {
    const theme = url.searchParams.get('theme') === 'lumen-dark' ? 'lumen-dark' : 'lumen-light'
    const direction = url.searchParams.get('direction') === 'rtl' ? 'rtl' : 'ltr'
    const text = url.searchParams.get('text') === '200%' ? '200%' : '100%'

    content = Buffer.from(content.toString().replace('data-theme="lumen-light"', `data-theme="${theme}" dir="${direction}" style="font-size:${text}"`))
  }

  response.setHeader('Content-Type', mime[extname(path)] ?? 'application/octet-stream')

  response.end(content)
})

await new Promise(resolve => { server.listen(0, '127.0.0.1', resolve) })

const address = server.address()

assert(address && typeof address !== 'string')

const browser = await chromium.launch()
const report = { label, scope: `Astro, ${selectiveStyles ? 'selective' : 'full'} CSS (inlining disabled), cold Chromium routes; raw and gzip level 9 asset bytes`, routes: {} }

const totals = assets => {
  const result = { javascript: { raw: 0, gzip: 0 }, css: { raw: 0, gzip: 0 } }

  for (const path of assets) {
    const content = files.get(path)

    assert(content, `Missing asset ${path}`)

    const kind = path.endsWith('.js') ? 'javascript' : 'css'

    result[kind].raw += content.length

    result[kind].gzip += gzipSync(content, { level: 9 }).length
  }

  return result
}

const origin = `http://127.0.0.1:${address.port}`

try {
  for (const route of routes) {
    const page = await browser.newPage()
    const requested = new Set()
    const errors = []

    page.on('response', response => {
      const path = new URL(response.url()).pathname

      if (/\.(js|css)$/.test(path)) requested.add(path)
    })

    page.on('pageerror', error => { errors.push(error.message) })

    await page.goto(`http://127.0.0.1:${address.port}/${route}/`)

    await page.waitForLoadState('networkidle')

    const initial = [...requested].sort()

    if (route === 'dialog') {
      await page.getByRole('button', { name: 'Open dialog' }).click()

      await page.getByRole('dialog').waitFor({ state: 'visible' })

      await page.getByRole('button', { name: 'Close', exact: true }).click()
    }

    if (route === 'code') await page.getByRole('tab', { name: 'npm', exact: true }).click()

    if (route === 'forms') await page.locator('[data-ui-select-trigger]').click()

    if (route === 'calendar') await page.locator('[data-ui-calendar-next]').click()

    await page.waitForLoadState('networkidle')

    assert.deepEqual(errors, [], `${route} has browser errors`)

    const all = [...requested].sort()

    const modules = [...new Set(all.flatMap(asset => graph[asset.slice(1)] ?? []))]
      .map(module => module.replace(astroDirectory, '<astro>').replace(repo, '<repo>/'))
      .sort()

    report.routes[route] = {
      initial: totals(initial), afterInteraction: totals(all), assets: all,
      moduleCount: modules.length, modules
    }

    await page.close()
  }

  if (render) {
    await captureStyleMatrix(browser, origin, directory, renderingRoutes)

    if (process.env.LUMEN_DELIVERY_COMPARE) {
      await compareStyleMatrix(resolve(process.env.LUMEN_DELIVERY_COMPARE), directory, renderingRoutes)
    }
  }

  if (check) {
    const budgets = JSON.parse(await readFile(join(fixtures, 'budgets.json'), 'utf8'))

    for (const [route, result] of Object.entries(report.routes)) {
      const budget = budgets[route]

      assert(result.afterInteraction.javascript.gzip <= budget.javascriptGzip, `${route} exceeds its JavaScript budget`)

      assert(result.afterInteraction.css.gzip <= budget.cssGzip, `${route} exceeds its CSS budget`)

      const controllers = result.modules.filter(module => /\/runtime\/(controllers|features)\//.test(module))
        .map(module => module.slice(module.indexOf('/runtime/') + 9)).sort()

      assert.deepEqual(controllers, budget.controllers, `${route} requested unexpected controllers`)

      assert(!result.modules.some(module => /(?:world-map|phone-input|rich-text|schedule)/.test(module)),
        `${route} requested an unrelated heavy feature`)
    }

    await checkColdInteractions(browser, origin, graph)

    await checkNavigation(browser, origin)

    await checkFailedChunkRecovery(browser, origin, graph)

    await checkDynamicToast(browser, origin)

    await checkDialogViewport(browser, origin)
  }
} finally {
  await browser.close()

  await new Promise((resolve, reject) => { server.close(error => { if (error) reject(error); else resolve() }) })
}

await writeFile(join(directory, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
