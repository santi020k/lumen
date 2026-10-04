export const mcpGuideTopics = [
  { href: '/docs/mcp', label: 'Overview', description: 'How the Lumen catalog helps agents discover and use the right components.' },
  { href: '/docs/mcp/clients', label: 'Connect a client', description: 'Install a plugin or copy the configuration for your MCP client.' },
  { href: '/docs/mcp/reference', label: 'Tools and resources', description: 'Explore every tool, browsable resource, and the recommended agent workflow.' }
] as const

export const packageName = '@santi020k/lumen-mcp'
export const npmUrl = 'https://www.npmjs.com/package/@santi020k/lumen-mcp'
export const readmeUrl = 'https://github.com/santi020k/lumen/blob/main/packages/mcp/README.md'
export const pluginUrl = 'https://chatgpt.com/plugins/plugin_asdk_app_6a8f6c526c5481918eb8a48806fa112b'
export const claudePluginGuideUrl = 'https://github.com/santi020k/lumen/blob/main/docs/claude-code-plugin.md'

export const claudePluginInstall = `/plugin marketplace add santi020k/lumen
/plugin install lumen-ui@lumen`

export const tools = [
  ['lumen_check_compatibility', 'Compare resolved installed versions before applying catalog contracts.', 'git-compare-arrows'],
  ['lumen_get_migration', 'Read v4 migration guidance and package-specific review decisions without changing files.', 'scroll-text'],
  [
    'lumen_list_components',
    'List every component with its framework availability and recipe membership. Filter by framework, recipe, or a name query.',
    'list'
  ],
  [
    'lumen_get_component',
    'Return framework-specific imports, styles, props or attributes, examples, accessibility behavior, events, and optional source.',
    'component'
  ],
  [
    'lumen_list_native_components',
    'List native components with React Native, SwiftUI, and Compose availability, accessibility, category, and contract tier.',
    'list'
  ],
  [
    'lumen_get_native_component',
    'Return native install and setup steps, imports, API rows, examples, accessibility guidance, and optional adapter source.',
    'component'
  ],
  [
    'lumen_get_recipe',
    'Return a recipe’s purpose, categories, components, files, and framework-specific install command.',
    'blocks'
  ],
  [
    'lumen_search',
    'Rank natural-language matches across web or native platform contracts, recipes, tokens, and rules.',
    'search'
  ],
  [
    'lumen_get_meta',
    'Return the schema version, package versions, component count, and deterministic catalog hash.',
    'fingerprint'
  ],
  [
    'lumen_get_catalog_manifest',
    'Return stable fingerprints for every web component, native component, and recipe.',
    'notebook-tabs'
  ],
  [
    'lumen_diff_catalog',
    'Compare a retained manifest with the current catalog and identify exactly which entries changed.',
    'git-compare-arrows'
  ],
  [
    'lumen_diagnose',
    'Verify snapshot integrity and report web framework plus native platform coverage.',
    'stethoscope'
  ],
  [
    'lumen_get_tokens',
    'Return semantic token names, base color values, glass tokens, and the theme attribute for generated code.',
    'swatch-book'
  ],
  [
    'lumen_get_rules',
    'Return the Lumen agent rules (llms.txt) to read before producing Lumen code.',
    'scroll-text'
  ]
] as const

export const workflow = [
  ['01', 'Verify the snapshot', 'lumen_get_meta identifies the snapshot and lumen_diagnose verifies web and native coverage.'],
  ['02', 'Check installed versions', 'lumen_check_compatibility compares resolved versions; use installed types when the catalog differs.'],
  ['03', 'Discover', 'The agent lists web or native components, or searches with a target framework or platform.'],
  ['04', 'Read target usage', 'The matching get tool returns installation, setup, imports, API, examples, accessibility, and runtime guidance.'],
  ['05', 'Compose a recipe', 'lumen_get_recipe explains multi-component patterns and gives the correct framework install command.'],
  ['06', 'Track changes', 'Retain lumen://catalog-manifest and compare it after upgrades to refresh only contracts that changed.']
] as const

export const resources = [
  ['lumen://meta', 'Snapshot provenance, package versions, and deterministic catalog hash.'],
  ['lumen://catalog-manifest', 'Stable web, native, and recipe fingerprints for change detection.'],
  ['lumen://diagnostics', 'Snapshot integrity checks and web plus native coverage.'],
  ['lumen://rules', 'Agent generation rules as Markdown.'],
  ['lumen://tokens', 'Structured semantic, color, glass, and theme tokens.'],
  ['lumen://components', 'Compact structured component catalog.'],
  ['lumen://components/{name}', 'One component’s metadata and default Astro usage.'],
  ['lumen://native-components', 'Native component catalog with platform availability.'],
  ['lumen://native-components/{name}', 'One native component’s metadata and platform usage.'],
  ['lumen://recipes/{name}', 'Recipe metadata and framework install commands.']
] as const

export const claudeConfig = `{
  "mcpServers": {
    "lumen": {
      "command": "npx",
      "args": ["-y", "@santi020k/lumen-mcp"]
    }
  }
}`

export const cursorConfig = `{
  "mcpServers": {
    "lumen": {
      "command": "npx",
      "args": ["-y", "@santi020k/lumen-mcp"]
    }
  }
}`

export const codexConfig = `[mcp_servers.lumen]
enabled = true
command = "npx"
args = ["-y", "@santi020k/lumen-mcp"]
startup_timeout_sec = 10.0
tool_timeout_sec = 30.0`

export const genericConfig = `{
  "name": "lumen",
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "@santi020k/lumen-mcp"]
}`

export const httpCommand = `npx -y --package @santi020k/lumen-mcp lumen-mcp-http
# MCP endpoint: http://127.0.0.1:3000/mcp
# Health check: http://127.0.0.1:3000/health
# Default limit: 120 requests per minute`
