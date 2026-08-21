# LumenUI for SwiftUI

`LumenUI` is Lumen's native SwiftUI package. Its foundations are generated from the same canonical
design tokens as the web, React Native, and Compose adapters.

Add `https://github.com/santi020k/lumen` through Swift Package Manager and select the `LumenUI`
product. The package manifest lives at the repository root so the Git dependency works directly.

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

The native set includes Text, Icon, IconButton, Surface, Button, TextField, Toggle, SettingsRow,
Picker, Slider, SearchField, Badge, Divider, Spinner, Card, Alert, Banner, Progress, EmptyState,
ListRow, Stat, Gauge, SectionHeader, StatusBar, and Avatar. macOS additionally includes a keyboard
ShortcutRecorder and searchable SF Symbols picker.
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
```

On macOS, shortcut validation remains application-owned while Lumen handles capture and presentation:

```swift
LumenShortcutRecorder("Quick switch", shortcut: $shortcut) { candidate in
    reservedShortcuts.contains(candidate) ? "That shortcut is already in use." : nil
}
```

See the [native component reference](../../docs/native-components.md) for the complete API matrix,
state contracts, native image mapping, and accessibility requirements.
