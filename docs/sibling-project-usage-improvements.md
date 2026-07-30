# Sibling Project Usage Audit and Improvement Plan

<!-- cspell:words commitprompt coolstead difftale -->

This document turns the way Lumen is used across the sibling repositories in
`/Users/santi020k/Projects/santi020k` into a concrete improvement plan for this project.

The audit is a point-in-time source review from July 30, 2026. It inspected package manifests,
workspace catalogs, source imports, global style entries, `UIPrimitives` mounts, local Lumen
wrappers, and consumer CSS. Generated output, dependency folders, and vendored copies of the Lumen
agent skill were excluded. Import counts measure source-level adoption, not rendered component
instances.

## Executive summary

- 13 of the 15 sibling repositories consume Lumen.
- The consumers cover 16 Astro applications and two shared React UI packages used by Next.js
  applications.
- The audit found 166 source files importing Lumen components, 54 distinct components, and 393
  component import references.
- `Icon`, `Card`, `Link`, `ButtonLink`, `Badge`, and `Button` dominate adoption. `Card` appears in
  12 repositories and `ButtonLink` in 12, so improvements to these foundations have much more
  leverage than adding another isolated primitive.
- Astro is the proven reference surface. React is used successfully through application-owned
  wrapper packages. No sibling project currently exercises the Elements adapter in production.
- Setup is easy to get almost right. Tailwind layer ordering, Astro runtime mounting, package
  version alignment, and framework-specific style entry selection are still inferred manually.
- Consumers frequently style Lumen through internal-looking `.ui-*` selectors or maintain wrapper
  components. The library needs a clearer, stable customization and composition contract.
- The existing Observatory chart learnings remain valid and should be implemented as the
  data-visualization effort rather than duplicated here.

## Repository inventory

| Repository | Surface | Observed use | Signal for Lumen |
| --- | --- | --- | --- |
| `aaronmgz` | Astro site plus shared React UI package | Forms, links, buttons, cards, badges, skeletons; application-specific React wrappers | Validate mixed Astro/React setup and make wrapper authoring first-class |
| `astro-doctor` | Astro documentation site with Tailwind | Docs shell, navigation, sidebar, code, callouts, pagination, theme | Keep the Tailwind and documentation-site integration as a regression fixture |
| `commitprompt` | Astro documentation site | Broad composition in a small site: code tabs, stepper, stats, prose, navigation | Provide a reusable documentation/landing recipe |
| `coolstead` | Astro marketing site | Card, badge, accordion, scroll reveal, skip link | Preserve a lightweight static/marketing path |
| `dep-beacon` | Astro documentation site with Tailwind | Docs navigation, sheet, theme toggle, callouts, stats | Detect missing Tailwind layer prelude and verify runtime setup |
| `difftale` | Astro marketing site | Accordion, reveal primitives, code, card, badge | Preserve zero-framework progressive enhancement |
| `eslint-config-basic` | Starlight/Astro documentation site | Dense forms, code tabs, reports, callouts, badges; several `.ui-*` overrides | Improve form/report recipes and stable styling hooks |
| `extensions` | No Lumen dependency | Editor-extension workspace | No action until it gains a web surface |
| `memudo.ai` | Shared React UI package used by Next.js apps | Lumen-backed button, button link, input, and label wrappers | Improve React wrapper types, intrinsic prop handling, and Tailwind setup |
| `observatory` | Astro SSR analytics application | App shell, forms, tables, charts, OTP, tabs, settings; per-component imports | Treat as the dashboard, charts, and deep-import regression consumer |
| `postlens` | Astro marketing/support site | Navigation menu, toggle, skip links, cards, links | Detect interactive components without a root `UIPrimitives` mount |
| `santi020k-theme` | Five Astro sites | Repeated site shells, forms, dialog, theme toggle, cards, links | Provide multi-entry setup guidance and a shared site-shell recipe |
| `santi020k-way` | No Lumen dependency | Non-UI project | No action |
| `website` | Large Astro content site with Tailwind | Widest adoption: 61+ source imports, local wrappers, search, timelines, media, prose | Use as the content-site and migration-compatibility regression consumer |
| `workspace-organizer` | Astro marketing site | Links, cards, skip link, toggle | Detect interactive components without a root `UIPrimitives` mount |

