# AI UI efficiency evaluation

Lumen is designed to reduce repetitive UI code and unnecessary AI context. This protocol tests that
goal instead of assuming that components, a shorter prompt, or MCP must save tokens. It is separate
from [agent contract-conformance evaluations](lumen-4-ai.md).

## Scope and controls

`scripts/evaluate-ai-efficiency.mjs` now compares four tasks: the original React profile dialog and
notification preferences, a larger React workspace settings screen with combined member filters,
and notification preferences using actual Lumen Elements inside the same React host. The Elements
trial measures that adapter integration; it is not an Astro, native, or framework-free application
benchmark. Each task has three approaches:

1. `scratch`: React, native HTML controls, and agent-written CSS.
2. `docs`: public Lumen React components, installed declarations, and the package README.
3. `skill-mcp`: the same target adapter and documentation plus the portable skill and local MCP catalog.

The product requirements, synthetic data, React runtime, viewport sizes, verification, and repair
allowance stay the same. Styles for the Lumen approaches come from the library; scratch supplies its
own styles. Dependency installation is performed by the host and excluded from generation. Agents
write only `Screen.tsx` and `Screen.css`; the host provides typed CSS imports and owns compilation.

Pin model and reasoning effort explicitly. The report records CLI version, Git revision, and hashes
of the harness, verifier, catalog, and skill. Each run starts in a fresh directory and CLI session.
Rotate the approach order across repetitions and tasks. The default is three repetitions per task
and approach: 36 runs. Each allows an initial attempt and at most one repair in a fresh session with
the failed output and verifier feedback. Both attempts count toward usage and time.

The Git revision identifies the checkout base. A local candidate can include uncommitted changes;
the recorded source hashes identify the measured files. Keep the saved harness with the evidence,
and distinguish this candidate from a published package or final release commit.

Existing authenticated CLI access is required. Invocations ignore user configuration and use the
workspace-write sandbox; credentials remain in the existing CLI store. Shared client/system context
can still contribute to usage. Fresh directories do not guarantee cold provider caches. Do not
describe these runs as a bare-model API benchmark or a universal cold-cache comparison.

## Run locally

Follow [contributor setup](../CONTRIBUTING.md), install Chromium for Playwright if absent, and build
the local React , Elements and MCP packages. This is opt-in work that consumes account usage; do not add live
agent invocations to ordinary CI.

```bash
pnpm install --frozen-lockfile
pnpm --filter @santi020k/lumen-react... run build
pnpm --filter @santi020k/lumen-elements... run build
pnpm --filter @santi020k/lumen-mcp run build
pnpm exec playwright install chromium
pnpm run test:ai-efficiency
pnpm run test:ai-efficiency:browser
pnpm run eval:ai-efficiency --model <model-id> --effort <reasoning-effort> \
  --repetitions 3 --output /absolute/path/outside-the-repository
```

Use a new evidence directory. The runner refuses an existing nonempty directory or a destination
inside the repository. It never commits, deploys, or uploads evidence. An invocation has a ten-minute
limit, followed by termination. A missing final usage event stays unavailable rather than becoming
zero. A report with failed cases produces a nonzero exit; keep those cases in the results.

```bash
pnpm run eval:ai-efficiency --verify-only --output /path/to/saved/evidence
```

This only rechecks saved implementations. It neither reruns generation nor changes the recorded
usage. If the harness was corrected, label previous runs diagnostic, preserve their evidence, and
start a complete new matrix. Never pool runs from different verifier versions as one comparison.

## Measurements

The runner reads completed-turn usage from `codex exec --json`:

- `inputTokens`: all reported input, including prompts, read files, tool context, and cached input.
- `cachedInputTokens`: a subset of input, reported separately and never added twice.
- `outputTokens`: reported output from every attempt.
- `totalTokens`: input plus output across initial and repair attempts.
- `toolCalls`: completed command, MCP, and file-change events; this is a client event count.
- `durationMs`: agent invocation plus local verification time, excluding fixture installation.
- `status`, `attempts`, and `diagnostic`: retain every outcome, including failed or unmeasured runs.

