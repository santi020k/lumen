import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { describe, expect, test } from 'vitest'

import { startLumenMcpHttp } from './index.js'

describe('Lumen MCP Streamable HTTP transport', () => {
  test('serves MCP tools and a health endpoint on loopback', async () => {
    const running = await startLumenMcpHttp({ port: 0 })
    const client = new Client({ name: 'lumen-http-test', version: '1.0.0' })
    const transport = new StreamableHTTPClientTransport(running.url)

    try {
      await client.connect(transport as Parameters<typeof client.connect>[0])

      const [tools, health, readiness] = await Promise.all([
        client.listTools(),
        fetch(new URL('/health', running.url)),
        fetch(new URL('/ready', running.url))
      ])

      expect(tools.tools.map(tool => tool.name)).toContain('lumen_diagnose')
      expect(await health.json()).toEqual({ status: 'ok' })
      const readinessText = await readiness.text()

      expect(readinessText).toMatch(/"catalogHash":"[a-f0-9]{64}"/u)
      expect(readinessText).toMatch(/"serverVersion":"[^"]+"/u)
      expect(readinessText).toContain('"status":"ready"')
    } finally {
      await client.close()
      await running.close()
    }
  })

  test('serves the OpenAI verification challenge with hardened response headers', async () => {
    const running = await startLumenMcpHttp({
      openAiChallenge: 'verification-token',
      port: 0
    })

    try {
      const response = await fetch(new URL('/.well-known/openai-apps-challenge', running.url))

      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBe('no-store')
      expect(response.headers.get('referrer-policy')).toBe('no-referrer')
      expect(response.headers.get('x-content-type-options')).toBe('nosniff')
      expect(await response.text()).toBe('verification-token')
    } finally {
      await running.close()
    }
  })

  test('rate limits repeated MCP requests with a safe response', async () => {
    const running = await startLumenMcpHttp({
      port: 0,
      rateLimit: { maxRequests: 1, windowMs: 60_000 }
    })

    try {
      const first = await fetch(running.url, { method: 'POST' })
      const second = await fetch(running.url, { method: 'POST' })

      expect(first.status).not.toBe(429)
      expect(second.status).toBe(429)
      expect(second.headers.get('retry-after')).toBe('60')
      expect(await second.json()).toEqual({ error: 'Too many MCP requests. Try again later.' })
    } finally {
      await running.close()
    }
  })

  test('rejects unsafe OpenAI challenge tokens', async () => {
    await expect(startLumenMcpHttp({
      openAiChallenge: 'unsafe\ntoken',
      port: 0
    })).rejects.toThrow('openAiChallenge must be a non-empty single-line token.')
  })

  test('returns bounded JSON errors for malformed HTTP bodies', async () => {
    const errors: unknown[] = []
    const running = await startLumenMcpHttp({
      onError: error => errors.push(error),
      port: 0
    })

    try {
      const response = await fetch(running.url, {
        body: '{',
        headers: { 'content-type': 'application/json' },
        method: 'POST'
      })

      expect(response.status).toBe(400)
      expect(response.headers.get('content-type')).toMatch(/^application\/json/u)
      expect(response.headers.get('x-frame-options')).toBe('DENY')
      expect(await response.json()).toEqual({ error: 'Invalid Lumen MCP HTTP request.' })
      expect(errors).toHaveLength(1)
    } finally {
      await running.close()
    }
  })
})