## Adoption profile

The most frequently imported components are:

| Component | Import references | Repositories | What the usage tells us |
| --- | ---: | ---: | --- |
| `Icon` | 51 | 8 | Icon correctness, diagnostics, and bundle cost affect nearly every composed interface |
| `Card` | 48 | 12 | Card composition is foundational and currently too root-only for wrapper-heavy apps |
| `Link` | 42 | 9 | Inherit/unstyled behavior and host-router compatibility must remain stable |
| `ButtonLink` | 28 | 12 | Link-button parity, responsive visibility, and composition are high-impact contracts |
| `Badge` | 27 | 8 | Dense docs and dashboard surfaces depend on predictable compact variants |
| `Button` | 27 | 8 | Ref forwarding, `asChild`, intrinsic props, and variant extension are core React concerns |
| `Callout` | 15 | 4 | Documentation is a major real-world product surface |
| `ThemeToggle` | 13 | 6 | Theme setup and the Astro runtime should be diagnosable automatically |
| `CodeTabs` | 8 | 4 | The recommendation to use one shared tabs controller is working |
| `Label` / `Input` / `Field` | 8 / 7 / 6 | 4 / 4 / 2 | Form primitives need a wrapper-friendly, collision-free native prop contract |

The long tail is healthy: charts, search, OTP, navigation, dialogs, timelines, media, reveals, and
form controls are all used in real applications. However, most value still comes from making the
foundation easier to configure, compose, customize, and upgrade.

## What is working

### Astro works as the reference implementation

All 12 web-facing sibling repositories that use Astro consume `@santi020k/lumen-astro`. Static
marketing pages, documentation sites, a large content site, and an SSR analytics dashboard all use
the same package without introducing a client framework.

### Progressive enhancement scales across different products

Consumers mount the single `UIPrimitives` runtime for navigation, themes, dialogs, accordions,
forms, tabs, and dashboard controls. The same setup works in small one-page sites and in
Observatory's SSR application.

### The component catalog covers the common product vocabulary

Consumers are not only using decorative primitives. They use form controls, navigation, search,
OTP, tabs, tables, charts, status, empty states, code examples, pagination, and accessibility
helpers. That validates the system as a product UI library rather than only a marketing-site theme.

### Local wrappers preserve product identity

`aaronmgz` and `memudo.ai` wrap Lumen React components instead of forking their semantics. The
wrappers preserve product-specific variants and Tailwind classes while retaining Lumen roots. This
is a useful supported pattern, not something the library should try to eliminate.

### Semantic theming is portable

The sibling theme package supplies Lumen-compatible semantic channels across five sites, while
other consumers layer their own product tokens. The public semantic vocabulary is holding up
across materially different visual identities.

## Friction observed

### 1. Setup correctness is not machine-checked

Five consumer surfaces combine Lumen with Tailwind. Only Astro Doctor and the personal website
currently import `layers.css` before Tailwind and `styles.css` after it. `dep-beacon`, the
`aaronmgz` shared UI package, and the `memudo.ai` shared UI package import Lumen and Tailwind without
the layer prelude or in the opposite order.

`postlens` and `workspace-organizer` import interactive primitives such as `NavigationMenu` or
`Toggle` but do not mount `UIPrimitives`. Those components still render, so typecheck and build
cannot reveal the missing behavior.

The correct response is not another paragraph of setup documentation. Lumen should be able to
inspect a consumer and report whether its installed components, styles, runtime, and framework
adapter agree.

### 2. Runtime requirements are not represented as shared metadata

