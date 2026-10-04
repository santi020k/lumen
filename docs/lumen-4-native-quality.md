# Lumen 4 native quality

<!-- cspell:words performancequalification -->

<!-- cspell:words Automator logcat -->

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
  against the local library; three workspace instrumentation tests passed for saved-state restoration, editing, cancel and retry, including actual Activity recreation with an open draft and a saved record. Parent destination and pattern selection now use saved state. These earlier tests cover Activity recreation; see the separate process-death evidence below. All 19 root instrumentation tests passed on the
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

### Isolated Android runtime collector

A separate development-signed, non-debuggable `benchmark` variant now uses the
`.performancequalification` application ID. The separate test driver collects five process-cold
launches and six cumulative frame snapshots while scrolling the actual Workspace record list.
Only the test driver uses the UI Automator Shell dependency and its loopback Internet permission;
the library and playground runtime permissions are unchanged. Three reporter tests cover sample
completeness, warm-launch rejection, deduplication and future-completion exclusion, alongside the
six existing parser tests. The canonical validation command includes the reporter tests.

Two local Android 17/API 37 emulator runs at 1280×2856, density 480 and font scale 1.0 produced:

| Run | Cold launch median / p95 | Eligible frames | Frame median / p95 | Missed deadlines |
| --- | --- | ---: | --- | --- |
| First | 314 / 337 ms | 151 | 32.0 / 51.3 ms | 29 (19.2%) |
| Repeat | 301 / 446 ms | 123 | 61.1 / 128.1 ms | 98 (79.7%) |

Both moved visible record IDs from 001–009 to 047–060 and excluded no future completions.
Each instrumentation test passed; driver lint reported zero errors and warnings. The existing
process-death restoration test also passed again with the expanded driver. The large scrolling
variation prevents choosing a regression threshold or claiming an optimization. These runs use a
different collection workflow from the earlier measurements above and are not directly comparable.
They establish neither physical-device readiness, full time-to-interactive nor stability iterations.

Both raw runs remain local under `.build/native-quality-android-runtime-benchmark-first` and
`.build/native-quality-android-runtime-benchmark`. The repeat report records source base `d5ed5305`
plus the then-uncommitted benchmark/driver changes, source hashes, test results, lint and preserved
APKs. Runtime input hashes matched after the run; the installed benchmark APK matched preserved
SHA-256 `8f5e59aa6f749e7114c07cf162c55886267fd6fdaeb9c0257244cf0505516899`.
See [runtime performance](native-runtime-performance.md) for the isolated workflow.

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

### Android long-note keyboard regression

The new Activity test opens the Workspace editor, focuses Notes, enters a 1,160-character note,
and requires Save to remain displayed while the sheet dialog's actual IME insets report a visible
keyboard. It then saves, checks visible confirmation, reopens the editor and verifies the exact
note. The first run exposed a test-harness error: pinned Save has no scroll ancestor. After fixing
that action while retaining the visibility and keyboard assertions, the test exposed hidden save
feedback below the long note. The workspace now places confirmation and Edit above the note.

The touched record lists now use immutable values with an explicit Compose list saver, resolving
the two mutable-collection state warnings while retaining saved-state restoration. All six Android
playground instrumentation tests passed on the Android 17/API 37 emulator after these changes,
including Activity recreation, Compose saved-state restoration, keyboard editing and catalog
search. Compilation and lint completed; lint still reports 26 existing warnings or hints in other
playground code and assets, so this is not a zero-warning gate.

Testing used an ignored host under `.build/native-quality-android-keyboard-host` with the separate
application ID recorded in `final-report.json`; the original
playground installation was preserved. Source and APK hashes, the failing feedback result, and the
final six-test result are retained there. The full log is
`.build/native-quality-android-keyboard-final-test.log`. The computer-use tool does not expose the
Android emulator, so before-and-after visual screenshots remain unverified. This emulator pass
neither proves process-death restoration nor qualifies physical devices, large text or screen readers.

### React Native and SwiftUI long-note feedback

