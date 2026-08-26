# Native release runbook

This runbook turns the [Lumen 2 readiness plan](lumen-2-readiness.md) into an executable release
sequence. It does not authorize publishing, tagging, merging, or changing physical devices. Each
external action still requires the maintainer's explicit approval.

## Release trains

Use three distinct trains. Do not count an artifact in more than one train.

| Train | React Native | SwiftUI repository tag | Compose and Wear | Purpose |
| --- | --- | --- | --- | --- |
| Corrective patch | `0.5.0` unchanged | `v1.6.1` | `0.5.0` unchanged | Repair the published SwiftUI tvOS availability contract |
| Native RC 1 | `1.0.0-rc.0` | `v1.7.0-rc.0` | `1.0.0-rc.0` | First frozen-contract soak iteration |
| Native RC 2 | `1.0.0-rc.1` | `v1.7.0-rc.1` | `1.0.0-rc.1` | Upgrade and second frozen-contract soak iteration |
| Native stable | `1.0.0` | `v1.7.0` | `1.0.0` | Graduate the native adapters after every gate passes |

The Swift version follows the umbrella repository tag because Swift Package Manager consumes this
repository. It is intentionally different from the independently versioned React Native and
Compose artifacts. The `v1.6.1` patch is a distribution correction, not a prerelease soak
iteration.

Treat the version table as the proposed train until the corresponding version changes are reviewed
in a release pull request. If another umbrella release lands first, advance the Swift tag train to
the next available compatible minor without renumbering React Native or Compose.

## 1. Publish and verify the Swift corrective patch

The current changeset status calculates `@santi020k/lumen@1.6.1`. The repository release workflow
creates `v1.6.1` only after that exact npm package publishes. Keep the availability fix, its
changeset, and the generated version changes in the same release revision.

Before merging the feature work:

```bash
pnpm exec changeset status
pnpm run check:swift-package-candidate
pnpm run check:release-manifest
pnpm run validate
```

Then follow the normal Changesets flow in [Contributing](../CONTRIBUTING.md): merge the feature pull
request, review the generated `changeset-release/main` pull request, and merge it only after its
required checks pass. Do not create or move `v1.6.1` manually while the release workflow is
running.

After the workflow reports a successful publish, resolve the public tag rather than trusting the
workflow result alone:

```bash
git ls-remote --exit-code --tags origin refs/tags/v1.6.1 refs/tags/v1.6.1^{}
pnpm run check:swift-package-release -- --version 1.6.1
```

Record the tag's peeled commit, the release workflow run, and the public consumer check in the
release notes. Never move `v1.6.0` or `v1.6.1`; issue a new patch if another correction is needed.

## 2. Confirm the RC entry conditions

Do not enter prerelease mode until all of these are true:

- `v1.6.1` passes the public Swift package release check;
- every Supported API baseline passes without a change that still needs review;
- `pnpm run check:wear-api-classification` proves the consumer-validated Wear subset is Supported
  and every remaining evaluation API is explicitly Experimental;
- no release-blocking consumer finding remains open;
- the candidate revision passes the release-canary workflow; and
- the physical-device matrix has enough coverage to expose contract problems before RC 1. The full
  matrix remains mandatory before stable graduation.

Run the structural gates on the exact candidate revision:

```bash
pnpm run check:native-api-baseline
pnpm run check:swift-api-baseline
pnpm run check:wear-api-classification
pnpm run check:native-prerelease-soak
pnpm run check:native-device-evidence
(cd packages/compose && ./gradlew apiCheck)
```

Any intentional Supported API change requires review, migration notes, regenerated baselines, and a
restart of the two-iteration soak. A newly added Experimental API does not silently become part of
the stable contract.

## 3. Prepare native RC 1

Start from a clean revision after the corrective release. Create reviewed Changesets entries that:

- major-bump `@santi020k/lumen-react-native` to the `1.0.0` target;
- minor-bump `@santi020k/lumen` to the `1.7.0` target for the Swift repository tag; and
- explain native stability, remaining RC status, and migration from the last Beta releases.

Enter Changesets prerelease mode with `rc`, then let the repository's version script calculate the
npm prerelease versions:

```bash
pnpm exec changeset pre enter rc
pnpm run version-packages
pnpm exec changeset status
```

