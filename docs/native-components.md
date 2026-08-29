# Native component reference

Lumen's React Native, SwiftUI, and Jetpack Compose adapters share semantic contracts while using
each platform's rendering, image, focus, and accessibility systems. This reference covers setup,
the supported component surface, platform mappings, and the checks required for a component to be
considered supported.

> **Supported for Lumen 2:** The native component APIs below are part of the frozen version 2
> contract. Current artifacts remain release candidates until publication, physical-device, and
> consumer-soak gates are complete.

## Install and consume

### React Native

Install the package and mount one provider near the application root:

```bash
pnpm add @santi020k/lumen-react-native react-native-svg @react-native-community/datetimepicker
```

```tsx
import { LumenProvider } from "@santi020k/lumen-react-native";

export function App() {
  return <LumenProvider scheme="system">{/* application */}</LumenProvider>;
}
```

The pre-v2 stability releases keep the picker peer required because they retain deprecated root date
exports. Import date components from their dedicated entrypoint; in Lumen 2, consumers that do not
use this entrypoint can omit the picker:

```bash
pnpm add @react-native-community/datetimepicker
```

```tsx
import {
  LumenDateField,
  LumenDateRangeField
} from '@santi020k/lumen-react-native/datetime'
```

Shared icons use `name="search"`; applications can instead pass graphic components with `color`,
`size`, and `strokeWidth` props when a product-specific icon is not in the catalog.

### SwiftUI

In Xcode, choose **File → Add Package Dependencies**, paste
`https://github.com/santi020k/lumen`, and choose **Exact Version** `2.1.0` for a reproducible
production build. Use **Up to Next Major Version** from `2.1.0` only when the application accepts
compatible updates, and reserve `main` for local evaluation. Add the `LumenUI` product to the
application target. The repository-root `Package.swift` is the public package entry point; no
CocoaPod or npm package is involved.

Projects with their own Swift package manifest can declare the dependency directly:

```swift
dependencies: [
    .package(
        url: "https://github.com/santi020k/lumen",
        exact: "2.1.0"
    )
]
```

Use `from: "2.1.0"` instead of `exact: "2.1.0"` for a compatible-version policy. Commit
`Package.resolved` for application and CI builds and verify that its version and revision match the
intended release tag. XcodeGen and other deterministic project generators should keep the package
requirement in their checked-in configuration and regenerate project files from that source.

Then import the linked product and apply a theme near the application root:

```swift
import LumenUI

@main
struct ExampleApp: App {
    var body: some Scene {
        WindowGroup {
            AppRoot().lumenTheme(.light)
        }
    }
}
```

The package supports iOS 16, macOS 13, tvOS 16, visionOS 1, and watchOS 9 or newer. The complete
phone, tablet, Mac, and spatial control tier is available on visionOS where the same native SwiftUI
types exist; control metrics remain regular outside pointer-first macOS. A shared feature view can
therefore compile across those application targets without platform conditionals.

Use `LumenTextContent.localized(_:)` for `LocalizedStringKey` or `LocalizedStringResource` copy and
`LumenTextContent.verbatim(_:)` for application-resolved runtime strings. The focused contract is
available on common text, badge, spinner, text-button, text-field, textarea, and field-group
boundaries so labels, descriptions, validation messages, accessibility text, and actions retain
their intended localization semantics. Translation storage and live locale selection stay in the
application; the Apple playground Settings screen includes an English/Spanish state-driven example.

Platform-native availability still applies outside iOS, macOS, and visionOS. `LumenTextarea` and
`LumenShareButton` are unavailable on tvOS because SwiftUI does not provide their underlying text
editor and share surfaces there. `LumenMenu` requires tvOS 17 or newer. Wearable components are
watchOS-only, and non-wearable controls that are unavailable on watchOS are excluded from that
target. `LumenWidgetUI` does not claim visionOS support in Lumen 2 because its rendering-mode
contract requires visionOS 26; application widgets remain supported on iOS, iPadOS, macOS, and
watchOS.

```swift
struct SharedProfileActions: View {
    var body: some View {
        HStack {
            LumenButton("Save", action: save)
            LumenIconButton(name: .settings, label: "Settings", action: openSettings)
        }
    }
}
```

Override the automatic choice only when the product requires it:

```swift
SharedProfileActions().lumenControlDensity(.regular)
```

Applications can initialize `LumenColorPalette` and `LumenTheme` from product-owned light and dark
palettes. Use `LumenColors.light.overriding(...)` or `LumenColors.dark.overriding(...)` to replace
only the semantic colors a product owns. Use
`.lumenTheme(productTheme, enforceColorScheme: false, applyTint: false)` when the application's
stored appearance and native tint remain application-owned. Apply the modifier to every independent
window, settings, menu-bar, widget, and preview scene that renders Lumen content.

### Jetpack Compose

The Android module is available from Maven Central. Add `mavenCentral()` to the application's
repositories and use the published coordinate:

```kotlin
// app/build.gradle.kts
repositories {
    mavenCentral()
}

dependencies {
    implementation("com.santi020k:lumen-compose:2.1.0")
}
```

Wrap application content in `LumenTheme`; it maps the shared palette to Material 3 while retaining
the complete Lumen token object through `LocalLumenTheme`.

