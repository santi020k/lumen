# Lumen migration — component gap analysis

Date: 2026-07-22. Compared each sibling website in `~/Projects/santi020k` against the Lumen catalog (104 Astro components + shared core catalog). Goal: find components the websites use that Lumen does **not** yet cover, ahead of replacing their current components with Lumen.

## Headline

Coverage is effectively complete. The two real component libraries — `aaronmgz/packages/ui` (52 components) and `memudo.ai/packages/ui` (60 components) — are **100% subsets of Lumen**. Nothing in either needs to be added before migration.

The only components not already in Lumen are **5 thin Astro compositions** in the `website` portfolio, and each is a small variant of an existing Lumen primitive rather than a genuinely new component. There are **no blocking gaps**.

## Project by project

### aaronmgz/packages/ui — React (shadcn/radix)
52 components: accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, button-group, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, empty, field, hover-card, input, input-group, input-otp, item, kbd, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, spinner, switch, table, tabs, textarea, toggle, toggle-group, tooltip.

Result: **every one exists in Lumen.** No gaps. Consumed by `apps/web` (Astro), `apps/admin` and `apps/baby-shower` (Next).

### memudo.ai/packages/ui — React (shadcn + base-ui)
60 components: superset of the aaronmgz set plus attachment, bubble, combobox, direction, marker, message, message-scroller, native-select.

Result: **every one exists in Lumen.** No gaps. Consumed by the broker/web/admin/docs/ops/deck Next apps.

### website — Astro portfolio (its own atom/molecule/organism system)
This is the only project with its own primitives rather than the shared React packages. Of 21 atoms, 16 map 1:1 to Lumen (AnimatedLogo, AnimatedPortrait, BackToTop, Badge, Button, ButtonLink, CoverImage, Eyebrow, FloatingBadge, FormattedDate, GradientDivider, Pill, Prose, Separator, SkipLink, ThemeToggle).

The 5 that aren't first-class Lumen components — all thin wrappers over existing primitives:

| website atom | Closest Lumen primitive | What's actually missing |
|---|---|---|
| `ParticlesBackground` | `Particles` | Nothing — Lumen's `Particles` already has the identical `density: low\|medium\|high` prop. Direct swap. |
| `MiniNote` | `Note` | Only the `borderPosition: left\|right\|none` accent-border variant. Add as a `Note` variant. |
| `SocialIconLink` | `ButtonLink` | An icon-only, round (`size-11`, `rounded-full`) variant. Add as a `ButtonLink` shape/variant. |
| `PillCount` | `Pill` / `Badge` | A count affix with `group-hover` styling. Fold into `Pill` as a count slot. |
| `HoverableCover` | `CoverImage` | Hover-lift + optional bottom-gradient overlay wrapper. Add as `CoverImage` props (`hover`, `showBottomGradient`). |

The website's molecules and organisms (PostCard, ProjectCard, PageHero, SiteHeader, CareerTimeline, StatsGrid, etc.) are **app-specific compositions** of primitives, not library candidates — they should stay in the app and be rebuilt on top of Lumen primitives.

### postlens/apps/website — Astro
Only 4 page-level components (HomePage, SupportPage, launch-cta, seo-head). No primitive library, no gaps.

### aaronmgz & memudo.ai Next/Astro apps
App-level sections only (Hero, FeatureCard, MetricCard, SectionHeader, auth-panel, match-preview, deck). All compose primitives already in Lumen. Nothing to add.

## Recommendation

You can migrate all of these onto Lumen today with no new components required.

## Parity additions — implemented 2026-07-22

The 5 variant-level gaps have been closed in Lumen (Astro reference + React + shared CSS contract, so Web Components inherit them via the modifier classes):

1. `CoverImage` — added `hover` (lift on hover) and `showBottomGradient` props → covers `HoverableCover`.
2. `ButtonLink` — added `shape="icon"` round icon-only variant → covers `SocialIconLink`.
3. `Note` — added `borderPosition="left" | "right" | "none"` accent-border variant → covers `MiniNote`.
4. `Pill` — added a `count` affix prop → covers `PillCount`.
5. `Particles` — already at parity (`density` prop); `ParticlesBackground` is a straight replacement.

New CSS modifier classes in `packages/astro/styles/lumen.css`: `ui-note--border-{left,right,none}`, `ui-pill__count`, `ui-cover-image--hover`, `ui-cover-image__bottom-gradient`, `ui-button-link--icon`.

