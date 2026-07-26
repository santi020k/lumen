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
@import "@santi020k/lumen-astro/layers.css";
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

## Long-form navigation

`Anchor` accepts an optional heading `depth` so article tables of contents can preserve their
hierarchy. `ScrollProgress` derives reading progress from the document and pins the indicator to
the top or bottom viewport edge. Both use the single root `UIPrimitives` runtime.

```astro
---
import { Anchor, ScrollProgress } from '@santi020k/lumen-astro'
---

<ScrollProgress aria-label="Article reading progress" />
<Anchor items={[
  { depth: 2, href: '#install', label: 'Install' },
  { depth: 3, href: '#astro', label: 'Astro' }
]} />
```

## Data visualization

Use `Sparkline` beside a metric, `BarChart` for categorical comparison, and `LineChart` for ordered
trends. The chart components accept already-aggregated series, use Lumen data-color tokens, and
include a revealable semantic data table by default.

```astro
---
import { LineChart } from '@santi020k/lumen-astro'

const series = [{
  id: 'views',
  label: 'Views',
  data: [{ x: 'Mon', y: 42 }, { x: 'Tue', y: 68 }]
}]
---

<LineChart aria-label="Views by day" heading="Website traffic" {series} />
```

Lucide intentionally excludes brand marks. For GitHub and other project-specific icons, put the
SVG in the default slot instead of passing an unsupported `name`; Astro warns about unknown named
icons during development.

## Code tabs

Use `CodeTabs` for related install commands, language variants, or configuration examples. Each
item supplies a stable value, visible label, code string, and optional language. A shared
`storageKey` keeps matching instances synchronized and remembers the reader's selection.

```astro
---
import { CodeTabs } from '@santi020k/lumen-astro'

const installCommands = [
  { value: 'pnpm', label: 'pnpm', code: 'pnpm add @santi020k/lumen-astro', language: 'bash' },
  { value: 'npm', label: 'npm', code: 'npm install @santi020k/lumen-astro', language: 'bash' }
]
---

<CodeTabs
  ariaLabel="Package manager"
  items={installCommands}
  storageKey="preferred-package-manager"
/>
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

## Motion

Use the shared `fast`, `standard`, and `slow` duration vocabulary across motion primitives.
`ScrollReveal` handles one entrance, `RevealGroup` staggers direct children, and `AnimatedNumber`
animates a formatted metric while preserving a stable accessible value. All three keep their final
content readable without JavaScript and honor reduced-motion preferences.

```astro
<ScrollReveal animation="slide-up" duration="slow">
  <h2>Release highlights</h2>
</ScrollReveal>

<RevealGroup stagger={80}>
  <Card>Plan</Card>
  <Card>Build</Card>
  <Card>Ship</Card>
</RevealGroup>

<AnimatedNumber decimals={1} suffix="%" value={99.8} />
```

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

## Semantic stat roots

`Stat` renders a `div` by default. Use `as="article"` when the metric and its supporting content
form a standalone item, or `as="section"` when it is a labeled region in a larger view.

```astro
<Stat as="article" label="Active workspaces" value="1,234" variant="accent">
  <p>Across all production organizations.</p>
</Stat>
```

Use `variant="default"` for the original neutral surface, `variant="accent"` for a featured metric,
or `variant="glass"` for selective translucency.
