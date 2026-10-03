# Lumen 4 preparation

This working record tracks the local `release/v4.0.0` candidate. It is not publication or
production qualification evidence. Consumer audits inspect application source; application
data, deployment, and migration remain owned by those projects.

## Consolidation

The release starts from `origin/main` at `3d8af731`. The initial checkout had one worktree,
one local branch, 25 changed or untracked paths, and eight preserved stashes.

| Source | Disposition |
| --- | --- |
| Uncommitted range controls and package guidance | Preserved in `475597ea`; focused React tests, typecheck, and lint passed. Spanish example vocabulary was added to the spelling dictionary. |
| Actions branch `55eb4545` | Integrated pinned Quality setup and CodeQL updates; existing workflow inputs remain valid. |
| Theme branch `e0b94fdb` | Integrated Theme 2.0.1. Lumen uses its unchanged typography and Shiki exports, not the changed application URL contract. |
| Production dependency branch `83006823` | Integrated its history with a compatibility resolution: retain the SDK 57 dependency set listed below. |
| Native stash `1bd14696` | Existing native APIs, catalogs, playgrounds, and release tooling already incorporate the intended work. |
| Native/docs stash `568bef0a` | Native components are incorporated. Keep the enhanced documentation-owned framework example instead of adding a duplicate library component. Replace old showcase prototypes with fresh captures. |
| Snippet/metadata stash `e701c8a2` | Recover QR code tag naming, framework snippet cleanup, and runtime metadata with regression coverage. Evaluate button sizes through current consumer audits. Existing Card/Stat and Badge composition supersede the metric/status prototypes. |
| Icon stash `a2f7a905` | Icon dimensions and filled brand rendering are incorporated. Do not restore temporary configuration or obsolete screenshots. |
| Package-manager stash `212d3eed` | Superseded pnpm 10 fields; root pnpm 12.6.0 remains authoritative. |
| Scroll/miscellaneous stash `65a70d72` | Scroll cue examples and tooling changes are incorporated. |
| Motion stashes `9b41b959`, `33c190f4` | Identical snapshots; intended motion components and options are incorporated. Preserve both originals. |

