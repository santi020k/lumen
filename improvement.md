# Active Lumen improvements

<!-- cspell:words RoadScore -->

This file contains only improvements that remain actionable after the August 2026 web and native
adoption work. Completed items are intentionally removed instead of accumulating progress logs;
their implementation, tests, Changesets, and Git history are the durable record.

The following work is already covered by the repository and must not be recreated as a parallel
API: coordinated pnpm rollout and lockfile checks, package-manager pinning, web integration
diagnostics, locale-toggle behavior, compound dropdown exports, cross-platform release metadata,
Maven publication configuration, product-theme bridges, native install guidance, developed native
patterns, navigation badges and re-selection, adaptive or scroll-responsive navigation, SwiftUI
link and rich disclosure contracts, watchOS and Wear OS foundations, and release-candidate fixtures.

## Maintained consumer canaries

The in-repository release-candidate workflow verifies packed npm consumers, the Swift package and
playground, Compose publications, and the Android playground. Repository-specific dispatch workflows
and successful local candidate runs now exist for the maintained Astro, React, SwiftUI, and Compose
consumers recorded in [`docs/native-consumer-validation.md`](docs/native-consumer-validation.md).
The remaining work is external adoption and immutable remote evidence:

- review, commit, and push each prepared workflow to its owning repository's default branch;
- dispatch an immutable release-manifest URL and record the successful remote run for each adapter;
  and
- make the canaries required for a stable release only after each consumer owner confirms the
  workflow is reliable.

Acceptance criteria:

- At least one maintained Astro, React, SwiftUI, and Compose consumer runs against a candidate.
- The resolved adapter, umbrella, core, Swift, and Compose versions match the candidate manifest.
- A tool crash is reported with its exact command and diagnostic without being mislabeled as a
  Lumen product regression.

The local workflow files are intentionally uncommitted because committing and pushing external
repository changes requires explicit authorization. This item cannot be removed until those remote
runs exist.

## Physical-device accessibility evidence

Automated semantics, unit tests, simulator builds, and accessibility-test compilation are present.
The remaining evidence requires representative hardware and human judgment. Continue recording
results in [`docs/native-device-validation.md`](docs/native-device-validation.md), including:

- VoiceOver, Dynamic Type, Reduce Motion, and Increase Contrast on iOS, macOS, and watchOS;
- TalkBack, font/display scaling, reduced animation, and high contrast on Android;
- TalkBack, rotary input, font scaling, Always On behavior, and round-screen clipping on Wear OS;
- keyboard, switch, touch-target, focus-order, announcement, and live-region behavior where the
  platform supports them.

Every result must identify the device, OS, revision, tester, exercised surface, outcome, and an
issue or recording when appropriate. Simulator or accessibility-tree output must not be recorded
as a completed physical-device pass.

## Completion rule

An item can be removed from this file when its public contract and documentation exist, relevant
automated checks pass, and required external or device evidence is recorded. Product-specific
navigation, windowing, domain controls, safety policy, haptics, charts, widgets, and application
state are not backlog items merely because Lumen does not own them.

## RoadScore v2 consumer findings (August 28, 2026)

RoadScore upgraded its Expo Router application and Astro marketing site to the published Lumen
`2.0.0` packages, then adopted native tabs, bar and pie charts, chart theme roles, web reveal
primitives, animated statistics, and the shared Astro runtime. The existing game, custom deck,
scoring, results, replay, privacy, and marketing flows remained intact. Repository checks, an Expo
web export, and rendered mobile and desktop browser verification passed.

### What worked well

- The v2 package contracts upgraded without an application compatibility shim. Root exports,
  TypeScript declarations, and peer ranges were sufficient for the existing Expo and Astro stacks.
- `useTabs` and `LumenTabs` kept filter state application-owned while providing native selection
  semantics and touch targets.
- `LumenBarChart` and `LumenPieChart` accepted domain-owned labels, summaries, formatters, and
  semantic tones without taking ownership of scoring logic.
- `createLumenTheme` plus semantic color and chart roles preserved RoadScore's product palette.
- Astro could load the stylesheet once in a shared layout while mounting `UIPrimitives` only on
  pages that used interactive or motion primitives. Static privacy content stayed runtime-free.

