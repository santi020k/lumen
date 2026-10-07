import assert from 'node:assert/strict'

const record = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const tokenCount = value => Number.isSafeInteger(value) && value >= 0

export const hasComponentLookup = transcript => transcript.split('\n').filter(line => line.trim()).map(line => JSON.parse(line))
  .some(event => record(event) && event.type === 'item.completed' && record(event.item)
    && event.item.type === 'mcp_tool_call' && event.item.tool === 'lumen_get_component'
    && event.item.status === 'completed')

/** Read the CLI's completed-turn usage, including tool context and cached input. */
export const readCodexUsage = transcript => {
  const events = transcript.split('\n').filter(line => line.trim()).map(line => JSON.parse(line))
  const turns = events.filter(event => record(event) && event.type === 'turn.completed')

  assert.ok(turns.length > 0, 'No completed turn with token usage; missing usage is not zero.')

  const usage = { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, toolCalls: 0 }

  for (const turn of turns) {
    assert.ok(record(turn.usage), 'Completed turn is missing usage.')

    const { input_tokens: input, cached_input_tokens: cached, output_tokens: output } = turn.usage

    assert.ok(tokenCount(input) && tokenCount(cached) && tokenCount(output), 'Invalid token usage.')

    assert.ok(cached <= input, 'Cached input must be a subset of input tokens.')

    usage.inputTokens += input

    usage.cachedInputTokens += cached

    usage.outputTokens += output
  }

  usage.toolCalls = events.filter(event => record(event) && event.type === 'item.completed'
    && record(event.item) && ['command_execution', 'mcp_tool_call', 'file_change'].includes(event.item.type)).length

  return { ...usage, totalTokens: usage.inputTokens + usage.outputTokens }
}

export const median = values => {
  assert.ok(values.length > 0 && values.every(Number.isFinite), 'A median requires finite observations.')

  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)

  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

/** Include unsuccessful attempts in workload totals; keep quality visible alongside efficiency. */
export const summarizeEfficiency = runs => {
  const groups = new Map()

  for (const run of runs) {
    const key = `${run.case}/${run.mode}`
    const entries = groups.get(key) ?? []

    entries.push(run)

    groups.set(key, entries)
  }

  return [...groups].map(([key, entries]) => {
    const [scenario, mode] = key.split('/')
    const measured = entries.filter(entry => entry.usage !== null)

    return {
      case: scenario, mode, runs: entries.length,
      passed: entries.filter(entry => entry.status === 'passed').length,
      measured: measured.length,
      medianTotalTokens: measured.length === entries.length ? median(measured.map(entry => entry.usage.totalTokens)) : null,
      medianDurationMs: median(entries.map(entry => entry.durationMs)),
      totalTokens: measured.length === entries.length ? measured.reduce((total, entry) => total + entry.usage.totalTokens, 0) : null
    }
  })
}
