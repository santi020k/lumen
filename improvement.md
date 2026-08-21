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
