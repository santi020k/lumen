# Lumen UI for Claude

Lumen UI is packaged as a Claude Code plugin that combines the portable build, review, and migration skills with the
public, read-only Lumen MCP catalog. The plugin source lives in
[`plugins/lumen-ui`](../plugins/lumen-ui), and this repository publishes its marketplace catalog
from [`.claude-plugin/marketplace.json`](../.claude-plugin/marketplace.json).

Official references:

- [Create Claude Code plugins](https://code.claude.com/docs/en/plugins)
- [Create and distribute a plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces)
- [Discover and install plugins](https://code.claude.com/docs/en/discover-plugins)

## Connect from the Claude directory

In Claude, open **Customize → Connectors** and search for **Lumen UI**. Open its listing and add
the connector. If the listing is unavailable in your directory, choose **Add → Custom → Web**,
name it **Lumen UI**, and enter `https://mcp.lumen.santi020k.com/mcp`. Select **No sign-in**
when Claude detects authentication.

The connector exposes the public, read-only component catalog over HTTPS without a separate Lumen
account, API key, or local server installation.

Try asking Claude to:

- Find the right Lumen components for an accessible React settings screen.
- Show the SwiftUI Button contract and its accessibility guidance.
- Explain the public Lumen v5 migration guidance for a React application.

The hosted connector receives catalog queries and tool arguments to return public documentation.
Keep credentials, personal data, and private source out of those arguments. See the
[Lumen privacy policy](https://lumen.santi020k.com/privacy).

The repository plugin described below bundles build, review, and migration skills for Claude Code.
The hosted connector supplies catalog tools. Its directory listing and the plugin bundle have
separate publication and review states.

## Install from the Lumen repository

Add the repository marketplace and install the plugin:

```text
/plugin marketplace add santi020k/lumen
/plugin install lumen-ui@lumen
```

Run `/reload-plugins` if Claude Code asks you to activate the new plugin. The bundled skill is
namespaced as `/lumen-ui:lumen-ui`; Claude can also invoke it automatically when a request matches
its description.

The repository plugin starts its exact MCP package version locally through `npx`. Read
[`plugins/lumen-ui/.mcp.json`](../plugins/lumen-ui/.mcp.json) for the current pin. Node.js 20.20 or
newer is required.
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

## Directory publication

The hosted connector and the generated plugin bundle are separate Anthropic submissions. The
connector dashboard shows Published. Check the public directory separately before promoting a
direct listing URL. The installation steps above include a custom connector fallback.
Track plugin bundle review in [Anthropic’s developer portal](https://claude.ai/directory/manage)
before describing that bundle as published.

Before publishing a plugin update, run the strict validators and test its installation from the
public source. Confirm that it exposes three skills, one read-only MCP server, and one optional
read-only reviewer. Build and migration skills edit only within the user-authorized scope.

### Automatic directory source updates

Anthropic's scanner downloads the whole GitHub source repository. The standalone
[`santi020k/lumen-claude-plugin`](https://github.com/santi020k/lumen-claude-plugin) repository is a
generated mirror for the directory. Keep its `main` branch dedicated to the generated plugin.

The **Sync Claude plugin** workflow runs after **Release** publishes a stable Lumen release on
`main`. It exports the tagged Claude plugin with the public HTTPS MCP and directory-compatible assets
and agent metadata, then pushes only changed plugin contents. The original marketplace keeps its
pinned local MCP. The directory mirror sends catalog queries to the hosted service under the
[Lumen privacy policy](https://lumen.santi020k.com/privacy). Anthropic reviews that hosted service
through a separate [connector submission](https://claude.com/docs/connectors/building/submission).

The first sync uses the source plugin version. Later syncs use a newer source version when
available and otherwise increment the mirror's patch version. Each mirror commit names the source
Lumen tag. Rerun the workflow from `main` to sync the latest stable release after a setup or delivery
failure.

For one-time setup, create the empty public mirror repository with `main` as its default branch.
Add a write-enabled deploy key restricted to that repository. Store its private key in the dedicated
**Lumen Claude Plugin** Infisical project at `prod:/claude-plugin` as `CLAUDE_PLUGIN_DEPLOY_KEY`. Configure
`INFISICAL_CLAUDE_PLUGIN_IDENTITY_ID` for the GitHub Actions OIDC identity and give it a viewer role
in the dedicated project. Lumen uses the shared `github-actions-secrets` identity, whose existing
OIDC trust covers repositories owned by `santi020k`. Set the
`INFISICAL_CLAUDE_PLUGIN_PROJECT_SLUG` repository variable to the dedicated project's slug and keep
that project limited to the mirror credential.

After the first sync, submit the mirror's repository root in
[Anthropic's developer portal](https://claude.ai/directory/manage) and track `main`. Scheduled
checks pick up later pushes automatically. The initial submission requires the publisher's
compliance acknowledgements. Anthropic controls security review and whether an approved version
can publish automatically. See the [directory submission guide](https://claude.com/docs/plugins/submit).
