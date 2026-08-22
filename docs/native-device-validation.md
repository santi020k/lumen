# Native device validation

Native adapters remain Beta until their accessibility and interaction contracts have evidence from
representative physical devices. Unit tests and simulator builds protect API and semantic regressions,
but they do not prove screen-reader announcements, focus order, touch ergonomics, text scaling, or
reduced-motion behavior on hardware.

## Automated gates

Run the following before starting a manual device pass:

```bash
pnpm --filter @santi020k/lumen-react-native run build
pnpm --filter @santi020k/lumen-react-native run typecheck
pnpm --filter @santi020k/lumen-react-native run test
swift test
(cd packages/compose && ./gradlew test lint assembleDebugAndroidTest)
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
| React Native on iOS | Oldest supported iPhone and iOS | Current iPhone and iOS | VoiceOver, Larger Text, Reduce Motion, Increase Contrast | Pending |
| React Native on Android | API 23-class device | Current Android device | TalkBack, font size and display size, remove animations, high contrast | Pending |
| SwiftUI on iOS | iOS 16 device | Current iPhone and iOS | VoiceOver, Dynamic Type, Reduce Motion, Increase Contrast | Pending |
| SwiftUI on macOS | macOS 13 Mac | Current macOS Mac | VoiceOver, Full Keyboard Access, Reduce Motion, Increase Contrast | Partial hardware pass recorded below |
| Compose on Android | API 23-class device | Current Android device | TalkBack, font size and display size, remove animations, high contrast | Pending |

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
