# @santi020k/lumen-react

React primitives for Lumen UI.

This package provides React components for the shared Lumen primitive catalog using the standalone
Lumen stylesheet.

## Install

```bash
pnpm add @santi020k/lumen-react
```

Load the shared stylesheet once from your app entry or global CSS.

```tsx
import '@santi020k/lumen-react/styles.css'
```

The stylesheet defaults `--ui-font` to `"Montserrat", "Avenir Next", "Segoe UI", sans-serif`.
It declares the family stack but does not bundle or load font files. Load Montserrat once through
your preferred delivery path, or override `--ui-font` in application CSS.

## Usage

```tsx
import { Button, Card, Input } from '@santi020k/lumen-react'

export function SubscribeForm() {
  return (
    <Card>
      <label htmlFor="email">Email</label>
      <Input id="email" type="email" placeholder="you@example.com" />
      <Button>Subscribe</Button>
    </Card>
  )
}
```

## Forms

`Form`, `Field`, `Label`, `FieldError`, and `ErrorSummary` provide the presentation and
accessibility contract without replacing form state. Native-backed controls forward refs to their
submitted DOM controls and work directly with React Hook Form's `register()`.

For controlled composites, install the optional adapter:

```bash
pnpm add @santi020k/lumen-react-hook-form react-hook-form
```

It exports adapters for `Select`, `DatePicker`, `InputOTP`, and `ListBox`. React Hook Form owns
validation, dirty/touched state, and submission state in this mode; do not also mount
`useFormValidation` unless two validation sources are intentional.

Zod and Yup schemas work through the official `@hookform/resolvers` package. Schema libraries stay
optional application dependencies; Lumen consumes the resulting React Hook Form field errors
without wrapping or changing the resolver contract.