The production dependency branch changes every package in the pinned Expo set without updating
Expo itself. Installed Expo 57.0.25 metadata and the
[official SDK compatibility table](https://docs.expo.dev/versions/latest/#each-expo-sdk-version-depends-on-a-react-native-version)
confirm React/React DOM 19.2.3, React Native 0.86.3, datetimepicker 9.1.0,
safe-area-context ~5.7.0, and SVG 15.15.4. Keep matching React 19.2 types and test-renderer 1.2.0.
Updating this set requires a coordinated SDK migration and native validation; v4 component work
does not require that migration.

The live compatibility check also identified compatible SDK 57 patches: Expo 57.0.26 and
expo-updates 57.0.24. Their official release notes document no new Expo user-facing behavior and
an embedded-asset hash fix, respectively. Updated only those catalog entries and their lockfile
graph; `expo install --check` then passed using live metadata.

### Initial checks

The post-merge `pnpm run validate` completed generation/platform checks and the full build,
then stopped at the shared CSS size budget after inclusion of the two range controls.
Separately, `pnpm run typecheck` passed all 23 tasks and `pnpm run test` passed 703 tests in
64 files. HTTP fixture tests require loopback access; their sandbox-only permission
failures were rerun successfully with that access. Recovered snippet/runtime changes passed
69 focused tests and zero-warning lint. The final candidate results below supersede this initial
consolidation checkpoint.

## Consumer audit and implementation

Twenty dedicated consumer audits are complete. The [consumer decision record](lumen-4-consumer-audit.md)
identifies the source evidence and disposition for every project. Consumer repositories remain
unchanged; older installed APIs are not treated as missing library features.

The integrated implementation includes strict localized dates and range drafts; controlled manual
server sorting; explicit dialog dismissal and focus restoration; collision-aware chart labels,
formatter-aware margins and consistent mixed-chart coordinates; native chart axes and continuous
Compose time geometry; stable loading geometry; localized clipboard recovery; normal navigation
Tab order; native hidden semantics; responsive OTP rows; richer Prose styling; and ImageComparison
across all three web adapters. Native slider, chart, symbol-selection and row composition examples
are documented and checked against their actual APIs.

A fresh independent review identified image-comparison reset consistency, cancellation of date
resets, and mixed-chart Y alignment. Each finding was accepted and corrected with regression
coverage. Browser-triggered reset checks also established that synchronization must happen after
the native reset default action, with canceled resets and disconnected controls preserved.

The final candidate review also identified incomplete v4 approval validation. The corrected gate
requires attribution, a valid date, a decision record and exact-revision evidence; both publication
workflows enforce it. The reviewer independently passed 55 contract, revision and workflow tests
and confirmed that no actionable findings remain. The v4 contract is still a draft.

Fifteen published projects now have fresh anonymous desktop and phone captures, with exact
[capture provenance](showcase-captures.json). The homepage and community gallery share one data
source. Removed 24 superseded, unreferenced image assets. KinJar remains a development consumer;
private Cartera and Observatory data are excluded. These are deployed-design examples, not v4
consumer qualification.

### Bundle accounting

The v3 shared CSS was 172,643 bytes raw and 28,330 bytes at gzip level 9. Range calendars, comparison
frames, complete prose semantics and the shared visual corrections bring v4 to approximately
183 KB raw / 30 KB gzip. The reviewed budgets are 186 KB / 31 KB. Astro runtime source moves from
160,090 bytes to approximately 165 KB for date localization, reset, theme and clipboard handling;
its raw budget is 167 KB and its existing 33 KB gzip ceiling is retained. React components have
approximately 163 KB raw / 33.5 KB gzip after the new contracts; the ceilings are 166 KB / 34 KB.
A separate 2 KB raw / 900-byte gzip budget covers the new image-comparison controller. Existing
hook, Elements and other controller budgets remain enforced. No new production dependency was
added for these component improvements.

Generated catalogs, registries and public API snapshots are reviewed alongside implementation.
Six intentional Swift initializer replacements are recorded against immutable `v3.0.1`; consumers
must rebuild. The changed native baselines restart the two-iteration stability qualification;
historical consumer/device evidence is preserved without being relabeled as v4 proof.

All ten public npm packages, Compose and Wear are prepared at `4.0.0`; the Swift release manifest
targets `v4.0.0`. Changesets have been consumed into package changelogs and the registry, MCP
snapshot, documentation versions and critical styles have been regenerated. No tag has been
created and no package or application has been published.

### Candidate verification

- `pnpm run test`: 843 tests across 76 files passed.
- `pnpm run typecheck` and `pnpm run lint`: all 23 tasks passed, with zero lint warnings.
- `pnpm run lint:spell`: 1,286 files checked without spelling issues.
- `LUMEN_A11Y_PORT=4337 pnpm run test:a11y`: all 460 browser checks passed, including the
  community gallery at 320, 768 and 1,440 pixels.
- `pnpm run test:framework-conformance`: all 84 React and Elements checks passed across
  desktop/mobile Chromium and WebKit, including English and Spanish consumer fixtures.
- `swift test`: 49 tests passed. Swift API snapshots and the six intentional source-compatibility
  changes passed checks against `v3.0.1`.
- `cd packages/compose && ./gradlew test lint apiCheck`: 99 tasks completed successfully.
- Packed-package checks passed for Core, umbrella, Astro, React, React Hook Form, Elements,
  Next.js integration, brand icons, React Native, and MCP stdio/HTTP consumers. Publish dry runs
  checked all ten public npm packages without publishing them.
- MCP evaluation passed 12 search cases, 486 web contracts, 200 native contracts and 162 framework
  examples. Bundle budgets, registry synchronization and API classifications passed.
- Desktop/phone captures were inspected for the gallery, homepage, reporting, charts, prose and
  comparison component. Gallery and homepage images decoded successfully without broken sources.
  Chart and comparison checks include light and dark themes; overflowing chart detail remains an
  intentionally scrollable, keyboard-accessible region with a data-table alternative.

### Remaining release blockers

The canonical `pnpm run validate` on committed candidate `e16ba750` passed generation, build,
contracts, types, tests, lint, spelling and registry checks, then stopped at the production
dependency audit. The full gate is **not green**.
Compatible updates to `fast-uri` 3.1.8, `ip-address` 10.7.3 and `brace-expansion` 5.0.12 removed ten
advisories. A frozen install, Expo compatibility check and 72 MCP tests passed after those updates.
Three high-severity advisories have no published patched release as of October 3, 2026:

| Dependency | Path and upstream advisory |
| --- | --- |
| `node-forge` 1.4.0 | Expo CLI signing and certificate tooling; [signature verification advisory](https://github.com/advisories/GHSA-86w9-cpqp-85rv). |
| `http-cache-semantics` 4.2.0 | Astro remote-image build cache; [cache disclosure advisory](https://github.com/advisories/GHSA-ch52-4w7c-c8xp). |
| `braces` 3.0.3 | Metro/micromatch build tooling; [nested pattern advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). |

Current compatible parent releases still depend on these packages. Reachability observations do
not waive the security gate. No advisory exclusions, vendored replacements or audit suppressions
were added. Update to verified upstream fixes when available and rerun the complete validation.

The v4 contract also remains a draft without publication approval. The changed native baseline
has zero of two required stability iterations; historical device and consumer records do not
qualify this v4 revision. Complete those external qualification gates and approve the final
revision before initiating the existing GitHub and Xcode Cloud release workflows.

## Design references

- [Tremor charts](https://www.tremor.so/docs/visualizations/area-chart): restrained axes, legible
  legends, and consistent data colors as visual references.
- [Recharts sizing](https://recharts.github.io/en-US/guide/sizes/): container-driven dimensions
  as a responsive behavior reference.
- [React Spectrum range picker](https://react-spectrum.adobe.com/v3/DateRangePicker.html):
  internationalized range selection and accessible labeling as interaction references.

Use these references to assess Lumen's own implementation. Preserve dependency-free web chart
rendering and semantic Lumen tokens unless actual consumer evidence requires a different design.

## Validation and release boundaries

- Run the canonical `pnpm run validate` after consolidation and again on the final candidate.
- Run focused behavioral and adversarial tests while implementing; verify representative rendered
  desktop/mobile layouts, keyboard interaction, light/dark themes, and accessible feedback.
- Update registry, MCP snapshot, reviewed public API baselines, examples, and migration guidance
  together. Use the existing generators for generated outputs.
- Capture only public consumer pages or local synthetic fixtures for the documentation showcase.
  Record the source URL, capture date, viewport, and actual adapter evidence.
- Keep completed work committed and integrated into `release/v4.0.0`. No remote push, release,
  package publication, application deployment, or production mutation is part of this local task.
- Prepare major Changesets and forward migration guidance. Publication uses the repository's
  GitHub workflow after separate release authorization; no local tags or manual publication.
- Rollback before publication means retaining the released v3 packages. After publication, fix
  regressions with a new version; never move a published tag or rewrite consumer data.
