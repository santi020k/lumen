# Lumen 2 readiness

Lumen 2 is the program for making the Lumen package family a production-supported cross-platform
design system. It is not permission to manufacture breaking web changes or to declare native
stability from component count alone.

Lumen 2 is one coordinated publication milestone. Every public npm package, React Native, Compose,
and Wear publishes at `2.0.0`, with the Swift-compatible `v2.0.0` repository tag created from the
same revision. For the initial launch, package, migration, build, security, published-artifact, and
two-release stability checks remain mandatory. The maintainer explicitly deferred incomplete
external-consumer and physical-device evidence until after publication; those ledgers remain
visible and must not be represented as complete.

## Current baseline

| Surface                    | Version source                             | Current maturity                 | Principal remaining evidence                                         |
| -------------------------- | ------------------------------------------ | -------------------------------- | -------------------------------------------------------------------- |
| Astro, React, and Elements | npm package manifests                      | Stable 2.0.0 published           | Complete immutable external-consumer qualification                   |
| React Native               | `packages/react-native/package.json`       | Stable 2.0.0 published           | Real-app adoption and physical iOS and Android validation            |
| SwiftUI                    | Repository release tag and `Package.swift` | Stable `v2.0.0` tag published    | Real-app adoption and physical Apple-platform validation             |
| WidgetKit                  | `LumenWidgetUI` product in `Package.swift` | Stable `v2.0.0` tag published    | Real-widget adoption and physical iOS, macOS, and watchOS validation |
| Compose and Wear OS        | `packages/compose/gradle.properties`       | Stable 2.0.0 artifacts published | Real-app adoption and physical Android and Wear OS validation        |

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

Audit the public React Native, SwiftUI, WidgetKit, Compose, and Wear OS APIs before their stable release. Make
necessary pre-2 breaking corrections, then hold the supported contracts
stable through at least two consecutive ordinary published-release iterations.

The audit must:

- classify every export as supported, Experimental, deprecated, or internal;
- compare shared names, semantic roles, states, variants, accessibility behavior, and ownership
  boundaries without forcing platform-inappropriate parity;
- resolve accidental differences in defaults and state semantics;
- confirm that applications own navigation, lifecycle, persistence, permissions, and other
  product behavior documented as outside Lumen;
- record every intentional platform-specific API in `docs/native-components.md`;
- add migration notes for every breaking pre-2 correction; and
- leave `pnpm run check:native-contracts` enforcing the frozen shared contract.

The declaration-level classifications and enforcement progress are recorded in the
[Native API audit](native-api-audit.md). `pnpm run check:native-api-baseline` prevents unclassified
React Native entrypoint changes; reviewed binary API dumps protect Compose and Wear OS; and
`pnpm run check:swift-api-baseline` rebuilds and classifies every declared Apple target. The
[Native contract review](native-contract-review.md) records the accepted shared defaults, state
semantics, ownership boundaries, and intentional platform differences.

No new shared primitive should enter the stable native surface after the freeze unless it closes a
documented consumer blocker. Other new work remains Experimental until after the stable release.

### 2. Continue validating real consumer applications after launch

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

At least one consumer per adapter should complete an upgrade between two stability iterations. This
proves the release and migration path rather than only a clean initial installation. Missing
consumer evidence is post-release qualification work for the initial 2.0.0 publication.

### 3. Complete physical-device accessibility validation after launch

Complete every required entry in the [native device validation
matrix](native-device-validation.md). Simulator, emulator, snapshot, unit, and accessibility-tree
checks remain required automated evidence, but they do not replace physical-device results.

Every matrix entry must identify the tested revision. For the initial coordinated launch, every
complete physical-device pass and the web consumer candidate must reference the contract's exact
`approval.reviewedRevision`; changing that candidate invalidates the prior approval and evidence.
Each matrix entry must also include:

- minimum-baseline and current-device coverage where the matrix requires both;
- VoiceOver or TalkBack navigation and announcements;
- keyboard, switch, rotary, or other platform-relevant input;
- maximum text or display scaling;
- reduced motion and increased or high contrast;
- rotation, compact layouts, and round-screen clipping where applicable; and
- an evidence link plus resolved issues for every blocking failure.

Pending and Partial entries remain genuine gaps. `pnpm run check:native-device-readiness` and
`pnpm run check:native-stable-readiness` continue to report the full qualification state, but the
initial npm and Compose publication workflows do not use them as launch gates. They remain the
completion target for post-release platform qualification.

### 4. Prove distribution and upgrade paths

Test the artifacts that consumers actually install, not only workspace source builds.

