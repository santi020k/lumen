# Lumen UI for Jetpack Compose

> **Beta:** This package is ready for testing and early production adoption. Its public API may
> evolve as it is validated in real applications; review release notes when upgrading.

This Android library provides native Compose foundations and primitives generated from Lumen's
canonical design tokens. It follows the same semantic color roles, spacing, radii, typography, and
motion vocabulary as the web, React Native, and SwiftUI adapters.

Until a remote Maven artifact is available, include Lumen as a Git submodule in the Android project:

```bash
git submodule add https://github.com/santi020k/lumen.git Vendor/lumen
git submodule update --init --recursive
```

Connect the local module in `settings.gradle.kts`:

```kotlin
include(":lumen-compose")
project(":lumen-compose").projectDir = file("Vendor/lumen/packages/compose")
```

Then add the module to the application dependencies in `app/build.gradle.kts`:

```kotlin
dependencies {
    implementation(project(":lumen-compose"))
}
```

Sync Gradle and wrap the application content in `LumenTheme`:

```kotlin
import com.santi020k.lumen.LumenTheme
import com.santi020k.lumen.LocalLumenTheme

LumenTheme {
    LumenSurface {
        LumenText("Welcome", variant = LumenTextVariant.Title)
        LumenButton(onClick = ::continueFlow) {
            Text("Continue")
        }
        LumenIconButton(
            imageVector = Icons.Default.Search,
            contentDescription = "Search",
            onClick = ::openSearch
        )
    }
}
```

The native set includes Text, Icon, IconButton, Surface, Button, TextField, Toggle, SettingsRow,
SearchField, Badge, Divider, Spinner, Card, Alert, Progress, and Avatar. The module intentionally uses
Material 3/Compose APIs and TalkBack semantics rather than translating DOM behavior. Icons accept
app-provided `ImageVector` values, remain decorative when their content description is omitted, and
require a description inside `LumenIconButton`.

EmptyState, ListRow, Banner, Stat, SectionHeader, and StatusBar provide reusable product structure
with native Compose slots for graphics, actions, and trailing content.

See the [native component reference](../../docs/native-components.md) for local Gradle setup, the
complete API matrix, native image mapping, and accessibility requirements.