The reviewed output must be `@santi020k/lumen-react-native@1.0.0-rc.0` and
`@santi020k/lumen@1.7.0-rc.0`. Do not hand-edit npm versions to force that result. Set
`lumenComposeVersion=1.0.0-rc.0`, run the canonical Compose version synchronizer and release-manifest
generator, and review every generated documentation and lockfile change:

```bash
pnpm run sync:compose-version
pnpm run generate:release-manifest
pnpm run validate
swift test
(cd packages/compose && ./gradlew test lint apiCheck assembleDebugAndroidTest verifyMavenPublication)
```

The npm release uses the normal Changesets release pull request. Compose publishes only from an
explicitly approved immutable `compose-v1.0.0-rc.0` tag or an explicitly approved manual workflow
dispatch. Verify that the tag version equals `lumenComposeVersion` before publishing.

After every public artifact resolves, run the packed/native consumer checks against the public
versions, complete the selected real-application installs, and capture immutable workflow, tag,
registry, Maven Central, and consumer evidence URLs.

Dispatch `Verify published native release` with the full shared release revision and the exact
React Native, Swift, and Compose versions. Its metadata job requires both repository tags to peel to
that revision, matches the checked-out manifests, resolves npm and both Maven Central coordinates,
and then builds clean public-artifact consumers on Android, iOS, every declared Apple platform,
phone Compose, and Wear Compose. Use the successful workflow-run URL as one immutable soak-evidence
entry; it does not replace the real-application or physical-device records.

## 4. Record RC 1

Add an iteration to `registry/native-prerelease-soak.json` only after all four public artifacts are
available from their consumer distribution channels. Use a full 40-character repository revision,
the exact versions from the table, the unchanged baseline hashes already stored in the ledger, and
evidence links that a reviewer can open.

The entry shape is:

```json
{
  "id": "native-rc.0",
  "date": "YYYY-MM-DD",
  "revision": "FULL_40_CHARACTER_GIT_REVISION",
  "versions": {
    "compose": "1.0.0-rc.0",
    "reactNative": "1.0.0-rc.0",
    "swift": "1.7.0-rc.0",
    "wear": "1.0.0-rc.0"
  },
  "baselines": {
    "compose": "COPY_FROM_LEDGER_BASELINES",
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

The published-native workflow URL must be the successful run for this exact iteration. Consumer
entries identify the active application build, issue, pull request, or other immutable record for
each adapter. RC 1 records the exact public-artifact installation; RC 2 records the upgrade from RC
1. A playground or package smoke test is not a consumer-validation record.

Validate the record with `pnpm run check:native-prerelease-soak`. The readiness form must still fail
with one iteration remaining.

## 5. Upgrade through native RC 2

Keep Changesets prerelease mode active. Add patch Changesets entries for the umbrella and React
Native packages, advance Compose and Wear to `1.0.0-rc.1`, and run the same generation and validation
sequence. The reviewed versions must be the RC 2 values in the table.

Upgrade at least one active external consumer per adapter from RC 1 to RC 2 without source
substitution. Record installation, build, runtime, accessibility, and migration findings. Resolve
every release-blocking result before recording `native-rc.1` in the soak ledger.

After recording RC 2, both commands must pass:

```bash
pnpm run check:native-prerelease-readiness
pnpm run check:native-device-readiness
```

`pnpm run check:native-stable-readiness` enforces these records before React Native `1.0.0`,
Compose/Wear `1.0.0`, or the SwiftUI repository tag `v1.7.0` can be published through the canonical
release workflows. Prerelease versions remain publishable so the two required RC iterations can be
created.

## 6. Graduate native stable

Exit Changesets prerelease mode only after the two soak iterations, real-consumer upgrades,
distribution checks, and full physical-device matrix pass:

```bash
pnpm exec changeset pre exit
pnpm run version-packages
pnpm exec changeset status
```

Review that the npm targets are `@santi020k/lumen-react-native@1.0.0` and
`@santi020k/lumen@1.7.0`. Set Compose and Wear to `1.0.0`, regenerate the release metadata, remove
the SwiftUI Beta label, publish the final migration notes, and run the complete release gates. Do
not approve the stable release if either machine-readable readiness command fails.

After public publication, verify npm, the peeled `v1.7.0` tag, both Maven Central coordinates, every
clean consumer build, and the upgraded real applications. Only then mark native stable release
Complete in the readiness ledger and begin the separate Lumen 2 contract RFC.
