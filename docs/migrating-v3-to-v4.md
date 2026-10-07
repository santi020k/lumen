# Migrating from Lumen 3 to Lumen 4

This guide targets the local `release/v4.0.0` candidate, using `v3.0.1` as the Swift API baseline.
V4 is unpublished and its contract is still draft. These instructions describe the checked-in
candidate, not a completed production release. Review the [readiness record](lumen-4-readiness.md)
and [v4 contract](../registry/lumen-4-contract.json) before choosing a release revision.

## Upgrade the dependencies

1. Commit a working v3 baseline with manifests and lock files, and record your current Lumen pins.
2. Update only the adapters and companion packages your application uses. Do not install every
   adapter. Keep their versions aligned with the [release manifest](../registry/release-manifest.json),
   including direct core, token, icon, template, form-integration, and MCP dependencies when used.
3. Before publication, evaluate built local packages or tarballs from one reviewed candidate
   revision. Native consumers must use that same revision or locally built artifacts. Do not
   assume `@4`, Swift tag `v4.0.0`, or Maven artifacts exist because manifests say `4.0.0`.
4. After v4 publication, update your existing dependencies to the published v4 versions, resolve
   their peer requirements, commit lock files, and rebuild the actual consumer.

For example, **only after publication**, an Astro application's adapter update is:

```bash
pnpm add @santi020k/lumen-astro@4
```

Use your application's own package manager. The Lumen repository's pnpm 12 requirement applies
only to contributors; it does not require consumer applications to change package manager.
Astro still imports its default runtime from `@santi020k/lumen-astro/runtime`; React still loads
`@santi020k/lumen-react/styles.css`; Elements still registers `defineLumenElements` once. Keep the
matching stylesheet and existing integration setup. Check adapter manifests and the
[native compatibility matrix](native-compatibility.md) for runtime and peer constraints.

The v4 umbrella CLI provides a conservative source migration preview:

```sh
lumen migrate v4 --dry-run
lumen migrate v4 --apply
```

It rewrites literal Stack/Grid gaps from v3 `md`/`lg`/`xl` to v4 `group`/`xl`/`2xl`, including
import aliases. It also moves literal visual sizes on Select, PhoneInput and Segmented to
`visualSize` / `visual-size`, mapping Select's old `md` alias to `default`. Numeric Select sizes
remain native. Dynamic values, spreads, application CSS, component behavior and native contracts
need manual review. Source-only migration supports applications using any package manager.

Add `--dependencies` to inventory or, with `--apply`, upgrade the coordinated npm family to
`4.0.0` through the existing pnpm rollout. That path uses a clean consumer checkout and its declared
pnpm version; other package managers use the dependency commands above. Installs precede source
rewrites, and a failed dependency command stops the source phase. Native pins remain application-owned.

Commit `.lumen/migrations-v4.json` with applied source changes. It prevents repeated gap rewrites;
later edits to migrated files require manual review. The command does not replace the checklist
below or the consumer's diagnostics, build, and interaction tests. `lumen migrate v2` continues to
handle only the earlier v1 → v2 contracts.


## Form control visual sizing

Select, PhoneInput and Segmented now use `visualSize` in Astro/React and `visual-size` in Elements,
matching Input and NativeSelect. Supported values are `default`, `sm` and `lg`; Select's old `md`
alias becomes `default`. These names describe appearance rather than the native control's row or
character count. Replace visual `size` props and update shared wrappers, spreads and dynamic values.

```tsx
// V3
<Select size="lg" />
<PhoneInput size="sm" />
// V4
<Select visualSize="lg" />
<PhoneInput visualSize="sm" />
```

Numeric `size` remains native on Input, NativeSelect and Select. PhoneInput's native input size uses
`inputProps.size`. Button/action, icon, container and native-platform sizing APIs remain unchanged.
The CLI rewrites recognized literal visual sizes, including aliases and Elements attributes;
dynamic, duplicated or spread props require review. Existing v4 migration ledgers still protect
previously migrated files from repeated spacing rewrites.

