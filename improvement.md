# Lumen v1 Consumer Upgrade Improvements

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
