# @santi020k/lumen

Shared foundation and umbrella package for Lumen UI.

Install the framework package directly:

- `@santi020k/lumen-astro`
- `@santi020k/lumen-react`
- `@santi020k/lumen-elements`

Each adapter includes the shared foundation and exposes its own stylesheet entry. Install this
umbrella package only when you want the framework-neutral CLI or registry APIs:

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
lumen init --framework astro --tailwind
```

Use `lumen add <component>` for a local Astro wrapper, `--target react` for a React wrapper, or
`--target elements` for a custom-elements starter. Bundled recipes support the same Astro, React,
and Elements targets.

Complete product recipes are also bundled for `analytics-dashboard`, `saas-admin`,
`commerce-dashboard`, `project-workspace`, `auth-onboarding`, `docs-shell`, `marketing-shell`,
`dashboard-shell`, and `validated-form`.

Run `lumen doctor` to check adapter/style agreement, Tailwind layer order, Astro runtime mounts,
and fragile internal selector dependencies. Use `--json` for CI and rollout automation. `lumen
init --framework <astro|react|elements> [--tailwind]` prints the canonical non-destructive setup.

Run `lumen audit-tokens [path]` before incremental adoption when an existing stylesheet may already
declare names such as `--surface`, `--ink`, or `--line`. The audit reports complete CSS colors that
are incompatible with Lumen's HSL-channel token format and exits non-zero when it finds conflicts.

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
