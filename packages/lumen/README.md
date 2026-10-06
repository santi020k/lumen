<p align="center">
  <a href="https://lumen.santi020k.com">
    <img src="https://raw.githubusercontent.com/santi020k/lumen/main/apps/docs/public/logo.svg" alt="Lumen UI" width="233" height="60">
  </a>
</p>

<h1 align="center">Lumen UI · CLI &amp; Registry</h1>

<p align="center">Component discovery · Recipes · Integration diagnostics</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@santi020k/lumen"><img src="https://img.shields.io/npm/v/@santi020k/lumen?style=flat-square&color=0369a0" alt="npm version"></a>
  <a href="https://github.com/santi020k/lumen/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-13967e?style=flat-square" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://lumen.santi020k.com/docs">Documentation</a>
  ·
  <a href="https://www.npmjs.com/package/@santi020k/lumen">npm</a>
  ·
  <a href="https://github.com/santi020k/lumen/tree/main/packages/lumen">Source</a>
  ·
  <a href="https://github.com/santi020k/lumen/issues">Issues</a>
</p>

**Package:** `@santi020k/lumen`

**On this page:** [Typography](#typography) · [Version migration previews](#version-migration-previews) · [Coordinated consumer rollout](#coordinated-consumer-rollout) · [Resources](#resources)

---

Shared foundation and umbrella package for Lumen UI.

Install the framework package directly:

- `@santi020k/lumen-astro`
- `@santi020k/lumen-react`
- `@santi020k/lumen-elements`

Each adapter includes the shared foundation, exposes its own stylesheet entry, and makes the
`lumen` CLI available to the consuming project. Install this umbrella package directly when you
also want to import its framework-neutral registry or diagnostics APIs:

```bash
pnpm add @santi020k/lumen
```

## Typography

Lumen defaults `--ui-font` to the canonical Santi020k Montserrat family stack:

```css
--ui-font: "Montserrat", "Avenir Next", "Segoe UI", sans-serif;
```

The package declares the family but does not bundle or load font files. Applications should load
Montserrat once through their preferred delivery path, or override `--ui-font` when using another
typeface.

The umbrella package also exposes typed registry metadata and the `lumen` CLI:

```bash
lumen list
lumen show Button
lumen add Button
lumen add Button --target react
lumen add Button --target elements
lumen add scheduler
lumen add scheduler --target react
lumen add scheduler --target elements
lumen add analytics-dashboard
lumen add saas-admin --target react
lumen add commerce-dashboard --target elements
lumen audit-tokens ./src
lumen doctor --json
lumen doctor-native --json
lumen init --framework astro --tailwind
lumen migrate v2 --dry-run
lumen migrate v3 --dry-run
lumen migrate v4 --dry-run
```

Use `lumen add <component>` for a local Astro wrapper, `--target react` for a React wrapper, or
`--target elements` for a custom-elements starter. Bundled recipes support the same Astro, React,
and Elements targets. With `--conflict error`, existing target files are checked before any recipe
files are written; runtime write failures can still require cleanup.

Complete product recipes are also bundled for `analytics-dashboard`, `saas-admin`,
`commerce-dashboard`, `project-workspace`, `auth-onboarding`, `docs-shell`, `marketing-shell`,
`dashboard-shell`, and `validated-form`.

External registry manifests are treated as untrusted input. Inline recipe files must use unique,
relative forward-slash paths and cannot traverse outside the selected `--cwd` or write through a
symbolic-link path segment. `loadLumenRegistry` bounds local and remote manifests to 5 MiB by
default; programmatic consumers can set `maxBytes` and `timeoutMs` for tighter deployment limits.
Component wrapper names must be ASCII identifiers containing letters, digits, or underscores,
starting with a letter or underscore, and cannot be reserved module keywords. Invalid names are
rejected before generating or writing any wrapper; recipe names retain their existing format.

Run `lumen doctor` to check adapter/style agreement, duplicate stylesheet entrypoints, Tailwind
layer order, Astro runtime mounts, and fragile internal selector dependencies. In a workspace,
diagnostics are scoped to the nearest package boundary, generated build trees are ignored, and
application-controlled Astro `Toggle` instances do not require the shared runtime. It also suggests
matching Lumen primitives for likely hand-built dropdown, theme, dialog-focus, and keyboard-menu
behavior. These suggestions stay advisory because product-specific composition can be intentional.
Astro runtime mount detection follows default-import aliases, including `default as` imports.
Type-only imports, front matter example strings, and HTML comments do not establish a runtime mount.
Publishable shared UI libraries are not required to load global styles. Private wrapper packages
can declare `"lumen": { "styleOwnership": "consumer" }` when their applications own adapter CSS,
or `"application"` when the package itself owns setup.
Use `--json` for CI and rollout automation. `lumen init --framework <astro|react|elements>
[--tailwind]` prints the canonical non-destructive setup.

Run `lumen doctor-native` in an Apple or Android consumer to report the resolved Swift package
tag/revision or Compose artifact version, compare it with Lumen's bundled cross-platform release
manifest, and audit public theme placement. It also groups likely direct SwiftUI and Compose
primitives that have public Lumen equivalents; these remain non-authoritative suggestions and do
not classify application-owned navigation or controls as failures. Android consumers receive a
read-only preflight for the documented JDK, SDK, platform packages, optional NDK requirement, and
compatible Gradle/AGP/Kotlin baseline before native compilation begins. Missing required toolchain
pieces are failures, optional evidence and migration candidates are warnings or suggestions. Pass
`--manifest` to audit against a prerelease manifest and `--json` for CI.

The same machine-readable metadata is published as
`@santi020k/lumen/release-manifest.json`. It records every npm package version and peer range, the
Swift tag, Maven coordinates, required stylesheet/runtime setup, deprecations, removals, and
codemod availability.

Run `lumen audit-tokens [path]` before incremental adoption when an existing stylesheet may already
declare names such as `--surface`, `--ink`, or `--line`. The audit reports complete CSS colors that
are incompatible with Lumen's HSL-channel token format and exits non-zero when it finds conflicts.

## Version migration previews

Run `lumen migrate v3` for the v2-to-v3 review: no web source rewrites are needed. It reports
native rebuild and exhaustive Swift icon-switch boundaries. Run `lumen migrate v4` for the
v3-to-v4 source preview. Literal Stack/Grid gaps preserve v3 spacing (`md` → `group`, `lg` → `xl`,
`xl` → `2xl`); dynamic values, spreads, product CSS, charts, dialogs and native contracts need review.
Aliases are resolved from actual Lumen imports; unrelated components and source examples stay intact.

Both commands preview by default and accept `--cwd`, `--json`, and `--apply`. Add `--dependencies`
to include the existing coordinated pnpm rollout: v3 targets `3.0.1`, v4 targets `4.0.0`. Dependency
apply retains rollout's exact package-manager and dirty-worktree guards; `--allow-dirty` is explicit.
Installs run before source rewrites; a failed dependency command stops source apply. Run the
consumer's completion gate after both phases. Source-only migration works without a package manifest
or package-manager requirement. Native Swift/Maven pins remain application-owned.

V4 apply records output fingerprints in `.lumen/migrations-v4.json`. Commit that ledger with the
source changes: repeated applies skip migrated files, and later edits to them require manual review.
The pure `migrateLumenVersionSource` API assumes v3 input and does not maintain that filesystem ledger.
Markup migrations preserve literal slash-star text; script comments and regex literals remain
excluded from rewrites. The umbrella package includes TypeScript as a runtime dependency so
the migration scanner can distinguish regex literals from division using compiler grammar.
Files that exceed the parser nesting limit remain unchanged and receive a manual-review finding.
Dependency inventory recognizes root and nested manifests using platform-native paths.
Review the actual application at mobile and desktop widths after applying a migration.

### Lumen v2 migration

Run `lumen migrate v2 [--cwd <path>]` to preview the candidate v2 source migrations. Previewing is
the safe default; `--dry-run` makes that intent explicit, and `--json` emits a machine-readable
report. The migrator currently:

- moves `UIPrimitives` from the `@santi020k/lumen-astro` root barrel to the default export from
  `@santi020k/lumen-astro/runtime`, including mixed and aliased named imports;
- renames literal `sm`, `default`, and `lg` visual `size` aliases to `visualSize` on imported Astro
  `Input` and `NativeSelect` components, and to `visual-size` on `lumen-input` and
  `lumen-native-select` elements; and
- rewrites `Sonner` and `SonnerProps` imports to the precise `ToastViewport` contract while
  preserving local aliases, and renames `lumen-sonner` to `lumen-toast-viewport` without changing
  placement, stack limits, or children;
- moves React Native date-field imports to `@santi020k/lumen-react-native/datetime`, preserving
  aliases and type-only imports; and
- preserves numeric native `size` values while reporting dynamic, conflicting, and otherwise
  ambiguous values for manual review.

After reviewing the report and committing a recoverable baseline, write the deterministic changes:

```bash
lumen migrate v2 --apply
```

The transform is idempotent. Re-running it after a successful apply produces no further changes.

## Coordinated consumer rollout

Inventory one or more pnpm consumers before a release:

```bash
lumen rollout 0.2.0 ../site ../dashboard --exclude ../legacy
```

The report separates manifest, workspace-catalog, and lockfile references; identifies each
framework; checks the declared pnpm and Node contracts; includes the same integration diagnostics
as `lumen doctor`; and reports the complete resolved Lumen package graph. Add
`--report ./lumen-rollout.json` for a durable JSON record.

After committing an intentional baseline in each consumer, apply the upgrade serially:

```bash
lumen rollout 0.2.0 ../site ../dashboard --apply --report ./lumen-rollout.json
```

The command preserves `catalog:` indirection and pinned/caret range style, temporarily admits the
new release through `minimumReleaseAgeExclude`, runs installs through Corepack from each consumer
root, removes obsolete Lumen release-age exceptions, verifies the unified resolved version, and
runs available framework checks, builds, and browser scripts. It refuses dirty repositories,
missing exact pnpm declarations, and unsupported Node runtimes unless `--allow-dirty` is explicit.

## Consumer upgrade and theme audits

```bash
lumen audit-consumer ../my-app --json
lumen audit-theme ./semantic-theme-scopes.json --json
lumen add validated-form --target react
lumen add operational-records --target react
```

The consumer audit reports declared and resolved versions, patch configuration and `ui-*` CSS
review signals without rewriting files. Selectors are advisory customization review signals.
Version migration previews include the same audit when the consumer has a manifest.

The theme file maps scope names to complete semantic-token objects, such as
`{ "light": { "canvas": "0 0% 100%", "ink": "0 0% 0%", ... } }`. Supply every semantic color
mapping with resolved opaque HSL channels. Missing or unresolved values and failing normal-text
contrast produce findings and a failing theme-audit exit status. Inspect computed mappings with
`inspectLumenTheme` from core for CSS variable resolution in actual light, dark and nested scopes.

See [consumer workflows](../../docs/consumer-ui-recipes.md#executable-consumer-workflows) for
the installable React form and operational-record recipes.

## Resources

| Guide | What you will find |
| --- | --- |
| [AI usage examples](https://github.com/santi020k/lumen/blob/main/docs/ai-usage.md) | Reference for aI usage examples. |
| [Consumer adoption](https://github.com/santi020k/lumen/blob/main/docs/project-adoption.md) | Reference for consumer adoption. |
| [MCP server](https://github.com/santi020k/lumen/blob/main/packages/mcp/README.md) | Reference for mCP server. |
| [Contributing](https://github.com/santi020k/lumen/blob/main/CONTRIBUTING.md) | Setup, checks, and contribution workflow. |
| [Release history](https://github.com/santi020k/lumen/releases) | Published releases and version notes. |

Part of [Lumen UI](https://lumen.santi020k.com), created by [Santiago Molina](https://santi020k.com).
Licensed under [MIT](https://github.com/santi020k/lumen/blob/main/LICENSE); third-party artwork retains its own notices.

## Content flow

Stack and Grid own sibling spacing. Their gap accepts `related`, `group` (default) and `section`,
or canonical `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl` sizes. Card owns the inset and gap
between its visible parts; use `density="compact"`, `"comfortable"` (default) or `"spacious"`.
Elements uses the same names as attributes. Use a nested Stack for CardContent groups and Field
for label/control/feedback. See [content flow](../../docs/content-flow.md) and the
[v4 migration guide](../../docs/migrating-to-lumen.md) for ownership and changed explicit gaps.


### Reading and complete compositions

Prose and Typography trim outer child margins and separate headings from preceding text.
Container gutters grow from 16px to 32px with viewport width; override `--ui-container-gutter`
when a product needs fixed gutters. Card allows interactive overflow; use AspectRatio to clip media.
Install `content-flow-header`, `content-flow-settings`, `content-flow-list` or `content-flow-actions`
with `lumen add <recipe> --target astro|react|elements`. MCP returns the same complete examples.
Connect application actions and replace sample IDs before reuse. See
[content flow](../../docs/content-flow.md) for composition and migration guidance.

React is an optional peer for the published React starter templates. Astro and Elements consumers
do not need it; React consumers should follow the React adapter's existing installation contract.

## Appearance presets

Choose Default, Studio or Glass with `data-lumen-preset` on a scoped web container.
Use the [appearance guide](../../docs/appearance-presets.md) for semantic overrides,
ThemeBuilder controls and native fallbacks. The Studio preset uses PostLens as its visual reference.

## Preview a v4 migration

```bash
pnpm exec lumen migrate v4 --dry-run --json
pnpm exec lumen migrate v4 --apply
```

The default is a preview. Deterministic edits cover four known static MCP SDK v1 import paths in
`.ts`, `.js`, and `.mjs` files. The report inventories resolved installed versions and lists v4
UI/native review triggers. SDK dependency manifests, comments, examples, dynamic imports, JSX, Astro,
and native SDK imports remain review tasks. Review triggers are not proof of a defect. The v2 migration
command remains available separately for older consumers.

The integrated `lumen migrate v4` command also retains the release's web spacing migrations and
optional coordinated dependency workflow. SDK edits compose into that command's source transform,
so its apply ledger fingerprints the final source and repeat runs do not rewrite spacing twice.
SDK import edits remain limited to `.ts`, `.js`, and `.mjs`; this restriction does not disable the
separate documented JSX/Astro spacing migration. The JSON report includes installed package
versions and explicit SDK dependency-review findings.

## Dashboard header recipes

Install `page-header` and `section-header` with `lumen add <recipe> --target astro|react|elements`.
These compositions provide page identity, optional breadcrumbs and metadata, translated action-group
labels, and responsive action wrapping using the existing primitives. The application owns its
routes and action handlers. See the [header recipe guide](../../docs/consumer-ui-recipes.md#page-and-section-headers).

The `auth-onboarding` recipe includes visual email-code sign-in, code verification, and passkey
recovery examples for Astro, React, and Elements. Controls stay disabled until the consumer connects
its authentication service. See the [login and Auth integration reference](https://lumen.santi020k.com/templates/auth-onboarding#login-examples-title).

## Visual interactions and product blocks

See [visual interactions](../../docs/visual-interactions.md) for keyed motion, semantic effects,
chart continuity, AI surfaces, optional SDK integrations, and the four installable product recipes.
## Presence motion

`animateLumenPresence` is available from the umbrella package or `@santi020k/lumen-core` for
optional browser-based enter/exit effects. See the [core motion contract](../core/README.md#presence-motion)
for presets, semantic timing, cancellation, reduced motion, and consumer-owned DOM/focus behavior.
The optional motion stylesheet progressively enhances native disclosures with natural-height transitions;
unsupported browsers keep native immediate toggles.

Import `@santi020k/lumen/styles/motion.css` alongside the base stylesheet to opt into native
disclosure height transitions and the CSS reduction scope. This small optional stylesheet works
with Astro, React, and Elements and keeps those effects out of the default stylesheet. The presence
helper's system and local reduced-motion checks work without this CSS import.

## Studio media workspace

Compose MediaViewport, MediaThumbnail, MediaFilmstrip and ImageComparison modes with the
[Studio media workspace recipes](../../docs/studio-media-workspaces.md). Applications retain
media loading, selection, adjustment algorithms, processing, export and persistence.
