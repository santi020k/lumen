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

For the matched scratch/documentation/skill-and-MCP token comparison, use
[the AI efficiency protocol](ai-efficiency.md). Its token totals, repair attempts, and quality
checks are separate from the contract-conformance fixtures below.

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
| `react-content-flow` | Token-owned page gutters and related/group/section spacing, long field labels, hidden Card parts, and preserved edits. |
| `react-appearance-presets` | Default/Studio/Glass in light and dark, keyboard selection, explicit supporting glass, opaque primary content, and preserved edits. |
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

### Visualization guidance readiness, October 4, 2026

The canonical build skill now routes analytics tasks to a dedicated selection reference covering
the existing chart family and the new comparison, histogram, waterfall, calendar heatmap, funnel,
and box plot components. General selection also covers FilterBar, ChangeSummary, and ImageComparison.
The review skill checks encoding, installed availability, specialized input shapes, missing values,
zeros, localization, and accessible exact data. Older installed versions continue to use matching
contracts rather than inheriting candidate APIs.

Generated Codex and Claude skill copies are synchronized. The current MCP snapshot contains 182 web
and 100 native entries; all 33 search cases, 546 web usage contracts, and 237 native usage contracts
pass deterministic end-to-end evaluation. The search cases include older controls and new
visualizations across Astro, React, and Elements. These checks validate discovery and contracts,
not authenticated generation of every chart by every model.

The new GitHub MCP rollout and hosted smoke checks are described in the
[plugin submission guide](openai-plugin-submission.md#automated-catalog-rollout). The v4 approval
contract remains draft. Publication, deployment, directory review, and installed-plugin updates
remain separate from this local preparation.

Plugin 1.1.0 is independent of the coordinated Lumen 4.0.0 library version. Both client manifests
share the plugin version and pin the same v4 MCP package. Publish the package before distributing
the updated plugin. Hosted MCP deployment and directory approval require separate release evidence.
Keep the existing public 1.0.0 publication record intact.

Migration defaults to preview. Only four recognized static SDK paths in `.ts`, `.js`, and `.mjs`
are rewritten by `--apply`; dependency manifests, JSX, Astro, and native code require review.
Reported source signals are review triggers, not proof that an application workaround is obsolete.

## Historical verification, October 3, 2026

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

The reconciled repository gate passed 1,134 unit tests, all type and lint tasks, spelling, unused-code
checks, and the preceding contract gates before stopping at `check:security`: three existing high
advisories in `node-forge`, `http-cache-semantics`, and `braces`. Packed consumer, React Native,
MCP stdio/HTTP, and publish dry-run checks were run separately and passed. The release gate remains
failed; this work does not waive those advisories or authorize publishing.

The skill creator's `quick_validate.py` was attempted with both available Python runtimes and could
not start because PyYAML was unavailable (`ModuleNotFoundError: No module named 'yaml'`). Skill metadata
was inspected, generated skill snapshots matched, and both strict Claude plugin validators passed;
these results do not imply the Python validator passed.

The integrated `lumen migrate v4` command also retains the release's web spacing migrations and
optional coordinated dependency workflow. SDK edits compose into that command's source transform,
so its apply ledger fingerprints the final source and repeat runs do not rewrite spacing twice.
SDK import edits remain limited to `.ts`, `.js`, and `.mjs`; this restriction does not disable the
separate documented JSX/Astro spacing migration. The JSON report includes installed package
versions and explicit SDK dependency-review findings.

## Historical plugin distribution follow-up, October 3, 2026

`pnpm run package:plugin` creates a hosted Codex upload and a Claude archive with the exact npm
catalog pin. Six deterministic plugin tests check schemas, matching skills, distribution transport,
and preservation of existing archives. The public manifest now includes the support URL.

Local marketplace installation and upgrades were checked with both installed CLIs. The prior
`main` revision has a Codex 0.1.0 manifest and a Claude 1.0.0 manifest; each upgraded to 1.1.0.
Fresh 1.1.0 installations also succeeded. Both cached packages contained the same three canonical
skills and the exact `@santi020k/lumen-mcp@4.0.0` pin. Temporary test plugins and marketplaces were
removed afterward. These checks cover local package installation, not public-directory upgrades
or npm catalog startup.

The new agent cases cover semantic content flow and preset switching. Their initial runs exposed
ambiguous heading/region requirements in the prompts, color transitions sampled before settling,
and an actual small-text contrast failure in CardDescription. Prompts now explicitly name those
semantic requirements; the verifier waits for CSS transitions before accessibility scans. Card
descriptions use the secondary text token, with six rendered contrast regressions across Astro,
React, and Elements in every preset and scheme. The complete focused appearance suite passes nine
tests. Matched before/after captures use the same synthetic screen at 390px and 1440px.

Fresh final runs of both new cases passed in Codex and Claude. Their independently verified output
used the public React adapter, passed strict types, kept protected files unchanged, and passed
keyboard/state, responsive, and axe checks. Preset coverage includes every appearance in light and
dark at both viewport sizes. Saved-output rechecks are recorded separately from those fresh runs.
Build, type checking, zero-warning lint, spelling, unused-code checks, clean packed web consumers,
and packed MCP stdio/HTTP smoke tests passed. The canonical repository gate still fails at the
security audit described below.

At that historical checkpoint, the public health endpoint returned `ok`, but MCP initialization still reports server 1.6.0 with
twelve tools, without compatibility or migration discovery. The npm registry returned 404 for
MCP 4.0.0. Release approval remains `draft`, and the repository security audit still reports three
high advisories with no patched versions. Deploy and publish through the approved release workflow
after those gates are resolved; archive creation and local installation do not waive them.