Applications with an existing Material theme can pass `materialColorScheme`, `typography`, and
`shapes` to the same `LumenTheme` call. `LumenMaterialColorOverrides` preserves explicit brand,
accent, success, and warning semantics, and `ColorScheme.toLumenColorPalette(...)` exposes the
mapped Lumen values when the application needs them independently.

### Cross-platform icon catalog

The native adapters include all 1,777 canonical Lucide interface icons and all 573 namespaced Font
Awesome Free brand entries used by Lumen on the web. Use a semantic Lumen name when the artwork
should remain consistent across the product:

```tsx
<LumenIcon name="search" label="Search" />
<LumenIconButton name="settings" label="Settings" onPress={openSettings} />
<LumenIcon name="brand:github" label="GitHub" />
```

```swift
LumenIcon(name: .search, label: "Search")
LumenIconButton(name: .settings, label: "Settings", action: openSettings)
LumenIcon(name: .brandGithub, label: "GitHub")
```

```kotlin
LumenIcon(name = LumenIconName.Search, contentDescription = "Search")
LumenIcon(name = LumenIconName.BrandGithub, contentDescription = "GitHub")
LumenIconButton(
    name = LumenIconName.Settings,
    contentDescription = "Settings",
    onClick = ::openSettings
)
```

React Native exports `lumenIconNames`; Swift exposes `LumenIconName.allCases`; Compose exposes
`LumenIconName.entries`. Brand names use `brand:github` in React Native, `.brandGithub` in Swift,
and `LumenIconName.BrandGithub` in Compose. Continue using the existing custom graphic,
`systemName`, or `ImageVector` forms for product artwork outside the catalog and for operating-system
concepts whose native symbol is part of the platform convention. Standalone decorative icons omit
their label or content description; icon-only controls always require one.

The generated packages include Lucide, Feather, and Font Awesome license notices. Font Awesome
brand artwork is CC BY 4.0 and may represent protected trademarks; the catalog provides artwork and
attribution, not permission to use a brand owner's mark.

### Wear OS

Wear OS uses a separate artifact so phone and tablet applications do not acquire wearable-only
contracts:

```kotlin
dependencies {
    implementation("com.santi020k:lumen-compose-wear:2.1.0")
}
```

`LumenWearTheme` provides canonical Lumen semantic tokens without replacing the application's Wear
Material theme. This keeps the first wearable tier compatible with existing Wear Compose Material
2.5 applications and current Wear Material 3 applications. Wear navigation, rotary input, tiles,
complications, haptics, synchronization, health behavior, and background work remain application-
owned.

`LumenWearTheme`, `LumenWearTone`, `LumenWearActionButton`, `LumenWearProgressRing`,
`LumenWearStatus`, `LumenWearMetric`, and `LumenWearListRow` are Supported for Lumen 2.

## Supported surface

