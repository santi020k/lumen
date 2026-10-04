# Lumen 4 preparation

This working record tracks the local `release/v4.0.0` candidate. It is not publication or
production qualification evidence. Consumer audits inspect application source; application
data, deployment, and migration remain owned by those projects.

## Release preparation checkpoint — October 4

The isolated `chore/v4-release-preparation` branch combines consolidation `79e6b066`, native and
web quality integration `a775f1cd`, live iOS renderer/bundle corrections `bd40105d`, and explicit
Astro parser resolution `cb31915d`. It preserves all existing checkouts and historical stashes.
The selected `release/v4.0.0` integration branch remains at `50990a22` while the security gate fails.

All pending Changesets were processed through the installed generator in an isolated metadata
workspace and folded into the ten existing, unpublished `4.0.0` changelogs. This prevents unintended
`5.0.0`, `4.1.0`, and `4.0.1` releases. The duplicate Core heading was consolidated; earlier published
entries and package versions remain unchanged. New stabilization notes are reconciled into the same
candidate. The publication scope still resolves all ten unpublished npm packages.

Manual release-canary dispatch now skips the pull-request comparison fetch. Its regression executes
the actual classification command with empty pull-request references and verifies every canary
surface and all ten npm packages. The workflow/classifier suites pass 40 checks; this is local
workflow validation, not an Actions run.

Browser stabilization corrected Safari popup dismissal: pointer activation now focuses the trigger
so Escape reaches the disclosure, while canceled clicks retain application control. Mounted tests
cover an already focused external control, menu focus, nested dismissal, and both anchored and
application-positioned panels. Desktop/mobile Chromium and WebKit conformance passes all 136 checks.
Desktop and phone dashboard screenshots were inspected. The preview's record-details sentence also
retains its space before the client name.

