# @santi020k/lumen-mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server for the Lumen
multi-framework primitive UI system. It gives AI agents structured access to
components, real framework contracts, recipes, design tokens, accessibility
behavior, runtime events, and Lumen's generation rules.

The published server ships a self-contained catalog snapshot, so consumers do
not need a checkout of the Lumen repository.

## Tools

| Tool | Purpose |
| --- | --- |
| `lumen_list_components` | List components with descriptions, categories, framework availability, collections, and recipe membership. Filter by `framework`, `recipe`, or natural-language `query`. |
| `lumen_get_component` | Get a component for `astro`, `react`, or `elements` at `summary`, `usage`, or `source` detail. Usage includes imports, styles, props or attributes, examples, accessibility, guidance, and events. |
| `lumen_get_recipe` | Get a recipe or component set with its purpose, components, files, categories, and framework-specific install command. |
| `lumen_search` | Rank tolerant natural-language matches across component descriptions, curated collections, framework contracts, props, attributes, recipes, tokens, and agent rules. Optionally filter component contracts by framework. |
| `lumen_get_meta` | Return deterministic snapshot provenance, package versions, schema version, component count, and catalog hash. |
| `lumen_get_catalog_manifest` | Return stable per-component and per-recipe fingerprints that clients can retain between upgrades. |
| `lumen_diff_catalog` | Compare a retained manifest with the current snapshot and report added, changed, removed, and unchanged entries. |
| `lumen_diagnose` | Verify snapshot integrity and report framework coverage when testing a connection. |
| `lumen_get_tokens` | Return semantic token names, base colors, glass tokens, and the theme attribute. |
| `lumen_get_rules` | Return the Lumen agent rules from `llms.txt`. |

Every tool returns both readable text and validated `structuredContent`.

## Resources

| Resource | Contents |
| --- | --- |
| `lumen://meta` | Snapshot provenance, package versions, and deterministic catalog hash. |
| `lumen://catalog-manifest` | Stable component and recipe fingerprints for change detection. |
| `lumen://diagnostics` | Snapshot integrity results and framework coverage. |
| `lumen://rules` | Agent rules as Markdown. |
| `lumen://tokens` | Structured design tokens. |
| `lumen://components` | Compact component catalog. |
| `lumen://components/{name}` | Component metadata and default Astro usage. |
| `lumen://recipes/{name}` | Recipe metadata and install commands. |

## Install and connect

The stdio command for any MCP client is:

```bash
npx -y @santi020k/lumen-mcp
```

Node.js 20.20 or newer is supported.

### Codex

Register it from the Codex CLI:

```bash
codex mcp add lumen -- npx -y @santi020k/lumen-mcp
codex mcp list
```

Or add a project-scoped `.codex/config.toml`:

```toml
[mcp_servers.lumen]
enabled = true
command = "npx"
args = ["-y", "@santi020k/lumen-mcp"]
startup_timeout_sec = 10.0
tool_timeout_sec = 30.0
```

Start or resume a Codex task after changing MCP configuration so the new tools
are loaded.

### Claude Desktop

Add this server to `claude_desktop_config.json`:

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

Add this server to `.cursor/mcp.json`:

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

### Any stdio MCP client

Use the equivalent of this generic configuration:

```json
{
  "name": "lumen",
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "@santi020k/lumen-mcp"]
}
```

Client configuration envelopes differ, but the command and arguments remain
the same.

### Streamable HTTP

For local network clients or a self-hosted deployment, start the included
Streamable HTTP transport:

```bash
npx -y --package @santi020k/lumen-mcp lumen-mcp-http
```

It binds to `127.0.0.1:3000` by default and exposes MCP at
`http://127.0.0.1:3000/mcp` plus a health check at `/health`. Configure it with
`LUMEN_MCP_HOST`, `LUMEN_MCP_PORT`, and a comma-separated
`LUMEN_MCP_ALLOWED_HOSTS`. Binding to a public interface requires the
deployment's authentication, TLS, rate limiting, and host allowlist; the
package does not provide those infrastructure controls.

## Recommended agent workflow

1. Read `lumen://meta` and call `lumen_diagnose` to identify and verify the bundled snapshot.
2. Read `lumen://rules`.
3. Call `lumen_search` with the requested use case and target framework.
4. Call `lumen_get_component` with `detail: "usage"`.
5. Follow the returned framework behavior section: mount Astro `UIPrimitives` once, use the named React hook/controller, or register custom elements once.
6. Inspect a related recipe with `lumen_get_recipe` when the UI needs multiple primitives.
7. Request `detail: "source"` only when the usage contract is insufficient.
8. Use `lumen_get_tokens` before adding custom styling.
9. Cache `lumen://catalog-manifest`; after an upgrade, pass it to `lumen_diff_catalog` to refresh only changed contracts.

Example calls:

```json
{ "name": "lumen_search", "arguments": { "query": "accessible date input", "framework": "react", "limit": 5 } }
```

```json
{
  "name": "lumen_get_component",
  "arguments": {
    "name": "DateRangePicker",
    "framework": "react",
    "detail": "usage"
  }
}
```

```json
{
  "name": "lumen_get_recipe",
  "arguments": {
    "name": "advanced-fields",
    "framework": "react"
  }
}
```

## Local repository usage

This repository includes a project-scoped Codex configuration that launches:

```bash
pnpm --filter @santi020k/lumen-mcp local
```

The local launcher builds the MCP package when `dist` is missing or older than
the TypeScript source, then starts the server without writing build logs to the
MCP stdout channel.

Useful development commands:

```bash
pnpm --filter @santi020k/lumen-mcp generate
pnpm --filter @santi020k/lumen-mcp build
pnpm --filter @santi020k/lumen-mcp test
pnpm --filter @santi020k/lumen-mcp test:coverage
pnpm --filter @santi020k/lumen-mcp check:snapshot
pnpm --filter @santi020k/lumen-mcp eval
pnpm --filter @santi020k/lumen-mcp smoke:package
```

## Programmatic use

The reusable handlers return readable text plus typed data:

```ts
import {
  getComponent,
  getMeta,
  getRecipe,
  search
} from '@santi020k/lumen-mcp/tools'

const matches = search({ limit: 5, query: 'date input' }).data.results
const snapshot = getMeta().data.meta

const component = getComponent({
  detail: 'usage',
  framework: 'react',
  name: 'DateRangePicker'
}).data.component

const recipe = getRecipe({
  framework: 'react',
  name: 'advanced-fields'
}).data.recipe
```

You can also embed the server:

```ts
import { createLumenServer } from '@santi020k/lumen-mcp'

const server = createLumenServer()
```

## Snapshot generation

`scripts/generate-data.mjs` builds `data/lumen-data.json` from:

- The shared component catalog and registry metadata.
- Astro and React component declarations.
- The Web Component definition registry.
- Documentation examples, API rows, guidance, keyboard interactions, and runtime events.
- Design tokens, recipes, `docs/ai-usage.md`, and `llms.txt`.

The output is deterministic and carries the package version used by the MCP
initialization response. It also includes every framework package version, a
schema version, and a SHA-256 catalog hash. CI regenerates the snapshot and
fails when the committed file is stale. The release group versions the MCP
alongside Lumen framework packages, and the package smoke test installs the
packed artifact into a temporary consumer project before making a real stdio
handshake.

The evaluation gate also runs a curated natural-language search benchmark,
calls every available component/framework contract through MCP, parses all
Astro and custom-element examples, and type-checks every React example against
the built React package. A generated example that is syntactically valid but
uses an unsupported React prop therefore fails before release.

## License

MIT © Santiago Molina
