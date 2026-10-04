# Native Stepper

The native `LumenStepper` adapters present Astro's ordered complete/current/upcoming progression.
Steps are display items; navigation, validation, persistence and routing remain host responsibilities.
The three no-prop `StepperParityExample` fragments provide separate host Back/Next/reset controls,
vertical/horizontal layouts, long English/Spanish titles and descriptions, and boundary demonstrations.
No step is made into a button merely to advance progress.

`currentStep` is zero-based. Zero marks the first step current; the step count or a later index marks
all steps complete. Negative indices display the first current step. React Native truncates finite
fractional indices and displays nonfinite indices as zero. SwiftUI and Compose accept integers.
Presentation normalization never writes back to host state. Empty steps produce an empty progression.

IDs must be nonblank and unique. Invalid lists render a localized `invalidText` instead of ambiguous
keyed steps. This optional property defaults to `Steps unavailable` on all adapters; the examples
show duplicate-ID rejection and recovery. Titles, descriptions, container label and `formatState`
are host-localized. IDs remain stable across localization changes.

Vertical items allow long text to wrap. Horizontal items keep a readable 220-unit width inside a
native scrolling container. The current item exposes selected/current semantics and every item
exposes its localized state. Numeric markers are decorative and excluded from accessible narration;
each item's title, description, position and state form one accessible element. React Native web
also exposes `aria-current="step"`. There are no interactive step targets; the host navigation uses
Lumen buttons and their accessible touch targets.

Verification passed:

- Four focused React Native tests covering states, controlled normalization, ID validation,
  localization, native/web semantics, decorative content, empty and horizontal/vertical layouts.
- Strict React Native package and playground type checks, zero-warning focused lint and the
  affected shared behavior suite: 123 React Native tests.
- Swift compilation, two focused model tests and the exact Swift 6 Apple example typecheck.
- Actual React Native web interactions at 390 and 1280 pixels in light and dark: Back/Next/reset,
  complete/past/negative/nonfinite values without host rewriting, duplicate-ID recovery, horizontal
  scrolling and Spanish labels. Accessible snapshots contain one named list item per step without
  decorative child text. No viewport overflow; all four screenshots were visually reviewed at
  `/private/tmp/lumen-native-parity-rendered/stepper-*-ready.png`.

- Two Compose model tests, exact Android playground fragment compilation, Android lint and two
  actual emulator UI tests: localized complete/current/upcoming and selected state, noninteractive
  semantics, host navigation, zero/end/negative normalization without rewriting host state,
  decorative marker exclusion, horizontal scrolling and invalid-ID recovery.

Apple/React Native phone interactions, VoiceOver/TalkBack narration and physical-device release
qualification require separate platform evidence.
