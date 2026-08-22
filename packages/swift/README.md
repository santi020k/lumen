# LumenUI for SwiftUI

> **Beta:** This package is ready for testing and early production adoption. Its public API may
> evolve as it is validated in real applications; review release notes when upgrading.

`LumenUI` is Lumen's native SwiftUI package. Its foundations are generated from the same canonical
design tokens as the web, React Native, and Compose adapters.

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
                systemName: "magnifyingglass",
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
AppRoot()
    .lumenTheme(productTheme, enforceColorScheme: selectedAppearance != .system)
```

Apply the modifier to every independent scene that presents Lumen content, including macOS window,
settings, menu-bar, widget, and preview roots. With `enforceColorScheme: false`, system appearance
changes remain application-owned while Lumen components read the supplied palette.

The native set includes Text, Icon, IconButton, Surface, Button, ButtonGroup, TextField, Textarea,
FieldGroup, Toggle, SettingsRow, Checkbox, RadioGroup, SegmentedControl, Chip, Picker, Slider, DateField,
SearchField, Badge, Divider, Spinner, Card, Alert, Toast, Banner, Progress, Skeleton, Graphic,
Backdrop, Illustration, Disclosure, EmptyState,
ListRow, Stat, Gauge, SectionHeader, StatusBar, and Avatar. macOS additionally includes a keyboard
ShortcutRecorder and searchable SF Symbols picker.
Native presentation is available through `.lumenAlertDialog`, `.lumenSheet`, `LumenMenu`, and
`LumenShareButton`; the application continues to own presentation state and shared content.
`LumenNavigationBar` selects among a small set of peer destinations while the application retains
ownership of its `NavigationStack`, `NavigationSplitView`, deep links, and restoration state.
Components preserve Dynamic Type, SwiftUI environment behavior, and native accessibility instead
of reproducing DOM behavior. Icons use SF Symbols so rendering follows Apple platform conventions;
standalone icons are decorative unless labeled, and icon-only buttons require a label.

The same component APIs work in iOS and macOS targets. Lumen automatically uses touch-friendly
control dimensions on iPhone and iPad, and compact pointer-friendly dimensions on Mac. Shared views
normally need no platform checks:

```swift
struct AccountActions: View {
    var body: some View {
        HStack {
            LumenButton("Save", action: save)
            LumenIconButton(systemName: "gearshape", label: "Settings", action: openSettings)
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
```

On macOS, shortcut validation remains application-owned while Lumen handles capture and presentation:

```swift
LumenShortcutRecorder("Quick switch", shortcut: $shortcut) { candidate in
    reservedShortcuts.contains(candidate) ? "That shortcut is already in use." : nil
}
```

See the [native component reference](../../docs/native-components.md) for the complete API matrix,
state contracts, native image mapping, and accessibility requirements.
See the [native compatibility matrix](../../docs/native-compatibility.md) for supported Apple OS,
Swift, and Xcode baselines, and use the
[native device validation matrix](../../docs/native-device-validation.md) for VoiceOver evidence.