Both reference workspaces now place save confirmation and Edit above the note, matching the
Android correction. React Native's phone web preview previously returned focus to Edit below the
long note and scrolled the title above the viewport (top -344.5); after the change, the title stays
visible at top 72. Phone 390×844 and desktop 1280×900 before-and-after screenshots were inspected
with the same record, 1,160-character note and light theme. Reopening the editor preserved the
exact note on both layouts. The maintained web accessibility canary now repeats that workflow,
requires focus restoration and fully visible title/confirmation, and verifies exact draft retention.
It passed in English and Spanish against a fresh production web export. The unsupported web BackHandler warning also
revealed that the Workspace hook registered on every platform; it now registers only on Android.
App type checking, zero-warning lint and all ten unit tests passed. These web checks do not prove
the revised layout in React Native's iOS or Android host. Screenshots, source hashes and the stale
preview excluded from verification are retained under `.build/native-quality-rn-long-note`.

The SwiftUI Release test was strengthened to enter the same long note through the native keyboard,
require visible confirmation and Edit after saving, and reopen the editor to compare the exact
note. The baseline failed its confirmation visibility assertion; the corrected iPhone 17 Pro iOS
27 Simulator run passed. Before-and-after saved-note screenshots and the keyboard-visible Save
screenshot were inspected. Both runs used separate task-owned simulators of the same model and OS
with default text size; the source inputs and twelve-file application manifests are preserved under
`.build/native-quality-apple-long-note`. The after result bundle is
`/private/tmp/lumen-native-quality-long-note-after.xcresult`. Baseline result finalization waited on
Xcode simulator diagnostic collection; its live process was preserved until it ended, and the after
run used separate simulator and build paths. Build/runtime logs retain SDK metadata and Simulator
accessibility class warnings. This is one focused native behavioral pass, not a
performance, physical-device, large-text, screen-reader or stability qualification.

Repository type checking and zero-warning ESLint passed 23 tasks each. A fresh
`pnpm run check:bundle-size` still failed the unchanged CSS, React and Elements budgets; its exact
diagnostics are preserved in `.build/native-quality-long-note-bundle-check.log`. No budgets were
raised. The full release gate and local integration remain incomplete.

### React Native iOS feedback announcements

Toast and ErrorState previously set Android live-region properties without posting iOS speech.
They now post the supplied title and description through React Native's native announcement API
on iOS. Polite messages queue behind current speech; assertive errors interrupt it, and the existing
ErrorState off setting suppresses speech. Unchanged copy does not repeat on ordinary rerenders or
Strict Mode effect replay. Explicit iOS announcements omit diagnostic references and action labels;
action and dismiss controls retain their existing semantics. Android and web retain live regions
without a second imperative announcement.

Five new behavioral cases cover localized updated toast copy, deduplication, error urgency/off,
empty messages and Android/web behavior. All 143 React Native tests passed, with unchanged public
API classification. These tests verify calls and semantics, not successful VoiceOver delivery or
physical-device qualification. Package documentation and a Changeset describe the correction.

At committed runtime revision `373eb37a`, the full JavaScript suite passed 1,319 tests; repository
type checking and zero-warning lint passed 23 tasks each. The clean packed React Native consumer
and regenerated MCP snapshot/evaluation passed. Three Hermes exports per fixture on Android and
iOS passed every unchanged import budget. The canonical gate still stops at the unchanged web
CSS, React and Elements size limits; local release integration remains incomplete. Import logs
and post-export committed runtime source hashes remain under `.build/native-quality-rn-announcements-*`.

### Android notification reading time

React Native's `useToast` now asks Android for its recommended accessibility timeout before
scheduling automatic dismissal. It retains at least the requested duration, falls back to it on
failed or invalid recommendations, and preserves explicitly persistent toasts. Request tokens
prevent late native responses from restarting timers after duration updates, dismissal, clearing,
eviction or unmount. iOS/web timing and the public API are unchanged.

Thirteen new behavioral cases cover longer reading time, shorter/invalid/oversized/rejected native
results, cancellation races, updated durations, persistent messages and iOS/web behavior. The
extended-reading-time regression failed against the previous hook; the corrected package passed
156 React Native tests. The full JavaScript suite passed 1,332 tests, repository type checking and
zero-warning lint passed 23 tasks each, and the clean packed consumer passed. These checks exercise
the native API boundary using controlled recommendations; actual Android accessibility settings
and physical-device behavior remain unverified. Package documentation, a Changeset and the
regenerated MCP snapshot describe the correction. Local logs remain under
`.build/native-quality-toast-timeout-*`.

