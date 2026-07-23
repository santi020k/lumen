# @santi020k/lumen-mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server for the Lumen
multi-framework primitive UI system. It lets AI agents (Claude Desktop, Cursor,
and other MCP clients) discover Lumen components, read their real source and
props, and follow Lumen's design tokens and agent rules while generating code.

The server ships a self-contained snapshot of the component catalog, so it works
without a checkout of the Lumen repository.

## Tools

| Tool | Purpose |
| --- | --- |
| `lumen_list_components` | List components with framework availability (Astro / React / Web Components) and recipe membership. Filter by `framework`, `recipe`, or a name `query`. |
| `lumen_get_component` | Get one component's typed props, framework availability, recipes, and the real Astro reference source. Accepts PascalCase (`DataTable`) or kebab-case (`data-table`). |
| `lumen_search` | Search across components, props, recipes, tokens, and agent rules by keyword or use-case. |
| `lumen_get_tokens` | Return semantic token names, base color values, glass tokens, and the theme attribute. |
| `lumen_get_rules` | Return the Lumen agent rules (`llms.txt`) to read before producing Lumen code. |

## Usage

Run directly with npx:

```bash
npx -y @santi020k/lumen-mcp
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "lumen": {
      "command": "npx",
      "args": ["-y", "@santi020k/lumen-mcp"]
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "lumen": {
      "command": "npx",
      "args": ["-y", "@santi020k/lumen-mcp"]
    }
  }
}
```

## How it works

The bundled `data/lumen-data.json` is generated at build time by
`scripts/generate-data.mjs`, which reads the authoritative sources in the
monorepo (`packages/core/src/components.ts`, the Astro component files,
`packages/core/src/tokens.ts`, `registry/lumen.registry.json`, and `llms.txt`).
Regenerate it with:

```bash
pnpm --filter @santi020k/lumen-mcp run generate
```

## Programmatic use

The tool handlers are exported for embedding in other servers or tests:

```ts
import { getComponent } from '@santi020k/lumen-mcp/tools'

getComponent({ name: 'button' }).text
```

## License

MIT © Santiago Molina
