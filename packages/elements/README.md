<p align="center">
  <a href="https://lumen.santi020k.com">
    <img src="https://raw.githubusercontent.com/santi020k/lumen/main/apps/docs/public/logo.svg" alt="Lumen UI" width="233" height="60">
  </a>
</p>

<h1 align="center">Lumen UI · Web Components</h1>

<p align="center">Custom elements · Browser-native composition · Shared styles</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@santi020k/lumen-elements"><img src="https://img.shields.io/npm/v/@santi020k/lumen-elements?style=flat-square&color=0369a0" alt="npm version"></a>
  <a href="https://github.com/santi020k/lumen/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-13967e?style=flat-square" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://lumen.santi020k.com/docs/frameworks/elements">Documentation</a>
  ·
  <a href="https://www.npmjs.com/package/@santi020k/lumen-elements">npm</a>
  ·
  <a href="https://github.com/santi020k/lumen/tree/main/packages/elements">Source</a>
  ·
  <a href="https://github.com/santi020k/lumen/issues">Issues</a>
</p>

**Package:** `@santi020k/lumen-elements`

Internal behavior methods use native JavaScript private members. Public properties, events and
registration APIs retain their existing contracts.

**On this page:** [Install](#install) · [Usage](#usage) · [Language selection](#language-selection) · [Forms](#forms) · [Context navigation](#context-navigation) · [Resources](#resources)

---

Web Components for Lumen UI.

This package registers standards-based custom elements for the shared Lumen primitive catalog.

`ImageComparison` form resets restore the latest externally configured `value`; user range input
does not replace that reset baseline.

See the [shared web form contracts](../../docs/form-controls.md) for value ownership, reset,
submission, disabled state, and event behavior.

Form controls use `visualSize` (`visual-size` in Elements) with `default`, `sm` and `lg`.
Select, PhoneInput and Segmented follow Input and NativeSelect; numeric input/select `size` keeps
its native meaning. See the [v4 migration guide](../../docs/migrating-v3-to-v4.md#form-control-visual-sizing).

## Install

```bash
pnpm add @santi020k/lumen-elements
```

The adapter also exposes Lumen's discovery and diagnostics CLI:

```bash
pnpm exec lumen show Tabs
pnpm exec lumen doctor
```

Load the shared stylesheet once from your app entry or global CSS.

```css
@import "@santi020k/lumen-elements/styles.css";
```

Pair granular registrations with `@santi020k/lumen-elements/styles/critical.css` when the product
uses only the essential forms, feedback, tabs, dialogs, calendar, and data-table surface. Use the
complete stylesheet for the full element catalog.

The stylesheet defaults `--ui-font` to `"Montserrat", "Avenir Next", "Segoe UI", sans-serif`.
It declares the family stack but does not bundle or load font files. Load Montserrat once through
your preferred delivery path, or override `--ui-font` in application CSS.

## Appearance presets

Wrap registered components in `data-lumen-preset="studio"`; ThemeBuilder preset buttons use `data-ui-theme-preset`. See [appearance presets](../../docs/appearance-presets.md).

## Usage

Register the elements once per custom-element registry, then use `lumen-*` tags anywhere HTML is
valid. Repeated calls are idempotent, and an explicitly supplied scoped registry is populated
independently from the document registry.

```html
<script type="module">
  import { defineLumenElements } from '@santi020k/lumen-elements/define'

  defineLumenElements()
</script>

<lumen-card>
  <lumen-label id="email-label">Email</lumen-label>
  <lumen-input aria-labelledby="email-label" id="email" type="email" placeholder="you@example.com"></lumen-input>
  <lumen-button>Subscribe</lumen-button>
</lumen-card>
```

To limit registration to the tags a scoped surface owns, pass their catalog names before an
optional custom registry:

```ts
import { defineLumenElements } from '@santi020k/lumen-elements/define'

defineLumenElements(['Card', 'Input', 'Button'])
```

The component-name list is typed, duplicate names are ignored, already-registered tags are
preserved, and omitting it retains complete-catalog registration. This controls registry scope, but
the `define` module still contains the complete implementation.

For a small surface that uses only Badge, Button, Card, and Combobox, import their implementation-level
entrypoints instead:

```ts
import { defineLumenBadge } from '@santi020k/lumen-elements/components/badge'
import { defineLumenButton } from '@santi020k/lumen-elements/components/button'
import { defineLumenCard } from '@santi020k/lumen-elements/components/card'
import { defineLumenCombobox } from '@santi020k/lumen-elements/components/combobox'

defineLumenBadge()
defineLumenButton()
defineLumenCard()
defineLumenCombobox()
```

Each function accepts an optional custom-element registry, is idempotent, and registers the exact
constructor used by the complete catalog. The Combobox entrypoint includes its filtering, keyboard,
selection, dismissal, and focus behavior without importing the complete catalog. Other components
still use `defineLumenElements`; do not replace the full entrypoint when the application needs a
behavior-backed element that does not yet have a granular module.

VirtualList also has an independent registration entrypoint, including windowing and cleanup:

```ts
import { defineLumenVirtualList } from '@santi020k/lumen-elements/components/virtual-list'

defineLumenVirtualList()
```

It registers the same constructor as the full catalog and accepts an optional registry. Pair it
with the matching stylesheet. `pnpm run measure:selective-imports` compares this entry with the
complete catalog using an equivalent single-component consumer.

Foundation-only pages can register fifteen layout, composition, and accessibility elements as one
small implementation-level bundle:

```ts
import { defineLumenFoundations } from '@santi020k/lumen-elements/components/foundations'

defineLumenFoundations()
```

This bundle contains the Card compound parts, Container, Direction, Grid, Label, Separator,
Skeleton, Spinner, Stack, Typography, and VisuallyHidden. It does not import the complete catalog.

`lumen-phone-input` can generate its complete country and telephone controls. It exposes `value`,
`valid`, and `e164`, and emits `ui:phone-change` with the normalized phone model. Country names and
calling codes remain visible so the flag is never the only identifier.

```html
<lumen-phone-input country="CO" locale="en-US" name="hospitalPhone"></lumen-phone-input>
```

## Language selection

`lumen-language-toggle` cycles through an ordered JSON `locales` list and generates visible
next-language text plus an accessible label. Uncontrolled usage synchronizes
`document.documentElement.lang`; `storage-key` also restores and persists the selection when
browser storage is available.

```html
<lumen-language-toggle
  default-value="en"
  locales='[{"label":"English","value":"en"},{"label":"Español","value":"es"}]'
  storage-key="site-language"
></lumen-language-toggle>
```

The element defaults to English and Spanish when `locales` is absent or has no valid entries. Use
`label-template="Switch language from {current} to {next}"` to customize its accessible label; the
`{current}` and `{next}` placeholders expand to the configured labels. Custom child content
replaces only the generated visible label.

Every activation emits a bubbling, composed `ui:language-change` event with
`{ previousValue, value }`. Adding a `value` attribute enables controlled usage: the event requests
the next locale, while the application updates `value`, document language, and persistence.

```js
const languageToggle = document.querySelector('lumen-language-toggle')

languageToggle.addEventListener('ui:language-change', event => {
  languageToggle.setAttribute('value', event.detail.value)
  document.documentElement.lang = event.detail.value
})
```

## Forms

Use a native `<form data-ui-form>` as the container. Scalar Lumen controls are form-associated
custom elements: they expose `value`, `form`, `validity`, `validationMessage`, `willValidate`,
`checkValidity()`, `reportValidity()`, and `setCustomValidity()`, plus `checked` where relevant.
They participate in `FormData`, disabled state, reset, focus, and state restoration. A single
internal native control provides the same contract when `ElementInternals` is unavailable.

```html
<form data-ui-form method="POST">
  <lumen-input name="email" required type="email"></lumen-input>
  <lumen-password-field name="password" required></lumen-password-field>
  <lumen-button type="submit">Sign in</lumen-button>
</form>
```

`lumen-input` forwards the numeric `size` attribute to its internal native input. Use
`visual-size="sm"` or `visual-size="lg"` for presentation.

```html
<lumen-input name="code" size="12" visual-size="sm"></lumen-input>
<lumen-native-select size="8" visual-size="lg"></lumen-native-select>
```

## Context navigation

Use `lumen-context-navigation` below a primary header when links change with a selected platform,
product, or workspace. Mark the stable selector or identity with `slot="context"` and compose the
related links with one independently named navigation menu. Long link sets scroll horizontally.

```html
<lumen-context-navigation>
  <lumen-native-select
    slot="context"
    aria-label="Documentation platform"
    visual-size="sm"
  >
    <option>Web</option>
    <option>Apple</option>
    <option>Android</option>
  </lumen-native-select>
  <lumen-navigation-menu aria-label="Web documentation" variant="unstyled">
    <a href="/docs/web" aria-current="page">Overview</a>
    <a href="/docs/components">Components</a>
    <a href="/docs/web/playground">Playground</a>
  </lumen-navigation-menu>
</lumen-context-navigation>
```

See the [Elements form guide](https://lumen.santi020k.com/docs/forms/elements).

Use `lumen-icon` for Lucide icons by name across framework adapters.

```html
<lumen-button variant="secondary">
  <lumen-icon name="wand-sparkles" decorative></lumen-icon>
  Generate
</lumen-button>
<lumen-icon name="search" label="Search"></lumen-icon>
```

Use `lumen-scroll-progress` on long reading surfaces. Registration supplies its scroll behavior,
accessible value, and top or bottom positioning.

```html
<lumen-scroll-progress
  aria-label="Article reading progress"
  position="top"
></lumen-scroll-progress>
```

## Statistics

Use `variant="default"` for the original neutral surface, `variant="accent"` for a featured metric,
or `variant="glass"` for selective translucency.

```html
<lumen-stat label="Active workspaces" value="1,234" variant="accent">
  <p>Across all production organizations.</p>
</lumen-stat>
```

## Data visualization

The web visualization milestone adds `WaterfallChart` for signed changes and explicit totals, and
`Histogram` for precomputed numeric bins (`frequency="density"` for unequal widths). Line charts
support explicit continuous axes, annotations, optional keyboard/pointer/touch inspection, and
synchronized cursors. Heatmaps show labeled axes, a color legend, and explicit missing cells.
Heatmap JSON is validated as a complete collection: a malformed row rejects the dataset instead
of displaying a partial result. Null and nonfinite numeric measurements remain missing cells.
See the [visualization contracts](../../docs/data-visualization.md) and
[interactive web example](https://lumen.santi020k.com/docs/web/data-visualization).

Use `<lumen-histogram bins="...">` and `<lumen-waterfall-chart data="...">` with JSON arrays.
`<lumen-line-chart interactive x-scale="time" sync-group="report">` emits
`ui:chart-cursor-change` with `{ x }`. Set `annotations` to a JSON array.


Set serializable `series` data through the JavaScript property for application data. The JSON
attribute form is useful for static HTML and server output.

```html
<lumen-line-chart
  aria-label="Views by day"
  heading="Website traffic"
  series='[{"id":"views","label":"Views","data":[{"x":"Mon","y":42},{"x":"Tue","y":68}]}]'
></lumen-line-chart>
```

`lumen-sparkline` also accepts comma-separated or JSON `values`. Every data chart includes a
revealable semantic table unless `show-table="false"` is set. `lumen-pie-chart` uses the first
serialized series and defaults to `variant="donut"`.

## Optimized images

Image optimization belongs to the host framework or CDN. Keep its generated `picture`, `srcset`,
and `sizes` output, and put Lumen's `ui-image` class on the final `img`. This works with optimized
markup from Nuxt, SvelteKit, a CMS, an image CDN, or a static build pipeline without sending the
image through a second component.

```html
<picture>
  <source srcset="/team.avif" type="image/avif">
  <source srcset="/team.webp" type="image/webp">
  <img
    alt="Team collaborating around a table"
    class="ui-image"
    decoding="async"
    height="800"
    loading="lazy"
    sizes="(max-width: 768px) 100vw, 50vw"
    src="/team.jpg"
    width="1200"
  >
</picture>
```

Add `ui-image--invert-dark` only to monochrome artwork that needs inversion on dark themes.

Elements emit the same `ui-*` classes and `data-ui-*` attributes as the Astro primitives. Astro
remains the reference package, and the Web Components adapter now carries matching light-DOM
behavior for DataTable, Dialog, Popover, DropdownMenu, ContextMenu, Tabs, Select, ThemeBuilder,
Toast, Tooltip, forms, Calendar, InputOTP, DateRangePicker, RichTextEditor, Schedule, Resizable,
VirtualList, FileUpload, Tour, Anchor, CopyButton, Progress, Transfer, Mentions, Cascader, and TreeSelect: selection,
validation, calendar grids, OTP segmentation, date range syncing, rich text command, context menu,
schedule and file drag/drop, anchored tours, scroll spy, collection transfer, mention insertion,
hierarchical selection, resizable pane sizing, theme, and range events, ARIA state, keyboard
navigation, Escape/outside dismissal, focus return/trapping, native form participation, and the
document-level toast controller events.

## Interactive behavior

Disclosure keyboard navigation skips hidden or inert regions, invisible controls, and native
disabled controls, including a disabled fieldset. Available controls in a fieldset's first legend
retain their native keyboard behavior; removing `inert` makes a region available again.

Mentions keeps suggestion navigation on the textarea through `aria-activedescendant`; suggestion
buttons are excluded from the Tab sequence while Enter and pointer selection still insert a mention.

Registering the elements wires behavior-heavy primitives without a framework runtime. DataTable,
Dialog, Popover, DropdownMenu, ContextMenu, Tabs, Select, ThemeBuilder, Toast, Tooltip, forms,
Calendar, InputOTP, DateRangePicker, RichTextEditor, Schedule, Resizable, and VirtualList track the
Astro runtime's data event, validation, calendar grids, OTP segmentation, date range syncing, rich
text command, context menu, schedule drag/drop, resizable pane sizing, theme export, ARIA,
keyboard, Escape, dismissal, and toast controller semantics while keeping markup declarative and
Declarative-Shadow-DOM friendly.
Calendar attribute updates preserve the focused day in the owning document after iframe adoption.
Calendar form resets restore the latest configured `value` attribute; interactive date selections
do not replace that reset baseline. Form error summaries can focus associated native controls
outside the form subtree when their `form` attribute names that form.
FileUpload, Tour, Anchor, CopyButton, Progress, ScrollProgress, Transfer, Mentions, Cascader, and TreeSelect also run directly through
their registered custom elements; no Astro runtime or host controller is required.
Rich text controls may provide `data-ui-editor-value` for commands such as `formatBlock` and
`createLink`; editable surfaces emit `ui:editor-change` with both HTML and plain text, support common
formatting shortcuts, and keep toggle controls synchronized through `aria-pressed`.
`lumen-tabs` keeps the selected trigger visible in narrow horizontal lists and emits
`ui:tabs-change`; import `LumenTabsChangeDetail` or `LumenTabsChangeEvent` for its typed detail.

Nested `lumen-tabs` and `lumen-code-tabs` keep independent selection and panel state. Keyboard
navigation skips disabled triggers and stays within the active tab group.

`<lumen-kanban-board>` and `<lumen-kanban-column value="…">` provide the same controlled board
contract. Mark ordinary card items with `data-ui-kanban-item` and put `data-ui-kanban-handle` on a
dedicated button. The board emits the cancellable `ui:kanban-move-request` event for keyboard,
mouse, and touch movement without moving DOM or application data. Use
`<lumen-empty variant="compact">` for column-level empty states.

```html
<p id="invite">Join the Lumen workspace</p>
<lumen-copy-button target="#invite" toast>Copy invite</lumen-copy-button>
<lumen-progress aria-label="Upload progress" value="40"></lumen-progress>
```

```html
<script type="module">
  import { defineLumenElements, LumenToast } from '@santi020k/lumen-elements'

  defineLumenElements()

  LumenToast.create({
    title: 'Saved',
    description: 'Your changes are live.',
    variant: 'success'
  })
</script>

```

You can also use the shared document events: dispatch `ui:toast` to create, `ui:toast-update` to
update, and `ui:toast-dismiss` to dismiss runtime toasts. Toast actions emit `ui:toast-action`
unless an action supplies a custom event name.

Use `<lumen-error-state>` when a region or page cannot show its primary content. Keep its visible
heading, explanation, optional safe reference, and recovery actions in light DOM, label the region
with `aria-labelledby`, and use the documented `data-slot="error-state-*"` hooks. Lumen presents the
failure; application code owns exception capture, logging, and retry policy. See the repository
[Web Components error-handling guide](../../docs/error-handling.md#web-components) for the complete
light-DOM structure, ARIA ownership, retry boundary, and verification guidance.

## Motion

The elements adapter exposes the same motion vocabulary as Astro and React. Use
`lumen-scroll-reveal` for one entrance, `lumen-reveal-group` for a short staggered sequence, and
`lumen-animated-number` for meaningful metric changes. They honor reduced-motion preferences.

```html
<lumen-reveal-group animation="slide-up" stagger="80">
  <lumen-card>Plan</lumen-card>
  <lumen-card>Build</lumen-card>
  <lumen-card>Ship</lumen-card>
</lumen-reveal-group>

<lumen-animated-number decimals="1" suffix="%" value="99.8"></lumen-animated-number>
```

### Elements labels and dialogs

`lumen-input` owns an internal native control. Name that control using `aria-labelledby` pointing
at a visible label, or `aria-label` on the host. A native label's `for` pointing only at the custom
host does not name the internal input. Use the public `lumen-label` for visible label styling.
Do not type a custom host as `HTMLInputElement` or `HTMLButtonElement`; use its exported element
class and runtime narrowing when accessing element-specific methods.

Use `lumen-dialog` as the behavior owner. Its public methods are `show(trigger?)` and `close()`,
not `showModal()` on the custom host. A native `dialog` child is its documented modal contract:

```html
<lumen-button data-ui-dialog-trigger="profile-dialog">Edit profile</lumen-button>
<lumen-dialog id="profile-dialog">
  <dialog aria-labelledby="profile-title">
    <h2 id="profile-title">Profile settings</h2>
    <lumen-field>
      <lumen-label id="profile-name-label">Display name</lumen-label>
      <lumen-input aria-labelledby="profile-name-label" value="Ada"></lumen-input>
    </lumen-field>
    <lumen-button data-ui-dialog-close type="button">Cancel</lumen-button>
  </dialog>
</lumen-dialog>
```

Register `Button`, `Dialog`, `Field`, `Input`, and `Label` through `defineLumenElements` before use.
The dialog behavior focuses its first focusable control, handles Escape, traps focus, and returns
focus to its trigger. Keep draft state in the form control or application; closing does not reset it.
Do not replace this behavior with a parallel native-dialog controller.

## Glass surfaces

Load `@santi020k/lumen-elements/styles.css` once, register the elements, then use the shared glass
attributes.

```html
<lumen-card glass>Glass card</lumen-card>
<lumen-dialog glass>Glass dialog</lumen-dialog>
<lumen-popover glass>Glass popover</lumen-popover>
<lumen-date-picker glass="subtle"></lumen-date-picker>
<lumen-select glass="strong"></lumen-select>
```

## Consumer composition recipes

See [consumer UI recipes](../../docs/consumer-ui-recipes.md) for static React icons, responsive
record tables, keyboard-aware native sheets, whole-unit amount fields, adaptive editors, and
asynchronous action states. Each recipe identifies the public primitives and the behavior that
remains owned by the application.

## Exact amount fields

`lumen-amount-field` creates a visible localized input and a named hidden input containing the
complete ASCII decimal string. `ui:amount-change` reports `{ draft, value }`; incomplete drafts
have an undefined value. A host ID `amount` gives its visible input ID `amount-input` for labels.

```html
<lumen-amount-field name="amount" locale="es-CO" default-value="1234.50"
  aria-label="Amount COP"></lumen-amount-field>
```

See [consumer workflows](../../docs/consumer-ui-recipes.md#executable-consumer-workflows) for
validation, reset and `auto-scroll` activity feeds.

## Resources

| Guide | What you will find |
| --- | --- |
| [Styling contract](https://github.com/santi020k/lumen/blob/main/docs/styling-contract.md) | Reference for styling contract. |
| [Error handling](https://github.com/santi020k/lumen/blob/main/docs/error-handling.md) | Reference for error handling. |
| [Contributing](https://github.com/santi020k/lumen/blob/main/CONTRIBUTING.md) | Setup, checks, and contribution workflow. |
| [Release history](https://github.com/santi020k/lumen/releases) | Published releases and version notes. |

Part of [Lumen UI](https://lumen.santi020k.com), created by [Santiago Molina](https://santi020k.com).
Licensed under [MIT](https://github.com/santi020k/lumen/blob/main/LICENSE); third-party artwork retains its own notices.

### Accessible code examples

`<lumen-code variant="block" copy>` enhances its native `pre > code` child with a
copy button. Use `copy-label`, `copied-label`, and `error-label` for clipboard
feedback, and `code-label` to name its keyboard-scrollable source region. The same
labels can be placed on an enclosing `<lumen-code-tabs>`; child labels take
precedence. Copy emits `ui:copy-success` or `ui:copy-error` and announces feedback
in a live region. Clipboard failures leave the source available for manual copy.

Unwrapped `pre` children receive `tabindex="0"` and region semantics while keeping
authored accessible names. Generated names follow `code-label` updates and the current enclosing code tabs after reconnecting. Changing to `wrap="true"` removes only enhancer-added focus attributes.
Disabling `copy` removes only generated copy controls and cancels pending feedback.
With `wrap="true"`, the component does not add an extra
tab stop. Keep native `pre` and `code` children rather than placing source text in
HTML attributes.

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
Both controls lock together and validation remains associated with the input.

The `phone-input`, `phone-country`, and `country-flag` styling parts plus `--ui-phone-height`,
`--ui-phone-padding`, and `--ui-phone-country-gap` replace consumer CSS overlays.

Astro and React also export `CountryFlag` (`regionCode`, optional `decorative`) and `PhoneNumber`
(`value: LumenPhoneNumber`, optional `link`). A telephone link is rendered only for a complete
E.164 value. Use the model returned by the phone normalizer; keep domain persistence in your app.
Artwork attribution is shipped with the core package in `PHONE_FLAG_LICENSE.txt`.

When `PhoneInput` is registered, `defineLumenElements` also registers `lumen-country-flag`
(`country`, `decorative`, optional `label`) and `lumen-phone-number` (`country`, `value`, `link`,
optional `locale`). The read-only element normalizes its string value before creating a tel link.

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

Forms validate native controls associated through the `form` attribute even outside the form tree.
Timed toasts retain their remaining duration until both pointer hover and keyboard focus leave.

### Compound dialog tasks

Register `DialogHeader`, `DialogTitle`, `DialogBody`, `DialogFooter`, and
`DialogClose` with `Dialog`. Keep the body directly inside the dialog host for
independent scrolling. Use a native heading inside the title host and a native
button inside the close host; their semantics and disabled behavior remain native.
Associate the heading id with the dialog's `aria-labelledby`.

```html
<lumen-dialog aria-labelledby="record-title">
  <lumen-dialog-header>
    <lumen-dialog-title><h2 id="record-title">Edit record</h2></lumen-dialog-title>
  </lumen-dialog-header>
  <lumen-dialog-body><form id="record-form"><label>Name <input name="name"></label></form></lumen-dialog-body>
  <lumen-dialog-footer>
    <lumen-dialog-close><button type="button">Cancel</button></lumen-dialog-close>
    <button type="submit" form="record-form">Save</button>
  </lumen-dialog-footer>
</lumen-dialog>
```

A cancelled click or disabled native button does not dismiss the dialog. Nested
close actions only dismiss their own dialog. `lumen-file-upload` accepts
`selected-files-label` containing `{count}` for localized multiple-file feedback.

### Rich description rows

Register `Descriptions`, `DescriptionItem`, `DescriptionTerm`, and `DescriptionDetail`
to compose rich values. The item, term, and detail hosts expose `group`, `term`, and
`definition` roles respectively. Use a labeled group for the overall collection and
associate the detail with its term when the relationship needs an explicit label.
These custom hosts provide ARIA semantics; they are not native `dl`, `dt`, or `dd` tags.

```html
<lumen-descriptions role="group" aria-label="Record details">
  <lumen-description-item>
    <lumen-description-term id="status-label">Status</lumen-description-term>
    <lumen-description-detail aria-labelledby="status-label"><strong>Active</strong></lumen-description-detail>
  </lumen-description-item>
</lumen-descriptions>
```

For native definition-list markup, place a complete native `dl` with `div`, `dt`,
and `dd` children inside `lumen-descriptions` instead of nesting custom hosts inside the `dl`.

### Stepper progress

`lumen-stepper` is a generic element: it applies the shared `ui-stepper` presentation class and
`ui-stepper--vertical` for `orientation="vertical"`, but owns no step generation or current-step
behavior. Provide the complete step markup as light-DOM children:

```html
<lumen-stepper role="list" aria-label="Setup steps">
  <div class="ui-stepper__step" data-state="complete" role="listitem">
    <span class="ui-stepper__marker">1</span>
    <span class="ui-stepper__content"><span class="ui-stepper__title">Account</span></span>
  </div>
  <div aria-current="step" class="ui-stepper__step" data-state="current" role="listitem">
    <span class="ui-stepper__marker">2</span>
    <span class="ui-stepper__content"><span class="ui-stepper__title">Workspace</span></span>
  </div>
</lumen-stepper>
```

Each step is a native `div` with `role="listitem"`, `class="ui-stepper__step"`, and
`data-state="complete" | "current" | "upcoming"`. Give the current step `aria-current="step"`. Each
step holds a `ui-stepper__marker` span and a `ui-stepper__content` span containing a
`ui-stepper__title` span and an optional `ui-stepper__description` span.

## Attachment composition

Use `AttachmentList` to group native `li` children and `AttachmentPreview` for browser-owned images
with localized loading, error, and unsupported-file states. Compose independent actions rather
than nesting controls inside a linked Attachment. The application retains file validation,
authorization, persistence, and object URL cleanup. See the
[attachment composition recipe](../../docs/consumer-ui-recipes.md#attachment-previews-and-file-lists)
for adapter props, slots, child contracts, retry identity, and safe state events.

### Chart datum actions

All seven data charts accept the opt-in `drilldown` attribute. Each plotted observation gains a
pointer target and a matching native button under an accessible disclosure, even with
`show-table="false"`. Listen for the bubbling, composed `ui:chart-datum-activate` event on the chart
host; its validated `LumenChartDatumActivationDetail` contains original data identities and values.
Missing measurements and invalid ranges have no actions; pie charts expose only positive slices.

```html
<lumen-bar-chart drilldown explore-data-label="Explore chart data"
  datum-action-prefix="Open details: " show-table="false"></lumen-bar-chart>
```

Use the `explore-data-label` and `datum-action-prefix` attributes for localized text, or assign a
`datumActionFormatter(context)` property for a contextual label formatter. The exported
`LumenChartDatumActionsElement` type describes this host property contract. Updating series, data,
or labels preserves the open disclosure and restores focus to the same available action. Chart
hosts own their controller lifecycle across disconnect/reconnect; mixed Astro pages leave these
hosts to Elements. Application code owns navigation, requests, and filtering.

## Dashboard composition

`FilterBar` groups host-owned filtering controls, active criteria, reset actions, and a polite
result announcement. `ChangeSummary` presents explicit before/after values and application-owned
changed state. Neither component owns requests, persistence, parsing, or financial policy.

ScatterChart supports independent X/Y formatting, explicit domains, logarithmic positive X values,
and labeled reference lines/regions. See [consumer UI recipes](../../docs/consumer-ui-recipes.md)
for dashboard tables, freshness, import review, activity inbox, and persistent Kanban patterns.

### Actual-versus-target charts

`lumen-bullet-chart` compares a nullable actual `value` with a finite `target` and optional
labeled `ranges`. A strong actual bar, target marker, readable value labels, and expandable exact
data work together. Domains include zero and all measurements; invalid inputs fail closed.
Null values stay distinct from zero. See the [chart guide](../../docs/data-visualization.md#actual-values-and-targets)
for the input, localization, and domain contracts.

### Rankings and paired comparisons

Use `LollipopChart` for zero-based rankings and `DumbbellChart` for paired measurements (native
`LumenLollipopChart` and `LumenDumbbellChart`). Supply ordered comparison data with `id`, `label`,
nullable `value`, optional nullable `reference`, and optional `tone`. Both charts preserve missing
values and expose exact data. Set `value-label` to name the current measurement and `reference-label`
to name the paired measurement; `summary` supplies an escaped accessible interpretation that remains
available when `show-table="false"`. See the [shared visualization contract](../../docs/data-visualization.md#rankings-and-paired-comparisons).


### Calendar activity, ordered stages and distributions

`CalendarHeatmap`, `FunnelChart`, and `BoxPlot` share validated geometry with every Lumen adapter.
CalendarHeatmap takes date-only UTC `startDate`/`endDate`, nullable `{ date, value }` data and optional
`weekStartsOn` (0 for Sunday or 1 for Monday). It fills omitted dates as missing, keeps zero distinct,
and limits the inclusive range to 3,660 days. `weekdayLabels` always indexes Sunday through Saturday;
`dateFormatter` customizes readable dates without changing their identity.

FunnelChart takes ordered `{ id, label, value, tone? }` stages with nonnegative nullable values.
Stages retain the supplied order, including increasing values; the chart derives no conversion rates.
BoxPlot takes precomputed `{ id, label, min, q1, median, q3, max, outliers?, tone? }` statistics.
Statistics must be ordered and finite, or all five must be null for a missing row. Explicit domains
must contain all observations and outliers. `statisticLabels` localizes the six statistic names.

All three accept `valueFormatter`, chart `labels`, `summary`, and `show-table` (default true).
Exact data and missing measurements remain readable; invalid input fails closed instead of dropping
observations or clipping the domain. Prefer retaining the data table for complete visual inspection.

Register `CalendarHeatmap`, `FunnelChart`, and `BoxPlot` through `defineLumenElements`.
Use `<lumen-calendar-heatmap start-date="2026-01-01" end-date="2026-01-31">`,
`<lumen-funnel-chart>`, and `<lumen-box-plot>`. Assign typed `data`, `labels`, `valueFormatter`,
`dateFormatter`/`weekdayLabels` (calendar), and `statisticLabels` (box) properties, or supply JSON
`data` attributes. Calendar supports `week-starts-on` and JSON `weekday-labels`; domains use
`domain-min`/`domain-max`. Box statistic attributes are `min-label`, `q1-label`, `median-label`,
`q3-label`, `max-label`, and `outliers-label`. `show-table="false"` hides exact-data disclosure;
provide an application-owned summary when additional interpretation is useful.

## Combobox lifecycle

`lumen-combobox` enhances its input and listbox when both are available. Children can arrive after
connection or be replaced by an application renderer. Disconnecting the host releases listeners
and observers; reconnecting binds the current children.

Decoded chart annotations ignore invalid supplied axes; omitted axes use the shared `y` default.

React hosts can assign `type` on scalar input elements before or after connection. The input
reflects that property to its native control without clearing the value. Register elements once
at the app boundary and handle their bubbling native input events.

`lumen-button` activates with Enter or a Space release. Canceled Enter events, canceled Space
keydown events before the host handles them, and canceled Space releases suppress activation. The
host consumes Space keydown to prevent scrolling; cancel its key release or click to suppress activation
from an ancestor after that keydown has been consumed. It blocks
disabled/loading activation, including direct clicks. Blocking flags expose `aria-disabled`;
removing them restores any prior application-supplied ARIA value. Native nested controls retain
their own keyboard path.

## Device demonstrations

`DeviceFrame` presents slotted HTML, an image, or a titled iframe inside `macbook-pro`, `imac`,
`iphone`, and `pixel` frames, with generic `laptop`, `desktop`, `android`, and `tablet` options.
Device-specific enclosures include a tapered laptop deck, curved iMac stand and chin, rounded phone
glass with separate metal rails and buttons, and a tablet home recess.
Shells are decorative and do not emulate device hardware. `orientation` selects portrait or landscape; `tone` selects
light or dark chrome independently of the screen content. Use `color="white"`,
`color="black"`, or a 3-, 4-, 6-, or 8-digit hex color such as `color="#a9b8ac"` for
a custom hardware finish. `color` takes precedence over `tone`; invalid values fall back to the
tone. The finish stays independent of the content theme. For CSS-driven updates, set
`--ui-device-color` to a CSS color on the frame.

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

```html
<lumen-device-frame device="android" tone="light">
  <iframe src="/demo" title="Mobile application demo" loading="lazy"></iframe>
</lumen-device-frame>
```

Register with `defineLumenElements(['DeviceFrame'])` or `defineLumenDeviceFrame()` from
`@santi020k/lumen-elements/components/device-frame`. Use `screen-width`, `screen-height`, and
`scroll="false"` attributes. The element preserves the initial child nodes inside its screen;
append later content to `.ui-device-frame__screen`.
## Visual interactions and product blocks

See [visual interactions](../../docs/visual-interactions.md) for keyed motion, semantic effects,
chart continuity, AI surfaces, optional SDK integrations, and the four installable product recipes.

## World map

WorldMap supports highlighted countries, location markers, dotted or solid styles, country selection,
and theme customization. Use `initialView="highlighted"` (Elements: `initial-view`) to start with a
regional view. Zoom toward the cursor with Ctrl/Cmd-scroll, or fit highlighted countries using the
map controls. Import geography explicitly from
`@santi020k/lumen-core/world-map-data`; it is excluded from root exports. See the
[WorldMap usage guide](../../docs/world-map.md) for adapter examples, events, localization,
accessibility, and customization.

## Studio media workspace

Compose MediaViewport, MediaThumbnail, MediaFilmstrip and ImageComparison modes with the
[Studio media workspace recipes](../../docs/studio-media-workspaces.md). Applications retain
media loading, selection, adjustment algorithms, processing, export and persistence.
