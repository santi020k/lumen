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
@import "tailwindcss";
@import "@santi020k/lumen-astro/styles.css";
```

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

### Deprecated compatibility contracts

Lumen keeps the following aliases during the pre-1.0 migration window:

| Deprecated contract | Replacement | Removal |
| --- | --- | --- |
| `ui:datatable-selection-change` | `ui:data-table-selection-change` | Lumen 1.0 |
| Overlay `surface="glass"` | `glass` or `glass="subtle"` / `glass="strong"` | Lumen 1.0 |

DataTable currently emits both event names with the same `{ values: string[] }` detail. Subscribe
only to the replacement event in new code. The `surface="glass"` alias continues to map to
`glass={true}` until its removal.

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
