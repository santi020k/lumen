# Lumen 4 native quality

This record tracks the native improvements authorized for the v4 candidate. The implementation
branch is `feature/native-v4-quality`, originally based on release commit `d0e9eeb5` and reconciled with committed release revision `28659627`. Preserve concurrent v4
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

- React Native: 122 behavioral/unit tests passed, with strict type checking and zero-warning lint.
  The new Workspace example has six playground tests, including two workspace model tests for search and isolated record saves; its
  Expo web build passed. Desktop 1280×900 and mobile 390×844 interactions covered selection,
  editing, save feedback, and chart rendering, with temporary screenshots inspected.
- Swift: 52 LumenUI and three WidgetKit tests passed. The new native split-view workspace compiled
  in the macOS playground and the iPad simulator Xcode build passed; iPad simulator interactions verified search, record selection, initial edit focus, keyboard-visible Save, saved feedback, Spanish chart descriptions, and error/retry recovery. The flow was repeated against reconciled code revision `1d7acc749fbb80e720a70a2e982c7aa0f1dcb095`. At maximum accessibility text size, Spanish sheet actions stacked and Save remained reachable with the keyboard visible. A swipe-dismiss attempt left the protected sheet open. Typed notes persisted; long-note persistence remains unverified because the automation value setter changed the visible editor without updating the saved draft. Temporary screenshots were inspected and the original simulator text size was restored. API extraction succeeded on all five Apple
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
| Platform button baseline | 1,429,228 | 1,424,196 |
| Lumen root button | 5,879,803 | 5,874,152 |
| Lumen foundations button | 1,447,896 | 1,442,835 |
| Lumen static search graphic | 1,630,896 | 1,625,566 |
| Lumen root button with named search icon | 5,879,868 | 5,874,221 |

The optional `@santi020k/lumen-react-native/foundations` entrypoint reuses the root implementations
and provider context while avoiding eager imports of the full catalog. Foundation overhead remains
bounded at 65,536 bytes; the root fixture remains bounded at 6 MiB. The new
`@santi020k/lumen-react-native/graphics` entrypoint reuses icon rendering, accessibility, touch targets
and the provider context while accepting an application-owned graphic instead of a catalog name.
Static graphic overhead is bounded at 262,144 bytes, including the existing SVG renderer. The fixture
uses the exact generated search artwork. Both platforms passed every budget across three exports.
The benchmark rebuilds the dependency graph before exporting to avoid stale workspace measurements.
The clean packed consumer also type-checks the graphics import alongside root, datetime and foundations.

Run `pnpm run check:react-native-imports`; set `LUMEN_BENCHMARK_PLATFORM=ios` to measure iOS.
These results are local bytecode measurements, not startup or scrolling latency evidence. Static
per-icon catalog paths and broader component entrypoints remain to evaluate against actual consumers.

### Outstanding scope and blockers

The complete Required outcomes list remains authoritative. Broader phone/tablet runtime qualification and physical-device keyboard/focus and screen-reader checks,
startup/scrolling regression measurements, final real-consumer qualification and two ordinary
stability iterations remain pending. No hardware pass or soak iteration was recorded.

The first Android `./gradlew test lint assembleDebugAndroidTest` reached compilation and tests,
but lint remained active for over 30 minutes in `BidirectionalTextDetector` Kotlin PSI traversal.
That task-owned daemon was stopped. Fresh full lint runs now pass without suppressions, including after reconciling committed release icon changes.
The canonical `pnpm run validate` initially failed because its loopback fixture server was blocked by the sandbox.
After local-server access and snapshot regeneration, it reached `check:security` and failed on three
high-severity dependency advisories in `node-forge`, `http-cache-semantics`, and `braces`. The reconciled canonical gate passed all preceding checks and again stopped at `check:security`. The complete gate remains failed; committed release dependency updates were reconciled into this branch and the audit was rerun, but those three advisories remain.

Release integration is pending because the selected `release/v4.0.0` checkout contains concurrent
staged, unstaged, and untracked work. Preserve that checkout and the Compose-fields worktree;
serialize the eventual merge in a clean, idle release worktree. Publication remains outside this
implementation authorization. Physical-device and release stability evidence must bind their
actual tested revision; historical records retain their original attribution and version.

See [native patterns](native-patterns.md), [device validation](native-device-validation.md),
[consumer qualification](native-consumer-validation.md), and [v4 readiness](lumen-4-readiness.md).
