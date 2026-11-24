import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { BASELINE_FILE, check, exitCode } from '@santi020k/pawl'

// cspell:words baselined

export const pilotFiles = Object.freeze([
  '.github/scripts/docs-deployment-artifact.mjs',
  '.github/scripts/docs-deployment-artifact.test.mjs'
])

const rootDirectory = fileURLToPath(new URL('../', import.meta.url))
const setupFile = 'pawl.config.ts'

const diagnostic = (ruleId, message, severity = 2, line = 1, column = 1) => ({
  ruleId, message, severity, line, column
})

const reportsFor = entries => [...Map.groupBy(entries, entry => entry.file)].map(([filePath, items]) => {
  const messages = items.map(item => item.message)

  return {
    filePath,
    messages,
    errorCount: messages.filter(message => message.severity === 2).length,
    warningCount: messages.filter(message => message.severity === 1).length
  }
})

const validateFinding = finding => {
  assert.ok(finding && typeof finding === 'object', 'Invalid Pawl finding')

  for (const key of ['file', 'rule', 'message'])
    assert.ok(typeof finding[key] === 'string' && finding[key].length > 0, `Invalid Pawl ${key}`)

  assert.ok(['warn', 'error'].includes(finding.severity), 'Invalid Pawl severity')

  for (const key of ['line', 'column'])
    assert.ok(Number.isSafeInteger(finding[key]) && finding[key] >= 1, `Invalid Pawl ${key}`)
}

// Quality 2.1 understands ESLint JSON; preserve Pawl's locations, rules and severities.
export const evaluatePawl = result => {
  assert.ok(result && typeof result === 'object', 'Invalid Pawl result')

  assert.ok(Array.isArray(result.findings) && Array.isArray(result.setup), 'Invalid Pawl diagnostics')

  assert.equal(result.hasBaseline, false, 'Pawl baselines are not permitted')

  assert.equal(result.baselined, 0, 'Pawl findings must not be covered by a baseline')

  assert.equal(result.nothingToCheck, false, 'Pawl must check the deployment tooling')

  assert.deepEqual(result.engines, ['biome'], 'The pilot requires the Biome engine')

  assert.equal(result.maxWarnings, 0, 'Pawl warnings must fail the check')

  const entries = result.findings.map(finding => {
    validateFinding(finding)

    return {
      file: finding.file,
      message: diagnostic(finding.rule, finding.message, finding.severity === 'error' ? 2 : 1, finding.line, finding.column)
    }
  })

  for (const issue of result.setup) {
    assert.ok(issue && typeof issue.code === 'string' && typeof issue.message === 'string', 'Invalid Pawl setup issue')

    entries.push({ file: setupFile, message: diagnostic(`pawl/${issue.code}`, issue.message) })
  }

  return { reports: reportsFor(entries), code: exitCode(result, true) }
}

export const runPawl = async (root = rootDirectory) => {
  try {
    assert.equal(existsSync(join(root, BASELINE_FILE)), false, 'Remove the Pawl baseline; this pilot requires every finding to pass')

    const config = JSON.parse(readFileSync(join(root, 'biome.json'), 'utf8'))

    for (const tool of ['linter', 'formatter', 'assist'])
      assert.deepEqual(config[tool]?.includes, pilotFiles, `Biome ${tool} must target the deployment tooling pilot`)

    for (const file of pilotFiles)
      assert.ok(statSync(join(root, file)).isFile(), `Missing Pawl pilot file: ${file}`)

    return evaluatePawl(await check({ root, files: pilotFiles, maxWarnings: 0 }))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pawl failed with an unknown error'

    return { reports: reportsFor([{ file: setupFile, message: diagnostic('pawl/setup', message) }]), code: 2 }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await runPawl()

  process.stdout.write(`${JSON.stringify(result.reports)}\n`)

  process.exitCode = result.code
}