React Segmented now honors controlled `value`; update it through `onValueChange` to accept a new
selection, or use `defaultValue` for uncontrolled behavior. Elements scalar `checked` changes the
current selection without altering `defaultChecked`. Reconnected controls preserve events and
reset defaults; multiple NativeSelect submits all selected enabled options. Elements Select now
uses `ui-select-field` on its host and keeps `ui-select` on the native input and visible trigger;
update host-specific CSS selectors to avoid styling the frame as a second control. See the
[web form contracts](form-controls.md) for event and reset behavior.

## Content flow and layout spacing

For explicit web Stack/Grid gaps, preserve the old size with this map (pixel equivalents assume
an unchanged 16px root):

| V3 gap | V3 size | V4 replacement preserving size |
| --- | --- | --- |
| `none` | 0 | `none` |
| `sm` | 8px | `sm` |
| `md` | 16px | `group` or `lg` |
| `lg` | 24px | `xl` |
| `xl` | 32px | `2xl` |
| Omitted | 16px | Omit it, or use `group` |

```astro
<!-- V3 -->
<Stack gap="md"><slot /></Stack>
<!-- V4: preserve 16px between children -->
<Stack gap="group"><slot /></Stack>
```

React uses the same gap prop; Elements uses `gap` on `<lumen-stack>` and `<lumen-grid>`.


Web Stack/Grid gap sizes now match the canonical foundation scale: `md` is 12px, `lg` is 16px,
and `xl` is 24px. To preserve a v3 explicit layout, replace old `md` with `group` (or `lg`), old
`lg` with `xl`, and old `xl` with `2xl`. Defaults remain 16px through `gap="group"`. New choices
include `xs`, `2xl`, `3xl`, `related`, `group` and `section`; do not change native gap props by
applying this web-only migration. Native numeric spacing values are unchanged.

Card now owns direct-child spacing with gap instead of child margins. Comfortable padding becomes
24px; compact uses 16px and spacious 32px. Card content alone no longer receives a phantom top gap.
Hidden/empty parts leave no space and footer actions wrap. Remove compensating section margins,
negative offsets and child padding for the same relationship. Stack/Grid also reset direct-child
external margins; custom unlayered CSS and documented Card variables can override defaults.
Field spacing now uses the related token (8px). See [content flow](content-flow.md).

Container side gutters now grow from 16px on a narrow phone to 32px on wider screens. Set
`--ui-container-gutter: 1rem` on the Container to preserve a fixed gutter; `size="full"` is still
edge-to-edge. Prose and Typography trim their first/last child margins and give headings more room
above than below. Remove offsets that compensated for the old reading-block margins.

Card no longer clips overflow. Move media clipping into AspectRatio, keeping Image `radius="none"`
inside that rounded frame. Verify custom menus and focus rings rather than restoring card-wide
clipping. Wrapping Stack actions now allow long labels to wrap inside their available width.

Before publication, rollback is reverting this candidate commit or continuing to use released v3
packages. After publication, use a new version for corrections; do not move published tags.

## Before/after consumer examples

### Card spacing and media overflow

A common v3 workaround added margins between parts and clipped the whole Card. V4 owns that
spacing and allows menus/focus rings to extend beyond the Card. Remove only the compensating CSS
for these same relationships after verifying the consumer; retain unrelated product styling.

```astro
<!-- Before: report-card CSS supplied child margins and overflow: hidden. -->
<Card class="report-card">
  <CardHeader><CardTitle>Report</CardTitle></CardHeader>
  <CardContent><slot /></CardContent>
</Card>

<!-- After: public density owns padding; the media frame owns clipping. -->
<Card density="compact">
  <CardHeader><CardTitle>Report</CardTitle></CardHeader>
  <CardContent>
    <Stack gap="group">
      <AspectRatio ratio="16 / 9" class="report-media">
        <Image src="/report-cover.webp" width={640} height={360} alt="Report cover" radius="none" />
      </AspectRatio>
      <slot />
    </Stack>
  </CardContent>
</Card>
```

