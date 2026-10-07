# Publishing Lumen Playground

Lumen Playground is a public, offline developer reference for Lumen UI. The iOS and macOS listings
ship the SwiftUI gallery, the Android listing ships the Compose gallery, and the React Native gallery
remains the browser and Expo demonstration. All surfaces use the same name, icon, positioning,
support URL, and privacy policy while proving the package native to their platform.

## Product contract

- The complete component catalog is available without an account or network connection.
- Search, interactive states, light and dark themes, and native accessibility behavior are core
  utility rather than store-listing decoration.
- Example preferences and forms are explicitly labeled as demonstrations. They do not register for
  notifications, download updates, submit content, or imply persistence.
- Disabled-state examples use neutral developer-workspace language. Do not label demo-only controls
  with billing, purchase, subscription, paid, or premium terms that could imply unavailable
  monetized features during store review.
- The applications contain no advertising, analytics, tracking, account system, or sensitive
  permissions. Re-audit this statement whenever dependencies or application behavior change.
- Documentation, support, and privacy links open the public Lumen website in the system browser.

## Shared listing identity

- **Name:** Lumen Playground
- **Category:** Developer Tools on Apple platforms; Libraries & Demo on Google Play
- **App Store:** [Lumen Playground for iPhone, iPad, and Mac](https://apps.apple.com/app/id6805250815)
- **Google Play:** [Lumen Playground for Android](https://play.google.com/store/apps/details?id=com.santi020k.lumen.playground.compose)
- **Support:** `https://lumen.santi020k.com/support`
- **Privacy:** `https://lumen.santi020k.com/privacy`
- **Apple marketing URL:** `https://lumen.santi020k.com/docs/apple/playground`
- **Android website:** `https://lumen.santi020k.com/docs/android/playground`

Editable English listing copy lives in `apps/playground-apple/Store/en-US`,
`apps/playground-apple/Store/macOS/en-US`, and `apps/playground-android/Store/en-US`. The Android data
declaration lives beside its listing copy. Keep screenshots and submitted metadata accurate for the
exact binary under review.

## iOS release record — September 7, 2026

- Released iOS **1.0.1 (24)** from Apple's approved manual-release state.
- App Store Connect confirmed **Ready for Distribution** after accepting the release request.
  Public storefront caches may take longer to show the new version.
- The immutable candidate is
  [`playground-ios-v1.0.1-r9`](https://github.com/santi020k/lumen/tree/playground-ios-v1.0.1-r9),
  revision `a8870f6a9ab7d0ab7af7f5966aa56c8aef8980ad`.
  The [release workflow](https://github.com/santi020k/lumen/actions/runs/33809825963)
  confirmed Xcode Cloud build 24 succeeded.
- [Download Lumen Playground](https://apps.apple.com/app/id6805250815) or open the
  [Apple playground documentation](https://lumen.santi020k.com/docs/apple/playground).
- macOS remains at **1.0 (7)** on the same listing; this release changes only iOS.

## Mobile 1.0.2 public release — September 26, 2026

- iOS **1.0.2** packages the current Lumen 3 component, icon, accessibility, and dependency fixes.
  The release is public on the App Store. Storefront propagation is not instantaneous: Apple's
  public lookup reported 1.0.2 in Colombia while the United States still returned 1.0.1 during the
  September 26 verification.
- Android **1.0.2 (3)** is public on Google Play with the current Compose gallery represented by the
  checked-in native screenshots. The public listing exposes installation and records the Lumen 3
  update on September 25.
- The macOS listing remains on its current public version. macOS release tags are now created only
  by an explicit **Launch Mac playground release** workflow dispatch so an iOS version bump cannot
  unintentionally start a Mac App Store upload.

## Android production record — September 24, 2026

- Google granted production access for `com.santi020k.lumen.playground.compose`.
- Submitted Android **1.0.0 (1)** for a full production rollout using the signed app bundle that
  completed closed testing.
- The rollout targets all 177 available Google Play countries and regions, including the rest-of-world
  group.
- Google Play later rejected that submission because the listing screenshots showed features that
  did not match the reviewed app experience.
- After the listing and release process were corrected, Android **1.0.2 (3)** became publicly
  installable. The historical rejection remains recorded here for release provenance; it is no
  longer the current Google Play state.

## Generate icons

The shared source is `apps/store-assets/lumen-playground-icon.svg`. On macOS, regenerate checked-in
platform assets with:

```bash
apps/playground-apple/scripts/generate-app-icons.sh
apps/playground-android/scripts/generate-app-icons.sh
cd apps/playground-apple && xcodegen generate
```

Review the 1024-pixel Apple marketing icon and 512-pixel Google Play icon after generation. Store
icons must remain opaque and must not include platform-applied rounded corners.

## Build candidates

For an unsigned Android release candidate:

```bash
pnpm playground:android:bundle
```

For a Google Play closed-beta release, dispatch **Release Android playground beta** from `main`
with the public version name and the next unused, monotonically increasing version code. The
workflow builds and signature-verifies the AAB, runs the Android tests and lint, retains the exact
bundle as a workflow artifact, and publishes it to the existing `alpha` closed-testing track. It
commits the release with automatic review submission, as required by this app’s Google Play
configuration. Prepare listing assets and declarations before dispatch. Keep managed publishing
enabled in Play Console to hold approved changes until the intended rollout.

For a local signed upload bundle, keep the upload key and passwords in the configured Infisical
project under the `dev` environment and `/playground/google-play` path. CI uses the matching `prod`
path plus `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`; the service account must have release access only to
Lumen Playground. Store the keystore as base64 using the following four secret names:

```bash
LUMEN_PLAYGROUND_KEYSTORE_BASE64
LUMEN_PLAYGROUND_KEYSTORE_PASSWORD
LUMEN_PLAYGROUND_KEY_ALIAS
LUMEN_PLAYGROUND_KEY_PASSWORD
```

Then run `pnpm playground:android:bundle:signed`. Infisical injects the values at runtime; the
script decodes the keystore into a permission-restricted temporary directory and removes it after
Gradle exits.

The bundle is written beneath `apps/playground-android/app/build/outputs/bundle/release`. Never add
the keystore or its values to the repository, documentation, screenshots, or command output. The
signed command fails before bundling when any credential is absent or the decoded keystore is invalid;
the shorter `playground:android:bundle` command intentionally remains available for local unsigned
release checks only.

For Apple distribution, update `apps/playground-apple/release.json` and every `MARKETING_VERSION`
in `apps/playground-apple/project.yml`, then run `pnpm playground:apple:release-preflight`. The public GitHub
workflow stamps the project with the synchronized version and live next build number. Merging that
synchronized version change to `main` automatically launches the iOS workflow. The macOS workflow
is dispatch-only so an iOS version bump cannot start an unintended Mac App Store upload. Either
workflow can be dispatched manually from `main` to create another immutable candidate for the
committed version:

- **Launch Apple playground release** uploads iOS and records `playground-ios-v<version>-gh<run>-<attempt>`.
- **Launch Mac playground release** uploads Mac and records `playground-macos-v<version>-gh<run>-<attempt>`.

Private repository launchers retain `playground-*-v<version>-r<run>` tags. Repeated attempts for the
same marketing version receive distinct tags, while Xcode Cloud supplies
the monotonically increasing `CI_BUILD_NUMBER`. Each launcher monitors the matching Xcode Cloud
workflow through completion, and the standalone **Check Apple playground release status** and
**Check Mac playground release status** workflows can resume monitoring for an existing tag.
Because App Store Connect already received iOS build
`1` of version `1.0.0` before Xcode Cloud was enabled, the cloud script offsets only the iOS counter
by one. The macOS workflow uses its own Xcode Cloud build counter directly.

For private repositories only, create an Xcode Cloud workflow named **App Store Release** for
`apps/playground-apple/LumenApplePlayground.xcodeproj` and the shared
`LumenApplePlayground` scheme with these settings:

- Start condition: tag changes matching `playground-ios-v*`.
- Environment: stable Xcode 27 (27A266a) with the iOS 27.0 SDK and a stable compatible macOS image. Do not use
  a beta macOS or future Xcode beta: App Store Connect rejects binaries produced with unsupported
  build provenance. Update the repository toolchain check and workflow together when Apple moves
  submissions to a newer SDK.
- Action: archive the iOS app with App Store Connect distribution preparation enabled.
- Signing: automatic signing for team `BY4995HQ3J`.
- Post-actions: none. TestFlight groups, App Review submission, and customer release remain explicit
  App Store Connect steps.

For private repositories, create a second Xcode Cloud workflow named **Mac App Store Release** for the same project and the
shared `LumenMacPlayground` scheme:

- Start condition: tag changes matching `playground-macos-v*`.
- Environment: stable Xcode 26 and a stable compatible macOS image. Keep the environment aligned
  with the repository toolchain check.
- Action: archive the macOS app with App Store Connect distribution preparation enabled.
- Signing: automatic signing for team `BY4995HQ3J`; the target uses App Sandbox and hardened runtime.
- Post-actions: none. TestFlight, App Review submission, and customer release remain explicit App
  Store Connect steps.

Add macOS to the existing App Store Connect record so iOS and macOS share the Apple ID, SKU, bundle
ID `com.santi020k.lumen.playground.apple`, and universal-purchase identity. Do not create a separate
Mac application record.

Xcode Cloud automatically runs `apps/playground-apple/ci_scripts/ci_post_clone.sh`. For release
tags, the script derives `MARKETING_VERSION` from the tag and uses Xcode Cloud's positive integer
`CI_BUILD_NUMBER` plus the documented one-build migration offset for `CURRENT_PROJECT_VERSION`.
Before changing versions, it verifies a supported stable Xcode 26/iOS 26 or the verified
Xcode 27 (27A266a)/iOS 27.0 toolchain and a
non-beta macOS image. Other private Xcode Cloud workflows retain the committed development versions.
For that private-repository flow, GitHub holds no Apple certificates, provisioning profiles, or
App Store Connect keys; the `app-store` environment is an approval boundary for creating the tag.

Public open-source repositories run Apple validation and delivery on standard GitHub-hosted
`macos-26` runners; private repositories retain Xcode Cloud. Standard runners are free for public
repositories; larger runners are excluded. The selected stable Xcode 26.5 and iOS 26.5 simulator
match the native capture environment. The toolchain guard rejects prerelease tools.

`apple-native.yml` preserves five required checks: Swift tests/API/clean consumers, React Native iOS
packed consumer, all native component captures, docs visual regressions, and framework visual
regressions. Native captures are split into four disjoint groups from the generated catalog; the
required `Apple captures` check fails unless every group succeeds and the complete catalog passes
the original PNG comparison. Only that platform-neutral comparison runs on Linux. One macOS job builds the app and Tour test runner once with `build-for-testing`; capture groups
consume that same-run artifact, verify its revision and Xcode version, and run the native Tour test
with `test-without-building`. A tar archive preserves executable permissions and bundle links.
Every group captures on macOS, keeping the six-second settle time. Tour and Kanban Column replay
their native XCTest interaction and scroll state before exporting a verified attachment, matching
the documentation baselines without changing images or comparison tolerances.

Shallow checkouts avoid downloading unrelated history; Swift compatibility fetches its immutable
baseline tag explicitly. Dependency/browser caches and incremental library/playground Swift builds
avoid repeat setup. Capture build and capture groups install only Node; their native scripts do not
need the pnpm workspace. PNG comparison still installs its JavaScript dependencies on Linux.

The disposable Swift package consumer builds clean, without restored artifacts. Its
`--check-api-baseline` option extracts and compares public symbols from those same-run products,
covering LumenUI on all five Apple platforms and LumenWidgetUI on macOS, iOS, and watchOS. This removes
eight duplicate API-only builds while retaining the exact version/revision, resource, notice,
consumer build, and classified API checks. Missing or ambiguous modules and incomplete platform maps
fail the gate. Standalone API checks and baseline updates still build repository sources.
Swift phases and Compose instrumentation, consumer install, and capture phases report separate
durations in CI.
GitHub's standard macOS concurrency limit may queue groups; splitting does not guarantee four-way
execution on every account. Concurrency cancels superseded runs. Tests, baseline images, tolerances,
and release approval are unchanged.
No signing secrets are available to pull-request jobs. Deactivate Lumen's old Cloud PR and published
verification workflows to avoid duplicate compute; use `verify-native-release.yml` for exact public
Apple consumers on GitHub. Private copies retain the matching Cloud launcher and monitor.

For public store delivery, `release-playground-apple.yml` and `release-playground-macos.yml` call
`apple-store-release.yml` from merged main, in the protected `app-store` environment. They resolve
build numbers from live App Store records, archive/sign/upload on the standard runner, and create
an immutable source tag only after upload succeeds. The runtime signing script uses a temporary
keychain and removes certificates, private key files, and archives on exit. Archive with automatic
Apple Development signing and the team applied to every target, including Swift resource bundles.
Before archiving, delivery downloads the active App Store profiles matching each bundle ID and
imported distribution identity, verifies their signed team, expiry, UUID and release entitlements,
and requires a usable Mac installer identity for macOS. Export selects those profile UUIDs and
certificate fingerprints explicitly with manual signing, avoiding a cloud-signing fallback. The
runner removes only profiles it installed; existing profiles are preserved. The delivery identity
must support existing app and extension bundle IDs. iOS version changes do not implicitly upload Mac.

Infisical `prod:/playground/apple` must supply `APPLE_DISTRIBUTION_P12_BASE64` and
`APPLE_DISTRIBUTION_P12_PASSWORD`, plus the existing App Store Connect issuer/key IDs and P8 key.
The P12 bundle contains the distribution identities and private keys required for iOS and Mac App
Store signing, including the Mac installer identity. Cloud-managed private keys are not exportable;
if no usable existing identity is available, a human must authorize signing credential bootstrap.
Never commit or log these values. The existing Infisical OIDC identity must retain access to this
path. Do not create new credentials or mutate shared secrets without authorization.

Keep Lumen's old Cloud store-release workflows deactivated after migration. Private repositories
may keep them active. Re-enable a previous provider only with an explicit decision and deactivate
its replacement first. Successful upload is not store review or customer release: verify App Store
processing, select the matching signed build, submit for review, and keep manual rollout held.

The Tour component capture replays its native XCTest interaction to open step one and reveal the
target, matching the committed documentation image. Missing attachments fail the gate; comparison
retains its existing tolerance. All five Apple jobs must pass before merging the release.

The post-clone checks fetch the immutable Swift compatibility tag selected by the current release
contract before diagnosing API changes, including when Xcode Cloud supplies a shallow checkout.

The app declares that it uses no non-exempt encryption; re-audit that declaration if a future
dependency adds cryptography. Signing identity and App Store Connect access remain account-owned
state.

GitHub monitors Apple builds through the App Store Connect API. The `app-store` environment must
define `INFISICAL_IDENTITY_ID`, `INFISICAL_PROJECT_SLUG`, and `XCODE_CLOUD_PRODUCT_ID`. The identity
must be restricted to this repository and granted read access to the Lumen Infisical project's
`prod` environment at `/playground/apple`, where `APP_STORE_CONNECT_ISSUER_ID`,
`APP_STORE_CONNECT_KEY_ID`, and `APP_STORE_CONNECT_API_KEY_P8` are stored. The private key remains in
Infisical and is injected only for the monitor job.

## Release gates

1. Run the repository's native build, typecheck, lint, test, API, and release-candidate checks.
2. Follow the [current native release policy](native-release-runbook.md#current-release-policy).
   Automated accessibility, compatibility, security, and package-consumer checks remain required.
3. Capture current phone, tablet, and Mac screenshots from the exact release candidate in both light
   and dark appearances. Use `pnpm playground:apple:capture-store` for the ordered 6.9-inch iPhone
   and 13-inch iPad sets, and `pnpm playground:android:capture-store` for the 9:16 phone set. Export
   store PNGs without an alpha channel, as required by App Store Connect. Mac screenshots use an
   accepted 16:10 size. Do not use the React Native web render as native store evidence.
4. Verify that privacy URLs are live, the in-app links work, no unexpected permissions appear in
   the final manifests, and store privacy answers match every bundled SDK.
5. Distribute the exact candidate through TestFlight and Google Play closed testing. Exercise
   install, update, search, interactive examples, external links, screen readers, text scaling,
   rotation, reduced motion, and high contrast before production submission.
6. Submit to production only with explicit authorization from the account owner. Record the store
   version, build number, immutable revision, review result, and rollout state.

The supported Lumen 2 contract and remaining release-evidence gates must stay visible in documentation
and release notes. The store application itself should be described as a reference catalog,
trial, certification, or guarantee of application suitability.


## V4 mobile preparation — October 5, 2026

App Store Connect records iOS 1.0.2 (53) and public macOS 1.0, with macOS 1.0.1 already uploaded.
The next shared Apple marketing version is 1.0.3; live App Store records resolve each platform's next build
counter. Google Play's latest upload is 1.0.2 (3); the next Android candidate is 1.0.3 (4).
These are preparation records, not publication or review-submission evidence. Keep Apple manual
release and Google Play managed publishing enabled so approved updates remain held for rollout.

Apple now accepts the stable Xcode 27 SDKs for submissions; see
[Apple submission guidance](https://developer.apple.com/app-store/submitting/) and
[the September 14 release record](https://developer.apple.com/news/releases/).
The toolchain guard admits verified Xcode 27 build 27A266a and keeps prerelease rejection.
The phone component capture list is generated from the canonical catalog, with Mac-only controls
excluded, so the native capture gate compares all current iPhone components.
