# Lumen UI plugin

This directory packages the public `lumen-ui` skill and the published
`@santi020k/lumen-mcp` server for local Codex and ChatGPT plugin testing.

- `.codex-plugin/plugin.json` contains install-surface metadata.
- `.mcp.json` starts the published stdio MCP server for local installs.
- `skills/lumen-ui` is a checked snapshot of the canonical `skills/lumen-ui` source.
- `assets` reuses Lumen's public brand artwork.

The public Plugins Directory submission uses the production Streamable HTTP endpoint instead of
the bundled stdio command. Submission copy, test cases, and the release checklist live in
[`docs/openai-plugin-submission.md`](../../docs/openai-plugin-submission.md).

Run `pnpm run check:plugin-package` after changing the canonical skill or plugin metadata.
