import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join, resolve as resolvePath } from 'node:path'

import { expect, test } from '@playwright/test'

const repository = resolvePath(import.meta.dirname, '../..')
const cli = join(repository, 'packages/lumen/bin/lumen.mjs')

interface CommandResult {
  code: number
  stdout: string
  stderr: string
}

const command = (args: string[]): Promise<CommandResult> => new Promise(resolve => {
  execFile(process.execPath, [cli, ...args], { cwd: repository, encoding: 'utf8', timeout: 35000 }, (error, stdout, stderr) => {
    let code = 0
    if (error) {
      code = typeof error.code === 'number' ? error.code : 1
    }
    resolve({ code, stdout, stderr })
  })
})

const fixtureBody = (path: string): string => {
  const script = path === '/problem' ? 'problem.abc123.js' : 'mystery.abc123.js'
  const overflow = path === '/problem' ? '<div style="width:2200px">Overflow fixture</div>' : ''
  const control = path === '/text-clipping' ? '<button id="clipped" style="font-size:1rem;width:110px;height:30px;overflow:hidden;white-space:nowrap">Read article</button>' : ''
  const decoration = path === '/decorated' ? '<style>button::before{content:"";position:absolute;width:300px;height:3px;left:0;top:0;background:linear-gradient(red,blue)}</style><button style="position:relative;overflow:hidden;width:150px;font-size:1rem">Read</button>' : ''
  const extra = path === '/unexpected' ? '<script src="/assets/heavy.abcdef.js"></script>' : ''
  const external = path === '/external' ? '<script src="https://example.invalid/never.js"></script>' : ''
  const socket = path === '/socket' ? '<script>new WebSocket("wss://example.invalid/socket?token=fixture-secret")</script>' : ''
  return '<!doctype html><html><head><meta name="viewport" content="width=device-width">' +
    '<link rel="stylesheet" href="/assets/ui.abc123.css"></head><body><main><h1>Local audit fixture</h1>' +
    overflow + control + decoration + '<label style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)">Search the documentation</label></main><footer><a href="https://santi020k.com">Santiago Molina</a></footer>' +
    '<script src="/assets/' + script + '"></script>' + extra + external + socket + '</body></html>'
}

let server: Server
let origin = ''

test.beforeAll(async () => {
  server = createServer((request, response) => {
    const path = new URL(request.url ?? '/', 'http://localhost').pathname
    response.setHeader('Cache-Control', 'no-store')
    if (path === '/favicon.ico') {
      response.writeHead(204).end()
      return
    }
    if (path === '/local-redirect') {
      response.writeHead(307, { Location: '/healthy?token=fixture-secret#part' }).end()
      return
    }
    if (path === '/redirect') {
      response.writeHead(302, { Location: 'https://example.invalid/redirected' }).end()
      return
    }
    if (path.endsWith('.css')) {
      response.writeHead(200, { 'Content-Type': 'text/css' }).end('html,body{margin:0}main{padding:0}')
      return
    }
    if (path.endsWith('.js')) {
      response.writeHead(200, { 'Content-Type': 'text/javascript' }).end(path.includes('problem') ?
        'console.warn("fixture warning");console.error("fixture error");throw new Error("fixture page failure")' :
        'document.documentElement.dataset.fixtureReady="true"')
      return
    }


    response.writeHead(200, { 'Content-Type': 'text/html' }).end(fixtureBody(path))
  })

  await new Promise<void>(resolve => { server.listen(0, '127.0.0.1', resolve) })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Expected a local TCP fixture')
  origin = 'http://127.0.0.1:' + String(address.port)
})

test.afterAll(async () => {
  server.closeAllConnections()
  await new Promise<void>((resolve, reject) => {
    server.close(error => {
      if (error) reject(error)
      else resolve()
    })
  })
})

const auditArguments = (path: string, browser: string): string[] => [
  'audit-rendered', origin + path, '--cwd', repository, '--json', '--browser', browser,
  '--settle-ms', '100', '--timeout-ms', '3000'
]

