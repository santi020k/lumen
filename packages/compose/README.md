<p align="center">
  <a href="https://lumen.santi020k.com">
    <img src="https://raw.githubusercontent.com/santi020k/lumen/main/apps/docs/public/logo.svg" alt="Lumen UI" width="233" height="60">
  </a>
</p>

<h1 align="center">Lumen UI · Jetpack Compose</h1>

<p align="center">Android-native components · Semantic themes · Shared foundations</p>

<p align="center">
  <a href="https://github.com/santi020k/lumen/tree/main/packages/compose"><img src="https://img.shields.io/badge/platform-Jetpack%20Compose-0369a0?style=flat-square" alt="Jetpack Compose package"></a>
  <a href="https://github.com/santi020k/lumen/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-13967e?style=flat-square" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://lumen.santi020k.com/docs/android">Documentation</a>
  ·
  <a href="https://github.com/santi020k/lumen/tree/main/packages/compose">Source</a>
  ·
  <a href="https://github.com/santi020k/lumen/issues">Issues</a>
</p>

**Package:** `Lumen UI for Jetpack Compose`

**On this page:** [Complete gallery and screenshots](#complete-gallery-and-screenshots) · [Data visualization](#data-visualization) · [Resources](#resources)

---

<!-- cspell:words screencap -->

> **Lumen 4 candidate:** This branch prepares the next major adapter contract. See the
> [migration guide](../../docs/migrating-to-lumen.md) before upgrading. Local checks do not replace
> publication, physical-device accessibility, or consumer-soak qualification.

This Android library provides native Compose foundations and primitives generated from Lumen's
canonical design tokens. It follows the same semantic color roles, spacing, radii, typography, and
motion vocabulary as the web, React Native, and SwiftUI adapters.

Add Maven Central to the application's repositories, then add Lumen to `app/build.gradle.kts`:

```kotlin
repositories {
    mavenCentral()
}

dependencies {
    implementation("com.santi020k:lumen-compose:4.0.0")
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
FieldGroup, Toggle, SettingsRow, SearchField, DateField, DateRangeField, TimeField, Autocomplete,
NumberField, PullToRefresh, PhoneInput, Checkbox, RadioGroup,
SegmentedControl, Tabs, Chip, Picker, Slider, Badge, Divider, Spinner, Card, Alert, Toast, Progress,
Skeleton, Graphic, Backdrop,
Illustration, Image, Disclosure, Gauge, and Avatar.
`LumenAlertDialog`, `LumenSheet`, `LumenMenu`, and `LumenShareButton` add Material-native controlled
presentation and Android share-sheet integration while application state remains host-owned.
Sheets scroll their content by default, respond to keyboard insets, and keep ordinary actions
outside the scrolling body. Large text or short windows use a full-content scrolling fallback.
Set `scrollable = false` for application-owned lazy collections and `dismissible = false` while
work must prevent back, scrim, or swipe dismissal. The application retains explicit visibility
ownership. `LumenFieldGroup.requiredLabel` and `LumenTabs.panelAccessibilityLabel` accept localized
spoken descriptions; tab panels otherwise use the selected tab's visible label.
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

## Appearance presets

Use `LumenTheme(preset = LumenThemePreset.Studio)` or customize `LumenThemeValues.preset(...)`. See [appearance presets](../../docs/appearance-presets.md) for dimensions, precedence and the solid material fallback.

## Data visualization

`LumenSparkline`, `LumenLineChart`, `LumenBarChart`, `LumenPieChart`, `LumenScatterChart`,
`LumenHeatmap`, `LumenRangeChart`, and `LumenComboChart` use Compose Canvas with generated chart
tokens and TalkBack semantics. Data charts include a factual summary and a readable fallback list.
Use `LumenChartX.Time(epochMillis)` for time coordinates: line charts sort time samples and position
them by elapsed time, so a long gap remains visibly longer than a short interval. Numeric line
coordinates also use their numeric distance; categories retain their declared order.

Formatting belongs to `LumenChartLabels`, not to stringified coordinates:

```kotlin
val chartLabels = LumenChartLabels(
    chartData = "CPU samples",
    formatX = { x ->
        when (x) {
            is LumenChartX.Time -> java.text.DateFormat
                .getTimeInstance(java.text.DateFormat.SHORT)
                .format(java.util.Date(x.epochMillis))
            else -> x.label
        }
    },
    formatValue = { value -> "${value.toInt()}%" }
)

LumenLineChart(
    series = cpuSeries,
    label = "CPU history",
    labels = chartLabels,
    reference = LumenChartReference(label = "Target", value = 70.0)
)
```

`formatX` and `formatValue` format readable data; `formatValue` also formats the reference value.
For localized summary sentences, provide `formatSummary` or an explicit chart `summary` as well.
Keep `showData` enabled unless equivalent accessible values appear nearby. Swift's `bare` and
`height` options are not Compose parameters.

See the shared [data-visualization guide](../../docs/data-visualization.md).
See the [native compatibility matrix](../../docs/native-compatibility.md) for supported Android,
JDK, Gradle, Kotlin, and Compose baselines.

Wear OS applications should use the sibling
[`lumen-compose-wear`](./wear) artifact (`com.santi020k:lumen-compose-wear:4.0.0`). It provides a
deliberately small round-screen tier without
forcing phone applications to acquire wearable contracts or requiring consumers to migrate their
selected Wear Material version.

## Resources

| Guide | What you will find |
| --- | --- |
| [Native component reference](https://github.com/santi020k/lumen/blob/main/docs/native-components.md) | Reference for native component reference. |
| [Native compatibility](https://github.com/santi020k/lumen/blob/main/docs/native-compatibility.md) | Reference for native compatibility. |
| [Wear OS package](https://github.com/santi020k/lumen/blob/main/packages/compose/wear/README.md) | Reference for wear OS package. |
| [Contributing](https://github.com/santi020k/lumen/blob/main/CONTRIBUTING.md) | Setup, checks, and contribution workflow. |
| [Release history](https://github.com/santi020k/lumen/releases) | Published releases and version notes. |

Part of [Lumen UI](https://lumen.santi020k.com), created by [Santiago Molina](https://santi020k.com).
Licensed under [MIT](https://github.com/santi020k/lumen/blob/main/LICENSE); third-party artwork retains its own notices.

### Phone presentation in v4

`LumenPhoneInput` uses bundled flag artwork and a continuous control frame, and accepts `readOnly`
in addition to `enabled`. Read-only fields also lock country selection. `LumenCountryFlag` and
`LumenPhoneNumberView` expose the same artwork and normalized read-only phone presentation.
Country names and calling codes remain the accessible selector label. The flag source and license
are documented in [flags/README.md](../../flags/README.md); no external flag request is made.

## Advanced form and refresh examples

```kotlin
LumenTimeField(
    label = "Meeting time",
    value = meetingTime,
    onValueChange = { meetingTime = it },
    minTime = LumenTimeSelection(8, 30),
    maxTime = LumenTimeSelection(17, 0)
)

LumenAutocomplete(
    label = "Project",
    query = query,
    onQueryChange = { query = it; selectedProject = null },
    options = matchingProjects,
    value = selectedProject,
    onValueChange = { selectedProject = it },
    loading = searching,
    resultsErrorMessage = searchError,
    onRetry = ::retrySearch
)

LumenNumberField(
    label = "Quantity",
    value = quantityDraft,
    onValueChange = { quantityDraft = it },
    min = java.math.BigDecimal.ZERO,
    max = java.math.BigDecimal.TEN,
    step = java.math.BigDecimal("0.5")
)

LumenPullToRefresh(isRefreshing = refreshing, onRefresh = ::refreshProjects) {
    LazyColumn { /* application-owned rows */ }
}
```

Time values are local wall-clock values, and number drafts remain ungrouped localized text.
Applications own search results, selected values, refresh work, units, and submission rules.
Translate every visible label and validation message through the public string parameters.
See [advanced control contracts](../../docs/native-components.md#compose-v4-advanced-controls).

### Passwords, codes, contextual help, and image comparison

```kotlin
LumenPasswordField("Password", password, onValueChange = { password = it })
LumenInputOTP("Verification code", code, onValueChange = { code = it }, length = 6)
LumenTooltip("Save this project") {
    LumenIconButton(LumenIconName.Bookmark, "Save", onClick = ::saveProject, size = LumenControlSize.Lg)
}
LumenImageComparison(
    "Compare edits", beforePainter, afterPainter, position,
    onValueChange = { position = it }
)
```

Password visibility is temporary, resets on focus loss or disabled/read-only state, and is never
saved. `newPassword` selects the native new-password autofill hint. `onSubmit` handles the IME Done
action; the application owns authentication and credential lifecycle.

OTP uses one native input with the SMS code autofill hint, preserving paste, selection, and deletion.
`length` is 1–12, and the controlled value contains ASCII digits. Input converts localized digits
and removes spaces/hyphens; invalid or excess input is rejected without truncation. `onComplete`
reports a newly completed edit; it does not verify or submit. `masked` is optional. Supply translated
labels, descriptions, and errors. Autofill suggestions require a configured Android provider.

Tooltip wraps an independently labeled anchor. Material handles pointer and long-press interactions;
pass state from `rememberLumenTooltipState(isPersistent = true)` when the application needs explicit
show/dismiss controls. Its `show()` is a suspend function, `dismiss()` hides it, and `isVisible` reports
the native state. Consumers do not need a Material experimental API opt-in. Disabled
state dismisses the tooltip and leaves the anchor in place.

Image comparison accepts native `Painter` inputs, preserving application ownership of loading,
caching, image errors, and content rights. Its controlled value is the visible after fraction (0–1);
nonfinite values fall back to one half. Aspect ratios outside 0.1–10 fall back to 16:9. The native
slider exposes localized percentages and supports keyboard/accessibility adjustment. `enabled =
false` retains the images and blocks changes.

## V4 product controls

```kotlin
val appBarBehavior = rememberLumenTopAppBarScrollBehavior(LumenTopAppBarScrollMode.EnterAlways)
Scaffold(
    modifier = Modifier.nestedScroll(appBarBehavior.nestedScrollConnection),
    topBar = {
        LumenTopAppBar("Projects", scrollBehavior = appBarBehavior,
            navigationIcon = { LumenIconButton(LumenIconName.ArrowLeft, "Back", onClick = ::goBack) })
    }
) { padding ->
    LazyColumn(Modifier.padding(padding)) { /* application-owned rows */ }
}

LumenSwipeActions(
    startAction = LumenSwipeAction("Favorite", ::favorite),
    endAction = LumenSwipeAction("Delete", ::requestDeleteConfirmation, destructive = true),
    enabled = !saving
) { LumenText("Quarterly report") }

LumenMultiSelect(
    label = "Teams", options = matchingTeams, values = selectedTeams,
    onValuesChange = { selectedTeams = it }, query = query, onQueryChange = { query = it },
    loading = searching, resultsErrorMessage = searchError, onRetry = ::retrySearch
)

LumenRangeSlider(
    label = "Capacity", value = capacity, onValueChange = { capacity = it },
    valueRange = 0f..100f, steps = 9, startLabel = "Minimum", endLabel = "Maximum",
    formatValue = { "${it.toInt()}%" }
)

var selectedKey by rememberSaveable { mutableStateOf<String?>(null) }
LumenAdaptiveListDetailScaffold(
    selectedKey = selectedKey, onBack = { selectedKey = null },
    listLabel = "Projects", detailLabel = "Project details",
    listPane = { ProjectList(onSelect = { selectedKey = it }) },
    emptyDetail = { LumenEmptyState("Choose a project") }
) { key, detailOnly ->
    BackHandler(enabled = detailOnly) { selectedKey = null }
    ProjectDetails(key)
}
```

Import `Modifier.nestedScroll` from Compose UI, `Scaffold` from Material 3, and `BackHandler`
from the application's Activity Compose dependency. No Material experimental opt-in is required
by these Lumen APIs. App bar sizes are Small, Medium, and Large. Scroll modes are Pinned,
EnterAlways, and ExitUntilCollapsed; attach the connection above the screen's scrollable content.

Swipe gestures follow logical start/end in RTL. Visible buttons and named accessibility actions
provide alternatives. Gestures reset before callbacks and are not saved across recreation.
Applications own confirmation, undo and mutations. Use stable record keys in lazy lists.

The adaptive list/detail scaffold follows window size and separating hinges. At font scales of
2 or larger it shows one pane, preserving usable text width. Keep selection and drafts in
application-owned saved state, and use the detail slot’s `detailOnly` value for system Back handling.

Multi-select edits apply immediately, including when the dialog is dismissed. Search results,
selection, loading and retry are controlled by the host. Missing selected options use their raw
value as a chip label; retain selected options when friendly labels are required. Read-only and
disabled states close the dialog and block changes. Localize every string and both count/removal
formatters. Range sliders normalize invalid endpoints for display, require finite increasing bounds,
and allow 0–10,000 steps. Each thumb has its own localized label and formatted value.

Adaptive list/detail is a full-window layout using the stable Material Adaptive layout dependency
1.3.0 for window and hinge handling. It adds no routing or data owner. Preserve selection and pane
state in the host; wire system back through the supplied `detailOnly` flag. The full-window Android
List/detail example demonstrates the integration, while component gallery examples are bounded
previews. See [complete contracts](../../docs/native-components.md#compose-v4-product-controls).
