# Lumen Migration Improvements

<!-- cspell:ignore Difftale -->

This document collects reusable improvements discovered while moving existing projects onto Lumen.
It is intentionally a backlog: migrations should preserve each product's current design, while
library changes can be evaluated and implemented separately.

## Implementation status

The July 2026 migration pass added:

- `lumen audit-tokens` plus channel-format guidance for semantic token collisions;
- low-presentation contracts for `Card`, `ButtonLink`, `Link`, `NavigationMenu`, and `Sidebar`;
- `Link newTab` parity and interactive `Pill href` rendering;
- authoritative `[aria-pressed="true"]` styling plus controlled, cancelable Astro toggle intent;
- catalog-wide nullable Astro `class` props for exact-optional-safe attribute passthrough.
- a Next.js production-build fixture and client boundary for the monolithic React catalog;
- React 19 ref props for common wrapper primitives, `Button asChild`, and a native-safe
  `Input size` plus `visualSize` contract.

## Lumen 0.2.0 multi-repository rollout

The first coordinated upgrade from Lumen `0.1.0` to `0.2.0` covered nine sibling repositories:
Aaronmgz, Dep Beacon, Difftale, ESLint Config Basic, MeMudo.ai, PostLens, the Santi020k theme
websites, the main website, and Workspace Organizer. Astro Doctor was intentionally excluded from
this batch because its upgrade had a separate visual and cascade review.

The rollout exposed release-process concerns that do not appear when testing Lumen only inside its
own monorepo.

### Add a consumer-upgrade inventory command

A reliable upgrade inventory must inspect workspace catalogs, direct dependencies, lock files, and
all framework packages. Searching only `package.json` misses catalog versions in
`pnpm-workspace.yaml`, while searching only source imports finds consumers but not their resolved
version.

Consider adding a release helper that:

- scans sibling or configured consumer repositories for `@santi020k/lumen-*`;
- reports direct ranges, catalog ranges, and resolved lockfile versions separately;
- supports explicit repository exclusions;
- identifies Astro, React, and Elements consumers so validation can be framework-aware;
- fails when a targeted repository still contains an old Lumen version after the upgrade.

### Preserve each consumer's package-manager contract

The consumers use different pnpm majors and exact versions. Running the shell's default pnpm from a
parent directory can either fail an engine check or operate on the wrong workspace. Every upgrade
and validation command should run from the consumer root through Corepack so the repository's
`packageManager` declaration is authoritative.

A future rollout script should resolve the repository root first, print it before mutation, and use
the equivalent of:

```bash
cd /absolute/path/to/consumer
corepack pnpm install
```

It should also verify the declared Node engine. The main website completed its checks and build
under Node 22 while declaring Node 24 or newer, but a successful fallback build should not be
mistaken for validation against the supported release environment.

### Make catalog upgrades deterministic

Editing a Lumen range in `pnpm-workspace.yaml` did not always cause a normal `pnpm install` to
replace an existing `0.1.0` catalog resolution. In affected workspaces, pnpm reported that the
lockfile was current even though the importer still resolved `0.1.0`.

Forcing a recursive package update refreshed the resolution, but it could rewrite a consumer
dependency from `"catalog:"` to a direct version. The safe sequence was:

1. update the catalog range while preserving its existing pinned or caret style;
2. explicitly update the Lumen package across workspace importers;
3. restore `"catalog:"` in consumer manifests if the update command replaced it;
4. run a normal install again to reconcile the catalog and lockfile;
5. verify both the importer and package snapshots resolve `0.2.0`.

This is too subtle for repeated manual releases. Add a tested upgrade command that preserves
catalog indirection and updates all related Lumen packages as one versioned set.

### Support newly published packages in release-age policies

Repositories using pnpm's minimum-release-age policy can reject a lockfile before resolving the new
version. Replacing an exception for `0.1.0` with only `0.2.0` caused the old lockfile entries to fail
the initial verification step.

The transition needs both old and new exceptions temporarily:

