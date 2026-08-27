# Developed native patterns

Lumen patterns are production-shaped compositions of public components. They cover recurring
settings, collection, status, and action layouts without replacing SwiftUI, Jetpack Compose, or
React Native application architecture.

Use a pattern when several Lumen components repeatedly appear together but the application still
owns the data, navigation, persistence, asynchronous work, and domain decisions. Promote a pattern
to a public component only after at least two maintained consumers share its semantic purpose,
state model, and accessibility behavior.

## The native boundary

Lumen can provide its own presentation for a native concept when it adds semantic value while
delegating behavior to the platform. `LumenLink`, `LumenDateField`, and
`LumenFloatingActionButton` follow this model: Lumen supplies tokens and a focused API, while the
operating system retains URL opening, date selection, focus, and Material interaction behavior.

Keep these structures application-owned:

- SwiftUI `NavigationStack`, `NavigationSplitView`, `List`, scenes, toolbars, and WidgetKit
  timelines;
- Compose navigation, `Scaffold`, lazy collections, windows, and lifecycle handling;
- React Native routers, virtualized lists, safe-area ownership, and native module integration.

A Lumen sidebar row inside a native `List` can be a healthy future component. A replacement split
view would duplicate restoration, deep links, keyboard routing, window behavior, and OS evolution.

## Pattern: complete settings section

Group settings with the platform's native form or scrolling container. Use `LumenSettingsRow` for
alignment and keep each trailing control independently focusable and named.

```swift
Form {
    Section("Updates") {
        LumenSettingsRow(
            "Automatic updates",
            description: "Download stable releases automatically.",
            systemName: "arrow.triangle.2.circlepath"
        ) {
            LumenToggle("Automatic updates", isOn: $automaticUpdates)
                .labelsHidden()
        }

        LumenPicker("Release channel", selection: $channel) {
            Text("Stable").tag(Channel.stable)
            Text("Preview").tag(Channel.preview)
        }
    }
}
```

Use `LumenFieldGroup` for validation and help text. Persistence, submission, destructive
confirmation, and Settings scene ownership stay in the application.

## Pattern: dense identity row

Compose leading identity, two-line metadata, status, and a native action without merging their
accessibility semantics.

```swift
LumenListRow {
    LumenAvatar(fallback: "LM", label: "Lumen workspace")
} content: {
    VStack(alignment: .leading, spacing: LumenSpacing.xs) {
        Text("Lumen workspace")
        Text("Edited five minutes ago").font(.caption)
    }
} trailing: {
    LumenMenu(items: workspaceActions) {
        LumenIcon(systemName: "ellipsis", label: "Workspace actions")
    }
}
```

Use the platform's native `List`, lazy collection, selection, swipe actions, context menu, and
keyboard commands around the row. Those containers own virtualization and navigation behavior.

## Pattern: asynchronous collection state

Render one clear collection state at a time:

1. Use a small set of unlabeled `LumenSkeleton` elements while the surrounding region announces
   loading once.
2. Use `LumenEmptyState` when a successful request contains no items.
3. Use `LumenBanner` for recoverable partial-data or disconnected states that coexist with content.
4. Use `LumenErrorState` when content cannot be shown, with one application-owned retry action.
5. Render rows in the platform's native lazy or virtualized collection after loading succeeds.

Do not let a presentation component start requests or decide retry policy. The application owns
cancellation, refresh, caching, and stale-data rules.
Follow the [error-handling guide](./error-handling.md) for error/offline classification, layout and
announcement choices, safe support references, and loading-safe retry examples for every native
adapter.

## Pattern: metric and status summary

Use `LumenSectionHeader` to name the region, then combine `LumenStat`, `LumenGauge`, `LumenBadge`,
and `LumenStatusBar`. Prefer adaptive platform layout rather than a fixed dashboard container.

```kotlin
Column(verticalArrangement = Arrangement.spacedBy(LumenSpacing.Md)) {
    LumenSectionHeader(title = "System health", count = "3")
    Row(horizontalArrangement = Arrangement.spacedBy(LumenSpacing.Md)) {
        LumenStat(label = "Jobs", value = "12", tone = LumenMetricTone.Accent)
        LumenGauge(label = "Completion", value = 72f, valueLabel = "72 percent")
    }
    LumenStatusBar(message = "All services available", tone = LumenMetricTone.Success)
}
```

