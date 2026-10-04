# Lumen 4 native quality

This record tracks the native improvements authorized for the v4 candidate. The implementation
branch is `feature/native-v4-quality`, originally based on release commit `d0e9eeb5` and reconciled with committed release revisions `28659627`, `5831f8f0` and `04178a3d`. Preserve concurrent v4
dependency, icon, web, and Compose-field work. Integrate only completed, verified task changes into
`release/v4.0.0`; publication requires the repository's separate release approval.

## Required outcomes

- Sheets and forms: reachable actions with keyboards and long content, dismissal protection,
  native focus behavior, and safe integration with application-owned scrolling containers.
- Android: adaptive list/detail examples, keyboard insets and back behavior, resizing, and retained
  application state using the existing Material navigation scaffold.
- Apple: adaptive sheet and iPad examples plus dense rows and action groups that rearrange for
  accessibility text sizes while retaining system navigation and presentation.
- React Native: keyboard, safe-area and modal-focus integration on iOS and Android, a complete Expo
  example, and virtualized-list integration without nested scroll containers.
- Performance: measure production React Native import and icon cost; evaluate static icon imports
  and optional entry points; establish bundle, startup and scrolling regression measurements.
- Localization and accessibility: caller-localizable labels, English and Spanish examples, long
  translations, right-to-left layouts, large text, contrast, and reduced motion.
- Workflows: searchable list/detail, keyboard-heavy editing, and chart-dashboard recipes with
  loading, empty, error, retry and success states.
- Qualification: exact-candidate real-consumer and physical-device checks, two native stability
  iterations, aligned API baselines, migration guidance, Changeset, and canonical validation.

## Implementation and evidence

Work is in progress. Current source changes add localizable required-field and tab-panel labels to
React Native and Compose, sheet scrolling and dismissal controls to SwiftUI and Compose, and
explicit React Native sheet focus targets with a compact-height/large-text scrolling fallback.

### Verified local evidence

- React Native behavioral/unit tests passed as part of the reconciled 925-test JavaScript suite,
  with strict type checking and zero-warning lint.
  The new Workspace example has six playground tests, including two workspace model tests for search and isolated record saves; its
  Expo web build passed. Desktop 1280×900 and mobile 390×844 interactions covered selection,
  editing, save feedback, and chart rendering, with temporary screenshots inspected.
- Swift: 52 LumenUI and three WidgetKit tests passed. The new native split-view workspace compiled
  in the macOS playground and the iPad simulator Xcode build passed; iPad simulator interactions verified search, record selection, initial edit focus, keyboard-visible Save, saved feedback, Spanish chart descriptions, and error/retry recovery. The flow was repeated against reconciled code revision `1d7acc749fbb80e720a70a2e982c7aa0f1dcb095`. At maximum accessibility text size, Spanish sheet actions stacked and Save remained reachable with the keyboard visible. A swipe-dismiss attempt left the protected sheet open. Typed notes persisted. A later Release-mode XCTest run on the iPad Pro 13-inch (M5), iOS 27 Simulator, passed all three workspace tests, including typing and saving a long note through the native keyboard and verifying the exact saved text. Temporary keyboard and saved-note screenshots were inspected. Five responsive-launch samples averaged 4.935 seconds with 21.341% relative standard deviation; five scrolling/deceleration durations averaged 2.553 seconds. The bundle contains duration samples only, without frame or hitch counts. These host-dependent samples do not establish performance budgets. This run used the candidate worktree based on `156dd6e8` plus the new UI-test fixture, before its commit. The final committed fixture at `038e46f4a1dc751a1cea7ca778f631c9794d52b1` then passed all three tests on the iPhone 17 Pro iOS 27 Simulator, including an explicit keyboard-visible assertion. Phone launch samples averaged 5.472 seconds with 23.658% relative standard deviation; scrolling/deceleration duration averaged 2.570 seconds. Its raw result bundle, source/artifact report and inspected screenshots remain local under `.build/native-quality-apple-performance-iphone*`. The phone artifact checksum was captured after testing, but the shared build output was subsequently replaced by the tablet build; the phone report records that limitation. The final keyboard/save fixture also passed on iPad at source revision `5444fada`, with only documentation changing during the run. That built app is preserved with its checksum, result bundle and inspected screenshots under `.build/native-quality-apple-keyboard-ipad-committed*`. XCTest encountered three 60-second animation-idle waits but continued and verified keyboard visibility, reachable Save and the exact saved note; this is behavioral evidence, not a latency pass. Physical-device qualification and frame-smoothness measurements remain pending. Temporary screenshots were inspected and the original simulator text size was restored. API extraction succeeded on all five Apple
  targets; the reconciled source-compatibility gate validated 17 explicitly reviewed v4 diagnostics, including four icon enum additions.
