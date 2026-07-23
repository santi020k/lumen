import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as z from 'zod'

import { loadLumenData } from './data.js'
import {
  getComponent,
  getRules,
  getTokens,
  listComponents,
  type LumenToolResult,
  search
} from './tools.js'

const readOnlyAnnotations = {
  idempotentHint: true,
  openWorldHint: false,
  readOnlyHint: true
} as const

const toMcpResult = (result: LumenToolResult) => ({
  content: [{ text: result.text, type: 'text' as const }],
  isError: result.isError ?? false
})

export const createLumenServer = (): McpServer => {
  // Fail fast with a clear message if the bundled snapshot is missing.
  const data = loadLumenData()

  const server = new McpServer(
    { name: '@santi020k/lumen-mcp', version: data.meta.serverVersion },
    {
      instructions:
        'Use lumen_get_rules before generating Lumen code. Search or list the catalog, then read ' +
        'the selected component source and props before implementing it.'
    }
  )

  server.registerTool(
    'lumen_list_components',
    {
      annotations: readOnlyAnnotations,
      description:
        'List Lumen UI components with their framework availability (Astro, React, Web Components) ' +
        'and recipe membership. Optionally filter by framework, recipe, or a name substring.',
      inputSchema: z.strictObject({
        framework: z.enum(['astro', 'react', 'elements'])
          .optional()
          .meta({ description: 'Only list components available for this framework.' }),
        query: z.string().trim().min(1)
          .optional()
          .meta({ description: 'Case-insensitive substring match against the component name.' }),
        recipe: z.string().trim().min(1)
          .optional()
          .meta({ description: 'Only list components that belong to this recipe.' })
      })
    },
    (args) => toMcpResult(listComponents(args))
  )

  server.registerTool(
    'lumen_get_component',
    {
      annotations: readOnlyAnnotations,
      description:
        'Get a single Lumen component: its typed props, framework availability, recipe membership, ' +
        'and the real Astro reference source. Accepts PascalCase ("DataTable") or kebab-case ("data-table").',
      inputSchema: z.strictObject({
        includeSource: z.boolean()
          .optional()
          .meta({
            description: 'Include the full Astro source (default true). Set false for just props and metadata.'
          }),
        name: z.string().trim().min(1)
          .meta({ description: 'Component name, for example "Button" or "data-table".' })
      })
    },
    (args) => toMcpResult(getComponent(args))
  )

  server.registerTool(
    'lumen_search',
    {
      annotations: readOnlyAnnotations,
      description:
        'Search across Lumen components, props, recipes, tokens, and agent rules by keyword or use-case.',
      inputSchema: z.strictObject({
        limit: z.int().min(1).max(100)
          .optional()
          .meta({ description: 'Maximum results to return (1-100, default 20).' }),
        query: z.string().trim().min(1)
          .meta({ description: 'Keyword or natural-language use-case to search for.' })
      })
    },
    (args) => toMcpResult(search(args))
  )

  server.registerTool(
    'lumen_get_tokens',
    {
      annotations: readOnlyAnnotations,
      description:
        'Return Lumen design tokens: semantic token names, base color values, glass surface tokens, ' +
        'and the theme attribute. Use these instead of hard-coded colors in generated code.',
      inputSchema: z.strictObject({})
    },
    () => toMcpResult(getTokens())
  )

  server.registerTool(
    'lumen_get_rules',
    {
      annotations: readOnlyAnnotations,
      description:
        'Return the Lumen agent rules (llms.txt): conventions for generating, reviewing, or migrating ' +
        'apps that use Lumen. Read this before producing Lumen code.',
      inputSchema: z.strictObject({})
    },
    () => toMcpResult(getRules())
  )

  return server
}
