# Native release runbook

This runbook turns the [Lumen 2 readiness plan](lumen-2-readiness.md) into an executable release
sequence. It does not authorize publishing, tagging, merging, or changing physical devices. Each
external action still requires the maintainer's explicit approval.

## Release policy

Continue publishing ordinary releases on the existing version lines while the supported Lumen 2
contract gathers launch evidence. Do not create a separate version train solely for that evidence.

| Stage                 | npm, SwiftUI, and WidgetKit repository                   | React Native                         | Compose and Wear                     | Purpose                                                       |
| --------------------- | -------------------------------------------------------- | ------------------------------------ | ------------------------------------ | ------------------------------------------------------------- |
| Current development   | Existing `1.x` package and repository releases           | Existing pre-2 releases              | Existing `0.x` releases              | Hold the supported v2 APIs and gather real-product evidence   |
| Stability iteration 1 | Next approved ordinary `1.x` release                     | Next approved ordinary pre-2 release | Next approved ordinary `0.x` release | First frozen-contract public release and consumer validation  |
| Stability iteration 2 | A later ordinary `1.x` release                           | A later ordinary pre-2 release       | A later ordinary `0.x` release       | Prove an upgrade without changing the supported API baselines |
| Lumen 2               | Every public package at `2.0.0`; repository tag `v2.0.0` | `2.0.0`                              | `2.0.0`                              | Graduate every platform together                              |

Swift Package Manager consumes this repository, so SwiftUI continues to follow the umbrella Git
tag. The mismatched pre-2.0 numbers describe distribution history, not different
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
- pre-2 corrections include migration notes;
- no release-blocking consumer finding remains open; and
- the exact published revision passes the native package, API, distribution, and device-evidence
  structural checks.

Run:

```bash
pnpm run check:native-api-baseline
pnpm run check:swift-api-baseline
pnpm run check:compose-api-classification
pnpm run check:wear-api-classification
pnpm run check:web-consumer-evidence
pnpm run check:native-consumer-evidence
pnpm run check:native-stability-soak
pnpm run check:native-device-evidence
(cd packages/compose && ./gradlew apiCheck)
```

An intentional Supported API change requires review, migration notes, regenerated baselines, and a
restart of the two-iteration stability soak. A newly added Experimental API does not silently join
the stable surface.

The release-candidate workflow treats the contract, release manifest, frozen API baselines, and
all four web and native evidence ledgers plus their validators as one graduation-decision surface. Changes to any
of them select the canary job that validates the checked-in ledger structure before running the
version-sensitive stable-readiness gate; pre-2 versions therefore cannot hide a malformed ledger
behind the stable gate's expected early exit.

## 3. Record stability iteration 1

Use an ordinary published release; no `rc` suffix or prerelease mode is required. Record the
iteration only after React Native, SwiftUI, WidgetKit, Compose, and Wear artifacts are available through their
real consumer distribution channels and the selected active applications build against them. The
recorded iteration date must have already occurred; future-dated soak evidence is rejected.

Add the following shape to `registry/native-stability-soak.json`:

