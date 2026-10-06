<p align="center">
  <a href="https://lumen.santi020k.com">
    <img src="https://raw.githubusercontent.com/santi020k/lumen/main/apps/docs/public/logo.svg" alt="Lumen UI" width="233" height="60">
  </a>
</p>

<h1 align="center">Lumen UI · Astro</h1>

<p align="center">Reference components · Progressive enhancement · Standalone CSS</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@santi020k/lumen-astro"><img src="https://img.shields.io/npm/v/@santi020k/lumen-astro?style=flat-square&color=0369a0" alt="npm version"></a>
  <a href="https://github.com/santi020k/lumen/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-13967e?style=flat-square" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://lumen.santi020k.com/docs/frameworks/astro">Documentation</a>
  ·
  <a href="https://www.npmjs.com/package/@santi020k/lumen-astro">npm</a>
  ·
  <a href="https://github.com/santi020k/lumen/tree/main/packages/astro">Source</a>
  ·
  <a href="https://github.com/santi020k/lumen/issues">Issues</a>
</p>

**Package:** `@santi020k/lumen-astro`

**On this page:** [Install](#install) · [Compound interactive components](#compound-interactive-components) · [Context navigation](#context-navigation) · [Forms and Astro Actions](#forms-and-astro-actions) · [Error states](#error-states) · [Resources](#resources)

---

Production-ready Astro primitives for Lumen UI. The stylesheet is standalone CSS, so no Tailwind
configuration is required to render the components.

Form controls use `visualSize` (`visual-size` in Elements) with `default`, `sm` and `lg`.
Select, PhoneInput and Segmented follow Input and NativeSelect; numeric input/select `size` keeps
its native meaning. See the [v4 migration guide](../../docs/migrating-v3-to-v4.md#form-control-visual-sizing).

## Install

Requires Astro 5 or newer in the consuming application.

```bash
pnpm add @santi020k/lumen-astro
```

The adapter also exposes Lumen's discovery and diagnostics CLI:

```bash
pnpm exec lumen show Tabs
pnpm exec lumen doctor
```

Import the CSS once in your root layout and mount `UIPrimitives` once in that same app shell if you
use interactive components such as dialogs, menus, popovers, tabs, carousels, toggles, command
lists, or toasts. Do not add `UIPrimitives` beside each component instance; one root include
enhances all matching Lumen markup on the page.

```css
@import "@santi020k/lumen-astro/styles.css";
```

Applications using the essential forms, feedback, tabs, dialogs, calendar, and data-table surface
can instead load `@santi020k/lumen-astro/styles/critical.css`. The generated entry is about 50 KiB
raw versus 170 KiB for the complete catalog; switch to `styles.css` when using components outside
that documented critical set.

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
import UIPrimitives from '@santi020k/lumen-astro/runtime'
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
`visualSize="lg"` for presentation so native behavior and visual styling remain separate.

```astro
<Input size={32} visualSize="sm" />
<NativeSelect size={8} visualSize="lg" />
```

`PhoneInput` generates localized country names, supplementary flags, and calling codes when custom
`countries` are not provided. Mount `UIPrimitives` once to enable as-you-type formatting,
metadata-backed validation, automatic country detection for pasted international numbers, and the
`ui:phone-change` event with a `LumenPhoneNumber` detail. Validation messages and inherited locale
resolve in the phone control's owning document, including after iframe adoption. Repeated runtime
initialization binds adopted phone controls to their current reset root; reset synchronization follows
the current form owner and honors cancellation without duplicating edit listeners.

The phone metadata and normalization controller are selector-loaded only when a rendered page
contains `PhoneInput`; pages without the component do not evaluate or download that controller.

```astro
<PhoneInput countryValue="CO" locale="en-US" name="hospitalPhone" />
```

## Appearance presets

Set `data-lumen-preset="studio"` and an optional `data-lumen-scheme="light|dark"` on the application root. See [appearance presets](../../docs/appearance-presets.md) for Default, Studio, Glass and scoped customization.

## Compound interactive components

Popover, dropdown menu, tabs, and tooltip parts expose the DOM and ARIA contracts consumed by the
shared progressive-enhancement runtime. Prefer these parts over recreating roles and `data-ui-*`
attributes by hand.

Disclosure keyboard navigation skips hidden or inert regions, invisible controls, and native
disabled controls, including a disabled fieldset. Available controls in a fieldset's first legend
retain their native keyboard behavior; removing `inert` makes a region available again.

Mentions keeps suggestion navigation on the textarea through `aria-activedescendant`; suggestion
buttons are excluded from the Tab sequence. Returning focus before the delayed blur dismissal
preserves reopened suggestions. Static Toast markup is enhanced again after client
navigation, retaining Escape dismissal without duplicate listeners.

Tabs keep the selected trigger visible when a narrow tab list scrolls horizontally and emit a
typed `ui:tabs-change` event. Import `LumenTabsChangeDetail` or `LumenTabsChangeEvent` from this
package when application behavior follows the selected value.

Keyboard tab navigation skips disabled triggers and stays within the current group when tabs are nested.
Dialogs preserve native `autofocus`, restore their connected opener on close, and dismiss only a
backdrop press that starts and ends outside the dialog. Alert dialogs retain explicit dismissal.

```astro
---
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Popover,
  PopoverPanel,
  PopoverTrigger,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTrigger,
  Tooltip,
  TooltipContent
} from '@santi020k/lumen-astro'
---

<DropdownMenu>
  <DropdownMenuTrigger>Download</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>macOS</DropdownMenuItem>
    <DropdownMenuItem>Windows</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem disabled status="Soon">Android</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

<Popover>
  <PopoverTrigger>Filters</PopoverTrigger>
  <PopoverPanel>Filter controls</PopoverPanel>
</Popover>

<Tabs initialValue="preview">
  <TabsList aria-label="Workspace view">
    <TabsTrigger value="preview">Preview</TabsTrigger>
    <TabsTrigger value="code">Code</TabsTrigger>
  </TabsList>
  <TabsPanel value="preview">Rendered result</TabsPanel>
  <TabsPanel value="code">Source code</TabsPanel>
</Tabs>

<Tooltip>
  <Button aria-label="Save changes">Save</Button>
  <TooltipContent>Save changes</TooltipContent>
</Tooltip>
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

## Error states

Use `ErrorState` when a page or region cannot show its primary content. Pass recovery controls
through the `actions` slot; the application still owns retry and logging behavior. Static states are
not live regions by default, so set `announce="polite"` only when a newly rendered failure needs an
announcement.

```astro
<ErrorState title="Could not load projects" description="Check your connection and try again.">
  <Button slot="actions">Try again</Button>
</ErrorState>
```

See the repository [Astro error-handling guide](../../docs/error-handling.md#astro) for the complete
example, retry ownership, announcement behavior, and verification guidance.

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
<CopyButton size="sm" target="#invite" toast variant="default">
  Copy invite
  <span slot="copied">Invite copied</span>
  <span slot="error">Copy failed</span>
</CopyButton>
```

`CopyButton` accepts the same presentation `variant` and `size` vocabulary as `Button`. Its stable
`copy-idle`, `copy-copied`, and `copy-error` slots keep visible feedback in
sync with the accessible label; free-form default children remain the idle presentation.

## Data visualization

The web visualization milestone adds `WaterfallChart` for signed changes and explicit totals, and
`Histogram` for precomputed numeric bins (`frequency="density"` for unequal widths). Line charts
support explicit continuous axes, annotations, optional keyboard/pointer/touch inspection, and
synchronized cursors. Heatmaps show labeled axes, a color legend, and explicit missing cells.
See the [visualization contracts](../../docs/data-visualization.md) and
[interactive web example](https://lumen.santi020k.com/docs/web/data-visualization).

Set `interactive` on `LineChart` and mount `UIPrimitives` to enable inspection and legend buttons.
Static charts continue to render without client JavaScript. After moving an enhanced chart into another
document, rerun `UIPrimitives` initialization so cursor synchronization follows that document's peers.


Use `Sparkline` beside a metric, `BarChart` for categorical comparison, `LineChart` for ordered
trends, `PieChart` for a small part-to-whole breakdown, `ScatterChart` for numeric relationships,
`Heatmap` for a matrix, `RangeChart` for intervals, and `ComboChart` for a shared-domain mix of bars,
lines, and areas. The chart components accept
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

Every chart includes a factual screen-reader summary by default and accepts `summary` for more
useful domain context. See [data visualization](../../docs/data-visualization.md) for selection,
missing-data, live-data, and accessibility guidance.

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
<ScrollReveal animation="slide-up" as="section" duration="slow">
  <h2>Release highlights</h2>
</ScrollReveal>

<RevealGroup as="ul" stagger={80}>
  <li><Card>Plan</Card></li>
  <li><Card>Build</Card></li>
  <li><Card>Ship</Card></li>
</RevealGroup>

<AnimatedNumber decimals={1} suffix="%" value={99.8} />
```

With the optional motion stylesheet, native `Collapsible` and `Accordion` content smoothly expands and collapses in browsers supporting
`::details-content` and `interpolate-size`. Other browsers retain the immediate native toggle.
Dialogs, drawers, sheets, menus, and toasts retain their existing shared-token transitions.

For optional insertion, removal, or state feedback, use
[`animateLumenPresence`](../core/README.md#presence-motion) on a DOM reference. Applications keep
ownership of state, focus, and DOM removal. Set `data-ui-motion="reduce"` on a container for a local
reduced-motion preference; the system preference is always respected.
Try dialogs, bottom drawers, and side sheets in the [motion playground](https://lumen.santi020k.com/docs/motion-playground).
System reduced motion shortens both panel and backdrop transitions.

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

## Consumer composition recipes

See [consumer UI recipes](../../docs/consumer-ui-recipes.md) for static React icons, responsive
record tables, keyboard-aware native sheets, whole-unit amount fields, adaptive editors, and
asynchronous action states. Each recipe identifies the public primitives and the behavior that
remains owned by the application.

## Exact amount fields

`AmountField` formats an ASCII decimal-string `value` in the requested locale and submits a
complete ungrouped value through its named hidden input. Include `UIPrimitives` for editing,
validity and reset behavior. Domain validation and monetary units remain application-owned.

```astro
<AmountField name="amount" locale="es-CO" value="1234.50" aria-label="Amount COP" />
<UIPrimitives />
```

See [consumer workflows](../../docs/consumer-ui-recipes.md#executable-consumer-workflows).

## Resources

| Guide | What you will find |
| --- | --- |
| [Styling contract](https://github.com/santi020k/lumen/blob/main/docs/styling-contract.md) | Reference for styling contract. |
| [Error handling](https://github.com/santi020k/lumen/blob/main/docs/error-handling.md) | Reference for error handling. |
| [Contributing](https://github.com/santi020k/lumen/blob/main/CONTRIBUTING.md) | Setup, checks, and contribution workflow. |
| [Release history](https://github.com/santi020k/lumen/releases) | Published releases and version notes. |

Part of [Lumen UI](https://lumen.santi020k.com), created by [Santiago Molina](https://santi020k.com).
Licensed under [MIT](https://github.com/santi020k/lumen/blob/main/LICENSE); third-party artwork retains its own notices.

### Accessible documentation controls

`Code` and `CodeTabs` accept `copyLabel`, `copiedLabel`, `errorLabel`, and
`codeLabel` strings. The first three customize clipboard controls and their live
success/error feedback; `codeLabel` names the keyboard-focusable region for an
unwrapped code block. A denied or unavailable clipboard reports the error label
and keeps the source available for manual selection. `CodeTabs` forwards these
labels to each code example.

`Code` with `highlighted` enhances the supplied `pre` when the Astro runtime loads.
For keyboard scrolling before JavaScript loads, give that `pre` `tabindex="0"`,
`role="region"`, and an accessible name; existing attributes are preserved.
Wrapped blocks do not add an extra tab stop.

`NavigationMenu` contains ordinary site links, so every enabled link remains in
native Tab order. Use `Menubar` or `Toolbar` for their documented composite-widget
keyboard behavior. A `ThemeToggle` with `controlled` respects the host theme at
initialization and leaves persistence and theme changes to its owner.

### Virtual list and editor ownership

`VirtualList` displays fixed-height rows with inert spacers that retain the full scroll extent.
Rows stay mounted; use pagination when the initial DOM cost matters. Scrolling, resizing, sizing
changes and direct row changes refresh the window. Focused rows remain available. See the
[fixed-height list contract](../../docs/ai-usage.md#fixed-height-virtual-lists).

External rich-text engines should handle the cancelable `ui:editor-command-request` event before
execution and use `ui:editor-command` only for completion notifications. React also supports
`useRichTextEditor({ commandHandler })`. Disable native toolbar state syncing when the external
engine owns it. See the [editor guidance](../../docs/ai-usage.md).

## Phone presentation in v4

Phone inputs bundle the same offline flag artwork on every platform. The selected country shows
its flag and calling code inside one continuous input border. Country names remain in the native
picker and its accessible name; flags are supplementary. Unknown flag codes fall back to text.

Astro and React `PhoneInput` accept `disabled`, `readOnly`, `required`, `errorMessage`,
`showValidationError`, and `inputProps`. Their `id` targets the number input in v4; React also
accepts `inputRef`. Web Components use `disabled`, `readonly`, `required`, `error-message`,
`show-validation-error="false"`, and `input-id`, with native input attributes on the host.
Both controls lock together and validation remains associated with the input. Astro forwards
`inputProps.form` to the number input, country picker and read-only country fallback so external
form submission and reset include every part.

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

`VirtualList` supports an empty `mode="data"` root with the public Core data controller.
Only the visible window, overscan and focused neighbors mount. Stable keys retain row identity;
applications own offscreen editing state. See [data rendering](../../docs/virtual-list-data.md) for
setup, lifecycle, accessibility and the mounted-mode tradeoff.

Action-error normalization ignores malformed fields and non-string messages. Enhanced forms include
externally associated native controls. Timed toasts stay paused while hovered or focused.

### Compound dialog tasks

Use `DialogHeader`, `DialogTitle`, `DialogBody`, `DialogFooter`, and `DialogClose`
for long forms. Associate the title explicitly so labeling works before enhancement.
`DialogBody` must be a direct child of `Dialog` for independent scrolling. Footer
submit actions target a form inside the body with the native `form` attribute.

```astro
<Dialog id="record-dialog" aria-labelledby="record-title">
  <DialogHeader><DialogTitle id="record-title">Edit record</DialogTitle></DialogHeader>
  <DialogBody><Form id="record-form"><Input name="name" aria-label="Name" /></Form></DialogBody>
  <DialogFooter>
    <DialogClose variant="outline">Cancel</DialogClose>
    <Button type="submit" form="record-form">Save</Button>
  </DialogFooter>
</Dialog>
```

Mount `UIPrimitives` once and open the dialog with a button carrying
`data-ui-dialog-trigger="record-dialog"`. Set `selectedFilesLabel="{count} files selected"`
on `FileUpload` to supply localized multiple-file feedback; the single-file label is its filename.
A trigger ignores its own click when that click arrives canceled (`event.preventDefault()`) or
when the trigger matches `:disabled` or `[aria-disabled="true"]`, matching close control behavior.
Register cancellation listeners before the runtime binds the trigger. Activating a trigger for an
already open dialog preserves its mode and original focus-return target.

### Rich description rows

Use `Descriptions` with `DescriptionItem`, `DescriptionTerm`, and `DescriptionDetail`
when a value contains links, badges, formatted dates, or actions. Astro renders a
native `dl` containing `div`, `dt`, and `dd` elements. The existing `items` array
remains available and can be combined with child rows.

```astro
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

Set `drilldown` on BarChart, LineChart, PieChart, ScatterChart, ComboChart, Heatmap, or RangeChart
and mount `UIPrimitives` once. Each available plotted datum has a corresponding native button in
the actions disclosure, including when `showTable={false}`. Marks remain decorative to assistive
technology. The figure emits `ui:chart-datum-activate` with a validated
`LumenChartDatumActivationDetail`; apps decide whether to navigate, filter, or open a detail view.

Translate `labels.exploreData` and `labels.formatDatumAction(context)`, and format visible values
with the chart's existing formatters. Missing observations have no action; pie actions cover only
positive slices. A line's `markers="none"` hides visible markers while retaining pointer targets
and native keyboard actions. See [data visualization](../../docs/data-visualization.md#astro-chart-actions).

## Dashboard composition

`FilterBar` groups host-owned filtering controls, active criteria, reset actions, and a polite
result announcement. `ChangeSummary` presents explicit before/after values and application-owned
changed state. Neither component owns requests, persistence, parsing, or financial policy.

ScatterChart supports independent X/Y formatting, explicit domains, logarithmic positive X values,
and labeled reference lines/regions. Automatic domains leave room for complete bubbles; explicit
domain limits stay exact and can intentionally crop marks. ComboChart and RangeChart include
category labels and value scales. See [consumer UI recipes](../../docs/consumer-ui-recipes.md)
for dashboard tables, freshness, import review, activity inbox, and persistent Kanban patterns.

### Actual-versus-target charts

`BulletChart` compares a nullable actual `value` with a finite `target` and optional
labeled `ranges`. A strong actual bar, target marker, readable value labels, and expandable exact
data work together. Domains include zero and all measurements; invalid inputs fail closed, including malformed range containers.
Null values stay distinct from zero. See the [chart guide](../../docs/data-visualization.md#actual-values-and-targets)
for the input, localization, and domain contracts.

### Rankings and paired comparisons

Use `LollipopChart` for zero-based rankings and `DumbbellChart` for paired measurements (native
`LumenLollipopChart` and `LumenDumbbellChart`). Supply ordered comparison data with `id`, `label`,
nullable `value`, optional nullable `reference`, and optional `tone`. Both charts preserve missing
values and expose exact data. See the [shared visualization contract](../../docs/data-visualization.md#rankings-and-paired-comparisons).

### Calendars, funnels, and distributions

Use `CalendarHeatmap` for daily date-only observations with an explicit start/end range,
`FunnelChart` for ordered nonnegative stages, and `BoxPlot` for precomputed quartiles, whiskers,
and outliers. All retain missing values and expose exact data. See the
[data visualization guide](../../docs/data-visualization.md#calendars-funnels-and-box-plots).

Media controllers for ImageComparison and FileUpload load only when matching components are present.
Keep mounting `UIPrimitives` once; no additional consumer setup is required.

## Visual interactions and product blocks

See [visual interactions](../../docs/visual-interactions.md) for keyed motion, semantic effects,
chart continuity, AI surfaces, optional SDK integrations, and the four installable product recipes.
Import `@santi020k/lumen/styles/motion.css` alongside the base stylesheet to opt into native
disclosure height transitions and the CSS reduction scope. This small optional stylesheet works
with Astro, React, and Elements and keeps those effects out of the default stylesheet. The presence
helper's system and local reduced-motion checks work without this CSS import.

## Device demonstrations

`DeviceFrame` presents slotted HTML, an image, or a titled iframe inside `macbook-pro`, `imac`,
`iphone`, and `pixel` frames, with generic `laptop`, `desktop`, `android`, and `tablet` options.
Hardware details include camera islands, notches, side buttons, thin matte rims, and simple stands.
Shells are decorative, use Lumen tokens, and do not emulate device hardware. `orientation` selects portrait or landscape; `tone` selects
light or dark chrome independently of the screen content.

Iframe layouts use the preset screen viewport and scale to the available width. Override
`screenWidth` and `screenHeight` for a custom viewport (1–16384 CSS pixels). Slotted HTML shares
the host viewport; container queries can adapt it to the screen. Images preserve their proportions.
`scroll={false}` clips HTML overflow; an iframe manages its own scrolling.

Supply image alternative text and iframe titles. Consumers own iframe `sandbox`, `allow`,
loading, and referrer policies. Remote sites can refuse embedding through their response headers.
The decorative shell does not alter focus or intercept interactions. Camera and home-indicator
details occupy separate chrome outside live HTML and iframe viewports. Direct phone images extend
under the decorative camera and home indicator for a full-bleed presentation.
Screen presets are 1280 × 800 for MacBook Pro, 1440 × 810 for iMac, 390 × 844 for iPhone, and
412 × 915 for Pixel. These are demonstration viewports, not physical display specifications.

```astro
---
import { DeviceFrame } from '@santi020k/lumen-astro'
---
<DeviceFrame device="iphone">
  <iframe src="/demo" title="Mobile application demo" loading="lazy"></iframe>
</DeviceFrame>
```

The component bundles its resize behavior; `UIPrimitives` is not required for this frame.

## World map

WorldMap supports highlighted countries, location markers, dotted or solid styles, country selection,
and theme customization. Import geography explicitly from
`@santi020k/lumen-core/world-map-data`; it is excluded from root exports. See the
[WorldMap usage guide](../../docs/world-map.md) for adapter examples, events, localization,
accessibility, and customization.
