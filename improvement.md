# Lumen Consumer Upgrade Improvements

<!-- cspell:words RoadScore -->

This document records improvements identified while upgrading every sibling Lumen consumer to the
published `1.0.0` release on August 11, 2026. The migration covered 15 repositories, 19 Astro app
dependencies, and two React package dependencies.

## Release coordination

### Publish and verify the whole package family as one release unit

`@santi020k/lumen-astro` installs `@santi020k/lumen` and `@santi020k/lumen-core` transitively.
Consumers with pnpm's minimum-release-age policy can therefore reject an immediate upgrade even
when the direct adapter is already trusted. Release verification should confirm that the umbrella,
core, Astro, React, Elements, icons, forms, templates, and MCP packages are all published at their
intended versions and can be installed together from a clean consumer.

Add a documented minimum-release-age example that lists every newly published first-party package
needed by the selected adapter. Keep exclusions narrowly scoped to Lumen packages instead of
disabling the policy globally.

### Synchronize repository metadata after publishing

The npm registry reports `1.0.0`, while the checked-out package manifests still report their
pre-v1 versions; the bundled MCP snapshot also advertises the older package versions. The release
workflow should finish by committing the Changesets version updates, regenerating the MCP snapshot,
and verifying that repository manifests, generated metadata, tags, and npm all agree. Without this
step, local workspace linking and AI tooling can describe a different release than consumers
actually install.

### Add a sibling-consumer canary before the stable release

Run a prerelease or packed-tarball matrix against the maintained sibling repositories before
publishing stable versions. The matrix should include:

- Astro sites with direct versions and pnpm catalogs;
- React wrappers that re-export Lumen primitives;
- consumers on each supported pnpm major;
- clean install, lockfile-only resolution, typecheck, lint, and production build;
- verification that the resolved adapter, umbrella, and core versions belong to the same release.

The v1 public API remained compatible with the current consumers, but the matrix would make that a
release invariant instead of a manual post-release observation.

## Upgrade tooling

### Provide one supported upgrade command

Document or ship a command such as `lumen migrate --to 1` that discovers all Lumen packages,
updates direct dependencies and pnpm catalog entries, uses the repository's declared
`packageManager`, refreshes the lockfile, and reports resolved versions. It should preserve the
consumer's existing exact-versus-caret convention unless explicitly overridden.

### Verify resolved lockfile versions, not only manifests

Changing a pnpm catalog entry followed by a normal install did not refresh one consumer's existing
Lumen resolution. An explicit recursive update was needed. Upgrade guidance should therefore check
the lockfile for stale `@santi020k/lumen*@0.x` entries and prescribe a targeted recursive update for
catalog-based workspaces.

### Respect each repository's package-manager contract

One consumer requires pnpm 11 while the ambient runner was pnpm 10. Automation should read the
root `packageManager` and `engines.pnpm` fields and launch the declared version through Corepack or
an equivalent pinned runner. This prevents environment failures from being mistaken for migration
failures.

## Diagnostics and documentation

### Publish machine-readable migration metadata

Alongside release notes, publish a small manifest containing package versions, required peer
versions, removed or deprecated exports, CSS/runtime setup changes, and codemod availability.
Upgrade tooling and the MCP server could consume this directly instead of inferring compatibility
from package metadata and build failures.

### Distinguish product failures from verification-tool failures

One consumer's ESLint run repeatedly timed out inside
`better-tailwindcss/enforce-canonical-classes`, while its Astro check and production build passed.
A shared migration verifier should report install-policy failures, API/type failures, build
failures, and unrelated tool crashes as separate categories, preserving the exact failing command
and diagnostic.

### Add a post-upgrade setup audit

After dependency resolution, automatically check that framework imports remain public, the Lumen
stylesheet is loaded once, `UIPrimitives` is mounted once for interactive Astro components, React
consumers use React behavior hooks, and no stale 0.x package remains in the lockfile. This turns the
current completion checklist into an executable consumer audit.

## Outcome of this migration

- All 15 sibling repositories resolve Lumen v1 without stale 0.x Lumen entries.
- All affected Astro production builds passed, and the React package build/type checks passed.
- Type and lint checks passed for affected packages except for the unrelated Tailwind ESLint worker
  timeout described above; that repository's Astro check passed with zero diagnostics.
