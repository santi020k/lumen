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

## Frame borders and corners

Assign an outer border and corner clipping to one frame. AspectRatio, CoverImage, DeviceFrame,
ImageComparison, MediaViewport, and the media part of MediaThumbnail flatten their media's inner
corners. This includes optimized `picture` content and public Image children, regardless of the
order selective component styles load. Set the outer frame's geometry rather than adding another
rounded border to flush media. Standalone Image still owns its `radius` prop. Image wrappers
pass their radius and fit to a native `img` child. AspectRatio fills optimized picture content
without replacing an Image child’s explicit fit mode.

Card keeps overflow visible for focus rings and overlays. Put clipped media inside a dedicated
frame; do not clip an entire interactive Card. Keep padded, independently bordered surfaces inset.

Prose preserves the borders, spacing, captions, and media corners of Lumen figure components.
Editorial figure framing applies to authored article figures. Use `Image radius="none"` inside
those native figures so the article frame owns the shared image/caption edge. Prose's native-link
focus treatment does not replace public Link or ButtonLink geometry.

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
| ThemeToggle | `--ui-theme-toggle-size`, `--ui-theme-toggle-icon-size` |

`CopyButton` exposes stable `copy-idle`, `copy-copied`, and `copy-error` parts
for visible state presentation. `Code` also exposes its documented color variables, including `--ui-code-bg`, `--ui-code-border`,
`--ui-code-fg`, `--ui-code-header-bg`, and `--ui-code-muted`.

## Stable parts

The foundational roots use `data-slot="button"`, `button-link`, `card`, `code`, `code-tabs`, `copy-button`, `link`,
`context-navigation`, `navigation-menu`, `sidebar`, `stat`, `table`, and `theme-toggle`.

Card additionally exposes `card-header`, `card-title`, `card-description`, `card-content`, and
`card-footer`. ContextNavigation exposes `context-navigation-context`. Stat exposes `stat-label`,
`stat-value`, `stat-description`, `stat-icon`, and `stat-trend`.

Timeline exposes `timeline`, `timeline-item`, `timeline-item-tail`, `timeline-item-dot`, and
`timeline-item-content`. Astro and React expose item parts through `TimelineItem`; Elements decorates
native `li` children of `lumen-timeline`, preserving their DOM nodes and an optional `slot="dot"`
child. `defineLumenTimeline` from `@santi020k/lumen-elements/components/timeline` registers the
same constructor as full registration. Import `styles/components/timeline.css` with the foundation.

ThemeToggle's default icons expose `theme-toggle-sun` and `theme-toggle-moon`; Elements retains
consumer-supplied content and supplies the icon pair when empty. WorldMap exposes `world-map`,
`world-map-frame`, and `world-map-zoom-controls` (when zoom controls are enabled). These hooks let
consumers adjust presentation without replacing interaction markup or targeting private classes.

```css
[data-slot="card"] {
  --ui-card-padding: 1.5rem;
}

[data-slot="card-footer"] {
  justify-content: space-between;
}
```

Host overrides should live after Lumen styles or in Tailwind utilities. When Tailwind is present,
import Lumen's layer prelude first, Tailwind second, and Lumen styles third. The optional
`tailwind.css` export comes last and maps semantic colors to Tailwind v4 utilities using
`@theme inline`, preserving nested theme scopes. See the
[Tailwind guide](https://lumen.santi020k.com/docs/web/tailwind) for complete framework setup.

### Phone fields

`PhoneInput` owns one continuous frame with `data-slot="phone-input"`, the compact selector at
`data-slot="phone-country"`, and `data-slot="country-flag"` artwork. Use `--ui-phone-height`,
`--ui-phone-padding`, and `--ui-phone-country-gap` to tune sizing without hiding or replacing native
controls. Default sizes are 40, 44, and 48 pixels; the number text stays at 16 pixels on web to avoid
mobile focus zoom. Disabled and read-only states lock the country selector; error borders, messages,
and focus indicators remain synchronized. `CountryFlag` and `PhoneNumber` share the same artwork.

Astro and React `id` targets the number input; Elements use `input-id`. Pass native attributes through
Astro/React `inputProps`, and use React `inputRef` for form integration. Remove application flag
overlays and DOM patches when adopting v4. Country menus retain native platform selection behavior.
