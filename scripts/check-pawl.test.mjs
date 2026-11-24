import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { evaluatePawl, pilotFiles, runPawl } from './check-pawl.mjs'

// cspell:words baselined

const root = fileURLToPath(new URL('../', import.meta.url))

const clean = () => ({
  findings: [], setup: [], engines: ['biome'], hasBaseline: false,
  baselined: 0, nothingToCheck: false, maxWarnings: 0
})

const finding = severity => ({
  file: pilotFiles[0], line: 7, column: 13, rule: 'no-console',
  message: 'Do not use console.', severity
})

test('Pawl diagnostics retain severity, location, message and rule for Quality', () => {
  const result = evaluatePawl({ ...clean(), findings: [finding('error'), finding('warn')] })

  assert.equal(result.code, 1)

  assert.deepEqual(result.reports, [{
    filePath: pilotFiles[0],
    messages: [
      { ruleId: 'no-console', message: 'Do not use console.', severity: 2, line: 7, column: 13 },
      { ruleId: 'no-console', message: 'Do not use console.', severity: 1, line: 7, column: 13 }
    ],
    errorCount: 1,
    warningCount: 1
  }])

  assert.equal(evaluatePawl({ ...clean(), findings: [finding('warn')] }).code, 1)

  assert.deepEqual(evaluatePawl(clean()), { reports: [], code: 0 })
})

test('Pawl setup failures remain exit 2 and structured error diagnostics', () => {
  const result = evaluatePawl({ ...clean(), setup: [{ code: 'engine-failed', message: 'Biome failed' }] })

  assert.equal(result.code, 2)

  assert.equal(result.reports[0].messages[0].ruleId, 'pawl/engine-failed')

  assert.equal(result.reports[0].messages[0].severity, 2)
})

test('malformed reports, empty scope, baseline and warning-policy drift cannot pass', () => {
  for (const result of [
    null, {}, { ...clean(), findings: null }, { ...clean(), findings: [null] },
    { ...clean(), findings: [{ ...finding('warn'), line: 0 }] },
    { ...clean(), findings: [{ ...finding('warn'), severity: 'info' }] },
    { ...clean(), setup: [null] }, { ...clean(), hasBaseline: true },
    { ...clean(), baselined: 1 }, { ...clean(), nothingToCheck: true },
    { ...clean(), engines: ['eslint'] }, { ...clean(), maxWarnings: 1 }
  ]) assert.throws(() => evaluatePawl(result))
})

const withFixture = async callback => {
  const directory = await mkdtemp(join(tmpdir(), 'lumen-pawl-'))

  try {
    await symlink(join(root, 'node_modules'), join(directory, 'node_modules'), 'dir')

    await writeFile(join(directory, '.gitignore'), 'node_modules\n')

    for (const file of ['pawl.config.ts', 'biome.json', '.pawl/rules/zod.grit', ...pilotFiles]) {
      await mkdir(dirname(join(directory, file)), { recursive: true })

      await copyFile(join(root, file), join(directory, file))
    }

    await callback(directory)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

test('installed Pawl and Biome check actual pilot files and report introduced violations', async () => {
  await withFixture(async directory => {
    const passing = await runPawl(directory)

    assert.equal(passing.code, 0, JSON.stringify(passing.reports))

    await writeFile(join(directory, pilotFiles[0]), 'console.log("pilot violation");\n')

    const failed = await runPawl(directory)
    const messages = failed.reports.flatMap(report => report.messages)

    assert.equal(failed.code, 1, JSON.stringify(failed.reports))

    assert.ok(messages.some(message => message.ruleId === 'no-console' && message.severity === 1))

    assert.ok(messages.some(message => message.ruleId === 'pawl/format'))
  })
})

test('runner rejects missing pilot files, scope drift and even an empty baseline', async () => {
  await withFixture(async directory => {
    const baseline = join(directory, '.pawl/baseline.json')

    await writeFile(baseline, '{}')

    assert.equal((await runPawl(directory)).code, 2)

    await rm(baseline)

    const configFile = join(directory, 'biome.json')
    const original = await readFile(configFile, 'utf8')
    const config = JSON.parse(original)

    config.formatter.includes = ['**']

    await writeFile(configFile, JSON.stringify(config))

    assert.equal((await runPawl(directory)).code, 2)

    await writeFile(configFile, original)

    await rm(join(directory, pilotFiles[0]))

    assert.equal((await runPawl(directory)).code, 2)
  })
})

test('an unscoped Biome fix leaves files outside the pilot unchanged', async () => {
  await withFixture(async directory => {
    const outside = join(directory, 'outside.mjs')
    const source = 'console.log("outside pilot");\n'

    await writeFile(outside, source)

    execFileSync(join(root, 'node_modules/.bin/biome'), ['check', '--write', '.'], {
      cwd: directory,
      encoding: 'utf8'
    })

    assert.equal(await readFile(outside, 'utf8'), source)
  })
})

test('canonical validation and Quality preserve the original repository gate', async () => {
  const { scripts } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
  const quality = await readFile(join(root, 'quality.yml'), 'utf8')
  const pawlTask = quality.split('  pawl:\n')[1]?.split('\n  repository-check:')[0]
  const repositoryTask = quality.split('  repository-check:\n')[1]?.split('\nhooks:')[0]

  assert.equal(scripts['check:pawl'], 'node scripts/check-pawl.mjs')

  assert.equal(scripts['test:pawl'], 'node --test scripts/check-pawl.test.mjs')

  assert.equal(scripts.validate, 'pnpm run check:pawl && pnpm run validate:repo')

  assert.ok(scripts['validate:repo'].startsWith('pnpm run test:pawl && '))

  for (const command of ['lint', 'typecheck', 'test', 'build'])
    assert.ok(scripts['validate:repo'].includes(`pnpm run ${command}`), `Missing canonical ${command}`)

  assert.match(scripts['ci:preflight'], /pnpm run test:pawl/u)

  assert.match(scripts['ci:preflight'], /pnpm run check:pawl/u)

  assert.match(pawlTask, /command: node\n\s+args: \[scripts\/check-pawl\.mjs\]\n\s+required: true\n\s+parser: eslint-json/u)

  assert.match(repositoryTask, /command: pnpm\n\s+args:\n\s+- run\n\s+- validate:repo/u)
})
