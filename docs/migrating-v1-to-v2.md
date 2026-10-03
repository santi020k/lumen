# Migrating from Lumen 1 to Lumen 2

Lumen 2 removes deprecated web aliases, separates React Native date controls from the root import,
and expands public Swift enums. The [approved v2 contract](../registry/lumen-2-contract.json)
records the breaking changes. This guide covers v1 → v2; continue with
[v2 → v3](migrating-v2-to-v3.md) and then [v3 → v4](migrating-v3-to-v4.md) for later majors.

## 1. Record a baseline and choose the target release

Commit a working application with its current manifests, lock files, and passing checks. Inventory
all direct Lumen dependencies and update the packages already used together. Keep the application's
existing package manager and respect each adapter's peer dependencies.

For a reproducible historical `2.0.0` baseline, choose the adapter your application uses:

```bash
# Choose one; also update existing companion Lumen dependencies.
pnpm add @santi020k/lumen-astro@2.0.0
pnpm add @santi020k/lumen-react@2.0.0
pnpm add @santi020k/lumen-elements@2.0.0
pnpm add @santi020k/lumen-react-native@2.0.0
```

These commands are alternatives. Do not add adapters you do not use. For a later v2 release,
consult its release manifest and adapter changelog rather than assuming identical patch numbers.
Keep source and dependency changes together in the final migration commit.

For an existing Swift Package Manager dependency, use the matching version rule:

```swift
.package(url: "https://github.com/santi020k/lumen", exact: "2.0.0")
```

Resolve the package in Xcode, keep the `LumenUI` product, and commit the application's
`Package.resolved`. For Compose, update the existing artifact to the target release:

```kotlin
implementation("com.santi020k:lumen-compose:2.0.0")
```

Compile every native target. The source migrator below does not edit Swift or Kotlin sources,
package manifests, lock files, or native dependency pins.

## 2. Preview and apply the source migration

Use the Lumen CLI supplied by `@santi020k/lumen` with v2 migration support. From a consumer where
that CLI is installed, preview the source directory:

```bash
pnpm exec lumen migrate v2 --cwd ./src --dry-run
```

Review both proposed changes and manual-review findings. Choose a directory containing all relevant
sources, or run separately for each application and shared library in a workspace. After recording
that recoverable baseline, apply the reviewed changes:

```bash
pnpm exec lumen migrate v2 --cwd ./src --apply
```

Previewing is the default; `--apply` writes files. The transform is idempotent and preserves local
import aliases. It leaves dynamic or ambiguous usage for manual review, including conflicting size
props, commented imports, and React Native imports that need merging with an existing date subpath
import. Resolve every finding and inspect the diff; a successful command alone does not prove that
all consumer contracts have been migrated.

## 3. Review the web contracts

| V1 contract | V2 replacement |
| --- | --- |
| Named `UIPrimitives` from the Astro root | Default import from `@santi020k/lumen-astro/runtime` |
| Visual `size="sm"`, `"default"`, or `"lg"` on Astro Input / NativeSelect | `visualSize` |
| The same visual aliases on Elements | `visual-size` |
| `Sonner` / `SonnerProps` in Astro or React | `ToastViewport` / `ToastViewportProps` |
| `<lumen-sonner>` | `<lumen-toast-viewport>` |

Mount the Astro runtime once in the application layout when interactive components require it:

```astro
---
import { Input, ToastViewport } from '@santi020k/lumen-astro'
import UIPrimitives from '@santi020k/lumen-astro/runtime'
---

<UIPrimitives />
<Input visualSize="sm" size={24} aria-label="Search" />
<ToastViewport placement="top-right" maxCount={5} />
```

Keep native numeric `size` values: they control HTML input width or select rows, independently of
visual sizing. Review wrappers and dynamic props explicitly. In Elements, use the equivalent public
attributes and register `defineLumenElements` once:

```html
<lumen-input visual-size="sm" size="24" aria-label="Search"></lumen-input>
<lumen-toast-viewport data-placement="top-right" data-ui-toast-max="5"></lumen-toast-viewport>
```

The viewport rename preserves placement, stack limits, and children. `Toast` still represents an
individual notification. An automated import may retain a local name such as
`ToastViewport as Sonner`; that alias is valid because the imported public symbol is now canonical.
Load the matching adapter stylesheet once, and keep React imports on `@santi020k/lumen-react`.

## 4. Move React Native date imports

Import date controls and their types from the optional date subpath; keep other primitives on the
root entry point:

```tsx
import { Button } from '@santi020k/lumen-react-native'
import { LumenDateField } from '@santi020k/lumen-react-native/datetime'
import type { LumenDateRangeValue } from '@santi020k/lumen-react-native/datetime'
```

The moved exports are `LumenDateField`, `LumenDateFieldProps`, `LumenDateRangeField`,
`LumenDateRangeFieldProps`, and `LumenDateRangeValue`. Only applications using these controls need
the optional datetime-picker peer. Follow the [React Native package guide](../packages/react-native/README.md)
for its supported peer and native setup; use Expo's compatible dependency installation when
applicable. Rebuild the native application after adding a native peer.

## 5. Update exhaustive Swift switches

Review switches over `LumenSurfacePadding`, `LumenSurfaceRadius`, `LumenButtonIntent`, and
`LumenIconName`. V2 adds `.xl` padding, `.xl` through `.size3xl` radii, `.success` button intent,
and synchronized icon cases. Existing cases and component call signatures remain available.

Handle the new cases explicitly if each needs distinct behavior, or use a deliberate `default`
fallback. With `@unknown default`, still handle currently known cases: Swift may warn about new
known cases even when that branch exists. Use the contract's `swiftApiBreakages` list to review the
complete additions, and resolve compiler diagnostics in every Apple target.

## 6. Verify and keep a rollback path

1. Re-run the migration preview and resolve remaining manual findings. Search wrappers and shared
   libraries for removed exports and old custom-element names.
2. Run the consumer's lint, strict typecheck, tests, and production build with resolved v2 packages.
   Compile native targets and confirm their dependency pins match the intended release.
3. Verify real pages at phone and desktop widths: keyboard focus, labels, numeric input sizes,
   select rows, toast placement and stacking, and interactive Astro controls. Check light/dark
   themes and console errors. Test native date controls and Swift switches in the actual consumer.
4. Commit source changes, manifests, and lock files together after checks pass.

Lumen does not migrate persisted application data. To roll back, restore the previous source,
manifests, and lock files, reinstall the original v1 dependencies, and rebuild all affected targets.
Keep unrelated data migrations out of this UI upgrade so that recovery remains straightforward.

Once the v2 application passes, continue with [v2 → v3](migrating-v2-to-v3.md). For initial adoption
rather than an existing Lumen upgrade, use [Migrating to Lumen](migrating-to-lumen.md).
