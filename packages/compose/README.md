# Lumen UI for Jetpack Compose

<!-- cspell:words screencap -->

> **Supported for Lumen 2:** This package uses the frozen version 2 contract. The current artifact
> remains a release candidate until publication, physical-device, and consumer-soak gates complete.

This Android library provides native Compose foundations and primitives generated from Lumen's
canonical design tokens. It follows the same semantic color roles, spacing, radii, typography, and
motion vocabulary as the web, React Native, and SwiftUI adapters.

Add Maven Central to the application's repositories, then add Lumen to `app/build.gradle.kts`:

```kotlin
repositories {
    mavenCentral()
}

dependencies {
    implementation("com.santi020k:lumen-compose:2.1.0")
}
```

The version in `packages/compose/gradle.properties` is canonical. `pnpm sync:compose-version`
updates every public installation example, and `pnpm check:compose-version` prevents release or
documentation checks from passing with stale coordinates.

The reviewed binary API baselines live in `api/lumen-compose.api` and `wear/api/wear.api`. Run the
local release gate for both artifacts before opening a change:

```bash
./gradlew test lint apiCheck assembleDebugAndroidTest verifyMavenPublication
```

`assembleDebugAndroidTest` compiles the phone and Wear accessibility suites without claiming device
evidence. Run `./gradlew connectedDebugAndroidTest` only with suitable Android and Wear OS targets
connected; record physical-device results through the repository's native validation process.

Run `./gradlew apiDump` only after reviewing an intentional public API change and updating its
documentation, tests, classification, and migration notes. The root tasks include the separate Wear
artifact automatically.

CI also publishes both candidate artifacts to the build-local Maven staging repository and builds
the phone and Wear playground APKs from those coordinates. The phone consumer verifies that its
runtime graph does not include `lumen-compose-wear`.

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
import com.santi020k.lumen.LumenIconName
import com.santi020k.lumen.LocalLumenTheme

