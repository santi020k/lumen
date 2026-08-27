# Native consumer validation

<!-- cspell:words Roadscore -->

This document records candidate and qualifying applications for the real-consumer gate in the
[Lumen 2 readiness plan](lumen-2-readiness.md). A repository reference alone is discovery evidence,
not proof that an adapter is production-ready.

## Qualification requirements

A qualifying consumer must:

- be an active application rather than a Lumen playground, fixture, or package smoke test;
- install a published Lumen artifact or immutable release tag;
- exercise supported components in real product flows;
- pass its normal build and affected test or validation commands;
- record installation, theming, accessibility, and integration findings; and
- complete a verified upgrade between two native stability iterations.

The product owner must confirm active application status. Local source presence or a successful
build does not by itself establish that the application is active or shipped.

`registry/native-consumer-evidence.json` is the machine-readable qualification ledger. Run
`pnpm run check:native-consumer-evidence` after updating a technical record and
`pnpm run check:native-consumer-readiness` for the stable-release gate. A Complete entry requires
an owner-confirmed active product, an immutable published-artifact upgrade, supported component
usage, installation and theming review, accessibility and integration checks, a signed application
artifact, immutable HTTPS evidence, and no blocking findings. Prose in this document cannot bypass
that gate.

For a Complete record, the checker requires an external HTTPS repository, an immutable revision
URL containing the exact lowercase 40-character consumer upgrade commit, and a permanent workflow,
pipeline, job, or signed-build URL from that same declared consumer repository. Evidence from an
unrelated repository, mutable branch pages, workflow definitions, query strings, fragments, and
Lumen's own fixtures cannot qualify an adapter.

## Discovered candidates

The local sibling-project scan on 2026-08-24 found the following candidates. No external repository
was changed during discovery.

| Adapter      | Candidate            | Current evidence                                                                                                                                                                                                                           | Qualification status                                                                                                                                |
| ------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| React Native | Roadscore mobile     | Expo 57 and React Native 0.86.2 application upgraded from `@santi020k/lumen-react-native@0.3.0` to `0.4.0`; frozen install, direct lint/typecheck, and iOS/Android/web Expo export pass; a disposable 0.5.0 upgrade passes the same checks | Owner-confirmed active product; an immutable repository record, signed native EAS build, accessibility pass, and physical-device evidence remain      |
| SwiftUI      | ContracTrack         | Exact Lumen upgrade from 1.4.0 to 1.5.0 across iOS, macOS, and watchOS; all three application schemes build against the resolved tag                                                                                                       | Owner-confirmed active product with an immutable upgrade and signed archive; accessibility and physical-device confirmation remain                    |
| SwiftUI      | Workscene            | Exact Lumen 1.5.0 dependency in a macOS application with multiple Lumen-backed feature and settings views                                                                                                                                  | Candidate; build, active-product confirmation, findings, and upgrade evidence remain                                                                |
| SwiftUI      | Coolstead            | Pending exact 1.4.0 to 1.5.0 upgrade in a macOS application; strict formatting, warning-as-error builds, release-metadata validation, and 42 tests pass                                                                                    | Technical build and upgrade validation complete for the pending 1.5.0 integration; active-product confirmation and physical-product evidence remain |
| SwiftUI      | PostLens             | Exact Lumen 1.5.0 dependency in an iOS application with multiple Lumen-backed product flows; simulator build, standalone type-check, smoke checks, and 434 tests pass                                                                      | Technical build validation complete for 1.5.0; upgrade, active-product confirmation, and physical-device evidence remain                            |
| WidgetKit    | ContracTrack widgets | Maintained iOS, macOS, and watchOS widget extensions motivated the focused `LumenWidgetUI` contract; package-level API and candidate checks exist, but the product has not been adopted from two ordinary immutable tags                   | Owner confirmed; pending adoption, tagged upgrade, signed extensions, and physical-device accessibility evidence                                    |
| Compose      | ContracTrack Android | Published `com.santi020k:lumen-compose:0.4.0` integrated into the phone application; unit tests and debug APK build pass; a disposable 0.5.0 upgrade passes unchanged source                                                               | Owner-confirmed active product with a signed Play artifact; the 0.5.0 upgrade remains mutable and physical-device/accessibility evidence remains      |
| Wear OS      | ContracTrack Wear    | Published `com.santi020k:lumen-compose-wear:0.4.0` integrated into the separate watch application; unit tests and debug APK build pass; a disposable 0.5.0 upgrade passes unchanged source                                                 | Owner-confirmed active product; the 0.5.0 upgrade, signed watch artifact, accessibility pass, and physical-watch confirmation remain                  |

