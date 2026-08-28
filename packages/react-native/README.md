# @santi020k/lumen-react-native

> **Supported for Lumen 2:** This package uses the frozen version 2 contract. The current artifact
> remains a release candidate until publication, physical-device, and consumer-soak gates complete.

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
`useLumenNavigationBarVisibility` and `LumenCollapsibleNavigationBar` add an optional scroll-
responsive treatment for native lists without introducing an animation or navigation dependency.
`LumenAlertDialog`, `LumenSheet`, `LumenMenu`, and `LumenShareButton` provide controlled native
presentation and operating-system sharing without introducing a separate interaction dependency.
Cards accept semantic `padding` and `radius` roles while preserving the extra-large/large defaults.
Status bars use a distinct decorative icon for every tone and accept `iconName` when a product needs
a more specific symbol, so visual status is not conveyed by color alone.

Install the package and its native peers in an existing Expo or React Native application. The
datetime picker remains required throughout the pre-v2 stability releases because the deprecated
root date exports still load it:

```bash
pnpm add @santi020k/lumen-react-native react-native-svg @react-native-community/datetimepicker
# or: npm install @santi020k/lumen-react-native react-native-svg @react-native-community/datetimepicker
```

New code should import date fields from `@santi020k/lumen-react-native/datetime`. The deprecated
root date exports remain available only for 1.x compatibility; Lumen 2 removes them and makes the
datetime picker optional for consumers that do not use the subpath.

React 19.2 and React Native 0.86.2 or newer are application-provided peer dependencies. Mount one
`LumenProvider` near the application root; no stylesheet or web runtime is required:

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
- `useToast` owns a bounded native notification queue rendered with `LumenToast`.

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
increment and decrement actions, and Gauge normalizes invalid ranges before exposing progress
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
adapters. The exported `lumenIconNames` array contains the complete 2,350-entry native catalog.
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
See the [native compatibility matrix](../../docs/native-compatibility.md) for React and React Native
baselines, and use the [native device validation matrix](../../docs/native-device-validation.md) for
VoiceOver and TalkBack evidence.

## Data visualization

`LumenSparkline`, `LumenLineChart`, `LumenBarChart`, `LumenPieChart`, `LumenScatterChart`,
`LumenHeatmap`, `LumenRangeChart`, and `LumenComboChart` use shared geometry and generated chart
tokens while rendering with `react-native-svg`. Data charts expose a concise image summary and a
readable fallback list; selection remains controlled by the application. See the shared
[data-visualization guide](../../docs/data-visualization.md).
