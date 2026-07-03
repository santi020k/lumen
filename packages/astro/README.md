# @santi020k/lumen-astro

Astro implementation of Lumen UI.

```astro
---
import { Button, Card, Input, UIPrimitives } from '@santi020k/lumen-astro'
import '@santi020k/lumen-astro/styles.css'
---

<UIPrimitives />

<Card>
  <Input aria-label="Email" type="email" />
  <Button>Subscribe</Button>
</Card>
```

The package ships the complete Astro primitive catalog plus a small progressive-enhancement runtime for dialogs, popovers, tabs, menus, command filtering, carousels, and toasts.