- No application source migration or public API workaround was required.

## Between Contractions consumer findings (August 20, 2026)

The Between Contractions Astro site consolidated three independently implemented headers while
adopting the published Lumen v1 primitives. `NavigationMenu`, `DropdownMenu`, `Button`,
`LanguageToggle`, `ThemeToggle`, `Icon`, and `Container` covered the primitive layer well. The
remaining duplication exposed a few useful composite and behavior gaps for a future release.

### Add a responsive site-header composition

Provide an optional `SiteHeader` or `AppHeader` composition that accepts a brand slot, primary
navigation, an active destination, and trailing actions. It should preserve one navigation
landmark, render icon-plus-label destinations, offer a documented compact-label pattern under
content pressure, and keep the active state available through `aria-current`. This should compose
existing primitives rather than introduce a second navigation runtime.

A small companion contract such as `NavigationItem` would also prevent each consumer from
recreating active-link styling, icon alignment, and the visually-hidden-label treatment used at
narrow widths.

### Give `LanguageToggle` a real behavior contract

`LanguageToggle` currently renders an identifiable button, while every consumer must implement
locale state, persistence, document-language updates, label changes, and change events itself.
Bring it closer to `ThemeToggle` with:

- controlled and uncontrolled modes;
- `storageKey`, `value`, and a small locale-options contract;
- automatic `document.documentElement.lang` synchronization in uncontrolled mode;
- localized accessible labels for the current and next locale;
- a documented `ui:language-change` event shared across Astro and Elements, with an equivalent
  React hook.

Keep translation dictionaries application-owned; the component should coordinate locale state,
not become an internationalization framework.

### Add compound Astro exports for dropdown menus

The Astro `DropdownMenu` API still requires raw children marked with `data-ui-trigger`,
`role="menu"`, and `role="menuitem"`, while React exposes explicit trigger/content components.
Add `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`, and
an optional disabled/status treatment to Astro. This would make keyboard semantics and supported
markup discoverable without requiring consumers to inspect runtime selectors or recreate menu
item CSS.

### Consider a general platform-download menu composition

Product sites commonly need one compact action that lists native platforms, device coverage,
availability states such as “Soon,” and a web fallback. A general `PlatformDownloadMenu` or
documented recipe could compose `DropdownMenu`, `Item`, `Badge`, and `Icon` while leaving store
URLs and copy application-owned. It should support disabled future platforms without presenting
them as actionable menu items and should expose a compact icon-only trigger at narrow widths.

This is lower priority than the header, language, and dropdown contracts; a documented recipe may
be sufficient unless multiple consumers converge on the same structure.

### Add a consumer audit for duplicated primitive behavior

Extend the proposed post-upgrade audit to flag common hand-built equivalents when the matching
Lumen runtime is already mounted: `<details>` dropdown controllers, custom theme persistence,
repeated dialog focus management, and raw navigation menus with copied keyboard behavior. Report
these as migration suggestions rather than errors because product-specific composition remains a
valid use case.

Progress on August 22, 2026:

- [x] `LanguageToggle` now has shared locale options, controlled and uncontrolled behavior,
      persistence, document-language synchronization, accessible current/next labels,
      `ui:language-change`, and a React hook.
- [x] Astro now exports dropdown trigger, content, item, and separator parts with disabled and
      status treatments; the same item and separator contracts are available in React.
- [ ] The responsive site-header composition remains a candidate for a later release after another
      consumer confirms the same navigation and responsive-label contract.
- [ ] The platform-download composition remains a recipe candidate rather than a public component.

## Cross-platform v1.2 adoption findings (August 22, 2026)

This follow-up records what the first real multi-platform adoption taught us after Lumen v1.2.0 was
used across maintained web, iOS, macOS, and Android applications. It complements the earlier v1 web
upgrade findings above and should guide the next library releases.

### Adoption scope

