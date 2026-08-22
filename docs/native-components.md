# Native component reference

Lumen's React Native, SwiftUI, and Jetpack Compose adapters share semantic contracts while using
each platform's rendering, image, focus, and accessibility systems. This reference covers setup,
the supported component surface, platform mappings, and the checks required for a component to be
considered supported.

> **Beta:** Native component APIs are ready for testing and early production adoption, but may
> evolve as they are validated in real applications. The shared token foundation is stable. Review
> release notes when upgrading; features below the Beta support bar are labeled Experimental.

## Install and consume

### React Native

Install the package and mount one provider near the application root:

```bash
pnpm add @santi020k/lumen-react-native
```

```tsx
import { LumenProvider } from "@santi020k/lumen-react-native";

export function App() {
  return <LumenProvider scheme="system">{/* application */}</LumenProvider>;
}
```

Icons accept graphic components with `color`, `size`, and `strokeWidth` props. Lucide React Native
components satisfy that contract; install its peer requirements only when the app chooses Lucide.

### SwiftUI

In Xcode, choose **File → Add Package Dependencies**, paste
`https://github.com/santi020k/lumen`, and choose **Exact Version** `1.2.0` for a reproducible
production build. Use **Up to Next Major Version** from `1.2.0` only when the application accepts
compatible updates, and reserve `main` for local evaluation. Add the `LumenUI` product to the
application target. The repository-root `Package.swift` is the public package entry point; no
CocoaPod or npm package is involved.

Projects with their own Swift package manifest can declare the dependency directly:

```swift
dependencies: [
    .package(
        url: "https://github.com/santi020k/lumen",
        exact: "1.2.0"
    )
]
```

Use `from: "1.2.0"` instead of `exact: "1.2.0"` for a compatible-version policy. Commit
`Package.resolved` for application and CI builds and verify that its version and revision match the
intended release tag. XcodeGen and other deterministic project generators should keep the package
requirement in their checked-in configuration and regenerate project files from that source.

Then import the linked product and apply a theme near the application root:

```swift
import LumenUI

@main
struct ExampleApp: App {
    var body: some Scene {
        WindowGroup {
            AppRoot().lumenTheme(.light)
        }
    }
}
```

The package supports iOS 16, macOS 13, tvOS 16, and watchOS 9 or newer. Its component APIs are the
same on iOS and macOS; control metrics automatically use regular touch density on mobile and compact
pointer density on Mac. A shared feature view can therefore be compiled into both applications
without platform conditionals.

```swift
struct SharedProfileActions: View {
    var body: some View {
        HStack {
            LumenButton("Save", action: save)
            LumenIconButton(systemName: "gearshape", label: "Settings", action: openSettings)
        }
    }
}
```

Override the automatic choice only when the product requires it:

```swift
SharedProfileActions().lumenControlDensity(.regular)
```

Applications can initialize `LumenColorPalette` and `LumenTheme` from product-owned light and dark
palettes. Use `.lumenTheme(productTheme, enforceColorScheme: false)` when the application's stored
System/Light/Dark preference owns the preferred appearance. Apply the modifier to every independent
window, settings, menu-bar, widget, and preview scene that renders Lumen content.

### Jetpack Compose

The Android module is available from Maven Central. Add `mavenCentral()` to the application's
repositories and use the published coordinate:

```kotlin
// app/build.gradle.kts
repositories {
    mavenCentral()
}

dependencies {
    implementation("com.santi020k:lumen-compose:0.3.0")
}
```

Wrap application content in `LumenTheme`; it maps the shared palette to Material 3 while retaining
the complete Lumen token object through `LocalLumenTheme`.

Applications with an existing Material theme can pass `materialColorScheme`, `typography`, and
`shapes` to the same `LumenTheme` call. `LumenMaterialColorOverrides` preserves explicit brand,
accent, success, and warning semantics, and `ColorScheme.toLumenColorPalette(...)` exposes the
mapped Lumen values when the application needs them independently.