The catalog knows what components exist, while runtime requirements are currently taught through
documentation and framework guidance. Tooling cannot reliably distinguish a static `Card` from a
`Dialog`, `Toggle`, `NavigationMenu`, or validated form that needs Astro enhancement.

Runtime metadata should be authoritative and reused by docs, MCP responses, registry output,
consumer diagnostics, and tests.

### 3. Composition stops too early at `Card`

`Card` is used in 12 repositories, but its public contract is only the surface root. The React UI
package in `aaronmgz` independently supplies `CardHeader`, `CardTitle`, `CardDescription`,
`CardContent`, and `CardFooter`. Other consumers repeat similar internal layout in application CSS.

Lumen should add optional compound card primitives across Astro, React, and Elements while keeping
the current free-form `Card` children contract. This removes repeated spacing and typography
without forcing every card into one content model.

### 4. Stable customization hooks are not specified clearly

Several mature consumers target `.ui-link`, `.ui-card`, `.ui-button`, `.ui-code-tabs`,
`.ui-theme-toggle`, `.ui-table-wrap`, and modifier classes directly. Some of these selectors are
part of the shared rendering contract, while others look like implementation details. Consumers
cannot tell which are safe to depend on through upgrades.

Lumen needs an explicit customization hierarchy:

1. public props and semantic tokens;
2. documented component-level CSS custom properties;
3. stable `data-slot` or equivalent part hooks for compound internals;
4. root `class` / `className`;
5. undocumented implementation selectors, which tooling may warn about.

### 5. React wrapper authoring exposes prop and variant friction

Both React consumers maintain aliases around Lumen. Their code shows recurring needs:

- preserve native refs and intrinsic attributes;
- avoid collisions such as native input `size` versus visual size;
- map a local variant vocabulary onto Lumen variants;
- compose buttons through `asChild`;
- add stable `data-slot` values;
- export wrapper prop types without recreating them.

The current `visualSize` direction for React `Input` should be completed across every component
where a visual prop shadows a native attribute. Public prop types and wrapper examples should be
exported and tested as supported API.

### 6. Import style and package boundaries need one clear contract

Most Astro consumers use named imports from the package root. Observatory uses the published
per-component paths and the dedicated runtime subpath throughout. Both work, but the documentation
does not explain when the subpath form is beneficial, whether it changes build performance, or
which form the project promises to preserve.

Lumen should benchmark both forms in an Astro fixture, document the result, and test their export
equivalence. If there is no material difference, the root form remains the default and an automated
migration can normalize consumers. If deep imports materially improve compile time or memory, the
CLI and MCP should recommend them for large catalogs.

### 7. Release adoption is fragmented

The sibling repositories are split between `0.3.x` and `0.4.x` declarations. Catalog indirection,
exact versions, caret ranges, minimum-release-age exclusions, and generated lock files all appear
in the fleet. The existing `lumen rollout` command is the right foundation, but it inventories
package versions rather than source-level integration health.

The rollout report should include setup diagnostics, deprecated APIs, catalog fingerprints, and
the exact verification commands run in each consumer.

### 8. Real consumer architectures are not all represented in local fixtures

The repository has package smoke tests and a Next.js smoke app, but the sibling fleet demonstrates
four distinct integration shapes worth preserving:

- Astro documentation plus Tailwind and host typography;
- Astro static marketing without Tailwind;
- Astro SSR dashboard using per-component imports, charts, tables, forms, and runtime behavior;
- React wrappers consumed by Next.js applications with Tailwind.

Compact local fixtures derived from these shapes will catch regressions without making CI depend on
the sibling repositories.

## Improvement backlog

### P0 — Consumer diagnostics and setup generation

Add `lumen doctor` or extend the non-mutating side of `lumen rollout` to scan a consumer workspace.
It should:

