import { readFile, stat } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { pathToFileURL } from 'node:url'

import type { APIResponse, Browser, BrowserType, ConsoleMessage, Page, Request, Response, Route } from '@playwright/test'

import {
  isLoopbackHttpUrl,
  parseLoopbackUrl,
  parseRenderedAuditArguments,
  type RenderedAuditBrowser,
  RenderedAuditConfigurationError,
  type RenderedAuditOptions,
  type RenderedAuditViewport
} from './rendered-audit-options.js'

interface Diagnostic {
  code: string
  message: string
}

interface AssetExpectations {
  knownLumenAssets: string[]
  allowedLumenAssets: string[]
}

interface ObservedAsset {
  url: string
  resourceType: string
  classification: 'known-lumen' | 'unclassified'
  requestState: 'pending' | 'finished' | 'failed'
  httpStatus: number | null
}

interface LayoutMeasurement {
  documentWidth: number
  documentHeight: number
  viewportWidth: number
  viewportHeight: number
  horizontalOverflowPixels: number
}

interface RenderedRouteReport {
  requestedUrl: string
  finalUrl: string
  viewport: RenderedAuditViewport
  httpStatus: number | null
  layout: LayoutMeasurement | null
  observationComplete: boolean
  console: { type: 'warning' | 'error', message: string }[]
  pageErrors: string[]
  blockedRequests: string[]
  redirects: { url: string, location: string | null, httpStatus: number }[]
  failedRequests: string[]
  assets: ObservedAsset[]
  assetAudit: {
    scope: 'explicit-inventory' | 'unknown'
    observedLumenAssets: string[]
    unexpectedLumenAssets: string[]
    allowedAssetsNotObserved: string[]
    unclassifiedAssets: string[]
  }
  diagnostics: Diagnostic[]
}

export interface RenderedAuditReport {
  schemaVersion: 1
  status: 'passed' | 'issues' | 'invalid' | 'unavailable'
  browser: RenderedAuditBrowser | null
  browserVersion: string | null
  routes: RenderedRouteReport[]
  diagnostics: Diagnostic[]
}

type BrowserLauncher = Pick<BrowserType, 'launch'>

type LauncherResult = { launcher: BrowserLauncher } | { diagnostic: Diagnostic }

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

const isBrowserLauncher = (value: unknown): value is BrowserLauncher => (
  isRecord(value) && typeof value.launch === 'function'
)

const isExportContainer = (value: unknown): value is Record<string, unknown> => (
  isRecord(value) || typeof value === 'function'
)

const hasProjectTool = async (cwd: string, name: string): Promise<boolean> => {
  let directory = resolve(cwd)

  for (;;) {
    const manifest = await stat(join(directory, 'node_modules', name, 'package.json')).catch(() => undefined)

    if (manifest?.isFile()) return true

    const parent = dirname(directory)

    if (parent === directory) return false

    directory = parent
  }
}

const launcherFromModule = (value: unknown, browser: RenderedAuditBrowser): BrowserLauncher | undefined => {
  if (!isExportContainer(value)) return undefined

  const exports = isExportContainer(value.default) ? value.default : value
  const launcher = exports[browser]

  return isBrowserLauncher(launcher) ? launcher : undefined
}

const loadBrowserLauncher = async (cwd: string, browser: RenderedAuditBrowser): Promise<LauncherResult> => {
  const require = createRequire(resolve(cwd, 'package.json'))
  let resolved: string | undefined

  for (const name of ['@playwright/test', 'playwright']) {
    if (!await hasProjectTool(cwd, name)) continue

    try {
      resolved = require.resolve(name)

      break
    } catch {
      // Use the caller's module resolution rather than the CLI's own dependencies.
    }
  }

  if (!resolved) {
    return { diagnostic: {
      code: 'playwright-not-found',
      message: 'Install @playwright/test as a development dependency in the target project. The audit does not install tools.'
    } }
  }

  try {
    const module: unknown = await import(pathToFileURL(resolved).href)
    const launcher = launcherFromModule(module, browser)

    if (launcher) return { launcher }
  } catch {
    return { diagnostic: { code: 'playwright-load-failed', message: 'The target project Playwright module could not be loaded.' } }
  }

  return { diagnostic: { code: 'playwright-incompatible', message: 'The target Playwright module does not expose the selected browser launcher.' } }
}