| Contract          | React Native            | SwiftUI                  | Compose                 | Shared behavior                                                               |
| ----------------- | ----------------------- | ------------------------ | ----------------------- | ----------------------------------------------------------------------------- |
| Theme             | `LumenProvider`         | `.lumenTheme`            | `LumenTheme`            | Light, dark, and semantic tokens                                              |
| Text              | `LumenText`             | `LumenText`              | `LumenText`             | Body, caption, label, and title roles                                         |
| Icon              | `LumenIcon`             | `LumenIcon`              | `LumenIcon`             | Shared names, native escape hatches, 16/20/24 sizes; decorative by default    |
| Icon button       | `LumenIconButton`       | `LumenIconButton`        | `LumenIconButton`       | Required label and shared intents; SwiftUI adds semantic roles and loading    |
| Surface           | `LumenSurface`          | `LumenSurface`           | `LumenSurface`          | Semantic surface, padding, and radius roles                                   |
| Button            | `LumenButton`           | `LumenButton`            | `LumenButton`           | Semantic intents, loading, disabled; SwiftUI keeps platform role independent  |
| Button group      | `LumenButtonGroup`      | `LumenButtonGroup`       | `LumenButtonGroup`      | Horizontal or vertical layout for related actions                             |
| Text field        | `LumenTextField`        | `LumenTextField`         | `LumenTextField`        | Error and disabled states with native input behavior                          |
| Textarea          | `LumenTextarea`         | `LumenTextarea`          | `LumenTextarea`         | Multiline native editing with supporting and error states                     |
| Field group       | `LumenFieldGroup`       | `LumenFieldGroup`        | `LumenFieldGroup`       | Shared label, guidance, required state, and validation message                |
| Toggle            | `LumenToggle`           | `LumenToggle`            | `LumenToggle`           | Full-row switch with visible label, supporting guidance, and disabled state   |
| Settings row      | `LumenSettingsRow`      | `LumenSettingsRow`       | `LumenSettingsRow`      | Supporting copy and trailing control in a minimum 56-unit row                 |
| Search field      | `LumenSearchField`      | `LumenSearchField`       | `LumenSearchField`      | Native search entry with a labeled, density-aware clear action                |
| Date field        | `LumenDateField`        | `LumenDateField`         | `LumenDateField`        | Native date selection with bounds and validation context                      |
| Date range field  | `LumenDateRangeField`   | `LumenDateRangeField`    | `LumenDateRangeField`   | Inclusive native range selection with coordinated start and end values        |
| Checkbox          | `LumenCheckbox`         | `LumenCheckbox`          | `LumenCheckbox`         | Controlled Boolean selection with a density-aware full-row target             |
| Radio group       | `LumenRadioGroup`       | `LumenRadioGroup`        | `LumenRadioGroup`       | Named single selection with density-aware rows and disabled options           |
| Segmented control | `LumenSegmentedControl` | `LumenSegmentedControl`  | `LumenSegmentedControl` | Compact single selection from a small peer set                                |
| Tabs              | `LumenTabs`             | `LumenTabs`              | `LumenTabs`             | Named tab list with controlled selection and an active content panel          |
| Navigation bar    | `LumenNavigationBar`    | `LumenNavigationBar`     | `LumenNavigationBar`    | Controlled destinations, re-selection, badges, and disabled states            |
| Chip              | `LumenChip`             | `LumenChip`              | `LumenChip`             | Compact selection with a labeled removal action and 24-unit minimum target    |
| Badge             | `LumenBadge`            | `LumenBadge`             | `LumenBadge`            | Neutral, accent, success, warning, and danger tones                           |
| Divider           | `LumenDivider`          | `LumenDivider`           | `LumenDivider`          | Semantic line color and decorative semantics                                  |
| Spinner           | `LumenSpinner`          | `LumenSpinner`           | `LumenSpinner`          | Brand default, optional semantic tint, and accessible loading label           |
| Card              | `LumenCard`             | `LumenCard`              | `LumenCard`             | Neutral and semantic surfaces; optional native action                         |
| Alert             | `LumenAlert`            | `LumenAlert`             | `LumenAlert`            | Default, destructive, success, and warning variants                           |
| Alert dialog      | `LumenAlertDialog`      | `lumenAlertDialog`       | `LumenAlertDialog`      | Controlled confirmation with destructive, disabled, and loading states        |
| Toast             | `LumenToast`            | `LumenToast`             | `LumenToast`            | App-controlled transient feedback with optional action and dismissal          |
| Progress          | `LumenProgress`         | `LumenProgress`          | `LumenProgress`         | Determinate, clamped value and valid maximum                                  |
| Skeleton          | `LumenSkeleton`         | `LumenSkeleton`          | `LumenSkeleton`         | Text, rectangle, or circle loading placeholder; decorative unless labeled     |
| Graphic           | `LumenGraphic`          | `LumenGraphic`           | `LumenGraphic`          | Token-aware glow, grid, or orbit around app-provided artwork                  |
| Backdrop          | `LumenBackdrop`         | `LumenBackdrop`          | `LumenBackdrop`         | Ambient aurora, dots, grid, or rays behind native content                     |
| Illustration      | `LumenIllustration`     | `LumenIllustration`      | `LumenIllustration`     | Built-in empty, success, error, and offline semantic scenes                   |
| Image             | `LumenImage`            | `LumenImage`             | `LumenImage`            | Native source/content, contain or cover fit, aspect ratio, radius, and label  |
| Sparkline         | `LumenSparkline`        | `LumenSparkline`         | `LumenSparkline`        | Compact labeled trend line with optional area fill                            |
| Line chart        | `LumenLineChart`        | `LumenLineChart`         | `LumenLineChart`        | Multi-series line or area plot with summary and fallback data                 |
| Bar chart         | `LumenBarChart`         | `LumenBarChart`          | `LumenBarChart`         | Grouped or stacked categorical magnitude comparison                           |
| Pie chart         | `LumenPieChart`         | `LumenPieChart`          | `LumenPieChart`         | Small positive part-to-whole pie or donut                                     |
| Scatter chart     | `LumenScatterChart`     | `LumenScatterChart`      | `LumenScatterChart`     | Numeric scatter or bubble relationship                                        |
| Heatmap           | `LumenHeatmap`          | `LumenHeatmap`           | `LumenHeatmap`          | Matrix encoded with the canonical sequential scale                            |
| Range chart       | `LumenRangeChart`       | `LumenRangeChart`        | `LumenRangeChart`       | Ordered low-to-high interval band                                             |
| Combo chart       | `LumenComboChart`       | `LumenComboChart`        | `LumenComboChart`       | Bar, line, and area series on one shared domain                               |
| Disclosure        | `LumenDisclosure`       | `LumenDisclosure`        | `LumenDisclosure`       | Controlled expanded state with native trigger and content semantics           |
| Avatar            | `LumenAvatar`           | `LumenAvatar`            | `LumenAvatar`           | Native image source, fallback, label, and shared sizes                        |
| Empty state       | `LumenEmptyState`       | `LumenEmptyState`        | `LumenEmptyState`       | Title, supporting copy, optional graphic, and recovery actions                |
| Error state       | `LumenErrorState`       | `LumenErrorState`        | `LumenErrorState`       | Error/offline context, safe reference, layouts, and recovery actions           |
| List row          | `LumenListRow`          | `LumenListRow`           | `LumenListRow`          | Leading identity, flexible content, and trailing actions                      |
| Banner            | `LumenBanner`           | `LumenBanner`            | `LumenBanner`           | Semantic notice with optional actions and dismissal                           |
| Stat              | `LumenStat`             | `LumenStat`              | `LumenStat`             | Compact semantic metric with label, value, and detail                         |
| Section header    | `LumenSectionHeader`    | `LumenSectionHeader`     | `LumenSectionHeader`    | Section identity, optional count, and trailing actions                        |
| Status bar        | `LumenStatusBar`        | `LumenStatusBar`         | `LumenStatusBar`        | Wrapping status message with ordered trailing content at its intrinsic size     |
| Picker            | `LumenPicker`           | `LumenPicker`            | `LumenPicker`           | Controlled single-value selection with native or accessible menu presentation |
| Slider            | `LumenSlider`           | `LumenSlider`            | `LumenSlider`           | Native or dependency-free continuous and stepped range input                  |
| Gauge             | `LumenGauge`            | `LumenGauge`             | `LumenGauge`            | Clamped circular metric with a formatted accessible value                     |
| Sheet             | `LumenSheet`            | `lumenSheet`             | `LumenSheet`            | Controlled supplemental surface with native modal dismissal                   |
| Menu              | `LumenMenu`             | `LumenMenu`              | `LumenMenu`             | Anchored actions with disabled and destructive item states                    |
| Share button      | `LumenShareButton`      | `LumenShareButton`       | `LumenShareButton`      | Token-aware action backed by the operating system share surface               |
| Wearable action   | —                       | `LumenWatchActionButton` | `LumenWearActionButton` | Round essential action with semantic intent and wearable-safe bounds          |
| Wearable progress | —                       | `LumenWatchProgressRing` | `LumenWearProgressRing` | Clamped circular progress around application-owned center content             |
| Wearable status   | —                       | `LumenWatchStatus`       | `LumenWearStatus`       | Compact text-first semantic status                                            |