| Adapter      | Required published-artifact proof                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React Native | Pack the npm tarball, install it into a clean supported Expo/React Native application, build iOS and Android, and verify the declared peer range                          |
| SwiftUI      | Resolve an immutable semantic repository tag in a clean Xcode and Swift Package Manager consumer, build every declared platform, and verify resources and license notices |
| WidgetKit    | Resolve `LumenWidgetUI` from the same immutable tag in a clean consumer and build its focused macOS, iOS, and watchOS targets without linking `LumenUI`                    |
| Compose      | Resolve signed published artifacts through the intended Maven workflow in a clean Android consumer and verify phone, tablet, and publication metadata                     |
| Wear OS      | Resolve the separate Wear artifact in a clean watch consumer and verify that phone applications do not acquire wearable-only dependencies                                 |

The exact release candidate must also pass the mandatory package and platform-build checks:

```bash
pnpm run build
pnpm run typecheck
pnpm run test
pnpm run lint
pnpm run check:security
pnpm run check:publish-dry-run
pnpm run check:consumer-packages
pnpm run check:native-stability-soak
swift test
(cd packages/compose && ./gradlew test lint apiCheck assembleDebugAndroidTest verifyMavenPublication)
pnpm run playground:apple:build
pnpm run playground:android:build
```

Run the packed consumer and release-canary workflows against the exact published revision. Record
commands that require signing credentials or physical devices as post-release qualification
evidence rather than marking them complete without a real result.

### 5. Launch the coordinated Lumen 2 package family

When the frozen contracts, package validation, published-artifact proof, and two stability
iterations are complete:

- publish every public npm package, including `@santi020k/lumen-react-native`, at `2.0.0`;
- publish `lumen-compose` and `lumen-compose-wear` at `2.0.0`;
- create the immutable `v2.0.0` repository tag, then create `compose-v2.0.0` on that same commit;
- update the README, platform guides, native reference, compatibility matrix, release manifest, and
  package changelogs together; and
- publish concise migration notes from the last pre-2 release.

The stable-readiness gate compares the initial `2.0.0` release manifest with the complete public
workspace package inventory, so an omitted or lagging npm package cannot silently bypass the
coordinated launch. It continues requiring that exact milestone until the contract records
immutable graduation evidence; only then may later 2.x releases version independently.

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

- the machine-readable contract is marked `approved` with an attributable approval record tied to
  the reviewed release candidate revision and immutable HTTPS evidence;
- every breaking change solves an observed consumer, accessibility, performance, or maintainability
  problem;
- affected in-repository consumers have a tested migration, while incomplete external-consumer
  results remain accurately recorded;
- the release manifest lists all deprecations, removals, runtime changes, and any codemod;
- package READMEs, `docs/ai-usage.md`, registry metadata, MCP snapshots, examples, and templates agree
  on the new contracts; and
- the exact release revision passes the mandatory package, migration, build, security,
  compatibility, artifact, and stability checks.

Do not invent breaking web changes to justify the major. The coordinated production-support
contract is the release reason; any actual breaking change still needs evidence and migration notes.

## Readiness ledger

This ledger is the release decision record. Change a gate to Complete only when its linked evidence
proves every exit condition above.

