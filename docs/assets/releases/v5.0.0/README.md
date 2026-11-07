# Lumen UI 5 release assets

Local release candidates prepared on November 6, 2026. Nothing in this directory is publication,
store approval, or physical-device qualification evidence. Draft captions and the final handoff
checklist live in [the release kit](../../../marketing/RELEASE_V5.md).

## Files

| Material | Location | Intended use |
| --- | --- | --- |
| Web and Expo screenshots | `screenshots/` | Documentation, release notes, and editorial use |
| Link-preview cover | `social/release-cover-1200x630.png` | Release link preview |
| Three-card carousel | `social/square-*.png` | 1080 × 1080 social carousel |
| Portrait cards | `social/portrait-*.png` | 1080 × 1920 story or video source |
| Landscape cards | `social/landscape-*.png` | 1920 × 1080 video source |
| iPhone and iPad captures | `apps/playground-apple/Store/Screenshots/` from the repository root | Apple store candidates |
| Medium iPhone captures | `apple-medium/` | Additional Apple phone size class |
| Android captures | `apps/playground-android/Store/Screenshots/` from the repository root | Google Play candidates |
| Android feature graphic | `apps/playground-android/Store/feature-graphic.png` from the repository root | 1024 × 500 Google Play feature graphic |

[`web-captures.json`](web-captures.json) records the web routes, appearance, viewport, capture time,
and exact source revision. [`artwork.json`](artwork.json) supplies descriptive alt text for each
graphic. [`inventory.json`](inventory.json) records image dimensions, alpha state, file sizes, and
SHA-256 checksums. File paths in the inventory are relative to the repository root.
[`native-captures.json`](native-captures.json) identifies each native device size, runtime, source
revision, capture timestamp, checksum, and alternative text.

## Capture boundaries

All application sources in this preparation come from revision
`c77c6aee8` on `release/v5.0.0`. Asset tooling and draft copy were added separately. Web screenshots
use Chromium with reduced motion and the Lumen light/dark preferences. React Native screenshots
come from the locally built Expo web export at 390 × 844; they must not be submitted as native
store screenshots. Metrics and profiles inside the examples are demonstration data.

The Apple set uses the same locally built universal Debug simulator application on iPhone 18 Pro
Max, iPhone 18 Pro, and iPad Pro 13-inch (M5), all with iOS/iPadOS 27.0. The Android set uses a local
Debug APK in an Android 15 / API 35 emulator at 1080 × 1920 with density 420. These are screenshot
preparation builds, not distribution archives or evidence of physical-device qualification.

The existing Mac store images are excluded from this release inventory. The local Mac build
launches, but its captured window has blank brand-image slots and a system window-sharing overlay.
Fresh Mac store images remain pending a clean capture from the final candidate; the older files
under `apps/playground-apple/Store/macOS/Screenshots` must not be treated as refreshed v5 evidence.

The carousel uses actual application captures, proportional resizing, and the canonical light
palette from `tokens/lumen.tokens.json`. The mark comes from `apps/docs/public/logo.svg`.
The native and browser labels are part of the artwork. No generated illustration stands in for
an application screenshot.

Recheck the final signed application against the selected images before uploading. A later source
revision that changes visible behavior requires a fresh capture and updated provenance.

## Regenerate

Use the repository's pinned Node and pnpm versions. Build the workspace packages and the Expo web
playground before starting the isolated docs server; see the root contributor guide.

```bash
pnpm --filter @santi020k/lumen-playground-react-native run build
pnpm --filter @santi020k/lumen-docs run prepare:native-live-previews
pnpm --filter @santi020k/lumen-docs exec astro dev --host 127.0.0.1 --port 4335
node apps/docs/scripts/capture-release-screenshots.mjs
```

Set `LUMEN_RELEASE_CAPTURE_URL` only when the same source revision is served on another local port.
The capture script exercises React and Elements state changes before recording them and fails on
browser exceptions or missing content. Keep its source checkout aligned with the server checkout.

Use the existing native capture commands after building and installing the matching local apps:

```bash
pnpm playground:apple:capture-store
ANDROID_SERIAL=<task-owned-emulator> LUMEN_ANDROID_STORE_SCALE=1 pnpm playground:android:capture-store
```

The Apple script accepts `LUMEN_IPHONE_STORE_UDID` and `LUMEN_IPAD_STORE_UDID`. Its default phone set
is the large 1320 × 2868 size. Apple's current guide also requests the medium Dynamic Island size;
capture that class separately rather than resizing a large-phone image into a different layout.
Mac screenshots must be exported at an accepted 16:10 size, without alpha.

To regenerate the additional phone class, run the same Apple command with the medium phone UDID
and a temporary output directory. Copy its six `iphone-*.png` files into `apple-medium/`; its iPad
outputs duplicate the main tablet set and do not belong in that directory. This preparation reused
the completed universal simulator build for the additional sizes and waited for stable rendered
frames before exporting opaque PNGs. Update `native-captures.json` after recapture.

After refreshing source screenshots, regenerate graphics and shared website previews, then verify:

```bash
node apps/docs/scripts/render-release-assets.mjs
node apps/docs/scripts/check-release-assets.mjs
pnpm run check:playground-store-readiness
```

Review every output visually before using it. The checksum check establishes file integrity; it
does not establish store approval or replace interaction and accessibility testing.

## Store specifications checked

The prepared images use Apple's accepted iPhone/iPad dimensions and Google's
opaque 1024 × 500 feature graphic and portrait phone format. Requirements were checked on
November 6, 2026 against [Apple's screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/)
and [Google's preview asset guide](https://support.google.com/googleplay/android-developer/answer/9866151).

Recheck the actual submission slots before upload; the release workflow and store review remain
separate from this local asset preparation.