### Add an Expo web accessibility canary for native selection controls

The rendered Expo web tabs exposed `tablist` and `tab` roles and changed the filtered deck
correctly, but the selected tab was not exposed as `aria-selected` in the inspected DOM. Existing
React Native component tests verify `accessibilityState` before the React Native Web adapter maps it
to browser semantics, so they cannot catch this integration gap.

Add a small built Expo web fixture and browser test for `LumenTabs`, `LumenSegmentedControl`, radio
groups, and navigation bars. The test should verify the actual accessibility tree after pointer and
keyboard interaction instead of asserting only React Native props.

Acceptance criteria:

- exactly one enabled tab exposes its selected state after every change;
- disabled options remain unavailable to pointer and keyboard input;
- the active panel has `tabpanel` semantics and an accessible relationship to its tab where React
  Native Web supports that contract;
- focus remains visible and selection works with Tab plus the platform-appropriate arrow keys; and
- the canary runs from the packed release candidate, not workspace source.

### Make native tabs resilient to narrow widths

RoadScore's starter deck uses five peer tabs in a phone-width view. Short English labels fit under
the tested content, but the current single-row contract has no documented overflow behavior for
longer labels, localization, larger text, or narrower devices. Consumers should not need to wrap a
selection primitive in an application-owned scrolling controller.

Give `LumenTabs` an adaptive overflow contract shared as closely as platform conventions allow.
Prefer horizontal scrolling for a peer tab list, keep the 44-point touch target, bring the selected
tab into view, and preserve readable labels under large text. Document when a picker or segmented
control is more appropriate than a large tab set.

Acceptance criteria:

- five representative labels remain reachable at 320- and 390-point widths;
- 200% text scaling does not clip labels or make a tab unreachable;
- changing selection scrolls the active tab fully into view without unexpected page scrolling; and
- iOS, Android, and React Native Web examples share the same controlled value contract.

### Localize chart support copy and document zero-value presentation

The chart APIs correctly distinguish missing data from finite zero values, but their support copy
is currently fixed in English (`Chart data`, `No chart data available.`, `Not available`, and
`Size`). A custom `summary` or `formatValue` cannot localize every string rendered or announced by
the chart. RoadScore also had to make a product decision that an all-zero score comparison was less
useful than its existing scoreboard, while zero-valued categories in a scored-round breakdown
remained valid data.

Add one shared chart-label contract for visible and assistive copy across native adapters. Keep zero
as valid data, document the difference between empty and all-zero series, and show how to set
`showData={false}` when an equivalent accessible table or scoreboard already exists. Consider an
optional application-owned empty-state slot only if it can remain consistent across adapters.

Acceptance criteria:

- every library-owned chart phrase can be replaced without patching component source;
- default English labels remain backward compatible;
- automated tests cover empty, all-zero, negative, unavailable, and mixed series;
- the accessible summary does not duplicate a visible equivalent data list unnecessarily; and
- Astro, React, Elements, React Native, SwiftUI, and Compose documentation use the same terminology.

## Aaronmgz v2 consumer migration findings (August 28, 2026)

The Aaronmgz migration exercised Lumen `2.0.0` in a mixed-framework monorepo: an Astro public site,
a Next.js admin application, and a shared React UI package. The migration preserved the product's
existing nautical theme and wrapper APIs while replacing hand-built behavior with public Lumen
contracts.

### What worked well

- The v2 Astro and React adapters could coexist when each application owned exactly one matching
  layer prelude and stylesheet at its global CSS boundary.
- `ScrollProgress` and `SkipLink` replaced application-owned implementations without changing page
  structure or localization.
- Compound Card parts let the shared React Card wrapper delegate its structure while retaining
  application spacing, typography, refs, and semantic heading choices.
- React `Button` preserved local variants while adopting Lumen's native `asChild`, `loading`, and
  destructive contracts, which removed the wrapper's separate Radix Slot branch.
- The split between native `Input.size` and `visualSize` eliminated the previous native-input
  fallback. Badge status variants were also additive and compatible with the existing brand
  variants.
