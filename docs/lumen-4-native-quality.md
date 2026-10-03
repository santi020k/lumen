# Lumen 4 native quality

This record tracks the native improvements authorized for the v4 candidate. The implementation
branch is `feature/native-v4-quality`, based on release commit `d0e9eeb5`. Preserve concurrent v4
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

- React Native: 118 behavioral/unit tests passed, with strict type checking and zero-warning lint.
  The new Workspace example has six playground tests, including two workspace model tests for search and isolated record saves; its
  Expo web build passed. Desktop 1280×900 and mobile 390×844 interactions covered selection,
  editing, save feedback, and chart rendering, with temporary screenshots inspected.
- Swift: 51 LumenUI and three WidgetKit tests passed. The new native split-view workspace compiled
  in the macOS playground; iOS/iPad runtime verification remains pending. API extraction succeeded on all five Apple
  targets; the source-compatibility gate validated 13 explicitly reviewed v4 diagnostics.
- Compose: compilation and unit tests passed. The Android adaptive workspace debug APK compiled
  against the local library; runtime and Activity-recreation checks remain pending. All 18 root instrumentation tests passed on the
  Pixel 10 Pro Android 17 emulator, including translated accessibility descriptions and a long
  form whose pinned Save action remains visible before and after body scrolling. API dumps and
  declaration classifications were regenerated and checked.
- Documentation/MCP: docs type checking, shared native contracts, the draft v4 contract, generated
  MCP snapshot and search/example evaluation passed. The clean packed React Native root consumer
  passed again with root, datetime, and foundations imports together.

### Production import measurement

Three Android Hermes production exports per fixture produced these median bytecode sizes:

| Fixture | Bytes |
| --- | ---: |
| Platform button baseline | 1,429,228 |
| Lumen root button | 5,872,687 |
| Lumen foundations button | 1,447,896 |
| Lumen root button with named search icon | 5,872,764 |

The optional `@santi020k/lumen-react-native/foundations` entrypoint reuses the root implementations
and provider context while avoiding eager imports of the full catalog. Its 18,668-byte overhead
above the baseline is bounded at 65,536 bytes; the existing root fixture is bounded at 6 MiB.
A single iOS Hermes run passed both budgets: baseline 1,424,195 bytes, foundations 1,442,836,
root button 5,867,149, and root icon 5,867,215. Repeat iOS sampling remains pending.
Run `pnpm run check:react-native-imports`; set `LUMEN_BENCHMARK_PLATFORM=ios` to measure iOS.
These results are local bytecode measurements, not startup or scrolling latency evidence. Static
per-icon paths and broader component entrypoints remain to evaluate against actual consumers.

### Outstanding scope and blockers

The complete Required outcomes list remains authoritative. Runtime qualification of the new Android and SwiftUI workspaces, Android chart/state recipes, physical-device keyboard/focus and screen-reader checks, repeated iOS production import samples,
startup/scrolling regression measurements, final real-consumer qualification and two ordinary
stability iterations remain pending. No hardware pass or soak iteration was recorded.

The first Android `./gradlew test lint assembleDebugAndroidTest` reached compilation and tests,
but lint remained active for over 30 minutes in `BidirectionalTextDetector` Kotlin PSI traversal.
That task-owned daemon was stopped; lint is unverified and must be resolved without suppressions.
The canonical `pnpm run validate` initially failed because its loopback fixture server was blocked by the sandbox.
After local-server access and snapshot regeneration, it reached `check:security` and failed on three
high-severity dependency advisories in `node-forge`, `http-cache-semantics`, and `braces`. The complete gate remains failed; dependency work is concurrent
on the selected release and must be reconciled rather than overwritten.

Release integration is pending because the selected `release/v4.0.0` checkout contains concurrent
staged, unstaged, and untracked work. Preserve that checkout and the Compose-fields worktree;
serialize the eventual merge in a clean, idle release worktree. Publication remains outside this
implementation authorization. Physical-device and release stability evidence must bind their
actual tested revision; historical records retain their original attribution and version.

See [native patterns](native-patterns.md), [device validation](native-device-validation.md),
[consumer qualification](native-consumer-validation.md), and [v4 readiness](lumen-4-readiness.md).