- Compose: compilation and unit tests passed. The Android adaptive workspace debug APK compiled
  against the local library; three workspace instrumentation tests passed for saved-state restoration, editing, cancel and retry, including actual Activity recreation with an open draft and a saved record. Parent destination and pattern selection now use saved state. Process-death qualification remains pending. All 19 root instrumentation tests passed on the
  Pixel 10 Pro Android 17 emulator, including translated accessibility descriptions and a long
  form whose pinned Save action remains visible before and after body scrolling. API dumps and
  declaration classifications were regenerated and checked.
- Documentation/MCP: docs type checking, shared native contracts, the draft v4 contract, generated
  MCP snapshot and search/example evaluation passed. The clean packed React Native root consumer
  passed again with root, datetime, and foundations imports together. After reconciliation, package
  contents dry runs, clean web/framework consumers, the packed React Native consumer, and external
  MCP stdio and Streamable HTTP package smoke tests all passed. These are the checks after the
  security step in the canonical gate; they were run separately after that step failed.

Horizontal native button groups now wrap or fall back to a vertical layout when space is limited,
and stack at accessibility text sizes. SwiftUI geometry and Compose bounds tests cover the layout;
React Native tests verify wrapping and the large-text direction. Android and React Native workspace
examples include chart labels and selectable loading, empty, error, retry and ready states in English
and Spanish.

### Production import measurement

Three Android and iOS Hermes production exports per fixture produced these median bytecode sizes:

| Fixture | Android bytes | iOS bytes |
| --- | ---: | ---: |
| Platform button baseline | 1,429,228 | 1,424,195 |
| Lumen root button | 6,188,887 | 6,183,097 |
| Lumen foundations button | 1,447,896 | 1,442,835 |
| Lumen static search graphic | 1,630,896 | 1,625,567 |
| Lumen root button with named search icon | 6,188,956 | 6,183,158 |

The optional `@santi020k/lumen-react-native/foundations` entrypoint reuses the root implementations
and provider context while avoiding eager imports of the full catalog. Foundation overhead remains
bounded at 65,536 bytes; the root fixture remains bounded at 6 MiB. The new
`@santi020k/lumen-react-native/graphics` entrypoint reuses icon rendering, accessibility, touch targets
and the provider context while accepting an application-owned graphic instead of a catalog name.
Static graphic overhead is bounded at 262,144 bytes, including the existing SVG renderer. The fixture
uses the exact generated search artwork. Both platforms passed every budget across three exports after reconciling the phone flags.
Foundation sizes remained unchanged; the static graphic fixture varied by one byte on iOS while
the root fixture grew with the catalog.
The benchmark rebuilds the dependency graph before exporting to avoid stale workspace measurements.
The clean packed consumer also type-checks the graphics import alongside root, datetime and foundations.

Run `pnpm run check:react-native-imports`; set `LUMEN_BENCHMARK_PLATFORM=ios` to measure iOS.
These results are local bytecode measurements, not startup or scrolling latency evidence. Static
per-icon catalog paths and broader component entrypoints remain to evaluate against actual consumers.

After reconciling release revision `04178a3d`, three exports per platform passed the same budgets.
Android medians were 1,429,228 bytes for the platform baseline, 6,205,859 for the root button,
1,451,478 for foundations, 1,634,493 for static graphics and 6,205,920 for the named root icon.
iOS medians were 1,424,195, 6,200,929, 1,446,436, 1,629,152 and 6,200,993 bytes respectively.
Temporary benchmark applications now live inside the playground's existing ignored `.build`
directory, preventing generated fixtures from interfering with concurrent source lint checks.
One Android export per fixture verified that new location; budget thresholds are unchanged.

### Android runtime measurement

