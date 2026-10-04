import assert from 'node:assert/strict'
import test from 'node:test'

import { createPublicEfficiencyReport } from './lib/ai-efficiency-report.mjs'

const fixture = () => {
  const usage = { inputTokens: 100, cachedInputTokens: 50, outputTokens: 20, totalTokens: 120, toolCalls: 1 }

  return {
    schemaVersion: 1, model: 'test-model', effort: 'high', cli: 'test-cli', revision: 'a'.repeat(40),
    createdAt: '2026-10-04T00:00:00Z', repetitions: 3, maxAttempts: 2,
    hashes: Object.fromEntries(['harness', 'verifier', 'metrics', 'stylesheet', 'react', 'catalog', 'skill'].map(key => [key, 'b'.repeat(64)])),
    scenarios: ['profile-dialog', 'notification-settings'].map(id => ({ id, prompt: 'A synthetic test prompt.' })),
    summary: [{ totalTokens: 0 }],
    runs: ['profile-dialog', 'notification-settings'].flatMap(scenario => ['scratch', 'docs', 'skill-mcp'].flatMap(mode => [1, 2, 3].map(repetition => ({
      case: scenario, mode, repetition, status: 'failed', durationMs: 1000, usage,
      attempts: [{ attempt: 1, usage, diagnostic: 'Private local diagnostic path.' }]
    }))))
  }
}

test('recomputes summaries, includes failures, and strips local diagnostics', () => {
  const report = createPublicEfficiencyReport(fixture())

  assert.equal(report.runs.length, 18)

  assert.equal(report.revisionRole, 'checkout-base')

  assert.ok(report.summary.every(group => group.passed === 0 && group.totalTokens === 360))

  assert.equal(JSON.stringify(report).includes('Private local'), false)
})

test('rejects missing runs, duplicate repetitions, and incorrect usage accounting', () => {
  const missing = fixture()

  missing.runs.pop()

  assert.throws(() => createPublicEfficiencyReport(missing), /complete matrix/)

  const duplicate = fixture()

  duplicate.runs[1] = duplicate.runs[0]

  assert.throws(() => createPublicEfficiencyReport(duplicate), /Duplicate runs/)

  const invalid = fixture()

  invalid.runs[0].usage.totalTokens = 200

  assert.throws(() => createPublicEfficiencyReport(invalid), /Token total/)
})