```css
/* Before: remove these relationship-specific compensations. */
.report-card { overflow: hidden; }
.report-card > * + * { margin-top: 1rem; }

/* After: clip only the image frame, using the existing radius token. */
.report-media { border-radius: var(--ui-radius-lg); overflow: hidden; }
```

Verify a Card with content alone, hidden header/footer parts, long wrapping actions and a focused
control or floating menu near its edge. Spacing and clipping are separate checks.

### Controlled selection and reset ownership

A supplied `value` is now a controlled contract. Accept the callback into application state when
selection is allowed; leaving the callback absent keeps the displayed selection unchanged.

```tsx
// Before: a value prop without accepting change intent.
<Segmented value={period} options={periods} />

// After: the application owns accepted changes and explicit resets.
<Segmented value={period} onValueChange={setPeriod} options={periods} />
<Button type="button" onClick={() => setPeriod('week')}>Reset period</Button>
```

Here `period` is a string from application state and `periods` is the existing option array. Use
`defaultValue` instead when native uncontrolled selection is intended. Do not introduce both
controlled and default values or write DOM state around the component. Native form reset restores
uncontrolled defaults silently; reset controlled state explicitly in the application's accepted
reset handler. Test canceled reset, repeated selection and form submission before removing an
old event bridge. See [form controls](form-controls.md).

### Stable chart identities and full localized detail

Repeated display labels are not data identities. Keep stable X values, provide abbreviated
`xLabel` values for the axis, and use `formatCategory` for full detail/table labels.

```tsx
// Before: two different days collapsed onto the same localized identity.
const before = [{ x: 'Mon', y: 12 }, { x: 'Mon', y: 18 }]

// After: application-owned date-only identities and separate display labels.
const data = [
  { x: '2026-09-28', xLabel: 'Mon', y: 12 },
  { x: '2026-10-05', xLabel: 'Mon', y: 18 }
]
const dates: Record<string, string> = {
  '2026-09-28': 'Monday, September 28, 2026',
  '2026-10-05': 'Monday, October 5, 2026'
}
<LineChart
  series={[{ id: 'reports', label: 'Reports', data }]}
  formatCategory={value => dates[String(value)] ?? String(value)}
  formatValue={value => String(value)}
  showTable
/>
```

Resolve localized detail strings in the application. Do not parse these date-only keys through a
UTC timestamp merely to format them. Check empty, singleton, duplicate-identity and long-label
cases at phone and desktop widths before deleting old axis or chart-margin CSS. A repeated `xLabel`
is valid; a repeated X identity is a validation issue. Plot and table must retain the same records.

### Native initializer references and final timeline items

Rebuild native consumers; defaulted new parameters can preserve ordinary calls while changing a
stored initializer's function type. Prefer a small closure that calls the current public initializer
with explicit application choices instead of retaining a v3 initializer reference.

```swift
// Before: ordinary calls used the default trailing connector.
LumenTimelineItem { LumenText("Report created") }

// After: the final visible item ends the connector; re-evaluate after filtering/reordering.
LumenTimelineItem(isLast: true) { LumenText("Report created") }

// A named factory makes the current initializer choices explicit.
let makeFinalItem = {
    LumenTimelineItem(isLast: true) { LumenText("Report created") }
}
```

For a native sheet containing a lazy list, set the current `scrollable` option to false and let that
list own scrolling. Bind `dismissible` to the app's pending-save policy rather than swallowing
platform dismissal outside Lumen. See [native sheet composition](native-components.md)
and the [native progression recipes](native-progression-recipes.md). No persisted data is rewritten
by these source/API migrations.

## Component behavior checklist

Lumen 4 consolidates fixes from twenty consumer audits. Upgrade the adapter and its companion
packages together, import the matching stylesheet, and rebuild native consumers. The v4 branch
is a local release candidate; published projects in the showcase still use their deployed versions.