The exact-version React Native renderer patch is combined with the approved Forge and Braces
patches. Frozen-lockfile installation passes without weakening the release-age policy. The renderer's
source-build and simulator evidence remains in [native quality](lumen-4-native-quality.md#local-renderer-correction-and-bundle-gate-follow-up);
this preparation run does not relabel it as physical-device qualification. The React and Elements
bundles retain their public contracts after artifact reductions.

### Current verification and remaining gates

Canonical `pnpm run validate` passes build, strict types, 1,442 tests in 137 files, zero-warning lint,
spelling, Knip, registry checks and all nine security guard tests. It stops at the remaining high
`http-cache-semantics` advisory. After the parser integration, a fresh frozen install and all 23 lint
tasks pass again. Local Swift tests pass all 68 cases; Compose `test lint apiCheck` completes all 99
tasks. These native sources are unchanged by the final renderer and web integration.

The final web artifacts pass all 1,526 accessibility/responsive checks and all 136 framework
conformance checks. Publish dry runs validate all ten package contents; clean Core, umbrella, Astro,
React, React Hook Form, Elements, Next.js and brand-icon consumers pass. The packed React Native
consumer passes install, peer, contents and strict types, and packed MCP consumers pass both stdio
and Streamable HTTP. These post-security checks were run separately because the canonical gate
stops at the advisory. A metadata comparison against `79e6b066` confirms unchanged published
changelog history, ten public versions at `4.0.0`, one v4 entry per package and no pending Changesets.

| Gate | Current evidence | Required next action |
| --- | --- | --- |
| Security | Forge and Braces patches verified; cache advisory still fails | Preserve the 24-hour hold. After October 4, 21:56:05 Colombia time, resolve the age-eligible cache dependency and rerun the guarded audit and canonical gate. See [dependency review](lumen-4-dependencies.md#cache-advisory-correction) for why version metadata alone is not proof of a behavior fix. |
| Native stability | Zero of two iterations; seven current baseline hashes | Align the old pre-2.0-only checker with the approved v4 qualification policy, then collect two distinct iterations with immutable artifact and consumer evidence. Local checks do not count automatically. |
| Real native consumers | All five adapter records remain incomplete | Verify the final candidate in React Native, SwiftUI, Compose, WidgetKit and Wear consumers and record exact revisions and permanent proof. |
| Physical devices | All 22 minimum/current slots remain incomplete | Complete the documented interaction, accessibility, text-scale and state checks on the required hardware. |
| Approval and publication | V4 contract remains draft; no remote release action | Resolve the qualification gates, review the final revision, record explicit approval, and use the GitHub release workflow. |

The pending qualification decision is whether v4 uses published prerelease artifacts or explicitly
approved local candidate builds for its two iterations. Published candidates retain the existing
published-artifact evidence requirement and are the recommended route. The current checker accepts
only ordinary versions below 2.0, so neither option can be called complete without an intentional
contract update. No exception or evidence was invented during preparation.

### Release execution and recovery

After the security gate passes, merge the validated preparation branch into a clean, idle
`release/v4.0.0` worktree and rerun the merged-candidate checks. Before an authorized first push,
obtain the required fresh independent review against `main` and resolve every finding. Prepare the
`release/v4.0.0` to `main` pull request with the coordinated versions, changelogs, and
[v4 migration guidance](migrating-to-lumen.md#migrating-from-version-3-to-version-4). Remote pushes,
PR creation, merges, publication and deployment remain separately authorized actions.

GitHub Actions must create the immutable release tag and coordinate publication from the merged
commit. Apple build/distribution belongs in Xcode Cloud. Verify published package provenance,
clean consumers, native artifact revisions and deployed smoke checks before retiring the branch.
If release automation fails, diagnose and rerun it. Never replace a published tag or republish an
existing version. A regression after publication requires a corrective version; affected consumers
can restore their previously tested dependency lockfile and application revision together. Restore
source-level API usage with the dependency version, preserve consumer data, and rebuild native apps
when their linked artifacts change. No data migration or production data mutation is part of this
candidate preparation.

## October 3 complete branch consolidation candidate

The owner subsequently approved raising the combined stylesheet budget. The new 220,000-byte
raw / 36,000-byte gzip limits pass. Dependency investigation, tested patch options, the disputed
cache advisory, and the release-age blocker are recorded in
[the dependency review](lumen-4-dependencies.md#consolidation-security-investigation).
The owner approved exact-version Forge and Braces patches with integrity and behavior checks.
The guarded audit now accepts only those two verified patched findings. The remaining integration
blocker is `http-cache-semantics` 4.2.0: the normal 24-hour hold prevents installing 4.3.0 until
October 4 at 21:56 Colombia time (October 5 at 02:56 UTC). No release-age exception was applied.

With both patches installed, `pnpm install --frozen-lockfile` passes and `pnpm run validate`
passes the 14-task build, bundle limits, web/native consistency checks, 23-task strict typecheck,
1,434 tests, zero-warning lint, spelling, Knip, registry checks, and all nine security guard tests.
It then fails only on the unmitigated high cache advisory. The package dry run, clean-consumer
smoke tests, React Native package checks, and MCP stdio/HTTP package smoke tests also pass when
run separately. This records a validated patch candidate with an incomplete release gate, not a
fully qualified release. The raw audit still reports all three original package versions.

The isolated `chore/v4-consolidation` candidate through `fdcfab80` starts from the selected
`release/v4.0.0` at `50990a22`. The release branch has not advanced: the combined candidate is
committed and reviewable, but the security gate still fails. Local integration
requires resolving those failures or an explicit owner-approved exception. Nothing was pushed,
published, or deployed.

Git ancestry checks after refreshing remote refs confirm containment of every local branch,
every fetched remote branch, and all 21 worktree heads at the final inventory. Completed source
tips include dashboard composition (`cedf45a2`, `ac3da775`), dashboard improvements (`1a50a05f`),
data visualization (`55a1032f`), native parity (`7b0cb3ae`), native quality (`b6dbe7ea`), playground
appearances (`d8aa397f`), and playground discovery (`653524fe`). Work added by other tasks after
this inventory is outside this snapshot.

The two remaining dirty source checkouts are preserved in place. The dashboard checkout's
pending data-view URL, editor initialization, and form-reset changes are already represented
by `bd11bc02` and its stronger typing, reset cancellation, and external-form handling. Its form
changeset is also present with corrected native value-setter terminology. All ten pending
documentation images and all 428 routes from the older image manifest are present in the
regenerated 448-route manifest. All eight historical stashes and all original branches and
checkouts remain preserved.

Merge resolutions retain chart datum activation together with axis formatters, explicit domains,
reference overlays, accessible tables, and dashboard composition. Scatter-chart hit targets
remain usable at plot boundaries without exposing off-plot data. The combined native API and
web API inventories retain reviewed classifications; MCP data, native stability hashes, registry
data, and social assets were regenerated. Closed native disclosure contents are correctly
excluded from the visible-focus test scan. Android toast timing now honors accessible reading
time and cancels stale recommendations after updates or removal.

Validation of the combined code passed the 14-task build, 23-task strict typecheck, zero-warning
lint, 1,434 tests in 136 files, 45 browser checks, 68 Swift tests, and Compose `test lint apiCheck`.
The six chart-activation browser checks passed again after the final React formatting change.
Web/native contracts and API checks, Knip, spelling, registry/MCP/plugin consistency, package
dry runs, consumer package checks, React Native package checks, and MCP stdio/HTTP smoke checks
also passed. Desktop and mobile homepage screenshots compare the original release with the
candidate; playground and chart pages were inspected at both widths. Native evidence schema
checks do not establish device or store qualification; the stability ledger still has zero of
two required iterations.

Before the approved budget increase, `pnpm run validate` passed its prerequisite checks and build, then stopped at
`check:bundle-size`: `packages/lumen/styles.css` is 213,671 bytes raw and 34,856 bytes gzip,
against unchanged combined limits of 208,000 and 34,000. Other measured bundles pass. At that point, running
`pnpm run check:security` separately reported three high advisories:
[node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv),
[http-cache-semantics](https://github.com/advisories/GHSA-ch52-4w7c-c8xp), and
[braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
The audit identifies `http-cache-semantics >=4.3.0` as patched, but the subsequent source and
behavior review above does not support calling this a demonstrated behavior fix;
the other two have no patched version listed. No budgets, audit exclusions, or dependency
overrides were weakened to make these gates pass.

## October 3 quality audit

The audit branch starts from release candidate `50990a22`. It corrects the local Figma Code Connect
types, removes duplicate declarations and unsafe double assertions, and includes those templates
in both canonical and affected type checks. Elements test fixtures now require missing nodes to
fail explicitly instead of using non-null assertions; generic custom-event payloads use `unknown`.

React uses its supported React 19 context API. Toast rendering and its context now live in separate
modules, removing the mixed-export and declaration-order exceptions while preserving public exports.
The extracted toast modules remain included in the original hooks bundle budget. Small controller,
theme-builder, registry and documentation refactors remove unnecessary complexity, formatting and
nested-conditional suppressions. The Next.js smoke app's type check now depends on its own build,
preventing simultaneous tasks from overwriting generated route types.

The explicit TypeScript `any` syntax scan found no occurrences in 391 TypeScript files.
The same eleven-file diagnostic scan with inline ESLint exceptions disabled fell from 365 to 66
diagnostics: 60 complexity findings and six existing React composition/state exceptions. Those
remaining exceptions are still maintenance work; this audit does not claim every suppression was
removed. No lint rule was weakened and no new suppression was added.

Local verification passed:

- Canonical zero-warning lint and type checks, including the Figma templates.
- The full 120-file, 1,315-test suite, including two mounted React toast regressions; subsequent
  Elements and React fixture checks passed 394 tests.
- All 128 desktop/mobile Chromium and WebKit framework conformance checks.
- All 87 website interaction and dark-theme accessibility checks, plus three focused browser
  regressions after the final DataTable sorting refactor.
- An uncached combined Next.js build/typecheck and the affected build/typecheck/lint/test pipeline
  against `50990a22`.
- API baselines, generated MCP/plugin/registry checks, spelling, unused-code checks, publish dry-run
  and packed consumer, React Native and MCP smoke checks. The reviewed DialogClose fingerprint was
  regenerated after its equivalent React context implementation changed.

The exhaustive `pnpm run validate` still fails `pnpm run check:bundle-size` on inherited limits:
shared CSS is 199.7 KiB raw / 32.4 KiB gzip against 199.2 / 32.2 KiB, React components are
168.0 / 34.7 KiB against 167.0 / 34.2 KiB, and Elements gzip is 44.4 KiB against 43.9 KiB.
The ceilings remain unchanged. Later validation commands were run separately to expose additional
failures; that diagnostic run is not a passing exhaustive gate.

`pnpm run check:security` reports three high advisories:
[`node-forge`](https://github.com/advisories/GHSA-86w9-cpqp-85rv),
[`braces`](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) and
[`http-cache-semantics`](https://github.com/advisories/GHSA-ch52-4w7c-c8xp). The first two have no patched
release at audit time. The npm registry lists `http-cache-semantics` 4.3.0 as patched, published at
02:56 UTC on October 4; an isolated install confirms the repository's 24-hour release-age policy
rejects it with `ERR_PNPM_NO_MATURE_MATCHING_VERSION`. No dependency, exception or age policy changed.

Local integration into `release/v4.0.0` remains blocked by these failing gates. The focused audit work
is preserved on `fix/quality-audit`; nothing was pushed, published or deployed. Next steps are to
reduce the oversized bundles, update the patched dependency after its release-age window, resolve
the two remaining upstream advisories, rerun the exhaustive gate and integrate the verified commit.
Native evidence here is limited to repository checks and package tests, not new device qualification.

## October 3 pending-work integration

The release checkout's pending form reset, rich-text initialization and data-view URL fixes are
preserved in `bd11bc02`. The combined candidate through `99f26f18` contains the original branch
tips for Compose additions (`1150318d`), native parity (`9bd736b3`), native quality (`3cb972ce`),
mobile playground discovery (`edbe036d`), plugin readiness (`74dc0480`), input and interaction
hardening (`dcbb1c03`), dashboard compounds (`059aae9c`) and charts (`84c85353`).

Merge resolutions regenerate the MCP snapshot, combine native catalogs without duplicating the
shared ImageComparison entry, preserve both interaction suites, align registry order with Core,
and generate social assets for the newly integrated documentation routes. Compose uses the
installed Material adaptive V2 window-info API to remove the deprecated call.

Local combined validation passed the build, all 23 typecheck tasks, zero-warning lint, 1,313 tests, 128 browser
conformance checks across desktop/mobile Chromium and WebKit, 58 Swift tests, and web/native API,
playground catalog, stability-evidence structure, registry, MCP and plugin consistency checks.
The exhaustive `pnpm run validate` stopped at the unchanged bundle budgets: CSS measures
199.7 KiB raw / 32.4 KiB gzip against 199.2 / 32.2 KiB; React components measure 168.1 / 34.7 KiB
against 167.0 / 34.2 KiB; Elements gzip measures 44.4 KiB against 43.9 KiB. These results do not
establish publication or device qualification.

Six fully contained, clean, idle local branches were deleted: community feedback, Compose
additions, theme presets, mobile playgrounds, plugin readiness and Antigravity hardening.
Their detached checkouts and ignored files remain preserved. Dashboard composition and
improvements, chart follow-up, native parity and quality, and newly started playground work
remain owned by running chats. Their unfinished changes were not committed or discarded by this
consolidation. All eight original stashes and remote branches remain preserved. Nothing was
pushed, published or deployed.

## Latest local integration

The October 3 consolidation through `7dc2b358` contains all committed local branch tips:
community feedback (`6646a842`), native quality (`efa3e53a`), appearance presets (`f3a3b512`),
AI workflows (`7dc2b358`), and release improvements (`e9c8426e`). Git ancestry also confirms
containment of `main`, every fetched remote branch, and the detached worktree commits.
Active checkouts, uncommitted work and stashes remain preserved.

The combined v4 migration keeps layout and SDK edits in one source transform and apply ledger.
Conflict resolutions retain appearance metadata, migration review signals, both validation
extensions and all release notes. Dependency notes reference the unchanged `4.0.0` candidate.
Earlier pending-integration statements below describe historical task snapshots; their committed
work is now integrated locally. The release security gate still reports three high dependency
advisories. No remote push, package publication, deployment or release approval occurred.

## Migration and web release improvements

The v4 CLI adds `lumen migrate v3` and `lumen migrate v4`, with previews by default and optional
coordinated pnpm dependency updates. V3 does not invent web rewrites; v4 preserves literal layout
gaps and records output fingerprints to prevent repeated spacing rewrites. Both report native and
application-owned review boundaries. The versioned migration guides and website describe those paths.

Inherited RTL arrows now follow visual direction in tabs, calendars and horizontal pane resizing
across web adapters; pointer resizing follows the same direction. Native sliders keep browser behavior.
VirtualList adds optional bounded data rendering with stable keys, scroll extent, focus retention,
and shared Astro/Elements lifecycle control. Mounted mode remains the default. The mobile docs scope
selector leaves enough room for the complete active link.

The scoped Changeset was consumed through the configured generator in a scratch workspace, and its
notes were folded into the unpublished 4.0.0 changelogs. Public versions and prior release history
remain unchanged. These improvements do not replace the security, approval or native qualification
gates documented below.

## October 3 branch consolidation

The release checkout's pending component, phone, flag, and documentation work is preserved in
`d8119066`. The combined candidate through `b2463284` contains the completed content-flow,
documentation-example, Compose-control, component-behavior, and native-quality histories,
including the later Elements Toast example and static native graphics entrypoint commits.
Git ancestry checks confirmed containment of every original development branch.

Integration fixes preserve the normalized `PhoneNumber.value` when adapting adjacent React
`PhoneInput` examples, declare the existing jsdom catalog dependency for documentation tests,
and reconcile generated MCP data, native API inventories, and stability-baseline hashes.

The fully merged local branches `feature/content-flow`, `docs/component-examples`,
`fix/v4-component-behavior`, and `feature/compose-v4-fields` were deleted after checking their
checkouts were clean and their tips were contained in the release. Their detached checkouts and
ignored files remain available. Stashes and remote branches are preserved. Branches owned by
active chats remain in place; new work created during consolidation is outside this snapshot.

Local Swift testing passed 52 tests. Compose `test lint apiCheck` passed with the installed JDK 21
and Android SDK. These checks do not establish physical-device, store, or publication readiness.
The combined build, 23-task type check, 1,109 tests, zero-warning lint, and spelling checks passed.
The existing production-dependency audit still reports three high-severity advisories without
patched releases (`node-forge`, `http-cache-semantics`, and `braces`), so the exhaustive release
gate remains blocked. Consolidation and branch cleanup are local; nothing was pushed or published.

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
| Package-manager stash `212d3eed` | Superseded pnpm 10 fields; the dependency refresh now aligns the workspace on pnpm 12.8.1. |
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

### Previous candidate verification

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

### Header and dependency refresh

The documentation header and scope navigation now use Lumen's enhanced Select, retaining native
fallbacks. The header uses separate, consistent controls, visible keyboard focus, menus that remain visible,
and 44-pixel options. Family and mode remain synchronized across navigation, reloads, denied storage,
and failed writes. Shared Select now names its listbox, supports Space activation and search with spaces, and dismisses when keyboard focus leaves the component.

The [dependency inventory](lumen-4-dependencies.md) records registry-verified upgrades, compatible
holds, removals, and official references. Removed unused MDX support, redundant root Next and React DOM
declarations, the monolithic MCP SDK, and nine obsolete overrides. The split MCP v2 integration
preserves stdio, HTTP, and Worker wire contracts; programmatic consumers must use v2 SDK objects.
Seven development security findings were resolved. Public package Node requirements are unchanged;
the private workspace now declares the runtime range its existing tooling actually supports.

Lucide adds four interface icons, with synchronized web/native generation and reviewed additive
Swift and Compose API baselines. Swift source compatibility verifies exactly ten reviewed v4
diagnostics against `v3.0.1`: six initializer replacements and four icon enum additions. Exhaustive
icon switches must handle the new cases. The native stability ledger still has zero completed iterations.

Two independent review findings were accepted: preserve the session preference after a failed
storage write, and dismiss Select when focus leaves. Regression coverage verifies both. Final source
review found no remaining actionable UI, MCP, or dependency implementation issues.

Final verification uses an isolated copy of this task's changes because unrelated virtual-list,
editor, and documentation-layout work is active in the shared checkout. No unrelated work is removed
or claimed as verified by this refresh.

The refreshed candidate passed 850 unit tests, 488 browser checks, all 84 desktop/mobile React and
Elements conformance checks, 49 Swift tests, and 53 Compose plus three Wear tests. Type checking and
zero-warning lint passed all 23 tasks. Spelling checked 1,289 files without issues; unused-dependency,
registry, bundle, and API checks passed. Packed consumers, including the upgraded Astro/Next/React
fixtures and MCP stdio/HTTP transports, passed without publishing. The local Worker integration and
MCP's 75 tests passed. The complete gate still stops at the three unpatched dependency advisories.

The dependency refresh also exposed a React reset-timer lint diagnostic. A single scheduled update
now batches reset events and is explicitly canceled during cleanup; tests cover mixed cancellation
orders and unmounting. The approved follow-up Changesets were consumed through a scratch run of
the configured generator, preserving all ten public versions at `4.0.0` and all previous release
history. Changesets belonging to other active work are preserved for that work's integration.

### Existing component follow-up

VirtualList now shares fixed-height DOM windowing across Astro, React and Elements. Inert spacers
preserve scroll extent; row and container changes refresh the range; focused rows and neighbors
remain available for native Tab navigation. Rows remain mounted, so this does not eliminate initial
DOM creation cost. Range endpoints are inclusive and empty lists use endIndex -1.

RichTextEditor emits a cancelable command request before execution. External engines can own that
request, and React also accepts a synchronous commandHandler. Failed engine commands do not fall
back to the browser; completion events remain notifications. Native toolbar-state synchronization
can be disabled when the engine owns it. NumberField retains its native input contract because the
consumer evidence does not justify a shared locale-aware draft parser.

The scoped Changeset was consumed through a scratch run of the configured Changesets generator
and its generated notes were folded into the existing unpublished 4.0.0 entries. Package versions
and previous changelog history remain unchanged. The React list and editor behavior have focused
modules with separate bundle budgets; existing budgets were preserved.

Verification: 862 tests in the isolated component checkout and six Chromium regressions passed,
including desktop/phone
scroll extent, container resizing, Tab navigation, retained focus and external command ownership.
Matched synthetic before/after screenshots were inspected at 390 and 1440 pixels. The isolated
component builds, types, zero-warning lint, bundle checks, Knip and registry checks passed. The
canonical validation remains blocked by the three existing high-severity dependency advisories
listed below. Local integration into release/v4.0.0 remains pending because its checkout contains
active concurrent work; the focused component commit is preserved on fix/v4-component-behavior.

### Editable Combobox and nested dismissal

Combobox now keeps DOM focus in its editable input and exposes the active choice through
aria-activedescendant. Arrow navigation skips disabled DOM options; ordinary editing keys,
composition and canceled keyboard events remain owned by the input or application. Enter commits
only an active option in an open list. Astro and Elements share a controller that observes changing
options and delegates pointer selection. React follows changing option props and reports committed
selection through onChange for controlled forms.

Nested disclosures, Select and Combobox consume their own Escape before an enclosing popup or
dialog dismisses. Parent handlers honor canceled events, and disclosure navigation leaves text
editing alone. Regression tests reproduce the old failures and cover phone/desktop behavior,
composition, changing options, controlled values, nested dismissal and focus restoration.

The Astro interaction suite passed 65 checks; the React/Elements conformance suite passed all 100
checks across desktop/mobile Chromium and WebKit. Conformance used the canonical configuration
with a temporary longer server-start timeout under concurrent local build load. The cohesive
React Combobox module and shared DOM controller have separate measured budgets; all existing
budget ceilings remain unchanged. Generated Changeset notes are folded into the unpublished
4.0.0 entries, preserving package versions and previous history.

The full suite passed 881 tests in 82 files. Type checking and zero-warning lint passed all
23 tasks; spelling checked 1,302 files without issues. Generation, API, MCP, registry and unused
code checks passed. Packed Core, umbrella, React, React Hook Form, Elements, Astro, Next.js and
brand-icon consumers passed. The dependency audit still reports the same three high-severity
advisories below, so the release gate remains blocked. Local integration is pending while the
release checkout contains active concurrent work.

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

## International phone input refinement

The v4 phone controls share offline flag artwork across Astro, React, Elements, React Native,
SwiftUI and Compose. The selector and number input use one frame with an internal divider,
consistent padding, hover and focus feedback, and disabled/read-only behavior. Web adapters expose
input attributes, associated validation and form-reset behavior without consumer DOM patches.
Public country flags and read-only phone views replace application-specific flag overlays.

Cartera currently consumes Lumen 2.1.0 and adds its own SVG overlays and phone-input attribute
patches. Its migration requires a v4 dependency update and replacing those wrappers with the public
phone API. This library task does not update or deploy Fenix/Cartera.

Local verification includes the full 896-test JavaScript suite, 23 type-check tasks, packed web,
React Native and MCP consumers, 49 Swift tests, Swift public API builds on all five Apple targets,
and Compose tests, lint and public API checks. Web visual checks cover desktop/mobile, light/dark,
field sizes, keyboard focus, selector hover, pasted international numbers and validation feedback.
Phone input availability follows each adapter's existing platform support; this is not a claim of
editable phone fields on watchOS or tvOS. Physical-device visual verification and the two native
stability iterations remain pending.

Phone release notes are folded into the unpublished 4.0.0 changelogs. A focused local phone commit
is pending explicit commit authorization required by AGENTS.md; no phone publication or remote
integration has been performed. Final release validation must include the security gate and all
concurrently integrated v4 work.

The latest canonical lint passed all 23 tasks and spell checking found no issues. The read-only
network security audit still reports the three dependency advisories listed above, so full
`pnpm run validate` cannot be declared passing. No audit suppression was added.

## Appearance preset implementation

Default, Studio and Glass appearances now come from the canonical token document. Studio uses
PostLens's neutral palette as a reference; explicit glass remains limited to selected supporting
surfaces. The theme playground includes radius, spacing and border controls and an illustrative
photo workspace. Web adapters share scoped tokens and exportable appearance values. SwiftUI,
React Native and Compose expose preset palettes and native appearance customization.

Local verification passes 1,134 JavaScript tests, type checking, build, zero-warning lint,
spelling, three preset browser regressions, 53 Swift tests and Compose tests, lint and binary
API checks. Apple API inventories were rebuilt for macOS, iOS, tvOS, visionOS and watchOS.
Desktop and mobile screenshots were inspected in light and dark. Native API changes restart
the two-iteration stability period; no physical-device qualification is claimed.

The full `pnpm run validate` gate currently stops at `check:security`: three pre-existing high
advisories in node-forge, http-cache-semantics and braces, with no patched versions reported by
the audit. The appearance branch uses the current release lockfile without dependency changes.
Release integration remains blocked rather than bypassing that gate. No packages were published
and no remote branch was pushed.

### Native advanced-input parity

The v4 candidate adds NumberField, TimeField, Autocomplete, PasswordField, InputOTP and
ImageComparison to React Native and SwiftUI, alongside the existing Compose controls. The combined native
registry now contains 69 shared contracts and 23 platform-specific contracts. Number fields retain
localized drafts with exact bounded decimal stepping; time values use same-day hour/minute models.
Filtering, requests, authentication, persistence and submission validation remain application-owned.
The native patterns guide includes a form-error summary recipe with application-owned editor focus.

Core and React Native verification covers 330 tests, including exact stepping beyond floating-point
precision, bounded paste and parsing, secure-entry reset, autocomplete selection/dismissal and
confirmed time selection with stale callback rejection. The Swift suite covers 58 LumenUI tests
and three WidgetKit tests; the Apple playground builds, and the reviewed Swift API builds for all
five Apple targets. Both playgrounds expose the six additions with English/Spanish and read-only
examples. Twelve React Native web captures at 390 and 1280 pixels were inspected, with browser
checks for number stepping, localization, autocomplete and password reveal/blur.

This evidence does not qualify physical-device keyboard, autofill, VoiceOver or TalkBack behavior.
Native device evidence and two stability-soak iterations remain required. Release integration and
the canonical validation result must be recorded before claiming completion; dependency security
still reports the three existing high advisories with no patched versions.

The isolated parity candidate is preserved in commit `7a170606` on
`feature/native-v4-parity`. Its canonical `pnpm run validate` passes the monorepo build, types,
1,201 tests, zero-warning lint, spelling, Knip and registry checks, then stops at the three existing
high dependency advisories (`node-forge`, `http-cache-semantics` and `braces`; no patched versions).
The implementation and this initial verification record are contained in `release/v4.0.0` through
integration commit `40bf424e`. The simulator follow-up in `67684a73` still requires integration.
The validation result above describes the isolated candidate, not the subsequently combined release.
Do not treat simulator evidence as device qualification or release approval.

Native simulator follow-up: the Apple `AdvancedInputTests` pass four Release-mode UI tests on a
dedicated iPhone 17 Pro simulator running iOS 26.5. They confirm number stepping, Spanish draft
reset, native autocomplete selection and password masking after disabling and re-enabling. Six
control-layout captures and three interaction-state captures were inspected. The Apple capture
script now includes the six controls by default. This is simulator evidence; physical-device
qualification and minimum-OS coverage remain pending.

The run uses `LumenApplePlaygroundPerformance` with
`-only-testing:LumenApplePlaygroundUITests/AdvancedInputTests` and signing disabled. Xcode emits
`Metadata extraction skipped, no AppIntents.framework dependency found` from its metadata tool;
the app does not expose App Intents. No production dependency was added to hide that tool warning.

The simulator follow-up was refreshed against integration `10d25bd9`: 364 Core/React Native tests,
strict native and playground types, 58 LumenUI tests plus three WidgetKit tests, and all four native
UI tests pass on the combined code. Native registry, CLI registry, API baseline and playground
catalog checks pass. The combined registry contains 69 shared and 23 platform-specific contracts.

Its canonical validation stops at existing combined-web bundle budgets: umbrella CSS is 199.7 KiB
raw / 32.4 KiB gzip against 199.2 / 32.2 KiB; React components are 168.1 / 34.7 KiB against
167.0 / 34.2 KiB; Elements definition gzip is 44.4 KiB against 43.9 KiB. The diff of this follow-up
against the release contains only Apple tests, the synthetic demo, its capture script and
verification documentation. No production web CSS or JavaScript was changed by the follow-up.
Budget limits remain unchanged, and the three unpatched security advisories remain open.

On that combined candidate, all 1,313 repository tests and 23 type-check tasks pass. All 23 lint
tasks pass with zero warnings; spelling, Knip and registry checks pass as well. The MCP HTTP tests
require loopback permission and passed when rerun outside the restricted filesystem/network sandbox.
The canonical gate remains failed at the bundle checks above; these separate checks do not clear it.

## Dashboard composition integration preparation

The dashboard composition work is committed on `feature/dashboard-composition` through `cedf45a2`.
It adds attachment previews and lists, PageHeader/SectionHeader registry recipes, and datum actions
for BarChart, LineChart, PieChart, ScatterChart, ComboChart, Heatmap, and RangeChart across Astro,
React, and Elements. The earlier dialog and rich Descriptions work is already contained in the
release history. Application navigation, requests, file ownership, and financial rules remain
outside the primitives.

An isolated integration branch combines this work with release snapshot `50990a22`. Conflict
resolution retains continuous/time line models, annotations, inspection and synchronization,
heatmap color scales and missing-value markers, and the newer Histogram/WaterfallChart exports.
The line inspection crosshair ignores pointer events so inspection can coexist with datum activation.
Generated registry data, critical CSS, MCP data, and the public API inventory come from the merged
canonical sources. The source worktree's unrelated edits are preserved.

The combined web unit suite passes 1,134 tests. Core, Astro, React, and Elements type checks pass;
the docs check reports zero diagnostics across 357 files. Fifteen combined browser checks pass:
datum activation alongside line inspection across all three web adapters, attachment image failure
and replacement, bilingual headers at 320/1440 pixels and 100/200 percent text, and the existing
chart inspection and missing-value cases. Mobile and desktop header captures were also inspected.
The isolated merge is committed as `827923ad`, retaining both `50990a22` and `cedf45a2` as parents.
On that commit, `pnpm run validate` passes all builds and type checks, 1,375 tests, zero-warning
lint, spelling, unused-code and registry checks. It stops at `pnpm run check:security`: the registry
reports three high advisories in existing native-tooling dependencies (`node-forge`,
`http-cache-semantics`, and `braces`), with no patched versions listed. No advisory is ignored.
The remaining canonical publish-content, clean web-consumer, React Native package and external
MCP package checks were run separately and pass, including stdio and Streamable HTTP transport.
Local release integration is pending while another active task owns the release checkout;
this preparation record is not release evidence.

### Measured v4 bundle budgets

Fresh locked builds compare the release snapshot above with the combined implementation. These
are complete shipped entries, not an application bundle or a claim of runtime download cost.
Gzip measurements use Node's level-9 gzip, matching the canonical checker.

| Entry | Baseline raw / gzip bytes | Combined raw / gzip bytes | Added raw / gzip bytes |
| --- | --- | --- | --- |
| Astro UIPrimitives source | 165962 / 32993 | 166498 / 33081 | 536 / 88 |
| Shared stylesheet | 204467 / 33219 | 206215 / 33502 | 1748 / 283 |
| React components | 172180 / 35543 | 180640 / 36531 | 8460 / 988 |
| Elements definition entry | 183319 / 45428 | 186555 / 46172 | 3236 / 744 |

The baseline already exceeds the previous stylesheet, React, and Elements limits. The checker now
bounds the complete intended v4 surface with small headroom and separately caps the new core
activation, React chart recipe, and Elements activation helper entries. The helper measurements
are respectively 3922 / 1152, 1526 / 590, and 4456 / 1331 raw / gzip bytes. Existing unrelated entry
limits remain unchanged. The crosshair fix adds one CSS declaration beyond the table snapshot;
the checker measures final files again during validation.
