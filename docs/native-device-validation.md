# Native device validation

Native adapters remain Beta until their accessibility and interaction contracts have evidence from
representative physical devices. Unit tests and simulator builds protect API and semantic regressions,
but they do not prove screen-reader announcements, focus order, touch ergonomics, text scaling, or
reduced-motion behavior on hardware.

The machine-readable source of truth is `registry/native-device-evidence.json`. Every partial or
complete pass records the actual device model, exact OS version, date, tester, and revision. A
complete pass additionally requires a full 40-character revision and an immutable HTTPS issue,
pull request, or recording URL; local notes alone cannot satisfy release readiness. Run
`pnpm run check:native-device-evidence` to validate its structure. Release readiness additionally
requires `pnpm run check:native-device-readiness`, which fails until both minimum and current passes
are complete for every adapter and platform.

Each adapter also records its exact minimum operating system. The validator freezes these values to
the package support declarations: React Native 0.86.2 uses iOS 15.1 and Android API 24, SwiftUI uses
iOS 16, macOS 13, and watchOS 9, Compose uses Android API 23, and Wear uses API 30. A Partial result
must list the checks or evidence that still block completion.

## Automated gates

Run the following before starting a manual device pass:

```bash
pnpm --filter @santi020k/lumen-react-native run build
pnpm --filter @santi020k/lumen-react-native run typecheck
pnpm --filter @santi020k/lumen-react-native run test
swift test
pnpm run check:swift-api-baseline
(cd packages/compose && ./gradlew test lint apiCheck assembleDebugAndroidTest)
(cd packages/compose && ./gradlew :wear:testDebugUnitTest :wear:lintDebug)
```

The Compose instrumentation suite verifies actionable semantics, selected state, polite toast live
regions, gauge labels, values, and ranges, and runs Android's Accessibility Test Framework against a
representative component surface. With an Android device or emulator attached, execute it with
`./gradlew connectedDebugAndroidTest` from `packages/compose`. The Apple and React Native playgrounds
provide the host applications for manual VoiceOver checks.

The native Android CI job also boots an API 35 emulator and executes this suite whenever native
packages, generated tokens, or either native workflow changes.

## Required hardware matrix

Record the device, exact OS version, date, tester, and an issue or recording link for every pass.
Do not replace a physical-device result with a simulator or emulator result.

| Adapter | Minimum pass | Current pass | Assistive technology | Evidence |
| --- | --- | --- | --- | --- |
| React Native on iOS | iOS 15.1 physical iPhone | Current iPhone and iOS | VoiceOver, Larger Text, Reduce Motion, Increase Contrast | Pending |
| React Native on Android | Android API 24 physical device | Current Android device | TalkBack, font size and display size, remove animations, high contrast | Pending |
| SwiftUI on iOS | iOS 16 device | Current iPhone and iOS | VoiceOver, Dynamic Type, Reduce Motion, Increase Contrast | Pending |
| SwiftUI on macOS | macOS 13 Mac | Current macOS Mac | VoiceOver, Full Keyboard Access, Reduce Motion, Increase Contrast | Partial hardware pass recorded below |
| SwiftUI on watchOS | watchOS 9 Apple Watch | Current Apple Watch and watchOS | VoiceOver, Larger Text, Reduce Motion, Increase Contrast, Always On | Pending |
| Compose on Android | Android API 23 physical device | Current Android device | TalkBack, font size and display size, remove animations, high contrast | Pending |
| Compose on Wear OS | Wear OS API 30 physical watch | Current Wear OS watch | TalkBack, font scaling, remove animations, round-screen clipping, rotary input | Pending |

## Component pass

For every adapter in the matrix:

1. Navigate the playground using only the screen reader and then only a hardware keyboard or switch
   input where the platform supports it.
2. Confirm every control has one concise name, the correct role, current state or value, and a clear
   disabled or loading announcement.
3. Exercise TextField, Textarea, Checkbox, RadioGroup, SegmentedControl, Picker or equivalent native
   selection, Slider, Disclosure, Chip removal, Toast dismissal, and destructive actions.
4. Confirm newly inserted alerts and toasts announce once without stealing focus.
5. Increase text to the largest supported size and confirm labels remain readable without clipping,
   overlap, or unreachable actions.
6. Enable reduced motion and increased contrast, then confirm meaning is not conveyed by animation or
   color alone.
7. Rotate mobile devices and test compact and regular layouts without losing focus or state.

File failures as reproducible issues before marking a matrix cell complete. A result is complete only
when the evidence link identifies the tested commit and all blocking findings are resolved.

## Local hardware observations

### SwiftUI on macOS

- **Device:** MacBook Pro (Mac17,9, Apple M5 Pro)
- **OS:** macOS 27.0 (26A5416b)
- **Date:** 2026-08-21
- **Revision:** `128c97a` with the documented native-component working-tree changes
- **Tester:** Codex automated accessibility inspection on the physical host Mac
- **Result:** Partial pass

The Apple playground exposed concise names, roles, selected and disabled states, values, and ranges
through the macOS accessibility tree. With Full Keyboard Access enabled, Tab followed the visible
control order from search through buttons, form controls, selection controls, and the slider, then
returned to the theme button. Control-Tab exited the multiline Textarea as documented by macOS, and
Space toggled the selected Chip state. VoiceOver was enabled for the inspection and restored to its
original off state afterward; the playground remained fully represented in the accessibility tree.
Full Keyboard Access was also restored to its original off state.

This does not complete the macOS matrix cell. A human-assisted auditory VoiceOver pass plus Reduce
Motion, Increase Contrast, and the macOS 13 minimum-version pass remain required. The inspection did
not substitute automated accessibility-tree output for a human judgment of spoken announcements.