## Owner confirmation and current workspace audit

On 2026-08-27, Santiago Molina confirmed that the machine-readable Roadscore and ContracTrack
consumers are active products being developed toward store approval. This closes the owner and
active-product checks for integrations that already have technical evidence. It does not assert
store approval, signed distribution, accessibility, or physical-device results that are not
recorded separately.

The same-day sibling-repository audit found:

- Roadscore remains a local-only repository whose working tree upgrades React Native from 0.3.0 to
  0.4.0. Without an origin remote, it still cannot provide an immutable HTTPS consumer record.
- ContracTrack's current dirty working tree advances SwiftUI from 1.5.0 to 1.6.0 and Compose/Wear
  from 0.4.0 to 0.5.0. Those changes are useful candidate evidence but remain mutable.
- PostLens resolves SwiftUI 1.7.0-rc.0 at revision
  `63abc0443f8e9f72dc8a010b4c5f89d3ee34c576` on remote branch `feat/lumen-1-2-ios`. The remote
  consumer record is immutable, but a release candidate cannot qualify as an ordinary stability
  iteration.
- Coolstead and Workscene resolve exact SwiftUI 1.5.0 dependencies. They remain secondary macOS
  candidates rather than substitutes for the required cross-iteration evidence.

## Maintained candidate dispatch workflows

