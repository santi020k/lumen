# Migrating to Lumen

If your project currently maintains its own duplicate UI primitives or relies on an older internal design system, migrating to Lumen will standardize your component catalog around semantic HTML, progressive enhancement, and a shared set of CSS tokens.

This guide explains how to adopt Lumen incrementally.

## 1. Setup

Install the package for your framework. It includes the shared stylesheet.

For Astro projects:

```bash
pnpm add @santi020k/lumen-astro
```

Import the stylesheet globally in your main layout or Tailwind CSS entry:

```css
@import "@santi020k/lumen-astro/layers.css";
@import "tailwindcss";
@import "@santi020k/lumen-astro/styles.css";
```

If the existing app already defines common custom properties such as `--surface`, `--ink`, or
`--line`, audit them before importing Lumen:

```bash
lumen audit-tokens ./src
```

Lumen stores semantic colors as HSL channels (`220 13% 96%`) because components consume them with
`hsl(var(--token))`. Complete values such as `#fff`, `rgb(...)`, or `hsl(...)` must be renamed or
converted during incremental migration.

For interactive primitives (Dialogs, Menus, Select, etc.), mount `UIPrimitives` once in your root layout:

```astro
---
import { UIPrimitives } from '@santi020k/lumen-astro'
---

<html lang="en">
  <head>...</head>
  <body>
    <UIPrimitives />
    <slot />
  </body>
</html>
```

The dedicated runtime entry point is available in Lumen 1.x and becomes the required import in
Lumen 2. Adopt it before the major upgrade while leaving static components on the root entry point:

```astro
---
import UIPrimitives from '@santi020k/lumen-astro/runtime'
---

<UIPrimitives />
```

## 2. Replacing Components Incrementally

Because Lumen uses standalone CSS and standard semantic markup, you can migrate one component at a time without breaking your existing system.

1.  **Layouts & Wrappers**: Start with non-interactive containers like `Card`, `Container` (replace with standard markup + CSS or `Card`), `Direction`, and `Skeleton`.
2.  **Typography & Display**: Migrate `Badge`, `Avatar`, `Alert`, and `Typography`.
3.  **Forms**: Move to Lumen's `Field`, `Input`, `Label`, and `Checkbox`.
4.  **Complex Interactivity**: Finally, migrate `Dialog`, `DropdownMenu`, `DataTable`, and `Select`.

## 3. Adapting to the Event Contract

Lumen components communicate using standard DOM CustomEvents, primarily prefixed with `ui:`.

-   **Forms**: `ui:validate`, `ui:invalid`, `ui:valid`
-   **Data**: `ui:data-table-selection-change`, `ui:virtual-list-range`
-   **Interactivity**: `ui:toast`, `ui:schedule-change`, `ui:theme-change`

Listen to these events on the document, or on the component root `[data-ui-*]` elements.

### Version 1 compatibility removals

Lumen 1.0 removes the compatibility aliases that were deprecated during the pre-1.0 releases:

| Removed contract | Replacement |
| --- | --- |
| `ui:datatable-selection-change` | `ui:data-table-selection-change` |
| Overlay `surface="glass"` | `glass` or `glass="subtle"` / `glass="strong"` |

DataTable emits only the canonical event name with `{ values: string[] }` detail. Run
`lumen doctor <path>` before upgrading to find either removed contract and receive its exact
replacement.

### Preparing for version 2

Use the v2 migration preview before changing package versions:

```bash
lumen migrate-v2 ./src --dry-run
```

The migration currently covers the accepted breaking-contract candidates:

| Lumen 1.x contract | Lumen 2 contract |
| --- | --- |
| Named `UIPrimitives` import from `@santi020k/lumen-astro` | Default import from `@santi020k/lumen-astro/runtime` |
| Literal visual `size` aliases on `Input` and `NativeSelect` | `visualSize` in Astro or `visual-size` in Elements |
| `Sonner` / `SonnerProps` | `ToastViewport` / `ToastViewportProps` |
| `<lumen-sonner>` | `<lumen-toast-viewport>` |

The Sonner rename preserves placement, maximum-count configuration, and children because
`ToastViewport` is the same viewport contract under a precise public name. Ambiguous imports and
dynamic visual-size values remain manual-review findings instead of being rewritten speculatively.

## 4. Migrating from `private-website`

If you are migrating the `private-website` project to Lumen, you must map your existing CSS custom properties to Lumen's token contract.

In `private-website`'s global CSS, you likely have custom brand and background colors. Replace them with Lumen's token structure in a `data-theme` attribute block:

```css
:root[data-theme="light"] {
  color-scheme: light;
  --canvas: /* your background color in HSL format e.g. 210 20% 98% */;
  --surface: /* your card color */;
  --ink: /* your text color */;
  --brand: /* your primary brand color */;
  --accent: /* your secondary color */;
  /* ... */
}
```

By mapping your existing colors to these core HSL tokens, the entire Lumen catalog will automatically inherit your site's established brand identity without overriding individual component styles.

At a theme boundary, override the complete minimum set so typography and page backgrounds remain
consistent with component surfaces:

```css
:root[data-theme="product-light"] {
  --canvas: 210 20% 98%;
  --surface: 0 0% 100%;
  --surface-muted: 210 20% 96%;
  --surface-strong: 210 16% 90%;
  --line: 210 14% 84%;
  --ink: 220 25% 12%;
  --ink-soft: 220 14% 32%;
  --ink-muted: 220 10% 48%;
  --brand: 264 92% 47%;
  --brand-solid: 264 92% 40%;
  --brand-soft: 264 60% 94%;
  --accent: 168 76% 36%;
  --success: 142 71% 36%;
  --warning: 38 92% 50%;
  --danger: 0 84% 60%;
  --ui-font: "Montserrat", "Avenir Next", "Segoe UI", sans-serif;
}
```

## Navigation migration boundaries

`NavigationMenu` is one arrow-key focus group. Wrap only one related set of primary navigation
links; keep the site logo, theme switch, account menu, and unrelated utility actions outside that
root so they retain independent Tab stops. Use `variant="unstyled"` when adopting the navigation
semantics and runtime inside an established visual system. `Sidebar variant="unstyled"` and
`Link variant="inherit"` provide the matching low-presentation migration path.