| Surface | Required review |
| --- | --- |
| Charts | Use stable, unique X identities. Duplicate identities report validation issues and only the first observation appears in the plot and data table. Use `xLabel` for short axis text and `formatCategory` for full details. Remove old padding, axis and graph-background patches only after comparing the real chart. |
| React DataTable | For server-paginated results, use controlled `sort`/`onSortChange` and `sortMode="manual"`. Fetch sorted data before pagination; the table preserves the supplied page order. |
| React Dialog | Set `dismissOnOutsidePress` and `dismissOnEscape` explicitly for pending workflows. Focus returns to the connected opener, including controlled dialogs and nested modal cleanup. |
| Web dates | `DatePicker` puts `id` on its focusable trigger; the native date input uses `${id}-native`. Associate labels with the trigger. Dates remain strict local-calendar `YYYY-MM-DD` strings. Invalid, reversed or out-of-bounds ranges cannot be applied. |
| Buttons | The visible label lives inside `.ui-button__content`, including while loading. Review direct-child CSS selectors. Disabled/loading slotted actions block click and keyboard activation; independently disable nested file inputs or other interactive descendants. |
| Hidden content | The native `hidden` attribute wins over Lumen flex/grid display rules. Remove the attribute to show the element; `hidden="false"` still means hidden in HTML. `hidden="until-found"` retains browser find behavior. |
| Code and CodeTabs | Localize `codeLabel`, `copyLabel`, `copiedLabel` and `errorLabel` (kebab-case attributes in Elements). Overflowing code is a named keyboard region. Remove duplicate clipboard controllers and announce actual success or failure. |
| NavigationMenu | Ordinary links keep native Tab order. Do not depend on a single roving Tab stop for site navigation. |
| Astro ThemeToggle | A controlled toggle leaves initial document theme ownership to the application. Initialize the theme before rendering and persist it in the application's change handler. |
| SwiftUI / Compose | Rebuild for changed initializers and formatter contracts. Swift charts accept `bare` and `height`; Slider accepts `showsLabel` and announces `valueLabel`. Compose numeric/time line data uses continuous X positions, including isolated observations. |
| Native sheets | SwiftUI and Compose sheet signatures add `dismissible` and `scrollable`; rebuild consumers. Set `scrollable` false for native lazy or virtualized content. Prevent interactive dismissal while saving. React Native accepts `initialFocusRef` and `returnFocusRef` for explicit application-owned focus targets. |
| Native localization | React Native and Compose field groups accept `requiredLabel`; tab panels use the selected visible label unless `panelAccessibilityLabel` is supplied. Localize these descriptions together with visible labels. SwiftUI resolves the `Required` key through application localization. |
| Embedded MCP server | `createLumenServer()` returns the stable SDK v2 `McpServer` from `@modelcontextprotocol/server`. Migrate SDK imports and transports together; do not mix SDK v1 and v2 objects. |

The refreshed icon catalog adds Swift `LumenIconName.bangladeshiTaka`, `.layoutGridCircles`,
`.letters`, and `.printer3d`. Handle these cases in exhaustive Swift switches or provide an
appropriate fallback before rebuilding. Existing case names and raw values remain available.
Compose exposes the same additions as `LumenIconName.BangladeshiTaka`, `.LayoutGridCircles`,
`.Letters`, and `.Printer3d`.

