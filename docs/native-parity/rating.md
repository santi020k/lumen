# Native Rating

Release requirements follow the [current native release policy](../native-release-runbook.md#current-release-policy).
The implementation verification below is historical evidence; physical-device and stability
completion statements do not define current launch gates.

The three existing native `LumenRating` controls implement Astro's whole-star rating behavior.
React Native and Compose use controlled values/change callbacks; SwiftUI uses a binding. Selecting
an option requests that value; the host owns state and any submission or persistence. Zero means
unrated, with no checked option. A host can clear the value back to zero, as all playground examples
do. The component does not invent a submission, review workflow or business score.

React Native resolves finite fractional inputs by truncating them and clamps values to `0...max`.
Nonfinite values display zero; a nonfinite maximum uses five. SwiftUI and Compose accept integer
values. All adapters bound the maximum to `1...100` and clamp negative/out-of-range values for
presentation without rewriting host state. Invalid maxima still produce a bounded, usable control.
These are whole-star controls; partial stars are not part of the reference contract.

The Rating audit preserved the existing SwiftUI/Compose controls and fixed two React Native gaps.
Radio options now expose explicit checked/disabled semantics, while retaining their selected state.
React Native web also reuses the internal radio keyboard hook shared with other selection controls:
Space selects; arrows wrap and move focus; Home/End choose the endpoints. Enter keeps the native
Pressable path. Prevented/repeated events and disabled/read-only options cannot change the rating.
Native adapters keep their platform activation behavior and accessible selected/checked choices.

`label` and `formatOption` localize accessible choices. Every star has at least a 44-unit target;
rows wrap on narrow containers, using a SwiftUI adaptive grid or native flow layout. Decorative
icons do not add competing control labels. Read-only and disabled states guard direct callbacks as
well as exposing disabled semantics. The three no-prop `RatingParityExample` fragments demonstrate
English/Spanish labels, zero/maximum actions, 1/5/10 maxima, invalid-input normalization and both
blocked states with actual controlled selection and a localized value summary.

Verification passed:

- Five new focused React Native Rating tests plus the affected component behavior suite: 124 tests.
- Strict React Native package and playground type checks and zero-warning focused lint.
- Swift compilation and three focused Rating tests, plus the exact Swift 6 playground fragment.
- Two Compose model tests, exact Android fragment compilation, Android lint and two actual emulator
  UI tests covering zero/maximum, invalid/extreme inputs, localization, wrapping, 44dp targets and
  disabled/read-only direct action guards.
- Actual React Native web interactions at 390 and 1280 pixels in light and dark themes: checked
  semantics, click/Space/Enter/arrows/Home/End with focus movement, zero/maximum, blocked actions,
  invalid-input recovery and localized ten-star selection. All four scenarios fit the viewport.
  Screenshots were visually reviewed at `/private/tmp/lumen-native-parity-rendered/rating-*-ready.png`.

Apple/React Native phone interactions, VoiceOver/TalkBack narration and physical-device release
qualification remain separate integration evidence. Browser/emulator checks do not replace those
platform gates.