Per-task/approach summaries show medians, run counts, pass counts, and total workload tokens. Missing
usage invalidates the complete group token aggregate. It is not acceptable to drop failed runs,
use output tokens alone, or calculate a savings percentage from only the cheapest attempt.
Token totals are not billing: cached input, output, reasoning, subscriptions, and rates depend on
the provider. Consult its usage semantics before translating a result into cost.
Elapsed time on a shared development machine can include competing local work. Report that condition
and do not interpret those durations as an isolated speed benchmark.

The parser follows the [Codex non-interactive event format](https://learn.chatgpt.com/docs/non-interactive-mode)
and the principle of measuring usage alongside deterministic checks in
[OpenAI's skill evaluation guide](https://developers.openai.com/blog/eval-skills).

## Independent quality checks

The host, rather than the agent's final prose, determines success. It checks strict TypeScript,
forbidden explicit `any`, the assigned library approach, runtime errors, meaningful headings and
labels, responsive overflow, and axe WCAG 2.2 AA-related rules at 390px and 1440px. The dialog adds
initial focus, forward/reverse focus containment, Escape and button dismissal, focus restoration,
and edit preservation. Settings adds keyboard disclosure, preserved edits, and save feedback.
Screenshots are retained for visual inspection. Protected fixture files are hashed before and after
generation. The browser regression also verifies the actual public React guide example and its CSS
import, so a missing harness declaration cannot masquerade as an agent failure.

These checks do not establish comprehensive accessibility, visual design quality, performance, or
production readiness. Keep human visual and assistive-technology review separate. The published October 4 sample
is small and covers two React tasks, one client/model per run, and local candidate packages; it cannot
establish every framework, native adapter, competitor, or production workflow.

## Publication boundary

Publish sanitized per-run usage, all outcomes, summaries, prompts, exact model/client/revision,
source hashes, and limitations together. Raw authenticated client transcripts and stderr remain
local and must be inspected for sensitive information before sharing. Do not commit them.

```bash
pnpm run report:ai-efficiency --input /path/to/evidence/results.json \
  --output /path/to/new-public-results.json
```

The exporter requires a complete matrix with at least three repetitions, retains failed and
unmeasured outcomes, validates attempt accounting, and recomputes summaries. It removes local
diagnostics and excludes raw transcripts. The original evidence and an existing output file are
never overwritten. Inspect the exported prompts and provenance before sharing the file.

The October 4 comparison also publishes a source archive alongside its JSON report. It preserves
the measured harness, verifier, token parser, stylesheet, and MCP catalog with their original hashes,
so later formatting or library changes do not erase that evidence. Raw client transcripts are excluded.

A measured result must identify the compared approach and task. If the skill/MCP approach costs
more context on a small task, state that result. Changes in source length are not token savings.
Follow [marketing claim C-15 and C-16](marketing/STRATEGY.md); the landing page does not promise a
percentage, a lower bill, or fewer corrections without evidence for that exact claim.

## Expanded evaluation provenance

New runs use report schema 2 and a four-task matrix. Scenario definitions are centralized in
`scripts/lib/ai-efficiency-scenarios.mjs` and hashed alongside the harness/verifier. Both adapter
distribution trees are hashed, including imported modules. The public exporter retains schema 1
support for the original two-task reports and rejects missing/duplicate runs in either matrix.
Do not pool the expanded protocol with the published October 4 experiment or overwrite its report
and source archive. No new token-saving result follows merely from adding these fixtures.

The workspace verifier checks case-insensitive search combined with role filtering, empty/recovery
states and retained preference edits. The Elements verifier requires real upgraded custom controls
for the field and both named actions; native-only substitutes fail. Browser regressions include
working implementations and deliberately broken combined filters or adapter substitutions.
The host registers Input and Button once for the Elements trial. Scratch still receives native
HTML/React instructions and no component package; the shared product requirements remain equal.
