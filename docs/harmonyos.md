# HarmonyOS NEXT (preview)

<!-- cspell:words openharmony -->

Lumen's React Native adapter targets HarmonyOS NEXT through
[React Native for OpenHarmony](https://gitcode.com/OpenHarmony-RN/ohos_react_native) (RNOH).
Support is a **preview**: `@santi020k/lumen-react-native` needs React Native 0.86.2 or newer, and
RNOH's 0.86 line is still a release candidate. The latest stable RNOH line, 0.82, is below the
adapter's minimum peer. A native ArkTS and ArkUI adapter has started as a
[six-component pilot](#native-arkui-adapter-pilot).

## Status

| Layer | State | Evidence |
| --- | --- | --- |
| JavaScript bundle | Verified in CI | `pnpm run check:harmony-bundle` bundles the complete React Native playground for the `harmony` platform, and the React Native job in `.github/workflows/ci.yml` runs it on every pull request that changes the adapter, either playground or the workspace catalog. React, React Native, React Native SVG, Safe Area Context and the date picker each resolve to one copy, and those three libraries are redirected to their RNOH ports. |
| Hermes bytecode | Verified | `pnpm run playground:harmony:bundle` compiles the release `hermes_bundle.hbc` the host loads. |
| Playground types and lint | Verified | `tsc --noEmit` and ESLint pass for `apps/playground-harmony`, including the shared playground source. |
| DevEco Studio native build | Not yet verified | Needs DevEco Studio, the HarmonyOS SDK and a Huawei developer account for signing. |
| Device rendering and accessibility | Not yet verified | Needs a HarmonyOS NEXT emulator or device. The React Native on HarmonyOS row of the [native device validation matrix](native-device-validation.md) is pending; record results there and in `registry/native-device-evidence.json`. |

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

## Native ArkUI adapter (pilot)

[`packages/arkui`](../packages/arkui/README.md) is a HarmonyOS library module written in ArkTS. It
doesn't use React Native. The pilot covers `LumenTheme`, `LumenText`, `LumenSurface`,
`LumenButton`, `LumenTextField`, and `LumenCard`, plus every foundation token group.

| Layer | State | Evidence |
| --- | --- | --- |
| Tokens | Generated and verified | `pnpm run check:platform-tokens` keeps `Tokens.generated.ts` in step with `tokens/lumen.tokens.json`. |
| Theme values and style resolvers | Verified | `pnpm --filter @santi020k/lumen-arkui run test`, `typecheck`, and `lint`. Colors, sizes, and error state are decided in these `.ts` files. |
| Registry and MCP catalog | Verified | `pnpm run check:native-contracts` requires each pilot symbol to be an exported struct. The MCP catalog lists the pilot as the `harmonyos` platform. |
| ArkUI components | Not yet verified | The `.ets` sources follow the API 12 documentation but haven't been compiled with DevEco Studio or run on a device. |

The package isn't published to ohpm, and its API can change. `registry/native-components.json`
marks the adapter `"maturity": "pilot"`, which lets it cover part of the catalog. The pilot
graduates when:

1. A DevEco Studio build of the module and a device or emulator run succeed.
2. An ArkUI row with a recorded pass is added to the native device validation matrix.
3. The package is published to ohpm through a GitHub release workflow.
4. Coverage reaches the universal primitives: Icon, IconButton, Badge, Divider, and Spinner.

## Graduating from preview

Two criteria are met:

- `pnpm run check:harmony-bundle` runs in CI with the React Native checks.
- The native device validation matrix has a React Native on HarmonyOS row. Its minimum is HarmonyOS
  NEXT 5.0 (API 12), the playground's `compatibleSdkVersion`.

Three remain:

1. RNOH publishes a stable 0.86 or newer line, and the svg and date-picker ports publish releases
   for it.
2. A DevEco Studio build and an emulator run of the playground succeed.
3. A HarmonyOS NEXT device pass is recorded in the matrix's pending row.
