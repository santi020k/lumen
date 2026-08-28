# Native API audit

This audit is the working record for the native contract-freeze gate in the
[Lumen 2 readiness plan](lumen-2-readiness.md). It distinguishes a public API in the frozen Lumen 2
contract from the external evidence required before the coordinated version 2 publication.

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
| React Native | 242 exports across the package root and optional datetime entrypoint | 242 Supported; 0 Experimental phone exports; 0 Deprecated | `pnpm run check:native-api-baseline` compares both TypeScript entrypoints with `registry/native-api-baseline.json` | Retain the approved baseline across two ordinary stability iterations |
| SwiftUI | Reviewed symbol graphs: 3,027 macOS, 3,004 iOS, 2,845 tvOS, 3,004 visionOS, and 2,865 watchOS symbols | Every reviewed symbol is Supported on each platform; 0 Experimental, Deprecated, or Unclassified | `pnpm run check:swift-api-baseline` rebuilds every declared platform, requires a Stable baseline with no Experimental symbols, and compares it with `registry/swift-api-baseline.json`; `pnpm run check:swift-source-compatibility` permits only the four reviewed Lumen 2 enum additions relative to `v1.6.0` | Retain the approved baseline across two ordinary stability iterations |
| WidgetKit | Reviewed `LumenWidgetUI` symbol graphs: 71 each on macOS, iOS, and watchOS | 71 Supported; 0 Experimental, Deprecated, or Unclassified on every supported widget platform | `pnpm run check:swift-api-baseline` rebuilds both Swift products and compares `registry/swift-widget-api-baseline.json` | Keep the focused product independent from the complete `LumenUI` catalog and PhoneNumberKit |
| Compose | 151 classified public declarations in `packages/compose/api/lumen-compose.api` | 151 Supported; 0 Experimental or Deprecated | `./gradlew apiCheck` compares the release artifact with the reviewed binary API dump; `pnpm run check:compose-api-classification` enforces declaration maturity | Retain the approved baseline across two ordinary stability iterations |
| Wear OS | 7 classified declarations in `packages/compose/wear/api/wear.api` | 7 Supported; 0 Experimental; 3 implementation helpers made Internal | Root `./gradlew apiCheck` compares the separate artifact dump; `pnpm run check:wear-api-classification` enforces classifications | Confirm active-product and physical-watch behavior, then retain the approved dump across two ordinary stability iterations |

## React Native baseline rules

`registry/native-api-baseline.json` is reviewed API metadata, not generated output. Every named
export from the root or an approved subpath must appear in exactly one classification, arrays remain
sorted, and wildcard exports are rejected because they can bypass classification. Symbols cannot
be duplicated across stable entrypoints. An intentional API change updates implementation, types,
documentation, tests, the baseline, and migration notes together.

The baseline check is part of `pnpm run validate`. A changed entrypoint therefore fails before a
new symbol can be published without an explicit classification.

## Compose and Wear OS baseline rules

The reviewed `.api` files are the declaration-level inventory for the two Kotlin artifacts. The
phone and tablet declarations are Supported, including `LumenPhoneInput` and its related country,
number, and resolution contracts. ContracTrack exercises the Wear theme, tone, action, progress,
and status APIs, while the clean artifact consumer verifies the artifact in isolation. Metric and
list-row compositions are also Supported for Lumen 2. Sizing, progress-normalization, and color
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

Swift Package Manager's API diagnostic separately compares the current `LumenUI` product with the
immutable `v1.6.0` repository tag. `pnpm run check:swift-source-compatibility` verifies that its
output contains exactly the reviewed surface-scale enum additions in the Lumen 2 contract; removed
signatures or another unreviewed break fail the canary. Together, these checks cover semantic
repository history and target-conditional APIs that a host-only package build cannot see.

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
