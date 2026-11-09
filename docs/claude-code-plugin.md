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

After the intended marketplace revision and its pinned MCP package are public, add the repository
marketplace and install the plugin:

```text
/plugin marketplace add santi020k/lumen
/plugin install lumen-ui@lumen
```

Run `/reload-plugins` if Claude Code asks you to activate the new plugin. The bundled skill is
namespaced as `/lumen-ui:lumen-ui`; Claude can also invoke it automatically when a request matches
its description.

Plugin 1.1.0 pins `@santi020k/lumen-mcp@5.1.0` through `npx`, matching the Codex package. Plugin
distribution requires the pinned MCP package and matching marketplace revision to be public. The
ChatGPT/Codex directory update and Anthropic's reviewed marketplace have separate approval steps;
those approvals are not required for a local development install. The 1.1.0 package in this release
checkout is a candidate, not evidence that a marketplace install serves v5.
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

### Automatic directory source updates

Anthropic's scanner downloads the whole GitHub source repository. The standalone
[`santi020k/lumen-claude-plugin`](https://github.com/santi020k/lumen-claude-plugin) repository is a
generated mirror for the directory. Keep its `main` branch dedicated to the generated plugin.

The **Sync Claude plugin** workflow runs after **Release** publishes a stable Lumen release on
`main`. It exports the tagged Claude plugin, checks the exact MCP pin against npm, and pushes
only changed plugin contents. The first sync uses the source plugin version. Later syncs use a
newer source version when available and otherwise increment the mirror's patch version. Each
mirror commit names the source Lumen tag. Rerun the workflow from `main` to sync the latest stable
release after a setup or delivery failure.

For one-time setup, create the empty public mirror repository with `main` as its default branch.
Add a write-enabled deploy key restricted to that repository. Store its private key in the dedicated
**Lumen Claude Plugin** Infisical project at `prod:/claude-plugin` as `CLAUDE_PLUGIN_DEPLOY_KEY`. Configure
`INFISICAL_CLAUDE_PLUGIN_IDENTITY_ID` for an OIDC identity restricted to this workflow on Lumen
`main`, with a viewer role in that dedicated project. Set the
`INFISICAL_CLAUDE_PLUGIN_PROJECT_SLUG` repository variable to its slug. Keep this project limited
to the mirror credential.

After the first sync, submit the mirror's repository root in
[Anthropic's developer portal](https://claude.ai/directory/manage) and track `main`. Scheduled
checks pick up later pushes automatically. The initial submission requires the publisher's
compliance acknowledgements. Anthropic controls security review and whether an approved version
can publish automatically. See the [directory submission guide](https://claude.com/docs/plugins/submit).
