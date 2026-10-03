import { describe, expect, test, vi } from 'vitest'

import worker from './cloudflare-worker.js'
import { getMeta } from './tools.js'

describe('Cloudflare Worker MCP transport', () => {
  test('keeps the existing stateless protocol handshake and tool responses', async () => {
    const limit = vi.fn().mockResolvedValue({ success: true })
    const environment = { LUMEN_MCP_RATE_LIMITER: { limit } }
    const headers = {
      accept: 'application/json, text/event-stream',
      'cf-connecting-ip': '192.0.2.1',
      'content-type': 'application/json',
      'mcp-protocol-version': '2025-11-25'
    }
    const initialize = await worker.fetch(new Request('https://lumen.example/mcp', {
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          capabilities: {},
          clientInfo: { name: 'lumen-worker-test', version: '1.0.0' },
          protocolVersion: '2025-11-25'
        }
      }),
      headers,
      method: 'POST'
    }), environment)

    expect(initialize.status).toBe(200)
    expect(initialize.headers.get('mcp-session-id')).toBeNull()
    expect(initialize.headers.get('cache-control')).toBe('no-store')
    const initializationBody: unknown = await initialize.json()

    expect(initializationBody).toMatchObject({
      id: 1,
      jsonrpc: '2.0',
      result: {
        capabilities: { resources: {}, tools: {} },
        protocolVersion: '2025-11-25',
        serverInfo: { name: '@santi020k/lumen-mcp' }
      }
    })

    const response = await worker.fetch(new Request('https://lumen.example/mcp', {
      body: JSON.stringify({
        id: 2,
        jsonrpc: '2.0',
        method: 'tools/call',
        params: { arguments: {}, name: 'lumen_get_meta' }
      }),
      headers,
      method: 'POST'
    }), environment)

    expect(response.status).toBe(200)
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('referrer-policy')).toBe('no-referrer')
    expect(response.headers.get('x-frame-options')).toBe('DENY')
    const responseBody: unknown = await response.json()

    expect(responseBody).toMatchObject({
      id: 2,
      jsonrpc: '2.0',
      result: {
        content: [expect.objectContaining({ type: 'text' })],
        isError: false,
        structuredContent: getMeta().data
      }
    })
    expect(limit).toHaveBeenCalledTimes(2)
  })
})

describe('Cloudflare Worker rate limiting', () => {
  test('reports catalog readiness without consuming rate-limit capacity', async () => {
    const limit = vi.fn()
    const response = await worker.fetch(new Request('https://lumen.example/ready'), {
      LUMEN_MCP_RATE_LIMITER: { limit }
    })

    expect(response.status).toBe(200)
    const responseText = await response.text()

    expect(responseText).toMatch(/"catalogHash":"[a-f0-9]{64}"/u)
    expect(responseText).toMatch(/"serverVersion":"[^"]+"/u)
    expect(responseText).toContain('"status":"ready"')
    expect(limit).not.toHaveBeenCalled()
  })

  test('scopes rate-limit keys to the connecting client', async () => {
    const limit = vi.fn().mockResolvedValue({ success: false })
    const environment = { LUMEN_MCP_RATE_LIMITER: { limit } }

    const firstResponse = await worker.fetch(new Request('https://lumen.example/mcp', {
      headers: { 'cf-connecting-ip': '192.0.2.1' }
    }), environment)
    const secondResponse = await worker.fetch(new Request('https://lumen.example/mcp', {
      headers: { 'cf-connecting-ip': '192.0.2.2' }
    }), environment)

    expect(firstResponse.status).toBe(429)
    expect(secondResponse.status).toBe(429)
    expect(limit).toHaveBeenNthCalledWith(1, { key: 'public-mcp:192.0.2.1' })
    expect(limit).toHaveBeenNthCalledWith(2, { key: 'public-mcp:192.0.2.2' })
  })

  test('uses a stable fallback when the client header is unavailable', async () => {
    const limit = vi.fn().mockResolvedValue({ success: false })

    await worker.fetch(new Request('https://lumen.example/mcp'), {
      LUMEN_MCP_RATE_LIMITER: { limit }
    })

    expect(limit).toHaveBeenCalledWith({ key: 'public-mcp:unknown' })
  })

  test('fails closed when the rate limiter is missing or unavailable', async () => {
    const missing = await worker.fetch(new Request('https://lumen.example/mcp'), {
      LUMEN_MCP_RATE_LIMITER: undefined
    })
    const unavailable = await worker.fetch(new Request('https://lumen.example/mcp'), {
      LUMEN_MCP_RATE_LIMITER: {
        limit: vi.fn().mockRejectedValue(new Error('binding unavailable'))
      }
    })

    expect(missing.status).toBe(503)
    expect(unavailable.status).toBe(503)
    await expect(missing.json()).resolves.toEqual({
      error: 'Lumen MCP rate limiting is unavailable.'
    })
    await expect(unavailable.json()).resolves.toEqual({
      error: 'Lumen MCP rate limiting is unavailable.'
    })
  })
})
