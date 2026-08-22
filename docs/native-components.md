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
import { LumenProvider } from '@santi020k/lumen-react-native'

export function App() {
  return <LumenProvider scheme="system">{/* application */}</LumenProvider>
}
```

Icons accept graphic components with `color`, `size`, and `strokeWidth` props. Lucide React Native
components satisfy that contract; install its peer requirements only when the app chooses Lucide.

### SwiftUI

In Xcode, choose **File → Add Package Dependencies**, paste
`https://github.com/santi020k/lumen`, and choose **Branch** with `main` as the dependency rule. Add
the `LumenUI` product to the application target. The repository-root `Package.swift` is the public
package entry point; no CocoaPod or npm package is involved.

Projects with their own Swift package manifest can declare the dependency directly:

```swift
dependencies: [
    .package(
        url: "https://github.com/santi020k/lumen",
        branch: "main"
    )
]
```

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

### Jetpack Compose

The Android module publishes as `com.santi020k:lumen-compose`. Until a remote Maven repository is
configured for a release, add the Lumen repository as a submodule inside the Android project:

```bash
git submodule add https://github.com/santi020k/lumen.git Vendor/lumen
git submodule update --init --recursive
```

Then include the local module:

```kotlin
// settings.gradle.kts
include(":lumen-compose")
project(":lumen-compose").projectDir = file("Vendor/lumen/packages/compose")
```

```kotlin
// app/build.gradle.kts
dependencies {
    implementation(project(":lumen-compose"))
}
```

Wrap application content in `LumenTheme`; it maps the shared palette to Material 3 while retaining
the complete Lumen token object through `LocalLumenTheme`.

## Supported surface

| Contract | React Native | SwiftUI | Compose | Shared behavior |
| --- | --- | --- | --- | --- |
| Theme | `LumenProvider` | `.lumenTheme` | `LumenTheme` | Light, dark, and semantic tokens |
| Text | `LumenText` | `LumenText` | `LumenText` | Body, caption, label, and title roles |
| Icon | `LumenIcon` | `LumenIcon` | `LumenIcon` | 16, 20, and 24 unit sizes; decorative by default |
| Icon button | `LumenIconButton` | `LumenIconButton` | `LumenIconButton` | Required label, shared intents, 44 point mobile or compact Mac target |
| Surface | `LumenSurface` | `LumenSurface` | `LumenSurface` | Semantic surface, padding, and radius roles |
| Button | `LumenButton` | `LumenButton` | `LumenButton` | Primary, secondary, quiet, danger, loading, disabled |
| Text field | `LumenTextField` | `LumenTextField` | `LumenTextField` | Error and disabled states with native input behavior |
| Toggle | `LumenToggle` | `LumenToggle` | `LumenToggle` | Native switch behavior with visible label and disabled state |
| Settings row | `LumenSettingsRow` | `LumenSettingsRow` | `LumenSettingsRow` | Supporting copy, optional graphic, and trailing native control |
| Search field | `LumenSearchField` | `LumenSearchField` | `LumenSearchField` | Native search entry with labeled clear action |
| Badge | `LumenBadge` | `LumenBadge` | `LumenBadge` | Neutral, accent, success, warning, and danger tones |
| Divider | `LumenDivider` | `LumenDivider` | `LumenDivider` | Semantic line color and decorative semantics |
| Spinner | `LumenSpinner` | `LumenSpinner` | `LumenSpinner` | Brand color and accessible loading label |
| Card | `LumenCard` | `LumenCard` | `LumenCard` | Neutral and semantic surfaces; optional native action |
| Alert | `LumenAlert` | `LumenAlert` | `LumenAlert` | Default, destructive, success, and warning variants |
| Progress | `LumenProgress` | `LumenProgress` | `LumenProgress` | Determinate, clamped value and valid maximum |
| Avatar | `LumenAvatar` | `LumenAvatar` | `LumenAvatar` | Native image source, fallback, label, and shared sizes |
| Empty state | `LumenEmptyState` | `LumenEmptyState` | `LumenEmptyState` | Title, supporting copy, optional graphic, and recovery actions |
| List row | `LumenListRow` | `LumenListRow` | `LumenListRow` | Leading identity, flexible content, and trailing actions |
| Banner | `LumenBanner` | `LumenBanner` | `LumenBanner` | Semantic notice with optional actions and dismissal |
| Stat | `LumenStat` | `LumenStat` | `LumenStat` | Compact semantic metric with label, value, and detail |
| Section header | `LumenSectionHeader` | `LumenSectionHeader` | `LumenSectionHeader` | Section identity, optional count, and trailing actions |
| Status bar | `LumenStatusBar` | `LumenStatusBar` | `LumenStatusBar` | Compact textual status and optional trailing content |

The web-only Card variants `glass` and `unstyled` are deliberately not shared. Blur, material, and
unstyled layout behavior do not have a stable cross-platform meaning. Native Card interaction is
enabled by an action or press callback instead of a visual-only `interactive` variant.

## Apple SwiftUI components

The SwiftUI package also provides components grounded in repeated patterns from Lumen-owned iOS and
macOS applications. They use the same theme, density, spacing, radius, and accessibility contracts
as the shared native tier without forcing platform-specific Apple behavior onto React Native or
Compose.

| Component | Platforms | Contract |
| --- | --- | --- |
| `LumenPicker` | iOS, macOS | Automatic, menu, or segmented native picker presentation |
| `LumenSlider` | iOS, macOS | Continuous or stepped range input with a visible value label |
| `LumenGauge` | iOS, macOS | Clamped circular metric with a formatted accessible value |
| `LumenShortcutRecorder` | macOS | Keyboard capture with cancel, clear, and application validation states |
| `LumenSymbolPicker` | macOS | Searchable categorized SF Symbols selection |

Picker, slider, and gauge stay Apple-specific because React Native does not provide dependency-free
core equivalents and each native platform has materially different selection and visualization
conventions. Applications can pair Lumen tokens with their chosen platform control library rather
than making the shared package impose one dependency.

These components are intentionally smaller than application structure. Continue using native
`NavigationSplitView`, `List`, `Form`, `Toolbar`, sheets, popovers, and window scenes so SwiftUI owns
navigation, focus restoration, keyboard routing, and window behavior.

### Shared settings and Apple selection

`LumenSettingsRow` keeps explanatory copy aligned while the contained control retains independent
focus and accessibility semantics on every native adapter. SwiftUI additionally provides native
picker and slider wrappers where those controls have stable dependency-free APIs:

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

| Variant | Foreground and border role | Background treatment |
| --- | --- | --- |
| `default` | `ink` and `line` | `surface` |
| `destructive` | `danger` | 8% danger tint |
| `success` | `success` | 8% success tint |
| `warning` | `warning` | 10% warning tint |

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
    <LumenAlertDescription>Your changes are available offline.</LumenAlertDescription>
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
- Progress exposes minimum, maximum, and current values after normalization.
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
pnpm run validate
```

A native component is supported only when its public API is documented, semantic tokens replace
ad hoc styling, invalid inputs are normalized, accessibility behavior is explicit, and tests cover
the shared state or measurement contract on every adapter.
