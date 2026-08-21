# Lumen UI for Jetpack Compose

This Android library provides native Compose foundations and primitives generated from Lumen's
canonical design tokens. It follows the same semantic color roles, spacing, radii, typography, and
motion vocabulary as the web, React Native, and SwiftUI adapters.

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

The native set includes Text, Icon, IconButton, Surface, Button, TextField, Badge, Divider, Spinner,
Card, Alert, Progress, and Avatar. The module intentionally uses Material 3/Compose APIs and
TalkBack semantics rather than translating DOM behavior. Icons accept app-provided `ImageVector`
values, remain decorative when their content description is omitted, and require a description
inside `LumenIconButton`.

See the [native component reference](../../docs/native-components.md) for local Gradle setup, the
complete API matrix, native image mapping, and accessibility requirements.