## Supported surface

| Contract          | React Native            | SwiftUI                 | Compose                 | Shared behavior                                                           |
| ----------------- | ----------------------- | ----------------------- | ----------------------- | ------------------------------------------------------------------------- |
| Theme             | `LumenProvider`         | `.lumenTheme`           | `LumenTheme`            | Light, dark, and semantic tokens                                          |
| Text              | `LumenText`             | `LumenText`             | `LumenText`             | Body, caption, label, and title roles                                     |
| Icon              | `LumenIcon`             | `LumenIcon`             | `LumenIcon`             | 16, 20, and 24 unit sizes; decorative by default                          |
| Icon button       | `LumenIconButton`       | `LumenIconButton`       | `LumenIconButton`       | Required label, shared intents, 44 point mobile or compact Mac target     |
| Surface           | `LumenSurface`          | `LumenSurface`          | `LumenSurface`          | Semantic surface, padding, and radius roles                               |
| Button            | `LumenButton`           | `LumenButton`           | `LumenButton`           | Primary, secondary, quiet, danger, loading, disabled                      |
| Button group      | `LumenButtonGroup`      | `LumenButtonGroup`      | `LumenButtonGroup`      | Horizontal or vertical layout for related actions                         |
| Text field        | `LumenTextField`        | `LumenTextField`        | `LumenTextField`        | Error and disabled states with native input behavior                      |
| Textarea          | `LumenTextarea`         | `LumenTextarea`         | `LumenTextarea`         | Multiline native editing with supporting and error states                 |
| Field group       | `LumenFieldGroup`       | `LumenFieldGroup`       | `LumenFieldGroup`       | Shared label, guidance, required state, and validation message            |
| Toggle            | `LumenToggle`           | `LumenToggle`           | `LumenToggle`           | Native switch behavior with visible label and disabled state              |
| Settings row      | `LumenSettingsRow`      | `LumenSettingsRow`      | `LumenSettingsRow`      | Supporting copy, optional graphic, and trailing native control            |
| Search field      | `LumenSearchField`      | `LumenSearchField`      | `LumenSearchField`      | Native search entry with labeled clear action                             |
| Checkbox          | `LumenCheckbox`         | `LumenCheckbox`         | `LumenCheckbox`         | Controlled Boolean selection with label and supporting text               |
| Radio group       | `LumenRadioGroup`       | `LumenRadioGroup`       | `LumenRadioGroup`       | Named single selection with disabled option support                       |
| Segmented control | `LumenSegmentedControl` | `LumenSegmentedControl` | `LumenSegmentedControl` | Compact single selection from a small peer set                            |
| Navigation bar    | `LumenNavigationBar`    | `LumenNavigationBar`    | `LumenNavigationBar`    | Controlled app destinations with selected and disabled states             |
| Chip              | `LumenChip`             | `LumenChip`             | `LumenChip`             | Compact display, selection, and separately labeled removal                |
| Badge             | `LumenBadge`            | `LumenBadge`            | `LumenBadge`            | Neutral, accent, success, warning, and danger tones                       |
| Divider           | `LumenDivider`          | `LumenDivider`          | `LumenDivider`          | Semantic line color and decorative semantics                              |
| Spinner           | `LumenSpinner`          | `LumenSpinner`          | `LumenSpinner`          | Brand color and accessible loading label                                  |
| Card              | `LumenCard`             | `LumenCard`             | `LumenCard`             | Neutral and semantic surfaces; optional native action                     |
| Alert             | `LumenAlert`            | `LumenAlert`            | `LumenAlert`            | Default, destructive, success, and warning variants                       |
| Alert dialog      | `LumenAlertDialog`      | `lumenAlertDialog`      | `LumenAlertDialog`      | Controlled confirmation with destructive, disabled, and loading states    |
| Toast             | `LumenToast`            | `LumenToast`            | `LumenToast`            | App-controlled transient feedback with optional action and dismissal      |
| Progress          | `LumenProgress`         | `LumenProgress`         | `LumenProgress`         | Determinate, clamped value and valid maximum                              |
| Skeleton          | `LumenSkeleton`         | `LumenSkeleton`         | `LumenSkeleton`         | Text, rectangle, or circle loading placeholder; decorative unless labeled |
| Graphic           | `LumenGraphic`          | `LumenGraphic`          | `LumenGraphic`          | Token-aware glow, grid, or orbit around app-provided artwork              |
| Backdrop          | `LumenBackdrop`         | `LumenBackdrop`         | `LumenBackdrop`         | Ambient aurora, dots, grid, or rays behind native content                 |
| Illustration      | `LumenIllustration`     | `LumenIllustration`     | `LumenIllustration`     | Built-in empty, success, error, and offline semantic scenes               |
| Disclosure        | `LumenDisclosure`       | `LumenDisclosure`       | `LumenDisclosure`       | Controlled expanded state with native trigger and content semantics       |
| Avatar            | `LumenAvatar`           | `LumenAvatar`           | `LumenAvatar`           | Native image source, fallback, label, and shared sizes                    |
| Empty state       | `LumenEmptyState`       | `LumenEmptyState`       | `LumenEmptyState`       | Title, supporting copy, optional graphic, and recovery actions            |
| List row          | `LumenListRow`          | `LumenListRow`          | `LumenListRow`          | Leading identity, flexible content, and trailing actions                  |
| Banner            | `LumenBanner`           | `LumenBanner`           | `LumenBanner`           | Semantic notice with optional actions and dismissal                       |
| Stat              | `LumenStat`             | `LumenStat`             | `LumenStat`             | Compact semantic metric with label, value, and detail                     |
| Section header    | `LumenSectionHeader`    | `LumenSectionHeader`    | `LumenSectionHeader`    | Section identity, optional count, and trailing actions                    |
| Status bar        | `LumenStatusBar`        | `LumenStatusBar`        | `LumenStatusBar`        | Compact textual status and optional trailing content                      |
| Picker            | —                       | `LumenPicker`           | `LumenPicker`           | Native single-value selection without a React Native dependency           |
| Slider            | —                       | `LumenSlider`           | `LumenSlider`           | Native continuous or stepped range input                                  |
| Gauge             | —                       | `LumenGauge`            | `LumenGauge`            | Clamped circular metric with a formatted accessible value                 |
| Sheet             | `LumenSheet`            | `lumenSheet`            | `LumenSheet`            | Controlled supplemental surface with native modal dismissal               |
| Menu              | `LumenMenu`             | `LumenMenu`             | `LumenMenu`             | Anchored actions with disabled and destructive item states                |
| Share button      | `LumenShareButton`      | `LumenShareButton`      | `LumenShareButton`      | Token-aware action backed by the operating system share surface           |

