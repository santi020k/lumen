# Lumen UI plugin

This directory packages the public `lumen-ui` skill and the published
`@santi020k/lumen-mcp` server for Codex, ChatGPT, and Claude Code.

- `.codex-plugin/plugin.json` contains install-surface metadata.
- `.claude-plugin/plugin.json` contains Claude Code plugin metadata.
- `.mcp.json` starts the published stdio MCP server for local installs.
- `skills/lumen-ui` is a checked snapshot of the canonical `skills/lumen-ui` source.
- `assets` reuses Lumen's public brand artwork.

The public Plugins Directory submission uses the production Streamable HTTP endpoint instead of
the bundled stdio command. Submission copy, test cases, and the release checklist live in
[`docs/openai-plugin-submission.md`](../../docs/openai-plugin-submission.md).

Claude Code users can add this repository as the `lumen` marketplace and install
`lumen-ui@lumen`. The package intentionally resolves `@santi020k/lumen-mcp@latest` so its
read-only public catalog stays current independently of the plugin instructions. See the
[`Claude Code plugin guide`](../../docs/claude-code-plugin.md) for installation, validation, and
community-marketplace submission steps.

Run `pnpm run check:plugin-package` after changing the canonical skill or plugin metadata.