The web-only Card variants `glass` and `unstyled` are deliberately not shared. Blur, material, and
unstyled layout behavior do not have a stable cross-platform meaning. Native Card interaction is
enabled by an action or press callback instead of a visual-only `interactive` variant.

### Newly supported Lumen 2 surface

These contracts graduated into the supported Lumen 2 surface. They use the same compatibility,
documentation, and migration policy as the rest of the supported native catalog.

| Contract          | React Native      | SwiftUI             | Compose            | Current maturity |
| ----------------- | ----------------- | ------------------- | ------------------ | ---------------- |
| Phone input       | `LumenPhoneInput` | `LumenPhoneInput`   | `LumenPhoneInput`  | Supported        |
| Wearable metric   | —                 | `LumenWatchMetric`  | `LumenWearMetric`  | Supported        |
| Wearable list row | —                 | `LumenWatchListRow` | `LumenWearListRow` | Supported        |

## Platform-specific components

Each native adapter also provides a small set of controls grounded in its own interaction model.
They use Lumen tokens and accessibility rules without promising artificial API parity.

| Component                         | Adapter      | Platforms    | Contract                                                               |
| --------------------------------- | ------------ | ------------ | ---------------------------------------------------------------------- |
| `LumenRefreshControl`             | React Native | iOS, Android | Pull-to-refresh state with semantic native indicator colors            |
| `LumenCollapsibleNavigationBar`   | React Native | iOS, Android | Threshold-based animated navigation visibility for scroll containers   |
| `LumenNavigationAccessory`        | React Native | iOS, Android | Compact status or actions above bottom navigation                      |
| `LumenLink`                       | SwiftUI      | iOS, macOS, visionOS | Token-aware URL action using native SwiftUI link opening          |
| `lumenTabBarMinimizeBehavior`     | SwiftUI      | iOS          | Native iPhone tab minimization with an iOS 16-compatible fallback      |
| `LumenTabAccessory`               | SwiftUI      | iOS          | Expanded and compact content for native tab-bar accessory placement    |
| `LumenShortcutRecorder`           | SwiftUI      | macOS        | Keyboard capture with cancel, clear, and application validation states |
| `LumenSymbolPicker`               | SwiftUI      | macOS        | Searchable categorized SF Symbols selection                            |
| `LumenWidgetText`                 | WidgetKit    | iOS, macOS, watchOS | Semantic localized or verbatim widget text with Dynamic Type     |
| `LumenWidgetIcon`                 | WidgetKit    | iOS, macOS, watchOS | Rendering-mode-aware SF Symbol treatment                         |
| `LumenWidgetBadge`                | WidgetKit    | iOS, macOS, watchOS | Compact semantic status badge with increased-contrast treatment  |
| `LumenWidgetCompactStat`          | WidgetKit    | iOS, macOS, watchOS | Compact label and metric composition                             |
| `LumenFloatingActionButton`       | Compose      | Android      | Material floating action with semantic intent and native sizing        |
| `LumenNavigationBarScrollState`   | Compose      | Android      | Nested-scroll visibility behavior for a Material navigation bar        |
| `LumenNavigationBarAccessory`     | Compose      | Android      | Compact content coordinated with Material bottom navigation            |
| `LumenAdaptiveNavigationScaffold` | Compose      | Android      | Window- and posture-adaptive Material navigation bar or rail           |

The WidgetKit-specific contracts ship in the separate `LumenWidgetUI` product so widget extensions
do not link the complete `LumenUI` catalog. See [WidgetKit foundations](widgetkit-foundations.md).

The versioned native contract registry requires every non-wearable shared component to expose a
public React Native, SwiftUI, and Compose implementation. Wearable entries carry an explicit
`formFactor: "wearable"` exception, and the contract check requires those entries in SwiftUI and
Compose while keeping them out of the React Native phone surface.

