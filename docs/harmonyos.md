# HarmonyOS NEXT (preview)

<!-- cspell:words openharmony -->

Lumen's React Native adapter targets HarmonyOS NEXT through
[React Native for OpenHarmony](https://gitcode.com/OpenHarmony-RN/ohos_react_native) (RNOH).
Support is a **preview**: `@santi020k/lumen-react-native` needs React Native 0.86.2 or newer, and
RNOH's 0.86 line is still a release candidate. The latest stable RNOH line, 0.82, is below the
adapter's minimum peer. A native ArkTS and ArkUI adapter is planned separately.

## Status

| Layer | State | Evidence |
| --- | --- | --- |
| JavaScript bundle | Verified | `pnpm run check:harmony-bundle` bundles the complete React Native playground for the `harmony` platform. React, React Native, React Native SVG, Safe Area Context and the date picker each resolve to one copy, and those three libraries are redirected to their RNOH ports. |
| Hermes bytecode | Verified | `pnpm run playground:harmony:bundle` compiles the release `hermes_bundle.hbc` the host loads. |
| Playground types and lint | Verified | `tsc --noEmit` and ESLint pass for `apps/playground-harmony`, including the shared playground source. |
| DevEco Studio native build | Not yet verified | Needs DevEco Studio, the HarmonyOS SDK and a Huawei developer account for signing. |
| Device rendering and accessibility | Not yet verified | Needs a HarmonyOS NEXT emulator or device. Record results in the [native device validation matrix](native-device-validation.md). |

## Versions

These are the versions the `harmony` catalog in `pnpm-workspace.yaml` pins. Upgrade them together and
rerun the checks above.

| Package | Version | Note |
| --- | --- | --- |
| `react-native` | 0.86.3 | Peer of RNOH 0.86.1 |
| `@react-native-oh/react-native-harmony` | 0.86.1 | Release candidate (`0.86-rc` tag) |
| `@react-native-oh/react-native-harmony-cli` | 0.86.1 | Provides `init-harmony` and `bundle-harmony` |
| `react-native-svg` / `@react-native-ohos/react-native-svg` | 15.15.5 / 15.14.0-beta.4 | Port is tagged for RNOH 0.84 |
| `react-native-safe-area-context` / `@react-native-ohos/react-native-safe-area-context` | 5.8.0 / 5.6.5 | Port is tagged for RNOH 0.84; only the playground uses it |
| `@react-native-community/datetimepicker` / `@react-native-ohos/datetimepicker` | 9.1.0 / 9.0.0-beta.1 | Optional; port is tagged for RNOH 0.84 |

No RNOH port is tagged for 0.86 yet. Expect the third-party ports to be the first place a native
build fails.

## Use Lumen in a HarmonyOS application

Start from a React Native 0.86.3 application, then add RNOH and Lumen:

```bash
pnpm add react-native@0.86.3 @react-native-oh/react-native-harmony@0.86.1
pnpm add -D @react-native-oh/react-native-harmony-cli@0.86.1
pnpm add @santi020k/lumen-react-native react-native-svg@15.15.5 @react-native-ohos/react-native-svg@15.14.0-beta.4
```

Date fields from `@santi020k/lumen-react-native/datetime` also need the picker and its port:

```bash
pnpm add @react-native-community/datetimepicker@9.1.0 @react-native-ohos/datetimepicker@9.0.0-beta.1
```

Generate the DevEco Studio project and the Metro configuration:

```bash
pnpm exec react-native init-harmony --bundle-name com.example.app --app-name ExampleApp
```

The generated `metro.config.js` wraps `createHarmonyMetroConfig`. It redirects `react-native` to RNOH
and each package with a `harmony.alias` field to its port, so application code and Lumen keep
importing `react-native-svg` and the date picker by their usual names. Then follow the CLI's
instructions to open `harmony/` in DevEco Studio, sign in, generate a signature, and run the `entry`
module.

## Platform behavior

RNOH reports `Platform.OS` as `harmony`. Lumen's platform branches compare against `ios`, `android`
and `web`, so HarmonyOS takes the shared path:

- Date and time fields render the picker inline instead of opening Android's modal dialog.
- Toasts use Lumen's own duration. Android's recommended accessibility timeout isn't queried.
- Error states rely on live regions instead of iOS's explicit announcement.
- Serif headings request the generic `serif` family.

## Run the playground

`apps/playground-harmony` hosts the React Native playground on HarmonyOS. It reuses
`apps/playground-react-native/src` and replaces the playground's only Expo module, `expo-status-bar`,
with React Native's status bar. See its [README](../apps/playground-harmony/README.md) for setup.

```bash
pnpm run check:harmony-bundle       # JavaScript bundle check, no HarmonyOS tooling required
pnpm run playground:harmony:bundle  # release Hermes bundle into the DevEco project
pnpm run playground:harmony         # Metro server for debug builds
```

## Graduating from preview

1. RNOH publishes a stable 0.86 or newer line, and the svg and date-picker ports publish releases
   for it.
2. A DevEco Studio build and an emulator run of the playground succeed.
3. Device rows for HarmonyOS are added to the native device validation matrix.
4. `pnpm run check:harmony-bundle` runs in CI with the React Native checks.
