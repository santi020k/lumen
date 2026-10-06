import { spawn } from 'node:child_process'
import { mkdir, readFile, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

import { chromium } from '@playwright/test'

const root = fileURLToPath(new URL('../', import.meta.url))
const directory = path.join(root, 'apps/docs/cloudflare/dist')
const reports = path.join(root, 'apps/docs/.astro/lighthouse')
const mime = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2' }

await stat(path.join(directory, 'index.html'))

await mkdir(reports, { recursive: true })

/**
 * @param {import('node:http').IncomingMessage} request
 * @param {string} extension
 */
const supportsCompression = (request, extension) => (
  ['.html', '.css', '.js', '.json', '.svg'].includes(extension) && request.headers['accept-encoding']?.includes('gzip')
)

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)
    const servingPath = pathname === '/' ? '/index.html' : pathname
    const filePath = path.extname(servingPath) ? servingPath : `${servingPath}.html`
    const file = path.resolve(directory, `.${filePath}`)

    if (!file.startsWith(`${directory}${path.sep}`)) {
      response.writeHead(403).end()

      return
    }

    const extension = path.extname(file)
    const body = await readFile(file)
    const compress = supportsCompression(request, extension)

    response.setHeader('Content-Type', mime[extension] ?? 'application/octet-stream')

    response.setHeader('Vary', 'Accept-Encoding')

    if (compress) response.setHeader('Content-Encoding', 'gzip')

    response.end(compress ? gzipSync(body) : body)
  } catch {
    response.writeHead(404).end()
  }
})

await new Promise(resolve => { server.listen(0, '127.0.0.1', resolve) })

const address = server.address()

if (!address || typeof address === 'string') throw new Error('Cannot resolve performance server address.')

const routes = ['/', '/docs/icons', '/docs/components/button', '/guides/build-ui-with-ai']
let failed = false

/**
 * @param {unknown} value
 * @param {string[]} keys
 * @returns {number}
 */
const readMetric = (value, keys) => {
  let current = value

  for (const key of keys) {
    if (typeof current !== 'object' || current === null) throw new Error(`Missing Lighthouse metric: ${keys.join('.')}`)

    /** @type {unknown} */
    const next = Reflect.get(current, key)

    current = next
  }

  if (typeof current !== 'number' || !Number.isFinite(current)) throw new Error(`Invalid Lighthouse metric: ${keys.join('.')}`)

  return current
}

try {
  for (const route of routes) {
    const reportPath = path.join(reports, `${route === '/' ? 'home' : route.slice(1).replaceAll('/', '-')}.json`)

    const args = ['--filter', '@santi020k/lumen-docs', 'run', 'audit:lighthouse', `http://127.0.0.1:${address.port}${route}`,
      `--chrome-path=${process.env.CHROME_PATH ?? chromium.executablePath()}`, '--chrome-flags=--headless --no-sandbox',
      '--only-categories=performance,accessibility,best-practices,seo', '--output=json', `--output-path=${reportPath}`, '--quiet']

    const exitCode = await new Promise((resolve, reject) => {
      const child = spawn('pnpm', args, { cwd: root, stdio: 'inherit' })

      child.once('error', reject)

      child.once('exit', resolve)
    })

    if (exitCode !== 0) throw new Error(`Lighthouse failed for ${route}: ${exitCode}`)

    /** @type {unknown} */
    const report = JSON.parse(await readFile(reportPath, 'utf8'))

    const metrics = {
      accessibility: readMetric(report, ['categories', 'accessibility', 'score']),
      cls: readMetric(report, ['audits', 'cumulative-layout-shift', 'numericValue']),
      lcp: readMetric(report, ['audits', 'largest-contentful-paint', 'numericValue']),
      performance: readMetric(report, ['categories', 'performance', 'score']),
      seo: readMetric(report, ['categories', 'seo', 'score']),
      tbt: readMetric(report, ['audits', 'total-blocking-time', 'numericValue'])
    }

    // CI ceilings allow lab variance; they are not a claim about field Core Web Vitals.
    const healthy = metrics.performance >= 0.9 && metrics.accessibility === 1 && metrics.seo === 1 &&
      metrics.lcp <= 3500 && metrics.tbt <= 200 && metrics.cls <= 0.1

    console.log(`${healthy ? 'PASS' : 'FAIL'} ${route} ${JSON.stringify(metrics)}`)

    if (!healthy) failed = true
  }
} finally {
  await new Promise((resolve, reject) => { server.close(error => error ? reject(error) : resolve()) })
}

if (failed) throw new Error(`Docs performance budgets failed. Inspect reports in ${reports}.`)