LumenTheme {
    LumenSurface {
        LumenText("Welcome", variant = LumenTextVariant.Title)
        LumenButton(onClick = ::continueFlow) {
            Text("Continue")
        }
        LumenIconButton(
            name = LumenIconName.Search,
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
FieldGroup, Toggle, SettingsRow, SearchField, DateField, DateRangeField, PhoneInput, Checkbox, RadioGroup,
SegmentedControl, Tabs, Chip, Picker, Slider, Badge, Divider, Spinner, Card, Alert, Toast, Progress,
Skeleton, Graphic, Backdrop,
Illustration, Image, Disclosure, Gauge, and Avatar.
`LumenAlertDialog`, `LumenSheet`, `LumenMenu`, and `LumenShareButton` add Material-native controlled
presentation and Android share-sheet integration while application state remains host-owned.
`LumenNavigationBar` provides Material-native destination selection while the application retains
ownership of its navigation controller, back stack, deep links, and selected screen.
Pass a remembered `LumenNavigationBarScrollState` to the bar and attach
`lumenNavigationBarScrollBehavior` above a lazy or scrollable child to hide the bar after deliberate
forward scrolling and reveal it on reverse scrolling. Navigation items support accessible badges
and `onReselect` for application-owned scroll-to-top or nested-stack behavior.
`LumenNavigationBarAccessory` adds compact status or actions above bottom navigation, while
`LumenAdaptiveNavigationScaffold` uses Material's window and posture information to switch between
a bottom bar and navigation rail. The Android-specific tier also includes
`LumenFloatingActionButton`, with Material-native geometry, semantic intents, and optional hide or
follow-navigation behavior.

`LumenPhoneInput` is supported and uses Google libphonenumber metadata to provide a searchable,
localized country picker, calling codes, as-you-type formatting, validation, and normalized E.164
output. Country flags supplement the visible country name and calling code; they are never the only
country identifier.
The module intentionally uses
Material 3/Compose APIs and TalkBack semantics rather than translating DOM behavior. `LumenIconName`
provides all canonical Lucide interface icons and namespaced Font Awesome Free brands used by web,
React Native, and SwiftUI; for example, `LumenIconName.Search` and
`LumenIconName.BrandGithub`. Icons also continue to accept app-provided `ImageVector` values for
Material or product-specific escape hatches. They remain decorative when their content description
is omitted and require a description inside `LumenIconButton`. See `THIRD_PARTY_NOTICES.md` for
artwork licenses, attribution, and the brand-trademark boundary.

```kotlin
LumenFloatingActionButton(
    imageVector = Icons.Default.Add,
    contentDescription = "Create project",
    onClick = ::createProject
)
```

```kotlin
val navigationScrollState = rememberLumenNavigationBarScrollState()

Scaffold(
    modifier = Modifier.lumenNavigationBarScrollBehavior(navigationScrollState),
    floatingActionButton = {
        LumenFloatingActionButton(
            imageVector = Icons.Default.Add,
            contentDescription = "Create project",
            onClick = ::createProject,
            scrollState = navigationScrollState,
            navigationBehavior = LumenFloatingActionButtonNavigationBehavior.HideWithNavigation
        )
    },
    bottomBar = {
        Column {
            LumenNavigationBarAccessory(scrollState = navigationScrollState) {
                LumenText("Uploading 3 files", variant = LumenTextVariant.Label)
            }
            LumenNavigationBar(
                items = destinations,
                selectedValue = destination,
                onValueChange = ::setDestination,
                onReselect = ::scrollDestinationToTop,
                scrollState = navigationScrollState
            )
        }
    }
) { contentPadding ->
    LazyColumn(contentPadding = contentPadding) { /* application content */ }
}
```

For full-window phone, tablet, foldable, split-screen, and desktop-window layouts:

```kotlin
LumenAdaptiveNavigationScaffold(
    items = destinations,
    selectedValue = destination,
    onValueChange = ::setDestination,
    onReselect = ::scrollDestinationToTop
) {
    DestinationContent(destination)
}
```

EmptyState, ErrorState, ListRow, Banner, Stat, SectionHeader, and StatusBar provide reusable product structure
with native Compose slots for graphics, actions, and trailing content.
`LumenCard` accepts shared `padding` and `radius` roles while preserving its extra-large/large
defaults. `LumenStatusBar` uses a distinct decorative icon for every tone and accepts `iconName`
when a product needs a more specific symbol, so visual status is not conveyed by color alone.

## Complete gallery and screenshots

`apps/playground-android` is the executable reference for every public Compose component. It covers
controlled success, error, disabled, loading, destructive, overlay, sharing, navigation, and empty
states rather than rendering a static style sheet. The same project contains the separate Wear OS
consumer so phone applications can verify that they do not acquire wearable dependencies.

After installing the debug application on an API 37 phone emulator, filter directly to a component
state and capture it with:

```bash
adb shell am start -W \
  -n com.santi020k.lumen.playground.compose/.MainActivity \
  --es component '"Alert dialog"'
adb exec-out screencap -p > alert-dialog.png
```

Use `apps/playground-android/scripts/capture-component-screenshots.sh` to capture every public phone
or Wear component on the currently connected target. The generated PNGs live beneath the
playground's ignored `build/screenshots` directory and are verification evidence, not package
assets.

See the [native component reference](../../docs/native-components.md) for installation, the complete
API matrix, native image mapping, and accessibility requirements.
Use the shared [Compose error-handling guide](../../docs/error-handling.md#jetpack-compose) when
integrating `LumenErrorState`; it covers error/offline classification, layouts, announcements, safe
references, and loading-safe retries.
Use the [native device validation matrix](../../docs/native-device-validation.md) when verifying
TalkBack, font scaling, contrast, focus order, and reduced motion on hardware.

## Data visualization

`LumenSparkline`, `LumenLineChart`, `LumenBarChart`, `LumenPieChart`, `LumenScatterChart`,
`LumenHeatmap`, `LumenRangeChart`, and `LumenComboChart` use Compose Canvas with generated chart
tokens and TalkBack semantics. Data charts include a factual summary and a readable fallback list.
See the shared [data-visualization guide](../../docs/data-visualization.md).
See the [native compatibility matrix](../../docs/native-compatibility.md) for supported Android,
JDK, Gradle, Kotlin, and Compose baselines.

Wear OS applications should use the sibling
[`lumen-compose-wear`](./wear) artifact (`com.santi020k:lumen-compose-wear:2.1.0`). It provides a
deliberately small round-screen tier without
forcing phone applications to acquire wearable contracts or requiring consumers to migrate their
selected Wear Material version.
