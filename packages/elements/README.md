# @santi020k/lumen-elements

Web Components for Lumen UI.

This package registers standards-based custom elements for the shared Lumen primitive catalog.

## Install

```bash
pnpm add @santi020k/lumen @santi020k/lumen-elements
```

Load the shared stylesheet once from your app entry or global CSS.

```css
@import "@santi020k/lumen/styles.css";
```

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

Elements emit the same `ui-*` classes and `data-ui-*` attributes as the Astro primitives. Astro
remains the reference package, and the Web Components adapter now carries matching light-DOM
behavior for DataTable, Dialog, Popover, DropdownMenu, ContextMenu, Tabs, Select, ThemeBuilder,
Toast, Tooltip, forms, Calendar, InputOTP, DateRangePicker, RichTextEditor, Schedule, Resizable,
and VirtualList: selection, validation, calendar grids, OTP segmentation, date range syncing, rich
text command, context menu, schedule drag/drop, resizable pane sizing, theme, and range events,
ARIA state, keyboard navigation, Escape/outside dismissal, focus return/trapping, native select
form participation, and the document-level toast controller events.

## Interactive behavior

Registering the elements wires behavior-heavy primitives without a framework runtime. DataTable,
Dialog, Popover, DropdownMenu, ContextMenu, Tabs, Select, ThemeBuilder, Toast, Tooltip, forms,
Calendar, InputOTP, DateRangePicker, RichTextEditor, Schedule, Resizable, and VirtualList track the
Astro runtime's data event, validation, calendar grids, OTP segmentation, date range syncing, rich
text command, context menu, schedule drag/drop, resizable pane sizing, theme export, ARIA,
keyboard, Escape, dismissal, and toast controller semantics while keeping markup declarative and
Declarative-Shadow-DOM friendly.

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

<lumen-sonner data-placement="bottom-right"></lumen-sonner>
```

You can also use the shared document events: dispatch `ui:toast` to create, `ui:toast-update` to
update, and `ui:toast-dismiss` to dismiss runtime toasts. Toast actions emit `ui:toast-action`
unless an action supplies a custom event name.

## Glass surfaces

Load `@santi020k/lumen/styles.css` once, register the elements, then use the shared glass
attributes.

```html
<lumen-card glass>Glass card</lumen-card>
<lumen-dialog glass>Glass dialog</lumen-dialog>
<lumen-popover glass>Glass popover</lumen-popover>
```