- resolve every Lumen manifest, catalog, and lockfile version;
- identify Astro, React, and Elements entry points;
- verify that the framework stylesheet is loaded once per application boundary;
- detect Tailwind and validate the layer prelude/import order;
- infer Astro runtime requirements from imported components and authored `data-ui-*` behavior;
- report missing, duplicate, or page-local `UIPrimitives` mounts;
- detect imports from one adapter paired with styles from another adapter;
- report deprecated props, events, and internal selector dependencies;
- emit readable text plus JSON for rollout automation and CI.

Add a non-destructive `lumen init --framework <astro|react|elements> [--tailwind]` mode that writes
or prints the canonical style and runtime setup. Keep `lumen install` as the package-manager command
helper.

Acceptance criteria:

- fixture tests reproduce the Tailwind and runtime omissions found in the sibling fleet;
- diagnostics name the file and remediation;
- static-only Astro consumers do not receive a false runtime warning;
- the command exits non-zero only for behavior or cascade failures, with advisory findings kept
  distinct.

### P0 — Authoritative behavior metadata

Extend the shared component catalog with framework-aware enhancement metadata, for example:

```ts
interface LumenComponentBehavior {
  astro: 'none' | 'ui-primitives';
  elements: 'none' | 'registered-element';
  react: 'none' | 'component' | 'hook';
}
```

Generate documentation, MCP framework guidance, diagnostics, and conformance tests from this one
contract. Include global behaviors such as form validation and toast events that may be authored
through data attributes rather than component imports.

Acceptance criteria:

- every interactive component has explicit behavior metadata;
- adding a component without metadata fails typecheck or catalog validation;
- MCP usage output and `lumen doctor` agree about required setup.

### P1 — Compound Card primitives

Add `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter` to all three
framework adapters. Preserve arbitrary `Card` children and the existing variants. Use semantic
elements only when requested; the structural helpers should not create an incorrect heading
hierarchy automatically.

Acceptance criteria:

- the `aaronmgz` card wrapper can delegate its structure to public Lumen primitives;
- spacing can be customized through documented variables or root classes;
- Astro, React, and Elements emit equivalent slot/data contracts;
- visual tests cover default, muted, interactive, glass, and unstyled cards.

### P1 — Public styling parts and variables

Audit the `.ui-*` selectors used by Astro Doctor, Commitprompt, ESLint Config Basic, Observatory,
and the personal website. For each repeated override, either expose a prop, expose a documented
custom property, or mark a stable part hook.

Start with `Card`, `Button`, `ButtonLink`, `Link`, `NavigationMenu`, `Sidebar`, `Code`, `CodeTabs`,
`ThemeToggle`, `Table`, and `Stat`. Add stable `data-slot` values to compound internals and publish
their stability level in component API metadata.

Acceptance criteria:

- consumers can customize common spacing, typography, and layout without modifier-class selectors;
- public part hooks are identical across frameworks;
- the visual suite verifies that host overrides still win in the documented cascade layer;
- `lumen doctor` can distinguish public hooks from fragile internal selectors.

### P1 — React wrapper contract

Create a documented "wrap Lumen in a local design system" recipe based on `aaronmgz` and
`memudo.ai`. Export component prop types consistently, preserve React 19 refs, support `asChild`
where semantic composition requires it, and finish auditing native-attribute collisions.

Acceptance criteria:

- Button, ButtonLink, Input, Textarea, Label, Badge, Card, and Skeleton have wrapper compile tests;
- native attributes remain available without falling back to a hand-authored native element;
- local variants and `data-slot` attributes pass through without unsafe casts;
- a Next.js fixture imports the wrappers from both server and client component boundaries.

### P1 — Reusable product recipes

Add registry recipes derived from the repeated sibling compositions:

- `docs-shell`: skip link, header navigation, theme toggle, responsive sidebar/sheet, prose,
  pagination, code, and code tabs;
- `marketing-shell`: skip link, navigation, hero actions, cards, reveal behavior, footer, and
  back-to-top;
