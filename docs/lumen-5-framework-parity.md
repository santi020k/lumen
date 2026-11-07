# Lumen 5 framework parity

This audit compares the React, Elements, React Native, SwiftUI and Compose adapters with the
Astro reference on `release/v5.0.0`. Parity means shared appearance and interaction contracts
where they apply; native adapters retain platform controls and application-owned state.

## Release coverage

| Improvement | React and Elements | React Native, SwiftUI and Compose |
| --- | --- | --- |
| Default light/dark palette and chart colors | Shared generated foundation and component CSS | Generated from the same canonical token document |
| Paper, Field and santi020k themes | Optional theme CSS, nearest scheme boundaries and explicit local schemes | Named theme definitions, inherited or pinned schemes, native title/radius/action treatments |
| Scoped appearance | Public theme attributes; dialogs and controls remain usable across changes | Provider/environment scopes; local sheets retain their scheme and application drafts |
| Smaller consumer imports | Foundation plus component CSS, selective React entries and per-component Elements registrations | Existing focused native modules and React Native entries; no DOM runtime or CSS required |
| Editorial Code, Prose and sticky first table columns | Matching public component options and shared styles | Web document presentation; native text, tables and host compositions retain their own contracts |
| Code copy recovery and anchor focus handoff | Manual selection/retry recovery and shared local-anchor focus behavior, with adapter unit regressions | Browser clipboard denial and DOM anchor destinations are web contracts, not native APIs |
| SkipLink viewport reflow | The shared generated stylesheet keeps the shortcut within the reading viewport | Native accessibility navigation retains platform focus conventions |
| Media borders and clipping | Shared generated CSS lets the enclosing frame own the border and clipping | Native media layout retains platform-specific contracts; CSS border ownership does not apply |
| Reveal visibility and reduced motion | Shared controller handles unreachable thresholds, keyboard focus and reduced motion | Native motion and accessibility conventions; no viewport observer contract |
| Timeline, ThemeToggle and WorldMap styling parts | Matching public parts and shared styling | Native Timeline and application-owned theme preferences use platform APIs; native WorldMap is still a catalog gap |
| Editable recipes | React and Elements editorial recipes have dedicated consumer checks; some recipes remain Astro-specific | Applications own native screen composition, navigation and persistence |

The initial v5 release deliberately uses independent adapter versions: React and Elements target
5.0.0, React Native and Compose target 4.1.0, and Swift resolves the repository's 5.0.0 tag.
Use the [release manifest](../registry/release-manifest.json), not the umbrella version, to pin a
consumer. These targets do not establish publication or store availability.

## Regression coverage

The framework conformance suite includes real React and registered Elements hosts at 390 and
1440 pixels. It switches Paper and Field between inherited dark and explicitly pinned light/dark
schemes under a santi020k dark parent. It checks retained progress state, keyboard dialog opening,
dialog theme inheritance, Escape dismissal, focus restoration and horizontal overflow.
Opening assertions require both the open state and focus inside the dialog: CSS visibility alone
can precede the custom button's deferred keyboard activation during an overlay transition.

Both framework browser scripts run `prepare:frameworks` through the repository's cached build graph
with two concurrent tasks before Playwright starts its server. Compilation no longer consumes the
server's four-minute startup budget, following the accessibility suite's preparation pattern. The
previous implicit one-minute limit could terminate compilation before any browser assertion ran.
Interaction timeouts and assertions remain unchanged.

Native appearance checks cover named palettes, semantic foregrounds, nested scopes and retained
drafts. React Native's browser preview is useful for layout and keyboard checks; it is separate
from an iOS or Android React Native application run.

## Verification scope

The local audit uses Node 24.21.0 and pnpm 12.8.1. Completed checks include:

| Check | Result |
| --- | --- |
| `pnpm exec vitest run --project react --project elements --project react-native --maxWorkers=2` | 1,457 tests passed across 159 files |
| `pnpm run test:framework-conformance` | 380 tests passed in desktop/mobile Chromium and WebKit, including 32 scoped-appearance cases |
| `pnpm run test:framework-visual` | Both React and Elements visual baselines passed unchanged |
| React Native playground `test:appearance:web` | Six themes in light/dark at 320, 390 and 1440 pixels passed; checked retained drafts and the pinned Harbor sheet |
| `swift test` | 152 tests passed, including rendered macOS appearance and accessibility layouts |
| Apple playground `AdvancedInputTests/testPinnedHarborSheetRetainsDraftWhenAppAppearanceChanges` | Passed on iPhone 17 Pro / iOS 27.0 Simulator; verified the pinned Harbor scheme, retained draft and keyboard focus after dismissal |
| Compose `./gradlew test lint apiCheck assembleDebugAndroidTest verifyMavenPublication --no-daemon --max-workers=1 --warning-mode=all` | 150 phone and three Wear unit tests passed; both artifacts passed lint, API comparison, test-APK builds and local publication verification |
| Compose `./gradlew :connectedDebugAndroidTest --no-daemon --max-workers=1` | All 104 phone instrumentation tests passed on a dedicated API 35 emulator, including accessibility and scoped-theme rendering |

Android lint exposed an outdated Gradle wrapper. The audit updates it to the checksum-verified
stable 9.9.0 release and regenerates the wrapper JAR. Android API baselines are unchanged. The
[dependency notes](lumen-5-dependencies.md#android-tooling) record the upstream validator deprecation
that remains visible in Gradle's warning output.

The browser checks used isolated local ports. React Native appearance checks ran against the built
web playground. Firefox, a fresh React Native iOS/Android app run, and physical-device checks are
outside this local evidence.

The existing [native device validation matrix](native-device-validation.md) remains authoritative
for physical-device VoiceOver, TalkBack, hardware input and minimum-OS coverage. A simulator,
emulator or browser preview does not complete those cells. React Native rich-text editing remains
the explicitly deferred dependency decision described in the
[native catalog parity plan](native-catalog-parity-plan.md). Native WorldMap rendering also remains
unimplemented, as recorded in the [web/native audit](lumen-4-web-native-audit.md). Neither older gap
is a missing port of a new v5 feature; neither is claimed as complete catalog equivalence.
