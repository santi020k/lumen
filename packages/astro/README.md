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

The stylesheet defaults `--ui-font` to `"Montserrat", "Avenir Next", "Segoe UI", sans-serif`.
It declares the family stack but does not bundle or load font files. Load Montserrat once through
your preferred delivery path, or override `--ui-font` in application CSS.

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

`Input` and `NativeSelect` preserve the native numeric `size` attribute. Use `visualSize="sm"` or
`visualSize="lg"` for presentation. The pre-1.0 `size="sm|lg"` visual alias remains available for
incremental migrations, but new code should keep native behavior and visual styling separate.

```astro
<Input size={32} visualSize="sm" />
<NativeSelect size={8} visualSize="lg" />
```

## Context navigation

Use `ContextNavigation` below a primary header when the available links change with a selected
platform, product, or workspace. Put the stable selector or identity in the `context` slot and one
independently named `NavigationMenu` in the default slot. Long link sets scroll horizontally.

```astro
---
import { ContextNavigation, NativeSelect, NavigationMenu } from '@santi020k/lumen-astro'
---

<ContextNavigation>
  <NativeSelect slot="context" aria-label="Documentation platform" visualSize="sm">
    <option>Web</option>
    <option>Apple</option>
    <option>Android</option>
  </NativeSelect>
  <NavigationMenu aria-label="Web documentation" variant="unstyled">
    <a href="/docs/web" aria-current="page">Overview</a>
    <a href="/docs/components">Components</a>
    <a href="/docs/web/playground">Playground</a>
  </NavigationMenu>
</ContextNavigation>
```

## Forms and Astro Actions

`Form` renders a semantic form and preserves native `method`, `action`, `enctype`, autocomplete,
reset, and no-JavaScript submission. Compose it with `Field`, `Label`, `FieldError`, and
`ErrorSummary`.

Astro Actions remain application-owned. Use `accept: 'form'`, read the result with
`Astro.getActionResult()`, and pass `ActionInputError` to `normalizeAstroActionErrors()` so field
errors receive stable control IDs.

```astro
---
import { actions, isInputError } from 'astro:actions'
import { ErrorSummary, Form, normalizeAstroActionErrors } from '@santi020k/lumen-astro'

const result = Astro.getActionResult(actions.updateProfile)
const errors = result?.error && isInputError(result.error)
  ? normalizeAstroActionErrors(result.error)
  : normalizeAstroActionErrors(result?.error)
---

<Form action={actions.updateProfile} method="POST">
  <ErrorSummary {errors} />
  <!-- fields -->
</Form>
```

See the [Astro Actions form guide](https://lumen.santi020k.com/docs/forms/astro-actions).

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

`Anchor` accepts heading `depth`, `index`, and `description` metadata plus an `activationOffset`.
Its current link stays synchronized on click and scroll, including at the end of the document.
`ScrollProgress` derives reading progress from the document and pins the indicator to the top or
bottom viewport edge. Both use the single root `UIPrimitives` runtime.

```astro
---
import { Anchor, CopyButton, ScrollProgress } from '@santi020k/lumen-astro'
---

<ScrollProgress aria-label="Article reading progress" />
<Anchor items={[
  { depth: 2, href: '#install', label: 'Install' },
  { depth: 3, href: '#astro', label: 'Astro' }
]} />
```

`Progress` can be updated after hydration by dispatching `ui:progress-change` from its root with
`{ value, max? }`. Use `CopyButton` to copy arbitrary text or a referenced element without giving
non-code content `Code` semantics.

```astro
<p id="invite">Join the Lumen workspace</p>
<CopyButton target="#invite" toast>Copy invite</CopyButton>
```

## Data visualization

Use `Sparkline` beside a metric, `BarChart` for categorical comparison, `LineChart` for ordered
trends, and `PieChart` for a small part-to-whole breakdown. The chart components accept
already-aggregated series, use Lumen data-color tokens, and include a revealable semantic data
table by default.

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

`PieChart` accepts one `LumenChartSeries`; its data points become slices. It defaults to
`variant="donut"` and also supports `variant="pie"`.

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

## Kanban boards

Compose `KanbanBoard` and `KanbanColumn` with ordinary `Card` items. Give every item a stable
`data-ui-kanban-item` and add a dedicated button with `data-ui-kanban-handle`. `UIPrimitives` emits
the cancellable `ui:kanban-move-request` event for keyboard, mouse, and touch movement without
changing the DOM. Keep persistence, pending state, rollback, and status rules in the application.
Use `Empty variant="compact"` inside empty columns and `Skeleton` cards while loading.

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
variants. The older `variant="glass"` form remains supported for cards.

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