| Platform        | Consumers                          | Representative Lumen usage                                                                                                         |
| --------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Astro and React | 18 applicable sibling repositories | Package upgrades, semantic tokens, public primitives, runtime and stylesheet setup                                                 |
| macOS           | ContracTrack, Coolstead, Workscene | Theme context, banners, buttons, empty states, gauges, settings rows, toggles, and text fields                                     |
| iOS             | ContracTrack and PostLens          | Theme context, toasts, banners, empty states, stats, pickers, toggles, skeletons, icons, button groups, and progress normalization |
| Android         | ContracTrack                       | Theme context, semantic palette mapping, surfaces, toggles, banners, alerts, and empty states                                      |

The migrations deliberately preserved each application's navigation, state, localization, domain
logic, accessibility behavior, and product identity. This made adoption quality more important than
the raw number of components replaced.

### What worked well

- The semantic color vocabulary was broad enough to map distinct product identities without making
  Coolstead, Workscene, PostLens, and ContracTrack look like the same application.
- SwiftUI components integrated into existing `Form`, navigation, menu-bar, widget, and custom
  visualization code without forcing an application architecture change.
- Components with native slots, especially Banner, EmptyState, SettingsRow, and the Compose
  structured components, allowed application-owned copy, icons, and actions to remain intact.
- Shared spacing, radius, progress, metric-tone, and skeleton foundations were useful even when a
  complete product surface could not or should not be replaced by a Lumen component.
- The existing web rollout command and package metadata made the v1.2 dependency upgrade much more
  predictable than the original v1 migration recorded above.

## Priority 0: remove adoption blockers

### Publish `lumen-compose` to Maven Central

Android is the only platform where a consumer cannot install the released library through its
normal dependency manager. ContracTrack had to pin the full Lumen repository as a shallow Git
submodule and expose the upstream Kotlin source through a host Gradle adapter. That works and keeps
the source authentic, but it adds repository weight, CI checkout configuration, Gradle coupling,
and maintenance that Swift Package Manager and npm consumers do not carry.

Ship `com.santi020k:lumen-compose:<version>` from the existing publication configuration and make
the first public artifact a release gate rather than an optional manual follow-up.

Acceptance criteria:

- A clean sample application resolves Lumen from Maven Central with one dependency declaration.
- The published AAR, module metadata, POM, sources, Javadoc, checksums, and signatures are verified
  from a clean environment.
- The artifact version is derived from the same release source used for npm and the Git tag.
- ContracTrack can replace its submodule, adapter build file, and CI submodule checkout without any
  UI code changes.
- Release verification tests both Gradle Kotlin DSL and a version-catalog declaration.

Until that artifact exists, improve the documented fallback:

- use a shallow, tag-pinned submodule command rather than cloning the full repository history;
- document CI checkout with submodules enabled;
- provide a supported host-adapter example for applications whose Android Gradle Plugin differs
  from Lumen's pinned plugin version;
- explain how to verify the Gitlink commit against the intended release tag.

### Make native theme composition accept an existing product theme

Real applications already own a Material 3 or SwiftUI color system. Lumen should consume that
system cleanly instead of asking the application to choose between Lumen defaults and its product
identity.

ContracTrack Android currently mounts `LumenTheme`, overrides `LocalLumenTheme` with a custom
`LumenColorPalette`, and then mounts its existing `MaterialTheme` again to retain typography,
shapes, and colors. The result works, but the nesting exposes an integration gap in the public API.
Apple consumers also created one app-specific theme bridge each, and scene-based macOS apps had to
apply it to multiple windows and menu-bar surfaces.

Add first-class APIs such as:

- Compose `LumenTheme(values = ..., materialColorScheme = ..., typography = ..., shapes = ...)`;
- a Compose helper that maps a Material `ColorScheme` into Lumen semantic roles with explicit
  overrides for brand, accent, success, and warning;
- SwiftUI theme initializers and modifiers that accept custom light and dark palettes;
- a SwiftUI option that injects Lumen values without forcing `preferredColorScheme`, so a stored
  System/Light/Dark preference stays application-owned;
- documented scene-level placement for macOS windows, settings scenes, menu-bar extras, widgets,
  and previews.

Acceptance criteria:

- ContracTrack's Android theme requires one public Lumen theme call and no manual composition-local
  override.
