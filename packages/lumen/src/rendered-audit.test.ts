import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, test } from 'vitest'

import { inspectRenderedAudit, runRenderedAuditCommand } from './rendered-audit.js'
import { parseLoopbackUrl, parseRenderedAuditArguments, RenderedAuditConfigurationError } from './rendered-audit-options.js'

describe('rendered audit configuration', () => {
  test.each([
    'http://localhost:4321/guide/',
    'http://127.0.0.1:4321/',
    'https://127.99.2.3/',
    'http://[::1]:4321/'
  ])('accepts a loopback route %s', url => {
    expect(parseLoopbackUrl(url).href).toBe(url)
  })

  test.each([
    'https://example.com/',
    'http://localhost.example.com/',
    'http://127.0.0.1.example.com/',
    'http://reader:secret@localhost/',
    'file:///tmp/page.html',
    'ftp://127.0.0.1/',
    'not a URL'
  ])('rejects a nonlocal or unsupported route %s', url => {
    expect(() => parseLoopbackUrl(url)).toThrow(RenderedAuditConfigurationError)
  })

  test('parses bounded repeatable viewports and defaults', () => {
    const defaults = parseRenderedAuditArguments(['http://localhost:4321/'], '/project')
    expect(defaults.viewports).toEqual([{ width: 390, height: 844 }, { width: 1280, height: 900 }])
    const options = parseRenderedAuditArguments([
      'http://localhost:4321/',
      '--browser',
      'webkit',
      '--viewport',
      '320x568',
      '--viewport',
      '1280x900',
      '--timeout-ms',
      '2500',
      '--settle-ms',
      '0',
      '--json'
    ], '/project')
    expect(options).toMatchObject({ browser: 'webkit', timeoutMs: 2500, settleMs: 0, viewports: [{ width: 320, height: 568 }, { width: 1280, height: 900 }] })
  })

  test.each([
    ['--viewport', '100x200'],
    ['--viewport', '9999x9999'],
    ['--viewport', '320.5x568'],
    ['--browser', 'unknown'],
    ['--timeout-ms', '0'],
    ['--settle-ms', '5001'],
    ['--asset-expectations'],
    ['--registry', 'https://example.com/registry.json'],
    ['http://localhost/second']
  ].map(args => ({ args })))('rejects malformed or unrelated arguments %j', ({ args }) => {
    expect(() => parseRenderedAuditArguments(['http://localhost/', ...args], '/project')).toThrow(RenderedAuditConfigurationError)
  })

  test('rejects remote input before resolving or launching a browser', async () => {
    let toolLoads = 0
    const options = parseRenderedAuditArguments(['http://localhost/'], '/project')
    await expect(inspectRenderedAudit({ ...options, url: 'https://example.com/' }, () => {
      toolLoads += 1
      return Promise.resolve({ diagnostic: { code: 'unexpected', message: 'Unexpected tool load' } })
    })).rejects.toThrow(RenderedAuditConfigurationError)
    expect(toolLoads).toBe(0)
  })

  test('uses JSON diagnostics and exit2 for invalid credentials without echoing them', async () => {
    const result = await runRenderedAuditCommand(['http://reader:secret@localhost/', '--json'], process.cwd())
    const report: unknown = JSON.parse(result.output)
    expect(result.exitCode).toBe(2)
    expect(report).toMatchObject({ status: 'invalid', diagnostics: [{ code: 'non-loopback-url' }] })
    expect(result.output).not.toContain('secret')
  })
})

describe('optional browser tooling', () => {
  test('reports missing project tooling without installing or launching it', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'lumen-rendered-no-tool-'))
    try {
      const result = await runRenderedAuditCommand(['http://localhost:9/', '--json'], cwd)
      const report: unknown = JSON.parse(result.output)
      expect(result.exitCode).toBe(2)
      expect(report).toMatchObject({ status: 'unavailable', diagnostics: [{ code: 'playwright-not-found' }] })
    } finally {
      await rm(cwd, { recursive: true, force: true })
    }
  })

  test('reports missing browser launch with an explicit install diagnostic', async () => {
    const options = parseRenderedAuditArguments(['http://localhost:9/'], process.cwd())
    const report = await inspectRenderedAudit(options, () => Promise.resolve({
      launcher: { launch: () => Promise.reject(new Error('Executable unavailable')) }
    }))
    expect(report).toMatchObject({ status: 'unavailable', diagnostics: [{ code: 'browser-launch-failed' }] })
    expect(report.diagnostics[0]?.message).toContain('Install it explicitly')
  })

  test('rejects malformed asset inventories before loading a browser', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'lumen-rendered-expectations-'))
    try {
      const path = join(cwd, 'assets.json')
      const options = parseRenderedAuditArguments(['http://localhost:9/', '--asset-expectations', 'assets.json'], cwd)
      for (const value of [
        { knownLumenAssets: ['/a.js'], allowedLumenAssets: ['/b.js'] },
        { knownLumenAssets: [1], allowedLumenAssets: [] },
        { knownLumenAssets: ['https://example.com/a.js'], allowedLumenAssets: [] },
        { knownLumenAssets: ['/a.js?token=secret'], allowedLumenAssets: [] },
        { knownLumenAssets: ['http://['], allowedLumenAssets: [] },
        { knownLumenAssets: [], allowedLumenAssets: [], unknown: true }
      ]) {
        await writeFile(path, JSON.stringify(value))
        let toolLoads = 0
        await expect(inspectRenderedAudit(options, () => {
          toolLoads += 1
          return Promise.resolve({ diagnostic: { code: 'unexpected', message: 'Unexpected tool load' } })
        })).rejects.toThrow(RenderedAuditConfigurationError)
        expect(toolLoads).toBe(0)
      }
    } finally {
      await rm(cwd, { recursive: true, force: true })
    }
  })

  test('reports incompatible consumer tooling without a browser fallback', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'lumen-rendered-bad-tool-'))
    try {
      const packageRoot = join(cwd, 'node_modules', '@playwright', 'test')
      await mkdir(packageRoot, { recursive: true })
      await writeFile(join(packageRoot, 'package.json'), JSON.stringify({ name: '@playwright/test', type: 'module', exports: './index.js' }))
      await writeFile(join(packageRoot, 'index.js'), 'export const incompatible = true\n')
      const result = await runRenderedAuditCommand(['http://localhost:9/', '--json'], cwd)
      const report: unknown = JSON.parse(result.output)
      expect(result.exitCode).toBe(2)
      expect(report).toMatchObject({ status: 'unavailable', diagnostics: [{ code: 'playwright-incompatible' }] })
    } finally {
      await rm(cwd, { recursive: true, force: true })
    }
  })
})
