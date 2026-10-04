<p align="center">
  <a href="https://lumen.santi020k.com">
    <img src="https://raw.githubusercontent.com/santi020k/lumen/main/apps/docs/public/logo.svg" alt="Lumen UI" width="233" height="60">
  </a>
</p>

<h1 align="center">Lumen UI · React Native</h1>

<p align="center">Native primitives · Semantic themes · Shared foundations</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@santi020k/lumen-react-native"><img src="https://img.shields.io/npm/v/@santi020k/lumen-react-native?style=flat-square&color=0369a0" alt="npm version"></a>
  <a href="https://github.com/santi020k/lumen/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-13967e?style=flat-square" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://lumen.santi020k.com/docs/react-native">Documentation</a>
  ·
  <a href="https://www.npmjs.com/package/@santi020k/lumen-react-native">npm</a>
  ·
  <a href="https://github.com/santi020k/lumen/tree/main/packages/react-native">Source</a>
  ·
  <a href="https://github.com/santi020k/lumen/issues">Issues</a>
</p>

**Package:** `@santi020k/lumen-react-native`

**On this page:** [React hooks](#react-hooks) · [Data visualization](#data-visualization) · [Consumer composition recipes](#consumer-composition-recipes) · [Resources](#resources)

---

> **Lumen 4 candidate:** This branch prepares the next major adapter contract. See the
> [migration guide](../../docs/migrating-to-lumen.md) before upgrading. Local checks do not replace
> publication, physical-device accessibility, or consumer-soak qualification.

Maintainers can verify the exact packed package contents, peer installation, and strict external
TypeScript consumption from the repository root with `pnpm run check:react-native-package`.
Release canaries additionally generate clean Expo native projects from that tarball and require
real debug binaries with `pnpm run check:react-native-native-package:android` and
`pnpm run check:react-native-native-package:ios`. The iOS command requires CocoaPods.
After publication, repeat the native proof against the exact npm artifact with
`pnpm run check:react-native-native-release:android -- --version <version>` and
`pnpm run check:react-native-native-release:ios -- --version <version>`.

React Native foundations and primitives for Lumen UI. The package exposes canonical light and dark
themes together with native Text, Icon, IconButton, Surface, Button, ButtonGroup, TextField,
Textarea, FieldGroup, Badge, Chip, Divider, Spinner, Card, Alert, Toast, Progress, Avatar, Toggle,
SettingsRow, SearchField, DateField, DateRangeField, Checkbox, RadioGroup, SegmentedControl, Tabs, Skeleton, Graphic, Backdrop,
Illustration, and Disclosure implementations.
The structured tier also includes EmptyState, ErrorState, ListRow, Banner, Stat, SectionHeader, StatusBar, and a
controlled NavigationBar for common product layouts without giving up native composition. `LumenRefreshControl` adds a
React Native-specific pull-to-refresh indicator using the active semantic theme.
Navigation destination labels wrap within their available width at accessibility text sizes
(font scale 2 or greater), preserving their complete spoken names and native text scaling.
`useLumenNavigationBarVisibility` and `LumenCollapsibleNavigationBar` add an optional scroll-
responsive treatment for native lists without introducing an animation or navigation dependency.
`LumenAlertDialog`, `LumenSheet`, `LumenMenu`, and `LumenShareButton` provide controlled native
presentation and operating-system sharing. Overlays accept application-supplied safe-area insets,
and sheets scroll application content by default so actions remain reachable with large text and
short viewports. Set `scrollable={false}` when the child is already a virtualized scrolling
container.
Sheets use a full-content scrolling fallback at large accessibility text sizes or short window
heights. `dismissible={false}` guards backdrop and platform dismissal while the application saves.
Pass `initialFocusRef` and `returnFocusRef` when an accessible application-owned control should
receive focus after presentation or closing. Both refs must point to mounted native controls;
Lumen leaves the choice of field and trigger to the application.
`LumenFieldGroup.requiredLabel` and `LumenTabs.panelAccessibilityLabel` accept translated spoken
text. A tab panel otherwise uses its selected tab's visible label without an English suffix.
Cards accept semantic `padding` and `radius` roles while preserving the extra-large/large defaults.
Status bars use a distinct decorative icon for every tone and accept `iconName` when a product needs
a more specific symbol, so visual status is not conveyed by color alone.

Install the package and its required SVG peer in an existing Expo or React Native application:

```bash
pnpm add @santi020k/lumen-react-native react-native-svg
# or: npm install @santi020k/lumen-react-native react-native-svg
```

Date fields live in `@santi020k/lumen-react-native/datetime`. Add the optional picker peer only when
the application uses that subpath:

```bash
pnpm add @react-native-community/datetimepicker
```

React 19.2 and React Native 0.86.2 or newer are application-provided peer dependencies. Mount one
`LumenProvider` near the application root; no stylesheet, safe-area package, or web runtime is
required:

```ts
import {
  createLumenTheme,
  LumenButton,
  LumenIconButton,
  LumenProvider,
  LumenSurface,
  LumenText,
  type LumenTheme
} from '@santi020k/lumen-react-native'

export function App() {
  return (
    <LumenProvider scheme="system">
      <LumenSurface>
        <LumenText variant="title">Welcome</LumenText>
        <LumenButton onPress={() => {}}>Continue</LumenButton>
        <LumenIconButton name="search" label="Search" onPress={() => {}} />
      </LumenSurface>
    </LumenProvider>
  )
}
```

Start the application with its normal Expo or React Native command:

```bash
npx expo start
# or: npx react-native start
```

Applications can pass a custom color theme to `LumenProvider`. Start from
`createLumenTheme(scheme)`, copy its `colors` or `chartColors`, and replace semantic roles such as
`brand`, `brandSolid`, and `brandSoft`; components continue to consume the same named color contract
without casts. `LumenColorPalette` and `LumenChartColorPalette` are available when a product keeps
its palettes in separate modules. Pass either `theme` or `scheme`; when both are present, the
explicit `theme` wins.

```tsx
const baseTheme = createLumenTheme('light')
const productTheme: LumenTheme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    brand: '#620AE6',
    brandSolid: '#5709CE',
    brandSoft: '#EEE7F9'
  }
}

<LumenProvider theme={productTheme}>{children}</LumenProvider>
```

## React hooks

React Native applications can use React's built-in hooks and platform-neutral application hooks
normally. Lumen also exports native adaptations of reusable web behavior contracts:

- `useDisclosure` and its `useDialog` alias control `LumenAlertDialog` and `LumenSheet` visibility;
- `useTabs` connects controlled or local selection state to `LumenTabs`;
- `useSelect` normalizes string or numeric options for `LumenPicker` and app-owned pickers;
- `useLanguageToggle` cycles locale state without mutating the browser document or local storage;
- `useThemeToggle` supplies explicit light/dark state that can be spread onto `LumenProvider`; and
- `useToast` owns a bounded native notification queue rendered with `LumenToast`. On Android,
  automatic dismissal respects the system accessibility timeout and never shortens the requested
  duration. If the native recommendation fails or is invalid, the requested duration is retained.
  Zero, negative or nonfinite durations remain persistent until dismissed; iOS/web timing is unchanged.
  Cleared, dismissed, evicted or unmounted toasts ignore late timeout responses.

The package also exports `useLumenTheme` for semantic theme access and
`useLumenNavigationBarVisibility` for native scroll-responsive navigation. Browser-specific hooks
from `@santi020k/lumen-react` must not be imported into React Native: DOM focus, ARIA attributes,
CSS, browser storage, and keyboard behavior remain in the web adapter.

```tsx
const dialog = useDialog()
const tabs = useTabs({ defaultValue: 'overview' })

<LumenButton onPress={dialog.show}>Delete project</LumenButton>
<LumenAlertDialog
  {...dialog.dialogProps}
  confirmLabel="Delete"
  onConfirm={deleteProject}
  title="Delete this project?"
/>

<LumenTabs
  {...tabs.tabsProps}
  label="Project sections"
  options={projectTabs}
>
  <ProjectPanel value={tabs.value} />
</LumenTabs>
```

Keep API access, schemas, business state, and platform-neutral custom hooks in a shared workspace
package when one product has both React web and React Native applications. Each app should import
the matching Lumen rendering adapter. See the
[React Native hooks guide](https://lumen.santi020k.com/docs/react-native/hooks) for controller and
composition examples.

Date values remain controlled by the application. `LumenDateField` opens the system picker, while
`LumenDateRangeField` coordinates two pickers and prevents the end from preceding the start:

```tsx
import {
  LumenDateRangeField,
  type LumenDateRangeValue
} from '@santi020k/lumen-react-native/datetime'

const [range, setRange] = useState<LumenDateRangeValue>({ start: null, end: null })

<LumenDateRangeField
  label="Reporting period"
  value={range}
  onValueChange={setRange}
  minimumDate={new Date()}
/>
```

Use `LumenTabs` when a small peer set changes content in place. The value remains controlled and
the application supplies the active panel, so routing and data ownership stay outside the component:

```tsx
<LumenTabs
  label="Workspace views"
  options={workspaceTabs}
  value={activeTab}
  onValueChange={setActiveTab}
>
  <WorkspaceTabPanel value={activeTab} />
</LumenTabs>
```

Picker, Slider, and Gauge complete the shared phone control contract without adding another native
dependency. Picker values remain controlled, Slider supports touch/drag plus screen-reader
increment and decrement actions through one accessible adjustable track. Slider touch values follow the native right-to-left direction;
its minimum and fill start at the leading edge, while accessibility increment always increases
the numeric value. Gauge normalizes invalid ranges before exposing progress
semantics:

```tsx
<LumenPicker
  label="Deployment region"
  value={region}
  options={regionOptions}
  onValueChange={setRegion}
/>
<LumenSlider
  label="Minimum speed"
  value={minimumSpeed}
  min={1_000}
  max={5_000}
  step={100}
  valueLabel={`${minimumSpeed} RPM`}
  onValueChange={setMinimumSpeed}
/>
<LumenGauge label="Platform readiness" value={57} valueLabel="57 shared" tone="success" />
```

Use `LumenNavigationBar` for a small set of peer app destinations. The application still owns the
router, navigation history, and selected screen. Items support dot, text, and capped count badges;
`onReselect` handles app-owned scroll-to-top, refresh, or nested-stack behavior:

```tsx
<LumenNavigationBar
  items={destinations}
  value={destination}
  onValueChange={setDestination}
  onReselect={scrollDestinationToTop}
/>
```

For a scroll-responsive destination bar, pass the controller to any native vertical scroll
container and render the collapsible wrapper alongside it:

```tsx
const navigation = useLumenNavigationBarVisibility()

<FlatList
  data={items}
  onScroll={navigation.onScroll}
  scrollEventThrottle={16}
  renderItem={renderItem}
/>
<LumenCollapsibleNavigationBar
  accessory={<LumenText variant="label">Uploading 3 files</LumenText>}
  items={destinations}
  value={destination}
  visible={navigation.visible}
  onValueChange={setDestination}
  onReselect={scrollDestinationToTop}
/>
```

The bar hides only after the configured movement threshold, reappears after reverse travel, and is
always revealed when the list returns to the top. The controller also exposes `show()` and `hide()`
for application events such as destination changes or completing a refresh.

The package intentionally uses native numeric dimensions and hexadecimal colors instead of CSS
values. Components use native accessibility roles, states, touch targets, and refs without depending
on the DOM or the Lumen web runtime. `LumenIcon` and `LumenIconButton` accept every canonical Lucide
name, such as `search`, `settings`, and `circle-alert`, plus namespaced Font Awesome Free brands such
as `brand:github`. These render the same Lumen-managed geometry as the SwiftUI, Compose, and web
adapters. The exported `lumenIconNames` array contains the complete 2,433-entry native catalog.
Applications can still pass any graphic component with `color`, `size`, and `strokeWidth` props
through `icon`; Lucide React Native components work directly. Standalone icons are decorative unless
given a label, while every `LumenIconButton` requires an accessible label. See
`THIRD_PARTY_NOTICES.md` for the artwork licenses and brand attribution.

Use `LumenPhoneInput` when an application needs a localized country picker and a validated E.164
result:

```tsx
const colombia = getLumenPhoneCountry('CO', { locale: 'en-US' })
if (!colombia) throw new Error('Missing Colombia metadata')

const [phone, setPhone] = useState(() => createEmptyLumenPhoneNumber(colombia))

<LumenPhoneInput
  label="Hospital or OB phone number"
  value={phone}
  onValueChange={setPhone}
/>
```

Persist or dial `phone.e164` only when `phone.isValid` is true.

Use `LumenImage` for native image sources that need shared contain or cover fitting, an optional
aspect ratio, semantic corner radius, and decorative-or-labeled accessibility behavior. React
Native remains responsible for decoding, caching, and network delivery.

Attach the refresh control to a native scroll container without replacing its scrolling behavior:

```tsx
<ScrollView
  refreshControl={
    <LumenRefreshControl
      accessibilityLabel="Refresh projects"
      refreshing={refreshing}
      onRefresh={refreshProjects}
    />
  }
>
  {content}
</ScrollView>
```

See the [native component reference](../../docs/native-components.md) for the complete API matrix,
state contracts, image-source mapping, and accessibility requirements. Use the shared
[React Native error-handling guide](../../docs/error-handling.md#react-native) when integrating
`LumenErrorState`; it covers error/offline classification, layouts, announcements, safe references,
and loading-safe retries.
On iOS, Toast and ErrorState announce their title and description when mounted or when that copy
changes. Polite announcements queue behind current speech; assertive errors interrupt it, and
`announcement="off"` disables ErrorState announcements. Unchanged copy is not repeated on ordinary
rerenders. Android and web retain live-region semantics. Diagnostic references and action labels
are excluded from the explicit iOS announcement, and action controls remain independently operable.
See the [native compatibility matrix](../../docs/native-compatibility.md) for React and React Native
baselines, and use the [native device validation matrix](../../docs/native-device-validation.md) for
VoiceOver and TalkBack evidence.

## Appearance presets

Start with `createLumenTheme(scheme, { preset: 'studio' })` or `<LumenProvider preset="studio">`. Theme options support custom numeric scales and semantic colors. See [appearance presets](../../docs/appearance-presets.md) for the opaque material fallback.

## Data visualization

Heatmaps include labeled axes, a numeric color legend, and × markers for missing measurements.
`LumenHeatmap.data` accepts arrays of unknown decoded rows and validates the complete collection
before formatting categories. Malformed rows produce the empty state without calling application
formatters. Use `LumenHeatmapDatum` to author typed rows; `null` and non-finite numeric measurements
remain unavailable cells, while numeric coordinates must be finite.
Use a diverging color scale around a meaningful midpoint for signed data. The plot and expandable
list preserve zero and use the first measurement at each coordinate. See the
[native heatmap options](../../docs/data-visualization.md#native-heatmaps) for domain and formatting APIs.

`LumenSparkline`, `LumenLineChart`, `LumenBarChart`, `LumenPieChart`, `LumenScatterChart`,
`LumenHeatmap`, `LumenRangeChart`, `LumenComboChart`, `LumenWaterfallChart`, and `LumenHistogram` use shared geometry and generated chart
tokens while rendering with `react-native-svg`. Data charts expose a concise image summary and an
expandable readable data list; selection remains controlled by the application. Line and bar charts render
category and value axes even when the readable list is hidden. Dense axes select labels without
removing data. Line, bar, scatter, range, and combo plots recompute geometry at the measured
container width, keeping the full dataset visible on phones and resizing with split views or
orientation changes. Axis text retains its size; chart data remains available in the disclosure.

```tsx
import { LumenBarChart, type LumenChartSeries } from '@santi020k/lumen-react-native'

const scores: readonly LumenChartSeries[] = [{
  id: 'scores',
  label: 'Score',
  data: [
    { x: 'ana', xLabel: 'Ana', y: -4 },
    { x: 'ben', xLabel: 'Ben', y: 8 }
  ]
}]

export function FinalScores() {
  return (
    <LumenBarChart
      label="Final scores"
      series={scores}
      formatValue={value => `${value} points`}
      labels={{ chartData: 'Score details' }}
    />
  )
}
```

Keep `x` as a stable category identity and use `xLabel` for a short axis label. An explicit
`formatCategory` supplies full detail text without replacing `xLabel` on the axis. `formatValue`
formats values and reserves space for the numeric axis. Pie data rows include markers matching
their slices and retain readable text, so color is not the only association. Set `showData={false}`
only when equivalent accessible values appear nearby; supply a factual `summary` when that helps
explain the comparison. Translate the `labels` support copy in the application.

See the shared [data-visualization guide](../../docs/data-visualization.md).


`LumenWaterfallChart` draws signed changes with explicit total resets and connectors. Invalid
steps reject the complete plot so later balances cannot become misleading. `LumenHistogram`
preserves supplied bin widths and gaps; use density for unequal widths. Data disclosures retain
start, end, plotted value, and original density-bin counts. Empty and invalid inputs have separate
localized messages. Expanded data stays scrollable within the card.

```tsx
<LumenWaterfallChart label="Revenue movement" data={[
  { id: 'opening', label: 'Opening', kind: 'total', value: 100 },
  { id: 'growth', label: 'Growth', value: 40 },
  { id: 'costs', label: 'Costs', value: -25 }
]} />
<LumenHistogram label="Response time" frequency="density" data={[
  { start: 0, end: 10, count: 5 }, { start: 10, end: 30, count: 10 }
]} />
```

## Consumer composition recipes

See [consumer UI recipes](../../docs/consumer-ui-recipes.md) for static React icons, responsive
record tables, keyboard-aware native sheets, whole-unit amount fields, adaptive editors, and
asynchronous action states. Each recipe identifies the public primitives and the behavior that
remains owned by the application. For long native row titles, status badges, and separate trailing
actions, use the [dense identity row pattern](../../docs/native-patterns.md#pattern-dense-identity-row).
`LumenListRow` and `LumenSectionHeader` allow text to shrink and constrain trailing content; keep
unrelated actions independently named instead of making their parent row another button.

## Resources

| Guide | What you will find |
| --- | --- |
| [Native component reference](https://github.com/santi020k/lumen/blob/main/docs/native-components.md) | Reference for native component reference. |
| [Native compatibility](https://github.com/santi020k/lumen/blob/main/docs/native-compatibility.md) | Reference for native compatibility. |
| [Device validation evidence](https://github.com/santi020k/lumen/blob/main/docs/native-device-validation.md) | Reference for device validation evidence. |
| [Contributing](https://github.com/santi020k/lumen/blob/main/CONTRIBUTING.md) | Setup, checks, and contribution workflow. |
| [Release history](https://github.com/santi020k/lumen/releases) | Published releases and version notes. |

Part of [Lumen UI](https://lumen.santi020k.com), created by [Santiago Molina](https://santi020k.com).
Licensed under [MIT](https://github.com/santi020k/lumen/blob/main/LICENSE); third-party artwork retains its own notices.

### Phone presentation in v4

`LumenPhoneInput` uses bundled flag artwork and a continuous control frame, and accepts `readOnly`
in addition to `enabled`. Read-only fields also lock country selection. `LumenCountryFlag` and
`LumenPhoneNumberView` expose the same artwork and normalized read-only phone presentation.
Country names and calling codes remain the accessible selector label. The flag source and license
are documented in [flags/README.md](../../flags/README.md); no external flag request is made.

## Small foundation imports

For screens using only text, surfaces, buttons, fields, badges, dividers, and spinners, use the
optional foundations entrypoint. It shares the root implementation and theme context while avoiding
the root catalog, chart, phone, and icon lookup imports. Mixing entrypoints uses the same provider.

```tsx
import { LumenButton, LumenProvider } from '@santi020k/lumen-react-native/foundations'

<LumenProvider><LumenButton>Continue</LumenButton></LumenProvider>
```

Run `pnpm run measure:react-native-imports` from the repository to compare production Hermes
bytecode for a platform baseline, root button, root icon, foundation button, and matching
four-icon navigation fixtures using root or static graphics imports. Both static graphics
fixtures and the public per-icon fixture use canonical generated artwork and retain the existing overhead budget. Build time is a
local build measurement; it does not establish native startup latency or scrolling performance.


### Static graphic imports

For app-owned SVG components, import `LumenIcon` and `LumenIconButton` from
`@santi020k/lumen-react-native/graphics`. This entrypoint shares the root rendering, theme,
touch-target, and accessibility behavior without loading the named icon catalog. Its `icon` prop
is required; named `name` lookups remain available from the package root. Graphic components accept
`LumenIconGraphicProps` (`color`, `size`, and `strokeWidth`). Do not import the root catalog to
construct a static graphic, since that restores its eager import cost.

```tsx
import { LumenIcon, LumenProvider } from '@santi020k/lumen-react-native/graphics'
import { SearchGraphic } from './SearchGraphic'

<LumenProvider>
  <LumenIcon icon={SearchGraphic} label="Search records" />
</LumenProvider>
```

### Canonical per-icon imports

Use `@santi020k/lumen-react-native/icons/<name>` for canonical artwork without loading the full
named catalog. Each module exports one graphic. Pair it with the `graphics` entrypoint:

```tsx
import { LumenIcon, LumenProvider } from '@santi020k/lumen-react-native/graphics'
import { LumenSearchIconGraphic } from '@santi020k/lumen-react-native/icons/search'

<LumenProvider>
  <LumenIcon icon={LumenSearchIconGraphic} label="Search records" />
</LumenProvider>
```

Icon paths use the catalog name; replace the brand namespace colon with a hyphen:
`brand:github` becomes `icons/brand-github`, exporting `LumenBrandGithubIconGraphic`.
The root `name` lookup remains available for dynamic choices and retains its full catalog.
The generator emits both representations from the same artwork and rendering function; the root
keeps its compact single-module layout to avoid thousands of module records in Hermes bundles.
Labels, decorative treatment, themes and touch targets remain the responsibility of `LumenIcon`
and `LumenIconButton`. The same `react-native-svg` peer is required.

## Advanced native inputs

`LumenNumberField`, `LumenAutocomplete`, `LumenPasswordField`, `LumenInputOTP` and
`LumenImageComparison` are root exports. `LumenTimeField` and `LumenTimeSelection` live in
`@santi020k/lumen-react-native/datetime`, alongside the optional native picker integration.

```tsx
<LumenNumberField
  label="Cantidad"
  value={quantityDraft}
  onValueChange={setQuantityDraft}
  locale="es-CO"
  min="0"
  max="100"
  step="0.1"
  incrementLabel="Aumentar valor"
  decrementLabel="Disminuir valor"
  invalidNumberLabel="Ingresa un número válido"
  outOfRangeLabel="Ingresa un número entre 0 y 100"
/>
```

Number values remain raw localized strings, including unfinished drafts. Bounds and steps use
complete ASCII decimal strings and exact arithmetic, with a 128-character limit. Units, currencies,
required validation, persistence and submission parsing remain application-owned. Password visibility
is transient and resets on blur or disabled/read-only state. OTP uses one editor with native code
hints, normalizes pasted decimal digits and emits `onComplete` only for a changed full code; it never
verifies or submits the value. Autofill hints require provider testing in the consuming app.

Autocomplete takes `query`, `onQueryChange`, `options`, `onValueChange` and an optional selected
`value`. Applications filter results, clear stale selection, cancel requests and supply `loading`
or `resultsErrorMessage` plus `onRetry`. Selection sends the option label before its value. Supply
localized loading, empty, retry and dismissal labels. Results are bounded in height; applications
should limit suggestions to a useful small set. Disabling or making the field read-only dismisses
results without reopening them after re-enabling.

Time selection uses `{ hour, minute }`, inclusive same-day bounds, and explicit cancellation.
Pass `safeAreaInsets` from the existing application provider. Android uses the system picker;
other hosts use the native picker inside LumenSheet. Image comparison takes native `before` and
`after` sources and a controlled `value` from zero to one for the visible after fraction. Its named
slider provides touch, keyboard and screen-reader adjustment; supply localized image labels and
`locale` for its percentage.

See the [shared advanced contracts](../../docs/native-components.md#shared-v4-advanced-controls)
and the [native form-error recipe](../../docs/native-patterns.md#pattern-form-submission-errors).

### Actual-versus-target charts

`LumenBulletChart` compares a nullable actual `value` with a finite `target` and optional
labeled `ranges`. A strong actual bar, target marker, readable value labels, and expandable exact
data work together. Domains include zero and all measurements; invalid inputs fail closed.
Null values stay distinct from zero. See the [chart guide](../../docs/data-visualization.md#actual-values-and-targets)
for the input, localization, and domain contracts.

### React Native 0.86.3 live iOS text resizing

This renderer version can retain stale text geometry after a live system Text Size change.
The Lumen playground applies the exact-version source patch in
`patches/react-native@0.86.3.patch` and builds iOS React Native from source. See
[the playground instructions](../../apps/playground-react-native/README.md#live-ios-text-resizing)
for the patch, rebuild requirements, and mounted-draft regression check. Installing Lumen alone
does not change the host application's native renderer. Native font scaling remains enabled.

### Rankings and paired comparisons

Use `LollipopChart` for zero-based rankings and `DumbbellChart` for paired measurements (native
`LumenLollipopChart` and `LumenDumbbellChart`). Supply ordered comparison data with `id`, `label`,
nullable `value`, optional nullable `reference`, and optional `tone`. Both charts preserve missing
values and expose exact data. See the [shared visualization contract](../../docs/data-visualization.md#rankings-and-paired-comparisons).