- The five Apple application targets can remove their nearly identical theme bridge boilerplate.
- System appearance changes update Lumen components without relaunching the application.
- Custom product colors pass contrast tests in both light and dark appearances.

### Make the Compose module safe to consume as source

Including the v1.2 Compose project directly exposed two avoidable integration problems: its pinned
Android Gradle Plugin conflicted with the host application's plugin version, and Android lint
reported `ModifierParameter` against a released public function signature. The consumer adapter had
to isolate the upstream build and narrowly disable that dependency-only check.

Before the next Compose release:

- move plugin versions out of the consumable module or provide a convention that does not compete
  with the host build;
- put `Modifier` first among optional public composable parameters and add an API lint test for the
  convention;
- mark generated palette and theme value types as Compose-stable where appropriate;
- run Android lint with warnings treated as failures for the public module;
- test the module inside a host application using a newer compatible Android Gradle Plugin, not
  only inside the Lumen repository.

Publishing to Maven removes most source-inclusion friction, but these checks remain valuable for
contributors, composite builds, and the documented fallback.

## Priority 1: turn successful patterns into supported workflows

### Document version-pinned Swift Package Manager installation

The Swift README currently demonstrates following `main`, while every production migration pinned
the public v1.2.0 release. Production documentation should lead with an exact tag or a documented
compatible-version rule and reserve `main` for local evaluation.

Add examples for:

- Xcode's package dependency UI;
- `Package.swift` with `exact` and `from` policies and guidance on choosing between them;
- XcodeGen-generated projects;
- deterministic project injectors such as PostLens's checked-in generator;
- verifying `Package.resolved` contains the intended tag and revision.

### Improve runtime localization ergonomics in SwiftUI

ContracTrack needed a `lumenLocalized(_:)` bridge because its user-selected English/Spanish
language is resolved at runtime rather than exclusively through the process locale. Lumen
components should make the difference between localization keys and already-resolved copy
explicit.

Provide consistent initializers or content slots for `LocalizedStringKey`,
`LocalizedStringResource`, and verbatim `String` values. Add a bilingual example that changes the
application language while the view is alive and verifies labels, descriptions, accessibility
names, and button copy without reconstructing the scene.

### Add native adoption diagnostics

Extend `lumen doctor` or add a read-only native audit that can report:

- the resolved Swift package tag/revision or Compose artifact version;
- missing theme placement in application scenes and previews;
- repeated or conflicting theme providers;
- a local Compose checkout that is not pinned to a release commit;
- native components still using Lumen's default palette inside an otherwise custom-themed app;
- stale generated tokens or a native adapter version that does not match the release manifest.

The audit should produce suggestions, not errors, for application-specific native controls and
navigation containers that Lumen intentionally leaves platform-owned.

### Run maintained consumers as release canaries

The existing package tests prove component behavior in isolation. The migration showed that
package-manager integration, theme ownership, project generation, and platform toolchains fail at
different boundaries. Add a release-candidate matrix using packed artifacts or temporary tags:

| Canary                  | Required checks                                                               |
| ----------------------- | ----------------------------------------------------------------------------- |
| Astro catalog workspace | Install, lockfile resolution, typecheck, lint, production build               |
| React consumer          | Install, exports, behavior hooks, typecheck, tests, build                     |
| Swift package app       | Resolve exact tag, macOS build/test, generic iOS Simulator build              |
| Xcode-generated app     | Regenerate project, resolve package, build all application and widget targets |
| Compose app             | Resolve Maven artifact, unit tests, lint, app build, Android-test APK build   |

Keep consumer credentials and store publishing out of this matrix. Its purpose is to prove that a
released library can be adopted, not to release the consumer applications.

### Update adoption documentation after every pilot

`docs/project-adoption.md` still describes the Swift applications as not using Lumen and says no
active Compose consumer exists. Treat the adoption inventory and native compatibility matrix as
release metadata that must be updated when a pilot becomes a maintained consumer.

Record the component subset used by each application, its pinned version, last verified toolchain,
and remaining manual accessibility checks. This turns one-time migration knowledge into a useful
compatibility signal.

