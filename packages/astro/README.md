# @santi020k/lumen-astro

Production-ready Astro primitives for Lumen UI. The stylesheet is standalone CSS, so no Tailwind
configuration is required to render the components.

## Install

```bash
pnpm add @santi020k/lumen-astro
```

Import the CSS once in your root layout and mount `UIPrimitives` once if you use interactive
components such as dialogs, menus, popovers, tabs, carousels, toggles, command lists, or toasts.

```css
@import "@santi020k/lumen-astro/styles.css";
```

With Tailwind, keep the Lumen import in the same shared CSS entry:

```css
@import "tailwindcss";
@import "@santi020k/lumen-astro/styles.css";
```

```astro
---
import { Button, Card, Input } from '@santi020k/lumen-astro'
---

<Card>
  <label for="email">Email</label>
  <Input id="email" type="email" placeholder="you@example.com" />
  <Button>Subscribe</Button>
</Card>
```

The package ships the complete Astro primitive catalog plus a small progressive-enhancement runtime for dialogs, popovers, tabs, menus, command filtering, carousels, and toasts.

## Glass surfaces

Lumen includes glassmorphism tokens and reusable classes in the shared stylesheet. Cards use a
variant, while overlays and navigation primitives use a surface prop so semantic variants remain
available.

```astro
<Card variant="glass">Glass card</Card>
<Dialog surface="glass">Glass dialog</Dialog>
<Popover surface="glass">Glass popover</Popover>
```
