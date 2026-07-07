# @santi020k/lumen-elements

Web Components for Lumen UI.

This package registers standards-based custom elements for the shared Lumen primitive catalog.

## Install

```bash
pnpm add @santi020k/lumen-elements @santi020k/lumen-astro
```

Load the shared stylesheet once from your app entry or global CSS.

```css
@import "@santi020k/lumen-astro/styles.css";
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

Elements emit the same `ui-*` classes and `data-ui-*` attributes as the Astro primitives. Astro
remains the reference package, and the Web Components adapter now carries matching light-DOM
behavior for DataTable, Dialog, Popover, DropdownMenu, Tabs, Select, ThemeBuilder, Toast, Tooltip,
and VirtualList: selection, theme, and range events, ARIA state, keyboard navigation,
Escape/outside dismissal, focus return/trapping, native select form participation, and the
document-level toast controller events.

## Interactive behavior

Registering the elements wires behavior-heavy primitives without a framework runtime. DataTable,
Dialog, Popover, DropdownMenu, Tabs, Select, ThemeBuilder, Toast, Tooltip, and VirtualList track
the Astro runtime's data event, theme export, ARIA, keyboard, Escape, dismissal, and toast
controller semantics while keeping markup declarative and Declarative-Shadow-DOM friendly.

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

Load `@santi020k/lumen-astro/styles.css` once, register the elements, then use the shared glass
attributes.

```html
<lumen-card glass>Glass card</lumen-card>
<lumen-dialog glass>Glass dialog</lumen-dialog>
<lumen-popover glass>Glass popover</lumen-popover>
```