- `dashboard-shell`: app header, sidebar, metric cards, status badges, search/range controls, empty
  state, table, and chart composition;
- `validated-form`: Field, Label, Input/NativeSelect/Textarea, messages, submit state, and
  `data-ui-form` behavior.

Recipes should remain starters, not new monolithic components. They must use public Lumen
components and tokens and include their framework-specific setup.

### P1 — Implement the Observatory chart follow-up

Use [Chart implementation learnings from Observatory](consumer-chart-implementation-learnings.md)
as the authoritative chart backlog:

1. separate data identity from the visible category label;
2. add value/category formatters;
3. add a bare or low-emphasis presentation for charts inside cards;
4. improve horizontal label margins and marker density;
5. expose actionable empty-state content.

Do not move aggregation, resampling, or product analytics logic into Lumen.

### P2 — Consumer-shaped regression fixtures

Add four compact fixtures under `apps` or `tests/fixtures`, matching the architectures listed
above. Each fixture should have a narrow build/typecheck and the relevant browser assertions.

Acceptance criteria:

- Tailwind fixtures validate computed cascade behavior, not only compilation;
- the Astro SSR fixture verifies named and deep imports, `UIPrimitives`, charts, forms, and tables;
- the static fixture verifies that no unnecessary client runtime is required;
- the React wrapper fixture measures client boundary and bundle output;
- fixtures remain local and deterministic rather than cloning sibling repositories in CI.

### P2 — Upgrade intelligence

Extend `lumen rollout` with the catalog manifest and source audit:

- show component contracts changed between installed and target versions;
- list deprecated props, events, selectors, and import paths used by the consumer;
- preserve catalog ranges and minimum-release-age exclusions;
- run the narrowest available lint, typecheck, test, build, and browser scripts;
- write a machine-readable report suitable for a multi-repository release checklist.

Before 1.0, provide automated migrations or exact fixes for the known compatibility aliases, including
`surface="glass"` and `ui:datatable-selection-change`.

### P2 — Import and icon performance evidence

Because `Icon` is the most imported component and Observatory uses deep component imports, add
repeatable measurements rather than making assumptions:

- compare Astro root imports with per-component imports for build time, memory, and output;
- measure the cost of the Lucide registry in Astro server output and React client output;
- keep unknown-icon development diagnostics and brand-pack registration covered;
- only introduce generated icon subsets or a new import recommendation if measurements justify
  the complexity.

## Execution order

1. Build the authoritative behavior metadata.
2. Build `lumen doctor` on that metadata and add the observed setup fixtures.
3. Add compound Card primitives and the stable styling-part contract.
4. Harden the React wrapper contract and its Next.js fixture.
5. Add the docs, marketing, dashboard, and validated-form recipes.
6. Implement the existing Observatory chart follow-up.
7. Extend rollout/upgrade intelligence.
8. Benchmark import and icon behavior, then act only on measured regressions.

## Success measures

The work is successful when:

- every sibling consumer can run one command and receive an accurate Lumen integration report;
- no interactive Astro primitive silently ships without its required runtime;
- every Tailwind consumer uses a verified cascade order;
- application wrappers no longer need to bypass Lumen for native prop collisions;
- the most common Card structures use public compound primitives;
- consumer CSS depends on documented tokens, parts, and variables rather than ambiguous internals;
- a Lumen release can be evaluated across the fleet with a reproducible, machine-readable report;
- local regression fixtures represent the architectures already proven in production.

## Non-goals

- Do not make Lumen own product routing, analytics aggregation, application state, or content
  models.
- Do not replace application-specific wrappers when they encode real product identity.
- Do not add a monolithic docs, marketing, or dashboard framework; keep recipes composable.
- Do not require Tailwind for any Lumen package.
- Do not treat the absence of Elements consumers in this sibling fleet as permission to reduce
  cross-framework parity.
