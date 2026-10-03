# Native API audit

This audit records the reviewed native API inventory and the external evidence required for
publication. The [v4 readiness record](lumen-4-readiness.md) describes the current candidate;
[Lumen 2 readiness](lumen-2-readiness.md) preserves the original graduation history.

The reviewed defaults, state semantics, ownership boundaries, and intentional platform differences
are recorded in the [Native contract review](native-contract-review.md).

## Classification vocabulary

- **Supported:** documented public API covered by compatibility checks. Breaking corrections
  require release notes, a migration, and the versioning policy appropriate to the release stage.
- **Experimental:** public evaluation API that may change in a minor pre-2 or stable release and is
  labeled as Experimental in source and documentation.
- **Deprecated:** supported public API with a documented replacement and migration path. After
  native graduation it remains available until the next major release.
- **Internal:** implementation detail that is not exported from the package entrypoint or public
  module interface.

Generated tokens and icon catalogs are public API. Generated symbols are classified and checked in
the same way as handwritten exports; their generator remains the editing source of truth.

## Adapter progress

| Adapter | Public inventory | Classification | Compatibility enforcement | Remaining work |
| --- | --- | --- | --- | --- |
| React Native | 249 unique exports across the package root, datetime, foundations, and graphics entrypoints | 249 Supported; 0 Experimental phone exports; 0 Deprecated | `pnpm run check:native-api-baseline` compares all four TypeScript entrypoints with `registry/native-api-baseline.json` | Retain the approved baseline across two ordinary stability iterations |
| SwiftUI | Current symbol graphs: 3,197 macOS, 3,174 iOS, 3,005 tvOS, 3,174 visionOS, and 3,025 watchOS symbols | Every classified symbol is Supported on each platform; 0 Experimental, Deprecated, or Unclassified | `pnpm run check:swift-api-baseline` rebuilds every declared platform and compares it with `registry/swift-api-baseline.json`; `pnpm run check:swift-source-compatibility` checks the reviewed initializer replacements, seven sheet diagnostics, and four icon enum additions relative to `v3.0.1` for the v4 candidate | Keep the current major contract and migration guidance aligned with intentional signature changes |

| WidgetKit | Reviewed `LumenWidgetUI` symbol graphs: 71 each on macOS, iOS, and watchOS | 71 Supported; 0 Experimental, Deprecated, or Unclassified on every supported widget platform | `pnpm run check:swift-api-baseline` rebuilds both Swift products and compares `registry/swift-widget-api-baseline.json` | Keep the focused product independent from the complete `LumenUI` application catalog |
| Compose | 173 classified public declarations in `packages/compose/api/lumen-compose.api` | 173 Supported; 0 Experimental or Deprecated | `./gradlew apiCheck` compares the release artifact with the reviewed binary API dump; `pnpm run check:compose-api-classification` enforces declaration maturity | Retain the approved baseline across two ordinary stability iterations |
| Wear OS | 7 classified declarations in `packages/compose/wear/api/wear.api` | 7 Supported; 0 Experimental; 3 implementation helpers made Internal | Root `./gradlew apiCheck` compares the separate artifact dump; `pnpm run check:wear-api-classification` enforces classifications | Confirm active-product and physical-watch behavior, then retain the approved dump across two ordinary stability iterations |

## React Native baseline rules

`registry/native-api-baseline.json` is reviewed API metadata, not generated output. Every named
export from the root or an approved subpath must appear in exactly one classification, arrays remain
sorted, and wildcard exports are rejected because they can bypass classification. An optional entrypoint may re-export an existing symbol while retaining the same reviewed
classification. An intentional API change updates implementation, types,
documentation, tests, the baseline, and migration notes together.

The baseline check is part of `pnpm run validate`. A changed entrypoint therefore fails before a
new symbol can be published without an explicit classification.

## Compose and Wear OS baseline rules

The reviewed `.api` files are the declaration-level inventory for the two Kotlin artifacts. The
phone and tablet declarations are Supported, including `LumenPhoneInput` and its related country,
number, and resolution contracts. ContracTrack exercises the Wear theme, tone, action, progress,
and status APIs, while the clean artifact consumer verifies the artifact in isolation. Metric and
list-row compositions retain their Supported classification. Sizing, progress-normalization, and color
helpers remain Internal and absent from the public ABI.

Both dumps are generated from each release classes JAR with JetBrains' binary compatibility
validator. Android resource classes and compiler-generated Compose singleton holders are excluded.
`registry/compose-api-classification.json` classifies every public phone/tablet declaration, while
`registry/wear-api-classification.json` classifies every public Wear declaration and the reviewed
implementation helpers that must remain internal. The classification checks reject an unclassified
declaration or an internal Wear helper that leaks into the ABI. If a future Experimental API is
introduced, the same checks require an explicit classification and visible source opt-in.

Run `./gradlew apiCheck` from `packages/compose` to check both artifacts. Use `./gradlew apiDump`
only after reviewing an intentional public API change and updating implementation, documentation,
tests, and migration notes together. Keeping the Wear dump separate prevents wearable-only API from
being mistaken for phone and tablet surface.

## SwiftUI baseline rules

`registry/swift-api-baseline.json` records normalized declaration fingerprints and an explicit
classification for every public symbol emitted by macOS, iOS, tvOS, visionOS, and watchOS. The checker builds
fresh modules for all five destinations, extracts their public symbol graphs with Xcode, and rejects
removed, added, changed, duplicated, or unclassified declarations. The update command preserves
existing classifications and places new identifiers in Unclassified for deliberate review.

Swift Package Manager's API diagnostic compares the current `LumenUI` product with the immutable
baseline named by the current major contract. For v4 this is `v3.0.1`: the reviewed initializer
replacements add defaulted chart, slider, symbol-picker, phone, appearance and material parameters. `pnpm run
check:swift-source-compatibility` rejects additional or missing diagnostics. The v3 contract retains
its historical icon-catalog comparison against `v2.1.0`. Together, these checks cover repository
history and target-conditional APIs that a host-only package build cannot see.

The v4 changes are deliberately classified Supported in the generated symbol inventories; the
release contract remains draft until its exact final revision is approved. Existing calls generally
retain default behavior, but function references and binary clients must adopt the new signatures.
The changed Swift and Compose baselines restart native stability qualification; no historical
consumer or physical-device evidence is relabeled as v4 evidence.

## Freeze exit conditions

The native contract-freeze gate remains In progress until:

- every inventory entry has one classification;
- the accepted [Native contract review](native-contract-review.md) remains aligned with every
  supported declaration and documented platform boundary;
- all intentional pre-2 breakages have migration notes;
- Experimental APIs are visibly labeled in source and documentation; and
- the approved baselines remain free of unapproved breakage through two consecutive ordinary
  stability iterations.

The machine-readable soak record is `registry/native-stability-soak.json`.
`pnpm run check:native-stability-soak` verifies that its recorded hashes still match every reviewed
API baseline and the Wear classification registry. `pnpm run check:native-stability-readiness`
passes after two chronological release iterations recorded their full revision, native artifact
versions, baseline hashes, and immutable release and active-consumer evidence URLs. Consumer
completeness and device readiness remain separate gates.
