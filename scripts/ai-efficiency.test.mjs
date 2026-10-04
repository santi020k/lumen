import assert from 'node:assert/strict'
import test from 'node:test'

import { hasComponentLookup, median, readCodexUsage, summarizeEfficiency } from './lib/ai-efficiency-metrics.mjs'

const trace = usage => JSON.stringify({ type: 'turn.completed', usage })

test('requires completed MCP retrieval rather than a mention in agent prose', () => {
  assert.equal(hasComponentLookup(JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: 'lumen_get_component' } })), false)

  assert.equal(hasComponentLookup(JSON.stringify({ type: 'item.completed', item: { type: 'mcp_tool_call', tool: 'lumen_get_component', status: 'completed' } })), true)

  assert.equal(hasComponentLookup(JSON.stringify({ type: 'item.completed', item: { type: 'mcp_tool_call', tool: 'lumen_get_component', status: 'failed' } })), false)
})

test('counts all input once, including cached input, and sums completed turns', () => {
  const transcript = [
    trace({ input_tokens: 100, cached_input_tokens: 60, output_tokens: 20 }),
    JSON.stringify({ type: 'item.completed', item: { type: 'mcp_tool_call' } }),
    trace({ input_tokens: 200, cached_input_tokens: 100, output_tokens: 30 })
  ].join('\n')

  assert.deepEqual(readCodexUsage(transcript), {
    inputTokens: 300, cachedInputTokens: 160, outputTokens: 50, totalTokens: 350, toolCalls: 1
  })
})

test('does not turn missing, malformed, or invalid token usage into a zero saving', () => {
  for (const transcript of ['', '{}', '{', trace({}), trace({ input_tokens: -1, cached_input_tokens: 0, output_tokens: 2 }),
    trace({ input_tokens: 1, cached_input_tokens: 2, output_tokens: 2 })]) {
    assert.throws(() => readCodexUsage(transcript))
  }
})

test('keeps failures in summaries and refuses complete totals with missing usage', () => {
  const runs = [
    { case: 'form', mode: 'scratch', status: 'passed', durationMs: 100, usage: { totalTokens: 100 } },
    { case: 'form', mode: 'scratch', status: 'failed', durationMs: 300, usage: { totalTokens: 500 } }
  ]

  assert.deepEqual(summarizeEfficiency(runs), [{
    case: 'form', mode: 'scratch', runs: 2, passed: 1, measured: 2,
    medianTotalTokens: 300, medianDurationMs: 200, totalTokens: 600
  }])

  assert.equal(summarizeEfficiency([...runs, { ...runs[0], usage: null }])[0].medianTotalTokens, null)

  assert.equal(median([9, 1, 3]), 3)

  assert.throws(() => median([]))
})
