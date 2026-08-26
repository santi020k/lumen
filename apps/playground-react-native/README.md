# Lumen React Native Playground

<!-- cspell:words screencap simctl -->

An Expo gallery for every public component in `@santi020k/lumen-react-native`. It runs on web, iOS,
and Android with search, light and dark themes, and interactive component states.

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

## Component coverage

The gallery includes every primary public React Native component: foundations, inputs and
selection, feedback, structured content, visual treatments, controlled overlays, operating-system
sharing, pull-to-refresh, and static or collapsible bottom navigation. Composite contracts such as
`LumenAlertTitle` and `LumenAlertDescription` appear inside their parent example. Search uses the
same names as the public API matrix and keeps every example interactive.

On web, add `?component=<name>` to open a screenshot-ready filtered view. For example:

```text
http://localhost:8081/?component=Alert%20dialog
http://localhost:8081/?component=Illustration
http://localhost:8081/?component=Navigation%20bar
```

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
