# Lumen 2 readiness

Lumen 2 is the program for making the Lumen package family a production-supported cross-platform
design system. It is not permission to manufacture breaking web changes or to declare native
stability from component count alone.

Lumen 2 is one coordinated graduation milestone. Continue publishing the existing web and Swift
`1.x` lines and the independently versioned native `0.x` lines while native remains Beta. When all
readiness gates pass, publish every public npm package, React Native, Compose, and Wear at `2.0.0`,
create the Swift-compatible `v2.0.0` repository tag from the same revision, and remove every native
Beta label together. No separate native release-candidate version train is required.

## Current baseline

| Surface | Version source | Current maturity | Principal remaining evidence |
| --- | --- | --- | --- |
| Astro, React, and Elements | npm package manifests | Stable 1.x | Coordinated Lumen 2 contract and migration approval |
| React Native | `packages/react-native/package.json` | Beta 0.x | Real-app adoption and physical iOS and Android validation |
| SwiftUI | Repository release tag and `Package.swift` | Beta at the umbrella version | Real-app adoption and physical Apple-platform validation |
| Compose and Wear OS | `packages/compose/gradle.properties` | Beta 0.x | Real-app adoption and physical Android and Wear OS validation |

The exact versions are recorded in `registry/release-manifest.json`. The compatibility baselines
are recorded in [Native compatibility](native-compatibility.md), and the incomplete hardware
evidence is recorded in [Native device validation](native-device-validation.md).

## Release sequence

The command-level version, publication, verification, and evidence sequence lives in the
[Native release runbook](native-release-runbook.md). It uses two ordinary published releases on the
current version lines as stability iterations before the coordinated `2.0.0` launch.

### 0. Establish a clean release baseline

Complete the current release workflow before beginning version 2 contract work. The repository tag,
npm package family, Swift package reference, Compose artifacts, changelogs, and release manifest
must describe the same intended release.

Evidence:

- `pnpm run check:release-manifest` passes at the release revision.
- Every npm package named by the release reports the expected registry version.
- The repository release tag resolves to the published revision and is usable through Swift Package
  Manager.
- Both Compose coordinates resolve from Maven Central at the version in the release manifest.
- The working branch contains no version-only release changes that still need to merge to `main`.

### 1. Freeze the Lumen 2 native contracts

Audit the public React Native, SwiftUI, Compose, and Wear OS APIs before their stable release. Make
necessary breaking corrections while the adapters are Beta, then hold the supported contracts
stable through at least two consecutive ordinary published-release iterations.

The audit must:

- classify every export as supported, Experimental, deprecated, or internal;
- compare shared names, semantic roles, states, variants, accessibility behavior, and ownership
  boundaries without forcing platform-inappropriate parity;
- resolve accidental differences in defaults and state semantics;
- confirm that applications own navigation, lifecycle, persistence, permissions, and other
  product behavior documented as outside Lumen;
- record every intentional platform-specific API in `docs/native-components.md`;
- add migration notes for every breaking Beta correction; and
- leave `pnpm run check:native-contracts` enforcing the frozen shared contract.

The declaration-level classifications and enforcement progress are recorded in the
[Native API audit](native-api-audit.md). `pnpm run check:native-api-baseline` prevents unclassified
React Native entrypoint changes; reviewed binary API dumps protect Compose and Wear OS; and
`pnpm run check:swift-api-baseline` rebuilds and classifies every declared Apple target. The
[Native contract review](native-contract-review.md) records the accepted shared defaults, state
semantics, ownership boundaries, and intentional platform differences.

No new shared primitive should enter the stable native surface after the freeze unless it closes a
documented consumer blocker. Other new work remains Experimental until after the stable release.

### 2. Validate real consumer applications

Each native adapter needs at least one active application that is not a Lumen playground or a test
fixture. A single product may cover multiple adapters only when it genuinely ships and exercises
each implementation.

For every consumer, record:

- the repository or product owner and the pinned Lumen version or revision;
- the target platforms, minimum operating-system versions, and build toolchain;
- the supported components exercised in real product flows;
- installation, theming, icon, state-management, and upgrade findings;
- any compatibility wrappers or application-owned workarounds; and
- the issue or pull request that resolves each release-blocking finding.

At least one consumer per adapter must complete an upgrade between two stability iterations. This
proves the release and migration path rather than only a clean initial installation.

### 3. Complete physical-device accessibility validation

Complete every required entry in the [native device validation
matrix](native-device-validation.md). Simulator, emulator, snapshot, unit, and accessibility-tree
checks remain required automated evidence, but they do not replace physical-device results.

Every matrix entry must identify the tested revision and include:

- minimum-baseline and current-device coverage where the matrix requires both;
- VoiceOver or TalkBack navigation and announcements;
- keyboard, switch, rotary, or other platform-relevant input;
- maximum text or display scaling;
- reduced motion and increased or high contrast;
- rotation, compact layouts, and round-screen clipping where applicable; and
- an evidence link plus resolved issues for every blocking failure.

The adapter cannot graduate while any required matrix entry is Pending or Partial.
`pnpm run check:native-device-readiness` enforces that condition against the machine-readable
physical-device evidence ledger. `pnpm run check:native-stable-readiness` combines the device and
stability-soak gates, rejects an uncoordinated native version 2 launch, and is run by the npm and
Compose publication workflows.

### 4. Prove distribution and upgrade paths

Test the artifacts that consumers actually install, not only workspace source builds.

