# Migrating from Lumen 2 to Lumen 3

Lumen 3 is a coordinated release across web and native adapters. Its intentional source break is
Swift's expanded `LumenIconName` enum: 70 new cases relative to `v2.1.0`. Existing icon cases,
raw values, and component signatures remain available. The [approved v3 contract](../registry/lumen-3-contract.json)
is the complete list of new cases and reviewed diagnostics.

This guide covers v2 → v3. A v1 application must first apply the
[v1 → v2 contract changes](migrating-to-lumen.md#preparing-for-version-2). The command
`lumen migrate v2` handles that earlier transition; it does not migrate v2 → v3.

## 1. Record a working baseline and update dependencies

Commit the application's current manifest, lockfile, and passing build before updating. Check the
installed versions of every direct Lumen dependency, including framework adapters, core, tokens,
icons, templates, React Hook Form integration, CLI, or MCP when used. Update the packages you
already use together according to the target release manifest; do not add unused adapters.

For a reproducible historical `3.0.0` baseline, choose your adapter:

```bash
# Astro application
pnpm add @santi020k/lumen-astro@3.0.0
# React application
pnpm add @santi020k/lumen-react@3.0.0
# Web Components application
pnpm add @santi020k/lumen-elements@3.0.0
# React Native application
pnpm add @santi020k/lumen-react-native@3.0.0
```

These are alternatives, not a command sequence for every project. Use the application's existing
package manager and commit the resulting lockfile. For a later v3 patch, use the package versions
recorded by that release's manifest rather than assuming every adapter has the same patch number.
Check adapter peer dependencies before changing React, Astro, Expo, or React Native; a Lumen major
update alone is not a reason to upgrade the whole application toolchain.

For Swift Package Manager, change the existing dependency requirement:

```swift
.package(url: "https://github.com/santi020k/lumen", exact: "3.0.0")
```

In Xcode, update the package's version rule and resolve it. Commit `Package.resolved` for an
application, and verify the resolved version and revision against `v3.0.0`. Keep the `LumenUI`
product dependency; regenerate projects from their checked-in generator configuration when used.
Widget targets using `LumenWidgetUI` follow the same repository pin.

For Compose, update the artifact already in use:

```kotlin
implementation("com.santi020k:lumen-compose:3.0.0")
// Wear OS consumers use the separate artifact:
implementation("com.santi020k:lumen-compose-wear:3.0.0")
```

Do not add the phone artifact to a Wear-only target. Resolve dependencies and rebuild the actual
application, including its own platform and dependency constraints.

## 2. Migrate exhaustive Swift icon switches

Search application and shared-library sources for `LumenIconName` and switches over icon values.
A switch that handled every v2 case without a fallback no longer handles all v3 cases. Ordinary
calls such as `LumenIcon(name: .search)` do not require a rename.

Choose a deliberate policy:

- If every icon needs a specific behavior, add the 70 cases from the approved contract explicitly.
- If unknown icons can safely use a generic behavior, use a `default` branch. For example, a
  product can mark only its recognized destructive-action icons and treat the remainder as neutral.
- If using `@unknown default`, still handle all currently known cases. Swift can warn about newly
  known cases even with that branch; resolve the compiler diagnostics rather than suppressing them.

This example uses a generic fallback without requiring every catalog addition to be enumerated:

```swift
import LumenUI

func isSearchIcon(_ icon: LumenIconName) -> Bool {
    switch icon {
    case .search:
        return true
    default:
        return false
    }
}
```

Do not edit Lumen's generated enum in the consumer or duplicate its catalog. Use the public enum
and update the application's behavior. Rebuild every Apple target, including widgets and shared
frameworks that reference icons. See the [Swift package guide](../packages/swift/README.md).

## 3. Review behavior without unnecessary rewrites

No web, React Native, or Compose component rename is required solely for this major transition.
Keep the v2 integration contracts:

| Surface | Keep in v3 |
| --- | --- |
| Astro runtime | Default import from `@santi020k/lumen-astro/runtime`, mounted once |
| Web styles | Matching adapter `styles.css` loaded once; preserve the Tailwind layer order if used |
| Toasts | `ToastViewport` and `<lumen-toast-viewport>` |
| Input / NativeSelect | `visualSize` in Astro; `visual-size` in Elements; native `size` stays numeric |
| React Native dates | Imports from `@santi020k/lumen-react-native/datetime` with its optional picker peer when used |
| Elements setup | Register `defineLumenElements` once |

V3 also includes additive tree-shakeable icon entrypoints, opt-in responsive Table record layouts,
and native-sheet refinements. They are opportunities to evaluate, not prerequisites to upgrade.
Review supporting-text and warning-badge contrast, sheet keyboard/safe-area behavior, and existing
CSS patches against the actual consumer. Consult the target adapter's changelog for differences
from your installed v2 minor version.

## 4. Verify the upgrade and keep a rollback path

1. Run the consumer's lint, strict typecheck, tests, and production build with resolved v3 packages.
2. Compile every native application target. Confirm no exhaustive-switch warnings remain and no
   generated project or resolved dependency still pins v2.
3. Verify real routes at phone and desktop widths, light/dark themes, keyboard focus, labels,
   warning/supporting-text contrast, and interactive sheets. Native builds should include the
   application's keyboard, safe-area, large-text, and screen-reader paths on supported devices.
4. Commit the dependency and source migration together after checks pass. Library unit tests or
   simulator builds alone do not qualify the application's physical-device behavior.

Lumen performs no persisted application-data migration. To roll back, restore the previous source,
manifests and lock files, reinstall v2 dependencies, and rebuild web and native targets. Do not pair
this UI update with an unrelated data migration that would prevent a straightforward rollback.

When the v3 application passes, continue with [v3 → v4](migrating-v3-to-v4.md) if evaluating the
v4 candidate. For initial adoption, return to [Migrating to Lumen](migrating-to-lumen.md).
