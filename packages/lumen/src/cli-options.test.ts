import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import { describe, expect, test } from 'vitest'

import { parseCliOptions, resolveAuditRenderedCwd } from './cli-options.js'

const execFileAsync = promisify(execFile)
const binPath = fileURLToPath(new URL('../bin/lumen.mjs', import.meta.url))
const distCliPath = fileURLToPath(new URL('../dist/cli.js', import.meta.url))

describe('CLI option validation', () => {
  test('audit-tokens uses --cwd instead of treating --cwd as a filename', () => {
    const parsed = parseCliOptions(['audit-tokens', '--cwd', './src'])

    expect(parsed.name).toBeUndefined()
    expect(parsed.cwd).toBe('./src')
  })

  test('preserves first value for duplicate valid scalar flags while accumulating --exclude', () => {
    const parsed = parseCliOptions([
      'rollout',
      '--cwd',
      'first-cwd',
      '--cwd',
      'second-cwd',
      '--report',
      'first.json',
      '--report',
      'second.json',
      '--exclude',
      'a',
      '--exclude',
      'b'
    ])

    expect(parsed.cwd).toBe('first-cwd')
    expect(parsed.reportPath).toBe('first.json')
    expect(parsed.excludeValues).toEqual(['a', 'b'])
    expect(resolveAuditRenderedCwd(['audit-rendered', '--cwd', 'first-cwd', '--cwd', 'second-cwd'])).toBe('first-cwd')
  })

  test('rejects repeated required-value flags when any occurrence is missing or flag-shaped', () => {
    expect(() => parseCliOptions(['rollout', '--report', 'valid.json', '--report', '--apply'])).toThrow(
      'Provide a path after --report.'
    )
    expect(() => parseCliOptions(['add', 'Button', '--cwd', 'a', '--cwd'])).toThrow(
      'Provide a path after --cwd.'
    )
  })

  test.each([
    [['rollout', '--report', '--apply'], 'Provide a path after --report.'],
    [['rollout', '--report'], 'Provide a path after --report.'],
    [['add', 'Button', '--cwd', '--dry-run'], 'Provide a path after --cwd.'],
    [['add', 'Button', '--registry', '--dry-run'], 'Provide a path or URL after --registry.'],
    [['add', 'Button', '--registry-token', '--apply'], 'Provide a token after --registry-token.'],
    [['rollout', '--exclude', '--apply'], 'Provide a path after --exclude.'],
    [['init', '--framework', '--tailwind'], 'Missing or invalid framework. Use --framework astro, react, or elements.']
  ])('rejects missing or flag-shaped value for %j', (argv, expected) => {
    expect(() => parseCliOptions(argv)).toThrow(expected)
  })

  test('does not echo registry token values on validation errors', () => {
    const secret = 'secret-lumen-token-value'

    expect(() => parseCliOptions(['add', 'Button', '--registry-token', secret, '--cwd', '--dry-run'])).toThrow(
      'Provide a path after --cwd.'
    )
    expect(() => parseCliOptions(['add', 'Button', '--registry-token', secret, '--cwd', '--dry-run'])).not.toThrow(
      secret
    )
  })

  test('audit-rendered passes its own flags through while validating --cwd', () => {
    expect(resolveAuditRenderedCwd(['audit-rendered', 'http://127.0.0.1:4321', '--build-report', 'r.json'])).toBeUndefined()
    expect(resolveAuditRenderedCwd(['audit-rendered', 'http://127.0.0.1:4321', '--cwd', './app'])).toBe('./app')
    expect(() => resolveAuditRenderedCwd(['audit-rendered', '--cwd'])).toThrow('Provide a path after --cwd.')
  })

  test.skipIf(!existsSync(distCliPath))('bin/lumen.mjs runs help and rejects invalid args', async () => {
    const { stdout } = await execFileAsync(process.execPath, [binPath, 'help'])

    expect(stdout).toContain('Lumen registry helper')

    await expect(execFileAsync(process.execPath, [binPath, 'rollout', '--report', '--apply'])).rejects.toMatchObject({
      code: 1
    })
  })
})
