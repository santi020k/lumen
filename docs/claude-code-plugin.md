# Claude Code Plugin

Lumen UI is packaged as a Claude Code plugin that combines the portable build, review, and migration skills with the
public, read-only Lumen MCP catalog. The plugin source lives in
[`plugins/lumen-ui`](../plugins/lumen-ui), and this repository publishes its marketplace catalog
from [`.claude-plugin/marketplace.json`](../.claude-plugin/marketplace.json).

Official references:

- [Create Claude Code plugins](https://code.claude.com/docs/en/plugins)
- [Create and distribute a plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces)
- [Discover and install plugins](https://code.claude.com/docs/en/discover-plugins)

## Install from the Lumen repository

Add the repository marketplace, then install the plugin:

```text
/plugin marketplace add santi020k/lumen
/plugin install lumen-ui@lumen
```

Run `/reload-plugins` if Claude Code asks you to activate the new plugin. The bundled skill is
namespaced as `/lumen-ui:lumen-ui`; Claude can also invoke it automatically when a request matches
its description.

Plugin 1.1.0 pins `@santi020k/lumen-mcp@4.0.0` through `npx`, matching the Codex package. This is
an unpublished v4 candidate: the pinned server must be published before distributing this plugin.
Call `lumen_check_compatibility` with resolved installed package versions before using catalog
contracts. On a mismatch, use installed public types and README or a matching catalog; never upgrade
an application implicitly.

Use `/lumen-ui:lumen-review` for audits and `/lumen-ui:lumen-migrate` for an explicitly requested
upgrade. The optional `lumen-ui:lumen-reviewer` agent has only Read, Glob, Grep, and Lumen MCP tools.
It cannot edit files or run shell commands. There are no hooks.

## Validate before publishing

Run the repository package check and Claude Code's strict validators:

```bash
pnpm run check:plugin-package
claude plugin validate plugins/lumen-ui --strict
claude plugin validate . --strict
```

Then load the package directly for a session and verify the skill and MCP tools before updating the
public marketplace:

```bash
claude --plugin-dir ./plugins/lumen-ui
```

`pnpm run package:plugin` also creates `dist/plugins/lumen-ui-1.1.0-claude.zip` for a clean
installation fixture. Test a fresh install and an upgrade using a temporary local marketplace
and `--scope local`, then verify all three cached skills and the exact MCP pin. Remove only that
test installation and marketplace after verification. A successful cache install does not prove
that the pinned npm server can start before its publication.

Confirm that the plugin lists the `lumen-ui` skill, starts the `lumen` MCP server, and can call
`lumen_diagnose`, `lumen_search`, and one web or native component retrieval tool. The server must
remain read-only and must not request credentials or private repository data.

## Community marketplace submission

The self-hosted `lumen` marketplace is available as soon as this repository revision is public.
Anthropic's reviewed third-party directory is the `claude-community` marketplace, which users add
separately. Before submitting Lumen UI:

1. Run both strict validators against the public revision.
2. Test installation from `santi020k/lumen`, not only with `--plugin-dir`.
3. Verify that the plugin disclosure shows three skills, one read-only MCP server, and one optional read-only reviewer,
   with no hooks or LSP servers. Build and migration skills edit only within the user-authorized scope.
4. Submit the public repository through Anthropic's plugin submission form.
5. Describe the plugin as community-submitted or under review until it appears in the public
   `claude-community` catalog.

Submission, marketplace review, commits, and pushes change external state and are not performed by
the repository validation command.
