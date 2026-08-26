import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as z from 'zod'

import { loadLumenData } from './data.js'
import {
  diagnose,
  diffCatalog,
  getCatalogManifest,
  getComponent,
  getMeta,
  getNativeComponent,
  getRecipe,
  getRules,
  getTokens,
  listComponents,
  listNativeComponents,
  type LumenToolResult,
  search
} from './tools.js'

const readOnlyAnnotations = {
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
  readOnlyHint: true
} as const

const componentSummarySchema = z.strictObject({
  category: z.string().trim(),
  collections: z.array(z.string().trim()),
  description: z.string().trim(),
  frameworks: z.array(z.enum(['astro', 'elements', 'react'])),
  kebab: z.string().trim(),
  name: z.string().trim(),
  recipes: z.array(z.string().trim())
})

const listComponentsOutputSchema = z.strictObject({
  components: z.array(componentSummarySchema),
  count: z.int().min(0)
})

const componentOutputSchema = z.strictObject({
  component: z.record(z.string(), z.unknown()).optional(),
  found: z.boolean(),
  message: z.string().trim().optional()
})

const nativePlatformSchema = z.enum(['react-native', 'swiftui', 'compose'])

const nativeComponentSummarySchema = z.strictObject({
  accessibility: z.string().trim(),
  category: z.string().trim(),
  id: z.string().trim(),
  name: z.string().trim(),
  platforms: z.array(nativePlatformSchema),
  summary: z.string().trim(),
  tier: z.string().trim()
})

const listNativeComponentsOutputSchema = z.strictObject({
  components: z.array(nativeComponentSummarySchema),
  count: z.int().min(0)
})

const recipeOutputSchema = z.strictObject({
  found: z.boolean(),
  message: z.string().trim().optional(),
  recipe: z.record(z.string(), z.unknown()).optional()
})

const searchResultSchema = z.strictObject({
  category: z.string().trim().optional(),
  description: z.string().trim(),
  frameworks: z.array(z.enum(['astro', 'elements', 'react'])).optional(),
  kind: z.enum(['component', 'native-component', 'recipe', 'rule', 'token']),
  matchedTerms: z.array(z.string().trim()),
  name: z.string().trim(),
  platforms: z.array(nativePlatformSchema).optional(),
  score: z.number()
})

const searchOutputSchema = z.strictObject({
  query: z.string().trim(),
  results: z.array(searchResultSchema),
  total: z.int().min(0)
})

const tokensOutputSchema = z.strictObject({
  tokens: z.strictObject({
    chart: z.record(z.string(), z.string().trim()),
    colors: z.record(z.string(), z.string().trim()),
    glass: z.record(z.string(), z.string().trim()),
    semantic: z.array(z.string().trim()),
    themeAttribute: z.string().trim()
  })
})

const rulesOutputSchema = z.strictObject({
  rules: z.string().trim()
})

const metaOutputSchema = z.strictObject({
  meta: z.strictObject({
    catalogHash: z.string().trim().regex(/^[a-f0-9]{64}$/),
    componentCount: z.int().min(0),
    nativeComponentCount: z.int().min(0),
    packages: z.array(z.string().trim()),
    packageVersions: z.record(z.string(), z.string().trim()),
    registryName: z.string().trim(),
    registryVersion: z.int().min(1),
    schemaVersion: z.int().min(1),
    serverVersion: z.string().trim()
  })
})

const catalogManifestSchema = z.strictObject({
  components: z.record(z.string(), z.string().trim().regex(/^[a-f0-9]{64}$/)),
  nativeComponents: z.record(z.string(), z.string().trim().regex(/^[a-f0-9]{64}$/))
    .optional(),
  recipes: z.record(z.string(), z.string().trim().regex(/^[a-f0-9]{64}$/))
})

const catalogChangesSchema = z.strictObject({
  added: z.array(z.string().trim()),
  changed: z.array(z.string().trim()),
  removed: z.array(z.string().trim()),
  unchanged: z.array(z.string().trim())
})

const catalogManifestOutputSchema = z.strictObject({
  catalogHash: z.string().trim().regex(/^[a-f0-9]{64}$/),
  manifest: catalogManifestSchema,
  schemaVersion: z.int().min(1)
})

const catalogDiffOutputSchema = z.strictObject({
  components: catalogChangesSchema,
  currentCatalogHash: z.string().trim().regex(/^[a-f0-9]{64}$/),
  nativeComponents: catalogChangesSchema,
  recipes: catalogChangesSchema,
  unchanged: z.boolean()
})