For embedded MCP integrations, replace `@modelcontextprotocol/sdk/server/mcp.js` imports with
`@modelcontextprotocol/server` and import `StdioServerTransport` from
`@modelcontextprotocol/server/stdio`. Client-side SDK code moves to
`@modelcontextprotocol/client` and `@modelcontextprotocol/client/stdio`. Follow the
[official SDK v2 migration guide](https://ts.sdk.modelcontextprotocol.io/v2/migration/upgrade-to-v2)
for other programmatic integrations. Lumen's CLI commands, stateless HTTP endpoint, tool names,
argument schemas, resource URIs, and existing `2025-11-25` protocol handshake remain unchanged;
MCP clients connecting over stdio or HTTP do not need to change their Lumen configuration.

`ImageComparison` is new across Astro, React and Elements. See the [media comparison guide](image-comparison.md)
for full-size media framing, RTL, labels and controlled state. The [reporting example](https://lumen.santi020k.com/docs/web/reporting)
combines range drafts, a chart and a dialog using synthetic data. The [chart guide](data-visualization.md)
explains missing data, formatting and accessible data tables.

Test the actual consumer with light/dark themes, phone/desktop widths, keyboard navigation,
clipboard denial, empty/singleton/dense charts, invalid dates and pending submissions. Existing
application workarounds are evidence to investigate, not a list to delete automatically. Lumen
performs no data migration and does not change application reporting, financial or medical policy.


## Combobox focus and nested Escape

V4 keeps focus in editable Combobox inputs. Update tests and custom option styling that assumed
option buttons receive focus to use `aria-activedescendant` and `aria-selected` instead. Arrow keys
activate an option; Enter commits it. Enter without an active option retains native form behavior.
Nested controls consume their own Escape dismissal. Parent keyboard handlers should honor
`event.defaultPrevented` before closing or moving focus. No persisted data migration is required.

## Phone inputs, virtual lists, and external editors

- Astro and React PhoneInput `id` now names the number input. Update labels and DOM queries that
  assumed it named an outer frame. Elements uses `input-id` for the inner control; its host `id`
  remains a host identifier. Replace flag overlays and attribute patches with public props and
  parts after checking disabled, read-only, error, and long-number states.
- VirtualList uses fixed-height windows and inert spacers to preserve scroll height. Range
  endpoints are inclusive; an empty list reports `endIndex: -1`. Update consumers that interpreted
  the endpoint as exclusive. Verify changing rows, resized containers, retained row focus, and
  cleanup. Use a list suited to variable-height content rather than assuming rows are measured.
  The default mode preserves mounted DOM state. Opt-in [data rendering](virtual-list-data.md)
  mounts only visible rows and focused neighbors; keep offscreen application state outside row
  components and use stable unique keys. It is optional for existing consumers.
- An external rich-text engine must execute commands during the cancelable
  `ui:editor-command-request` event, call `preventDefault()`, and set `detail.executed` to its
  synchronous success result. React can supply `commandHandler` to `useRichTextEditor` instead.
  `ui:editor-command` reports completion; remove handlers that execute the command a second time.
  Failed external commands never fall back to browser execution. See [AI usage](ai-usage.md)
  for engine ownership and toolbar-state examples.

## Appearance presets and customization

Default, Studio and Glass presets are opt-in. Existing calls retain their color defaults. Use
`data-lumen-preset` on a web root or section and `data-lumen-scheme` when the section owns its
scheme. ThemeBuilder can adjust radius, spacing and structural border dimensions and export
those values. Preserve readable foreground/background pairs when overriding action colors.

Native adapters accept preset palettes and appearance overrides. Rebuild Swift and Compose
consumers for the defaulted appearance and material parameters. Swift initializer references for
Theme, Surface and Card must adopt the new signatures. Glass remains explicit per supporting
surface; SwiftUI honors reduced transparency and increased contrast, while React Native and
Compose use opaque fallbacks. See [appearance presets](appearance-presets.md) for exact APIs.
No application data migration is involved.

## Native rebuild checklist

The [v4 contract](../registry/lumen-4-contract.json) lists the reviewed Swift diagnostics relative
to `v3.0.1`. Defaulted parameters preserve many ordinary source calls but change method references
and compiled signatures. Rebuild app and framework targets; do not reuse binaries compiled
against v3. Replace stored initializer/function references with closures that call the v4 API
using named arguments where needed.

| Native surface | V4 action |
| --- | --- |
| Swift `LumenLineChart` / `LumenBarChart` | Rebuild for `bare` and `height` parameters; review chart frames and formatter-driven labels. |
| Swift `LumenSlider` overloads | Rebuild for `showsLabel`; supply an accessible `valueLabel` when hiding the visual heading. |
| Swift `LumenSymbolPicker` / `LumenSymbolPickerButton` | Update initializer references for contextual tint and selection-completion parameters; ordinary calls keep default options. |
| Swift `lumenSheet` / Compose sheets | Rebuild for `dismissible` and `scrollable`; disable dismissal during pending saves and avoid wrapping lazy content in another scrolling body. |
| Swift exhaustive `LumenIconName` switches | Handle the four new cases listed above or use a deliberate fallback. |
| Compose charts | Numeric/time X values use continuous positions; compare irregular intervals and isolated observations. |
| React Native sheets | Supply `initialFocusRef` / `returnFocusRef` when application-owned focus targets are needed; verify focus on device. |
| React Native / Compose localization | Translate `requiredLabel` and optional `panelAccessibilityLabel`; check screen-reader descriptions with visible labels. |

Swift resolves the `Required` localization key in the application. See [native patterns](native-patterns.md)
and [native quality](lumen-4-native-quality.md) for platform-specific compositions.
React Native's optional `/foundations` entrypoint reduces the import graph for basic primitives;
existing root imports remain supported. Adopt it only when its exported catalog covers the surface.

## Consumer acceptance and rollback

1. Resolve dependencies from one candidate revision (or one published release), then run the
   application's lint, strict typecheck, tests, and production build. Compile each native target.
2. Compare representative routes in light/dark themes at phone and desktop widths. Check explicit
   gaps, Card density, media clipping, long translations, code overflow, and visible focus rings.
3. Exercise labels and form submission, invalid/reversed/out-of-bounds dates, form reset,
   read-only/disabled states, loading actions, and clipboard failure. For charts test empty,
   singleton, dense, duplicate, and missing data; for tables verify sorting before pagination.
4. Check Combobox typing, arrows, Enter and nested Escape; ordinary navigation Tab stops; dialog
   opener restoration; and virtual-list focus after data changes. Keep app-specific workarounds
   until equivalent behavior is verified.
5. On native targets, test keyboard-visible actions, large text, screen-reader labels, sheet
   dismissal protection, lazy scrolling, and safe areas. Simulator/emulator builds and library
   tests alone do not prove physical-device behavior or production consumer qualification.

If validation fails, restore the prior application commit and its manifests/lock files, reinstall
v3 dependencies, and rebuild all targets. Keep any application data changes separate from this UI
upgrade so rollback does not require reversing persisted data. Before publication, candidate
corrections can be ordinary commits; after publication, corrections require a new version and
must not replace a published tag.

For a starting v2 application, first complete [v2 → v3](migrating-v2-to-v3.md).

## Native advanced inputs

React Native and SwiftUI now expose `LumenNumberField`, `LumenTimeField`,
`LumenAutocomplete`, `LumenPasswordField`, `LumenInputOTP` and `LumenImageComparison`,
joining the existing Compose controls. This is additive; existing native controls remain unchanged.
React Native time fields use the optional `/datetime` entry point. SwiftUI editable controls
support iOS, macOS and visionOS; image comparison also supports tvOS and watchOS.

Native number fields bind an ungrouped localized string so incomplete edits survive. Configure
bounds and steps as ASCII decimal strings and validate before submitting. Web NumberField keeps
its browser-native number contract. For a web editor that requires the same exact draft behavior,
compose TextField with the Core decimal helpers; do not coerce financial values to floating point.

See the [native component contracts](native-components.md) and
[form submission error recipe](native-patterns.md#pattern-form-submission-errors).

### Optional React Native per-icon imports

For fixed icons, import the graphic from `@santi020k/lumen-react-native/icons/search` (for example,
`LumenSearchIconGraphic`) and pass it to `LumenIcon` or `LumenIconButton` from the `graphics`
entrypoint. Brand paths replace the namespace colon with a hyphen: `brand:github` uses
`icons/brand-github` and `LumenBrandGithubIconGraphic`. These additions do not require changing
existing root `name` lookups. Keep the root lookup when the icon name is dynamic; it includes the
full catalog. See the [React Native package guide](../packages/react-native/README.md#canonical-per-icon-imports).