### Per-framework wiring (follows each package's architecture)

- **Astro** (reference): props on the component; class-based variants toggle utility/`ui-*` classes, content variants (`count`, `showBottomGradient`) render markup. No JS added — all five are CSS/markup, so no `<script>` was needed (the existing magnetic-button script in `ButtonLink.astro` is untouched).
- **React**: matching props on the passthrough components; pure render, no JS logic, so no hook was needed (hooks in `hooks.tsx` are reserved for interactive/behavioral components like Dialog, Tabs, Select).
- **Elements** (web components): the class-based variants are wired through `attributeClasses` in `define.ts` exactly like `Badge`/`Button`/`Marker` — `Note` `border-position` (default `left`), `ButtonLink` `shape="icon"`, `CoverImage` `hover` (boolean). The three attribute names were added to `observedAttributeNames` so dynamic updates re-apply. Content variants (`count`, bottom gradient) are author-supplied markup, consistent with the thin class-mapper model.

### Verification

- `react`, `astro`, and `elements` all typecheck clean (`tsc --noEmit`).
- Every emitted `ui-*` class is defined in `lumen.css` (no dangling classes).
- Elements behavior smoke-tested in jsdom against the built `define.js`: all 8 cases pass, including default `border-position=left`, explicit `right`/`none`, `shape=icon`, boolean `hover`, and a dynamic `setAttribute('border-position','right')` re-render.
- The full vitest suite can't run in this sandbox (the installed `rolldown`/`esbuild` native binaries are built for the host Mac, not Linux). Run `pnpm test` locally to confirm.

All changes are additive and backward compatible. Everything else is a direct swap.

## Competitor-parity additions — implemented 2026-07-23

Beyond the sibling-project audit above, a comparison against the larger enterprise libraries (Ant Design, MUI, Mantine, Chakra, React Aria) surfaced sixteen patterns Lumen lacked. All were added across `core` (catalog), Astro (reference), React, Elements (class config), shared `lumen.css`, and — for the interactive ones — the Astro progressive-enhancement runtime.

| Component | Tier | Behavior |
|---|---|---|
| Stepper | high | Static; `orientation` + `data-state` step markers. |
| FileUpload | high | Runtime drag-and-drop over a native file input; sets `input.files`, dispatches `change`. |
| Tour | high | Runtime step navigation, target positioning, `window.LumenTours[id]()` opener. |
| Anchor | high | Runtime scroll-spy via `IntersectionObserver`, sets `data-active` on the in-view link. |
| Segmented | minor | Native radio group styled as a segmented control (zero JS). |
| Toolbar | minor | Reuses the existing roving-focus runtime (`[data-ui-toolbar]`). |
| Descriptions | minor | Static `<dl>` grid, `columns` prop. |
| Popconfirm | minor | Reuses the popover disclosure runtime (`data-ui-popover`). |
| Transfer | niche | Runtime moves checked items between lists, emits `ui:transfer-change`. |
| Cascader | niche | Popover-backed column reveal, emits `ui:cascader-change`. |
| TreeSelect | niche | Popover-backed tree value selection, emits `ui:tree-select-change`. |
| Mentions | niche | Runtime `@`-trigger filtering + insertion into a textarea. |
| QRCode | niche | Static display frame for a server-rendered QR image/svg (no encoder dependency). |
| Watermark | niche | CSS repeating diagonal overlay via `data-text`. |
| Affix | niche | CSS `position: sticky` wrapper with `offset`/`position`. |
| SpeedDial | niche | CSS focus-within/hover action reveal, four `direction` variants. |

### Verification
- `core`, `react`, and `elements` typecheck clean (`tsc --noEmit`).
- Every `ui-*` class emitted by the new components is defined in `lumen.css` (no dangling classes).
- Registry data stays in sync (the `all-components` set references the component directory).
- The Astro build and full vitest suite can't run in the current sandbox (the installed `rolldown`/`esbuild` native binaries are host-Mac, not Linux). Run `pnpm validate` locally to confirm.

### Remaining follow-ups
- Docs-site examples in `apps/docs/src/examples/` for each of the sixteen (not gated by tests; needed to meet the per-component "all variants/states" example bar).
- Web Components runtime parity: Elements ships the class-config shell for all sixteen; the interactive behaviors (FileUpload, Tour, Anchor, Transfer, Mentions, Cascader, TreeSelect) currently run through the Astro runtime and should be mirrored into `packages/elements/src/define.ts` for standalone custom-element consumers.
