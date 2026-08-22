# Lumen UI for Jetpack Compose

> **Beta:** This package is ready for testing and early production adoption. Its public API may
> evolve as it is validated in real applications; review release notes when upgrading.

This Android library provides native Compose foundations and primitives generated from Lumen's
canonical design tokens. It follows the same semantic color roles, spacing, radii, typography, and
motion vocabulary as the web, React Native, and SwiftUI adapters.

Add Maven Central to the application's repositories, then add Lumen to `app/build.gradle.kts`:

```kotlin
repositories {
    mavenCentral()
}

dependencies {
    implementation("com.santi020k:lumen-compose:0.3.0")
}
```

The version in `packages/compose/gradle.properties` is canonical. `pnpm sync:compose-version`
updates every public installation example, and `pnpm check:compose-version` prevents release or
documentation checks from passing with stale coordinates.

A maintainer can build a signed Central Portal bundle with:

```bash
MAVEN_SIGNING_KEY="..." \
MAVEN_SIGNING_PASSWORD="..." \
./gradlew centralPortalBundle
```

Pushing a `compose-v<version>` tag builds, tests, signs, and automatically publishes the version
declared in `gradle.properties`. The workflow rejects a tag whose version does not match that file.
It requires `MAVEN_CENTRAL_USERNAME`, `MAVEN_CENTRAL_PASSWORD`, `MAVEN_SIGNING_KEY`, and
`MAVEN_SIGNING_PASSWORD` as GitHub Actions repository secrets. A manual workflow run remains
available for recovery or a user-managed Central deployment.

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

If the application already owns a Material 3 theme, pass its values through the single Lumen
provider instead of nesting another `MaterialTheme` or overriding `LocalLumenTheme` manually:

```kotlin
LumenTheme(
    darkTheme = useDarkTheme,
    materialColorScheme = productColorScheme,
    materialColorOverrides = LumenMaterialColorOverrides(
        brand = productBrand,
        accent = productAccent,
        success = productSuccess,
        warning = productWarning
    ),
    typography = ProductTypography,
    shapes = ProductShapes
) {
    AppContent()
}
```

The Material mapping supplies canvas, surface, text, line, brand, accent, and danger roles. The
explicit overrides preserve product semantics that Material does not model directly or that must
remain distinct from its primary and secondary colors. Applications with complete Lumen palettes
can pass `LumenThemeValues` instead.

The native set includes Text, Icon, IconButton, Surface, Button, ButtonGroup, TextField, Textarea,
FieldGroup, Toggle, SettingsRow, SearchField, Checkbox, RadioGroup, SegmentedControl, Chip, Picker,
Slider, Badge, Divider, Spinner, Card, Alert, Toast, Progress, Skeleton, Graphic, Backdrop,
Illustration, Disclosure, Gauge, and Avatar.
`LumenAlertDialog`, `LumenSheet`, `LumenMenu`, and `LumenShareButton` add Material-native controlled
presentation and Android share-sheet integration while application state remains host-owned.
`LumenNavigationBar` provides Material-native destination selection while the application retains
ownership of its navigation controller, back stack, deep links, and selected screen.
The Android-specific tier includes `LumenFloatingActionButton`, with Material-native geometry and
Lumen brand, accent, or danger intents.
The module intentionally uses
Material 3/Compose APIs and TalkBack semantics rather than translating DOM behavior. Icons accept
app-provided `ImageVector` values, remain decorative when their content description is omitted, and
require a description inside `LumenIconButton`.

```kotlin
LumenFloatingActionButton(
    imageVector = Icons.Default.Add,
    contentDescription = "Create project",
    onClick = ::createProject
)
```

EmptyState, ListRow, Banner, Stat, SectionHeader, and StatusBar provide reusable product structure
with native Compose slots for graphics, actions, and trailing content.

See the [native component reference](../../docs/native-components.md) for installation, the complete
API matrix, native image mapping, and accessibility requirements.
Use the [native device validation matrix](../../docs/native-device-validation.md) when verifying
TalkBack, font scaling, contrast, focus order, and reduced motion on hardware.
See the [native compatibility matrix](../../docs/native-compatibility.md) for supported Android,
JDK, Gradle, Kotlin, and Compose baselines.
