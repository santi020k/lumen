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

      const [tools, health] = await Promise.all([
        client.listTools(),
        fetch(new URL('/health', running.url))
      ])

      expect(tools.tools.map((tool) => tool.name)).toContain('lumen_diagnose')
      expect(await health.json()).toEqual({ status: 'ok' })
    } finally {
      await client.close()
      await running.close()
    }
  })
})