The web-only Card variants `glass` and `unstyled` are deliberately not shared. Blur, material, and
unstyled layout behavior do not have a stable cross-platform meaning. Native Card interaction is
enabled by an action or press callback instead of a visual-only `interactive` variant.

## Platform-specific components

Each native adapter also provides a small set of controls grounded in its own interaction model.
They use Lumen tokens and accessibility rules without promising artificial API parity.

| Component                   | Adapter      | Platforms    | Contract                                                               |
| --------------------------- | ------------ | ------------ | ---------------------------------------------------------------------- |
| `LumenRefreshControl`       | React Native | iOS, Android | Pull-to-refresh state with semantic native indicator colors            |
| `LumenDateField`            | SwiftUI      | iOS, macOS   | Native date/time selection with bounds and validation context          |
| `LumenShortcutRecorder`     | SwiftUI      | macOS        | Keyboard capture with cancel, clear, and application validation states |
| `LumenSymbolPicker`         | SwiftUI      | macOS        | Searchable categorized SF Symbols selection                            |
| `LumenFloatingActionButton` | Compose      | Android      | Material floating action with semantic intent and native sizing        |

Picker, slider, and gauge are shared by SwiftUI and Compose because both platforms provide stable,
dependency-free native controls. React Native applications can pair Lumen tokens with their chosen
control library rather than making the shared package impose one dependency.

