# @santi020k/lumen-astro

Production-ready Astro primitives for Lumen UI. The stylesheet is standalone CSS, so no Tailwind
configuration is required to render the components.

## Install

```bash
pnpm add @santi020k/lumen-astro
```

Import the CSS once in your root layout and mount `UIPrimitives` once in that same app shell if you
use interactive components such as dialogs, menus, popovers, tabs, carousels, toggles, command
lists, or toasts. Do not add `UIPrimitives` beside each component instance; one root include
enhances all matching Lumen markup on the page.

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
import { UIPrimitives } from '@santi020k/lumen-astro'
---

<UIPrimitives />
<slot />
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

Use `Icon` for Lucide icons by name across framework adapters.

```astro
---
import { Button, Icon } from '@santi020k/lumen-astro'
---

<Button variant="secondary">
  <Icon name="wand-sparkles" decorative />
  Generate
</Button>
<Icon name="search" label="Search" />
```

## Optimized images

Lumen's Astro `Image` delegates to `astro:assets`, so imported image metadata, responsive layouts,
generated `srcset` values, output formats, quality, and remote-size inference stay available. It
loads lazily by default. Use `loading="eager"` and `fetchpriority="high"` only for the single image
that is likely to be the page's LCP image.

```astro
---
import { Image } from '@santi020k/lumen-astro'
import hero from '../assets/hero.jpg'
---

<Image
  alt="Team collaborating around a table"
  layout="full-width"
  quality="high"
  src={hero}
/>
```

For monochrome artwork whose pixels were authored for a light background, add `invertOnDark`.
Colorful photography should keep the default so its colors remain unchanged.

`AnimatedLogo` accepts your own inline SVG rather than imposing brand artwork. Put the accessible
name on the SVG itself.

```astro
---
import { AnimatedLogo } from '@santi020k/lumen-astro'
---

<AnimatedLogo style="height: 3rem">
  <svg aria-label="Acme" role="img" viewBox="0 0 120 32">
    <!-- Your logo artwork -->
  </svg>
</AnimatedLogo>
```

For a choreographed logo, set `animation="sequence"` and mark individual SVG layers with
`data-ui-logo-pop`, `data-ui-logo-draw`, or `data-ui-logo-reveal`. Timing can be adjusted per layer
with `--ui-logo-delay`.

The package ships the complete Astro primitive catalog plus a small progressive-enhancement runtime for dialogs, popovers, tabs, menus, command filtering, carousels, and toasts.

## Glass surfaces

Lumen includes glassmorphism tokens and reusable classes in the shared stylesheet. Cards use a
boolean prop, and overlays or navigation primitives use the same prop while preserving semantic
variants. The older `variant="glass"` form remains supported for cards. Overlay
`surface="glass"` props are deprecated compatibility aliases that map to `glass`.

```astro
<Card glass>Glass card</Card>
<Dialog glass>Glass dialog</Dialog>
<Popover glass>Glass popover</Popover>
<DatePicker glass="subtle" />
<Select glass="strong" options={['Astro', 'React']} />
```
