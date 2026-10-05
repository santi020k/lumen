# Native rating, steps and timeline recipes

The current v4 release branch already provides `LumenRating`, `LumenStepper`, `LumenTimeline` and
`LumenTimelineItem` in React Native, SwiftUI and Compose. Use these public components and the
complete controlled examples below. Do not recreate their selection, normalization or layout
with another radio group, progress bar or timeline rail.

## Copyable controlled examples

Each example is a self-contained playground fragment with synthetic data. Keep the matching Lumen
provider/theme at the consumer boundary. Copy only the host composition needed by your app;
localization, accepted state changes, ordering and persistence remain application-owned.

| Recipe | React Native | SwiftUI | Compose |
| --- | --- | --- | --- |
| Rating with clear and blocked states | [Rating example](../apps/playground-react-native/src/RatingParityExample.tsx) | [Rating example](../apps/playground-apple/Sources/LumenApplePlayground/RatingParityExample.swift) | [Rating example](../apps/playground-android/app/src/main/kotlin/com/santi020k/lumen/playground/compose/RatingParityExample.kt) |
| Step progression with host navigation | [Stepper example](../apps/playground-react-native/src/StepperParityExample.tsx) | [Stepper example](../apps/playground-apple/Sources/LumenApplePlayground/StepperParityExample.swift) | [Stepper example](../apps/playground-android/app/src/main/kotlin/com/santi020k/lumen/playground/compose/StepperParityExample.kt) |
| Timeline with reverse/empty states | [Timeline example](../apps/playground-react-native/src/TimelineParityExample.tsx) | [Timeline example](../apps/playground-apple/Sources/LumenApplePlayground/TimelineParityExample.swift) | [Timeline example](../apps/playground-android/app/src/main/kotlin/com/santi020k/lumen/playground/compose/TimelineParityExample.kt) |

## Rating

Zero means unrated; the host can provide an explicit clear action. Choices are whole numbers and
`max` is bounded from one through 100. Presentation normalization never writes back to host state.
Localize the group `label` and `formatOption`, including the maximum in each accessible choice.
Disabled/read-only modes reject direct actions as well as exposing their blocked state. Retain the
public control's wrapping layout, selected/checked semantics and native touch targets.

Use a named Lumen Button for clearing, and disable that action under the same blocked policy as
the rating. A controlled callback is an intent: applications can reject it until their own business
validation passes. Do not silently store a clamped presentation value as the user's review.
See the [exact Rating contract](native-parity/rating.md).

## Steps

`currentStep` is zero-based; an index at the step count shows all steps complete. Supply stable
unique nonblank IDs, localized titles/descriptions, `formatState` and `invalidText`. The host owns
workflow validation and transitions. Steps are informational; use separate named Lumen buttons for
Back/Next/reset rather than turning the step labels into unexpected navigation actions.

Vertical steps wrap long content; horizontal steps use native scrolling. Empty lists produce no
progression; invalid IDs show the supplied localized error. Preserve selected/current semantics
and keep decorative markers out of accessible narration. See the
[exact Stepper contract](native-parity/stepper.md).

## Timeline

The host supplies keyed item content and order. Set `isLast` on the last *visible* item so its
connector ends correctly after reverse/filter updates. Applications own date formatting, timezone
policy, missing dates and chronological direction. Put actionable controls in the item body and
keep markers decorative. Use an explicit empty state when no events remain.

For large histories, choose the platform lazy-list container and an appropriate product composition;
do not assume this small-content compound component renders only visible children. See the
[exact Timeline contract](native-parity/timeline.md).

## Verification boundaries

The linked examples and existing parity tests cover controlled state, disabled/read-only rating,
zero/maximum, invalid IDs, long English/Spanish content, step transitions, timeline reversal and
empty recovery. Re-run affected checks on the chosen candidate. Compiler/model and browser,
simulator or emulator evidence are distinct from physical-device and production evidence.
The [current release policy](native-release-runbook.md#current-release-policy) governs release
requirements; historical qualification statements in older parity records do not add launch gates.