const assetUrl = (value: string, base: string): string => {
  const url = new URL(value, base)

  url.username = ''

  url.password = ''

  url.search = ''

  url.hash = ''

  if (!['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol)) return url.protocol + '(inline)'

  return url.href
}

const isStringList = (value: unknown): value is string[] => (
  Array.isArray(value) && value.every((item: unknown) => typeof item === 'string' && item.length > 0)
)

const expectationList = (value: unknown, base: string): string[] => {
  if (!isStringList(value)) {
    throw new RenderedAuditConfigurationError('invalid-asset-expectations', 'Asset inventories must contain URL strings.')
  }

  return value.map((item: string) => {
    if (!item.startsWith('/') && !item.startsWith('http://') && !item.startsWith('https://')) {
      throw new RenderedAuditConfigurationError('invalid-asset-expectations', 'Use absolute local URLs or origin-relative asset paths.')
    }

    let url: URL

    try {
      url = new URL(item, base)
    } catch {
      throw new RenderedAuditConfigurationError('invalid-asset-expectations', 'An asset inventory URL is invalid.')
    }

    if (!isLoopbackHttpUrl(url) || url.search || url.hash) {
      throw new RenderedAuditConfigurationError('invalid-asset-expectations', 'Asset inventories require local URLs without queries or fragments.')
    }

    return url.href
  })
}

const loadExpectations = async (options: RenderedAuditOptions): Promise<AssetExpectations | undefined> => {
  if (!options.expectationsPath) return undefined

  let value: unknown

  try {
    value = JSON.parse(await readFile(resolve(options.cwd, options.expectationsPath), 'utf8'))
  } catch {
    throw new RenderedAuditConfigurationError('invalid-asset-expectations', 'Could not read the asset expectations JSON file.')
  }

  if (!isRecord(value) || Object.keys(value).some(key => !['knownLumenAssets', 'allowedLumenAssets'].includes(key))) {
    throw new RenderedAuditConfigurationError('invalid-asset-expectations', 'Provide knownLumenAssets and allowedLumenAssets arrays.')
  }

  const knownLumenAssets = expectationList(value.knownLumenAssets, options.url)
  const allowedLumenAssets = expectationList(value.allowedLumenAssets, options.url)
  const known = new Set(knownLumenAssets)

  if (allowedLumenAssets.some(url => !known.has(url))) {
    throw new RenderedAuditConfigurationError('invalid-asset-expectations', 'Every allowed Lumen asset must also appear in the known inventory.')
  }

  return { knownLumenAssets, allowedLumenAssets }
}

const emptyRoute = (url: string, viewport: RenderedAuditViewport): RenderedRouteReport => ({
  requestedUrl: assetUrl(url, url),
  finalUrl: assetUrl(url, url),
  viewport,
  httpStatus: null,
  layout: null,
  observationComplete: false,
  console: [],
  pageErrors: [],
  blockedRequests: [],
  redirects: [],
  failedRequests: [],
  assets: [],
  assetAudit: {
    scope: 'unknown',
    observedLumenAssets: [],
    unexpectedLumenAssets: [],
    allowedAssetsNotObserved: [],
    unclassifiedAssets: []
  },
  diagnostics: []
})

const readLayout = async (page: Page): Promise<LayoutMeasurement> => page.evaluate(() => {
  const body = document.querySelector('body')
  const documentWidth = Math.max(document.documentElement.scrollWidth, body?.scrollWidth ?? 0)
  const viewportWidth = document.documentElement.clientWidth

  return {
    documentWidth,
    documentHeight: document.documentElement.scrollHeight,
    viewportWidth,
    viewportHeight: window.innerHeight,
    horizontalOverflowPixels: Math.max(0, documentWidth - viewportWidth)
  }
})

const observePage = (page: Page, report: RenderedRouteReport): (() => void) => {
  let truncated = false
  const assets = new Map<string, ObservedAsset>()

  const onConsole = (message: ConsoleMessage) => {
    const type = message.type()

    if (type !== 'warning' && type !== 'error') return

    if (report.console.length >= 100) {
      truncated = true

      return
    }

    report.console.push({ type, message: message.text().slice(0, 2000) })
  }

  const onPageError = (error: Error) => {
    if (report.pageErrors.length >= 100) {
      truncated = true

      return
    }

    report.pageErrors.push(error.message.slice(0, 2000))
  }

  const onRequest = (request: Request) => {
    if (assets.size >= 500) {
      truncated = true

      return
    }

    if (!['script', 'stylesheet'].includes(request.resourceType())) return

    const url = assetUrl(request.url(), report.requestedUrl)

    assets.set(url, { url, resourceType: request.resourceType(), classification: 'unclassified', requestState: 'pending', httpStatus: null })
  }

  const onResponse = (response: Response) => {
    const asset = assets.get(assetUrl(response.url(), report.requestedUrl))

    if (asset) asset.httpStatus = response.status()
  }

  const onFinished = (request: Request) => {
    const asset = assets.get(assetUrl(request.url(), report.requestedUrl))

    if (asset) asset.requestState = 'finished'
  }

  const onFailed = (request: Request) => {
    const url = assetUrl(request.url(), report.requestedUrl)
    const asset = assets.get(url)

    if (asset) asset.requestState = 'failed'

    if (report.failedRequests.length < 100) report.failedRequests.push(url)
    else truncated = true
  }

  page.on('console', onConsole)

  page.on('pageerror', onPageError)

  page.on('request', onRequest)

  page.on('response', onResponse)

  page.on('requestfinished', onFinished)

  page.on('requestfailed', onFailed)

  return () => {
    page.off('console', onConsole)

    page.off('pageerror', onPageError)

    page.off('request', onRequest)

    page.off('response', onResponse)

    page.off('requestfinished', onFinished)

    page.off('requestfailed', onFailed)

    report.assets = [...assets.values()]

    if (truncated) report.diagnostics.push({ code: 'event-limit', message: 'The bounded event inventory was truncated.' })

    if (report.assets.some(asset => asset.requestState === 'pending')) {
      report.diagnostics.push({ code: 'pending-assets', message: 'Script/style requests were pending at the observation cutoff. Increase --settle-ms to inspect their completion.' })
    }
  }
}

interface NetworkObservation {
  active: boolean
  timeoutMs: number
}

const requestDisposition = (value: string): 'local' | 'inline' | 'blocked' => {
  try {
    const url = new URL(value)

    if (isLoopbackHttpUrl(url)) return 'local'

    if (url.protocol === 'data:') return 'inline'

    if (url.protocol === 'blob:' && isLoopbackHttpUrl(new URL(url.pathname))) return 'inline'
  } catch {
    return 'blocked'
  }

  return 'blocked'
}

const redirectTarget = (response: APIResponse, base: string): { location: string | null, local: boolean } => {
  const location = response.headers().location

  if (!location) return { location: null, local: false }

  try {
    const url = new URL(location, base)

    return { location: assetUrl(url.href, base), local: isLoopbackHttpUrl(url) }
  } catch {
    return { location: null, local: false }
  }
}

const blockRedirect = async (route: Route, response: APIResponse, report: RenderedRouteReport): Promise<void> => {
  const url = route.request().url()
  const target = redirectTarget(response, url)

  if (report.redirects.length < 100) {
    report.redirects.push({
      url: assetUrl(url, report.requestedUrl), location: target.location, httpStatus: response.status()
    })
  }

  if (!target.local && target.location && report.blockedRequests.length < 100) {
    report.blockedRequests.push(target.location)
  }

  if (report.diagnostics.length < 100) report.diagnostics.push({
    code: 'redirect-blocked',
    message: 'Redirect response blocked. Supply the intended canonical loopback destination URL for a new audit.'
  })

  await route.abort('blockedbyclient')
}

const fetchLocalRequest = async (
  route: Route, report: RenderedRouteReport, observation: NetworkObservation
): Promise<void> => {
  try {
    const response = await route.fetch({ maxRedirects: 0, timeout: observation.timeoutMs })

    try {
      if (!observation.active) return

      if ([301, 302, 303, 307, 308].includes(response.status())) {
        await blockRedirect(route, response, report)
      } else {
        await route.fulfill({ response })
      }
    } finally {
      await response.dispose()
    }
  } catch {
    if (!observation.active) return

    if (report.diagnostics.length < 100) report.diagnostics.push({ code: 'request-fetch-failed', message: 'A guarded local HTTP request did not complete.' })

    // Context cleanup can close a request while cancellation is in flight.
    await route.abort('failed').catch(() => undefined)
  }
}

const guardRequest = async (
  route: Route, report: RenderedRouteReport, observation: NetworkObservation
): Promise<void> => {
  if (!observation.active) return

  try {
    switch (requestDisposition(route.request().url())) {
      case 'local':
        await fetchLocalRequest(route, report, observation)

        return

      case 'inline':
        await route.continue()

        return

      case 'blocked':
        if (report.blockedRequests.length < 100) {
          report.blockedRequests.push(assetUrl(route.request().url(), report.requestedUrl))
        }

        await route.abort('blockedbyclient')
    }
  } catch {
    if (report.diagnostics.length < 100) {
      report.diagnostics.push({ code: 'request-guard-failed', message: 'The browser request guard could not complete.' })
    }
  }
}

const classifyAssets = (report: RenderedRouteReport, expectations: AssetExpectations | undefined): void => {
  const known = new Set(expectations?.knownLumenAssets)
  const allowed = new Set(expectations?.allowedLumenAssets)

  for (const asset of report.assets) {
    if (known.has(asset.url)) asset.classification = 'known-lumen'
  }

  const observed = report.assets.filter(asset => asset.classification === 'known-lumen').map(asset => asset.url)
  const observedSet = new Set(observed)

  report.assetAudit = {
    scope: expectations ? 'explicit-inventory' : 'unknown',
    observedLumenAssets: observed.sort(),
    unexpectedLumenAssets: observed.filter(url => !allowed.has(url)).sort(),
    allowedAssetsNotObserved: [...allowed].filter(url => !observedSet.has(url)).sort(),
    unclassifiedAssets: report.assets.filter(asset => asset.classification === 'unclassified').map(asset => asset.url).sort()
  }
}

const hasHttpErrors = (report: RenderedRouteReport): boolean => (
  (report.httpStatus !== null && report.httpStatus >= 400) ||
  report.assets.some(asset => asset.httpStatus !== null && asset.httpStatus >= 400)
)

const routeHasIssues = (report: RenderedRouteReport): boolean => (
  Boolean(report.layout?.horizontalOverflowPixels) ||
  report.console.length > 0 || report.pageErrors.length > 0 ||
  report.blockedRequests.length > 0 || report.failedRequests.length > 0 ||
  report.assetAudit.unexpectedLumenAssets.length > 0 ||
  report.diagnostics.length > 0 || hasHttpErrors(report)
)

const inspectViewport = async (
  browser: Browser,
  options: RenderedAuditOptions,
  viewport: RenderedAuditViewport,
  expectations: AssetExpectations | undefined
): Promise<RenderedRouteReport> => {
  const report = emptyRoute(options.url, viewport)
  const observation: NetworkObservation = { active: true, timeoutMs: options.timeoutMs }
  const context = await browser.newContext({ viewport, serviceWorkers: 'block', acceptDownloads: false })

  try {
    await context.route('**/*', route => guardRequest(route, report, observation))

    await context.routeWebSocket('**/*', async socket => {
      if (report.blockedRequests.length < 100) {
        report.blockedRequests.push(assetUrl(socket.url(), report.requestedUrl))
      }

      await socket.close({ code: 1000, reason: 'Rendered audit blocks socket connections.' })
    })

    const page = await context.newPage()
    const stopObserving = observePage(page, report)

    try {
      const response = await page.goto(options.url, { waitUntil: 'load', timeout: options.timeoutMs })

      report.httpStatus = response?.status() ?? null

      await delay(options.settleMs)

      report.finalUrl = assetUrl(page.url(), options.url)

      report.layout = await readLayout(page)
    } catch {
      report.diagnostics.push({ code: 'navigation-failed', message: 'The local route did not finish loading within the audit settings.' })

      report.finalUrl = assetUrl(page.url(), options.url)
    }

    observation.active = false

    stopObserving()

    await page.close()

    classifyAssets(report, expectations)

    report.observationComplete = report.layout !== null && report.diagnostics.length === 0 &&
      report.blockedRequests.length === 0 && report.failedRequests.length === 0
  } finally {
    observation.active = false

    await context.close()
  }

  return report
}

const unavailable = (diagnostic: Diagnostic, browser: RenderedAuditBrowser): RenderedAuditReport => ({
  schemaVersion: 1, status: 'unavailable', browser, browserVersion: null, routes: [], diagnostics: [diagnostic]
})

export const inspectRenderedAudit = async (
  options: RenderedAuditOptions,
  loadLauncher: (cwd: string, browser: RenderedAuditBrowser) => Promise<LauncherResult> = loadBrowserLauncher
): Promise<RenderedAuditReport> => {
  parseLoopbackUrl(options.url)

  const expectations = await loadExpectations(options)
  const loaded = await loadLauncher(options.cwd, options.browser)

  if ('diagnostic' in loaded) return unavailable(loaded.diagnostic, options.browser)

  let browser: Browser

  try {
    browser = await loaded.launcher.launch({ headless: true })
  } catch {
    return unavailable({
      code: 'browser-launch-failed',
      message: 'The selected Playwright browser could not launch. Install it explicitly with your project Playwright CLI and verify its system dependencies.'
    }, options.browser)
  }

  const report: RenderedAuditReport = { schemaVersion: 1, status: 'passed', browser: options.browser, browserVersion: browser.version(), routes: [], diagnostics: [] }

  try {
    for (const viewport of options.viewports) {
      report.routes.push(await inspectViewport(browser, options, viewport, expectations))
    }

    if (report.routes.some(routeHasIssues)) report.status = 'issues'
  } finally {
    await browser.close()
  }

  return report
}

export const formatRenderedAudit = (report: RenderedAuditReport): string => [
  'Rendered audit: ' + report.status,
  ...report.diagnostics.map(diagnostic => diagnostic.code + ': ' + diagnostic.message),
  ...report.routes.flatMap(route => [
    '',
    route.finalUrl + ' (' + String(route.viewport.width) + 'x' + String(route.viewport.height) + ')',
    'Observation complete: ' + String(route.observationComplete),
    'Horizontal overflow: ' + String(route.layout?.horizontalOverflowPixels ?? 'unknown') + 'px',
    'Console warnings/errors: ' + String(route.console.length) + '; page errors: ' + String(route.pageErrors.length),
    'Blocked external requests: ' + String(route.blockedRequests.length),
    'Lumen inventory: ' + route.assetAudit.scope,
    'Unexpected known Lumen assets: ' + String(route.assetAudit.unexpectedLumenAssets.length),
    'Unclassified script/style assets: ' + String(route.assetAudit.unclassifiedAssets.length),
    ...route.console.map(message => 'Console ' + message.type + ': ' + message.message),
    ...route.pageErrors.map(message => 'Page error: ' + message),
    ...route.blockedRequests.map(url => 'Blocked request: ' + url),
    ...route.redirects.map(redirect => 'Redirect blocked: ' + (redirect.location ?? 'invalid or missing Location')),
    ...route.assetAudit.observedLumenAssets.map(url => 'Observed Lumen asset: ' + url),
    ...route.assetAudit.unexpectedLumenAssets.map(url => 'Unexpected Lumen asset: ' + url),
    ...route.assetAudit.unclassifiedAssets.map(url => 'Unclassified asset: ' + url),
    ...route.diagnostics.map(diagnostic => diagnostic.code + ': ' + diagnostic.message)
  ]),
  '',
  'Asset classification covers the supplied exact inventory. Other hashed assets remain unclassified.'
].join('\n')

const help = [
  'lumen audit-rendered <local-url> [--cwd <project>] [--json]',
  '--browser chromium|firefox|webkit (default chromium)',
  '--viewport WIDTHxHEIGHT (repeatable, up to 8; default 390x844 and 1280x900)',
  '--timeout-ms 100..60000 (default 10000)',
  '--settle-ms 0..5000 (default 200, after load)',
  '--asset-expectations <json> with exact knownLumenAssets and allowedLumenAssets arrays',
  'Uses an already installed project Playwright module and browser. Starts no server and downloads no tools.'
].join('\n')

const auditFailure = (error: unknown): RenderedAuditReport => {
  const configuration = error instanceof RenderedAuditConfigurationError

  return {
    schemaVersion: 1,
    status: configuration ? 'invalid' : 'unavailable',
    browser: null,
    browserVersion: null,
    routes: [],
    diagnostics: [{
      code: configuration ? error.code : 'audit-failed',
      message: configuration ? error.message : 'The rendered audit could not complete.'
    }]
  }
}

const reportExitCode = (report: RenderedAuditReport): 0 | 1 | 2 => {
  if (report.status === 'passed') return 0

  if (report.status === 'issues') return 1

  return 2
}

export const runRenderedAuditCommand = async (
  args: readonly string[],
  cwd: string
): Promise<{ output: string, exitCode: 0 | 1 | 2 }> => {
  if (args.includes('--help')) return { output: help, exitCode: 0 }

  let report: RenderedAuditReport

  try {
    const options = parseRenderedAuditArguments(args, cwd)
    const directory = await stat(options.cwd).catch(() => undefined)

    if (!directory?.isDirectory()) {
      throw new RenderedAuditConfigurationError('invalid-cwd', 'The target project directory must exist.')
    }

    report = await inspectRenderedAudit(options)
  } catch (error: unknown) {
    report = auditFailure(error)
  }

  return {
    output: args.includes('--json') ? JSON.stringify(report, null, 2) : formatRenderedAudit(report),
    exitCode: reportExitCode(report)
  }
}