```json
{
  "id": "native-soak.0",
  "date": "YYYY-MM-DD",
  "revision": "FULL_40_CHARACTER_GIT_REVISION",
  "versions": {
    "compose": "CURRENT_0_X_VERSION",
    "reactNative": "CURRENT_PRE_2_VERSION",
    "swift": "CURRENT_1_X_VERSION",
    "wear": "CURRENT_0_X_VERSION"
  },
  "baselines": {
    "compose": "COPY_FROM_LEDGER_BASELINES",
    "composeClassification": "COPY_FROM_LEDGER_BASELINES",
    "reactNative": "COPY_FROM_LEDGER_BASELINES",
    "swiftUI": "COPY_FROM_LEDGER_BASELINES",
    "swiftWidget": "COPY_FROM_LEDGER_BASELINES",
    "wear": "COPY_FROM_LEDGER_BASELINES",
    "wearClassification": "COPY_FROM_LEDGER_BASELINES"
  },
  "evidence": {
    "artifactVerification": {
      "repository": "https://github.com/santi020k/lumen",
      "revision": "FULL_40_CHARACTER_GIT_REVISION",
      "revisionUrl": "https://github.com/santi020k/lumen/commit/FULL_40_CHARACTER_GIT_REVISION",
      "verificationUrl": "https://github.com/santi020k/lumen/actions/runs/PUBLISHED_NATIVE_RUN_ID"
    },
    "release": {
      "repository": "https://github.com/santi020k/lumen",
      "revision": "FULL_40_CHARACTER_GIT_REVISION",
      "revisionUrl": "https://github.com/santi020k/lumen/commit/FULL_40_CHARACTER_GIT_REVISION",
      "verificationUrl": "https://github.com/santi020k/lumen/actions/runs/RUN_ID"
    },
    "consumerValidation": {
      "compose": {
        "repository": "EXTERNAL_COMPOSE_CONSUMER_REPOSITORY",
        "revision": "FULL_40_CHARACTER_COMPOSE_CONSUMER_REVISION",
        "revisionUrl": "EXACT_COMPOSE_CONSUMER_REVISION_URL",
        "verificationUrl": "PERMANENT_COMPOSE_CONSUMER_WORKFLOW_OR_BUILD_URL"
      },
      "reactNative": {
        "repository": "EXTERNAL_REACT_NATIVE_CONSUMER_REPOSITORY",
        "revision": "FULL_40_CHARACTER_REACT_NATIVE_CONSUMER_REVISION",
        "revisionUrl": "EXACT_REACT_NATIVE_CONSUMER_REVISION_URL",
        "verificationUrl": "PERMANENT_REACT_NATIVE_CONSUMER_WORKFLOW_OR_BUILD_URL"
      },
      "swiftUI": {
        "repository": "EXTERNAL_SWIFTUI_CONSUMER_REPOSITORY",
        "revision": "FULL_40_CHARACTER_SWIFTUI_CONSUMER_REVISION",
        "revisionUrl": "EXACT_SWIFTUI_CONSUMER_REVISION_URL",
        "verificationUrl": "PERMANENT_SWIFTUI_CONSUMER_WORKFLOW_OR_BUILD_URL"
      },
      "swiftWidget": {
        "repository": "EXTERNAL_WIDGETKIT_CONSUMER_REPOSITORY",
        "revision": "FULL_40_CHARACTER_WIDGETKIT_CONSUMER_REVISION",
        "revisionUrl": "EXACT_WIDGETKIT_CONSUMER_REVISION_URL",
        "verificationUrl": "PERMANENT_WIDGETKIT_CONSUMER_WORKFLOW_OR_BUILD_URL"
      },
      "wear": {
        "repository": "EXTERNAL_WEAR_CONSUMER_REPOSITORY",
        "revision": "FULL_40_CHARACTER_WEAR_CONSUMER_REVISION",
        "revisionUrl": "EXACT_WEAR_CONSUMER_REVISION_URL",
        "verificationUrl": "PERMANENT_WEAR_CONSUMER_WORKFLOW_OR_BUILD_URL"
      }
    }
  }
}
```

The Lumen release and published-artifact verification records must bind the iteration revision to
the repository and permanent workflow runs. The artifact run must execute
`verify-native-release.yml` against the exact public versions and build clean React Native iOS and
Android, Swift package, Compose, and Wear consumers. Every consumer record must identify an external
repository, its exact lowercase 40-character consumer revision, an immutable URL for that revision,
and a permanent workflow, pipeline, job, or build URL from the same repository. Mutable branches,
workflow definitions, queries, fragments, Lumen-owned fixtures, playgrounds, and package smoke tests
do not replace an active-consumer record. Validate the entry with
`pnpm run check:native-stability-soak`; readiness remains incomplete with one iteration recorded.

## 4. Upgrade through stability iteration 2

Publish later ordinary versions on the same pre-2.0 lines. Every adapter version must be newer than
its first stability-iteration version. Upgrade at least one active external consumer per adapter
without source substitution, then record installation, build, runtime, accessibility, and migration
findings as `native-soak.1`.

Use these commands to inspect the post-release platform qualification backlog:

```bash
pnpm run check:native-stability-readiness
pnpm run check:native-consumer-readiness
pnpm run check:native-device-readiness
```

## 5. Prepare the coordinated Lumen 2 release

After the two-release stability soak and distribution checks are complete:

1. add reviewed major Changesets entries for every public npm package;
2. after applying Changesets, align every public npm package, Compose, and Wear to `2.0.0` (a
   semantic major bump from a `0.x` or `1.0.0-rc` line may otherwise stop at `1.0.0`);
