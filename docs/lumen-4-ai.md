# Lumen 4 AI workflows

The v4 candidate adds version-aware catalog use, portable plugin 1.1.0, migration discovery,
build/review/migration skills, and an optional read-only Claude reviewer. These are local candidate
features until the Lumen 4 package and updated plugin are published through their release workflows.

## Sources and deterministic gates

- `registry/lumen-4-contract.json` generates CLI migration data and the MCP migration contract.
- Root `skills/`, portable `plugins/lumen-ui/plugin.json`, and `mcp.json` generate client wrappers.
- The official portable plugin and MCP JSON schemas are vendored under `scripts/schemas/`, preserving
  their upstream identifiers. AJV validates the portable manifests; mutation tests reject drifting
  client versions, floating catalogs, and unsupported fields.
- MCP schemas validate nested component, recipe, and native usage for every catalog entry and detail
  level. Compatibility checks require exact resolved versions, including native platform packages.
- Search evaluation includes English and Spanish requests, accents, and target platform filters.

```bash
pnpm run check:v4-migration
pnpm run check:plugin-package
pnpm run test:plugin-package
pnpm run check:mcp-evaluation
claude plugin validate plugins/lumen-ui --strict
claude plugin validate . --strict
```

## Actual agent benchmarks

`pnpm run eval:agents` invokes installed Codex and Claude CLIs with the existing authenticated
sessions, serially. It can consume account usage. It runs synthetic local fixtures, leaves agent
transcripts and evidence outside the repository, and never publishes or commits generated fixtures.
Build `core`, `react`, `elements`, `lumen`, and `mcp` before running it.

The older-version fixture requires the extracted official `@santi020k/lumen-react@3.0.1` artifact.
Download that exact npm tarball and verify its registry integrity before supplying its `package`
directory. Do not relabel the current adapter as an older version.

```bash
pnpm run eval:agents --provider codex --older-package /absolute/path/to/react-3.0.1/package
pnpm run eval:agents --provider claude --older-package /absolute/path/to/react-3.0.1/package
```

Use `--case <id>` to run one case and `--output <directory>` to select the evidence directory.
`--verify-only` rechecks saved output without invoking an agent; it is not a new generation result.

| Case | Contract being tested |
| --- | --- |
| `react-dialog` | Public React composition and behavior hooks, focus, Escape, draft persistence, and close action. |
| `elements-spanish-without-mcp` | Spanish request, installed types/README fallback, public registration and dialog behavior. |
| `embedded-sdk-migration` | Known static import migration, preservation of examples, explicit dependency review, strict typecheck. |
| `older-version-review` | Version mismatch, rejection of a fabricated component, installed contract fallback, unchanged application source. |

The host independently checks types in generated code, confirms a public adapter is bundled, and runs
browser assertions at 390px and 1440px. It checks horizontal overflow, runtime errors, accessible
names, keyboard closing, focus restoration, preserved edits, and axe WCAG checks. Screenshots are
verification artifacts. Protected dependency metadata, installed files, configuration, and skill
content are hashed before and after generation. Review output is checked independently of its prose.

These fixtures provide bounded evidence, not a universal quality score. They do not cover every
component, native platform, model, or client version, and automated accessibility checks do not
replace assistive-technology review. Strict plugin validation is separate from published installation
and hosted endpoint evidence. The optional reviewer has a read-only tool allowlist; user-invoked
build and migration skills remain scoped editing workflows.

## Release boundaries

Plugin 1.1.0 is independent of the coordinated Lumen 4.0.0 library version. Both client manifests
share the plugin version and pin the same v4 MCP package. Publish the package before distributing
the updated plugin. Hosted MCP deployment and directory approval require separate release evidence.
Keep the existing public 1.0.0 publication record intact.

Migration defaults to preview. Only four recognized static SDK paths in `.ts`, `.js`, and `.mjs`
are rewritten by `--apply`; dependency manifests, JSX, Astro, and native code require review.
Reported source signals are review triggers, not proof that an application workaround is obsolete.

## Local verification, October 3, 2026

The selected final runs passed all four cases in both clients: Codex CLI 0.159.0-alpha.12.1
(the existing installed client) and Claude Code 2.1.274. Codex's React run used MCP compatibility
and public usage contracts; both final Spanish runs used installed documentation without MCP.
The host supplied an actual CLI migration preview to restricted Claude, which could inspect it
without gaining shell access. Both migration outputs passed strict type checking and preserved the
example comment. Both older-version reviews used the integrity-verified published React 3.0.1
artifact, rejected the fabricated export, and kept application/dependency files unchanged.

Initial runs exposed harness module-resolution problems and two real guidance gaps: an unnamed
internal Elements input and a standalone native dialog replacing Lumen's behavior. The package
README and framework reference now explain visible labels plus `aria-labelledby`, exported element
classes, and the public `lumen-dialog` owner with its native child. Final reruns require that owner
and pass accessible names, focus, persistence, Escape, close actions, axe, and responsive checks.
The migration skill now reads the unfiltered contract before narrowing to packages.

Before/after MCP documentation captures at 390px and 1440px passed overflow checks. Plugin portable
schemas, both strict Claude validators, four plugin mutation tests, exhaustive MCP evaluation,
repository type checking and zero-warning lint passed. These are local results, not publication or
public installation evidence. Account-authenticated benchmarks remain opt-in and separate from CI.