1. retain the old exceptions and add the newly published versions;
2. regenerate the lockfile;
3. confirm that no old Lumen snapshots remain;
4. remove the obsolete exceptions;
5. install once more so the final policy and lockfile validate together.

Lumen's release documentation or upgrade helper should detect `minimumReleaseAgeExclude` and manage
this transition without permanently weakening the consumer's supply-chain policy.

### Treat the Lumen packages as one release unit

Framework packages resolve matching versions of `@santi020k/lumen` and
`@santi020k/lumen-core`. React consumers also resolve `@santi020k/lumen-react`. A partial lockfile
upgrade can therefore leave a mixed internal graph even when the top-level dependency appears
current.

Post-upgrade validation should assert that every resolved Lumen package uses the intended release
unless a compatibility matrix explicitly permits mixed versions. The release helper should report
the complete internal graph, not only the framework package requested by the application.

### Define a downstream verification matrix

The 0.2.0 rollout used two levels of verification:

- structural checks: no `0.1.0` entries in manifests, catalogs, or lock files, followed by recursive
  `pnpm list` output confirming every direct consumer resolves `0.2.0`;
- integration checks: TypeScript checks for React wrapper packages, `astro check` for Astro
  consumers, and production builds for every affected site.

All nine repositories passed those checks without requiring application source changes. That
confirms the public TypeScript and build contracts remained compatible, but it does not prove
visual or interactive parity. Future coordinated releases should add representative browser smoke
tests or screenshot comparisons for products using components changed by the release.

Build pipelines can also contain non-Lumen environmental warnings. For example, the main website's
cross-site sitemap generator continued after optional deployed sites were unavailable. Rollout
reporting should distinguish a successful build with expected optional-source warnings from a
Lumen integration failure.

### Automate reversible multi-repository rollout batches

Before changing each consumer, the rollout created an explicit baseline commit. This preserved
unrelated work already present in PostLens and Workspace Organizer and gave every repository a
clear recovery boundary.

A future multi-repository release workflow should:

- record the branch, status, and current commit before editing;
- require or create an intentional baseline for repositories with existing work;
- preserve unrelated changes and generated-output policies;
- update one repository at a time with an auditable result;
- record install, typecheck, build, and browser-check outcomes per consumer;
- leave the upgrade diff limited to manifests, catalogs, and lock files when no source migration is
  necessary.

## Dep Beacon

### Make semantic token adoption safer for existing stylesheets

Dep Beacon already used common custom-property names such as `--surface`, `--ink`, and `--line`,
but stored complete CSS colors. Lumen uses the same names as HSL channel values and consumes them
through `hsl(var(--token))`. Importing Lumen therefore made either the existing site styles or the
Lumen components invalid, depending on stylesheet order.

Consider one or more of these options:

- publish a documented compatibility migration for full-color custom properties;
- provide namespaced channel aliases that avoid collisions during incremental adoption;
- add a CLI or MCP audit that reports conflicting token names and value formats before migration.

### Add a low-style migration mode for primitives

Existing sites often need Lumen semantics and contracts while retaining mature local visual
classes. Components such as `Card`, `ButtonLink`, and `Link` always add their complete visual class
set, so migrations must carefully override the library CSS to preserve the current design.

Consider a public `unstyled` or `appearance="inherit"` contract that keeps semantic markup,
accessibility behavior, prop normalization, and stable `data-ui-*` hooks without applying the
default presentation layer.

### Align external-link ergonomics

`ButtonLink` exposes `newTab`, while `Link` requires callers to repeat `target="_blank"` and
`rel="noopener noreferrer"`. A shared `newTab` contract would make migrations less repetitive and
reduce the chance of an unsafe or incomplete external-link setup.

## PostLens

### Keep `Toggle` presentation synchronized with `aria-pressed`

PostLens already had a small client-side controller that updates `aria-pressed` as someone previews
different looks. Lumen's `Toggle` adds `ui-toggle--pressed` only from the server-rendered `pressed`
prop, so a host script that correctly changes `aria-pressed` can leave the Lumen state class stale.

Prefer styling the pressed state through `[aria-pressed="true"]`, or provide a small public helper
that updates both the accessibility state and presentation hook. The DOM accessibility contract
should be the authoritative state wherever possible.

