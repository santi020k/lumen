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
- **Support:** `https://lumen.santi020k.com/support`
- **Privacy:** `https://lumen.santi020k.com/privacy`
- **Apple marketing URL:** `https://lumen.santi020k.com/docs/apple/playground`
- **Android website:** `https://lumen.santi020k.com/docs/android/playground`

Editable English listing copy lives in `apps/playground-apple/Store/en-US`,
`apps/playground-apple/Store/macOS/en-US`, and `apps/playground-android/Store/en-US`. The Android data
declaration lives beside its listing copy. Keep screenshots and submitted metadata accurate for the
exact binary under review.

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
bundle as a workflow artifact, and publishes it to the existing `alpha` closed-testing track.

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
in `apps/playground-apple/project.yml`, then run `pnpm playground:apple:release-preflight`. Xcode
Cloud stamps the checked-in project with the version from the immutable release tag. Merging that
synchronized version change to `main`
automatically launches both GitHub Actions workflows. Either workflow can also be dispatched
manually from `main` to create another immutable candidate for the committed version:

- **Launch Apple playground release** creates `playground-ios-v<version>-r<run>` for iOS.
- **Launch Mac playground release** creates `playground-macos-v<version>-r<run>` for macOS.

Repeated attempts for the same marketing version receive distinct tags, while Xcode Cloud supplies
the monotonically increasing `CI_BUILD_NUMBER`. Each launcher monitors the matching Xcode Cloud
workflow through completion, and the standalone **Check Apple playground release status** and
**Check Mac playground release status** workflows can resume monitoring for an existing tag.
Because App Store Connect already received iOS build
`1` of version `1.0.0` before Xcode Cloud was enabled, the cloud script offsets only the iOS counter
by one. The macOS workflow uses its own Xcode Cloud build counter directly.

Create an Xcode Cloud workflow named **App Store Release** for
`apps/playground-apple/LumenApplePlayground.xcodeproj` and the shared
`LumenApplePlayground` scheme with these settings:

- Start condition: tag changes matching `playground-ios-v*`.
- Environment: stable Xcode 26 with the iOS 26 SDK and a stable compatible macOS image. Do not use
  a beta macOS or future Xcode beta: App Store Connect rejects binaries produced with unsupported
  build provenance. Update the repository toolchain check and workflow together when Apple moves
  submissions to a newer SDK.
- Action: archive the iOS app with App Store Connect distribution preparation enabled.
- Signing: automatic signing for team `BY4995HQ3J`.
- Post-actions: none. TestFlight groups, App Review submission, and customer release remain explicit
  App Store Connect steps.

Create a second Xcode Cloud workflow named **Mac App Store Release** for the same project and the
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
Before changing versions, it verifies that the build uses stable Xcode 26, the iOS 26 SDK, and a
non-beta macOS image. Other Xcode Cloud workflows retain the committed development versions. GitHub
holds no Apple certificates, provisioning profiles, or App Store Connect keys; the `app-store`
GitHub environment is only an approval boundary for creating the tag.

Apple-native validation also runs in Xcode Cloud so GitHub Actions never allocates a macOS runner.
Keep these additional workflows attached to the same project:

- **Pull Request Native Checks** starts for pull requests targeting `main` when Apple sources,
  native contracts, generated assets, or Apple CI scripts change. Use the latest stable Xcode and
  macOS environment, cancel superseded builds, and add a required iOS Simulator build action for
  `LumenApplePlayground`. The post-clone script runs the Swift package, API, clean-consumer, React
  Native iOS, component-capture, and browser visual-regression checks before Xcode builds the app.
- **Published Native Release Checks** starts for tags matching `xcode-native-verify-rn-*`. Use the
  same stable environment and an iOS Simulator build action for `LumenApplePlayground`. The
  `verify-native-release.yml` dispatcher creates that tag only after the public version and
  revision metadata pass; the post-clone script then builds the exact public React Native iOS and
  Swift artifacts.

The browser visual-regression suite uses its existing macOS baselines inside **Pull Request Native
Checks**, avoiding a duplicate GitHub runner and platform-specific baseline set. Treat the Xcode
Cloud check as a required pull-request status and the published verification build as part of the
release evidence. Do not add a `runs-on: macos-*` job as a fallback; use Xcode Cloud's rerun controls
or a manual build of the matching workflow.

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
2. Complete the relevant physical-device accessibility matrix in `docs/native-device-validation.md`
   for minimum and current supported devices. Resolve blocking findings before public release.
3. Capture current phone, tablet, and Mac screenshots from the exact release candidate in both light
   and dark appearances. Export store PNGs without an alpha channel, as required by App Store
   Connect. Mac screenshots use an accepted 16:10 size. Do not use the React Native web render as
   native store evidence.
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
