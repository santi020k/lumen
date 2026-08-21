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
    }
}
```

The initial native set includes Text, Surface, Button, TextField, Badge, Divider, and Spinner. The
module intentionally uses Material 3/Compose APIs and TalkBack semantics rather than translating
DOM behavior.
