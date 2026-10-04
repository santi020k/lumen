import assert from 'node:assert/strict'
import test from 'node:test'

import { verifyHostedMcp, verifyPublishedMcp } from './check-hosted-mcp.mjs'

const snapshot = { meta: {
  catalogHash: 'released-catalog', componentCount: 182, nativeComponentCount: 100, serverVersion: '4.0.0'
} }

const mockHosted = (overrides = {}) => {
  const seen = []

  const request = async (_url, options) => {
    if (!options?.body) return Response.json({ status: overrides.health ?? 'ok' })

    const { method, params } = JSON.parse(options.body)

    if (method === 'initialize') return Response.json({ result: { serverInfo: { version: overrides.version ?? '4.0.0' } } })

    if (method === 'tools/list') return Response.json({ result: { tools:
      ['lumen_list_components', 'lumen_get_component', 'lumen_list_native_components',
        'lumen_get_native_component', 'lumen_get_recipe', 'lumen_search', 'lumen_check_compatibility',
        'lumen_get_migration', 'lumen_get_meta', 'lumen_get_catalog_manifest', 'lumen_diff_catalog',
        'lumen_diagnose', 'lumen_get_tokens', 'lumen_get_rules']
        .filter(name => name !== overrides.missingTool).map(name => ({ name }))
    } })

    assert.equal(method, 'tools/call')

    if (params.name === 'lumen_get_meta') return Response.json({ result: { structuredContent: { meta: { ...snapshot.meta, ...overrides.meta } } } })

    if (params.name === 'lumen_diagnose') return Response.json({ result: { structuredContent: { status: overrides.diagnosis ?? 'healthy' } } })

    assert.equal(params.name, 'lumen_get_component')

    assert.equal(params.arguments.framework, 'react')

    assert.equal(params.arguments.detail, 'usage')

    seen.push(params.arguments.name)

    return Response.json({ result: { structuredContent: { found: params.arguments.name !== overrides.missingComponent } } })
  }

  return { request, seen }
}

test('verifies the exact released catalog and retrieves old and new usage contracts', async () => {
  const { request, seen } = mockHosted()

  await verifyHostedMcp(snapshot, request)

  for (const name of ['Button', 'DataTable', 'WaterfallChart', 'CalendarHeatmap', 'FunnelChart', 'BoxPlot']) {
    assert.ok(seen.includes(name))
  }
})

test('rejects an old server, a different snapshot, missing tools, and broken catalog integrity', async () => {
  for (const [overrides, diagnostic] of [
    [{ version: '1.6.0' }, /server version is stale/u],
    [{ meta: { catalogHash: 'another-release' } }, /catalogHash does not match/u],
    [{ meta: { componentCount: 179 } }, /componentCount does not match/u],
    [{ missingTool: 'lumen_check_compatibility' }, /missing lumen_check_compatibility/u],
    [{ missingTool: 'lumen_search' }, /missing lumen_search/u],
    [{ missingTool: 'lumen_list_native_components' }, /missing lumen_list_native_components/u],
    [{ missingTool: 'lumen_get_native_component' }, /missing lumen_get_native_component/u],
    [{ missingTool: 'lumen_get_tokens' }, /missing lumen_get_tokens/u],
    [{ missingTool: 'lumen_get_rules' }, /missing lumen_get_rules/u],
    [{ diagnosis: 'issues' }, /catalog integrity failed/u],
    [{ health: 'unhealthy' }, /is unhealthy/u],
    [{ missingComponent: 'BoxPlot' }, /missing BoxPlot/u]
  ]) {
    await assert.rejects(verifyHostedMcp(snapshot, mockHosted(overrides).request), diagnostic)
  }
})

test('rejects HTTP and protocol failures rather than treating them as successful deployment', async () => {
  await assert.rejects(verifyHostedMcp(snapshot, async () => new Response('', { status: 503 })), /health failed/u)

  const request = async (_url, options) => options?.body ?
    Response.json({ error: { code: -32603, message: 'Unavailable' } }) :
    Response.json({ status: 'ok' })

  await assert.rejects(verifyHostedMcp(snapshot, request), /protocol error/u)
})

test('requires the exact npm package version before deployment', async () => {
  await verifyPublishedMcp('4.0.0', async url => {
    assert.equal(url, 'https://registry.npmjs.org/@santi020k%2flumen-mcp/4.0.0')

    return Response.json({ version: '4.0.0' })
  })

  await assert.rejects(verifyPublishedMcp('4.0.0', async () => new Response('', { status: 404 })), /not published/u)

  await assert.rejects(verifyPublishedMcp('4.0.0', async () => Response.json({ version: '1.6.0' })), /does not match/u)
})