On 2026-08-27, repository-specific `lumen-canary.yml` workflows were prepared in the maintained
[website](https://github.com/santi020k/website),
[Aaron MGZ](https://github.com/santi020k/aaronmgz),
[PostLens](https://github.com/santi020k/post-lens), and
[Between Contractions](https://github.com/santi020k/betweencontractions) repositories. Each workflow
accepts the `lumen-candidate` repository-dispatch event or an explicit immutable HTTPS release
manifest URL. They select exact manifest versions and report package-policy, resolution, type/API,
lint/tooling, build, and device classifications separately. They do not use publishing or store
credentials and do not claim physical-device evidence.

Local disposable-copy validation established the candidate paths before remote adoption:

- the Astro website resolved `@santi020k/lumen-astro`, `@santi020k/lumen`, and
  `@santi020k/lumen-core` at `1.7.0-rc.0`; Astro check, zero-warning lint, 301 tests, and the
  379-page production build passed;
- the Aaron React workspace resolved `@santi020k/lumen-react`, `@santi020k/lumen`, and
  `@santi020k/lumen-core` at `1.7.0-rc.0`; strict type-check, zero-warning lint, and the full Turbo
  build passed;
- PostLens resolved the exact Swift tag `1.7.0-rc.0` at revision
  `63abc0443f8e9f72dc8a010b4c5f89d3ee34c576`; strict formatting, validation, core tests, and the
  simulator build passed; and
- the Between Contractions phone and Wear applications resolved `lumen-compose` and
  `lumen-compose-wear` at `0.5.0`; dependency insight, unit tests, Android lint, and debug assembly
  passed.

These workflow files and local runs are preparation evidence, not an immutable remote canary record.
They must be reviewed, committed, and pushed in their owning repositories before Lumen can dispatch
the manifest to their default branches. The first successful remote runs must be linked here before
external canaries become a stable-release requirement.

## Validation records

### Roadscore React Native 0.4.0

Validated on 2026-08-24 at repository revision
`8a954bc4aae51f0d28c000bb490118317775821a`, preserving the candidate's existing uncommitted source
and lockfile changes. The reviewed diff upgrades the workspace catalog from 0.3.0 to 0.4.0 and
replaces product-local presentation with additional public Lumen components.

The frozen lockfile resolves `@santi020k/lumen-react-native@0.4.0`. The application exercises
`LumenProvider`, `LumenSurface`, `LumenText`, `LumenButton`, `LumenCard`, `LumenTextField`,
`LumenTextarea`, `LumenToggle`, `LumenSegmentedControl`, `LumenBadge`, `LumenEmptyState`, `LumenErrorState`,
`LumenListRow`, `LumenSectionHeader`, and `LumenStat` across home, setup, play, prompt, and result
flows.

Evidence:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm --filter @santi020k/roadscore-mobile why @santi020k/lumen-react-native
corepack pnpm --filter @santi020k/roadscore-mobile run lint
corepack pnpm --filter @santi020k/roadscore-mobile run typecheck
corepack pnpm --filter @santi020k/roadscore-mobile exec expo export --platform all --output-dir <temporary-directory>
```

All commands passed with pnpm 10.34.3. The Expo export produced Hermes bundles for iOS and Android
plus the static web routes. One reproducibility finding was recorded: the existing `node_modules`
tree still contained 0.3.0 even though the lockfile selected 0.4.0. A frozen install corrected the
local installation without changing tracked source. Release evidence must always confirm the
resolved package rather than trusting an already-installed workspace.

A disposable copy then changed only the catalog dependency to 0.5.0. The resolved application used
React 19.2.3, React Native 0.86.2, and `react-native-svg` 15.15.5, satisfying Lumen's declared peer
ranges. Direct lint, typecheck, and all-platform Expo export passed without a source migration. The
install reported unrelated existing ESLint and TypeScript tooling peer warnings, but no Lumen peer
warning.

The package-candidate guard also packs the local React Native package, installs the tarball without
legacy peer resolution into a clean temporary consumer at the supported Expo peer versions, verifies
the published files and peer metadata, and compiles representative component usage under strict
TypeScript. Separate native guards install the same packed artifact in a clean Expo 57 consumer,
exercise controlled Picker and Slider state plus Gauge output, generate native projects, and require
an Android debug APK and an unsigned iOS Simulator application from Gradle and Xcode respectively.
The public-release guard preserves the historical fixture for 0.5.x, before those controls entered
the React Native package, and enables the expanded fixture for 0.6.0 and newer. This closes the React
Native artifact-distribution gate. A signed Roadscore EAS build remains real-product evidence rather
than package-shape evidence.

Evidence:

```bash
pnpm run check:react-native-package
pnpm run check:react-native-native-package:android
pnpm run check:react-native-native-package:ios
pnpm run check:react-native-native-release:android -- --version 0.5.0
pnpm run check:react-native-native-release:ios -- --version 0.5.0
```

The two release commands also pass against the public `0.5.0` npm artifact, producing a clean
Android debug APK and unsigned iOS Simulator application without a workspace package substitution.
The local candidate commands pass with the expanded value-control fixture on both platforms.

A configuration audit on 2026-08-27 also closed the record's operating-system, icon, and
state-ownership gaps. Roadscore declares Node.js 22.19 or newer and pnpm 10.34.3, with Expo 57,
React Native 0.86.2, React 19.2.3, and TypeScript 6.0.3. Its app configuration does not override the
native deployment targets; clean Expo native project generation from that configuration produced iOS 16.4 and
Android API 24 minimums with Android compile and target SDK 36. The same configuration includes an
iOS icon catalog and Android foreground, background, monochrome, and adaptive icon assets.

Product navigation stays in Expo Router, while the application owns game state and persistence
through a typed Zustand store backed by AsyncStorage. `LumenProvider` remains the presentation
boundary and does not own navigation, persistence, or product lifecycle. These facts complete the
technical icon and state-management checks. Active-product confirmation, an accessibility review,
a signed EAS application, and an immutable repository record remain outstanding; the local
Roadscore repository has no configured origin remote.

### ContracTrack native consumers

Validated on 2026-08-24 at repository revision
`7327aaa8f68b88bb98fa29487c469170866b258d`, preserving the application's existing uncommitted
Apple, Android, Wear, website, and backend work.

The Apple project upgrades its exact Lumen dependency from 1.4.0 to 1.5.0. `Package.resolved`
selects revision `d5f120deb1402aa53fac903566e06b28c35dd830`. The iOS and macOS application uses
`LumenTheme` and `LumenGraphic`; the watch application uses `LumenWatchActionButton`,
`LumenWatchProgressRing`, `LumenWatchStatus`, and `LumenWatchListRow`. Direct, unsigned builds of
the `BetweenContractions`, `BetweenContractionsMac`, and `BetweenContractionsWatch` schemes passed
for generic iOS Simulator, macOS, and watchOS Simulator destinations.

The Android version catalog selects `lumen-compose` and `lumen-compose-wear` 0.4.0 from Maven
Central. Gradle dependency insight confirmed both exact release variants. The phone application
uses `LumenTheme`, `LumenNavigationBar`, and `LumenNavigationItem`; the separate Wear application
uses `LumenWearTheme`, `LumenWearActionButton`, `LumenWearProgressRing`, `LumenWearStatus`, and
`LumenWearTone`. `./gradlew testDebugUnitTest assembleDebug` passed for both modules on JDK 21.

That exercised Wear subset is the Supported pre-1.0 contract. The unexercised metric and list-row
compositions remain visibly Experimental, while implementation-only sizing, progress, and color
helpers have been removed from the public ABI before the stability soak.

No compatibility wrapper was required. Product navigation, state, localization, persistence,
connectivity, and Material or SwiftUI application themes remain application-owned. Compose and Wear
also passed a disposable 0.4.0 to 0.5.0 upgrade: dependency insight selected both 0.5.0 release
variants and unchanged consumer source passed `testDebugUnitTest assembleDebug`. The verified copy
was discarded rather than overwriting the application's in-progress 0.4.0 integration.

The exact consumer revision records iOS 17.0, macOS 14.0, and watchOS 10.0 deployment targets in
its XcodeGen project, with Swift 5.9 or newer and Xcode 26 as the documented Apple toolchain. The
Android phone uses API 29 and the separate Wear application uses API 30; both use the Gradle 9.7.0
wrapper, Android Gradle Plugin 9.3.1, Kotlin 2.4.10, Temurin JDK 21 in CI, and JVM 11 bytecode.

Icon integration is application-owned and exercised rather than delegated to Lumen: Apple targets
compile their AppIcon catalogs and pass SF Symbols through Lumen wearable components; the Compose
phone passes Material `ImageVector` values through `LumenNavigationItem`; and the separate Wear APK
provides its own adaptive launcher icon. This closes the minimum-OS, toolchain, and icon review for
all three ContracTrack adapter records. At the time of that original validation, owner confirmation,
accessibility and physical-device review, signed application artifacts, and an immutable upgrade
commit still remained; the later evidence below closes only the supported owner, artifact, and
Swift upgrade checks.

A later repository audit found that the Swift 1.5.0 adoption is now preserved in immutable remote
commit [`510d76df032e103f6b1f99614597d5f2f57ed64b`](https://github.com/santi020k/betweencontractions/commit/510d76df032e103f6b1f99614597d5f2f57ed64b).
Immutable main-branch release evidence at
[`c4b24b776de36aaa38e815a92ca9fd580f817a61`](https://github.com/santi020k/betweencontractions/blob/c4b24b776de36aaa38e815a92ca9fd580f817a61/docs/RELEASE_CHECKLIST.md)
records an Apple distribution-signed iOS 1.0.7 archive that passed local and Apple server validation
with its Watch and widget targets, plus a signature-verified Android 1.0.5 AAB accepted for closed
Alpha review. Those artifacts use SwiftUI 1.5.0 and Compose/Wear 0.4.0. They close the signed-artifact
check for SwiftUI and Compose, but do not prove physical-device accessibility or turn the mutable
Compose/Wear 0.5.0 candidate into immutable upgrade evidence.

The package-candidate workflow now publishes both local candidate AARs to a temporary Maven
repository and builds separate phone and watch APK consumers from those coordinates. The phone
consumer additionally inspects its resolved runtime graph and fails if it acquires
`lumen-compose-wear`. This proves artifact metadata, the transitive Wear-to-foundation dependency,
and phone/watch separation against the exact candidate rather than workspace source. Both consumers
also pass Android lint with no findings. The same phone and watch applications build in source
substitution mode, preventing the release-only path from drifting from local development.

Evidence:

```bash
(cd packages/compose && ./gradlew verifyMavenPublication)
./packages/compose/gradlew -p apps/playground-android clean lint
./packages/compose/gradlew -p apps/playground-android \
  clean assembleDebug :app:verifyLumenArtifactIsolation
./packages/compose/gradlew -p apps/playground-android \
  -PlumenComposeRepository=../../packages/compose/build/central-staging \
  clean assembleDebug :app:verifyLumenArtifactIsolation
```

### Coolstead macOS consumer

Validated on 2026-08-26 at repository revision
`fb16359719d033c96ace6c879706bb84caf9cca4`, preserving the application's existing uncommitted
Lumen migration. The reviewed diff upgrades the exact Swift package dependency from 1.4.0 to 1.5.0
and resolves revision `d5f120deb1402aa53fac903566e06b28c35dd830`.

The pending integration uses a product-specific `LumenTheme`, `LumenButton`, `LumenIconButton`,
`LumenLink`, `LumenPicker`, and `LumenSlider` in real dashboard, menu-bar, history, process-control,
manual fan-control, update, diagnostic, and settings flows. Strict Swift formatting passed. Two
direct warning-as-error builds passed, release metadata remained valid, and all 42 Swift tests
passed. No Lumen compatibility wrapper or consumer-side workaround was required.

Evidence:

```bash
corepack pnpm --filter @santi020k/coolstead-desktop run lint
corepack pnpm --filter @santi020k/coolstead-desktop run build
corepack pnpm --filter @santi020k/coolstead-desktop run test
corepack pnpm --filter @santi020k/coolstead-desktop run typecheck
```

This is independent technical consumer evidence for the 1.4.0 to 1.5.0 upgrade. Because the
migration remains uncommitted in the application repository, it is not yet immutable release
evidence. Active-product status and installed application behavior on representative Mac hardware
still require owner confirmation and a separate record.

### PostLens iOS consumer

Validated on 2026-08-26 at repository revision
`3147656e2708ce58ce6a06b3cc56f7541f3978f4`, preserving unrelated existing website and workspace
changes. The Xcode project and resolved package file both select exact Lumen 1.5.0 at revision
`d5f120deb1402aa53fac903566e06b28c35dd830`.

PostLens exercises Lumen in real gallery, permission, loading, score, publishing, editor, settings,
support, disclosure, and navigation flows. Its public usage includes buttons and button groups,
pickers, toggles, progress and progress-value helpers, skeletons, graphics, icons, links, dividers,
disclosures, spacing tokens, and theming.

Evidence:

```bash
corepack pnpm --filter @santi020k/postlens-ios run lint
corepack pnpm --filter @santi020k/postlens-ios run build
corepack pnpm --filter @santi020k/postlens-ios run test
corepack pnpm --filter @santi020k/postlens-ios run typecheck
```

Strict Swift formatting, a generic iOS Simulator build, five native smoke checks, the 434-test
simulator suite, and the standalone Swift type-check all passed. Xcode resolved Lumen directly from
the public 1.5.0 tag. Simulator framework diagnostics were noisy but did not produce a build or test
failure, and no Lumen-specific integration finding required a workaround. This establishes
technical consumer compatibility, not a 1.4.0 to 1.5.0 upgrade or physical-device qualification.

### Swift package distribution

The current Swift source passes a clean semantic-tag simulation independent of the workspace build.
The verifier copies only the package manifest, Swift package sources, resources, license, and notices
into a disposable Git repository; commits and tags that snapshot; then resolves the exact prerelease
tag from a separate SwiftPM consumer. `Package.resolved` must contain the tagged commit revision, the
actual checkout must contain the root and Swift-specific license notices plus the icon asset catalog,
and the consumer must build for macOS, iOS, tvOS, and watchOS.

```bash
pnpm run check:swift-package-candidate
```

The published immutable corrective tag was then verified directly from GitHub:

```bash
pnpm run check:swift-package-release -- --version 1.7.0-rc.0
```

The tag resolves to `63abc0443f8e9f72dc8a010b4c5f89d3ee34c576`. Its clean consumer verifies
the resolved revision, notices, resource catalog, and builds for macOS, iOS, tvOS, and watchOS. This
completes the Swift artifact-distribution gate without repairing or replacing `v1.6.0`. The
prerelease does not count as an ordinary stability-soak iteration.

## Next validation passes

1. Run a signed Roadscore EAS build so Expo bundles are backed by native iOS and Android artifacts,
   then publish an immutable repository record.
2. Capture ContracTrack phone and watch hardware accessibility evidence at the validated artifact
   versions.
3. Commit and remotely validate the ContracTrack Compose/Wear 0.5.0 upgrade without including
   unrelated working-tree changes.
4. Convert the successful Coolstead technical upgrade into immutable consumer evidence and record
   its installed behavior on representative Mac hardware; use Workscene if a second independent
   macOS consumer is needed.
