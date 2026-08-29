# Styling contract

Lumen customization follows a stable order:

1. component props and semantic tokens;
2. documented component custom properties;
3. stable `[data-slot]` roots and compound parts;
4. the public `class` or `className` escape hatch;
5. undocumented `.ui-*` implementation selectors.

The exported `lumenStylingContracts` record in `@santi020k/lumen-core` is authoritative. Every
listed hook has `stability: "stable"` and is shared by Astro, React, and Elements. `lumen doctor`
uses the same record when it audits consumer CSS.

## Foundational variables

| Component | Stable custom properties |
| --- | --- |
| Button | `--ui-button-font-size`, `--ui-button-font-weight`, `--ui-button-gap`, `--ui-button-min-height`, `--ui-button-padding`, `--ui-button-radius` |
| Card | `--ui-card-gap`, `--ui-card-padding`, `--ui-card-section-gap` |
| CodeTabs | `--ui-code-tabs-list-padding`, `--ui-code-tabs-tab-padding` |
| ContextNavigation | `--ui-context-navigation-gap`, `--ui-context-navigation-min-height`, `--ui-context-navigation-padding` |
| Link | `--ui-link-font-weight`, `--ui-link-underline-offset` |
| NavigationMenu | `--ui-navigation-menu-gap`, `--ui-navigation-menu-item-padding` |
| Sidebar | `--ui-sidebar-gap`, `--ui-sidebar-padding`, `--ui-sidebar-width` |
| Stat | `--ui-stat-gap`, `--ui-stat-padding` |
| Table | `--ui-table-cell-padding` |
| ThemeToggle | `--ui-theme-toggle-size` |

`CopyButton` exposes stable `copy-idle`, `copy-copied`, and `copy-error` parts
for visible state presentation. `Code` also exposes its documented color variables, including `--ui-code-bg`, `--ui-code-border`,
`--ui-code-fg`, `--ui-code-header-bg`, and `--ui-code-muted`.

## Stable parts

The foundational roots use `data-slot="button"`, `button-link`, `card`, `code`, `code-tabs`, `copy-button`, `link`,
`context-navigation`, `navigation-menu`, `sidebar`, `stat`, `table`, and `theme-toggle`.

Card additionally exposes `card-header`, `card-title`, `card-description`, `card-content`, and
`card-footer`. ContextNavigation exposes `context-navigation-context`. Stat exposes `stat-label`,
`stat-value`, `stat-description`, `stat-icon`, and `stat-trend`.

```css
[data-slot="card"] {
  --ui-card-padding: 1.5rem;
}

[data-slot="card-footer"] {
  justify-content: space-between;
}
```

Host overrides should live after Lumen styles or in Tailwind utilities. When Tailwind is present,
import Lumen's layer prelude first, Tailwind second, and Lumen styles third.
