# LumenUI for SwiftUI

> **Beta:** This package is ready for testing and early production adoption. Its public API may
> evolve as it is validated in real applications; review release notes when upgrading.

`LumenUI` is Lumen's native SwiftUI package. Its foundations are generated from the same canonical
design tokens as the web, React Native, and Compose adapters.

Maintainers can prove semantic-tag resolution, clean consumer builds for every declared Apple
platform, resource availability, and license-notice presence from a disposable candidate repository
with `pnpm run check:swift-package-candidate` at the repository root. A public release still requires
rerunning the same consumer proof against the final immutable repository tag with
`pnpm run check:swift-package-release -- --version <version>`.

In Xcode, choose **File → Add Package Dependencies**, paste
`https://github.com/santi020k/lumen`, and use **Exact Version** `1.2.0` for a reproducible production
build. Choose **Up to Next Major Version** from `1.2.0` when the application intentionally accepts
compatible Lumen updates. Reserve the `main` branch for local evaluation. Add the `LumenUI` product
to your application target. The package manifest lives at the repository root, so the Git
dependency works directly; no npm package, CocoaPod, or copied source is required.

For a project managed with `Package.swift`, add the package and product explicitly:

```swift
dependencies: [
    .package(
        url: "https://github.com/santi020k/lumen",
        exact: "1.2.0"
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

Use `.package(url: "https://github.com/santi020k/lumen", from: "1.2.0")` instead when the
application's update policy accepts later compatible releases. Commit `Package.resolved` for
applications, generated Xcode projects, and CI builds, then verify its `version` is `1.2.0` and its
`revision` matches the `v1.2.0` tag before shipping. XcodeGen projects use the same policy in
`project.yml` with `version: 1.2.0` for compatible updates or `exactVersion: 1.2.0` for an exact
pin. Deterministic project generators should declare the requirement in their checked-in source
and regenerate the project instead of patching the generated `.xcodeproj`.

After Xcode resolves the package, import `LumenUI` in the SwiftUI view that owns the application
surface and apply one theme near the root:

```swift
import LumenUI

struct AppRoot: View {
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
            .lumenTheme(.dark)
    }
}
```

Applications can construct `LumenColorPalette` directly when they already own light and dark
product palettes. If a stored System/Light/Dark preference is application-owned, inject the chosen
semantic values without forcing SwiftUI's appearance:

```swift
let baseTheme = LumenTheme.light
let productPalette = baseTheme.colors.overriding(
    brand: Color("BrandAccent"),
    brandSoft: Color("BrandAccentSoft"),
    accent: Color("BrandAccent")
)
let productTheme = LumenTheme(colors: productPalette, scheme: baseTheme.scheme)

AppRoot()
    .lumenTheme(
        productTheme,
        enforceColorScheme: selectedAppearance != .system,
        applyTint: !applicationOwnsTint
    )
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

The same component APIs work in iOS and macOS targets. Lumen automatically uses touch-friendly
control dimensions on iPhone and iPad, and compact pointer-friendly dimensions on Mac. Shared views
normally need no platform checks:

```swift
@State private var phone = LumenPhoneNumber.empty(
    country: LumenPhoneCountry(regionCode: "CO", callingCode: "+57", displayName: "Colombia")
)

LumenPhoneInput("Hospital or OB phone number", value: $phone)
```

The phone component uses localized country metadata, as-you-type formatting, and exposes E.164 only
for valid numbers. It is available on iOS and macOS, not watchOS or tvOS.

```swift
struct AccountActions: View {
    var body: some View {
        HStack {
            LumenButton("Save", action: save)
            LumenIconButton(name: .settings, label: "Settings", action: openSettings)
        }
    }
}
```

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

See the [native component reference](../../docs/native-components.md) for the complete API matrix,
state contracts, native image mapping, and accessibility requirements.
Use the shared [SwiftUI error-handling guide](../../docs/error-handling.md#swiftui) when integrating
`LumenErrorState`; it covers error/offline classification, layouts, safe references, retry
ownership, and SwiftUI's application-owned announcement policy.
See the [native compatibility matrix](../../docs/native-compatibility.md) for supported Apple OS,
Swift, and Xcode baselines, and use the
[native device validation matrix](../../docs/native-device-validation.md) for VoiceOver evidence.

## Data visualization

`LumenSparkline`, `LumenLineChart`, `LumenBarChart`, `LumenPieChart`, `LumenScatterChart`,
`LumenHeatmap`, `LumenRangeChart`, and `LumenComboChart` use Swift Charts or a tokenized Canvas while
preserving the iOS 16 baseline. Data charts provide native mark accessibility, a factual summary,
and a readable disclosure list. See the shared
[data-visualization guide](../../docs/data-visualization.md).

From the repository root, check the reviewed public API for every declared Apple platform with:

```bash
pnpm run check:swift-api-baseline
```

After an intentional API change, run `pnpm run generate:swift-api-baseline`, review the normalized
declaration diff, and move every new entry from `unclassified` into `supported`, `experimental`, or
`deprecated`. The checker also builds macOS, iOS, tvOS, and watchOS, so platform-conditional source
cannot bypass the inventory.
