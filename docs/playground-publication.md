# Publishing Lumen Playground

Lumen Playground is a public, offline developer reference for Lumen UI. The iOS listing ships the
SwiftUI gallery, the Android listing ships the Compose gallery, and the React Native gallery remains
the browser and Expo demonstration. All surfaces use the same name, icon, positioning, support URL,
and privacy policy while proving the package native to their platform.

## Product contract

- The complete component catalog is available without an account or network connection.
- Search, interactive states, light and dark themes, and native accessibility behavior are core
  utility rather than store-listing decoration.
- Example preferences and forms are explicitly labeled as demonstrations. They do not register for
  notifications, download updates, submit content, or imply persistence.
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

Editable English listing copy lives in `apps/playground-apple/Store/en-US` and
`apps/playground-android/Store/en-US`. The Android data declaration lives beside its listing copy.
Keep screenshots and submitted metadata accurate for the exact binary under review.

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

For a signed upload bundle, keep the upload key and passwords in the configured Infisical project
under the `dev` environment and `/playground/google-play` path. Store the keystore as base64 using
the following four secret names:

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

For Apple distribution, run `pnpm playground:apple:release-preflight`, then manually dispatch the
GitHub Actions workflow **Launch Apple playground release** from `main` with the App Store marketing
version. The workflow creates an immutable `playground-ios-v<version>-r<run>` tag. Repeated attempts
for the same marketing version receive distinct tags, while Xcode Cloud supplies the monotonically
increasing `CI_BUILD_NUMBER`. Because App Store Connect already received build `1` of version
`1.0.0` before Xcode Cloud was enabled, the cloud script offsets that counter by one: the first
cloud build uploads as build `2`, the next as build `3`, and so on.

Create an Xcode Cloud workflow named **App Store Release** for
`apps/playground-apple/LumenApplePlayground.xcodeproj` and the shared
`LumenApplePlayground` scheme with these settings:

- Start condition: tag changes matching `playground-ios-v*`.
- Environment: the latest Apple-supported Xcode release or release candidate and its compatible
  macOS image. Update the workflow when App Store submission requirements move to a newer SDK.
- Action: archive the iOS app with App Store Connect distribution preparation enabled.
- Signing: automatic signing for team `BY4995HQ3J`.
- Post-actions: none. TestFlight groups, App Review submission, and customer release remain explicit
  App Store Connect steps.

Xcode Cloud automatically runs `apps/playground-apple/ci_scripts/ci_post_clone.sh`. For release
tags, the script derives `MARKETING_VERSION` from the tag and uses Xcode Cloud's positive integer
`CI_BUILD_NUMBER` plus the documented one-build migration offset for `CURRENT_PROJECT_VERSION`.
Other Xcode Cloud workflows retain the committed development versions. GitHub holds no Apple
certificates, provisioning profiles, or App Store Connect keys; the `app-store` GitHub environment
is only an approval boundary for creating the tag.

The app declares that it uses no non-exempt encryption; re-audit that declaration if a future
dependency adds cryptography. Signing identity and App Store Connect access remain account-owned
state.

## Release gates

1. Run the repository's native build, typecheck, lint, test, API, and release-candidate checks.
2. Complete the relevant physical-device accessibility matrix in `docs/native-device-validation.md`
   for minimum and current supported devices. Resolve blocking findings before public release.
3. Capture current phone and tablet screenshots from the exact release candidate in both light and
   dark appearances. Export store PNGs without an alpha channel, as required by App Store Connect.
   Do not use the React Native web render as native store evidence.
4. Verify that privacy URLs are live, the in-app links work, no unexpected permissions appear in
   the final manifests, and store privacy answers match every bundled SDK.
5. Distribute the exact candidate through TestFlight and Google Play closed testing. Exercise
   install, update, search, interactive examples, external links, screen readers, text scaling,
   rotation, reduced motion, and high contrast before production submission.
6. Submit to production only with explicit authorization from the account owner. Record the store
   version, build number, immutable revision, review result, and rollout state.

The current Beta maturity of the native packages must remain visible in documentation and release
notes. The store application itself should be described as a reference catalog, not as a beta,
trial, certification, or guarantee of application suitability.
