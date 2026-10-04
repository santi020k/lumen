<p align="center">
  <a href="https://lumen.santi020k.com">
    <img src="https://raw.githubusercontent.com/santi020k/lumen/main/apps/docs/public/logo.svg" alt="Lumen UI" width="233" height="60">
  </a>
</p>

<h1 align="center">Lumen UI · React</h1>

<p align="center">React primitives · Shared styles · Typed component APIs</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@santi020k/lumen-react"><img src="https://img.shields.io/npm/v/@santi020k/lumen-react?style=flat-square&color=0369a0" alt="npm version"></a>
  <a href="https://github.com/santi020k/lumen/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-13967e?style=flat-square" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://lumen.santi020k.com/docs/frameworks/react">Documentation</a>
  ·
  <a href="https://www.npmjs.com/package/@santi020k/lumen-react">npm</a>
  ·
  <a href="https://github.com/santi020k/lumen/tree/main/packages/react">Source</a>
  ·
  <a href="https://github.com/santi020k/lumen/issues">Issues</a>
</p>

**Package:** `@santi020k/lumen-react`

Production builds compact component JavaScript without renaming identifiers or changing the
ES2022 target. Declaration files and public imports retain their existing contracts.

**On this page:** [Install](#install) · [Usage](#usage) · [Dropdown menus](#dropdown-menus) · [Language selection](#language-selection) · [Forms](#forms) · [Resources](#resources)

---

React primitives for Lumen UI.

This package provides React components for the shared Lumen primitive catalog using the standalone
Lumen stylesheet.

See the [shared web form contracts](../../docs/form-controls.md) for value ownership, reset,
submission, disabled state, and event behavior.

Form controls use `visualSize` (`visual-size` in Elements) with `default`, `sm` and `lg`.
Select, PhoneInput and Segmented follow Input and NativeSelect; numeric input/select `size` keeps
its native meaning. See the [v4 migration guide](../../docs/migrating-v3-to-v4.md#form-control-visual-sizing).

## Install

Requires React 19 or newer in the consuming application.

```bash
pnpm add @santi020k/lumen-react
```

The adapter also exposes Lumen's discovery and diagnostics CLI:

```bash
pnpm exec lumen show Tabs
pnpm exec lumen doctor
```

Load the shared stylesheet once from your app entry or global CSS.

```tsx
import "@santi020k/lumen-react/styles.css";
```

For an essential application shell using forms, feedback, tabs, dialogs, calendar, and DataTable,
import `@santi020k/lumen-react/styles/critical.css` instead. It is generated from the canonical
stylesheet and remains materially smaller than the complete catalog.

The stylesheet defaults `--ui-font` to `"Montserrat", "Avenir Next", "Segoe UI", sans-serif`.
It declares the family stack but does not bundle or load font files. Load Montserrat once through
your preferred delivery path, or override `--ui-font` in application CSS.

## Selective imports

Root imports remain supported. Standalone component entrypoints include `/components/attachments`,
`/components/bullet-chart`, `/components/comparison-chart`, `/components/data-table`,
`/components/date-range-calendar`, `/components/date-range-input`, `/components/expanded-charts`,
`/components/image-comparison`, `/components/interval-charts`, and `/components/virtual-list`.
Import behavior hooks from `/hooks`; use `/server` for the server-safe primitive catalog.
Load the existing stylesheet once, regardless of the import path.

```tsx
import { ImageComparison } from '@santi020k/lumen-react/components/image-comparison'
import { VirtualList } from '@santi020k/lumen-react/components/virtual-list'
```

These entries use the same implementation and types as root imports. Interactive entries retain
`use client` for React Server Component consumers. A smaller module graph does not guarantee a
smaller final bundle: a bundler can already remove unused root exports. Run the repository's
`pnpm run measure:selective-imports` benchmark for the measured comparison.

## Appearance presets

Use a scoped `data-lumen-preset="studio"` container, or select a preset with `useThemeBuilder`. See [appearance presets](../../docs/appearance-presets.md) for theme overrides and explicit glass surfaces.

## Usage

```tsx
import { Button, Card, Input } from "@santi020k/lumen-react";

export function SubscribeForm() {
  return (
    <Card>
      <label htmlFor="email">Email</label>
      <Input id="email" type="email" placeholder="you@example.com" />
      <Button>Subscribe</Button>
    </Card>
  );
}
```

`PhoneInput` supports a controlled international phone model while preserving the legacy custom
country-option API:

```tsx
const colombia = getLumenPhoneCountry('CO', { locale: 'en-US' })
if (!colombia) throw new Error('Missing Colombia metadata')

const [phone, setPhone] = useState(() => createEmptyLumenPhoneNumber(colombia))

<PhoneInput value={phone} onValueChange={setPhone} locale="en-US" />
```

## Dropdown menus

Compose dropdown menus from the public trigger, content, item, and separator parts. Items close the
menu after a successful selection; preventing the item's click event keeps it open. Disabled items
remain unavailable, and `status` adds short trailing context to the item.

Disclosure keyboard navigation skips hidden or inert regions, invisible controls, and native
disabled controls, including a disabled fieldset. Available controls in a fieldset's first legend
retain their native keyboard behavior; removing `inert` makes a region available again.

Mentions keeps suggestion navigation on the textarea through `aria-activedescendant`; suggestion
buttons are excluded from the Tab sequence while Enter and pointer selection still insert a mention.

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@santi020k/lumen-react";

<DropdownMenu>
  <DropdownMenuTrigger>Download</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>macOS</DropdownMenuItem>
    <DropdownMenuItem>Windows</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem disabled status="Soon">
      Android
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>;
```

## Language selection

`LanguageToggle` cycles through an ordered locale list and generates an accessible label that
describes the current and next languages. Uncontrolled usage synchronizes
`document.documentElement.lang` and can restore the selection from `storageKey` when browser
storage is available.

```tsx
import { LanguageToggle } from '@santi020k/lumen-react'

const locales = [
  { label: 'English', value: 'en' },
  { label: 'Español', value: 'es' }
]

<LanguageToggle
  defaultValue="en"
  locales={locales}
  storageKey="site-language"
/>
```

Pass `value` and `onValueChange` when the application owns locale state. Controlled usage requests
the next value without changing document language or browser storage; update those application
concerns alongside the controlled value. `useLanguageToggle` exposes the same contract through
`value`, `currentLocale`, `nextLocale`, and `selectNext` for custom controls. Both forms use English
and Spanish defaults when `locales` is omitted.

## Forms

`Form`, `Field`, `Label`, `FieldError`, and `ErrorSummary` provide the presentation and
accessibility contract without replacing form state. Native-backed controls forward refs to their
submitted DOM controls and work directly with React Hook Form's `register()`.

Native form resets defer past the browser's default action and honor a cancelled `reset` event:
`DatePicker`, `DateRangeInput`, `PhoneInput`, and `Combobox` only restore uncontrolled defaults when
the reset is not prevented, and leave a controlled `value` untouched. `DatePicker` calendar
selection fires the native `onChange` exactly once, matching typed input. `DateRangeInput` attaches
its reset listener even without `name`, honoring an explicit `form` id as well as the nearest
ancestor form.

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

## Error states

Use `ErrorState` as a visible fallback when a page or region cannot show its primary content. It can
be rendered by an application or router error boundary, but Lumen does not catch exceptions, log
diagnostics, or decide whether retrying is safe.

```tsx
<ErrorState
  actions={<Button onClick={reload}>Try again</Button>}
  description="Check your connection and try again."
  title="Could not load projects"
/>
```

See the repository [React error-handling guide](../../docs/error-handling.md#react) for the complete
example, error-boundary ownership, announcement behavior, and verification guidance.

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
<CopyButton
  copiedContent="Link copied"
  size="sm"
  value="https://lumen.santi020k.com"
  variant="default"
  toast
>
  Copy link
</CopyButton>
```

`CopyButton` shares `Button` presentation variants and sizes. `copiedContent` and `errorContent`
customize its visible feedback while the localized label props remain the accessible announcement.
Stable `data-slot` hooks expose the idle, copied, and error parts.

## Data visualization

The web visualization milestone adds `WaterfallChart` for signed changes and explicit totals, and
`Histogram` for precomputed numeric bins (`frequency="density"` for unequal widths). Line charts
support explicit continuous axes, annotations, optional keyboard/pointer/touch inspection, and
synchronized cursors. Heatmaps show labeled axes, a color legend, and explicit missing cells.
See the [visualization contracts](../../docs/data-visualization.md) and
[interactive web example](https://lumen.santi020k.com/docs/web/data-visualization).

Use `interactive`, `syncGroup`, and optional `cursor`/`onCursorChange` on `LineChart`. A supplied
`cursor` is controlled; the owner must accept requests before the selection changes.


`Sparkline`, `BarChart`, `LineChart`, `PieChart`, `ScatterChart`, `Heatmap`, `RangeChart`, and
`ComboChart` use the shared chart contracts and
render without an external charting dependency. Data charts expose a revealable semantic table by
default. `PieChart` accepts one series and defaults to a donut presentation.

Every chart includes a factual screen-reader summary by default and accepts `summary` for more
useful domain context. See [data visualization](../../docs/data-visualization.md) for selection,
missing-data, live-data, and accessibility guidance.

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
import { Badge, Card } from "@santi020k/lumen-react";

export default function Page() {
  return (
    <Card>
      <Badge>Ready</Badge>
      Server-rendered page content
    </Card>
  );
}
```

This boundary is specific to React environments that recognize the `"use client"` directive.
Other React applications continue to consume the same package and exports normally.

For stateless primitives that should execute directly in a React Server Component, use the
server-safe entrypoint:

```tsx
import { Badge, Progress, Skeleton } from "@santi020k/lumen-react/server";

export default function Status() {
  return (
    <section>
      <Badge variant="success">Ready</Badge>
      <Progress aria-label="Migration progress" value={72} />
      <Skeleton aria-label="Loading activity" />
    </section>
  );
}
```

The server entrypoint contains Badge, Card and its compound parts, Container, Direction, Grid,
Input, Label, Progress, Separator, Skeleton, Spinner, Stack, Textarea, Typography, and
VisuallyHidden plus the component-name metadata. The package root reuses those exact
implementations and remains the full client catalog. Import interactive primitives, hooks, or
stateless primitives that receive event handlers from the root entrypoint inside a Client
Component.

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
import {
  ContextNavigation,
  NativeSelect,
  NavigationMenu,
} from "@santi020k/lumen-react";

<ContextNavigation
  context={
    <NativeSelect aria-label="Documentation platform" visualSize="sm">
      <option>Web</option>
      <option>Apple</option>
      <option>Android</option>
    </NativeSelect>
  }
>
  <NavigationMenu aria-label="Web documentation" variant="unstyled">
    <a href="/docs/web" aria-current="page">
      Overview
    </a>
    <a href="/docs/components">Components</a>
    <a href="/docs/web/playground">Playground</a>
  </NavigationMenu>
</ContextNavigation>;
```

Use `Icon` for Lucide icons by name across framework adapters.

```tsx
import { Button, Icon } from "@santi020k/lumen-react";

export function SettingsButton() {
  return (
    <Button variant="secondary">
      <Icon name="wand-sparkles" decorative />
      Generate
    </Button>
  );
}
```

## Optimized images

The React `Image` uses a lazy native `img` by default. In Next.js, pass `next/image` through `as` so
Next keeps control of image sizing, format negotiation, caching, placeholders, and preloading while
Lumen supplies its presentation class.

```tsx
import NextImage from "next/image";
import { Image as LumenImage } from "@santi020k/lumen-react";

<LumenImage
  alt="Team collaborating around a table"
  as={NextImage}
  height={800}
  sizes="(max-width: 768px) 100vw, 50vw"
  src="/team.jpg"
  width={1200}
/>;
```

Keep the default lazy loading for images below the fold. For the single likely LCP image, follow
your framework's preload or fetch-priority guidance. `invertOnDark` is available for monochrome
artwork authored for light surfaces; leave it off for photos and colorful illustrations.

`AnimatedLogo` accepts your own inline SVG rather than imposing brand artwork. Put the accessible
name on the SVG itself.

```tsx
import { AnimatedLogo } from "@santi020k/lumen-react";

<AnimatedLogo style={{ height: "3rem" }}>
  <svg aria-label="Acme" role="img" viewBox="0 0 120 32">
    {/* Your logo artwork */}
  </svg>
</AnimatedLogo>;
```

For a choreographed logo, set `animation="sequence"` and mark individual SVG layers with
`data-ui-logo-pop`, `data-ui-logo-draw`, or `data-ui-logo-reveal`. Timing can be adjusted per layer
with `--ui-logo-delay`.

React is Lumen's visual adapter layer plus headless behavior hooks. The components emit the same
`ui-*` classes and `data-ui-*` attributes as Astro, while hooks such as `useDialog`, `usePopover`,
`useDropdownMenu`, `useContextMenu`, `useTabs`, `useSelect`, `useFormValidation`, `useCalendar`,
`useInputOTP`, `useDateRangePicker`, `useRichTextEditor`, `useSchedule`, `useThemeBuilder`,
`useKanban`, `useResizable`, `useThemeToggle`, `useToast`, and `useTooltip` track the Astro runtime's
ARIA, keyboard, Escape, dismissal, context menu, form
validation, calendar grids, OTP segmentation, date range syncing, rich text command, schedule
drag/drop, controlled Kanban move requests, theme export and switching, resizable pane sizing, and
toast controller semantics for React applications.
Toast timeouts pause while hovered or focused and resume only after both interactions end;
moving focus between a toast's controls preserves its remaining duration.
`useRichTextEditor` also provides `getEditableProps`, value-bearing commands, common formatting
shortcuts, active toolbar state, and `{ html, text }` change details.
`DataTable` can render structured `columns` and `rows`; sortable columns use native header buttons,
update `aria-sort`, and order string or numeric values without mutating the supplied rows. The
shared selectable/sortable data attributes remain available for app-level adapters, and
`VirtualList` provides built-in fixed-height windowing with the shared sizing attributes.
`useTabs` keeps the selected trigger visible when a narrow horizontal list scrolls. The package
also exports `LumenTabsChangeDetail` and `LumenTabsChangeEvent` for integrations that consume the
shared `ui:tabs-change` contract.

Keyboard navigation stays within the current tab group when tabs are nested and skips disabled triggers.

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

## Consumer composition recipes

See [consumer UI recipes](../../docs/consumer-ui-recipes.md) for static React icons, responsive
record tables, keyboard-aware native sheets, whole-unit amount fields, adaptive editors, and
asynchronous action states. Each recipe identifies the public primitives and the behavior that
remains owned by the application.

For icons known at build time, use the static entrypoint to avoid loading the runtime registry:

```tsx
import { Icon, Search } from '@santi020k/lumen-react/icons'

<Icon icon={Search} label="Search" />
```

The existing root `Icon name="search"` remains supported for runtime-selected names and icon packs.
`Table layout="records"` opts into the responsive record recipe; its semantic child markup and
shared mobile labels are documented in the consumer recipe linked above.

## Resources

| Guide | What you will find |
| --- | --- |
| [Consumer UI recipes](https://github.com/santi020k/lumen/blob/main/docs/consumer-ui-recipes.md) | Reference for consumer UI recipes. |
| [React Hook Form adapters](https://github.com/santi020k/lumen/blob/main/packages/react-hook-form/README.md) | Reference for react Hook Form adapters. |
| [Import and icon performance](https://github.com/santi020k/lumen/blob/main/docs/import-and-icon-performance.md) | Reference for import and icon performance. |
| [Contributing](https://github.com/santi020k/lumen/blob/main/CONTRIBUTING.md) | Setup, checks, and contribution workflow. |
| [Release history](https://github.com/santi020k/lumen/releases) | Published releases and version notes. |

Part of [Lumen UI](https://lumen.santi020k.com), created by [Santiago Molina](https://santi020k.com).
Licensed under [MIT](https://github.com/santi020k/lumen/blob/main/LICENSE); third-party artwork retains its own notices.

## Inline date range calendar

`DateRangeCalendar` is a controlled React range editor with two visible calendars,
inclusive range highlighting, a preset sidebar and the keyboard behavior of `useCalendar`,
including inherited RTL arrow navigation in both calendars.
On narrow screens the presets scroll horizontally and the calendars stack. It uses the shared Lumen stylesheet.

```tsx
const [range, setRange] = useState({ start: '2026-09-01', end: '2026-09-30' })

<DateRangeCalendar
  value={range}
  onValueChange={setRange}
  locale="en-US"
  min="2000-01-01"
  max="2100-12-31"
  labels={{ start: 'From', end: 'To', presets: 'Quick range' }}
  presets={[{ label: 'September', value: { start: '2026-09-01', end: '2026-09-30' } }]}
/>
```

Supply valid ISO date endpoints in ascending order. Choosing a start after the end,
or an end before the start, moves the opposite endpoint to the chosen day.
Presets outside `min`/`max` or in descending order are disabled. Only one matching
preset is highlighted, including when multiple presets resolve to the same range. `formatDate` can customize
the endpoint summaries without changing ISO values. The consumer owns draft state,
Apply/Cancel actions and domain limits such as maximum report duration. Labels are required;
`locale` controls month, weekday, navigation and day announcements.

## Input-attached date range selection

`DateRangeInput` wraps `DateRangeCalendar` in an anchored, non-modal popover. Use it
when the range should be edited directly from an input-like control. It keeps draft
changes internal and calls `onValueChange` only when the user chooses Apply.
The existing `DateRangePicker` and inline `DateRangeCalendar` remain available.

```tsx
import { useState } from 'react'
import { DateRangeInput } from '@santi020k/lumen-react'
import '@santi020k/lumen-react/styles.css'

export function ReportPeriod() {
  const [range, setRange] = useState({ start: '2026-09-01', end: '2026-09-30' })

  return (
    <DateRangeInput
      value={range}
      onValueChange={setRange}
      label="Report period"
      locale="en-US"
      labels={{ start: 'From', end: 'To', presets: 'Quick ranges', apply: 'Apply', cancel: 'Cancel' }}
      presets={[{ label: 'September', value: { start: '2026-09-01', end: '2026-09-30' } }]}
      name={{ start: 'from', end: 'to' }}
      validate={draft => draft.start < '2026-01-01' ? 'Choose dates in 2026 or later.' : undefined}
      renderSummary={draft => `${draft.start} through ${draft.end}`}
    />
  )
}
```

- `value` must contain real, ascending ISO dates (`YYYY-MM-DD`). `min`, `max`,
  `presets`, `locale`, and `formatDate` follow the inline calendar contract.
- `label` names both the trigger and dialog. Supply localized start, end, presets,
  apply, and cancel labels. For Spanish, use `Desde`, `Hasta`, `Períodos`, `Aplicar`,
  and `Cancelar` with `locale="es-CO"`. Navigation announcements follow `locale`.
- `validate` runs on the draft; return a localized error to disable Apply. The error
  is announced politely and associated with the Apply button. Keep validation pure.
- `renderSummary` optionally renders localized draft details. `formatDate` changes
  visible dates, while optional hidden form fields always submit the applied ISO values.
- Cancel, Escape, outside pointer interaction, or moving focus outside discard the
  draft. Apply, Cancel, and Escape return focus to the trigger. Opening again starts
  from the latest controlled value. Calendar arrows retain their date-navigation behavior.
- The panel uses the browser Popover API top layer without a modal backdrop or focus
  trap. A fixed-position fallback works where the API is unavailable; ancestor clipping
  can affect that fallback. The page remains interactive.
- The panel tracks viewport changes, scroll, and trigger size. Narrow screens scroll
  the trigger into view, stack the calendars, and scroll presets horizontally.
  Only the body scrolls vertically; confirmation actions stay visible.
- `disabled` disables the trigger and optional form entries. `className` styles the
  outer container. Import the shared stylesheet once at the application boundary.

This component is currently React-only. Publication is separate from local implementation.

### Accessible code examples

`Code` and `CodeTabs` accept `copyLabel`, `copiedLabel`, `errorLabel`, and
`codeLabel`. Copy controls work directly in React, emit `ui:copy-success` or
`ui:copy-error`, and announce localized success or recovery guidance. Repeated
clicks restart feedback; unmounting clears its timer. No Astro runtime is needed.

Unwrapped code uses a named, keyboard-focusable region. `codeLabel` defaults to
`Code example`; set a descriptive localized name when several examples are
present. Highlighted `pre` children receive the same behavior while retaining
authored names and tab order. Wrapped code does not add an extra tab stop.

### Server-sorted tables

`DataTable` accepts `sort` and `onSortChange` for controlled sorting, or
`defaultSort` for an initial uncontrolled sort. A `DataTableSort` contains a
column `key` and `direction: 'ascending' | 'descending'`; `null` means unsorted.
Header buttons request the next direction, and `aria-sort` describes the applied
state. Replacing `rows` does not reset that state.

Use `sortMode="manual"` with server pagination. In this mode the table preserves
the supplied row order, even when a header is activated. Apply the requested sort
to the complete dataset on the server before selecting the page, then supply the
returned rows and controlled sort. Keep authentication, query validation, loading
state, and network errors in the application. The default `sortMode="client"`
sorts a copy of the supplied rows.

### Dialog dismissal and focus

`Dialog`, `AlertDialog`, and `useDialog` accept `dismissOnOutsidePress` and
`dismissOnEscape`. Ordinary dialogs allow both by default; alert dialogs ignore
outside presses by default. Set both to `false` while an application requires an
explicit decision or is completing a pending mutation. These policies govern
implicit dismissal; explicit close actions remain under application control.

Native Escape requests `onOpenChange(false)` without overriding a controlled
`open` value. Content padding and a drag that begins inside the dialog do not
count as backdrop dismissal. Consumer `onCancel` or `onClick` handlers can prevent
the corresponding default action.

A controlled dialog can open without hook trigger props: it captures the focused
opener before opening and returns focus on close or unmount, including when rendered into an iframe.
Focus capture and restoration use the dialog's own document. StrictMode replay
preserves that opener, and cleanup does not steal focus from a nested or
replacement dialog. Hook trigger props remain useful when the same component
owns the opener and dialog. Keep an accessible dialog name and logical initial
focus; native `autoFocus` can select the initial control.

### Virtual list and editor ownership

`VirtualList` displays fixed-height rows with inert spacers that retain the full scroll extent.
Rows stay mounted; use pagination when the initial DOM cost matters. Scrolling, resizing, sizing
changes and direct row changes refresh the window. Focused rows remain available. See the
[fixed-height list contract](../../docs/ai-usage.md#fixed-height-virtual-lists).

External rich-text engines should handle the cancelable `ui:editor-command-request` event before
execution and use `ui:editor-command` only for completion notifications. React also supports
`useRichTextEditor({ commandHandler })`. Disable native toolbar state syncing when the external
engine owns it. See the [editor guidance](../../docs/ai-usage.md).

With native state enabled, `useRichTextEditor` initializes toolbar toggle states on mount,
including `aria-pressed`, before the first editing interaction. External command handlers
disable this synchronization by default so the application can own toolbar state.
Native toolbar and keyboard commands execute in the editor root's owning document, including
editors portaled into a same-origin iframe.

## Phone presentation in v4

Phone inputs bundle the same offline flag artwork on every platform. The selected country shows
its flag and calling code inside one continuous input border. Country names remain in the native
picker and its accessible name; flags are supplementary. Unknown flag codes fall back to text.

Astro and React `PhoneInput` accept `disabled`, `readOnly`, `required`, `errorMessage`,
`showValidationError`, and `inputProps`. Their `id` targets the number input in v4; React also
accepts `inputRef`. Web Components use `disabled`, `readonly`, `required`, `error-message`,
`show-validation-error="false"`, and `input-id`, with native input attributes on the host.
Both controls lock together and validation remains associated with the input. React forwards
`inputProps.form` to the country picker and read-only country value as well as the number input,
so an external form receives both values.

The `phone-input`, `phone-country`, and `country-flag` styling parts plus `--ui-phone-height`,
`--ui-phone-padding`, and `--ui-phone-country-gap` replace consumer CSS overlays.

Astro and React also export `CountryFlag` (`regionCode`, optional `decorative`) and `PhoneNumber`
(`value: LumenPhoneNumber`, optional `link`). A telephone link is rendered only for a complete
E.164 value. Use the model returned by the phone normalizer; keep domain persistence in your app.
Artwork attribution is shipped with the core package in `PHONE_FLAG_LICENSE.txt`.

## Combobox keyboard behavior

In v4, Combobox retains input focus and exposes its active option through `aria-activedescendant`.
Enter commits an active option; text editing and composition remain native. Escape dismisses one
nested control at a time. See the [shared keyboard contract](../../docs/ai-usage.md#combobox-keyboard-behavior-in-v4)
for dynamic options, controlled inputs and migration guidance.

Combobox also supports native form reset: resetting the owning form restores an uncontrolled
`defaultValue`, closes the open option list, and clears the active selection without emitting
`onChange`. A controlled `value` is left unchanged.

## Content flow

Stack and Grid own sibling spacing. Their gap accepts `related`, `group` (default) and `section`,
or canonical `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl` sizes. Card owns the inset and gap
between its visible parts; use `density="compact"`, `"comfortable"` (default) or `"spacious"`.
Elements uses the same names as attributes. Use a nested Stack for CardContent groups and Field
for label/control/feedback. See [content flow](../../docs/content-flow.md) and the
[v4 migration guide](../../docs/migrating-to-lumen.md) for ownership and changed explicit gaps.


### Reading and complete compositions

Prose and Typography trim outer child margins and separate headings from preceding text.
Container gutters grow from 16px to 32px with viewport width; override `--ui-container-gutter`
when a product needs fixed gutters. Card allows interactive overflow; use AspectRatio to clip media.
Install `content-flow-header`, `content-flow-settings`, `content-flow-list` or `content-flow-actions`
with `lumen add <recipe> --target astro|react|elements`. MCP returns the same complete examples.
Connect application actions and replace sample IDs before reuse. See
[content flow](../../docs/content-flow.md) for composition and migration guidance.

### Large fixed-height collections

React `VirtualList` accepts typed `items`, `getKey` and `renderItem` for data mode.
Only the visible window, overscan and focused neighbors mount. Stable keys retain row identity;
applications own offscreen editing state. See [data rendering](../../docs/virtual-list-data.md) for
setup, lifecycle, accessibility and the mounted-mode tradeoff.

### Compound dialog tasks

`DialogHeader`, `DialogTitle`, `DialogBody`, `DialogFooter`, and `DialogClose`
compose long forms with fixed actions and an independently scrolling body. Keep
`DialogBody` directly inside `Dialog`. Give `DialogTitle` an `id` and reference it
from `Dialog aria-labelledby`; `as` supports `h2`, `h3`, and `h4`.
`DialogClose` accepts Button props, honors `onClick` cancellation, and requests
closure through the enclosing Dialog controller, including controlled dialogs.
The four static structural parts are also exported from `@santi020k/lumen-react/server`.

```tsx
<Dialog open={open} onOpenChange={setOpen} aria-labelledby="record-title">
  <DialogHeader><DialogTitle id="record-title">Edit record</DialogTitle></DialogHeader>
  <DialogBody><Form id="record-form"><Input name="name" aria-label="Name" /></Form></DialogBody>
  <DialogFooter>
    <DialogClose variant="outline">Cancel</DialogClose>
    <Button type="submit" form="record-form">Save</Button>
  </DialogFooter>
</Dialog>
```

`FileUpload selectedFilesLabel` accepts localized text containing `{count}`.
Accepted native form resets clear selected-file feedback; cancelled resets preserve it.

### Rich description rows

`DescriptionItem`, `DescriptionTerm`, and `DescriptionDetail` accept native props
and refs and render `div`, `dt`, and `dd`. Compose them inside `Descriptions` for
rich values, alongside the existing `items` array when needed. The three static
parts are also available from `@santi020k/lumen-react/server` for use inside a native `dl`.

```tsx
<Descriptions>
  <DescriptionItem>
    <DescriptionTerm>Status</DescriptionTerm>
    <DescriptionDetail><Badge variant="success">Active</Badge></DescriptionDetail>
  </DescriptionItem>
</Descriptions>
```

## Attachment composition

Use `AttachmentList` to group native `li` children and `AttachmentPreview` for browser-owned images
with localized loading, error, and unsupported-file states. Compose independent actions rather
than nesting controls inside a linked Attachment. The application retains file validation,
authorization, persistence, and object URL cleanup. See the
[attachment composition recipe](../../docs/consumer-ui-recipes.md#attachment-previews-and-file-lists)
for adapter props, slots, child contracts, retry identity, and safe state events.

## Chart datum actions

Pass `onDatumActivate(detail)` to BarChart, LineChart, PieChart, ScatterChart, ComboChart, Heatmap,
or RangeChart to enable drilldown. The callback receives `LumenChartDatumActivationDetail`,
exported from this package, with raw axes and optional datum IDs. Applications own navigation,
filtering, detail views, and authorization. React charts use their own event handling and do not
require `UIPrimitives`.

Each available plotted datum has an equivalent native button in the actions disclosure, even
with `showTable={false}` or hidden line markers. Translate `labels.exploreData` and
`labels.formatDatumAction(context)` alongside the chart's existing labels and value formatters.
Missing observations have no action and never reach datum-action value formatters; pie actions cover only positive slices. Updated values and
callbacks take effect on rerender, while stable datum identities retain focused action buttons.
The chart's native `onClick` can cancel activation with `event.preventDefault()`.

## Dashboard composition

`FilterBar` groups host-owned filtering controls, active criteria, reset actions, and a polite
result announcement. `ChangeSummary` presents explicit before/after values and application-owned
changed state. Neither component owns requests, persistence, parsing, or financial policy.
Omit `FilterBar.open` for native disclosure ownership. Unrelated rerenders preserve native toggles
when `defaultOpen` is unchanged. Pass `open` and `onOpenChange` for application-controlled disclosure.

ScatterChart supports independent X/Y formatting, explicit domains, logarithmic positive X values,
and labeled reference lines/regions. See [consumer UI recipes](../../docs/consumer-ui-recipes.md)
for dashboard tables, freshness, import review, activity inbox, and persistent Kanban patterns.

React DataTable adds `layout="records"`, rich `column.render`, and expandable `renderDetails`.
Use stable record IDs and controlled `expandedRowIds` across pages. `DataTableSortControls` shares
`sort`/`onSortChange` with table headers; manual sorting preserves server page order.

Popover and DropdownMenu support anchored top-layer placement, viewport collision handling, logical
start/end alignment, and focus handoff. Set `positioning="none"` for application-owned placement.

### Actual-versus-target charts

`BulletChart` compares a nullable actual `value` with a finite `target` and optional
labeled `ranges`. A strong actual bar, target marker, readable value labels, and expandable exact
data work together. Domains include zero and all measurements; invalid inputs fail closed.
Invalid measurements do not reach `formatValue`.
Null values stay distinct from zero. See the [chart guide](../../docs/data-visualization.md#actual-values-and-targets)
for the input, localization, and domain contracts.

### Rankings and paired comparisons

Use `LollipopChart` for zero-based rankings and `DumbbellChart` for paired measurements (native
`LumenLollipopChart` and `LumenDumbbellChart`). Supply ordered comparison data with `id`, `label`,
nullable `value`, optional nullable `reference`, and optional `tone`. Both charts preserve missing
values and expose exact data. See the [shared visualization contract](../../docs/data-visualization.md#rankings-and-paired-comparisons).


### Calendar activity, ordered stages and distributions

`CalendarHeatmap`, `FunnelChart`, and `BoxPlot` share validated geometry with every Lumen adapter.
CalendarHeatmap takes date-only UTC `startDate`/`endDate`, nullable `{ date, value }` data and optional
`weekStartsOn` (0 for Sunday or 1 for Monday). It fills omitted dates as missing, keeps zero distinct,
and limits the inclusive range to 3,660 days. `weekdayLabels` always indexes Sunday through Saturday;
`formatDate` customizes readable dates without changing their identity.

FunnelChart takes ordered `{ id, label, value, tone? }` stages with nonnegative nullable values.
Stages retain the supplied order, including increasing values; the chart derives no conversion rates.
BoxPlot takes precomputed `{ id, label, min, q1, median, q3, max, outliers?, tone? }` statistics.
Statistics must be ordered and finite, or all five must be null for a missing row. Explicit domains
must contain all observations and outliers. `statisticLabels` localizes the six statistic names.

All three accept `formatValue`, chart `labels`, `summary`, and `showTable` (default true).
Exact data and missing measurements remain readable; invalid input fails closed instead of dropping
observations or clipping the domain. Prefer retaining the data table for complete visual inspection.

```tsx
import { BoxPlot, CalendarHeatmap, FunnelChart } from '@santi020k/lumen-react'

<CalendarHeatmap heading="Daily visits" startDate="2026-01-01" endDate="2026-01-31"
  data={[{ date: '2026-01-01', value: 42 }]} />
<FunnelChart heading="Checkout stages" data={[
  { id: 'view', label: 'Viewed', value: 120 },
  { id: 'paid', label: 'Paid', value: 32 }
]} />
<BoxPlot heading="Response times" data={[
  { id: 'api', label: 'API', min: 20, q1: 45, median: 60, q3: 90, max: 140, outliers: [210] }
]} />
```

## Hook state updates

Public hook setters accept React functional updates. In uncontrolled mode, consecutive calls in
one event compose against the latest pending value. Change callbacks run once per setter call,
including under Strict Mode. Controlled values remain owned by the application.
