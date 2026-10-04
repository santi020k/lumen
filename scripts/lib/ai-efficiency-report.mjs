import assert from 'node:assert/strict'

import { summarizeEfficiency } from './ai-efficiency-metrics.mjs'

const record = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const count = value => Number.isSafeInteger(value) && value >= 0
const modes = ['scratch', 'docs', 'skill-mcp']
const cases = ['profile-dialog', 'notification-settings']
const fields = ['inputTokens', 'cachedInputTokens', 'outputTokens', 'totalTokens', 'toolCalls']

const usageFor = value => {
  if (value === null) return null

  assert.ok(record(value) && fields.every(key => count(value[key])), 'Invalid usage measurement.')

  assert.equal(value.totalTokens, value.inputTokens + value.outputTokens, 'Token total is inconsistent.')

  assert.ok(value.cachedInputTokens <= value.inputTokens, 'Cached input was counted incorrectly.')

  return Object.fromEntries(fields.map(key => [key, value[key]]))
}

const publicRun = (run, repetitions) => {
  assert.ok(record(run) && cases.includes(run.case) && modes.includes(run.mode), 'Unknown experiment group.')

  assert.ok(count(run.repetition) && run.repetition >= 1 && run.repetition <= repetitions, 'Invalid repetition.')

  assert.ok(['passed', 'failed'].includes(run.status) && count(run.durationMs), 'Invalid run outcome.')

  assert.ok(Array.isArray(run.attempts) && run.attempts.length >= 1 && run.attempts.length <= 2, 'Invalid attempt count.')

  const attempts = run.attempts.map((attempt, index) => {
    assert.ok(record(attempt) && attempt.attempt === index + 1, 'Attempt order is inconsistent.')

    assert.ok(attempt.diagnostic === null || typeof attempt.diagnostic === 'string', 'Missing verification outcome.')

    return { attempt: attempt.attempt, usage: usageFor(attempt.usage), status: attempt.diagnostic === null ? 'passed' : 'failed' }
  })

  const usage = usageFor(run.usage)

  if (attempts.every(attempt => attempt.usage !== null)) {
    assert.ok(usage !== null, 'Measured attempts need a complete run total.')

    for (const field of fields) assert.equal(usage[field], attempts.reduce((total, attempt) => total + attempt.usage[field], 0), 'Run usage must include every attempt.')
  } else assert.equal(usage, null, 'Missing attempt usage makes the run total unavailable.')

  assert.equal(run.status, attempts.at(-1).status, 'Final status must match the last attempt.')

  return { case: run.case, mode: run.mode, repetition: run.repetition, status: run.status, durationMs: run.durationMs, usage, attempts }
}

/** Strip local diagnostic/transcript data; reject partial or selectively filtered matrices. */
export const createPublicEfficiencyReport = report => {
  assert.ok(record(report) && report.schemaVersion === 1, 'Unsupported report.')

  assert.ok(Number.isSafeInteger(report.repetitions) && report.repetitions >= 3 && report.repetitions <= 10, 'Publish at least three repetitions.')

  assert.equal(report.maxAttempts, 2, 'Unexpected repair allowance.')

  for (const key of ['model', 'effort', 'cli', 'revision', 'createdAt']) assert.ok(typeof report[key] === 'string' && report[key].length > 0, 'Missing experiment provenance.')

  assert.ok(Number.isFinite(Date.parse(report.createdAt)), 'Invalid experiment date.')

  assert.match(report.revision, /^[a-f0-9]{40}$/u)

  assert.ok(record(report.hashes), 'Missing source hashes.')

  const hashes = {}

  for (const key of ['harness', 'verifier', 'metrics', 'stylesheet', 'react', 'catalog', 'skill']) {
    assert.match(report.hashes[key], /^[a-f0-9]{64}$/u)

    hashes[key] = report.hashes[key]
  }

  assert.ok(Array.isArray(report.runs), 'Missing runs.')

  assert.equal(report.runs.length, cases.length * modes.length * report.repetitions, 'Publish the complete matrix, including failures.')

  const runs = report.runs.map(run => publicRun(run, report.repetitions))

  assert.equal(new Set(runs.map(run => `${run.case}/${run.mode}/${run.repetition}`)).size, runs.length, 'Duplicate runs are not repetitions.')

  assert.ok(Array.isArray(report.scenarios) && report.scenarios.length === cases.length, 'Missing prompts.')

  const scenarios = report.scenarios.map(scenario => {
    assert.ok(record(scenario) && cases.includes(scenario.id) && typeof scenario.prompt === 'string', 'Invalid scenario.')

    return { id: scenario.id, prompt: scenario.prompt }
  })

  assert.equal(new Set(scenarios.map(scenario => scenario.id)).size, cases.length)

  return {
    generatedBy: 'pnpm run report:ai-efficiency', evidence: 'local candidate experiment',
    schemaVersion: 1, createdAt: report.createdAt, model: report.model, effort: report.effort,
    cli: report.cli, revision: report.revision, revisionRole: 'checkout-base', hashes, repetitions: report.repetitions,
    maxAttempts: report.maxAttempts, scenarios, runs, summary: summarizeEfficiency(runs)
  }
}