3. set the umbrella package to `2.0.0`, which produces the Swift `v2.0.0` repository tag;
4. regenerate the release manifest, synchronized platform installation guidance, MCP snapshot,
   registry, platform outputs, and lockfile;
5. verify every public surface describes the supported Lumen 2 contract and remaining evidence;
6. run the package, compatibility, migration, security, stability, and distribution gates; and
7. approve the version 2 contract and migration notes, recording the approver, date, full candidate
   revision reviewed after those gates, and immutable HTTPS approval evidence in
   `registry/lumen-2-contract.json`.

`pnpm run version-packages` applies the one-time public-package and Compose/Wear alignment
immediately after Changesets, synchronizes Compose consumers and installation guidance, and then
regenerates the lockfile and release manifest. It keeps each newly generated changelog heading
aligned with its package manifest and fails closed if the expected release heading is missing. The
synchronizer is a no-op for ordinary pre-2 releases and after the Lumen 2 graduation record exists.

The reviewed candidate in step 7 must already contain steps 1 through 6. Commit the approval record
separately after the review. Publication rejects any delta from the reviewed revision other than
`registry/lumen-2-contract.json`; if another file changes, prepare a new candidate and approval
instead of expanding an allowlist.

`pnpm run check:native-stable-readiness` remains the full platform-qualification report. The
maintainer explicitly deferred incomplete external-consumer and physical-device results until after
the initial `2.0.0` publication, so npm and Compose publishing enforce the completed stability
soak plus structural evidence validation instead. The generated release manifest must still list
every public npm package at exactly `2.0.0`, together with the Compose coordinates and Swift tag.
Later 2.x releases are not forced into package-family lockstep. A later stable major requires its
own explicit contract.

## 6. Launch and verify Lumen 2

Publish only through the repository's authorized npm, Maven Central, and repository-tag workflows.
For the initial coordinated launch, publish the npm family from the approved release revision first;
that workflow creates `v2.0.0` for Swift Package Manager. Create `compose-v2.0.0` only on that exact
commit. The Compose publication workflow fetches and peels both refs, then rejects a missing or
different `v2.0.0` commit before it reads publication credentials or uploads an artifact. This
same-commit rule applies to the initial `2.0.0` milestone; verified post-graduation 2.x releases may
version independently.

The initial `2.0.0` publication guard also requires a completely clean Git working tree, including no
untracked files. Matching the approved `HEAD` is insufficient when local changes could alter the
npm tarballs or Compose artifacts after review.

After publication, verify every npm package at `2.0.0`, the peeled `v2.0.0` Swift tag, both Compose
coordinates at `2.0.0`, every clean consumer build, and the upgraded real applications.
The npm workflow must verify that Changesets published the complete package family from the release
manifest at `2.0.0` before it creates the repository tag; a successful umbrella package alone is not
enough. If `v2.0.0` already exists remotely, the workflow peels it and requires the tag to resolve to
the current publication commit instead of silently accepting a conflicting tag.
Before tagging, the workflow also installs every reported package into a temporary clean npm
consumer and verifies its registry signature, tarball integrity, signed SLSA source revision,
repository, and release-workflow identity against the publication commit. The workflow refuses
non-`main` dispatches, and the signed provenance must identify both `refs/heads/main` and its exact
publication commit.
The published-native workflow also runs npm's signature verification and requires the React Native
package's signed SLSA subject digest, source repository, release workflow, and Git commit to match
the installed tarball and requested release revision.
For Compose and Wear, each published POM identifies the immutable `compose-v<version>` source tag.
The workflow resolves that tag to the requested revision, verifies every primary artifact against
its Maven Central SHA-512 checksum, requires the Central-validated PGP signature for each artifact,
and builds clean phone and watch consumers from those exact coordinates.

Record the successful graduation in `registry/lumen-2-contract.json` with the verifier, date,
`2.0.0` release revision, and immutable HTTPS release evidence. This record unlocks ordinary
post-graduation 2.x releases only when its release revision matches the peeled `v2.0.0` tag. Both
publication workflows perform that identity check before credentials; without a verified record,
the gate continues to require the exact coordinated `2.0.0` package family and rejects a direct
jump to a later version.

Only then mark the coordinated Lumen 2 release Complete in the readiness ledger. From that point,
all Supported web and native APIs follow the stable compatibility policy.