test('reports each viewport and leaves unknown hashed assets unclassified', async ({ browserName }) => {
  const result = await command(auditArguments('/healthy?session=fixture-secret#part', browserName))
  const report: unknown = JSON.parse(result.stdout)
  expect(result.code, result.stdout).toBe(0)
  expect(result.stdout).not.toContain('fixture-secret')
  expect(report).toHaveProperty('routes.0.requestedUrl', origin + '/healthy')
  expect(report).toMatchObject({
    status: 'passed',
    browser: browserName,
    routes: [
      { viewport: { width: 390, height: 844 }, layout: { horizontalOverflowPixels: 0 }, assetAudit: { scope: 'unknown', observedLumenAssets: [] } },
      { viewport: { width: 1280, height: 900 }, layout: { horizontalOverflowPixels: 0 }, assetAudit: { scope: 'unknown', observedLumenAssets: [] } }
    ]
  })
  expect(report).toHaveProperty('routes.0.assetAudit.unclassifiedAssets', [
    origin + '/assets/mystery.abc123.js', origin + '/assets/ui.abc123.css'
  ])
  expect(report).toHaveProperty('routes.0.assets.0.requestState', 'finished')
})

test('reports layout, console warnings/errors, and page errors with exit1', async ({ browserName }) => {
  const result = await command([...auditArguments('/problem', browserName), '--viewport', '390x844'])
  const report: unknown = JSON.parse(result.stdout)
  expect(result.code, result.stdout).toBe(1)
  expect(report).toMatchObject({ status: 'issues', routes: [{ layout: { horizontalOverflowPixels: 1810 } }] })
  expect(result.stdout).toContain('fixture warning')
  expect(result.stdout).toContain('fixture error')
  expect(result.stdout).toContain('fixture page failure')
})

