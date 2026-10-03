# Lumen UI plugin

This directory packages the public build, review, and migration skills and the published
`@santi020k/lumen-mcp` server for Codex, ChatGPT, and Claude Code.

## Install in ChatGPT or Codex

Open [Lumen UI in the Plugins Directory](https://chatgpt.com/plugins/plugin_asdk_app_6a8f6c526c5481918eb8a48806fa112b)
and select **Install plugin**. Version 1.0.0 was published on September 8, 2026. Mention **@Lumen UI**
in a request or choose a starter prompt to use the bundled skill and hosted, read-only catalog.
No separate Lumen account, API key, or local MCP configuration is required.

## Package contents

- `plugin.json` and `mcp.json` are the canonical portable package manifests (plugin 1.1.0).
- `.codex-plugin/plugin.json` contains install-surface metadata.
- `.claude-plugin/plugin.json` contains Claude Code plugin metadata.
- `.mcp.json` starts the published stdio MCP server for local installs.
- `skills` contains generated snapshots of all three canonical root skills.
- `agents/lumen-reviewer.md` is an optional Claude reviewer with read-only tools.
- `assets` reuses Lumen's public brand artwork.

The public Plugins Directory submission uses the production Streamable HTTP endpoint instead of
the bundled stdio command. Submission copy, test cases, and the release checklist live in
[`docs/openai-plugin-submission.md`](../../docs/openai-plugin-submission.md).

Claude Code users can add this repository as the `lumen` marketplace and install
`lumen-ui@lumen`. The package pins `@santi020k/lumen-mcp@4.0.0` so both clients receive the same catalog contract. Plugin 1.1.0 is a local candidate until Lumen 4 is published and the directory update is approved. See the
[`Claude Code plugin guide`](../../docs/claude-code-plugin.md) for installation, validation, and
community-marketplace submission steps.

Run `pnpm run generate:plugin-package`, then `pnpm run check:plugin-package` after changing canonical skills or portable manifests.
