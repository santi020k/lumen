# Lumen React Native Playground

<!-- cspell:words screencap simctl -->

An Expo reference app for every public component in `@santi020k/lumen-react-native`. It runs on
web, iOS, and Android with four focused destinations: Home, Examples, Components, and Settings.
Examples provides switchable loading, empty, error, and success workflows. Components combines
search, product-intent categories, and focused component detail views. Settings includes Lumen and
santi020k theme presets, system/light/dark appearance, live accessibility context, and an
English/Spanish validation example.

Install the repository dependencies once from the repository root:

```bash
corepack enable
pnpm install
```

Then start Expo:

```bash
pnpm playground:react-native
pnpm playground:react-native:web
```

Scan the Expo QR code, or press `i`, `a`, or `w` to choose iOS, Android, or web. See
[`docs/playgrounds.md`](../../docs/playgrounds.md) for prerequisites, EAS setup, APK generation, and
store distribution profiles.

## Open the published playground

The public React Native playground runs in Expo Go rather than using an App Store or Google Play
listing. Open the stable link below on a device with Expo Go installed; it always resolves to the
latest update on the `expo-go` branch:

```text
exp://u.expo.dev/669035f0-04c0-41cd-9ca6-73d99bdb7dce/branch/01a03c76-64c5-7c07-ba75-43f815735357
```

The current app targets Expo SDK 57 and therefore requires an Expo Go client that supports SDK 57.
As of August 2026, the public App Store and Google Play Expo Go client targets SDK 54. Do not present
this link as a general-public installation path until Expo Go supports SDK 57 or Lumen intentionally
maintains a separately tested SDK 54 compatibility build.

Publish a new version from an authenticated Expo session with:

```bash
pnpm --filter @santi020k/lumen-playground-react-native run publish:expo-go -- --message "Describe the update"
```

This command changes the public playground. Run the app checks and native exports before publishing.

## App branding

Expo uses the canonical Lumen playground artwork for its project icon, iOS icon, Android legacy and
adaptive icons, splash screen, and web favicon. Regenerate those PNG assets after changing the
shared SVG sources:

```bash
pnpm --filter @santi020k/lumen-playground-react-native run generate:assets
```

The adaptive and splash artwork stays transparent over the configured Lumen background. The main
1024-pixel icon stays opaque for iOS and Expo project surfaces.

## Component coverage

The gallery includes every primary public React Native component: foundations, inputs and
selection, feedback, structured content, visual treatments, controlled overlays, operating-system
sharing, pull-to-refresh, and static or collapsible bottom navigation. Composite contracts such as
`LumenAlertTitle` and `LumenAlertDescription` appear inside their parent example. Search uses the
same names as the public API matrix and keeps every example interactive.

On web, add `?component=<name>` to open a screenshot-ready focused view. Use `category=<name>` for
category discovery, `destination=home|examples|components|settings` to open an application
destination, and `state=loading|empty|error|success` to prepare the Examples state lab. For example:

```text
http://localhost:8081/?component=Alert%20dialog
http://localhost:8081/?component=Illustration
http://localhost:8081/?component=Navigation%20bar
http://localhost:8081/?destination=examples&state=error
http://localhost:8081/?destination=components&category=forms
```

The existing `embed=true`, `scheme=light|dark|system`, and `theme=lumen|santi020k` parameters remain
available for documentation previews. Embedded component captures continue to match component names
exactly and omit the application shell.

After starting `pnpm playground:react-native:web`, capture every documented component from the
repository root:

```bash
pnpm playground:react-native:capture
```

Use the gallery search before capturing a native simulator or device so one component family fills
the viewport. Native captures retain platform rendering and system sheets that Expo Web cannot
prove:

```bash
xcrun simctl io booted screenshot test-results/react-native-components/ios-illustration.png
adb exec-out screencap -p > test-results/react-native-components/android-illustration.png
```

The capture command deep-links each catalog entry, opens deterministic dialog, sheet, and menu
states, and writes PNG sources beneath `test-results/react-native-components`. Those sources are
ignored verification evidence; `pnpm run sync:native-captures` publishes optimized WebP copies and
the checked-in integrity manifest. The operating-system share sheet must still be verified on iOS
or Android because browser support is environment-dependent.