See the [forms guide](https://lumen.santi020k.com/docs/forms/react-hook-form) for typed examples.

For long articles, `Anchor` accepts optional `depth`, `index`, and `description` metadata plus an
`activationOffset`. It synchronizes the current link on click and scroll. `ScrollProgress` tracks
the document without requiring a separate hook.

```tsx
import { Anchor, ScrollProgress } from '@santi020k/lumen-react'

<ScrollProgress aria-label="Article reading progress" />
<Anchor items={[
  { depth: 2, href: '#install', label: 'Install' },
  { depth: 3, href: '#react', label: 'React' }
]} />
```

Use `CopyButton` for clipboard actions on generated names, descriptions, messages, and links. Pass
either a `value` or a `target` selector; `toast` opts into Lumen Toast feedback.

```tsx
<CopyButton value="https://lumen.santi020k.com" toast>Copy link</CopyButton>
```

## Data visualization

`Sparkline`, `BarChart`, `LineChart`, and `PieChart` use the shared `LumenChartSeries` contract and
render without an external charting dependency. Data charts expose a revealable semantic table by
default. `PieChart` accepts one series and defaults to a donut presentation.

```tsx
import { LineChart } from '@santi020k/lumen-react'

const series = [{
  id: 'views',
  label: 'Views',
  data: [{ x: 'Mon', y: 42 }, { x: 'Tue', y: 68 }]
}]

<LineChart aria-label="Views by day" heading="Website traffic" series={series} />
```

## Next.js and server components

The package entry is marked as a client module because the full catalog includes stateful
components and behavior hooks. Next.js Server Components can import and render Lumen components;
Next keeps the Lumen subtree behind the client boundary instead of evaluating React client APIs in
the server runtime.

```tsx
// app/page.tsx — this file remains a Server Component.
import { Badge, Card } from '@santi020k/lumen-react'

export default function Page() {
  return (
    <Card>
      <Badge>Ready</Badge>
      Server-rendered page content
    </Card>
  )
}
```

This boundary is specific to React environments that recognize the `"use client"` directive.
Other React applications continue to consume the same package and exports normally.

## Compatibility wrappers

The common wrapper primitives preserve their underlying DOM handles with React 19's ref-as-prop
contract. `Button`, `ButtonLink`, `Link`, `Input`, `Textarea`, `Label`, `Badge`, `Card`, and
`Skeleton` accept `ref` directly. Use `Button asChild` or `ButtonLink asChild` to apply the
corresponding contract to one existing React element without adding another DOM node:

```tsx
import { Button, ButtonLink, NativeSelect } from '@santi020k/lumen-react'
import NextLink from 'next/link'

<Button asChild variant="secondary">
  <NextLink href="/projects">Projects</NextLink>
</Button>

<ButtonLink asChild variant="ghost">
  <NextLink href="/docs">Docs</NextLink>
</ButtonLink>
```

`Input` and `NativeSelect` keep the native numeric `size` attribute. Use `visualSize="sm"` or
`visualSize="lg"` for Lumen's visual size modifiers:

```tsx
<Input size={32} visualSize="sm" />
<NativeSelect size={8} visualSize="lg" />
```

## Context navigation

Use `ContextNavigation` below a primary header when links change with a selected platform,
product, or workspace. Pass the stable selector or identity through `context` and compose the
related links with one independently named `NavigationMenu`. Long link sets scroll horizontally.

```tsx
import { ContextNavigation, NativeSelect, NavigationMenu } from '@santi020k/lumen-react'

<ContextNavigation
  context={(
    <NativeSelect aria-label="Documentation platform" visualSize="sm">
      <option>Web</option>
      <option>Apple</option>
      <option>Android</option>
    </NativeSelect>
  )}
>
  <NavigationMenu aria-label="Web documentation" variant="unstyled">
    <a href="/docs/web" aria-current="page">Overview</a>
    <a href="/docs/components">Components</a>
    <a href="/docs/web/playground">Playground</a>
  </NavigationMenu>
</ContextNavigation>
```

Use `Icon` for Lucide icons by name across framework adapters.

```tsx
import { Button, Icon } from '@santi020k/lumen-react'

export function SettingsButton() {
  return (
    <Button variant="secondary">
      <Icon name="wand-sparkles" decorative />
      Generate
    </Button>
  )
}
```

## Optimized images

The React `Image` uses a lazy native `img` by default. In Next.js, pass `next/image` through `as` so
Next keeps control of image sizing, format negotiation, caching, placeholders, and preloading while
Lumen supplies its presentation class.

```tsx
import NextImage from 'next/image'
import { Image as LumenImage } from '@santi020k/lumen-react'

<LumenImage
  alt="Team collaborating around a table"
  as={NextImage}
  height={800}
  sizes="(max-width: 768px) 100vw, 50vw"
  src="/team.jpg"
  width={1200}
/>
```

Keep the default lazy loading for images below the fold. For the single likely LCP image, follow
your framework's preload or fetch-priority guidance. `invertOnDark` is available for monochrome
artwork authored for light surfaces; leave it off for photos and colorful illustrations.

`AnimatedLogo` accepts your own inline SVG rather than imposing brand artwork. Put the accessible
name on the SVG itself.

```tsx
import { AnimatedLogo } from '@santi020k/lumen-react'

<AnimatedLogo style={{ height: '3rem' }}>
  <svg aria-label="Acme" role="img" viewBox="0 0 120 32">
    {/* Your logo artwork */}
  </svg>
</AnimatedLogo>
```

For a choreographed logo, set `animation="sequence"` and mark individual SVG layers with
`data-ui-logo-pop`, `data-ui-logo-draw`, or `data-ui-logo-reveal`. Timing can be adjusted per layer
with `--ui-logo-delay`.

React is Lumen's visual adapter layer plus headless behavior hooks. The components emit the same
`ui-*` classes and `data-ui-*` attributes as Astro, while hooks such as `useDialog`, `usePopover`,
`useDropdownMenu`, `useContextMenu`, `useTabs`, `useSelect`, `useFormValidation`, `useCalendar`,
`useInputOTP`, `useDateRangePicker`, `useRichTextEditor`, `useSchedule`, `useThemeBuilder`,
`useResizable`, `useToast`, and
`useTooltip` track the Astro runtime's ARIA, keyboard, Escape, dismissal, context menu, form
validation, calendar grids, OTP segmentation, date range syncing, rich text command, schedule
drag/drop, theme export, resizable pane sizing, and toast controller semantics for React
applications.
`useRichTextEditor` also provides `getEditableProps`, value-bearing commands, common formatting
shortcuts, active toolbar state, and `{ html, text }` change details.
`DataTable` can render structured `columns` and `rows` with the same selectable/sortable data
attributes, and `VirtualList` exposes the shared range sizing attributes for app-level adapters.

## Kanban boards

Use `KanbanBoard`, `KanbanColumn`, and ordinary `Card` items for status-based workspaces. The
`useKanban` hook supplies root, column, item, and dedicated handle props and emits controlled move
requests for keyboard, mouse, and touch input. It never moves application data or DOM. Keep pending
state, persistence, rollback, and workflow rules in the host. Use `Empty variant="compact"` inside
columns and card-shaped `Skeleton` blocks while loading.

## Motion

Use `ScrollReveal` for one entrance, `RevealGroup` for tokenized child staggering, and
`AnimatedNumber` for meaningful metric changes. Their `duration` prop uses the shared `fast`,
`standard`, and `slow` vocabulary, and every primitive honors reduced-motion preferences.

```tsx
<RevealGroup stagger={80}>
  <Card>Plan</Card>
  <Card>Build</Card>
  <Card>Ship</Card>
</RevealGroup>

<AnimatedNumber decimals={1} suffix="%" value={99.8} />
```

## Glass surfaces

Load `@santi020k/lumen-react/styles.css` once in your app, then use the shared glass API from React.

```tsx
<Card glass>Glass card</Card>
<Dialog glass>Glass dialog</Dialog>
<Popover glass>Glass popover</Popover>
<DatePicker glass="subtle" />
<Select glass="strong" options={['Astro', 'React']} />
```

## Semantic stat roots

`Stat` renders a `div` by default. Use `as="article"` when the metric and its supporting content
form a standalone item, or `as="section"` when it is a labeled region in a larger view.

```tsx
<Stat as="article" label="Active workspaces" value="1,234" variant="accent">
  <p>Across all production organizations.</p>
</Stat>
```

Use `variant="default"` for the original neutral surface, `variant="accent"` for a featured metric,
or `variant="glass"` for selective translucency.