Three production Hermes exports per fixture also passed every unchanged Android/iOS import budget
for runtime source `14c0cda1`. The source hashes recorded after export match that committed runtime;
only qualification documentation changed during measurement. Raw logs and the import report remain
local. These bytecode-size checks do not establish startup, scrolling, hardware or stability passes.

### RoadScore v4 compatibility canary

The real RoadScore mobile source at committed revision `487ba102` passed strict type checking,
zero-warning lint and all 180 tests against packed v4 React Native/core packages. Android and iOS
Hermes production exports plus the web export passed without application source changes. Ten dirty
paths in the original checkout were preserved; the canary used committed source in an isolated
copy. Peer diagnostics failed identically in both the original checkout and candidate, reflecting
existing lint-tool ranges. The [consumer record](native-consumer-validation.md#lumen-4-local-roadscore-compatibility)
describes exact inputs, hashes and limitations. This establishes local compatibility, not a
published, adopted, signed or physical-device-qualified consumer; the qualification ledger remains
unchanged.

### Current completion audit

The audit at `14c0cda1` does not prove completion of the Required outcomes above. Current
readiness commands still report five incomplete real-consumer records, 22 incomplete physical-device
slots and zero of two stability iterations. Preserve the historical records; they do not qualify
this candidate. The consumer audit is source/design evidence, not a consumer upgrade pass.

| Required outcome | Available evidence | Work still required |
| --- | --- | --- |
| Sheets/forms | Historical native keyboard/save/draft tests and current unit contracts | Rebuild affected hosts for the final candidate; complete device focus/dismissal checks |
| Android adaptation/state | Lazy record list, Activity recreation and process-death tests | Workspace still uses its own width split rather than the public hinge-aware scaffold; migration decision pending |
| Apple adaptation | Historical iPhone/iPad Release UI tests and large-text observations | Exact-candidate device accessibility and runtime qualification |
| React Native integration | Native-host flow history, strict packed consumer and current behavioral tests | Exact-candidate native host checks for announcement delivery, timeout settings and live text scaling |
| Performance | Production Hermes budgets and two preserved Android runtime runs | Stable startup/scrolling baselines and frame/hitch evidence; emulator variance is unexplained |
| Localization/accessibility | English/Spanish local examples and automated semantic/layout checks | Physical screen-reader, alternate input, RTL, contrast, motion and maximum-text evidence |
| Workflows | Search/edit/save/retry/chart examples with local tests | Repeat affected complete journeys against the final native candidate |
| Qualification/contracts | Reviewed APIs, Changesets and migration documentation | Final consumers/devices, aligned stability policy and two qualifying iterations |
| Validation/integration | 1,332 JS tests, 23 type/lint tasks and packed consumer pass | Resolve canonical web size failures, rerun full gate and integrate locally into `release/v4.0.0` |

Source review confirms Workspace already uses `LazyColumn` with stable record keys. The runtime
variation alone does not justify attributing delays to rendering every record or adopting a
speculative optimization. Its hand-written width split lacks the public scaffold's window/hinge
policy and currently collapses at font scale 2; any migration must preserve that large-text behavior,
selection, draft state and Back behavior. The proposed migration awaits the user's choice.

The stability checker still requires ordinary, published pre-2.0 versions and published-artifact
verification, while v4 readiness requires two iterations for the changed baseline. This mismatch is
not resolved by rerunning benchmarks or changing a version number. The user has been asked to choose
between two published v4 prereleases with consumer/device evidence and two local candidate builds;
the latter removes the existing published-artifact requirement. No policy or publication action has
been adopted while that choice is pending.

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

### React Native iOS long-note verification

A fresh iOS Release host built and launched from committed revision `20e9a89b` on the
task-owned iPhone 17 Pro iOS 27 Simulator. The public playground entrypoint was restored
from the diagnostic probe; scene support remained enabled and OTA updates disabled.
Native Home → Examples → Workspace navigation, searching for record 200, editing and
saving a 1,160-character note succeeded. The saved confirmation and Edit action were
visibly above the long note. Reopening the editor exposed the exact saved value, verified
against the synthetic input, before cancelling.

This run used Device Hub keyboard capture. The software keyboard remained hidden, so
it does not qualify keyboard-visible Save or physical-device focus behavior. Standard
text size remained 3 and keyboard capture was restored to off. The preserved app's 76
installed file hashes and all 258 captured host/library input hashes matched after the
interaction. The app, report and privacy-safe editor/saved screenshots are under
`.build/native-quality-react-native-ios-long-note-runtime`; the native build log is
`.build/native-quality-react-native-ios-long-note-build.log`. This closes the native iOS
long-note persistence and feedback check at default text size, while live large-text
clipping, software-keyboard qualification, screen readers, hardware, runtime performance,
stability iterations, the canonical gate and local release integration remain open.

### Reconciled Android long-note restoration

The task branch reconciled release revision `50990a22` without conflicts at `92206288`.
The Activity recreation test now enters a 1,160-character unsaved note as well as a new
name, recreates the Activity, verifies the exact draft, saves, recreates again and reopens
the editor to verify the exact saved note. All six playground instrumentation tests
passed on the Android 17/API 37 emulator in the isolated qualification host. Native lint
completed with 26 existing warnings or hints; this remains separate from actual process
death and physical-device qualification. The passing XML, APKs, source hashes and report
are preserved under `.build/native-quality-android-long-note-restoration`.

The reconciled shared native contracts, React Native API baseline and Compose API
classification passed. Root type checking and zero-warning JavaScript lint each passed
all 23 tasks. Canonical validation first hit sandbox-denied loopback fixture
servers, then passed that step and the monorepo build with the required access. It still
failed the unchanged CSS, React and Elements bundle limits recorded above. The fresh
log is `.build/native-quality-reconciled-final-validate-loopback.log`; later steps are
not implied green and local release integration remains incomplete.

### Maintained text probe: live scaling versus cold launch

The maintained diagnostic fixture built in the isolated iOS Release host at `a1d5d60f`
and ran on the task-owned iPhone 17 Pro iOS 27 Simulator. At default scale 1.000,
plain React Native and Lumen paragraphs each reported four lines, widest 360. The field
was edited to a synthetic value before changing text size live to 11 (scale 3.571).
The exact edited draft remained in the native field, while both paragraphs visibly
clipped and reported one line, widest 362. This verifies edited-draft retention through
the live change separately from the failed text layout.

Relaunching the unchanged artifact at the same maximum size produced 15 lines, widest
350, for both paragraphs. Inspected top and lower screenshots showed wrapping and the
paragraph's final sentence. The probe's in-memory field reset to its initial value on
relaunch; this is not persisted-draft qualification. Returning to text size 3 restored
both four-line measurements. All 76 installed probe files and captured input hashes
matched after testing. The artifact, raw accessibility observations and screenshots
are under `.build/native-quality-text-layout-probe-maintained`. The original host
entrypoint and preserved public playground app were restored with matching file hashes;
keyboard capture remained off and the sidebar was restored.

The matching [upstream issue](https://github.com/react/react-native/issues/57512) remains
open. The generated host enables React Native's prebuilt core by default, so editing
installed C++ sources alone would not verify a native fix. The live-versus-cold result
narrows the investigation to layout invalidation during scaling; it does not prove an
exact cache cause, qualify large text or justify disabling font scaling or resetting
application state. No renderer patch or production build configuration changed.

### Compose primitive state and Modifier cleanup

Six private playground numeric states now use Compose's specialized integer or float
state factories instead of boxed generic state. The adaptive list/detail example now
places its optional Modifier first, defaults it to `Modifier`, and applies its fill
behavior internally. The fixed-height catalog call uses named arguments; the full-window
call retains its existing fill behavior. No public library contract or dependency changed.

All six Android playground instrumentation tests passed again on the Android 17/API 37
emulator. Native lint completed with 18 remaining launcher-asset/resource findings, down
from 26; all six numeric-state and both Modifier findings are absent from the new report.
This is not a zero-warning native gate or a measured startup/scrolling improvement. Root
type checking and zero-warning JavaScript lint each passed all 23 tasks. The test XML,
lint report, APKs and source hashes are under `.build/native-quality-android-primitive-state`;
the build log is `.build/native-quality-android-primitive-state.log`. Actual process death,
hardware, the renderer fix, stability qualification and local release integration remain
open, including the existing canonical bundle-budget failure.

### Canonical navigation graphic import comparison

The Hermes benchmark now compares four matching icon-button controls (Home, Search,
Activity and Settings) through the root catalog and the static graphics entrypoint.
Both use the same Lumen renderer and canonical generated artwork. The static fixture
extracts only the selected declarations with the TypeScript syntax tree, replacing the
previous text-delimiter extraction. Three regression tests cover comment/string
lookalikes, missing or duplicate declarations and adjacent declarations; they are now
part of canonical validation. No public icon subpath or production dependency was added.

Three Android exports per fixture passed the unchanged budgets. The four-icon static
fixture measured 1,636,454 bytes versus 6,254,003 through the root catalog, a reduction
of 4,617,549 bytes for these matching fixtures. This supports continuing the per-icon
import investigation; copying fixture declarations is not a public consumer API.
The platform baseline was 1,429,229 bytes, foundations 1,451,478 and the single static
search graphic 1,634,493. Native startup and scrolling improvements are not established
by bytecode size. Full samples are in `.build/native-quality-navigation-imports-android.log`.

Three iOS exports per fixture also passed: the matching static navigation fixture was
1,631,102 bytes versus 6,248,221 through the root catalog, a reduction of 4,617,119 bytes.
The iOS baseline was 1,424,196, foundations 1,446,437 and single static
graphics 1,629,153 bytes. Full iOS samples and a source-hash report are under
`.build/native-quality-navigation-imports-ios.log` and
`.build/native-quality-navigation-imports-report.json`. An Android-run formatting change
added only a blank line; the fixture sources and extracted artwork were unchanged.

Root type checking and zero-warning lint passed all 23 tasks. Canonical validation
passed the new fixture tests and monorepo build, then failed the unchanged web bundle
budgets. Its log is `.build/native-quality-navigation-imports-validate.log`; later
checks and local release integration remain incomplete.

### Canonical React Native icon modules

The candidate adds `@santi020k/lumen-react-native/icons/<name>` for all 2,437 canonical graphics.
Use these with the existing `graphics` entrypoint; dynamic root lookups remain unchanged. Brand
paths replace the namespace colon with a hyphen. Both representations are generated from one
catalog and one rendering function. A prototype that made the root catalog import every separate
module added 804,689 bytes to Android root navigation and exceeded the unchanged 6 MiB budget.
The accepted layout retains the single-module root catalog and emits optional per-icon modules.

Three production Hermes exports per fixture passed the existing Android and iOS budgets. The
four-icon public per-icon navigation fixture measured 1637596 bytes on Android and
1632243 bytes on iOS, compared with 6254003 and 6248221 bytes respectively for matching
root navigation. These are bundle-size checks; they do not establish startup latency, native
scrolling performance, physical-device accessibility or stability-soak qualification.

The new API tests reject unclassified declaration forms, extra directory members, mismatched
index paths and unreviewed package targets. The baseline checks every member and classifies 2,742
exports across five entrypoints/families (2,700 unique symbols). Root `pnpm run typecheck` and
`pnpm run lint` passed all 23 tasks; `pnpm run test` passed all 1,314 tests in 119 files with local
HTTP test listeners enabled. All 138 React Native tests passed, including matching interface and
brand geometry and accessible labels. The clean packed package passed installation, peer,
contents and strict TypeScript consumer checks for both public icon paths. Generated icon checks,
native contracts and v4 migration checks also passed.

`pnpm run validate` passed its earlier checks and all 14 build tasks, then stopped at the existing
web bundle overruns: CSS 199.7 KiB raw/32.4 KiB gzip, React components 168.1/34.7 KiB and Elements
44.4 KiB gzip. Budgets remain unchanged. Later canonical steps are not implied green, and local
release integration remains incomplete. Logs and source-hashed reports are preserved under
`.build/native-quality-static-icon-*`; measurements used source base `b5b2a05e` plus this task's
uncommitted public API, generator and fixture changes, before their focused commit.

The first commit attempt exposed canonical brand-name spell diagnostics. A generated dictionary
now supplies exact catalog vocabulary only for the per-icon modules, export index and reviewed API
baseline. Prose remains checked; no ignore path or quality rule was widened. The generator changed
after the measurements solely to emit this dictionary; every recorded runtime/package input still
matches its measurement hash. Generated-source validation and the vocabulary check passed.

### Android stopped-process restoration

A separate `restoration-driver` instrumentation application now exercises process death without
killing its own runner. It edits record 200, retains an exact 1,160-character unsaved note, sends
the isolated playground to the background and uses `am kill`. The test requires the old PID to
disappear before resuming the existing task in a new process, then verifies the exact draft. It
saves the record, kills the background process again, and verifies the restored title, saved
feedback and exact reopened note. The final Android 17/API 37 emulator run passed one test with
zero failures and errors; Final PID transitions were `9155 -> 9541 -> 9755` and are retained in the preserved test log. Driver lint passed with zero
warnings and errors after fixing its backup configuration and missing icon.

The opt-in `lumenQualification=true` debug profile installs only the separate qualification app.
Generated manifests confirm the normal debug and release package IDs remain unchanged, including
release with the qualification flag enabled. The driver rejects every target package except that
isolated installation. Its UI Automator 2.4.0 dependency is test-only and was verified against
Google Maven and the official stable release notes. It is absent from the phone library and app
runtime dependencies.

Source base `eb25e894` plus this task's driver, debug profile and documentation changes was used
before the focused commit. Preserved APKs, exact installed-target checksum, source hashes, passing
instrumentation XML, logcat, zero-issue driver lint and manifest comparisons live under
`.build/native-quality-android-process-restoration`. Repository type checking and zero-warning
lint each passed all 23 tasks. `pnpm run validate` again stopped at the unchanged web CSS, React
and Elements size overruns after all 14 build tasks passed; release integration remains
incomplete. Gradle 9.8 also reports `Configuration.setVisible(boolean)` deprecation in the build
configuration/plugin graph; no repository build script invokes that method. No rule was weakened.
This evidence covers this emulator workflow and actual stopped-process restoration, not removed
tasks, app-storage persistence, physical devices, startup/scrolling budgets or stability soak.

### Icon API baseline and qualification ledger

The final qualification audit caught a stale React Native API digest in the stability ledger after
the additive per-icon API change at `eb25e894`. Comparing the candidate with `b5b2a05e` confirms
that root, datetime, foundations and graphics contracts are identical; the only baseline addition
is the reviewed `icons/*` family with 2,437 supported graphics. The ledger now records the current
reviewed React Native digest. Its iteration list was and remains empty, so no completed evidence
was removed or fabricated. A regression test requires stale hashes to fail before any soak
iteration can be accepted. The checker validates all seven baseline hashes and still reports
`0/2` completed iterations. Five real-consumer records and all 22 physical-device evidence slots
remain incomplete. Structural checker success does not establish qualification or stable readiness.

All 20 soak-ledger regression tests passed after the digest update, as did repository type checks
and zero-warning lint (23 tasks each). The canonical validation gate again passed all 14 builds
before the existing web bundle-size failures. The required-complete soak check still rejects the
empty iteration list; no release or remote integration was performed.

### Current ContracTrack consumer compatibility

An isolated copy of committed ContracTrack `ddc1687b67e13e968a31cbc9995b7cfee5bd5b7b` built
against candidate `ed125c78` without application-source changes. Android phone and Wear resolved
local 4.0.0 Maven artifacts, passed 126 unit tests, reported zero lint issues and produced both
debug APKs. Unsigned iOS Simulator, macOS and watchOS Simulator application builds passed against
the local Swift package. The original checkout's revision and clean status were preserved.
The iOS notification-service extension retained a metadata-extraction warning for its absent
App Intents dependency; other application targets use App Intents.

The consumer's current Apple source does not import `LumenWidgetUI`, so its widget builds do not
qualify that adapter. Native source hashes captured after build start still matched at completion;
logs and artifact hashes remain local. See [consumer validation](native-consumer-validation.md)
for commands and evidence limits. Physical-device, accessibility, published-artifact upgrade and
stability requirements remain open; no qualification ledger status changed. Canonical validation
and local release integration remain incomplete because of the previously recorded web bundle
budget failures.

### React Native slider direction

The slider previously converted touches from the physical left edge even when the native layout
was right-to-left. A component regression reproduced a right-edge touch returning the minimum
value. Touch and drag coordinates now reverse in native RTL mode; the thumb uses logical start
positioning and margin rather than physical left properties. Screen-reader increment and
decrement continue to increase and decrease the numeric value in both directions.

Behavioral coverage checks both directions, touch start and movement, range endpoints, out-of-track
clamping and accessibility actions. This proves the controlled callback boundary, not native
rendering, screen-reader delivery or physical-device RTL qualification. Runtime screenshots and
interaction verification remain pending. The API is unchanged; package guidance, a Changeset and
the generated MCP snapshot describe the fix.

All 1,334 JavaScript tests passed after the regression update. Root strict type checking and
zero-warning lint passed all 23 tasks each; the unchanged native API baseline, generated MCP
snapshot and evaluation, and clean packed React Native consumer also passed. Canonical validation
passed all 14 build tasks and stopped at the same CSS, React and Elements bundle-budget overruns.
No budget was raised. Logs remain under `.build/native-quality-slider-rtl-*`; local release
integration and the remaining native qualification requirements are incomplete.

### Native slider accessibility exposure

The isolated iOS Release RTL probe at `adcd19a6` displayed both sliders but exposed neither
as an adjustable element in Device Hub's native accessibility tree. The slider track now sets
`accessible`, and the component regressions require that explicit exposure in both native
directions. Package guidance and a Changeset describe the correction; the API remains unchanged.

The rebuilt probe exposed an enabled Volume slider and a disabled Disabled volume slider,
including current value and increment/decrement actions. Native increment changed the controlled
value from 25 to 30; decrement returned it to 25. Attempting increment on the disabled slider
left it at 25. Clicking the enabled control through its accessibility element selected 50.
Coordinate endpoint clicks and drags did not change the control through Device Hub, so native
endpoint/drag verification remains open. This is native accessibility-action evidence, not
VoiceOver speech, Android, physical-device or stability qualification.

Both artifacts, source hashes, screenshots and the corrected accessibility tree remain local
under `.build/native-quality-slider-rtl-runtime` and
`.build/native-quality-slider-accessible-runtime`. All 76 installed corrected application files
matched the preserved artifact. The corrected probe also changed its diagnostic background to
light, so these screenshots are not a matched pixel-regression comparison. The in-app restoration
control cleared the temporary force-RTL preference, verified as false in the qualification app's
preferences; the original host entrypoint and previously preserved app were restored.

All 1,334 JavaScript tests and all 23 root type-check and zero-warning lint tasks passed. Apple
build logs retain external React umbrella-header and native dependency warnings without
suppression. Remaining qualification requirements and local release integration remain open.

The packed React Native consumer, unchanged API classification and regenerated MCP snapshot and
evaluation passed. Canonical validation again passed all 14 build tasks before the unchanged
CSS, React and Elements bundle-budget failures. No limits were raised or failed gate bypassed.

### Current committed Hermes import measurements

Candidate `81e096c9`, including slider RTL and native accessibility exposure, passed three
production Hermes exports for each of eight fixtures on both Android and iOS. All unchanged
import-size budgets passed. The 2,558 React Native/core source files captured before measurement
still matched after both platforms completed. Raw samples and reports remain local under
`.build/native-quality-current-import-*`.

| Import fixture | Android bytes | iOS bytes |
| --- | ---: | ---: |
| baseline | 1,429,228 | 1,424,195 |
| root-no-icon | 6,255,231 | 6,249,033 |
| foundations | 1,451,478 | 1,446,437 |
| graphics | 1,634,493 | 1,629,152 |
| graphics-navigation | 1,636,454 | 1,631,101 |
| catalog-navigation | 1,637,596 | 1,632,243 |
| root-navigation | 6,255,464 | 6,249,261 |
| root-icon | 6,255,296 | 6,249,102 |

These medians measure imported bytecode. Export duration is a build-host observation, not
application startup or frame smoothness. Physical-device accessibility, real-consumer completion
and two qualifying stability iterations remain open, as do the previously recorded canonical
web-size failures and local release integration.
