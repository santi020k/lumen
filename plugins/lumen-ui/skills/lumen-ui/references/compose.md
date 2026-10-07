# Jetpack Compose Setup

Until a remote Maven release is available, include `packages/compose` from a Lumen checkout or Git
submodule and add `implementation(project(":lumen-compose"))` to the app module. Wrap content in
the native theme:

```kotlin
import com.santi020k.lumen.LumenTheme

LumenTheme {
    LumenSurface {
        LumenText("Welcome", variant = LumenTextVariant.Title)
        LumenButton(onClick = ::continueFlow) {
            Text("Continue")
        }
    }
}
```

Preserve Compose state, navigation, focus, Material 3 conventions, TalkBack semantics, and native
`ImageVector` icons. Do not translate web markup or CSS APIs into Compose.
