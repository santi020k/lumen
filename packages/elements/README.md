# @santi020k/lumen-elements

Web Components for Lumen UI.

This package registers standards-based custom elements for the shared Lumen primitive catalog.

## Install

```bash
pnpm add @santi020k/lumen-elements
```

Load the shared stylesheet once from your app entry or global CSS.

```css
@import "@santi020k/lumen-elements/styles.css";
```

The stylesheet defaults `--ui-font` to `"Montserrat", "Avenir Next", "Segoe UI", sans-serif`.
It declares the family stack but does not bundle or load font files. Load Montserrat once through
your preferred delivery path, or override `--ui-font` in application CSS.

## Usage

Register the elements once, then use `lumen-*` tags anywhere HTML is valid.

```html
<script type="module">
  import { defineLumenElements } from '@santi020k/lumen-elements/define'

  defineLumenElements()
</script>

<lumen-card>
  <label for="email">Email</label>
  <lumen-input id="email" type="email" placeholder="you@example.com"></lumen-input>
  <lumen-button>Subscribe</lumen-button>
</lumen-card>
```

Use `lumen-icon` for Lucide icons by name across framework adapters.

```html
<lumen-button variant="secondary">
  <lumen-icon name="wand-sparkles" decorative></lumen-icon>
  Generate
</lumen-button>
<lumen-icon name="search" label="Search"></lumen-icon>
```

Use `lumen-scroll-progress` on long reading surfaces. Registration supplies its scroll behavior,
accessible value, and top or bottom positioning.

```html
<lumen-scroll-progress
  aria-label="Article reading progress"
  position="top"
></lumen-scroll-progress>
```

## Statistics

Use `variant="default"` for the original neutral surface, `variant="accent"` for a featured metric,
or `variant="glass"` for selective translucency.

```html
<lumen-stat label="Active workspaces" value="1,234" variant="accent">
  <p>Across all production organizations.</p>
</lumen-stat>
```

## Data visualization

Set serializable `series` data through the JavaScript property for application data. The JSON
attribute form is useful for static HTML and server output.

```html
<lumen-line-chart
  aria-label="Views by day"
  heading="Website traffic"
  series='[{"id":"views","label":"Views","data":[{"x":"Mon","y":42},{"x":"Tue","y":68}]}]'
></lumen-line-chart>
```

`lumen-sparkline` also accepts comma-separated or JSON `values`. Bar and line charts include a
revealable semantic table unless `show-table="false"` is set.

## Optimized images

Image optimization belongs to the host framework or CDN. Keep its generated `picture`, `srcset`,
and `sizes` output, and put Lumen's `ui-image` class on the final `img`. This works with optimized
markup from Nuxt, SvelteKit, a CMS, an image CDN, or a static build pipeline without sending the
image through a second component.

```html
<picture>
  <source srcset="/team.avif" type="image/avif">
  <source srcset="/team.webp" type="image/webp">
  <img
    alt="Team collaborating around a table"
    class="ui-image"
    decoding="async"
    height="800"
    loading="lazy"
    sizes="(max-width: 768px) 100vw, 50vw"
    src="/team.jpg"
    width="1200"
  >
</picture>
```

Add `ui-image--invert-dark` only to monochrome artwork that needs inversion on dark themes.

Elements emit the same `ui-*` classes and `data-ui-*` attributes as the Astro primitives. Astro
remains the reference package, and the Web Components adapter now carries matching light-DOM
behavior for DataTable, Dialog, Popover, DropdownMenu, ContextMenu, Tabs, Select, ThemeBuilder,
Toast, Tooltip, forms, Calendar, InputOTP, DateRangePicker, RichTextEditor, Schedule, Resizable,
VirtualList, FileUpload, Tour, Anchor, Transfer, Mentions, Cascader, and TreeSelect: selection,
validation, calendar grids, OTP segmentation, date range syncing, rich text command, context menu,
schedule and file drag/drop, anchored tours, scroll spy, collection transfer, mention insertion,
hierarchical selection, resizable pane sizing, theme, and range events, ARIA state, keyboard
navigation, Escape/outside dismissal, focus return/trapping, native form participation, and the
document-level toast controller events.

## Interactive behavior

Registering the elements wires behavior-heavy primitives without a framework runtime. DataTable,
Dialog, Popover, DropdownMenu, ContextMenu, Tabs, Select, ThemeBuilder, Toast, Tooltip, forms,
Calendar, InputOTP, DateRangePicker, RichTextEditor, Schedule, Resizable, and VirtualList track the
Astro runtime's data event, validation, calendar grids, OTP segmentation, date range syncing, rich
text command, context menu, schedule drag/drop, resizable pane sizing, theme export, ARIA,
keyboard, Escape, dismissal, and toast controller semantics while keeping markup declarative and
Declarative-Shadow-DOM friendly.
FileUpload, Tour, Anchor, ScrollProgress, Transfer, Mentions, Cascader, and TreeSelect also run directly through
their registered custom elements; no Astro runtime or host controller is required.
Rich text controls may provide `data-ui-editor-value` for commands such as `formatBlock` and
`createLink`; editable surfaces emit `ui:editor-change` with both HTML and plain text, support common
formatting shortcuts, and keep toggle controls synchronized through `aria-pressed`.

```html
<script type="module">
  import { defineLumenElements, LumenToast } from '@santi020k/lumen-elements'

  defineLumenElements()

  LumenToast.create({
    title: 'Saved',
    description: 'Your changes are live.',
    variant: 'success'
  })
</script>

```

You can also use the shared document events: dispatch `ui:toast` to create, `ui:toast-update` to
update, and `ui:toast-dismiss` to dismiss runtime toasts. Toast actions emit `ui:toast-action`
unless an action supplies a custom event name.

## Motion

The elements adapter exposes the same motion vocabulary as Astro and React. Use
`lumen-scroll-reveal` for one entrance, `lumen-reveal-group` for a short staggered sequence, and
`lumen-animated-number` for meaningful metric changes. They honor reduced-motion preferences.

```html
<lumen-reveal-group animation="slide-up" stagger="80">
  <lumen-card>Plan</lumen-card>
  <lumen-card>Build</lumen-card>
  <lumen-card>Ship</lumen-card>
</lumen-reveal-group>

<lumen-animated-number decimals="1" suffix="%" value="99.8"></lumen-animated-number>
```

## Glass surfaces

Load `@santi020k/lumen-elements/styles.css` once, register the elements, then use the shared glass
attributes.

```html
<lumen-card glass>Glass card</lumen-card>
<lumen-dialog glass>Glass dialog</lumen-dialog>
<lumen-popover glass>Glass popover</lumen-popover>
<lumen-date-picker glass="subtle"></lumen-date-picker>
<lumen-select glass="strong"></lumen-select>
```
