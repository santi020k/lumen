# @santi020k/lumen-react-native

> **Beta:** This package is ready for testing and early production adoption. Its public API may
> evolve as it is validated in real applications; review release notes when upgrading.

React Native foundations and primitives for Lumen UI. The package exposes canonical light and dark
themes together with native Text, Icon, IconButton, Surface, Button, ButtonGroup, TextField,
Textarea, FieldGroup, Badge, Chip, Divider, Spinner, Card, Alert, Toast, Progress, Avatar, Toggle,
SettingsRow, SearchField, Checkbox, RadioGroup, SegmentedControl, Skeleton, Graphic, Backdrop,
Illustration, and Disclosure implementations.
The structured tier also includes EmptyState, ListRow, Banner, Stat, SectionHeader, StatusBar, and a
controlled NavigationBar for common product layouts without giving up native composition. `LumenRefreshControl` adds a
React Native-specific pull-to-refresh indicator using the active semantic theme.
`useLumenNavigationBarVisibility` and `LumenCollapsibleNavigationBar` add an optional scroll-
responsive treatment for native lists without introducing an animation or navigation dependency.
`LumenAlertDialog`, `LumenSheet`, `LumenMenu`, and `LumenShareButton` provide controlled native
presentation and operating-system sharing without introducing a separate interaction dependency.

Install the package and its SVG peer in an existing Expo or React Native application:

```bash
pnpm add @santi020k/lumen-react-native react-native-svg
# or: npm install @santi020k/lumen-react-native react-native-svg
```

React 19.2 and React Native 0.86.2 or newer are application-provided peer dependencies. Mount one
`LumenProvider` near the application root; no stylesheet or web runtime is required:

```ts
import {
  LumenButton,
  LumenIconButton,
  LumenProvider,
  LumenSurface,
  LumenText
} from '@santi020k/lumen-react-native'

export function App() {
  return (
    <LumenProvider scheme="system">
      <LumenSurface>
        <LumenText variant="title">Welcome</LumenText>
        <LumenButton onPress={() => {}}>Continue</LumenButton>
        <LumenIconButton name="search" label="Search" onPress={() => {}} />
      </LumenSurface>
    </LumenProvider>
  )
}
```

Start the application with its normal Expo or React Native command:

```bash
npx expo start
# or: npx react-native start
```

Use `LumenNavigationBar` for a small set of peer app destinations. The application still owns the
router, navigation history, and selected screen. Items support dot, text, and capped count badges;
`onReselect` handles app-owned scroll-to-top, refresh, or nested-stack behavior:

```tsx
<LumenNavigationBar
  items={destinations}
  value={destination}
  onValueChange={setDestination}
  onReselect={scrollDestinationToTop}
/>
```

For a scroll-responsive destination bar, pass the controller to any native vertical scroll
container and render the collapsible wrapper alongside it:

```tsx
const navigation = useLumenNavigationBarVisibility()

<FlatList
  data={items}
  onScroll={navigation.onScroll}
  scrollEventThrottle={16}
  renderItem={renderItem}
/>
<LumenCollapsibleNavigationBar
  accessory={<LumenText variant="label">Uploading 3 files</LumenText>}
  items={destinations}
  value={destination}
  visible={navigation.visible}
  onValueChange={setDestination}
  onReselect={scrollDestinationToTop}
/>
```

The bar hides only after the configured movement threshold, reappears after reverse travel, and is
always revealed when the list returns to the top. The controller also exposes `show()` and `hide()`
for application events such as destination changes or completing a refresh.

The package intentionally uses native numeric dimensions and hexadecimal colors instead of CSS
values. Components use native accessibility roles, states, touch targets, and refs without depending
on the DOM or the Lumen web runtime. `LumenIcon` and `LumenIconButton` accept every canonical Lucide
name, such as `search`, `settings`, and `circle-alert`, plus namespaced Font Awesome Free brands such
as `brand:github`. These render the same Lumen-managed geometry as the SwiftUI, Compose, and web
adapters. The exported `lumenIconNames` array contains the complete 2,350-entry native catalog.
Applications can still pass any graphic component with `color`, `size`, and `strokeWidth` props
through `icon`; Lucide React Native components work directly. Standalone icons are decorative unless
given a label, while every `LumenIconButton` requires an accessible label. See
`THIRD_PARTY_NOTICES.md` for the artwork licenses and brand attribution.

Attach the refresh control to a native scroll container without replacing its scrolling behavior:

```tsx
<ScrollView
  refreshControl={
    <LumenRefreshControl
      accessibilityLabel="Refresh projects"
      refreshing={refreshing}
      onRefresh={refreshProjects}
    />
  }
>
  {content}
</ScrollView>
```

See the [native component reference](../../docs/native-components.md) for the complete API matrix,
state contracts, image-source mapping, and accessibility requirements.
See the [native compatibility matrix](../../docs/native-compatibility.md) for React and React Native
baselines, and use the [native device validation matrix](../../docs/native-device-validation.md) for
VoiceOver and TalkBack evidence.
