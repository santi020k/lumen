# Lumen 4 preparation

This working record tracks the local `release/v4.0.0` candidate. It is not publication or
production qualification evidence. Consumer audits inspect application source; application
data, deployment, and migration remain owned by those projects.

## Latest local integration

The October 3 consolidation through `f90b4884` contains all committed local branch tips:
community feedback (`6646a842`), native quality (`efa3e53a`), appearance presets (`f3a3b512`),
AI workflows (`8eedb38f`), and release improvements (`e9c8426e`). Git ancestry also confirms
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
