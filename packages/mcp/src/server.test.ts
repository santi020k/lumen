import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { describe, expect, test } from 'vitest'

import { loadLumenData } from './data.js'
import { createLumenServer } from './server.js'

const isTextContent = (item: unknown): item is { text: string; type: 'text' } =>
  typeof item === 'object' &&
  item !== null &&
  'text' in item &&
  typeof item.text === 'string' &&
  'type' in item &&
  item.type === 'text'

const resultText = (result: unknown): string => {
  if (
    typeof result !== 'object' ||
    result === null ||
    !('content' in result) ||
    !Array.isArray(result.content)
  ) return ''

  const content: unknown[] = result.content

  return content
    .filter(isTextContent)
    .map((item) => item.text)
    .join('\n')
}

const withClient = async (callback: (client: Client, server: McpServer) => Promise<void> | void) => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const client = new Client({ name: 'lumen-mcp-tests', version: '1.0.0' })
  const server = createLumenServer()

  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport)
  ])

  try {
    await callback(client, server)
  } finally {
    await client.close()

    if (server.isConnected()) await server.close()
  }
}

describe('Lumen MCP protocol server', () => {
  test('reports the package version and usage instructions', async () => {
    await withClient((client) => {
      expect(client.getServerVersion()).toEqual({
        name: '@santi020k/lumen-mcp',
        version: loadLumenData().meta.serverVersion
      })
      expect(client.getInstructions()).toContain('lumen_get_rules')
    })
  })

  test('registers the complete read-only tool surface', async () => {
    await withClient(async (client) => {
      const response = await client.listTools()

      expect(response.tools.map((tool) => tool.name)).toEqual([
        'lumen_list_components',
        'lumen_get_component',
        'lumen_search',
        'lumen_get_tokens',
        'lumen_get_rules'
      ])

      for (const tool of response.tools) {
        expect(tool.annotations).toMatchObject({
          idempotentHint: true,
          openWorldHint: false,
          readOnlyHint: true
        })
      }
    })
  })

  test('calls a tool and serializes its text result', async () => {
    await withClient(async (client) => {
      const result = await client.callTool({
        arguments: { includeSource: false, name: 'data-table' },
        name: 'lumen_get_component'
      })

      expect(result.isError).toBe(false)
      expect(resultText(result)).toContain('# DataTable')
      expect(resultText(result)).not.toContain('```astro')
    })
  })

  test.each([
    {
      arguments: { framework: 'vue' },
      name: 'lumen_list_components'
    },
    {
      arguments: { extra: true, name: 'Button' },
      name: 'lumen_get_component'
    },
    {
      arguments: { limit: 101, query: 'button' },
      name: 'lumen_search'
    }
  ])('rejects invalid arguments for $name', async ({ arguments: args, name }) => {
    await withClient(async (client) => {
      const result = await client.callTool({ arguments: args, name })

      expect(result.isError).toBe(true)
      expect(resultText(result)).toContain('Invalid arguments')
    })
  })

  test('preserves domain errors as MCP tool errors', async () => {
    await withClient(async (client) => {
      const result = await client.callTool({
        arguments: { name: 'NotARealComponent' },
        name: 'lumen_get_component'
      })

      expect(result.isError).toBe(true)
      expect(resultText(result)).toContain('Unknown component')
    })
  })
})