The wearable contracts are available only for SwiftUI watchOS targets and the
`lumen-compose-wear` artifact. They intentionally do not recreate the phone catalog. Use one
essential action, short statuses, at-a-glance progress and metrics, and compact rows inside native
watch scrolling or paging containers.

Picker, slider, gauge, date field, and date range field now share one controlled contract across
React Native, SwiftUI, and Compose. SwiftUI and Compose use their native controls. React Native uses
dependency-free accessible menu, adjustable, and progress semantics so applications do not need a
second control package for the common contract.

Empty picker collections are disabled. If a picker, date field, date range field, or phone-country
selector becomes disabled while its adapter-owned selection UI is open, that UI closes and stays
closed after re-enabling until the user explicitly opens it again. This prevents stale selection
callbacks from escaping a disabled control.

### React Native behavior hooks

React Native consumers can share ordinary React application hooks with a web app when those hooks
remain platform-neutral. Lumen exports `useDisclosure` and `useDialog`, `useTabs`, `useSelect`,
`useLanguageToggle`, `useThemeToggle`, and `useToast` from
`@santi020k/lumen-react-native`. These preserve the controlled and uncontrolled state semantics of
the corresponding reusable React behaviors while returning native component props instead of DOM,
ARIA, CSS, or browser-event props. `useLumenTheme` and `useLumenNavigationBarVisibility` remain the
native-only theme and scroll-visibility controllers.

