import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'

import { loadLumenData } from './data.js'
import {
  type FrameworkFilter,
  getComponent,
  getRules,
  getTokens,
  listComponents,
  type LumenToolResult,
  search} from './tools.js'

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined

const asBoolean = (value: unknown): boolean | undefined =>
  typeof value === 'boolean' ? value : undefined

const asNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined

const frameworks: readonly FrameworkFilter[] = ['astro', 'react', 'elements']

const asFramework = (value: unknown): FrameworkFilter | undefined =>
  typeof value === 'string' && (frameworks as readonly string[]).includes(value)
    ? (value as FrameworkFilter)
    : undefined

const tools = [
  {
    description:
      'List Lumen UI components with their framework availability (Astro, React, Web Components) ' +
      'and recipe membership. Optionally filter by framework, recipe, or a name substring.',
    inputSchema: {
      additionalProperties: false,
      properties: {
        framework: {
          description: 'Only list components available for this framework.',
          enum: ['astro', 'react', 'elements'],
          type: 'string'
        },
        query: { description: 'Case-insensitive substring match against the component name.', type: 'string' },
        recipe: { description: 'Only list components that belong to this recipe.', type: 'string' }
      },
      type: 'object'
    },
    name: 'lumen_list_components'
  },
  {
    description:
      'Get a single Lumen component: its typed props, framework availability, recipe membership, ' +
      'and the real Astro reference source. Accepts PascalCase ("DataTable") or kebab-case ("data-table").',
    inputSchema: {
      additionalProperties: false,
      properties: {
        includeSource: {
          description: 'Include the full Astro source (default true). Set false for just props/metadata.',
          type: 'boolean'
        },
        name: { description: 'Component name, e.g. "Button" or "data-table".', type: 'string' }
      },
      required: ['name'],
      type: 'object'
    },
    name: 'lumen_get_component'
  },
  {
    description:
      'Search across Lumen components, props, recipes, tokens, and agent rules by keyword or use-case.',
    inputSchema: {
      additionalProperties: false,
      properties: {
        limit: { description: 'Maximum results to return (1-100, default 20).', type: 'number' },
        query: { description: 'Keyword or phrase to search for.', type: 'string' }
      },
      required: ['query'],
      type: 'object'
    },
    name: 'lumen_search'
  },
  {
    description:
      'Return Lumen design tokens: semantic token names, base color values, glass surface tokens, ' +
      'and the theme attribute. Use these instead of hard-coded colors in generated code.',
    inputSchema: { additionalProperties: false, properties: {}, type: 'object' },
    name: 'lumen_get_tokens'
  },
  {
    description:
      'Return the Lumen agent rules (llms.txt): conventions for generating, reviewing, or migrating ' +
      'apps that use Lumen. Read this before producing Lumen code.',
    inputSchema: { additionalProperties: false, properties: {}, type: 'object' },
    name: 'lumen_get_rules'
  }
] as const

const dispatch = (name: string, args: Record<string, unknown>): LumenToolResult => {
  switch (name) {
    case 'lumen_get_component': {
      const componentName = asString(args.name)

      if (!componentName) {
        return { isError: true, text: 'The "name" argument is required.' }
      }

      return getComponent({ includeSource: asBoolean(args.includeSource) ?? true, name: componentName })
    }

    case 'lumen_get_rules':
      return getRules()

    case 'lumen_get_tokens':
      return getTokens()

    case 'lumen_list_components':
      return listComponents({
        framework: asFramework(args.framework),
        query: asString(args.query),
        recipe: asString(args.recipe)
      })

    case 'lumen_search': {
      const query = asString(args.query)

      if (!query) {
        return { isError: true, text: 'The "query" argument is required.' }
      }

      return search({ limit: asNumber(args.limit), query })
    }

    default:
      return { isError: true, text: `Unknown tool: ${name}` }
  }
}

export const createLumenServer = (): Server => {
  // Fail fast with a clear message if the bundled snapshot is missing.
  loadLumenData()

  const server = new Server(
    { name: '@santi020k/lumen-mcp', version: '0.0.0' },
    { capabilities: { tools: {} } }
  )

  server.setRequestHandler(ListToolsRequestSchema, () => ({ tools: tools.map((tool) => ({ ...tool })) }))

  server.setRequestHandler(CallToolRequestSchema, (request) => {
    const { arguments: args, name } = request.params
    const result = dispatch(name, args ?? {})

    return {
      content: [{ text: result.text, type: 'text' }],
      isError: result.isError ?? false
    }
  })

  return server
}
