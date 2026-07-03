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
remains the reference package for the bundled progressive-enhancement runtime; wire equivalent client
behavior in your app for behavior-heavy primitives such as dialogs, menus, tabs, and toasts.

## Glass surfaces

Load `@santi020k/lumen-astro/styles.css` once, register the elements, then use the shared glass
attributes.

```html
<lumen-card glass>Glass card</lumen-card>
<lumen-dialog glass>Glass dialog</lumen-dialog>
<lumen-popover glass>Glass popover</lumen-popover>
```