## Priority 2: improve component depth without replacing native structure

### Add recipes for repeated native compositions

The migrations repeatedly combined the same primitives while correctly retaining native
navigation and forms. Prefer documented recipes over large new container components for:

- a settings row with title, optional description, icon, toggle, and validation state;
- a destructive or urgent banner with an application-owned action;
- an empty collection state with a system icon and primary action;
- a progress/status summary using Stat, Gauge, Badge, and Skeleton;
- compact macOS menu-bar and settings density;
- adaptive iPhone/iPad button-group orientation.

Promote a recipe into a public component only after at least two consumers need the same behavior,
accessibility contract, and state model.

### Expose visual customization at semantic boundaries

PostLens used Lumen spacing, radii, icons, progress normalization, skeletons, and button groups while
retaining product-specific photo layouts. Coolstead kept its specialized fan and temperature
visualizations while adopting Lumen Gauge and Toggle. These are healthy partial migrations.

Keep customization focused on semantic roles, density, component intent, native slots, and
application content. Avoid props that merely mirror every SwiftUI modifier or Material parameter.
Add examples showing how to retain a distinctive product visualization beside Lumen controls so
future migrations do not equate adoption with visual homogenization.

### Expand device-level accessibility evidence

Compilation and unit checks passed across the migrated targets, but some final verification still
requires real UI environments: VoiceOver, menu-bar interaction, widget galleries,
WatchConnectivity, TalkBack, large font/display scaling, reduced motion, and high contrast.

Maintain a small device-validation ledger per native release with:

- OS and device class;
- component surface exercised;
- keyboard or assistive-technology path;
- light/dark and contrast settings;
- outcome and known limitation;
- screenshot or test artifact where appropriate.

Automated simulator/emulator accessibility tests should complement, not replace, periodic physical
device checks.

## Proposed delivery sequence

### v1.2.x maintenance

1. Correct Swift Package Manager documentation to use release versions.
2. Fix Compose public parameter ordering and stability annotations.
3. Update the project-adoption inventory with the completed pilots.
4. Improve the shallow, pinned Android submodule fallback documentation.
5. Add tests for custom native palettes and System/Light/Dark transitions.

Progress on August 22, 2026:

- [x] Production Swift Package Manager guidance now leads with exact `1.2.0` pinning, documents
      compatible-version policy, XcodeGen and deterministic generator ownership, and
      `Package.resolved` verification.
- [x] Compose enforces Android lint warnings as errors, keeps `Modifier` first among optional
      parameters, and marks generated palette and easing value types immutable.
- [x] The project-adoption inventory records the completed SwiftUI and Compose pilots, pinned
      versions, verified toolchains, adopted component subsets, and remaining device checks.
- [x] The Android fallback now uses a shallow tag-pinned submodule, documents CI and Gitlink
      verification, and provides a host-owned adapter path for Gradle plugin differences.
- [x] Custom palette mapping tests cover Material-to-Lumen and Lumen-to-Material roles; Swift tests
      cover application-owned palettes and the option that leaves System/Light/Dark appearance
      under application control.

### v1.3.0

1. Publish the first Maven Central Compose artifact.
2. Ship the Compose and SwiftUI product-theme integration APIs.
3. Add native adoption diagnostics and a machine-readable cross-platform release manifest.
4. Add web, SwiftUI, and Compose consumer canaries to the release candidate gate.
5. Publish the repeated native composition recipes and updated accessibility evidence.

## Definition of done for the next cross-platform rollout

- Every maintained consumer installs Lumen through its platform's normal package manager.
- One release manifest identifies the npm versions, Swift tag/revision, and Maven coordinate.
- Product themes integrate through public APIs without manual environment or composition-local
  overrides.
- No consumer disables a Lumen-owned lint diagnostic or patches a released source signature.
- Web, SwiftUI, and Compose canaries pass before stable publication.
- Native docs show release-pinned installation and real application theming.
- Automated checks cover build, lint, unit tests, and instrumentation compilation; the device ledger
  records the remaining VoiceOver and TalkBack evidence.
- Adoption preserves product identity and platform conventions while reducing duplicated primitive
  behavior.

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