A local release-variant, development-signed APK at revision
`1848710cb50896cb998d67d79ba6ad82c61d699b` was installed and its SHA-256 checked before and after
measurement on the Android 17/API 37 arm64 emulator, at 1280×2856, density 480 and font scale 1.0.
Five process-cold Activity Manager launches had a 907 ms median and 1,816 ms p95. Six workspace list
swipes changed the visible range from records 001–009 to 044–057. The 177 completed frame samples
had a 17.8 ms median, 20.4 ms p95, 69.1 ms maximum, and 10 missed deadlines (5.65%). No future
completion timestamp was excluded in this run. These are local observations, not hardware
qualification, full time-to-interactive, a stability iteration or a passing performance threshold.

The first run exposed a Workspace header overlapping the status bar. The example now consumes
status-bar insets, and the new Activity test compares its header bounds with the actual system
inset. All four workspace instrumentation tests and complete app lint passed. Before and after
screenshots were inspected using the same initial records, viewport, font scale and theme.
The first frame report also contained three distinct impossible future completion timestamps;
the collector now bounds completion using observed device uptime, counts such exclusions, and
marks affected runs Partial. Six deterministic parser tests cover cold-launch rejection, empty and
unfinished frames, timestamp precision, duplicate rows, malformed bounds and future timestamps.

Run `pnpm run measure:android-workspace --serial <device>` from a clean committed checkout.
See [runtime performance](native-runtime-performance.md) for setup, raw artifacts and limitations.

### Apple scrolling hitch fixture

The scrolling test now requests `XCTHitchMetric(application:)` on iOS 26 or later in addition to
scroll/deceleration duration, retaining duration measurement on earlier supported runtimes. The
focused Release-mode test passed on the iPad iOS 27 Simulator with five duration samples averaging
2.567 seconds. Its result bundle contains no hitch measurements even though that metric was
requested. This is not a frame-smoothness pass. The built application, test source and raw metric
report are preserved locally under `.build/native-quality-apple-hitch-ipad*`, based on `0ea68b5b`
plus the UI-test change. Physical-device hitch collection remains required.

### React Native Android native host

A temporary Android host was generated from candidate `5444fada` using the installed Expo SDK
57.0.26 and React Native 0.86.3, without dependency installation or tracked app-configuration changes.
The host lives under `.build/native-quality-react-native-host`, uses the separate local package ID
`com.santi020k.lumen.playground.reactnative.qualification`, and disables over-the-air updates so
runtime checks cannot silently load a published bundle. The development-signed release build targets
arm64 and uses the generated project's SDK/NDK versions. Generation and native release compilation succeeded, including release lint. The initial build
exhausted the generated Gradle daemon's 512 MiB class-metadata memory limit; only that task's daemon was stopped.
A retry with 1,024 MiB class-metadata memory and a 2,048 MiB heap passed without skipping checks. External
Gradle and Expo deprecation warnings remain. The successful build log is
`.build/native-quality-react-native-android-build-retry.log`.

The preserved APK and installed application both matched SHA-256
`a76b082553a86a6d3a6c797564a744f8d1827fe5113410619d666b404b43949c`, verified again
following the flow checks. On the Android 17 emulator, native interactions covered home rendering,
searching for record 200, list/detail selection, chart descriptions and initial modal input focus.
A 316-character note was entered with the software keyboard visible; Save remained reachable and
the exact note plus success feedback appeared in the detail. Temporary screenshots were inspected.
The artifact, report and screenshots remain under
`.build/native-quality-react-native-android-runtime`. One process-cold Activity Manager launch took
1,137 ms; this single observation does not establish a startup threshold or full time-to-interactive.
The emulator's hardware-keyboard preference prevented automatic IME display on initial focus;
tapping the notes field opened the software keyboard. Physical focus behavior remains to verify.

These observations use the prepared candidate inputs, before the `04178a3d` appearance-preset and
other release changes were reconciled. They are historical emulator evidence, not final-candidate,
iOS, screen-reader, physical-device, stability or frame-smoothness qualification. The updated
candidate still requires rebuilt native hosts and repeated affected checks.

This follows Expo's [Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/)
workflow. Preserve the original app configuration and EAS identity; qualification must not publish
an update or replace a user's installed public playground.

### React Native iOS scene lifecycle