test('checks only the explicit Lumen inventory and reports unexpected known assets', async ({ browserName }) => {
  const directory = await mkdtemp(join(tmpdir(), 'lumen-rendered-browser-'))
  try {
    const file = join(directory, 'assets.json')
    await writeFile(file, JSON.stringify({
      knownLumenAssets: ['/assets/mystery.abc123.js', '/assets/ui.abc123.css', '/assets/heavy.abcdef.js', '/assets/unused.js'],
      allowedLumenAssets: ['/assets/mystery.abc123.js', '/assets/ui.abc123.css', '/assets/unused.js']
    }))
    const result = await command([
      ...auditArguments('/unexpected', browserName), '--viewport', '390x844',
      '--asset-expectations', file
    ])
    const report: unknown = JSON.parse(result.stdout)
    expect(result.code, result.stdout).toBe(1)
    expect(report).toHaveProperty('routes.0.assetAudit.scope', 'explicit-inventory')
    expect(report).toHaveProperty('routes.0.assetAudit.unexpectedLumenAssets', [origin + '/assets/heavy.abcdef.js'])
    expect(report).toHaveProperty('routes.0.assetAudit.allowedAssetsNotObserved', [origin + '/assets/unused.js'])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('blocks external assets and external redirects', async ({ browserName }) => {
  for (const path of ['/external', '/redirect']) {
    const result = await command([...auditArguments(path, browserName), '--viewport', '390x844'])
    const report: unknown = JSON.parse(result.stdout)
    expect(result.code, result.stdout).toBe(1)
    expect(report).toMatchObject({ status: 'issues' })
    expect(report).toHaveProperty('routes.0.blockedRequests.0', 'https://example.invalid/' + (path === '/external' ? 'never.js' : 'redirected'))
  }
})

test('ordinary doctor does not import or launch optional browser tooling', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lumen-source-doctor-'))
  try {
    const module = join(directory, 'node_modules', '@playwright', 'test')
    const marker = join(directory, 'browser-loaded.txt')
    await mkdir(module, { recursive: true })
    await writeFile(join(directory, 'package.json'), JSON.stringify({ private: true }))
    await writeFile(join(module, 'package.json'), JSON.stringify({ name: '@playwright/test', type: 'module', exports: './index.js' }))
    await writeFile(join(module, 'index.js'), 'import{writeFileSync}from"node:fs";writeFileSync(' + JSON.stringify(marker) + ',"loaded");throw new Error("Browser tool loaded")')
    const result = await command(['doctor', '--cwd', directory, '--json'])
    const report: unknown = JSON.parse(result.stdout)
    expect(report).toHaveProperty('repository', directory)
    expect(existsSync(marker)).toBe(false)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('invalid audit arguments stay in JSON and never load unrelated registry URLs', async () => {
  const result = await command([
    'audit-rendered', origin + '/healthy', '--registry', 'https://example.invalid/registry.json', '--json'
  ])
  const report: unknown = JSON.parse(result.stdout)
  expect(result.code, result.stdout).toBe(2)
  expect(report).toMatchObject({ status: 'invalid', diagnostics: [{ code: 'unexpected-argument' }] })
})


test('local redirects are incomplete and sanitize their destination', async ({ browserName }) => {
  const result = await command([...auditArguments('/local-redirect', browserName), '--viewport', '390x844'])
  const report: unknown = JSON.parse(result.stdout)
  expect(result.code, result.stdout).toBe(1)
  expect(result.stdout).not.toContain('fixture-secret')
  expect(report).toMatchObject({
    status: 'issues',
    routes: [{
      observationComplete: false,
      redirects: [{ location: origin + '/healthy', httpStatus: 307 }],
      diagnostics: expect.arrayContaining([expect.objectContaining({ code: 'redirect-blocked' })])
    }]
  })
})


test('blocks socket connections before they leave the browser', async ({ browserName }) => {
  const result = await command([...auditArguments('/socket', browserName), '--viewport', '390x844'])
  const report: unknown = JSON.parse(result.stdout)
  expect(result.code, result.stdout).toBe(1)
  expect(result.stdout).not.toContain('fixture-secret')
  expect(report).toHaveProperty('routes.0.observationComplete', false)
  expect(report).toHaveProperty('routes.0.blockedRequests.0', 'wss://example.invalid/socket')
})


test('controls fit at the baseline text size', async ({ browserName }) => {
  const baseline = await command([...auditArguments('/text-clipping', browserName), '--viewport', '320x568'])
  expect(baseline.code, baseline.stdout).toBe(0)
})

test('reports clipped controls at enlarged text without requiring page overflow', async ({ browserName }) => {
  const enlarged = await command([...auditArguments('/text-clipping', browserName), '--viewport', '320x568', '--text-scale', '200'])
  expect(enlarged.code, enlarged.stdout).toBe(1)
  const report: unknown = JSON.parse(enlarged.stdout)
  expect(report).toMatchObject({ status: 'issues', routes: [{ textScale: 200, layout: { horizontalOverflowPixels: 0 }, clippedControls: [{ id: 'clipped', tag: 'button' }] }] })
})

test('healthy controls fit at enlarged text size', async ({ browserName }) => {
  const healthy = await command([...auditArguments('/healthy', browserName), '--viewport', '320x568', '--text-scale', '200'])
  expect(healthy.code, healthy.stdout).toBe(0)
})


test('ignores decorative overflow when control text fits', async ({ browserName }) => {
  const result = await command([...auditArguments('/decorated', browserName), '--viewport', '320x568', '--text-scale', '200'])
  expect(result.code, result.stdout).toBe(0)
  const report: unknown = JSON.parse(result.stdout)
  expect(report).toMatchObject({ routes: [{ clippedControls: [] }] })
})

test('attributes requested full CSS to its importing application layout', async ({ browserName }) => {
  const directory = await mkdtemp(join(tmpdir(), 'lumen-css-provenance-'))
  try {
    const graph = join(directory, 'report.json')
    await writeFile(graph, JSON.stringify({ schemaVersion: 1, assets: [{
      path: '/assets/ui.abc123.css',
      imports: [['./src/layouts/AppLayout.astro', '@santi020k/lumen-astro/styles/lumen.css']]
    }] }))
    const result = await command([...auditArguments('/healthy', browserName), '--build-report', graph])
    expect(result.code, result.stdout).toBe(0)
    const report: unknown = JSON.parse(result.stdout)
    expect(report).toMatchObject({ routes: expect.arrayContaining([expect.objectContaining({
      assets: expect.arrayContaining([expect.objectContaining({
        resourceType: 'stylesheet', fullStylesheet: true,
        importChains: [['./src/layouts/AppLayout.astro', '@santi020k/lumen-astro/styles/lumen.css']]
      })])
    })]) })
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('keeps full stylesheet delivery unknown for a selective CSS chain', async ({ browserName }) => {
  const directory = await mkdtemp(join(tmpdir(), 'lumen-selective-css-provenance-'))
  try {
    const graph = join(directory, 'report.json')
    await writeFile(graph, JSON.stringify({ schemaVersion: 1, assets: [{
      path: '/assets/ui.abc123.css',
      imports: [['./src/layouts/AppLayout.astro', '@santi020k/lumen-astro/styles/components/button.css']]
    }] }))
    const result = await command([...auditArguments('/healthy', browserName), '--build-report', graph])
    expect(result.code, result.stdout).toBe(0)
    const report: unknown = JSON.parse(result.stdout)
    expect(report).toMatchObject({ routes: expect.arrayContaining([expect.objectContaining({
      assets: expect.arrayContaining([expect.objectContaining({
        resourceType: 'stylesheet',
        importChains: [['./src/layouts/AppLayout.astro', '@santi020k/lumen-astro/styles/components/button.css']]
      })])
    })]) })
    expect(JSON.stringify(report)).not.toContain('fullStylesheet')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