Do not import behavior hooks from `@santi020k/lumen-react` into a React Native bundle. Keep API
access, schemas, domain state, and custom hooks in a shared application package, then connect web
and native state to their matching Lumen rendering adapters. The complete controller examples live
in the [React Native hooks guide](https://lumen.santi020k.com/docs/react-native/hooks).

`LumenNavigationBar` covers a small set of peer app destinations while leaving the selected screen,
navigation history, deep links, and restoration in application code. Continue using native routers,
`NavigationSplitView`, navigation stacks, popovers, and window scenes for hierarchical
navigation, focus restoration, keyboard routing, and window behavior.

Every adapter supports optional destination badges and an `onReselect` callback. Use re-selection
for application-owned behavior such as scrolling the active feed to the top or popping its nested
stack. Dot badges announce an application-provided status; text and count badges retain their full
spoken value even when the visible count is capped at `99+`.

On iPhone, apply `.lumenTabBarMinimizeBehavior(.onScrollDown)` to a native SwiftUI `TabView` to use
the system minimizing tab bar on iOS 26 and later. Earlier iOS versions retain their normal tab bar;
Lumen does not recreate system navigation with a custom overlay. The other policies are
`.automatic`, `.never`, and `.onScrollUp`.

`lumenTabViewBottomAccessory` uses native tab accessory placement on iOS 26 and a token-aware safe-
area inset on earlier supported releases. `LumenTabAccessory` switches between expanded and compact
application content as the native tab bar changes placement.

```swift
TabView {
    FeedView().tabItem { Label("Feed", systemImage: "rectangle.stack") }
    ProfileView().tabItem { Label("Profile", systemImage: "person") }
}
.lumenTabBarMinimizeBehavior(.onScrollDown)
.lumenTabViewBottomAccessory {
    LumenTabAccessory {
        UploadStatus(showProgress: true)
    } compact: {
        UploadStatus(showProgress: false)
    }
}
```

The application continues to own tab selection, independent navigation paths, scroll position,
badges, deep links, and the accessory's domain state.

On Android, use `rememberLumenNavigationBarScrollState` and attach
`Modifier.lumenNavigationBarScrollBehavior(state)` above the scrolling content. Pass the same state
to `LumenNavigationBar`; it observes nested-scroll deltas without consuming them, then slides the
Material bar out after forward travel and restores it on reverse travel.

In React Native, `useLumenNavigationBarVisibility` accepts `ScrollView`, `FlatList`, or `SectionList`
scroll events. Pass its `visible` value to `LumenCollapsibleNavigationBar`. The wrapper animates its
height and opacity, disables hidden pointer interaction, and removes hidden destinations from the
accessibility tree while leaving list virtualization and routing application-owned.

`LumenNavigationAccessory` and `LumenNavigationBarAccessory` provide compact status or action
content for playback, uploads, calls, or recording. Supplying the same visibility state makes the
accessory leave the layout with navigation. Safe-area ownership and domain state stay in the app.

Android applications can use `LumenAdaptiveNavigationScaffold` to let Material switch between a
bottom navigation bar and navigation rail as the window size or foldable posture changes. The
scaffold renders application-owned destination content and never creates a router or back stack.

### Shared destination navigation

Each adapter uses the same controlled-selection contract with native icon types. Keep destination
labels short, supply a meaningful label for the group, and let the application render the selected
screen through its existing router or navigation stack.

```tsx
<LumenNavigationBar
  accessibilityLabel="Primary navigation"
  items={destinations}
  value={destination}
  onValueChange={setDestination}
  onReselect={scrollDestinationToTop}
/>
```

```swift
LumenNavigationBar(
    "Primary navigation",
    selection: $destination,
    items: [
        LumenNavigationItem("Home", value: .home, systemName: "house", badge: .count(12)),
        LumenNavigationItem("Search", value: .search, systemName: "magnifyingglass")
    ],
    onReselect: scrollDestinationToTop
)
```

```kotlin
LumenNavigationBar(
    items = destinations,
    selectedValue = destination,
    onValueChange = ::setDestination,
    onReselect = ::scrollDestinationToTop
)
```

### Confirmation, sheets, menus, and sharing

Overlay state and application data remain controlled by the host. Lumen supplies consistent action
roles, spacing, and accessibility while each adapter uses its native modal and share presentation.
SwiftUI exposes alert and sheet presentation as view modifiers so focus restoration remains attached
to the presenting view.

```swift
LumenButton("Delete report") { showConfirmation = true }
    .lumenAlertDialog(
        isPresented: $showConfirmation,
        title: "Delete report?",
        confirmLabel: "Delete",
        confirmRole: .destructive,
        onConfirm: deleteReport
    )

LumenShareButton("Share report", item: reportText)
```

```kotlin
LumenSheet(
    visible = showEditor,
    onDismiss = { showEditor = false },
    title = "Edit report"
) {
    ReportEditor()
}
```

```tsx
<LumenAlertDialog
  visible={showConfirmation}
  title="Delete report?"
  confirmLabel="Delete"
  destructive
  onConfirm={deleteReport}
  onDismiss={() => setShowConfirmation(false)}
/>
```

### Platform-native actions and input

React Native scroll containers retain ownership of scrolling while Lumen supplies the refresh
indicator. The application owns refreshing state and completion:

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

Apple applications can constrain native date or date-and-time selection and provide supporting or
validation text without replacing `DatePicker` behavior:

```swift
LumenDateField(
    "Release date",
    selection: $releaseDate,
    components: .dateAndTime,
    bounds: .from(.now),
    description: "Choose when this version becomes available."
)
```

Use `LumenDateRangeField` for an inclusive Apple range. If a new start moves beyond the current end,
the end advances to the same value so the controlled range remains valid:

```swift
LumenDateRangeField(
    "Release window",
    start: $releaseStart,
    end: $releaseEnd,
    bounds: .from(.now),
    description: "Choose when this release is available."
)
```

Compose exposes the same concepts through Material 3 calendar dialogs. Values use UTC milliseconds,
matching Material's date picker state contract:

```kotlin
LumenDateField(
    label = "Release date",
    value = releaseDateMillis,
    onValueChange = { releaseDateMillis = it },
    minDateMillis = todayUtcMillis
)

LumenDateRangeField(
    label = "Release window",
    value = releaseRange,
    onValueChange = { releaseRange = it },
    minDateMillis = todayUtcMillis
)
```

Every phone-capable native adapter exposes the same metadata-backed model: a localized country,
editable national number, validity, and optional E.164 result. Flags supplement the visible country
name and calling code; they are never the only country identifier.

React Native:

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

SwiftUI on iOS and macOS:

```swift
@State private var phone = LumenPhoneNumber.empty(
    country: LumenPhoneCountry(regionCode: "CO", callingCode: "+57", displayName: "Colombia")
)

LumenPhoneInput(
    "Hospital or OB phone number",
    value: $phone,
    description: "Include the complete area or mobile number."
)
```

Compose:

```kotlin
@Composable
fun CareTeamPhoneField() {
    val defaultCountry = remember {
        requireNotNull(LumenPhoneCountries.forRegion("CO"))
    }
    var phone by remember { mutableStateOf(LumenPhoneNumber.empty(defaultCountry)) }

    LumenPhoneInput(
        label = "Hospital or OB phone number",
        value = phone,
        onValueChange = { phone = it },
        description = "Include the complete area or mobile number."
    )
}
```

Persist or dial `phone.e164` only when `phone.isValid` is true. Applications remain responsible for
localized labels and for deciding when validation feedback should be shown. Phone input remains
unavailable on watchOS, Wear OS, and tvOS because long-form phone entry is unsuitable there.

Compose applications can use a Material-native floating action while keeping Lumen semantic intent:

```kotlin
LumenFloatingActionButton(
    imageVector = Icons.Default.Add,
    contentDescription = "Create project",
    onClick = ::createProject,
    scrollState = navigationScrollState,
    navigationBehavior = LumenFloatingActionButtonNavigationBehavior.HideWithNavigation
)
```

### Shared settings and native selection

`LumenSettingsRow` keeps explanatory copy aligned while the contained control retains independent
focus and accessibility semantics on every native adapter. SwiftUI and Compose additionally
provide picker and slider wrappers where stable dependency-free APIs exist:

```swift
LumenSettingsRow(
    "Automatic updates",
    description: "Download updates when they become available.",
    systemName: "arrow.triangle.2.circlepath"
) {
    LumenToggle("Automatic updates", isOn: $automaticUpdates)
        .labelsHidden()
}

LumenPicker("Profile", selection: $profile, style: .segmented) {
    Text("Quiet").tag(Profile.quiet)
    Text("Balanced").tag(Profile.balanced)
    Text("Performance").tag(Profile.performance)
}

LumenSlider(
    "Minimum speed",
    value: $minimumSpeed,
    in: 1_000...5_000,
    step: 100,
    valueLabel: "\(Int(minimumSpeed)) RPM",
    onEditingChanged: { editing in
        editing ? undoManager.beginUndoGrouping() : undoManager.endUndoGrouping()
    }
)
```

SwiftUI pickers also accept rich label and current-value builders, so a product can preserve an
icon-bearing setting label and a color-swatch selection without replacing the native picker. The
concise text initializer remains the default. `LumenTextarea` accepts a compact line range and an
independently focusable trailing accessory for actions such as caption assistance. Undo grouping,
haptic detents, and the assistant workflow remain application-owned.

Native peer tabs scroll horizontally at narrow widths and bring the controlled selection into
view. Keep labels concise, retain the 44-point target, and prefer a picker for long or numerous
choices and a segmented control for a small mutually exclusive set.

### Shared empty, row, and feedback states

Empty states, error states, list rows, banners, stats, section headers, and status bars share one semantic contract
across React Native, SwiftUI, and Compose. Their graphic and action slots remain native so each app
can supply a shared Lumen icon or a platform-specific graphic, SF Symbol, or `ImageVector`.
Status bars pair every tone with a distinct decorative icon so status is not communicated by color
alone. Use `iconName` on React Native and Compose, or `systemName` on SwiftUI, when the product needs
a more specific symbol; keep the visible message responsible for the accessible status text.

`LumenSkeleton` covers loading placeholders without announcing every visual block. Leave it
unlabeled when the surrounding region already communicates loading, or provide one concise label to
expose an indeterminate progress state. `LumenDisclosure` keeps expanded state in application code;
collapsed content is removed from the accessibility tree on every adapter.

```swift
LumenEmptyState(
    "No saved workspaces",
    systemName: "rectangle.stack",
    description: "Create a workspace to organize the windows on this Mac."
) {
    LumenButton("Create Workspace", action: createWorkspace)
}

LumenErrorState(
    "Could not load workspaces",
    description: "Check your connection and try again.",
    kind: .offline,
    reference: "REQ-4F82"
) {
    LumenButton("Try again", action: retry)
}

LumenListRow {
    LumenIcon(systemName: "macwindow")
} content: {
    VStack(alignment: .leading) {
        Text("Documentation")
        Text("Safari · Project workspace").font(.caption)
    }
} trailing: {
    LumenButton("Focus", intent: .secondary, size: .sm, action: focusWindow)
}

LumenBanner(
    "Workspace assigned automatically",
    description: "Moved Safari to Documentation based on recent choices.",
    variant: .accent,
    onDismiss: dismissAssignment
) {
    LumenButton("Undo", intent: .quiet, size: .sm, action: undoAssignment)
}
```

`LumenBanner` is inline presentation, not a live announcement. Applications decide whether a newly
inserted message needs a platform accessibility announcement.

See the [error-handling guide](./error-handling.md) for the complete cross-platform contract,
layout selection, announcement policy, retry lifecycle, safe-reference rules, and React Native,
SwiftUI, and Compose examples. `LumenErrorState` presents an application-classified failure; it
does not catch exceptions, start requests, infer connectivity, or report diagnostics.

SwiftUI disclosures accept either the concise title-and-description initializer or a custom label
view. Use a custom label for application identity, metrics, badges, and independently meaningful
status content; keep domain actions and process behavior in application code. Presentation-only
disclosures can own their expansion state with `initiallyExpanded`, while navigation or persisted
state should continue to pass an explicit binding.

```swift
LumenDisclosure(isExpanded: $isExpanded) {
    HStack {
        LumenIcon(systemName: "app.badge")
        Text("Background service")
        Spacer()
        LumenBadge("Running", tone: .success)
    }
} content: {
    ServiceDetails()
}
```

Use `LumenLink` for an Apple URL action that needs Lumen color and focus treatment without replacing
SwiftUI's URL handling. The application still owns routing and URL policy.

```swift
LumenLink(
    "Read privacy policy",
    destination: privacyPolicyURL,
    showsExternalIndicator: true
)
```

Use `.compact` empty-state layout and stat density in constrained sidebars or three-column phone
summaries; use the defaults for ordinary cards and `.page` for a page-level empty state. Banner
actions adapt from a row to a vertical stack when width or text size makes the row unsafe. A
`success` button communicates a positive semantic outcome; `primary` remains the single default
call to action for hierarchy.

All native chart adapters accept replaceable chart labels. Finite zero is valid data; an all-zero
series is therefore not empty, although an application may choose a scoreboard instead when the
chart adds no value. Set `showData` to `false` only when the same values are already available in a
nearby accessible table. Native line charts accept an optional labeled reference rule and
per-datum `tone` plus `toneLabel`; always provide the visible or spoken tone label so color is not
the only encoding.

### Metrics and dense desktop structure

```swift
LazyVGrid(columns: [GridItem(.adaptive(minimum: 160))]) {
    LumenStat("Open windows", value: "12", systemName: "macwindow", tone: .accent)
    LumenStat("Saved scenes", value: "4", systemName: "rectangle.stack", tone: .brand)
}

LumenGauge(
    "Thermal pressure",
    value: 48,
    valueLabel: "Fair",
    systemName: "thermometer.medium",
    tone: .warning
)
```

Use `LumenProgress` for task completion and `LumenGauge` for a current bounded metric. `LumenStat`
must report a useful product value rather than decorative dashboard filler.

### macOS input utilities

The shortcut recorder requires a modifier key, consumes Escape as cancel, and accepts an optional
application validator for conflicts or reserved shortcuts:

```swift
LumenShortcutRecorder("Quick switch", shortcut: $shortcut) { candidate in
    reservedShortcuts.contains(candidate) ? "That shortcut is already in use." : nil
}
```

`LumenSymbolPicker` accepts an application-provided `[LumenSymbolOption]` or the built-in stable
common set. `LumenSymbolPickerButton` presents the picker in a compact native popover:

```swift
LumenSymbolPickerButton("Workspace symbol", selectedName: $symbolName)
```

## Shared component contracts

### Card

Cards use semantic surface tones, the large radius, and extra-large padding by default. Every native
adapter provides `default`, `muted`, `accent`, `success`, `warning`, and `destructive` with
restrained semantic backgrounds and borders. The `padding` and `radius` options expose the shared
native surface scale when a product needs denser content or a stronger container shape.
Supplying an action gives the card native button semantics and pressed feedback. Do not place an
interactive card inside another button or place unrelated controls inside a card-level action.

### Alert

Alert variants map to the same semantic roles as the web reference:

| Variant       | Foreground and border role | Background treatment |
| ------------- | -------------------------- | -------------------- |
| `default`     | `ink` and `line`           | `surface`            |
| `destructive` | `danger`                   | 8% danger tint       |
| `success`     | `success`                  | 8% success tint      |
| `warning`     | `warning`                  | 10% warning tint     |

An Alert is a styled semantic container, not automatically a live announcement. Applications must
use the platform's announcement or live-region mechanism when an alert appears asynchronously and
requires immediate assistive-technology attention.

### Progress

Progress is determinate. Values are clamped into `0...max`; a non-finite value becomes zero and a
non-positive or non-finite maximum becomes 100. Every adapter exposes native progress semantics.
Provide a label when surrounding text does not already name the operation.

### Avatar

Avatar image inputs remain native: React Native uses `ImageSourcePropType`, SwiftUI uses `Image`,
and Compose uses `Painter`. The shared sizes are 32, 40, and 56 platform units. A missing image uses
the supplied fallback, normally initials. Supply a label when the avatar conveys identity; omit it
when the same name is adjacent and the avatar is decorative.

## Shared-tier examples

React Native exposes explicit Alert text roles because text color does not inherit through a native
View:

```tsx
<LumenCard variant="muted" padding="lg" radius="2xl">
  <LumenAvatar fallback="SM" label="Santiago Molina" />
  <LumenAlert variant="success">
    <LumenAlertTitle>Profile synced</LumenAlertTitle>
    <LumenAlertDescription>
      Your changes are available offline.
    </LumenAlertDescription>
  </LumenAlert>
  <LumenProgress value={72} label="Profile completion" />
</LumenCard>
```

SwiftUI and Compose propagate their foreground or content color through the native environment:

```swift
LumenCard(variant: .muted, padding: .lg, radius: .size2xl) {
    VStack(alignment: .leading, spacing: LumenSpacing.lg) {
        LumenAvatar(fallback: "SM", label: "Santiago Molina")
        LumenAlert(variant: .success) {
            Text("Profile synced")
        }
        LumenProgress(value: 72, label: "Profile completion")
    }
}
```

Native surfaces and cards accept the shared small through extra-large roles, plus `size2xl` and
`size3xl` card radii where supported by the platform language. Status bars pair every semantic tone
with a visible icon by default.

```kotlin
LumenCard(
    variant = LumenCardVariant.Muted,
    padding = LumenSurfacePadding.Lg,
    radius = LumenSurfaceRadius.Size2xl
) {
    Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Lg)) {
        LumenAvatar(fallback = "SM", label = "Santiago Molina")
        LumenAlert(variant = LumenAlertVariant.Success) {
            Text("Profile synced")
        }
        LumenProgress(value = 72f, label = "Profile completion")
    }
}
```

## Accessibility requirements

- Icon-only controls require a concise action label; visible tooltips do not replace it.
- Disabled and loading controls expose native state and cannot trigger their action.
- Interactive cards expose button semantics and must have an understandable accessible name from
  their content or an explicit label.
- Alerts do not interrupt screen readers merely because they are visually styled as alerts.
- Toasts use native live feedback semantics while their action and dismissal remain independently
  labeled and fully operable.
- Field-group validation updates use native live feedback without merging their child controls.
- Progress exposes minimum, maximum, and current values after normalization.
- Skeletons are decorative unless explicitly labeled as an indeterminate loading state.
- Disclosure triggers expose their current expanded or collapsed state, and hidden content is not
  focusable.
- Avatar fallback text is hidden from accessibility when the avatar itself is decorative.
- Dynamic Type, TalkBack, VoiceOver, native focus, and reduced-motion settings take precedence over
  attempts to reproduce browser behavior.

## Verification and contribution

After changing tokens, run `pnpm run generate:platform-tokens` and review every generated adapter.
For component changes, run:

```bash
pnpm --filter @santi020k/lumen-react-native run build
pnpm --filter @santi020k/lumen-react-native run typecheck
pnpm --filter @santi020k/lumen-react-native run test
pnpm --filter @santi020k/lumen-react-native run lint
swift test
(cd packages/compose && ./gradlew test lint)
(cd packages/compose && ./gradlew assembleDebugAndroidTest)
pnpm run validate
```

A native component is supported only when its public API is documented, semantic tokens replace
ad hoc styling, invalid inputs are normalized, accessibility behavior is explicit, and tests cover
the shared state or measurement contract on every adapter.

Use the [native device validation matrix](native-device-validation.md) for VoiceOver, TalkBack,
keyboard, text scaling, contrast, and reduced-motion verification on representative hardware.