- App-scoped `lumen doctor` runs and the semantic-token audit were clean, and the completed consumer
  passed lint, strict type checking, tests, production builds, accessibility, SEO, and desktop and
  mobile browser checks.

### P0 — Verify published adapter exports against documented imports

The published `@santi020k/lumen-astro@2.0.0` consumer did not expose `UIPrimitives` through the root
barrel in the installed contract, although the source tree and documentation advertise the named
root import. The explicit `@santi020k/lumen-astro/runtime` subpath worked. Source-level tests alone
cannot catch a package whose packed or published export surface differs from the repository.

Acceptance criteria:

- pack every adapter exactly as it will be published and install the tarballs into clean Astro and
  React fixtures;
- compile every import shown in the root README, package READMEs, AI guide, MCP usage output, and
  migration guide against those tarballs;
- assert that root named exports and documented subpath exports resolve at runtime, not only in the
  source workspace;
- compare the npm artifact's export manifest and type surface with the release candidate before
  applying the stable tag.

### P0 — Make `lumen doctor` understand shared UI-library boundaries

Running the doctor from the monorepo root treated the shared `packages/ui` React wrapper library as
an application missing a stylesheet. The actual Astro and Next.js applications each owned the
correct adapter stylesheet and passed app-scoped diagnostics. A reusable component library should
not be required to load global CSS merely because it imports React primitives.

Acceptance criteria:

- distinguish application roots from publishable or workspace-only component libraries;
- report stylesheet and runtime ownership against the nearest runnable application boundary;
- allow a shared wrapper package to declare that its consumers own adapter styles;
- retain an advisory when no consuming application can be found, but do not emit a false setup
  error for a correctly layered monorepo;
- add a fixture with Astro and Next.js applications consuming one shared React UI package.

### P1 — Add a mixed Astro and React migration recipe

The pre-v2 consumer loaded React adapter CSS from its shared UI package, so the Astro site received
React styles indirectly. Correct v2 ownership required removing adapter CSS from the shared package
and importing Astro or React layers and styles in each application. `lumen migrate v2` made no
source changes and did not explain this boundary.

Document and diagnose this architecture explicitly. The recipe should show:

- a framework-neutral brand and token stylesheet in the shared package;
- Astro layers and styles in the Astro app entry plus one root `UIPrimitives` mount;
- React layers and styles in the Next.js app entry with no Astro runtime;
- direct adapter dependencies in the packages that import their public components;
- how to avoid duplicate CSS when a shared wrapper package is consumed by more than one app.

The migration command should surface this as a suggestion when it finds adapter CSS inside a shared
package or finds different framework adapters in one workspace.

### P1 — Report adoption opportunities, not only breaking migrations

The automated v2 migration correctly found no required breaking edits, but manual inspection still
identified a custom scroll-progress controller, custom skip links, a native-input compatibility
fallback, a Radix Slot branch, and Card structure that v2 could now own. A zero-change migration
result can therefore be technically correct while underselling the release's value.

Add an optional read-only report that separates:

- required contract migrations;
- setup corrections;
- safe primitive replacements;
- wrapper simplifications enabled by new props or compound parts;
- suggestions that require visual or product judgment.

Never rewrite product wrappers automatically. Include component names, source locations, the public
contract that may replace the local code, and a verification checklist.

### P1 — Add host-CSS collision coverage for fixed accessibility primitives

The admin application's broad direct-child selector assigned `position: relative` to every visible
root child and overrode the fixed positioning used by `SkipLink`. The link became permanently
visible until the host selector explicitly excluded `.ui-skip-link`. Component tests and source
diagnostics did not reveal the rendered cascade failure.

Acceptance criteria:

- add a consumer fixture that mounts `SkipLink`, overlays, toasts, and other fixed primitives under
  realistic host reset, Tailwind, and app-shell selectors;
- verify computed off-screen, focused, and activated SkipLink states at desktop and mobile sizes;
- document stable root hooks such as `data-slot` or public classes that host shells may exclude;
- teach visual migration guidance to verify computed positioning and focus, not merely DOM presence;
- avoid `!important` as the default solution unless cascade-layer testing proves it is necessary.

### Recommended delivery order