const diagnosticsOutputSchema = z.strictObject({
  checks: z.array(z.strictObject({
    message: z.string().trim(),
    name: z.string().trim(),
    status: z.enum(['fail', 'pass'])
  })),
  frameworkCoverage: z.strictObject({
    astro: z.int().min(0),
    elements: z.int().min(0),
    react: z.int().min(0)
  }),
  nativeCoverage: z.strictObject({
    compose: z.int().min(0),
    'react-native': z.int().min(0),
    swiftui: z.int().min(0)
  }),
  status: z.enum(['healthy', 'issues'])
})

const structuredData = (data: unknown): Record<string, unknown> => typeof data === 'object' && data !== null ?
  data as Record<string, unknown> :
  { value: data }

const toMcpResult = (result: LumenToolResult) => ({
  content: [{ text: result.text, type: 'text' as const }],
  isError: result.isError ?? false,
  structuredContent: structuredData(result.data)
})

const jsonResource = (
  uri: URL,
  data: unknown,
  mimeType = 'application/json'
) => ({
  contents: [{
    mimeType,
    text: JSON.stringify(data, null, 2),
    uri: uri.href
  }]
})

export const createLumenServer = (): McpServer => {
  const data = loadLumenData()

  const server = new McpServer(
    { name: '@santi020k/lumen-mcp', version: data.meta.serverVersion }, {
      instructions:
        'Read lumen://meta, lumen://diagnostics, and lumen://rules before generating Lumen code. Search or list the catalog, ' +
        'then inspect the selected web or native component for the target framework or platform at usage detail before requesting source.'
    }
  )

  server.registerTool(
    'lumen_list_components', {
      annotations: readOnlyAnnotations,
      description:
        'List Lumen components with descriptions, categories, framework availability, collections, ' +
        'and recipes. Filter by framework, recipe, or a natural-language query.',
      inputSchema: z.strictObject({
        framework: z.enum(['astro', 'react', 'elements'])
          .optional()
          .meta({ description: 'Only list components available for this framework.' }),
        query: z.string().trim().min(1)
          .optional()
          .meta({ description: 'Natural-language component or use-case query.' }),
        recipe: z.string().trim().min(1)
          .optional()
          .meta({ description: 'Only list components that belong to this recipe.' })
      }),
      outputSchema: listComponentsOutputSchema
    }, args => toMcpResult(listComponents(args))
  )

  server.registerTool(
    'lumen_get_component', {
      annotations: readOnlyAnnotations,
      description:
        'Get framework-specific Lumen component usage: description, imports, styles, typed props or ' +
        'attributes, examples, guidance, accessibility, events, and optional reference source.',
      inputSchema: z.strictObject({
        detail: z.enum(['summary', 'usage', 'source'])
          .default('usage')
          .meta({
            description: 'summary is compact; usage adds contracts and examples; source adds implementation.'
          }),
        framework: z.enum(['astro', 'react', 'elements'])
          .default('astro')
          .meta({ description: 'Framework contract to return.' }),
        name: z.string().trim().min(1)
          .meta({ description: 'Component name, for example "Button" or "data-table".' })
      }),
      outputSchema: componentOutputSchema
    }, args => toMcpResult(getComponent(args))
  )

  server.registerTool(
    'lumen_list_native_components', {
      annotations: readOnlyAnnotations,
      description:
        'List native Lumen components with platform availability, accessibility, category, and shared contract tier.',
      inputSchema: z.strictObject({
        platform: nativePlatformSchema.optional()
          .meta({ description: 'Only list components available for this native platform.' }),
        query: z.string().trim().min(1).optional()
          .meta({ description: 'Natural-language component or native use-case query.' })
      }),
      outputSchema: listNativeComponentsOutputSchema
    }, args => toMcpResult(listNativeComponents(args))
  )

  server.registerTool(
    'lumen_get_native_component', {
      annotations: readOnlyAnnotations,
      description:
        'Get install steps, imports, setup, API, accessible usage example, and optional reference source for React Native, SwiftUI, or Compose.',
      inputSchema: z.strictObject({
        detail: z.enum(['summary', 'usage', 'source']).default('usage'),
        name: z.string().trim().min(1)
          .meta({ description: 'Native component name, id, export, or symbol.' }),
        platform: nativePlatformSchema
          .meta({ description: 'Native implementation contract to return.' })
      }),
      outputSchema: componentOutputSchema
    }, args => toMcpResult(getNativeComponent(args))
  )

  server.registerTool(
    'lumen_get_recipe', {
      annotations: readOnlyAnnotations,
      description:
        'Get a Lumen recipe or component set with its purpose, categories, components, files, and ' +
        'framework-specific install command.',
      inputSchema: z.strictObject({
        framework: z.enum(['astro', 'react', 'elements'])
          .default('astro')
          .meta({ description: 'Framework used for the install command.' }),
        name: z.string().trim().min(1)
          .meta({ description: 'Recipe name, for example "scheduler" or "advanced-fields".' })
      }),
      outputSchema: recipeOutputSchema
    }, args => toMcpResult(getRecipe(args))
  )

  server.registerTool(
    'lumen_search', {
      annotations: readOnlyAnnotations,
      description:
        'Rank natural-language matches across descriptions, categories, curated collections, ' +
        'framework contracts, props, attributes, recipes, tokens, and agent rules.',
      inputSchema: z.strictObject({
        framework: z.enum(['astro', 'react', 'elements'])
          .optional()
          .meta({ description: 'Only search framework-specific component contracts for this target.' }),
        limit: z.int().min(1).max(100)
          .optional()
          .meta({ description: 'Maximum results to return (1-100, default 20).' }),
        platform: nativePlatformSchema.optional()
          .meta({ description: 'Only search native component contracts for this platform.' }),
        query: z.string().trim().min(1)
          .meta({ description: 'Keyword or natural-language use-case to search for.' })
      }),
      outputSchema: searchOutputSchema
    }, args => toMcpResult(search(args))
  )

  server.registerTool(
    'lumen_get_meta', {
      annotations: readOnlyAnnotations,
      description:
        'Return snapshot provenance: server and package versions, schema version, component count, ' +
        'and a deterministic catalog hash for freshness checks.',
      inputSchema: z.strictObject({}),
      outputSchema: metaOutputSchema
    }, () => toMcpResult(getMeta())
  )

  server.registerTool(
    'lumen_get_catalog_manifest', {
      annotations: readOnlyAnnotations,
      description:
        'Return stable per-component and per-recipe fingerprints that a client can retain for later change detection.',
      inputSchema: z.strictObject({}),
      outputSchema: catalogManifestOutputSchema
    }, () => toMcpResult(getCatalogManifest())
  )

  server.registerTool(
    'lumen_diff_catalog', {
      annotations: readOnlyAnnotations,
      description:
        'Compare a previously retained Lumen catalog manifest with the current snapshot and report added, changed, removed, and unchanged entries.',
      inputSchema: z.strictObject({
        baseline: catalogManifestSchema
          .meta({ description: 'Manifest previously returned by lumen_get_catalog_manifest.' }),
        baselineCatalogHash: z.string().trim().regex(/^[a-f0-9]{64}$/)
          .optional()
          .meta({ description: 'Optional previous catalog hash for a fast unchanged check.' })
      }),
      outputSchema: catalogDiffOutputSchema
    }, args => toMcpResult(diffCatalog(args))
  )

  server.registerTool(
    'lumen_diagnose', {
      annotations: readOnlyAnnotations,
      description:
        'Run deterministic snapshot integrity checks and report web framework and native platform coverage. Useful when testing a new MCP connection.',
      inputSchema: z.strictObject({}),
      outputSchema: diagnosticsOutputSchema
    }, () => toMcpResult(diagnose())
  )

  server.registerTool(
    'lumen_get_tokens', {
      annotations: readOnlyAnnotations,
      description:
        'Return structured Lumen semantic tokens, base color values, glass tokens, and theme attribute.',
      inputSchema: z.strictObject({}),
      outputSchema: tokensOutputSchema
    }, () => toMcpResult(getTokens())
  )

  server.registerTool(
    'lumen_get_rules', {
      annotations: readOnlyAnnotations,
      description:
        'Return the Lumen agent rules for generating, reviewing, or migrating apps that use Lumen.',
      inputSchema: z.strictObject({}),
      outputSchema: rulesOutputSchema
    }, () => toMcpResult(getRules())
  )

  server.registerResource(
    'lumen-meta', 'lumen://meta', {
      description: 'Lumen MCP snapshot provenance and package versions.',
      mimeType: 'application/json'
    }, uri => jsonResource(uri, getMeta().data)
  )

  server.registerResource(
    'lumen-catalog-manifest', 'lumen://catalog-manifest', {
      description: 'Stable component and recipe fingerprints for catalog change detection.',
      mimeType: 'application/json'
    }, uri => jsonResource(uri, getCatalogManifest().data)
  )

  server.registerResource(
    'lumen-release-manifest', 'lumen://release-manifest', {
      description: 'Cross-platform npm, Swift Package Manager, and Maven release coordinates and migration requirements.',
      mimeType: 'application/json'
    }, uri => jsonResource(uri, data.releaseManifest)
  )

  server.registerResource(
    'lumen-diagnostics', 'lumen://diagnostics', {
      description: 'Lumen MCP snapshot integrity checks and framework coverage.',
      mimeType: 'application/json'
    }, uri => jsonResource(uri, diagnose().data)
  )

  server.registerResource(
    'lumen-rules', 'lumen://rules', {
      description: 'Lumen agent rules (llms.txt).',
      mimeType: 'text/markdown'
    }, uri => ({
      contents: [{
        mimeType: 'text/markdown',
        text: getRules().text,
        uri: uri.href
      }]
    })
  )

  server.registerResource(
    'lumen-tokens', 'lumen://tokens', {
      description: 'Structured Lumen design tokens.',
      mimeType: 'application/json'
    }, uri => jsonResource(uri, getTokens().data)
  )

  server.registerResource(
    'lumen-components', 'lumen://components', {
      description: 'Compact structured component catalog.',
      mimeType: 'application/json'
    }, uri => jsonResource(uri, listComponents().data)
  )

  server.registerResource(
    'lumen-native-components', 'lumen://native-components', {
      description: 'Compact structured native component catalog.',
      mimeType: 'application/json'
    }, uri => jsonResource(uri, listNativeComponents().data)
  )

  server.registerResource(
    'lumen-component', new ResourceTemplate('lumen://components/{name}', {
      complete: {
        name: value => data.components
          .map(component => component.name)
          .filter(name => name.toLowerCase().includes(value.toLowerCase()))
          .slice(0, 30)
      },
      list: () => ({
        resources: data.components.map(component => ({
          description: component.description,
          mimeType: 'application/json',
          name: component.name,
          uri: `lumen://components/${component.kebab}`
        }))
      })
    }), {
      description: 'Framework-neutral component metadata and default Astro usage.',
      mimeType: 'application/json'
    }, (uri, variables) => {
      const name = String(variables.name)
      const result = getComponent({ detail: 'usage', framework: 'astro', name })

      return jsonResource(uri, result.data)
    }
  )

  server.registerResource(
    'lumen-native-component', new ResourceTemplate('lumen://native-components/{name}', {
      complete: {
        name: value => data.nativeComponents
          .map(component => component.name)
          .filter(name => name.toLowerCase().includes(value.toLowerCase()))
          .slice(0, 30)
      },
      list: () => ({
        resources: data.nativeComponents.map(component => ({
          description: component.summary,
          mimeType: 'application/json',
          name: component.name,
          uri: `lumen://native-components/${component.id}`
        }))
      })
    }), {
      description: 'Native component metadata and platform usage.',
      mimeType: 'application/json'
    }, (uri, variables) => {
      const name = String(variables.name)

      const component = data.nativeComponents.find(item => (
        item.id === name || item.name === name
      ))

      const platform = component ?
        Object.keys(component.implementations)[0] as 'compose' | 'react-native' | 'swiftui' :
        'react-native'

      const result = getNativeComponent({ detail: 'usage', name, platform })

      return jsonResource(uri, result.data)
    }
  )

  server.registerResource(
    'lumen-recipe', new ResourceTemplate('lumen://recipes/{name}', {
      complete: {
        name: value => data.recipes
          .map(recipe => recipe.name)
          .filter(name => name.includes(value.toLowerCase()))
      },
      list: () => ({
        resources: data.recipes.map(recipe => ({
          description: recipe.description,
          mimeType: 'application/json',
          name: recipe.name,
          uri: `lumen://recipes/${recipe.name}`
        }))
      })
    }), {
      description: 'Lumen recipe metadata and install commands.',
      mimeType: 'application/json'
    }, (uri, variables) => {
      const result = getRecipe({ name: String(variables.name) })

      return jsonResource(uri, result.data)
    }
  )

  return server
}
