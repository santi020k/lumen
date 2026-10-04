# Native runtime performance

Import bytecode size, activity launch timing, and frame rendering answer different questions.
Keep these measurements separate and bind runtime evidence to the exact source revision and
installed artifact. Emulator results are local regression evidence; they do not qualify hardware
accessibility, screen readers, or release stability iterations.

## Isolated instrumented Android benchmark

Prefer the [isolated runtime measurement workflow](../apps/playground-android/README.md#isolated-runtime-measurements)
when preserving an existing installation. The separate benchmark variant inherits release settings
and uses development signing; it is not debuggable and has a dedicated application ID. The
instrumentation driver runs five process-cold launches and six actual list scrolls without running
inside the measured process. It records raw Activity Manager and frame snapshots plus the observed
record ranges. The selected test class and target package must match.

After pulling the exact sample directory recorded in the test log, run
`node scripts/report-android-workspace-runtime.mjs --input <directory> --output <report.json>`.
The reporter uses the same strict parsers as the collector below. Preserve the source and installed
APK hashes, native test result, raw samples and device settings together. A Measured or Partial
report is observation data; neither means the candidate passes a performance budget or qualifies
physical hardware. The collector below installs under the normal app ID; use the isolated workflow
when that installation must be preserved.

## Android workspace collector

With a clean committed checkout, JDK 21, the Android SDK, and its standard development keystore:

```bash
pnpm run test:android-runtime-metrics
pnpm run measure:android-workspace --serial emulator-5554
```

Set `JAVA_HOME` and `ANDROID_HOME` for the installed tools. The collector uses build-tools 37.0.0
by default; pass `--build-tools <installed-version>` when needed. Select the device explicitly.
It builds the local release variant with upload signing disabled, signs only with the standard
development certificate, installs that APK, and checks the installed APK's SHA-256. This is a local
development artifact. It does not publish, upload, or use a store signing identity.

The collector makes five process-cold activity launches, opens the populated Workspace example,
and performs six measured list swipes. Pass `--iterations` or `--swipes` to change the sample counts.
It reads actual accessibility bounds rather than assuming a fixed screen size, and requires the
visible record range to change. The synthetic playground task is cleared between launches; no
application database is cleared.

Results live in `.build/android-workspace-performance/` by default. Use `--output <directory>` for
another local run. The directory contains the APK, build log, raw launch/frame records, before and
after screenshots, and `report.json`. The report includes the source revision, APK hash, device
identity hash, OS, API, display, density, font scale, sample counts, and observed record ranges.
Do not commit these temporary artifacts as physical-device qualification.

The startup metric is Android Activity Manager's `TotalTime` from `am start -W`; it does not prove
that the complete workflow is interactive. The frame metric uses `FrameCompleted - IntendedVsync`
for completed, unflagged `gfxinfo` samples, and compares completion with the frame's own deadline.
Overlapping frame snapshots are deduplicated, incomplete timestamps are rejected or excluded,
and an empty measurement fails. Completion timestamps beyond a device uptime observation are
excluded and counted explicitly. Such a run is labeled Partial and cannot establish a passing
performance budget. The collector includes the printed uptime precision in the observation bound. This follows Android's
[dumpsys diagnostics](https://developer.android.com/tools/dumpsys) and preserves the distinction from
[startup qualification with Macrobenchmark](https://developer.android.com/topic/performance/appstartup/analysis-optimization).

Compare only runs with the same device, build mode, OS, display settings, workflow and host workload.
Keep raw samples and inspect screenshots before choosing a regression threshold. A slower or
sparser result remains evidence to investigate; do not turn it into a passing budget.

## Apple workspace XCTest measurements

Choose an available iPhone or iPad simulator explicitly and run the separate local performance
scheme from the repository root:

```bash
xcodebuild -project apps/playground-apple/LumenApplePlayground.xcodeproj \
  -scheme LumenApplePlaygroundPerformance \
  -destination 'platform=iOS Simulator,id=<simulator-udid>' \
  -derivedDataPath .build/apple-workspace-performance \
  -resultBundlePath .build/apple-workspace-performance.xcresult \
  CODE_SIGNING_ALLOWED=NO test
xcrun xcresulttool get test-results metrics \
  --path .build/apple-workspace-performance.xcresult
```

Use fresh result-bundle and derived-data paths for each run. Preserve the built `.app` with the
result bundle and record its checksum before another build replaces it. Record the source revision,
simulator model, OS, text size and host workload alongside the result bundle. The UI test runner needs iOS 17 or
later, matching the installed XCTest libraries; the application's iOS 16 minimum is unchanged.
Archive and distribution schemes are separate.

The tests collect five responsive-launch samples with `XCTApplicationLaunchMetric` and five
scrolling samples with `XCTOSSignpostMetric.scrollingAndDecelerationMetric`. XCTest discards its
initial warm-up iteration. On iOS 26 or later the scrolling test also requests Apple's
[`XCTHitchMetric`](https://developer.apple.com/documentation/xctest/xcthitchmetric) for the tested
application; earlier runtimes retain duration measurement. Launch measurement ends at the first responsive frame, rather than
complete workflow readiness. Scrolling setup and navigation occur outside the measured interval;
the test also verifies that the list moved. Inspect the actual metrics in the result bundle:
a green test without frame measurements does not establish a scrolling performance budget.
Both the initial iPad Simulator run and the later run explicitly requesting `XCTHitchMetric`
exposed scroll duration only, without frame or hitch counts. A requested metric is not a collected
metric; verify that the result bundle contains hitch samples before using it for frame-smoothness
qualification, which remains pending.
The keyboard test types and saves a long note, checks the rendered saved value and keeps screenshots.

These are local Simulator checks. Repeat on representative phone and tablet layouts and preserve
the raw samples before selecting regression thresholds or claiming a hardware result.

## Remaining platform qualification

### React Native live text-layout probe

The diagnostic [TextLayoutProbe](../apps/playground-react-native/src/fixtures/TextLayoutProbe.tsx)
compares plain React Native `Text` with Lumen foundations inside the same native host. Its static
paragraphs have no fixed heights, retain normal font scaling, and remain mounted while the size
changes. A dynamic heading displays `useWindowDimensions().fontScale`; native line callbacks
display reported counts and widths. The controlled field helps observe whether its initial value
survives the change, but that alone does not verify retention of a user-edited draft.

Copy the fixture into an ignored, isolated native qualification host and point only that temporary
host's entrypoint at it. Preserve the original app and entrypoint first; do not replace the public
playground entrypoint or enable OTA updates. Build Release, capture source and installed artifact
hashes, compare standard text with a live maximum-size change, and inspect the actual rendering.
Line callbacks are diagnostic output: measurements that fit the viewport do not prove that all
text remains visible. Restore the original text size, app and host entrypoint after testing.

The iPhone iOS 27 Simulator probe reproduced clipping in both renderers at live maximum text size.
Both callbacks reported four lines at standard size and only one after enlargement, despite lost
paragraph content. This rules out a Lumen-only layout defect in this host; it does not identify the exact native
cache failure or establish an acceptable workaround. See the [v4 quality record](lumen-4-native-quality.md)
for the preserved fixture, artifact and screenshots.

### Runtime and hardware measurements

React Native bytecode budgets use `pnpm run check:react-native-imports`, including the static graphic
fixture. React Native native startup, JavaScript responsiveness and list frame measurements still
need release-mode native hosts on both iOS and Android. Expo web timing cannot stand in for them.

SwiftUI startup and scrolling need the exact candidate in an Apple runtime, with Instruments or
XCTest performance measurements and representative phone and tablet layouts. Simulator checks
remain separate from physical-device results. Follow [device validation](native-device-validation.md)
and [consumer qualification](native-consumer-validation.md) for the required evidence boundaries.
