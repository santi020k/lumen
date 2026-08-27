import { describe, expect, test, vi } from 'vitest'

import worker from './cloudflare-worker.js'

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
