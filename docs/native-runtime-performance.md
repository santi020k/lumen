# Native runtime performance

Import bytecode size, activity launch timing, and frame rendering answer different questions.
Keep these measurements separate and bind runtime evidence to the exact source revision and
installed artifact. Emulator results are local regression evidence; they do not qualify hardware
accessibility, screen readers, or release stability iterations.

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

## Remaining platform qualification

React Native bytecode budgets use `pnpm run check:react-native-imports`, including the static graphic
fixture. React Native native startup, JavaScript responsiveness and list frame measurements still
need release-mode native hosts on both iOS and Android. Expo web timing cannot stand in for them.

SwiftUI startup and scrolling need the exact candidate in an Apple runtime, with Instruments or
XCTest performance measurements and representative phone and tablet layouts. Simulator checks
remain separate from physical-device results. Follow [device validation](native-device-validation.md)
and [consumer qualification](native-consumer-validation.md) for the required evidence boundaries.