The first reconciled Release build succeeded, but the iPad iOS 27 Simulator rejected launch at
`UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption`. Expo SDK 57's generated host uses
the legacy lifecycle by default. The playground now opts into the official scene support using
`expo-build-properties` 57.0.22, the current stable SDK 57 plugin verified in the registry and
release notes. This build-time dependency supplies the native generation fix; Lumen does not
implement another scene delegate. Expo documents the SDK 57 opt-in in its
[scene migration guide](https://github.com/expo/fyi/blob/main/ios-scene-lifecycle.md).
The corrected native Release host at commit `49d483cc` built and launched successfully on the
iPad Pro 13-inch (M5), iOS 27 Simulator. Native interactions verified search for record 200,
adaptive list/detail, initial name focus with the software keyboard visible, and reachable Save
while entering a 316-character note. The saved note and success feedback were visually compared.
Spanish/RTL changes retained the record and note; reopening and explicit Cancel preserved the
saved value, backdrop taps left the protected sheet open, and error/retry restored the selected
record. Horizontal chart scrolling reached category 5. This is manual native flow evidence,
not automated exact-text, screen-reader, physical-device or performance qualification.

The corrected app's 76-file manifest matched the installed app after interaction checks. The
preserved app, source/package hashes, report and inspected keyboard/RTL screenshots remain under
`.build/native-quality-react-native-ios-scene-runtime`. The original failing host and report are
preserved separately under `.build/native-quality-react-native-ios-reconciled-runtime`.
The same preserved Release app launched on the iPhone 17 Pro iOS 27 Simulator. Compact
list-to-detail navigation, a 317-character note, reachable Save above the software keyboard,
reopening and Cancel passed. The complete saved note and success feedback were asserted in the
native accessibility tree; all 76 installed artifact files matched after these interactions.
The software keyboard was shown using Device Hub after native text entry. Phone keyboard and
saved-note screenshots were inspected and preserved beside the tablet evidence. These checks
do not establish VoiceOver, large-text, hardware, startup or scrolling qualification.
The rebuilt Android host also passed against `04178a3d`,
but its repeat installation could not run after the Android emulator disconnected; its separate
APK and report are preserved under `.build/native-quality-react-native-android-reconciled-runtime`.

### React Native navigation at accessibility text sizes

The iPhone maximum-text check exposed single-line destination labels truncated to fragments.
Commit `02178c35` removes the line limit at native font scales of 2 or greater, retaining native
text scaling, full accessibility names and controlled selection/reselection behavior. Regression
coverage includes long Spanish labels, a live scale change, selected and disabled destinations.
The rebuilt Release app displayed all four complete labels at the iPhone 17 Pro iOS 27 Simulator's
maximum text setting; Home-to-Examples selection worked and restoring the standard text size
restored the compact bar. Long labels still wrap within narrow destinations and substantially
increase bar height, so this is a truncation fix rather than complete large-text qualification.
Before/after screenshots use Home, light appearance and the same maximum text setting. The
preserved after artifact and report are under `.build/native-quality-react-native-ios-navigation-runtime`;
all 76 installed artifact files and eight application input files matched their captured hashes.

The live text-size finding reproduced against the preserved `02178c35` Release app: selecting
record 002 at standard text size and changing the iPhone Simulator setting from 3 to 11 left the
title, Back/Edit labels and chart heading visibly clipped within their earlier container heights.
The navigation bar reflowed. A newly opened edit sheet rendered its heading, labels and note at
the enlarged size without that clipping; restoring text size 3 restored the underlying detail.
The observed stale-layout behavior matches the open upstream
[React Native 0.86 issue 57512](https://github.com/react/react-native/issues/57512), but an upstream
report is not proof of the exact cause in this host. Do not disable native font scaling or remount
the whole application as a workaround: either would change accessibility or application state.
The clipping screenshot is preserved beside the navigation artifact, and runtime large-text
qualification remains failed until a fix is independently verified.

Large-text sheet scrolling reached Cancel and Save after
dismissing the keyboard; that observation does not prove Save remains reachable with the keyboard
visible at maximum text size. Re-focusing the note hid those actions behind the keyboard; the
attempt to scroll without dismissing it was interrupted by Device Hub accessibility errors.
Native typing also opened the host accent picker; an accessibility value update set the note,
but this was not a successful native long-note typing/save check. The draft was explicitly
cancelled after restoring text size 3. These findings remain open alongside VoiceOver and hardware checks.

For the navigation fix, `pnpm run test` passed 1,189 tests in 98 files with local loopback access,
`pnpm run typecheck` and `pnpm run lint` each passed 23 tasks, the React Native package build and
iOS Release host build passed, and the regenerated MCP snapshot passed its consistency check.
The iOS build still emitted external native build warnings. The clean packed React Native consumer
also passed installation, peer, contents and strict TypeScript checks. Repeating the Android Hermes
benchmark with three exports per scenario passed the configured budgets: baseline 1,429,228 bytes,
root without icons 6,205,936, foundations 1,451,478, static graphics 1,634,493 and root with icons
6,206,006. The equivalent three-export iOS run also passed: baseline 1,424,195 bytes, root without
icons 6,201,013, foundations 1,446,437, static graphics 1,629,152 and root with icons 6,201,082.
These are bytecode measurements, not native startup or scrolling qualification.
The full canonical gate has not passed. A fresh `pnpm run check:security` still failed with the same
three high-severity advisories and no patched versions listed by the audit.

### Repeated React Native Android startup observation

The updated React Native host assembled with JDK 21.0.12.1 and the emulator's `arm64-v8a` ABI at
task revision `7dd9027c7`. The development-signed Release APK is preserved under
`.build/native-quality-react-native-android-navigation-runtime`; its SHA-256 is
`20a50c61a9503942ef0e033641bdafb5e7d182e99ed42c617fab11a60305d7c2`.
Signature verification passed, installation on `emulator-5554` succeeded, and the installed APK
hash matched before and after five force-stopped process launches. Raw Android Activity Manager
records contain successful COLD launches of 773, 782, 491, 392 and 608 ms, with a median of 608 ms
and p95/maximum of 782 ms. The report captures application/package inputs and emulator OS, API,
display, density and text scale. No application database was cleared. These observations measure
Activity Manager `TotalTime`, not full time-to-interactive, hardware performance, scrolling or an
established regression budget.

This host's native gate failed. The initial attempt selected Android Studio's JDK 25 and stopped
in CMake configuration after a Java native-access warning; retrying with documented JDK 21 resolved
that failure. `:app:assembleRelease` then succeeded, but `:app:lintRelease` reported one error and
59 warnings. Expo's generated `res/values/styles.xml:13` sets `android:windowSplashScreenBehavior`,
which requires API 33, in an unqualified style despite minimum SDK 24. The installed
`expo-splash-screen` 57.0.9 source generates this item directly; the registry still lists 57.0.9 as
the latest compatible major-57 release. Keep the original failed build and lint reports. Do not
raise the minimum SDK, suppress lint or count the assembled artifact as a successful native gate.
Generated-host and dependency warnings include scoped-storage permissions, private AppCompat
resources and unused resources; they also remain reported. Interactive Android qualification
could not run through the UI tool, which did not recognize the running emulator application.

### Android splash resource qualification

The playground now runs a local Expo finalized mod after resource generation. It removes only
`android:windowSplashScreenBehavior` from the base splash style and emits the complete splash
style in `values-v33/lumen-splash-api.xml`. Common attributes and unrelated resources remain
unchanged. Minimum SDK 24 is retained; no lint suppression or dependency upgrade is introduced.
Remove the plugin after a compatible Expo upgrade fixes generation, then regenerate a clean host
to retire the owned qualified resource.

Three plugin tests cover resource preservation, immutable transformation, missing-contract errors
and repeated application through Expo's actual mod compiler. Together with the six existing
playground tests, all nine tests pass. Both application and plugin strict type checks and the
playground's zero-warning JavaScript lint pass. The plugin's Node types are isolated from the
application's React Native globals. The MCP snapshot remains current.

A freshly generated qualification host retained its isolated Android application ID and disabled
OTA updates. Its base style excludes the API 33 attribute and its qualified style includes it.
Applying the final plugin again left both generated files byte-identical. The first corrected
JDK 21 release assembly and lint run succeeded, reporting zero errors and 59 warnings rather than
the previous API error. The original failed reports remain preserved. Native dependency and
generated-host warnings remain open; this is not zero-warning native qualification, physical-device
evidence or completion of the v4 gate.

The final plugin at `8a960037` passed a second fresh-host JDK 21 release assembly and lint run,
again with zero errors and 59 warnings. Its preserved APK has SHA-256
`4892c4825e47920db076aaf278136f6aea973222f6b8c67bd0457755b1f6d35d`; signature verification
passed. The artifact, seven configuration/plugin input hashes and lint report are under
`.build/native-quality-react-native-android-splash-runtime`. Minimum SDK 24 was verified in the
merged manifest. The full JavaScript suite passed 1,189 tests; the final root type and lint checks
each passed all 23 tasks. The Expo web export passed. These results belong to the pre-reconciliation
task candidate, rather than the subsequently combined release.

The release advanced to `10d25bd9` and now contains the earlier native-quality work through
`3cb972ce`, verified by ancestry. The isolated task branch cleanly reconciles that combined release;
the new splash fix still requires combined validation and local release integration. Historical
runtime artifacts retain their tested revisions, and do not qualify the combined release.

### Combined candidate verification

The reconciled candidate `ecdcb322` passed 1,313 JavaScript tests in 119 files, all 23 root
type-check and zero-warning lint tasks, ten playground tests, 69 shared and 23 platform native
contracts, 305 classified React Native exports, 183 supported Compose declarations, 22 reviewed
Swift compatibility diagnostics, and the clean packed React Native consumer. The canonical
`pnpm run validate` passed the monorepo build but stopped at existing web bundle budgets: shared
CSS was 199.7 KiB raw / 32.4 KiB gzip, React components 168.1 / 34.7 KiB and Elements gzip
44.4 KiB. The corresponding limits remain 199.2 / 32.2, 167.0 / 34.2 and 43.9 KiB. The splash
fix changes none of those sources or limits. Checks after that failed step are not implied green;
the native checks above were run independently.

A fresh combined Android host passed release assembly and lint with zero errors and 59 warnings.
The artifact is preserved under `.build/native-quality-react-native-android-combined-runtime`
with SHA-256 `c0895aefe92d0f1dd702fd92c68f58eb6b1815907c17971db767f4f676beecac`.
All 257 generated-host and compiled library input hashes matched after the final validation build;
signature verification passed. The preparation report remains preserved separately because Expo
rewrites the staged Android/iOS development scripts during generation. Dependencies were unchanged,
and final input capture happened after generation. The isolated app installed on the Android 17
emulator, and the installed APK hash matched before and after five force-stopped process launches.
Activity Manager samples were 1,185, 828, 657, 554 and 564 ms: median 657 ms and p95 1,185 ms.
No application database was cleared. These observations do not establish full time-to-interactive,
scrolling, hardware qualification or passing regression thresholds.

Three Android Hermes exports per fixture passed the unchanged import budgets: baseline 1,429,229
bytes, root button 6,253,769, foundations 1,451,478, static graphics 1,634,493 and named root icon
6,253,837. Repeated iOS exports also passed: baseline 1,424,195 bytes, root button 6,247,982,
foundations 1,446,438, static graphics 1,629,152 and named root icon 6,248,052. The new splash fix remains on the
task branch pending a passing combined gate and serialized local release integration. Native
large-text failures, physical-device and screen-reader checks, and stability iterations remain open.

The combined iOS Release host built at `737838ec`, using the same verified application inputs
prepared at `ecdcb322`, and launched on the iPhone 17 Pro iOS 27 Simulator. Scene support remained
enabled and OTA updates disabled. The preserved app contains 76 file hashes; all installed files
matched after the native flow. Home-to-Examples-to-Workspace navigation and record 002 selection
worked. Changing text size live from 3 to 11 reproduced clipped detail title, Back/Edit labels
and chart heading within stale heights, while navigation reflowed. This confirms the large-text
failure on the combined candidate; it does not identify the exact upstream cause or qualify the
remaining keyboard, VoiceOver or hardware flows. Standard text size 3 and Device Hub's sidebar
layout were restored. No draft was opened or record changed. Privacy-safe before/after screenshots,
the app and input/artifact report are preserved under
`.build/native-quality-react-native-ios-combined-runtime`. Native dependency warnings remain in
`.build/native-quality-react-native-ios-combined-build.log`; a successful build is not a
zero-warning native or accessibility pass.

A temporary Release text-layout probe compared plain React Native `Text` with `LumenText` using
static paragraphs without fixed heights. Both rendered four lines with a reported widest line
of 360 at font scale 1.000. A live change to maximum text size produced scale 3.571 and visible
clipping in both renderers; each callback then reported only one line, widest 362. The initial
controlled field value remained, but no edited-draft retention was qualified. This reproduces
the defect outside Lumen's text implementation, rather than proving its exact renderer-cache cause.
The original probe passed strict TypeScript and the native Release build; all 76 installed app
file hashes matched after the comparison. Its source, artifact, report and privacy-safe screenshots
are under `.build/native-quality-text-layout-probe`. A maintained diagnostic fixture now lives in
`apps/playground-react-native/src/fixtures/TextLayoutProbe.tsx`; its labels use single expressions
and repository formatting rather than the temporary probe's multi-expression labels.
The maintained fixture passed repository type checking and zero-warning lint (23 tasks each),
the ten playground tests, and focused documentation lint and spelling checks. A subsequent
read-only check confirmed all 76 installed files still match the preserved combined app.
Standard text size, Device Hub's sidebar, the original host entrypoint and the preserved combined
qualification app were restored. The public playground entrypoint is unchanged. This remains a
failed accessibility result; neither font scaling nor application state was disabled to hide it.

### Outstanding scope and blockers

The complete Required outcomes list remains authoritative. Broader phone/tablet runtime qualification and physical-device keyboard/focus and screen-reader checks,
remaining SwiftUI and React Native runtime measurements, performance regression thresholds, final real-consumer qualification and two ordinary
stability iterations remain pending. No hardware pass or soak iteration was recorded.

The first Android `./gradlew test lint assembleDebugAndroidTest` reached compilation and tests,
but lint remained active for over 30 minutes in `BidirectionalTextDetector` Kotlin PSI traversal.
That task-owned daemon was stopped. Fresh full lint runs now pass without suppressions, including after reconciling committed release icon changes.
The canonical `pnpm run validate` initially failed because its loopback fixture server was blocked by the sandbox.
After local-server access and snapshot regeneration, it reached `check:security` and failed on three
high-severity dependency advisories in `node-forge`, `http-cache-semantics`, and `braces`. The reconciled canonical gate, including the six new runtime-parser tests, passed all preceding checks and again stopped at `check:security`. The complete gate remains failed; committed release dependency updates were reconciled into this branch and the audit was rerun, but those three advisories remain.

After reconciling `04178a3d` and committing the scene-support/benchmark fixes at `49d483cc`,
`pnpm run validate` passed all checks preceding `check:security`, including 1,188 JavaScript tests
in 98 files, builds, strict type checking, zero-warning lint, spelling, API/contracts and generated
snapshot checks. It again stopped on the same three high-severity advisories. The clean packed
React Native package separately passed installation, peer, content and strict consumer checks.
The full gate is still failed. Further canonical checks following security are not implied green.

The selected `release/v4.0.0` at committed revision `04178a3d` contains the native implementation,
static-graphics entrypoints, Android runtime collector and status-bar fix, and Apple UI-test commits
through `efa3e53a`; Git ancestry verified that containment. The isolated qualification branch was
fast-forwarded to that committed release revision. This containment is local integration evidence,
not a passing canonical security gate or publication approval. The shared release checkout has
unrelated concurrent changes; preserve its ownership. Further task changes require validation and
serialized integration in a clean, idle release worktree. The new qualification record and iOS
scene-support/benchmark, phone verification and navigation commits (`3e719a0f`, `49d483cc`,
`fb589f38`, `02178c35`) remain on the task branch: the canonical
security gate is failed and the release checkout has unrelated active Core and React edits.
Do not overwrite those edits or bypass the failed gate. Publication remains outside this
implementation authorization. Physical-device and release stability evidence must bind their
actual tested revision; historical records retain their original attribution and version.

See [runtime performance](native-runtime-performance.md), [native patterns](native-patterns.md), [device validation](native-device-validation.md),
[consumer qualification](native-consumer-validation.md), and [v4 readiness](lumen-4-readiness.md).