`LumenNavigationBar` covers a small set of peer app destinations while leaving the selected screen,
navigation history, deep links, and restoration in application code. Continue using native routers,
`NavigationSplitView`, navigation stacks, popovers, and window scenes for hierarchical
navigation, focus restoration, keyboard routing, and window behavior.

### Shared destination navigation

Each adapter uses the same controlled-selection contract with native icon types. Keep destination
labels short, supply a meaningful label for the group, and let the application render the selected
screen through its existing router or navigation stack.

```tsx
<LumenNavigationBar
  accessibilityLabel="Primary navigation"
  items={destinations}
  value={destination}
  onValueChange={setDestination}
/>
```

```swift
LumenNavigationBar(
    "Primary navigation",
    selection: $destination,
    items: [
        LumenNavigationItem("Home", value: .home, systemName: "house"),
        LumenNavigationItem("Search", value: .search, systemName: "magnifyingglass")
    ]
)
```

```kotlin
LumenNavigationBar(
    items = destinations,
    selectedValue = destination,
    onValueChange = ::setDestination
)
```

### Confirmation, sheets, menus, and sharing

Overlay state and application data remain controlled by the host. Lumen supplies consistent action
roles, spacing, and accessibility while each adapter uses its native modal and share presentation.
SwiftUI exposes alert and sheet presentation as view modifiers so focus restoration remains attached
to the presenting view.

```swift
LumenButton("Delete report") { showConfirmation = true }
    .lumenAlertDialog(
        isPresented: $showConfirmation,
        title: "Delete report?",
        confirmLabel: "Delete",
        confirmRole: .destructive,
        onConfirm: deleteReport
    )

LumenShareButton("Share report", item: reportText)
```

```kotlin
LumenSheet(
    visible = showEditor,
    onDismiss = { showEditor = false },
    title = "Edit report"
) {
    ReportEditor()
}
```

```tsx
<LumenAlertDialog
  visible={showConfirmation}
  title="Delete report?"
  confirmLabel="Delete"
  destructive
  onConfirm={deleteReport}
  onDismiss={() => setShowConfirmation(false)}
/>
```

### Platform-native actions and input

React Native scroll containers retain ownership of scrolling while Lumen supplies the refresh
indicator. The application owns refreshing state and completion:

```tsx
<ScrollView
  refreshControl={(
    <LumenRefreshControl
      accessibilityLabel="Refresh projects"
      refreshing={refreshing}
      onRefresh={refreshProjects}
    />
  )}
>
  {content}
</ScrollView>
```

Apple applications can constrain native date or date-and-time selection and provide supporting or
validation text without replacing `DatePicker` behavior:

```swift
LumenDateField(
    "Release date",
    selection: $releaseDate,
    components: .dateAndTime,
    bounds: .from(.now),
    description: "Choose when this version becomes available."
)
```

Compose applications can use a Material-native floating action while keeping Lumen semantic intent:

```kotlin
LumenFloatingActionButton(
    imageVector = Icons.Default.Add,
    contentDescription = "Create project",
    onClick = ::createProject
)
```

### Shared settings and native selection

`LumenSettingsRow` keeps explanatory copy aligned while the contained control retains independent
focus and accessibility semantics on every native adapter. SwiftUI and Compose additionally
provide picker and slider wrappers where stable dependency-free APIs exist:

