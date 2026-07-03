# @santi020k/lumen-astro

Production-ready Astro primitives for Lumen UI. The stylesheet is standalone CSS, so no Tailwind
configuration is required to render the components.

## Install

```bash
pnpm add @santi020k/lumen-astro
```

Import the CSS once in your root layout and mount `UIPrimitives` once if you use interactive
components such as dialogs, menus, popovers, tabs, carousels, toggles, command lists, or toasts.

```astro
---
import { Button, Card, Input } from '@santi020k/lumen-astro'
import '@santi020k/lumen-astro/styles.css'
---

<Card>
  <label for="email">Email</label>
  <Input id="email" type="email" placeholder="you@example.com" />
  <Button>Subscribe</Button>
</Card>
```

The package ships the complete Astro primitive catalog plus a small progressive-enhancement runtime for dialogs, popovers, tabs, menus, command filtering, carousels, and toasts.
