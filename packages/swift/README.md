<p align="center">
  <a href="https://lumen.santi020k.com">
    <img src="https://raw.githubusercontent.com/santi020k/lumen/main/apps/docs/public/logo.svg" alt="Lumen UI" width="233" height="60">
  </a>
</p>

<h1 align="center">Lumen UI · SwiftUI</h1>

<p align="center">Apple-native components · Semantic themes · Shared foundations</p>

<p align="center">
  <a href="https://github.com/santi020k/lumen/tree/main/packages/swift"><img src="https://img.shields.io/badge/platform-SwiftUI-0369a0?style=flat-square" alt="SwiftUI package"></a>
  <a href="https://github.com/santi020k/lumen/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-13967e?style=flat-square" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://lumen.santi020k.com/docs/apple">Documentation</a>
  ·
  <a href="https://github.com/santi020k/lumen/tree/main/packages/swift">Source</a>
  ·
  <a href="https://github.com/santi020k/lumen/issues">Issues</a>
</p>

**Package:** `LumenUI for SwiftUI`

**On this page:** [Runtime and localized text](#runtime-and-localized-text) · [Data visualization](#data-visualization) · [Resources](#resources)

---

> **Lumen 4 candidate:** This branch prepares the next major adapter contract. See the
> [migration guide](../../docs/migrating-to-lumen.md) before upgrading. Local checks do not replace
> publication, physical-device accessibility, or consumer-soak qualification.

`LumenUI` is Lumen's native SwiftUI package. Its foundations are generated from the same canonical
design tokens as the web, React Native, and Compose adapters.

Try the native components in [Lumen Playground on the App Store](https://apps.apple.com/app/id6805250815)
for iPhone, iPad, and Mac, or browse the
[Apple playground guide](https://lumen.santi020k.com/docs/apple/playground).

`LumenPhoneInput` is implemented entirely inside `LumenUI`; consumers do not resolve or link a
separate phone-number package. Lumen ships a compact generated metadata resource and owns the Swift
parsing, validation, E.164, country-detection, formatting, and picker behavior. Maintainers refresh
that resource with `pnpm run generate:swift-phone-metadata` when the workspace phone metadata is
updated.

Widget extensions that only need semantic presentation should link the separate `LumenWidgetUI`
product documented in [`packages/swift-widget`](../swift-widget). It avoids linking the complete
application component catalog and keeps timelines, App Intents, deep links, and backgrounds owned
by the widget target.

Maintainers can prove semantic-tag resolution, clean consumer builds for every declared Apple
platform, resource availability, and license-notice presence from a disposable candidate repository
with `pnpm run check:swift-package-candidate` at the repository root. A public release still requires
rerunning the same consumer proof against the final immutable repository tag with
`pnpm run check:swift-package-release -- --version <version>`.

The Swift release version follows the umbrella version in `registry/release-manifest.json`.
`pnpm run sync:swift-version` updates every public Swift installation example, and
`pnpm run check:swift-version` prevents release validation from passing with a stale tag or pin.

In Xcode, choose **File → Add Package Dependencies**, paste
`https://github.com/santi020k/lumen`, and use **Exact Version** `4.0.0` for a reproducible production
build. Choose **Up to Next Major Version** from `4.0.0` when the application intentionally accepts
compatible Lumen updates. Reserve the `main` branch for local evaluation. Add the `LumenUI` product
to your application target. The package manifest lives at the repository root, so the Git
dependency works directly; no npm package, CocoaPod, or copied source is required.

For a project managed with `Package.swift`, add the package and product explicitly:

```swift
dependencies: [
    .package(
        url: "https://github.com/santi020k/lumen",
        exact: "4.0.0"
    )
],
targets: [
    .target(
        name: "YourApp",
        dependencies: [
            .product(name: "LumenUI", package: "lumen")
        ]
    )
]
```

Use `.package(url: "https://github.com/santi020k/lumen", from: "4.0.0")` instead when the
application's update policy accepts later compatible releases. Commit `Package.resolved` for
applications, generated Xcode projects, and CI builds, then verify its `version` is `4.0.0` and its
`revision` matches the `v4.0.0` tag before shipping. XcodeGen projects use the same policy in
`project.yml` with `version: 4.0.0` for compatible updates or `exactVersion: 4.0.0` for an exact
pin. Deterministic project generators should declare the requirement in their checked-in source
and regenerate the project instead of patching the generated `.xcodeproj`.

After Xcode resolves the package, import `LumenUI` in the SwiftUI view that owns the application
surface and apply one theme near the root:

```swift
import SwiftUI
import LumenUI

struct AppContent: View {
    var body: some View {
        LumenSurface {
            LumenText("Welcome", variant: .title)
            LumenButton("Continue", action: continueFlow)
            LumenIconButton(
                name: .search,
                label: "Search",
                action: openSearch
            )
        }
    }
}

struct AppRoot: View {
    var body: some View {
        AppContent()
            .lumenTheme(.dark)
    }
}
```

## Runtime and localized text

String literals in existing component initializers continue to use SwiftUI's native localization
key behavior. When copy is chosen at runtime, use `LumenTextContent` to state whether SwiftUI should
resolve a localization key or resource, or render an application-resolved string verbatim:

```swift
LumenText(.localized(LocalizedStringResource("welcome.title")), variant: .title)
LumenText(.verbatim(profile.displayName))

LumenTextarea(
    .verbatim(copy.noteLabel),
    text: $note,
    description: .verbatim(copy.noteGuidance),
    errorMessage: note.isEmpty ? .verbatim(copy.noteRequired) : nil
)

LumenButton(
    .verbatim(copy.saveAction),
    loading: isSaving,
    loadingAccessibilityValue: .verbatim(copy.savingAction),
    action: save
)
```

`LumenText`, `LumenBadge`, `LumenSpinner`, text buttons, `LumenTextField`, `LumenTextarea`, and
`LumenFieldGroup` accept the contract where runtime bridges are commonly needed. Locale selection,
translation dictionaries, and persistence remain application-owned; changing the SwiftUI locale
environment or application copy state updates mounted views normally.

Selection controls also use native localization keys for their accessibility state values.
Translate `Checked` and `Not checked` for Checkbox, and `Selected` and `Not selected` for
RadioGroup, SegmentedControl, and Tabs in the consuming application's string catalog.

Rich native form composition remains controlled by the application:

```swift
LumenPicker(selection: $accent, style: .menu) {
    Label("Accent", systemImage: "paintpalette")
} currentValueLabel: {
    HStack { Circle().fill(accent.color).frame(width: 12, height: 12); Text(accent.name) }
} content: {
    ForEach(Accent.allCases) { option in Text(option.name).tag(option) }
}

LumenTextarea("Caption", text: $caption, lineLimit: 2...6) {
    LumenButton("Assist", intent: .quiet, size: .sm, action: suggestCaption)
}
```

Use `LumenSlider(..., onEditingChanged:)` to begin and end an application-owned undo group.
`valueLabel` supplies the adjustable control's accessible value as well as its visible value.
Set `showsLabel: false` for a slider embedded in an already labeled setting; the native control
keeps its accessible name and formatted value:

```swift
LumenSlider(
    "Minimum speed",
    value: $minimumSpeed,
    in: 1_000...5_000,
    step: 100,
    valueLabel: "\(Int(minimumSpeed)) RPM",
    showsLabel: false
)
```

Without `valueLabel`, the slider retains the platform's value announcement. Keep haptics,
persistence, caption generation, and other domain workflows outside Lumen.

Applications can construct `LumenColorPalette` directly when they already own light and dark
product palettes. If a stored System/Light/Dark preference is application-owned, inject the chosen
semantic values without forcing SwiftUI's appearance:

```swift
enum AppAppearance {
    case system, light, dark
}

struct ThemedAppRoot: View {
    @Environment(\.colorScheme) private var systemColorScheme

    let applicationOwnsTint: Bool
    let selectedAppearance: AppAppearance

    private var baseTheme: LumenTheme {
        switch selectedAppearance {
        case .system:
            systemColorScheme == .dark ? .dark : .light
        case .light:
            .light
        case .dark:
            .dark
        }
    }

    private var productTheme: LumenTheme {
        LumenTheme(
            colors: baseTheme.colors.overriding(
                brand: Color("BrandAccent"),
                brandSoft: Color("BrandAccentSoft"),
                accent: Color("BrandAccent")
            ),
            scheme: baseTheme.scheme
        )
    }

    var body: some View {
        AppContent()
            .lumenTheme(
                productTheme,
                enforceColorScheme: selectedAppearance != .system,
                applyTint: !applicationOwnsTint
            )
    }
}
```

Use `overriding(...)` for additive product customization: omitted semantic colors continue to use
the selected Lumen light or dark palette. Construct `LumenColorPalette` directly only when the
application intentionally owns every semantic color.

Apply the modifier to every independent scene that presents Lumen content, including macOS window,
settings, menu-bar, widget, and preview roots. With `enforceColorScheme: false`, system appearance
changes remain application-owned while Lumen components read the supplied palette. With
`applyTint: false`, Lumen does not replace an application-owned native tint.

`LumenSurface` and `LumenCard` expose semantic padding and radius options. The larger `.xl`,
`.size2xl`, and `.size3xl` radii support app-owned mobile cards and media surfaces without literal
corner values.

The native set includes Text, Icon, IconButton, Surface, Button, ButtonGroup, TextField, Textarea,
FieldGroup, Toggle, SettingsRow, Checkbox, RadioGroup, SegmentedControl, Tabs, Chip, Picker, Slider,
DateField, DateRangeField, PhoneInput, Link,
SearchField, Badge, Divider, Spinner, Card, Alert, Toast, Banner, Progress, Skeleton, Graphic,
Backdrop, Illustration, Image, Disclosure, EmptyState, ErrorState,
ListRow, Stat, Gauge, SectionHeader, StatusBar, and Avatar. macOS additionally includes a keyboard
ShortcutRecorder and searchable SF Symbols picker.
Native presentation is available through `.lumenAlertDialog`, `.lumenSheet`, `LumenMenu`, and
`LumenShareButton`; the application continues to own presentation state and shared content.
Sheets scroll their content by default and keep actions outside the ordinary scrolling body.
At accessibility text sizes or compact iPhone heights, the complete sheet scrolls so headings and
actions remain reachable. Set `scrollable: false` when the content already owns a native `List` or
scroll container. Set `dismissible: false` to prevent interactive dismissal while saving; the
application can still close the sheet through its binding. Dense list rows and section headers
stack their independent content and actions at accessibility text sizes.
`LumenNavigationBar` selects among a small set of peer destinations while the application retains
ownership of its `NavigationStack`, `NavigationSplitView`, deep links, and restoration state. Items
support accessible dot, text, and capped count badges; `onReselect` lets the application scroll its
active content to the top or pop its nested stack.
Native `TabView` screens can opt into `.lumenTabBarMinimizeBehavior(...)` and attach adaptive
expanded/compact content with `.lumenTabViewBottomAccessory` and `LumenTabAccessory`. iOS 26 uses
the system tab behavior; earlier supported iOS releases retain the normal tab bar and use a
token-aware safe-area accessory fallback.
Components preserve Dynamic Type, SwiftUI environment behavior, and native accessibility instead
of reproducing DOM behavior. `LumenIconName` provides all canonical Lucide interface icons and
namespaced Font Awesome Free brands used by web, React Native, and Compose. Use
`LumenIcon(name: .search)`, `LumenIcon(name: .brandGithub)`, or
`LumenIconButton(name: .settings, ...)` for cross-platform product interfaces. The existing
`systemName` initializers remain available for platform-specific controls that should follow SF
Symbols conventions. Standalone icons are decorative unless labeled, and icon-only buttons require
a label. See `THIRD_PARTY_NOTICES.md` for artwork licenses, attribution, and the brand-trademark
boundary.

`LumenDisclosure` supports concise text labels and rich application-owned label views, with either
controlled or presentation-local expansion state. `LumenLink` applies semantic link treatment while
delegating URL opening, focus, disabled state, and accessibility behavior to SwiftUI.

`LumenImage` applies the shared fit, aspect-ratio, semantic-radius, and accessibility contract to
application-provided SwiftUI image content, so the application retains control of asset catalogs,
`AsyncImage`, caching, and retry behavior.

watchOS targets use a focused at-a-glance tier instead of the full phone catalog:
`LumenWatchActionButton`, `LumenWatchProgressRing`, `LumenWatchStatus`, `LumenWatchMetric`, and
`LumenWatchListRow`. Apply `.lumenTheme(...)` at the watch app root. Keep Digital Crown behavior,
Always On policy, complications, WidgetKit timelines, notifications, haptics, synchronization, and
health or safety decisions in the application.

The same component APIs work in iOS, macOS, and visionOS targets. Lumen automatically uses
touch-friendly dimensions on iPhone and iPad, compact pointer-friendly dimensions on Mac, and
regular native SwiftUI dimensions for spatial interfaces. Shared views normally need no platform
checks:

```swift
@State private var phone = LumenPhoneNumber.empty(
    country: LumenPhoneCountry(regionCode: "CO", callingCode: "+57", displayName: "Colombia")
)

LumenPhoneInput("Hospital or OB phone number", value: $phone)
```

The phone component uses localized country metadata, as-you-type formatting, and exposes E.164 only
for valid numbers. It is available on iOS, macOS, and visionOS, not watchOS or tvOS.

```swift
struct AccountActions: View {
    var body: some View {
        HStack {
            LumenButton("Save", action: save)
            LumenButton(
                "Remove account",
                intent: .secondary,
                role: .destructive,
                action: removeAccount
            )
            LumenIconButton(
                name: .sparkles,
                label: "Generate caption",
                loading: isGeneratingCaption,
                loadingAccessibilityValue: .verbatim(generatingCaptionStatus),
                action: generateCaption
            )
        }
    }
}
```

Button `role` and visual `intent` are independent. Supply `.destructive` or `.cancel` whenever the
action has that platform meaning, even when a quieter visual intent is appropriate. Keep native
SwiftUI buttons as the direct actions of `toolbar`, `alert`, and `confirmationDialog` content so
those system containers continue to own placement and presentation; apply `LumenButtonStyle` or
`LumenIconButtonStyle` when a Lumen visual recipe is appropriate there.

When `loading` is true, `LumenIconButton` keeps its accessible name and touch target, replaces the
icon with a progress indicator using the selected intent's foreground color, and disables repeat
activation. Use a styled native button when its visual content must change beyond that fixed
icon-to-progress transition.

`LumenButton` also disables activation while loading and overlays progress on its existing label.
Keep the label unchanged to preserve its width and height; changing the label text is an
application-owned layout change. Supply localized `loadingAccessibilityValue` when needed.

Use `.lumenControlDensity(.regular)` or `.lumenControlDensity(.compact)` on a view hierarchy only
when a project intentionally needs to override the platform default.

```swift
LumenSettingsRow(
    "Automatic updates",
    description: "Download updates when they become available.",
    systemName: "arrow.triangle.2.circlepath"
) {
    LumenToggle("Automatic updates", isOn: $automaticUpdates)
        .labelsHidden()
}

LumenEmptyState(
    "No saved workspaces",
    systemName: "rectangle.stack",
    description: "Create a workspace to organize the windows on this Mac."
) {
    LumenButton("Create Workspace", action: createWorkspace)
}

LumenDateField(
    "Release date",
    selection: $releaseDate,
    bounds: .from(.now),
    description: "Choose when this version becomes available."
)

LumenDateRangeField(
    "Release window",
    start: $releaseStart,
    end: $releaseEnd,
    bounds: .from(.now)
)
```

On macOS, shortcut validation remains application-owned while Lumen handles capture and presentation:

```swift
LumenShortcutRecorder("Quick switch", shortcut: $shortcut) { candidate in
    reservedShortcuts.contains(candidate) ? "That shortcut is already in use." : nil
}
```

The macOS symbol picker accepts an application-owned tint and publishes selection after updating
its binding. The popover closes after selection by default, including a repeated selection:

```swift
LumenSymbolPickerButton(
    "Workspace symbol",
    selectedName: $symbolName,
    tint: .orange,
    onSelection: { name in saveSymbol(name) }
)
```

Set `dismissOnSelection: false` to keep the popover open. Embedded `LumenSymbolPicker` accepts
`tint` and `onSelection` without owning presentation. Catalog contents, persistence, and workspace
color selection remain application-owned.

See the [native component reference](../../docs/native-components.md) for the complete API matrix,
state contracts, native image mapping, and accessibility requirements.
Use the shared [SwiftUI error-handling guide](../../docs/error-handling.md#swiftui) when integrating
`LumenErrorState`; it covers error/offline classification, layouts, safe references, retry
ownership, and SwiftUI's application-owned announcement policy.
See the [native compatibility matrix](../../docs/native-compatibility.md) for supported Apple OS,
Swift, and Xcode baselines, and use the
[native device validation matrix](../../docs/native-device-validation.md) for VoiceOver evidence.

## Appearance presets

Start with `LumenTheme(preset: .studio, scheme: .light)`. Surface and Card accept explicit `.glass` materials with accessibility fallbacks. See [appearance presets](../../docs/appearance-presets.md) for surface dimensions and text styles.

## Data visualization

Heatmaps include labeled axes, a numeric color legend, and × markers for missing measurements.
Use a diverging color scale around a meaningful midpoint for signed data. The plot and expandable
list preserve zero and use the first measurement at each coordinate. See the
[native heatmap options](../../docs/data-visualization.md#native-heatmaps) for domain and formatting APIs.

`LumenSparkline`, `LumenLineChart`, `LumenBarChart`, `LumenPieChart`, `LumenScatterChart`,
`LumenHeatmap`, `LumenRangeChart`, `LumenComboChart`, `LumenWaterfallChart`, and `LumenHistogram` use Swift Charts or a tokenized Canvas while
preserving the iOS 16 baseline. Data charts provide native mark accessibility, a factual summary,
and a readable disclosure list. See the shared
[data-visualization guide](../../docs/data-visualization.md).

Pass `labels` for localized support copy. A finite zero remains valid data. Line charts also accept
`reference: LumenChartReference(...)`; set a datum's `tone` and `toneLabel` together so an
intensity or status encoding is never communicated by color alone.

`LumenLineChart` and `LumenBarChart` accept `bare: true` inside an existing surface and an exact
plot `height` in points. The default is 220; zero, negative, or nonfinite heights fall back to 220.
Headings, descriptions, and the readable data disclosure remain outside that plot height:

```swift
LumenCard {
    LumenLineChart(
        label: "CPU history",
        series: cpuSeries,
        heading: "Recent activity",
        bare: true,
        height: 130
    )
}
```

Use `.time(Date)` for real time coordinates and `.number(Double)` for numeric coordinates. Keep
`showData` enabled unless equivalent accessible values appear nearby. `bare` and `height` are
currently options on these two Swift chart types, not shared options on every native adapter.

From the repository root, check the reviewed public API for every declared Apple platform with:

```bash
pnpm run check:swift-api-baseline
```

After an intentional API change, run `pnpm run generate:swift-api-baseline`, review the normalized
declaration diff, and move every new entry from `unclassified` into `supported`, `experimental`, or
`deprecated`. The checker also builds macOS, iOS, tvOS, visionOS, and watchOS, so platform-conditional source
cannot bypass the inventory.

`LumenWaterfallChart` draws signed changes with explicit total resets and connectors. Invalid
steps reject the complete plot so later balances cannot become misleading. `LumenHistogram`
preserves supplied bin widths and gaps; use density for unequal widths. Data disclosures retain
start, end, plotted value, and original density-bin counts. Empty and invalid inputs have separate
localized messages. Expanded data stays scrollable within the card.

```swift
LumenWaterfallChart(label: "Revenue movement", data: [
    .init(id: "opening", label: "Opening", value: 100, kind: .total),
    .init(id: "growth", label: "Growth", value: 40),
    .init(id: "costs", label: "Costs", value: -25)
])
LumenHistogram(label: "Response time", data: [
    .init(start: 0, end: 10, count: 5), .init(start: 10, end: 30, count: 10)
], frequency: .density)
```

For v4, `LumenChartLabels` adds defaulted interval labels and `formatValue`. Ordinary initializer
calls retain their defaults; stored initializer references must adopt the new signature, and
binary consumers must rebuild.

## Resources

| Guide | What you will find |
| --- | --- |
| [Native component reference](https://github.com/santi020k/lumen/blob/main/docs/native-components.md) | Reference for native component reference. |
| [Native compatibility](https://github.com/santi020k/lumen/blob/main/docs/native-compatibility.md) | Reference for native compatibility. |
| [WidgetKit package](https://github.com/santi020k/lumen/blob/main/packages/swift-widget/README.md) | Reference for widgetKit package. |
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

## Advanced native inputs

On iOS, macOS and visionOS, `LumenNumberField`, `LumenTimeField`, `LumenAutocomplete`,
`LumenPasswordField`, `LumenInputOTP` and `LumenImageComparison` provide controlled native editing
and comparison. Supply application-localized String labels and read locale from the environment.

```swift
LumenNumberField(
    "Cantidad", text: $quantityDraft, min: "0", max: "100", step: "0.1",
    invalidNumberLabel: "Ingresa un número válido",
    outOfRangeLabel: "Ingresa un número entre 0 y 100",
    incrementLabel: "Aumentar valor", decrementLabel: "Disminuir valor"
)
.environment(\.locale, Locale(identifier: "es_CO"))
```

Numbers retain raw drafts and use exact bounded decimal arithmetic. Configuration uses ASCII
strings; display uses locale-specific digits and separators. Do not convert money to Double to
consume a field. `LumenTimeField` uses `Binding<LumenTimeSelection?>`, same-day bounds and an explicit
Confirm/Cancel draft. The operating system owns clock presentation and time-format preference.

Autocomplete takes `Binding<String>` for its query, `Binding<Value?>` for selection and
`LumenAutocompleteOption<Value>` values conforming to Hashable. Applications own filtering,
cancellation and clearing stale selection as the query changes. Loading, empty, result error and
retry states are explicit, and disabling/read-only dismisses results. Keep suggestions to a small
useful set. Password visibility resets on blur and when editing is disabled; native autofill hints
use a password fallback for new passwords on macOS 13. OTP uses one native editor, preserves paste
and selection, and never submits or verifies its completion automatically. Provider suggestions
require consumer validation.

Image comparison accepts before/after view builders and a `Binding<Double>` for the visible after
fraction from zero to one. The native slider supplies accessible adjustment and localized percentage;
image content, loading and analysis remain application-owned.

See the [shared advanced contracts](../../docs/native-components.md#shared-v4-advanced-controls)
and the [native form-error recipe](../../docs/native-patterns.md#pattern-form-submission-errors).

### Actual-versus-target charts

`LumenBulletChart` compares a nullable actual `value` with a finite `target` and optional
labeled `ranges`. A strong actual bar, target marker, readable value labels, and expandable exact
data work together. Domains include zero and all measurements; invalid inputs fail closed.
Null values stay distinct from zero. See the [chart guide](../../docs/data-visualization.md#actual-values-and-targets)
for the input, localization, and domain contracts.

### Rankings and paired comparisons

Use `LollipopChart` for zero-based rankings and `DumbbellChart` for paired measurements (native
`LumenLollipopChart` and `LumenDumbbellChart`). Supply ordered comparison data with `id`, `label`,
nullable `value`, optional nullable `reference`, and optional `tone`. Both charts preserve missing
values and expose exact data. See the [shared visualization contract](../../docs/data-visualization.md#rankings-and-paired-comparisons).


### Calendar activity, funnels, and distributions

`LumenCalendarHeatmap` takes `LumenCalendarHeatmapDatum(date:value:)` and required ISO date-only
`startDate` / `endDate` strings. It uses proleptic Gregorian UTC dates, seven day rows and week
columns, with horizontal scrolling for long ranges. `weekStartsOn` accepts `0` (Sunday) or `1`
(Monday); optional `weekdayLabels` contain seven Sunday-indexed application-localized labels.
Defaults use the environment locale. `formatDate` customizes exact date and week labels.
Ranges include at most 3,660 days; invalid dates, duplicates, out-of-range measurements and
nonfinite values fail closed. Omitted days remain missing rather than becoming zero.

`LumenFunnelChart` accepts ordered `LumenFunnelDatum` stages with nonnegative finite nullable
values. Centered horizontal bars normalize to the largest measured stage, including funnels that
increase. The application owns conversion calculations and stage order.

`LumenBoxPlot` accepts `LumenBoxPlotDatum` with precomputed `min`, `q1`, `median`, `q3`, `max`
and `outliers`. Statistics must be all missing or all finite and ordered; missing statistics cannot
have outliers. All rows share one domain, including outliers. Supply `statisticLabels` using
`LumenBoxPlotLabels` to localize quartiles and other statistic labels.

```swift
LumenFunnelChart(data: [
    .init(id: "visit", label: "Visits", value: 1200),
    .init(id: "trial", label: "Trials", value: 420)
], label: "Signup stages", heading: "Signup stages")

LumenBoxPlot(data: [
    .init(id: "weekday", label: "Weekday", min: 12, q1: 28, median: 42, q3: 61, max: 82, outliers: [103])
], label: "Response time", heading: "Response time")

LumenCalendarHeatmap(data: [.init(date: "2026-09-01", value: 0)],
    label: "Daily activity", startDate: "2026-09-01", endDate: "2026-09-30")
```

All three use `LumenChartLabels` for application-localized numeric formatting, missing and invalid
states, and expandable exact data. Funnel and box rows require unique IDs and nonempty labels.
Optional increasing calendar/box domains must include every observed value; omitted domains
resolve from measurements with finite padding for constant values. No raw-sample aggregation is
performed. Native fonts, semantic chart colors and adaptive row labels preserve text accessibility.

`LumenRangeSlider` provides a controlled numeric interval with independently named endpoints,
localized value formatting, and disabled/read-only protection. See the
[native range-filter contract](../../docs/native-components.md#native-range-filters) for each
adapter's binding and step conventions.

## Multiple selection

On iOS, macOS and visionOS, `LumenMultiSelect` binds a `Set<String>` and a search query, reusing
`LumenAutocompleteOption<String>` results. The application supplies filtering, requests and
persistence. Selection applies immediately; dismissal does not revert it. Missing selected options
retain their raw value and can be removed. Disabled options cannot be changed while present.
Loading or search failure hides stale results; `errorMessage` is form validation, while
`resultsErrorMessage` and `onRetry` describe search recovery. Read-only and `.disabled(true)` states
close the sheet. Localize all action/result labels and count/removal formatters.
`LumenSearchField` also accepts `clearLabel` to localize its clear action.

Removal actions are sorted by their selected string values for deterministic presentation.
The `Set<String>` binding represents membership and does not preserve selection chronology.

```swift
LumenMultiSelect("Teams", values: $teams, query: $query, options: matchingTeams,
                 loading: searching, resultsErrorMessage: searchError, onRetry: retrySearch)
```
