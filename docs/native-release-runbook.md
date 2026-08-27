# Native release runbook

This runbook turns the [Lumen 2 readiness plan](lumen-2-readiness.md) into an executable release
sequence. It does not authorize publishing, tagging, merging, or changing physical devices. Each
external action still requires the maintainer's explicit approval.

## Release policy

Continue publishing ordinary releases on the existing version lines while the native adapters are
Beta. Do not create a separate release-candidate version train merely to prepare native stability.

| Stage | npm and Swift repository | React Native | Compose and Wear | Purpose |
| --- | --- | --- | --- | --- |
| Current development | Existing `1.x` package and repository releases | Existing `0.x` releases | Existing `0.x` releases | Correct APIs and gather real-product evidence while native remains Beta |
| Stability iteration 1 | Next approved ordinary `1.x` release | Next approved ordinary `0.x` release | Next approved ordinary `0.x` release | First frozen-contract public release and consumer validation |
| Stability iteration 2 | A later ordinary `1.x` release | A later ordinary `0.x` release | A later ordinary `0.x` release | Prove an upgrade without changing the supported API baselines |
| Lumen 2 | Every public package at `2.0.0`; repository tag `v2.0.0` | `2.0.0` | `2.0.0` | Graduate every platform together |

Swift Package Manager consumes this repository, so SwiftUI continues to follow the umbrella Git
tag while it is Beta. The mismatched pre-2.0 numbers describe distribution history, not different
maturity promises. Lumen `2.0.0` is the first coordinated release where every public package and
platform is production-supported under the same major version.

Version 2 may include reviewed breaking corrections, but the release must not manufacture web
breakage merely to justify a major. Every actual breaking change still requires consumer evidence,
migration notes, and an approved contract disposition.

## 1. Maintain a clean current release baseline

Publish fixes and compatible improvements through the normal Changesets and Compose workflows.
The repository tag, npm package family, Swift package reference, Compose artifacts, changelogs, and
release manifest must describe the same intended source revision.

The published `v1.6.0` Swift package has incorrect tvOS availability boundaries. The existing tag
was not moved or replaced. The source correction is published in immutable tag `v1.7.0-rc.0`, and
the public tag passed the clean macOS, iOS, tvOS, and watchOS consumer check on 2026-08-27:

```bash
pnpm exec changeset status
pnpm run check:swift-package-candidate
pnpm run check:release-manifest
pnpm run check:swift-version
pnpm run validate
pnpm run check:swift-package-release -- --version 1.7.0-rc.0
```

The prerelease tag completes the corrective Swift distribution proof, but it is not an ordinary
published release and therefore does not count as a stability-soak iteration.

## 2. Freeze the supported native contracts

Before recording a stability iteration:

- every public declaration is classified as Supported, Experimental, deprecated, or internal;
- every Supported API baseline passes without a change pending review;
- Beta corrections include migration notes;
- no release-blocking consumer finding remains open; and
- the exact published revision passes the native package, API, distribution, and device-evidence
  structural checks.

Run:

```bash
pnpm run check:native-api-baseline
pnpm run check:swift-api-baseline
pnpm run check:compose-api-classification
pnpm run check:wear-api-classification
pnpm run check:native-consumer-evidence
pnpm run check:native-stability-soak
pnpm run check:native-device-evidence
(cd packages/compose && ./gradlew apiCheck)
```

An intentional Supported API change requires review, migration notes, regenerated baselines, and a
restart of the two-iteration stability soak. A newly added Experimental API does not silently join
the stable surface.

## 3. Record stability iteration 1

Use an ordinary published release; no `rc` suffix or prerelease mode is required. Record the
iteration only after React Native, SwiftUI, Compose, and Wear artifacts are available through their
real consumer distribution channels and the selected active applications build against them.

Add the following shape to `registry/native-stability-soak.json`:

```json
{
  "id": "native-soak.0",
  "date": "YYYY-MM-DD",
  "revision": "FULL_40_CHARACTER_GIT_REVISION",
  "versions": {
    "compose": "CURRENT_0_X_VERSION",
    "reactNative": "CURRENT_0_X_VERSION",
    "swift": "CURRENT_1_X_VERSION",
    "wear": "CURRENT_0_X_VERSION"
  },
  "baselines": {
    "compose": "COPY_FROM_LEDGER_BASELINES",
    "composeClassification": "COPY_FROM_LEDGER_BASELINES",
    "reactNative": "COPY_FROM_LEDGER_BASELINES",
    "swiftUI": "COPY_FROM_LEDGER_BASELINES",
    "wear": "COPY_FROM_LEDGER_BASELINES",
    "wearClassification": "COPY_FROM_LEDGER_BASELINES"
  },
  "evidence": {
    "releaseVerificationUrl": "https://github.com/santi020k/lumen/actions/runs/RUN_ID",
    "consumerValidation": {
      "compose": "IMMUTABLE_COMPOSE_CONSUMER_EVIDENCE",
      "reactNative": "IMMUTABLE_REACT_NATIVE_CONSUMER_EVIDENCE",
      "swiftUI": "IMMUTABLE_SWIFT_CONSUMER_EVIDENCE",
      "wear": "IMMUTABLE_WEAR_CONSUMER_EVIDENCE"
    }
  }
}
```

The verification workflow must cover the exact public artifacts and revision. A playground or
package smoke test does not replace an active-consumer record. Validate the entry with
`pnpm run check:native-stability-soak`; readiness remains incomplete with one iteration recorded.

## 4. Upgrade through stability iteration 2

Publish later ordinary versions on the same pre-2.0 lines. Every adapter version must be newer than
its first stability-iteration version. Upgrade at least one active external consumer per adapter
without source substitution, then record installation, build, runtime, accessibility, and migration
findings as `native-soak.1`.

Resolve every release-blocking result before both commands pass:

```bash
pnpm run check:native-stability-readiness
pnpm run check:native-consumer-readiness
pnpm run check:native-device-readiness
```

## 5. Prepare the coordinated Lumen 2 release

After the stability soak, real-consumer upgrades, distribution checks, and full physical-device
matrix are complete:

1. approve the version 2 contract and migration notes;
2. add reviewed major Changesets entries for every public npm package;
3. set React Native, Compose, and Wear to `2.0.0`;
4. set the umbrella package to `2.0.0`, which produces the Swift `v2.0.0` repository tag;
5. regenerate the release manifest, synchronized platform installation guidance, MCP snapshot,
   registry, platform outputs, and lockfile;
6. remove every native Beta label in the same release revision; and
7. run the complete release, consumer, compatibility, accessibility, and distribution gates.

`pnpm run check:native-stable-readiness` rejects an uncoordinated native version 2 launch and
requires both machine-readable evidence ledgers before any native adapter can graduate.

## 6. Launch and verify Lumen 2

Publish only through the repository's authorized npm, Maven Central, and repository-tag workflows.
After publication, verify every npm package at `2.0.0`, the peeled `v2.0.0` Swift tag, both Compose
coordinates at `2.0.0`, every clean consumer build, and the upgraded real applications.

Only then mark the coordinated Lumen 2 release Complete in the readiness ledger. From that point,
all Supported web and native APIs follow the stable compatibility policy.
