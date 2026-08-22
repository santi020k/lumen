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

The module is prepared for Maven Central under `com.santi020k:lumen-compose`. A maintainer can build
a signed Central Portal bundle with:

```bash
MAVEN_SIGNING_KEY="..." \
MAVEN_SIGNING_PASSWORD="..." \
LUMEN_COMPOSE_VERSION="0.1.0" \
./gradlew centralPortalBundle
```

The repository's manual **Publish Compose to Maven Central** workflow builds, tests, signs, and
uploads that bundle. It defaults to a user-managed deployment so Central validation can be reviewed
before publication. Before the first run, verify the `com.santi020k` namespace in the Central Portal
and add `MAVEN_CENTRAL_USERNAME`, `MAVEN_CENTRAL_PASSWORD`, `MAVEN_SIGNING_KEY`, and
`MAVEN_SIGNING_PASSWORD` as GitHub Actions repository secrets. Once the first release is visible on
Maven Central, applications can replace the local module dependency with
`implementation("com.santi020k:lumen-compose:<version>")`.

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

The native set includes Text, Icon, IconButton, Surface, Button, ButtonGroup, TextField, Textarea,
FieldGroup, Toggle, SettingsRow, SearchField, Checkbox, RadioGroup, SegmentedControl, Chip, Picker,
Slider, Badge, Divider, Spinner, Card, Alert, Toast, Progress, Skeleton, Disclosure, Gauge, and Avatar.
The module intentionally uses
Material 3/Compose APIs and TalkBack semantics rather than translating DOM behavior. Icons accept
app-provided `ImageVector` values, remain decorative when their content description is omitted, and
require a description inside `LumenIconButton`.

EmptyState, ListRow, Banner, Stat, SectionHeader, and StatusBar provide reusable product structure
with native Compose slots for graphics, actions, and trailing content.

See the [native component reference](../../docs/native-components.md) for local Gradle setup, the
complete API matrix, native image mapping, and accessibility requirements.
Use the [native device validation matrix](../../docs/native-device-validation.md) when verifying
TalkBack, font scaling, contrast, focus order, and reduced motion on hardware.
See the [native compatibility matrix](../../docs/native-compatibility.md) for supported Android,
JDK, Gradle, Kotlin, and Compose baselines.
