# Native API audit

This audit is the working record for the native contract-freeze gate in the
[Lumen 2 readiness plan](lumen-2-readiness.md). It distinguishes a public API that is intentionally
supported during Beta from one that has completed the stability evidence required for graduation.

The reviewed defaults, state semantics, ownership boundaries, and intentional platform differences
are recorded in the [Native contract review](native-contract-review.md).

## Classification vocabulary

- **Supported:** documented public API covered by compatibility checks. While its adapter is Beta,
  a breaking correction still requires release notes and a migration but does not yet require a
  major version.
- **Experimental:** public evaluation API that may change in a minor Beta or stable release and is
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
| React Native | 153 exports from `packages/react-native/src/index.ts` | 153 Supported; 0 Experimental; 0 Deprecated | `pnpm run check:native-api-baseline` compares the TypeScript entrypoint with `registry/native-api-baseline.json` | Review defaults and cross-adapter state semantics, then retain the approved baseline across two prerelease iterations |
| SwiftUI | Reviewed symbol graphs: 2,810 macOS, 2,787 iOS, 2,660 tvOS, and 2,680 watchOS symbols | Every recorded symbol Supported; 0 Experimental; 0 Deprecated; 0 Unclassified | `pnpm run check:swift-api-baseline` rebuilds and compares every declared platform; CI also runs `swift package diagnose-api-breaking-changes v1.6.0 --products LumenUI` | Review shared defaults and state semantics, then retain the approved baseline across two prerelease iterations |
| Compose | 70 public ABI blocks and 2,928 public members in `packages/compose/api/lumen-compose.api` | Entire approved dump Supported; 0 Experimental; 0 Deprecated | `./gradlew apiCheck` compares the release artifact with the reviewed binary API dump | Review shared defaults and state semantics, then retain the approved dump across two prerelease iterations |
| Wear OS | 8 classified declarations in `packages/compose/wear/api/wear.api` | 5 Supported; 3 Experimental; 0 Deprecated; 3 implementation helpers made Internal | Root `./gradlew apiCheck` compares the separate artifact dump; `pnpm run check:wear-api-classification` enforces classifications and source opt-ins | Confirm active-product and physical-watch behavior, then retain the approved dump across two prerelease iterations |

## React Native baseline rules

`registry/native-api-baseline.json` is reviewed API metadata, not generated output. Every named
export must appear in exactly one classification, arrays remain sorted, and wildcard exports are
rejected because they can bypass classification. An intentional API change updates implementation,
types, documentation, tests, the baseline, and migration notes together.

The baseline check is part of `pnpm run validate`. A changed entrypoint therefore fails before a
new symbol can be published without an explicit classification.

## Compose and Wear OS baseline rules

The reviewed `.api` files are the declaration-level inventory for the two Kotlin artifacts. The
phone and tablet dump is Supported. ContracTrack exercises the Wear theme, tone, action, progress,
and status APIs, while the clean artifact consumer verifies that subset in isolation; those five
declarations are Supported. The
metric and list-row evaluation APIs remain Experimental behind `ExperimentalLumenWearApi`; the
annotation itself is also classified Experimental. Sizing, progress-normalization, and color
helpers are Internal and absent from the public ABI.

Both dumps are generated from each release classes JAR with JetBrains' binary compatibility
validator. Android resource classes and compiler-generated Compose singleton holders are excluded;
all remaining public ABI must be listed in `registry/wear-api-classification.json` when it belongs
to the Wear artifact. `pnpm run check:wear-api-classification` rejects an unclassified declaration,
an internal helper that leaks into the ABI, or an Experimental function without a visible source
opt-in.

Run `./gradlew apiCheck` from `packages/compose` to check both artifacts. Use `./gradlew apiDump`
only after reviewing an intentional public API change and updating implementation, documentation,
tests, and migration notes together. Keeping the Wear dump separate prevents wearable-only API from
being mistaken for phone and tablet surface.

## SwiftUI baseline rules

`registry/swift-api-baseline.json` records normalized declaration fingerprints and an explicit
classification for every public symbol emitted by macOS, iOS, tvOS, and watchOS. The checker builds
fresh modules for all four destinations, extracts their public symbol graphs with Xcode, and rejects
removed, added, changed, duplicated, or unclassified declarations. The update command preserves
existing classifications and places new identifiers in Unclassified for deliberate review.

Swift Package Manager's API diagnostic separately compares the current `LumenUI` product with the
immutable `v1.6.0` repository tag. Together, these checks cover semantic repository history and
target-conditional APIs that a host-only package build cannot see.

## Freeze exit conditions

The native contract-freeze gate remains In progress until:

- every inventory entry has one classification;
- the accepted [Native contract review](native-contract-review.md) remains aligned with every
  supported declaration and documented platform boundary;
- all intentional Beta breakages have migration notes;
- Experimental APIs are visibly labeled in source and documentation; and
- the approved baselines remain free of unapproved breakage through two consecutive prerelease
  iterations.

The machine-readable soak record is `registry/native-prerelease-soak.json`.
`pnpm run check:native-prerelease-soak` verifies that its recorded hashes still match every reviewed
API baseline and the Wear classification registry. `pnpm run check:native-prerelease-readiness`
remains failing until two chronological
release iterations record their full revision, native artifact versions, baseline hashes, and
immutable release and active-consumer evidence URLs.