| Adapter | Required published-artifact proof |
| --- | --- |
| React Native | Pack the npm tarball, install it into a clean supported Expo/React Native application, build iOS and Android, and verify the declared peer range |
| SwiftUI | Resolve an immutable semantic repository tag in a clean Xcode and Swift Package Manager consumer, build every declared platform, and verify resources and license notices |
| Compose | Resolve signed published artifacts through the intended Maven workflow in a clean Android consumer and verify phone, tablet, and publication metadata |
| Wear OS | Resolve the separate Wear artifact in a clean watch consumer and verify that phone applications do not acquire wearable-only dependencies |

The exact release under validation must also pass:

```bash
pnpm run validate
swift test
(cd packages/compose && ./gradlew test lint apiCheck assembleDebugAndroidTest verifyMavenPublication)
pnpm run playground:apple:build
pnpm run playground:android:build
```

Run the packed consumer and release-canary workflows against the exact published revision. Record
commands that require signing credentials or physical devices as release evidence rather than
weakening or skipping them silently.

### 5. Launch Lumen 2 and graduate every adapter

When gates 1 through 4 are complete:

- publish every public npm package, including `@santi020k/lumen-react-native`, at `2.0.0`;
- publish `lumen-compose` and `lumen-compose-wear` at `2.0.0`;
- create the immutable `v2.0.0` repository tag and remove the SwiftUI Beta label;
- update the README, platform guides, native reference, compatibility matrix, release manifest, and
  package changelogs together; and
- publish concise migration notes from the last Beta release.

The pre-2.0 version differences remain part of the immutable release history. Version 2 deliberately
aligns the public package family and platform adapters under one production-support milestone.

## Stable native compatibility policy

After graduation, supported native APIs follow semantic versioning:

- backward-compatible capabilities release as minors and fixes as patches;
- a deprecation ships in a minor release with a replacement and migration example;
- deprecated APIs remain available until the next major release;
- minimum operating-system, SDK, React, or React Native baseline increases are breaking changes;
- Experimental APIs may change in a minor release, but must be clearly labeled in source and docs;
  and
- an emergency security or correctness removal must explain the exception and the safest available
  migration in the release notes.

## Approve the version 2 contract

Before graduation, approve the [Lumen 2 contract proposal](lumen-2-contract.md), which lists each
proposed breaking change, affected package, consumer evidence, replacement contract, migration, and
removal rationale. Its machine-readable source is `registry/lumen-2-contract.json`.
The proposal must distinguish changes that require a major from compatible improvements that belong
in version 1.

Version 2 is approved only when:

- every breaking change solves an observed consumer, accessibility, performance, or maintainability
  problem;
- affected in-repository and recorded external consumers have a tested migration;
- the release manifest lists all deprecations, removals, runtime changes, and any codemod;
- package READMEs, `docs/ai-usage.md`, registry metadata, MCP snapshots, examples, and templates agree
  on the new contracts; and
- the exact release revision passes the complete validation and consumer matrix.

Do not invent breaking web changes to justify the major. The coordinated production-support
contract is the release reason; any actual breaking change still needs evidence and migration notes.

## Readiness ledger

This ledger is the release decision record. Change a gate to Complete only when its linked evidence
proves every exit condition above.

| Gate | Status | Required record |
| --- | --- | --- |
| Clean release baseline | Complete (2026-08-24) | [Release 1.6 baseline evidence](#release-16-baseline-evidence) |
| Native contract freeze | Supported and Experimental surfaces classified; soak 0/2 | [Native API audit](native-api-audit.md), [Native contract review](native-contract-review.md), [Native release runbook](native-release-runbook.md), and the stability soak ledger |
| Real consumer validation | Technical validation in progress | [Native consumer validation](native-consumer-validation.md): active-product confirmation and one upgrade per adapter |
| Physical-device validation | Incomplete | Completed native device matrix with evidence links |
| Distribution validation | Partial | Packed and public React Native native builds, exact-candidate and public Compose/Wear consumers, and a disposable tagged Swift candidate across every Apple platform pass; the corrected public immutable Swift tag remains |
| Coordinated Lumen 2 release | Blocked by prior gates | Every public package and platform at `2.0.0`, documentation, and migration notes |
| Version 2 contract approval | Draft; 1/3 investigations resolved | [Lumen 2 contract proposal](lumen-2-contract.md) with tested migrations and no manufactured web breakage |

### Release 1.6 baseline evidence

The release baseline was verified on 2026-08-24:

- [release pull request 39](https://github.com/santi020k/lumen/pull/39) is merged, and the release
  branch and `origin/main` trees are identical;
- `v1.6.0`, `compose-v0.5.0`, `@santi020k/lumen@1.6.0`, and
  `@santi020k/lumen-react-native@0.5.0` resolve to the published `origin/main` revision;
- all ten npm packages in `registry/release-manifest.json` resolve at their expected versions;
- `com.santi020k:lumen-compose:0.5.0` and `com.santi020k:lumen-compose-wear:0.5.0` resolve from Maven
  Central;
- `pnpm run check:release-manifest` and `pnpm run check:compose-version` pass; and
- Swift Package Manager builds the current package and its `v1.6.0` API baseline with no detected
  breaking changes.

Target-specific candidate validation found that the published `v1.6.0` Swift package cannot build
all declared platforms: tvOS exposes APIs whose underlying SwiftUI types are unavailable there. The
current source corrects those availability boundaries, but the clean tagged-consumer requirement
remains blocked until that patch is published under a new immutable semantic tag. The existing tag
must not be moved.

`pnpm run check:swift-package-candidate` copies the current candidate into a disposable Git
repository, creates a semantic prerelease tag, resolves that exact tag from an independent SwiftPM
consumer, verifies its revision, notices, and resource catalog, and builds macOS, iOS, tvOS, and
watchOS. After publishing the corrective tag, rerun the same proof against GitHub with
`pnpm run check:swift-package-release -- --version <version>`.
