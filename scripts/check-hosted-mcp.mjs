import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

export const verifyPublishedMcp = async (expectedVersion, request = fetch) => {
  const response = await request(`https://registry.npmjs.org/@santi020k%2flumen-mcp/${expectedVersion}`, {
    signal: AbortSignal.timeout(15_000)
  })

  assert.ok(response.ok, `MCP ${expectedVersion} is not published (HTTP ${response.status})`)

  const metadata = await response.json()

  assert.equal(metadata.version, expectedVersion, 'Published MCP version does not match the candidate')
}

export const verifyHostedMcp = async (snapshot, request = fetch) => {
  const endpoint = 'https://mcp.lumen.santi020k.com/mcp'

  const health = await request('https://mcp.lumen.santi020k.com/health', {
    signal: AbortSignal.timeout(15_000)
  })

  assert.ok(health.ok, `Hosted MCP health failed (HTTP ${health.status})`)

  assert.equal((await health.json()).status, 'ok', 'Hosted MCP is unhealthy')

  const rpc = async (method, params) => {
    const response = await request(endpoint, {
      body: JSON.stringify({ id: 1, jsonrpc: '2.0', method, params }),
      headers: { Accept: 'application/json, text/event-stream', 'Content-Type': 'application/json' },
      method: 'POST',
      signal: AbortSignal.timeout(15_000)
    })

    assert.ok(response.ok, `${method} failed (HTTP ${response.status})`)

    const message = await response.json()

    assert.ok(!message.error, `${method} returned a protocol error`)

    assert.ok(message.result, `${method} omitted its result`)

    return message.result
  }

  const initialization = await rpc('initialize', {
    capabilities: {},
    clientInfo: { name: 'lumen-hosted-release-check', version: '1.0.0' },
    protocolVersion: '2025-03-26'
  })

  assert.equal(initialization.serverInfo?.version, snapshot.meta.serverVersion, 'Hosted server version is stale')

  const tools = await rpc('tools/list', {})
  const names = tools.tools.map(tool => tool.name)

  for (const name of ['lumen_list_components', 'lumen_get_component', 'lumen_list_native_components',
    'lumen_get_native_component', 'lumen_get_recipe', 'lumen_search', 'lumen_check_compatibility',
    'lumen_get_migration', 'lumen_get_meta', 'lumen_get_catalog_manifest', 'lumen_diff_catalog',
    'lumen_diagnose', 'lumen_get_tokens', 'lumen_get_rules']) {
    assert.ok(names.includes(name), `Hosted catalog is missing ${name}`)
  }

  const call = async (name, args = {}) => {
    const result = await rpc('tools/call', { arguments: args, name })

    assert.ok(!result.isError, `${name} returned a tool error`)

    assert.ok(result.structuredContent, `${name} omitted structured data`)

    return result.structuredContent
  }

  const { meta } = await call('lumen_get_meta')

  for (const key of ['catalogHash', 'componentCount', 'nativeComponentCount', 'serverVersion']) {
    assert.equal(meta[key], snapshot.meta[key], `Hosted catalog ${key} does not match the released snapshot`)
  }

  assert.equal((await call('lumen_diagnose')).status, 'healthy', 'Hosted catalog integrity failed')

  const samples = ['Button', 'DataTable', 'ImageComparison', 'FilterBar', 'ChangeSummary',
    'Sparkline', 'BarChart', 'LineChart', 'PieChart', 'ScatterChart', 'Heatmap', 'RangeChart',
    'ComboChart', 'BulletChart', 'LollipopChart', 'DumbbellChart', 'Histogram', 'WaterfallChart',
    'CalendarHeatmap', 'FunnelChart', 'BoxPlot']

  for (const name of samples) {
    const result = await call('lumen_get_component', { detail: 'usage', framework: 'react', name })

    assert.equal(result.found, true, `Hosted catalog is missing ${name}`)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const snapshot = JSON.parse(await readFile(new URL('../packages/mcp/data/lumen-data.json', import.meta.url), 'utf8'))

  await verifyPublishedMcp(snapshot.meta.serverVersion)

  if (!process.argv.includes('--published-only')) await verifyHostedMcp(snapshot)

  console.log(`MCP ${snapshot.meta.serverVersion}: ${process.argv.includes('--published-only') ? 'published package verified' : 'published package and hosted catalog verified'}`)
}