1. Fix and gate the packed Astro export contract before the next patch release.
2. Correct workspace-boundary classification in `lumen doctor`.
3. Publish the mixed-adapter recipe and source-level migration suggestions.
4. Add the host-CSS collision fixture and focused SkipLink browser regression.
5. Expand the migration report with optional v2 adoption opportunities.

## Personal website v2 consumer findings (August 28, 2026)

The personal website upgraded `@santi020k/lumen-astro` from 1.6.0 to the published 2.0.0 release,
preserved more than 60 existing Lumen imports, and adopted `CopyButton` and `RevealGroup`. Its
type-check, lint, unit tests, production build, SEO audit, focused browser tests, and responsive
visual checks passed after the migration fixes below.

### Make migration, diagnostics, documentation, and exports agree

Immediately after the dependency upgrade, `lumen migrate v2` scanned 194 files and reported zero
changes, and `lumen doctor` reported a healthy integration. `astro check` then failed because the
site still used the removed named root export for `UIPrimitives`. Lumen 2 requires the default
runtime import instead:

```astro
---
import UIPrimitives from '@santi020k/lumen-astro/runtime'
---
```

The adapter README documented the new import, while the root README still showed the old one. This
means the migration, doctor, documentation, and published export map did not share one enforceable
contract.

Improve the v2 tooling and fixtures so they:

- rewrite the legacy named `UIPrimitives` import to the default runtime import;
- validate imported names and export paths against the installed package;
- test documentation examples against the same public export contract; and
- cover dry-run output, applied output, idempotence, doctor health, and `astro check` in a real
  1.6-to-2.0 Astro fixture.

Acceptance criteria:

- doctor cannot report healthy while a consumer imports a removed export;
- migration preview reports the required rewrite and `--apply` performs it;
- root docs, adapter docs, CLI setup output, and published exports agree; and
- the migrated fixture has one stylesheet boundary and one runtime mount and passes Astro checks.

### Give `CopyButton` complete presentation and visual-state contracts

`CopyButton` successfully replaced application-owned clipboard controllers, and
`ui:copy-success` provided a deterministic browser-test hook. Preserving the site's visible
"Copied!" state still required duplicated icons and labels plus consumer CSS keyed to
`data-state="copied"`. A primary copy action also needed site-owned classes because the component
does not expose the same variant and size choices as `Button`.

Add supported button variants and sizes, stable idle/copied/error slots or parts, synchronized
visible and assistive feedback, and documented success and error events. Keep existing free-form
child content compatible. Browser examples should wait on the public event rather than race the
two-second state reset.

### Let reveal components preserve semantic roots

`RevealGroup` cleanly replaced inert stagger markers on `div` grids. It could not replace a
staggered logo `<ul>` without adding a wrapper or breaking direct list-child semantics because its
Astro root is always a `div`. `ScrollReveal` has the same friction around existing semantic
sections.

Follow the constrained `Stat as="article"` precedent: allow `RevealGroup` roots such as `div`,
`ul`, `ol`, and `section`, and allow `ScrollReveal` roots such as `div`, `article`, and `section`.
Type tests should reject unsupported values, while reduced-motion, no-JavaScript readability,
keyboard order, and runtime selection remain identical for every supported root.

### Make `lumen show` sufficient for component adoption

`lumen show CopyButton`, `lumen show RevealGroup`, and `lumen show Stat` returned category,
dependency, and source-file metadata, but not props, defaults, events, slots, or a usable Astro
example. The consumer therefore had to inspect installed implementation source.

Extend the text and JSON output with framework-specific imports and minimal usage, typed props and
defaults, composition rules, emitted events, runtime requirements, stable styling parts, and
relevant semantic tokens. CLI, MCP, docs, and the generated catalog should consume the same
contract source.

### Include package-manager metadata in coordinated upgrades

The website declares Lumen through a pnpm catalog and lists exact Lumen family versions in
`minimumReleaseAgeExclude`. Completing the upgrade required updating the catalog entry, the Astro,
Core, and umbrella exclusions, and the lockfile together.

Upgrade reporting should find catalog indirection and exact release-age exclusions, preview only
the required manifest edits, preserve unrelated exclusions, and verify that declared and resolved
Lumen family versions are coordinated. Repeated application should be idempotent.