```swift
LumenSettingsRow(
    "Automatic updates",
    description: "Download updates when they become available.",
    systemName: "arrow.triangle.2.circlepath"
) {
    LumenToggle("Automatic updates", isOn: $automaticUpdates)
        .labelsHidden()
}

LumenPicker("Profile", selection: $profile, style: .segmented) {
    Text("Quiet").tag(Profile.quiet)
    Text("Balanced").tag(Profile.balanced)
    Text("Performance").tag(Profile.performance)
}

LumenSlider(
    "Minimum speed",
    value: $minimumSpeed,
    in: 1_000...5_000,
    step: 100,
    valueLabel: "\(Int(minimumSpeed)) RPM"
)
```

### Shared empty, row, and feedback states

Empty states, list rows, banners, stats, section headers, and status bars share one semantic contract
across React Native, SwiftUI, and Compose. Their graphic and action slots remain native so each app
can supply Lucide, SF Symbols, or `ImageVector` content without introducing an icon dependency.

`LumenSkeleton` covers loading placeholders without announcing every visual block. Leave it
unlabeled when the surrounding region already communicates loading, or provide one concise label to
expose an indeterminate progress state. `LumenDisclosure` keeps expanded state in application code;
collapsed content is removed from the accessibility tree on every adapter.

```swift
LumenEmptyState(
    "No saved workspaces",
    systemName: "rectangle.stack",
    description: "Create a workspace to organize the windows on this Mac."
) {
    LumenButton("Create Workspace", action: createWorkspace)
}

LumenListRow {
    LumenIcon(systemName: "macwindow")
} content: {
    VStack(alignment: .leading) {
        Text("Documentation")
        Text("Safari · Project workspace").font(.caption)
    }
} trailing: {
    LumenButton("Focus", intent: .secondary, size: .sm, action: focusWindow)
}

LumenBanner(
    "Workspace assigned automatically",
    description: "Moved Safari to Documentation based on recent choices.",
    variant: .accent,
    onDismiss: dismissAssignment
) {
    LumenButton("Undo", intent: .quiet, size: .sm, action: undoAssignment)
}
```

`LumenBanner` is inline presentation, not a live announcement. Applications decide whether a newly
inserted message needs a platform accessibility announcement.

### Metrics and dense desktop structure

```swift
LazyVGrid(columns: [GridItem(.adaptive(minimum: 160))]) {
    LumenStat("Open windows", value: "12", systemName: "macwindow", tone: .accent)
    LumenStat("Saved scenes", value: "4", systemName: "rectangle.stack", tone: .brand)
}

LumenGauge(
    "Thermal pressure",
    value: 48,
    valueLabel: "Fair",
    systemName: "thermometer.medium",
    tone: .warning
)
```

Use `LumenProgress` for task completion and `LumenGauge` for a current bounded metric. `LumenStat`
must report a useful product value rather than decorative dashboard filler.

### macOS input utilities

The shortcut recorder requires a modifier key, consumes Escape as cancel, and accepts an optional
application validator for conflicts or reserved shortcuts:

```swift
LumenShortcutRecorder("Quick switch", shortcut: $shortcut) { candidate in
    reservedShortcuts.contains(candidate) ? "That shortcut is already in use." : nil
}
```

`LumenSymbolPicker` accepts an application-provided `[LumenSymbolOption]` or the built-in stable
common set. `LumenSymbolPickerButton` presents the picker in a compact native popover:

```swift
LumenSymbolPickerButton("Workspace symbol", selectedName: $symbolName)
```

## Shared component contracts

### Card

Cards use semantic surface tones, the large radius, and extra-large padding. Every native adapter
provides `default`, `muted`, `accent`, `success`, `warning`, and `destructive` with restrained
semantic backgrounds and borders.
Supplying an action gives the card native button semantics and pressed feedback. Do not place an
interactive card inside another button or place unrelated controls inside a card-level action.

### Alert

Alert variants map to the same semantic roles as the web reference:

| Variant       | Foreground and border role | Background treatment |
| ------------- | -------------------------- | -------------------- |
| `default`     | `ink` and `line`           | `surface`            |
| `destructive` | `danger`                   | 8% danger tint       |
| `success`     | `success`                  | 8% success tint      |
| `warning`     | `warning`                  | 10% warning tint     |

