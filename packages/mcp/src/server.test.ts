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

const resultStructuredContent = (result: unknown): Record<string, unknown> => {
  if (
    typeof result !== 'object' ||
    result === null ||
    !('structuredContent' in result) ||
    typeof result.structuredContent !== 'object' ||
    result.structuredContent === null
  ) return {}

  return result.structuredContent as Record<string, unknown>
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
      expect(client.getInstructions()).toContain('lumen://rules')
    })
  })

  test('registers the complete read-only tool surface', async () => {
    await withClient(async (client) => {
      const response = await client.listTools()

      expect(response.tools.map((tool) => tool.name)).toEqual([
        'lumen_list_components',
        'lumen_get_component',
        'lumen_get_recipe',
        'lumen_search',
        'lumen_get_meta',
        'lumen_get_tokens',
        'lumen_get_rules'
      ])

      for (const tool of response.tools) {
        expect(tool.outputSchema).toBeDefined()
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
        arguments: { detail: 'usage', framework: 'react', name: 'data-table' },
        name: 'lumen_get_component'
      })

      expect(result.isError).toBe(false)
      expect(resultText(result)).toContain('# DataTable')
      expect(resultText(result)).toContain('@santi020k/lumen-react')
      expect(resultStructuredContent(result)).toMatchObject({
        found: true
      })
    })
  })

  test('executes every catalog discovery tool over MCP', async () => {
    await withClient(async (client) => {
      const [listResult, recipeResult, searchResult, metaResult, tokensResult, rulesResult] = await Promise.all([
        client.callTool({
          arguments: { framework: 'astro', query: 'button' },
          name: 'lumen_list_components'
        }),
        client.callTool({
          arguments: { framework: 'elements', name: 'scheduler' },
          name: 'lumen_get_recipe'
        }),
        client.callTool({
          arguments: { limit: 5, query: 'date input' },
          name: 'lumen_search'
        }),
        client.callTool({ arguments: {}, name: 'lumen_get_meta' }),
        client.callTool({ arguments: {}, name: 'lumen_get_tokens' }),
        client.callTool({ arguments: {}, name: 'lumen_get_rules' })
      ])

      expect(resultText(listResult)).toContain('Button')
      expect(resultText(recipeResult)).toContain('lumen add scheduler --target elements')
      expect(resultText(searchResult)).toContain('DatePicker')
      expect(resultText(metaResult)).toContain('Catalog hash')
      expect(resultText(tokensResult)).toContain('Lumen design tokens')
      expect(resultText(rulesResult)).toContain('@santi020k/lumen')

      for (const result of [listResult, recipeResult, searchResult, metaResult, tokensResult, rulesResult]) {
        expect(result.isError).toBe(false)
        expect(resultStructuredContent(result)).not.toEqual({})
      }
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
      arguments: { detail: 'everything', name: 'Button' },
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
      expect(resultStructuredContent(result)).toMatchObject({ found: false })
    })
  })

  test('lists and reads stable catalog resources', async () => {
    await withClient(async (client) => {
      const resources = await client.listResources()
      const templates = await client.listResourceTemplates()

      expect(resources.resources.some((resource) => resource.uri === 'lumen://rules')).toBe(true)
      expect(resources.resources.some((resource) => resource.uri === 'lumen://meta')).toBe(true)
      expect(resources.resources.some((resource) => resource.uri === 'lumen://components/button'))
        .toBe(true)
      expect(templates.resourceTemplates.map((template) => template.uriTemplate)).toEqual([
        'lumen://components/{name}',
        'lumen://recipes/{name}'
      ])

      const [rules, component, recipe] = await Promise.all([
        client.readResource({ uri: 'lumen://rules' }),
        client.readResource({ uri: 'lumen://components/date-range-picker' }),
        client.readResource({ uri: 'lumen://recipes/advanced-fields' })
      ])

      expect(rules.contents[0]).toMatchObject({ mimeType: 'text/markdown' })
      expect(JSON.stringify(component.contents[0])).toContain('DateRangePicker')
      expect(JSON.stringify(recipe.contents[0])).toContain('advanced-fields')
    })
  })
})