| Gate                        | Status                                                           | Required record                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clean release baseline      | Complete (2026-08-24)                                            | [Release 1.6 baseline evidence](#release-16-baseline-evidence)                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Native contract freeze      | Complete; soak 2/2 (2026-08-28)                                  | [Native API audit](native-api-audit.md), [Native contract review](native-contract-review.md), [Native release runbook](native-release-runbook.md), and the stability soak ledger                                                                                                                                                                                                                                                                                                    |
| Real consumer validation    | Post-release qualification incomplete                            | [Native consumer validation](native-consumer-validation.md), [web consumer validation](web-consumer-validation.md), and their machine-readable ledgers: immutable active-consumer qualification remains required                                                                                                                                                                                                                                                                    |
| Physical-device validation  | Incomplete                                                       | Completed native device matrix with evidence links; exact package minimums and explicit Partial blockers are machine-enforced                                                                                                                                                                                                                                                                                                                                                       |
| Distribution validation     | Complete (2026-08-28)                                            | The first [published-native run](https://github.com/santi020k/lumen/actions/runs/33139186529), second [npm/Swift release](https://github.com/santi020k/lumen/actions/runs/33149488101), second [Maven release](https://github.com/santi020k/lumen/actions/runs/33149826124), coordinated [npm/Swift 2.0.0 release](https://github.com/santi020k/lumen/actions/runs/33206832772), and coordinated [Maven 2.0.0 release](https://github.com/santi020k/lumen/actions/runs/33207266786) |
| Coordinated Lumen 2 release | Complete (2026-08-28)                                            | Every public package and platform published at `2.0.0` from revision `c8ebda903f64d116635227a3e49017c84b4af6f1`, with documentation and migration notes                                                                                                                                                                                                                                                                                                                             |
| Version 2 contract approval | Approved and graduated (2026-08-28); 3/3 investigations resolved | [Lumen 2 contract proposal](lumen-2-contract.md), the checked-in contract, tested migrations, and immutable publication evidence                                                                                                                                                                                                                                                                                                                                                    |

The completed pre-2 soak remains the graduation evidence for Lumen 2. Current post-2 native API
work starts a new qualification cycle recorded in `registry/native-stability-soak.json`. Until that
cycle is complete, release validation checks the ledger and current baseline hashes without treating
the unfinished iterations as a publication blocker.

### Release 1.6 baseline evidence

The release baseline was verified on 2026-08-24:

- [release pull request 39](https://github.com/santi020k/lumen/pull/39) is merged, and the release
  branch and `origin/main` trees are identical;
- `v1.6.0`, `compose-v0.5.0`, `@santi020k/lumen@1.6.0`, and
  `@santi020k/lumen-react-native@0.5.0` resolve to the published `origin/main` revision;
- all ten npm packages in `registry/release-manifest.json` resolve at their expected versions;
- `com.santi020k:lumen-compose:0.5.0` and `com.santi020k:lumen-compose-wear:0.5.0` resolve from Maven
  Central;
- `pnpm run check:release-manifest`, `pnpm run check:swift-version`, and
  `pnpm run check:compose-version` pass; and
- Swift Package Manager builds the current package and its `v1.6.0` API baseline with no detected
  breaking changes.

Target-specific candidate validation found that the published `v1.6.0` Swift package cannot build
all declared platforms: tvOS exposes APIs whose underlying SwiftUI types are unavailable there. The
existing tag was not moved. The correction was subsequently published in the immutable semantic
prerelease tag `v1.7.0-rc.0`, which resolves to `63abc0443f8e9f72dc8a010b4c5f89d3ee34c576`.

`pnpm run check:swift-package-release -- --version 1.7.0-rc.0` resolved that exact public GitHub tag
from an independent SwiftPM consumer, verified its peeled revision, notices, and resource catalog,
and built macOS, iOS, tvOS, and watchOS on 2026-08-27. This completes the Swift artifact-distribution
proof. Because it is a prerelease, it does not count as either required ordinary stability-soak
iteration.

### First ordinary stability-release distribution evidence

The first ordinary pre-2 release was published from revision
`a3f3c7a05ba7f9fe30554b32d67c86f3aa5dfd46`. The immutable `v1.7.0` Swift and npm release tag,
`compose-v0.6.0` Maven source tag, npm package versions in `registry/release-manifest.json`, and both
Maven Central coordinates resolve to that revision.

[Published-native run 33139186529](https://github.com/santi020k/lumen/actions/runs/33139186529)
then verified the public release rather than workspace substitutions: it matched registry
signatures, provenance, checksums, PGP signatures, tags, and source revision before building clean
SwiftUI consumers for every declared Apple platform, React Native consumers for iOS and Android,
and separate Compose phone and Wear consumers. This closes distribution proof for the first
ordinary release. It does not replace active external-consumer, signed-current-application,
accessibility, physical-device, or stability-soak evidence.

### Second ordinary stability-release distribution evidence

The second ordinary pre-2 release was published from revision
`623e3fadf036dab79dc25cf04c5e2e4e4d1734a9`. The immutable `v1.8.0` Swift and npm release tag,
`compose-v0.7.0` Maven source tag, npm package versions in `registry/release-manifest.json`, and both
Maven Central coordinates resolve to that revision.

[Release run 33149488101](https://github.com/santi020k/lumen/actions/runs/33149488101) validated and
published the npm family and created `v1.8.0`.
[Maven run 33149826124](https://github.com/santi020k/lumen/actions/runs/33149826124) validated the
unchanged native API baselines, built the signed Central bundle, uploaded Compose and Wear 0.7.0,
and reached the published state. The dedicated
[published-native run 33156420758](https://github.com/santi020k/lumen/actions/runs/33156420758)
resolved every immutable coordinate to that revision and built clean React Native iOS and Android,
Swift package, Compose, and Wear consumers from the public artifacts. Merged-main consumer runs then
passed for
[Roadscore](https://github.com/santi020k/roadscore/actions/runs/33151107060) at revision
`0eb508cd651d7a3b5688d55011cd8e41ac13a31d` and
[Between Contractions](https://github.com/santi020k/betweencontractions/actions/runs/33152073534)
at revision `4ac465a13b7ac338aceebaff2cb68ef19719043b`. This completes the required two-release native
stability soak and cross-iteration build evidence. Signed-current applications, accessibility, and
the physical-device matrix remain explicit post-release qualification work.