An Alert is a styled semantic container, not automatically a live announcement. Applications must
use the platform's announcement or live-region mechanism when an alert appears asynchronously and
requires immediate assistive-technology attention.

### Progress

Progress is determinate. Values are clamped into `0...max`; a non-finite value becomes zero and a
non-positive or non-finite maximum becomes 100. Every adapter exposes native progress semantics.
Provide a label when surrounding text does not already name the operation.

### Avatar

Avatar image inputs remain native: React Native uses `ImageSourcePropType`, SwiftUI uses `Image`,
and Compose uses `Painter`. The shared sizes are 32, 40, and 56 platform units. A missing image uses
the supplied fallback, normally initials. Supply a label when the avatar conveys identity; omit it
when the same name is adjacent and the avatar is decorative.

## Shared-tier examples

React Native exposes explicit Alert text roles because text color does not inherit through a native
View:

```tsx
<LumenCard variant="muted">
  <LumenAvatar fallback="SM" label="Santiago Molina" />
  <LumenAlert variant="success">
    <LumenAlertTitle>Profile synced</LumenAlertTitle>
    <LumenAlertDescription>
      Your changes are available offline.
    </LumenAlertDescription>
  </LumenAlert>
  <LumenProgress value={72} label="Profile completion" />
</LumenCard>
```

SwiftUI and Compose propagate their foreground or content color through the native environment:

```swift
LumenCard(variant: .muted) {
    VStack(alignment: .leading, spacing: LumenSpacing.lg) {
        LumenAvatar(fallback: "SM", label: "Santiago Molina")
        LumenAlert(variant: .success) {
            Text("Profile synced")
        }
        LumenProgress(value: 72, label: "Profile completion")
    }
}
```

```kotlin
LumenCard(variant = LumenCardVariant.Muted) {
    Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Lg)) {
        LumenAvatar(fallback = "SM", label = "Santiago Molina")
        LumenAlert(variant = LumenAlertVariant.Success) {
            Text("Profile synced")
        }
        LumenProgress(value = 72f, label = "Profile completion")
    }
}
```

## Accessibility requirements

- Icon-only controls require a concise action label; visible tooltips do not replace it.
- Disabled and loading controls expose native state and cannot trigger their action.
- Interactive cards expose button semantics and must have an understandable accessible name from
  their content or an explicit label.
- Alerts do not interrupt screen readers merely because they are visually styled as alerts.
- Toasts use native live feedback semantics while their action and dismissal remain independently labeled.
- Progress exposes minimum, maximum, and current values after normalization.
- Skeletons are decorative unless explicitly labeled as an indeterminate loading state.
- Disclosure triggers expose their current expanded or collapsed state, and hidden content is not
  focusable.
- Avatar fallback text is hidden from accessibility when the avatar itself is decorative.
- Dynamic Type, TalkBack, VoiceOver, native focus, and reduced-motion settings take precedence over
  attempts to reproduce browser behavior.

## Verification and contribution

After changing tokens, run `pnpm run generate:platform-tokens` and review every generated adapter.
For component changes, run:

```bash
pnpm --filter @santi020k/lumen-react-native run build
pnpm --filter @santi020k/lumen-react-native run typecheck
pnpm --filter @santi020k/lumen-react-native run test
pnpm --filter @santi020k/lumen-react-native run lint
swift test
(cd packages/compose && ./gradlew test lint)
(cd packages/compose && ./gradlew assembleDebugAndroidTest)
pnpm run validate
```

A native component is supported only when its public API is documented, semantic tokens replace
ad hoc styling, invalid inputs are normalized, accessibility behavior is explicit, and tests cover
the shared state or measurement contract on every adapter.

Use the [native device validation matrix](native-device-validation.md) for VoiceOver, TalkBack,
keyboard, text scaling, contrast, and reduced-motion verification on representative hardware.
