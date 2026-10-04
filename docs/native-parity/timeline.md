# Timeline native parity

Astro's Timeline is a compound chronological list. Hosts supply ordered item content and optional
decorative markers; the reference hides the final item's connector. Native adapters retain the same
composition boundary without adding date formatting, event data, sorting, status or network behavior.

## Public contract

`LumenTimeline` takes an accessible `label` and host children/content. `LumenTimelineItem` takes optional
`dot` content and the additive `isLast` boolean, defaulting to `false`, in React Native, SwiftUI and
Compose. Set `isLast` to `true` for the final visible item. Hosts own stable keys/IDs, ordering and
empty-state content. Reverse/filter updates must recompute which visible item is final.

React Native accepts `isLast?: boolean`; SwiftUI accepts `isLast: Bool = false` in both default-circle
and custom-dot initializers; Compose accepts `isLast: Boolean = false` before its trailing `content`.
Existing calls retain their previous connector behavior. To match Astro, add the final-item flag.
Compose calls that previously passed their third content argument positionally must use `content =`
or the usual trailing lambda. No automatic child traversal or item-data model is introduced.

Markers and connector rails are decorative and hidden from accessibility, including React Native
Web's accessibility tree. Put actionable content in the item body, not the marker. Host content and
its accessible controls remain exposed. Default native markers remain token-colored filled circles;
Astro's default outlined marker is a visual convention rather than a native DOM imitation.

The examples use public Lumen text/buttons and synthetic event IDs, long multiline Unicode content,
English/Spanish, custom markers, reverse order, empty/restore and disabled content actions. Buttons
meet the 44-point target convention. Item bodies wrap within the available width. Arbitrary host
content remains responsible for its own disabled/read-only/error semantics. Swift's implementation
and example support iOS, macOS and visionOS; no watchOS/tvOS timeline implementation is claimed.

## Verification

Two React Native component tests verify the actual connector count, default/final behavior, arbitrary
custom marker/content preservation, action callbacks, host ordering, empty composition and hidden
marker subtree. Owned zero-warning lint and package type checking pass. Parent's refreshed public
build and full 350-test RN suite pass. Both actual Swift playground platform fragments typecheck with
warnings as errors; two focused Swift tests pass, including rendered light/dark pixel comparisons.

The unchanged actual Compose playground fragment compiles in a temporary instrumentation source set.
`compileDebugAndroidTestKotlin`, `assembleDebugAndroidTest` and `lintDebug` pass. Two actual emulator
UI tests pass in 3.407 seconds: light/dark rendered connector pixels prove the terminal rail disappears,
and accessible content actions remain operable while disabled controls and decorative markers obey
their semantics. Evidence is `/private/tmp/lumen-timeline-interaction.log`; Swift evidence is
`/private/tmp/lumen-timeline-swift.log`.

Full native catalog screenshots, physical-device qualification and release integration remain the
parent's broader validation boundary. Simulator/emulator evidence does not qualify physical devices.

RN Web interaction checks pass at 390 and 1280 pixels in light/dark: exact host order and reversal,
connector count `[1, 1, 0]`, content action callback, disabled actions, hidden custom markers in the
accessibility tree, empty/restore, Spanish labels and full multiline Unicode content, with no page
overflow or runtime errors. Twelve screenshots and `results.json` are retained in
`/private/tmp/lumen-timeline-rendered`; narrow light/default and dark/custom reversed captures were
visually inspected. They show readable wrapped content and no connector on the terminal item.