## Website

### Support externally controlled `Toggle` state

The website uses two toggles as a radio-like sort choice. Its controller sets the selected
button's `aria-pressed` value, but Lumen's independent click listener then inverts the clicked
toggle again. The migration had to defer synchronization to a microtask so the product state wins
after Lumen's listener runs.

Consider a controlled-state opt-out for the automatic toggle listener, or make the runtime emit a
cancelable intent event and let the host own state. `ToggleGroup` should also document the
recommended single-selection contract so consumers do not need competing click handlers.

### Make Astro HTML attribute passthrough exact-optional safe

Spreading an `HTMLAttributes<'time'>` object into `FormattedDate` fails under
`exactOptionalPropertyTypes` because the public component narrows `class` to `string`, while Astro
allows `string | null | undefined`. Audit the shared Astro prop pattern so standard attribute
objects can be forwarded to every primitive in strict projects without hand-picking attributes.

### Let `Pill` render an interactive element

The website uses visually identical pills both as metadata and as topic links. Lumen's `Pill`
always renders a `span`, forcing consumers to switch to `Link` and restyle it when a pill is
interactive. Consider an `href` contract or a typed `as` option that produces an anchor with the
same pill presentation and focus treatment.

### Make Tailwind v4 override order explicit and resilient

Importing Lumen after Tailwind v4 caused Lumen's named component layers to outrank Tailwind's
already-declared utility layer. Consumer classes such as `absolute`, `min-h-0`, `p-0`, and custom
radius utilities then stopped overriding primitive defaults, even though the library intends
consumer styling to win. The website recovered by importing Lumen before Tailwind.

Document the required import order prominently, and consider publishing a layer-order declaration
or integration entry point that makes consumer utilities win regardless of import order. Add a
fixture that combines `Card`, `Particles`, and `Button` with Tailwind v4 overrides so regressions
are visible.

### Support full-screen dialog shells

Lumen's `Dialog` always applies centered-panel positioning and a translate transform. The website's
search experience uses the native dialog as a full-screen shell with its own centered child panel,
so it had to override the inherited transform explicitly to keep controls inside the viewport.

Consider a typed layout contract such as `layout="centered" | "fullscreen"` or an `unstyled`
presentation mode that preserves the native dialog, runtime hooks, and accessibility behavior
without imposing panel geometry. Include a full-screen search example in the dialog documentation.

### Keep circular control focus rings circular

The shared focus treatment produced a rectangular outline on circular icon controls such as
`ThemeToggle`. Consumers should not need a local focus override for a built-in round control.
Include `ThemeToggle` and icon-sized buttons in the component focus-ring selectors, using a
border-radius-aware ring that remains visible in both themes.

## Aaronmgz

### Make the React entry safe in Next.js server components

Importing a presentation-only component such as `Card` from `@santi020k/lumen-react` caused a
Next.js production build to evaluate the package's monolithic component entry in the server
component runtime. That entry creates React contexts for behavior-heavy components, and the server
runtime failed with `createContext is not a function`. The downstream compatibility wrappers had to
be marked as client components even when the selected primitive itself had no client behavior.

Consider split component entry points or an RSC-safe presentation entry so static primitives do not
pull behavior-heavy context modules into the server graph. Document the intended Next.js boundary
and add a production-build fixture that imports `Card`, `Badge`, and other static primitives from a
server component.

### Add compatibility contracts for shared React wrapper libraries

Aaronmgz exposes a stable shared UI package consumed by Astro and multiple Next.js apps. Incremental
adoption needed to retain forwarded refs, `Button asChild`, existing variant names, and the native
numeric `input size` attribute. Lumen's React components currently use function components without
ref-forwarding, `Button` has no polymorphic child contract, and `Input` reuses `size` for visual
sizing.

Consider forwarding DOM refs consistently, adding a typed polymorphic or slot contract for button
and link wrappers, and separating visual sizing from native HTML attributes. These contracts would
let established design-system facades delegate to Lumen without compatibility branches.