Live values, units, safety thresholds, chart interaction, and alert policy remain product-owned.
Always express status with text or an accessible symbol as well as color.

## Pattern: adaptive actions

Use `LumenButtonGroup` for a small, related action set. Let the surrounding view choose horizontal
or vertical orientation from its actual available width, Dynamic Type size, or window class. Keep
toolbar placement, keyboard commands, and navigation actions in their native containers.

## Pattern: immersive iPhone tabs

Keep top-level navigation in SwiftUI's native `TabView`, then opt into Lumen's availability-safe
enhancements. On iOS 26 and later the system tab bar minimizes while scrolling; earlier supported
iOS releases keep their standard tab presentation.

```swift
TabView(selection: $selection) {
    FeedView()
        .tabItem { Label("Feed", systemImage: "rectangle.stack") }
        .tag(Destination.feed)

    ProfileView()
        .tabItem { Label("Profile", systemImage: "person") }
        .tag(Destination.profile)
}
.lumenTabBarMinimizeBehavior(.onScrollDown)
.lumenTabViewBottomAccessory(isEnabled: upload != nil) {
    LumenTabAccessory {
        ExpandedUploadStatus(upload: upload)
    } compact: {
        CompactUploadStatus(upload: upload)
    }
}
```

The accessory can represent a mini player, active call, upload, recording, or persistent status.
Keep each tab's navigation path, scroll restoration, re-selection behavior, badges, and domain state
in the application. Avoid adding selection haptics that duplicate system feedback.

## Pattern: scroll-responsive Android and React Native navigation

Android and React Native can use the same interaction idea without imitating SwiftUI's tab API.
Compose observes the existing nested-scroll chain, while React Native receives the scroll offset
from the application's native list. Both use a movement threshold so small direction changes do not
make destinations flicker.

```kotlin
val navigationScrollState = rememberLumenNavigationBarScrollState()

Scaffold(
    modifier = Modifier.lumenNavigationBarScrollBehavior(navigationScrollState),
    bottomBar = {
        LumenNavigationBar(
            items = destinations,
            selectedValue = destination,
            onValueChange = ::selectDestination,
            scrollState = navigationScrollState
        )
    }
) { padding ->
    LazyColumn(contentPadding = padding) { /* application content */ }
}
```

```tsx
const navigation = useLumenNavigationBarVisibility({ threshold: 16 })

<FlatList
  data={items}
  onScroll={navigation.onScroll}
  scrollEventThrottle={16}
  renderItem={renderItem}
/>
<LumenCollapsibleNavigationBar
  items={destinations}
  value={destination}
  visible={navigation.visible}
  onValueChange={setDestination}
/>
```

Keep the list, scroll position, safe-area layout, router, and destination state application-owned.
Call `show()` after a destination switch when the new screen should begin with visible navigation.
Avoid scroll-responsive navigation when destinations are the only persistent way to recover from
the current screen or when the content does not provide enough scroll travel to reveal it naturally.

Use `onReselect` for a second activation of the current destination. The application can scroll its
own list to the top, refresh, or pop that destination's nested stack. Add a dot, short text, or count
badge to the destination model; retain meaningful text for assistive technology and avoid using a
badge as the only indication of urgent or destructive state.

For compact persistent activity, add `LumenNavigationAccessory` in React Native or
`LumenNavigationBarAccessory` in Compose. Mini players, uploads, calls, and recordings fit this
surface; full forms and multi-step workflows do not. Coordinate the accessory with the same scroll
state when it should collapse with bottom navigation.

On Android, prefer `LumenAdaptiveNavigationScaffold` for a full-window primary surface. Material
chooses a bottom bar or navigation rail from the current window and posture. A coordinated
`LumenFloatingActionButton` can remain visible, hide with navigation, or follow the freed space.

## Promotion checklist

A developed pattern is ready to become a component only when it:

- appears in at least two maintained products;
- has one stable semantic purpose and state model;
- removes meaningful repeated presentation or accessibility code;
- retains native focus, navigation, collection, and lifecycle behavior;
- supports loading, disabled, error, high-contrast, large-text, and reduced-motion conditions where
  applicable;
- can be verified in a real integration example and on supported device classes.
